const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const content=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/course-content-20261009.json'),'utf8'));
const {maintenanceInstruction,policy,buildMapping,addSubtitleClaim}=require('../data/video-action-mapping-v1.cjs');
const map=buildMapping(content),cards=content.sourceCards;

assert.equal(maintenanceInstruction,'收到健身视频后，自动提取字幕，按视频→动作→要点更新健身页并保留时间跳转；明显错字结合上下文纠正，拿不准的留待确认。');
assert.equal(policy.claimVerification,'subtitle_verified');
assert.equal(policy.prohibitedVerification,'audio_verified');
assert.equal(map.segments.length,cards.length);assert.equal(map.actions.length,cards.length);assert.equal(map.variants.length,cards.length);assert.equal(map.claims.length,0);
assert.equal(new Set(map.videos.map(x=>x.bv)).size,7);
for(const card of cards){
  const segment=map.segments.find(x=>x.id===`segment:${card.id}`),action=map.actions.find(x=>x.id===`course:${card.id}`),variant=map.variants.find(x=>x.id===`variant:${card.id}`);
  assert.deepEqual(segment,{id:`segment:${card.id}`,videoId:`bv:${card.bv}`,startSeconds:+card.t,actionId:`course:${card.id}`,variantId:`variant:${card.id}`,origin:'legacy_timestamp'});
  assert.equal(action.existingIds.courseCardId,card.id);assert.equal(variant.actionId,action.id);
}
const day2=map.segments.filter(x=>x.videoId==='bv:BV1v5opBhEDc');assert.equal(day2.length,11);
const valid=addSubtitleClaim(map,{id:'claim:test',segmentId:day2[0].id,actionId:day2[0].actionId,kind:'cue',publicSummary:'保留动作路径。',verification:'subtitle_verified'});assert.equal(valid.verification,'subtitle_verified');
assert.throws(()=>addSubtitleClaim(map,{...valid,verification:'audio_verified'}),/subtitle_verified/);
assert.throws(()=>addSubtitleClaim(map,{...valid,segmentId:'segment:unknown'}),/segment/);
console.log(JSON.stringify({passed:true,videos:map.videos.length,segments:map.segments.length,day2Segments:day2.length,claims:'subtitle_verified only'},null,2));
