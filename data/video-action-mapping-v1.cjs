'use strict';

const maintenanceInstruction='收到健身视频后，自动提取字幕，按视频→动作→要点更新健身页并保留时间跳转；明显错字结合上下文纠正，拿不准的留待确认。';

const policy=Object.freeze({
  maintenanceInstruction,
  claimVerification:'subtitle_verified',
  publicOutput:'只发布简短教学归纳，不发布完整字幕。'
});

function requireCards(content){
  if(!content||!Array.isArray(content.sourceCards))throw Error('course content must provide sourceCards');
  return content.sourceCards;
}

function buildMapping(content){
  const cards=requireCards(content),videos=new Map(),actions=[],variants=[],segments=[];
  for(const card of cards){
    if(typeof card.id!=='string'||typeof card.n!=='string'||typeof card.bv!=='string'||!Number.isFinite(+card.t))throw Error(`invalid course card: ${card?.id||'unknown'}`);
    const videoId=`bv:${card.bv}`,actionId=`course:${card.id}`,variantId=`variant:${card.id}`;
    if(!videos.has(videoId))videos.set(videoId,{id:videoId,bv:card.bv,origin:'course-content-20261009.json'});
    // A legacy card names one source segment, not a canonical exercise identity.
    // Later subtitle imports may merge several of these into one action while retaining variants.
    actions.push({id:actionId,name:card.n,identityStatus:'source_bound_not_canonical',existingIds:{courseCardId:card.id}});
    variants.push({id:variantId,actionId,name:card.n,existingIds:{courseCardId:card.id}});
    segments.push({id:`segment:${card.id}`,videoId,startSeconds:+card.t,actionId,variantId,origin:'legacy_timestamp'});
  }
  return {schemaVersion:1,policy,videos:[...videos.values()],segments,actions,variants,claims:[],conflicts:[]};
}

function addSubtitleClaim(mapping,claim){
  if(!mapping?.segments?.some(x=>x.id===claim.segmentId))throw Error('claim must cite an existing segment');
  if(!mapping.actions.some(x=>x.id===claim.actionId))throw Error('claim must cite an existing action');
  if(claim.verification!==policy.claimVerification)throw Error('new claims must be subtitle_verified');
  if(!['cue','setup','dose','safety','technique'].includes(claim.kind))throw Error('unsupported claim kind');
  if(typeof claim.publicSummary!=='string'||!claim.publicSummary.trim())throw Error('claim needs a concise public summary');
  return {...claim,publicSummary:claim.publicSummary.trim()};
}

module.exports={maintenanceInstruction,policy,buildMapping,addSubtitleClaim};
