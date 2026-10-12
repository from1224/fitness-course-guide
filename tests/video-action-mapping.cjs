const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const content=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/course-content-20261009.json'),'utf8'));
const {maintenanceInstruction,policy,buildMapping,addSubtitleClaim}=require('../data/video-action-mapping-v1.cjs');
const map=buildMapping(content),cards=content.sourceCards;
const subtitle=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/subtitle-video-evidence-20261012.json'),'utf8'));

assert.equal(maintenanceInstruction,'收到健身视频后，自动提取字幕，按视频→动作→要点更新健身页并保留时间跳转；明显错字结合上下文纠正，拿不准的留待确认。');
assert.equal(policy.claimVerification,'subtitle_verified');
assert.equal(map.segments.length,cards.length);assert.equal(map.actions.length,cards.length);assert.equal(map.variants.length,cards.length);assert.equal(map.claims.length,0);
assert.equal(new Set(map.videos.map(x=>x.bv)).size,7);
for(const card of cards){
  const segment=map.segments.find(x=>x.id===`segment:${card.id}`),action=map.actions.find(x=>x.id===`course:${card.id}`),variant=map.variants.find(x=>x.id===`variant:${card.id}`);
  assert.deepEqual(segment,{id:`segment:${card.id}`,videoId:`bv:${card.bv}`,startSeconds:+card.t,actionId:`course:${card.id}`,variantId:`variant:${card.id}`,origin:'legacy_timestamp'});
  assert.equal(action.existingIds.courseCardId,card.id);assert.equal(action.identityStatus,'source_bound_not_canonical');assert.equal(variant.actionId,action.id);
}
const day2=map.segments.filter(x=>x.videoId==='bv:BV1v5opBhEDc');assert.equal(day2.length,11);
const valid=addSubtitleClaim(map,{id:'claim:test',segmentId:day2[0].id,actionId:day2[0].actionId,kind:'cue',publicSummary:'保留动作路径。',verification:'subtitle_verified'});assert.equal(valid.verification,'subtitle_verified');
assert.throws(()=>addSubtitleClaim(map,{...valid,verification:'audio_verified'}),/subtitle_verified/);
assert.throws(()=>addSubtitleClaim(map,{...valid,segmentId:'segment:unknown'}),/segment/);
assert.deepEqual(subtitle.videos.map(x=>x.bv),['BV1ofdnBZEi3','BV18Jj66zEpV']);assert.ok(subtitle.videos.every(x=>x.verification==='subtitle_verified'));assert.equal(subtitle.segments.length,17);assert.ok(subtitle.claims.length>=47);
for(const segment of subtitle.segments){assert.ok(subtitle.actions.some(x=>x.id===segment.actionId));assert.ok(segment.endSeconds>segment.startSeconds)}
for(const claim of subtitle.claims){assert.equal(claim.verification,'subtitle_verified');assert.ok(subtitle.segments.some(x=>x.id===claim.segmentId));assert.ok(claim.sourceSpans.every(([start,end])=>end>start));assert.ok(claim.publicSummary.length<120)}
assert.ok(subtitle.claims.some(x=>x.kind==='superset'&&x.segmentId==='segment:BV18Jj66zEpV:cable-hammer-curl'));
for(const segment of subtitle.segments.filter(x=>x.videoId==='bv:BV1ofdnBZEi3')){const claims=subtitle.claims.filter(x=>x.segmentId===segment.id);assert.ok(claims.some(x=>x.kind==='cue'),`missing back cue ${segment.id}`);assert.ok(claims.length>=2,`missing back detail ${segment.id}`)}
assert.deepEqual(subtitle.segments.find(x=>x.id==='segment:BV1ofdnBZEi3:worlds-greatest-stretch').startSeconds,4805);
assert.deepEqual(subtitle.segments.find(x=>x.id==='segment:BV1ofdnBZEi3:thoracic-extension').startSeconds,4942);
console.log(JSON.stringify({passed:true,videos:map.videos.length,segments:map.segments.length,day2Segments:day2.length,subtitleVideo:{videos:subtitle.videos.length,segments:subtitle.segments.length,claims:subtitle.claims.length},claims:'subtitle_verified only'},null,2));
