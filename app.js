const app=document.querySelector('#app');
const dataVersion='20261012-mapping-corrections';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode=v=>{try{return decodeURIComponent(v)}catch{return v}};
const videoIds={BV1CSoKBaEgK:'116435959420113',BV1cdL96bEMF:'116765715601071',BV19AxrzQEEH:'115341850057826',BV1v5opBhEDc:'116447049226152',BV1tcraBTEqg:'115880667124445',BV17aovBqEdg:'116471191574369',BV1qF6wBaEWu:'115978847392380'};
const video=(bv,t=0)=>`bilibili://video/${videoIds[bv]||bv}?page=0&start_progress=${Math.max(0,Math.round(+t*1000))}`;
const safe=u=>/^(https:|bilibili:|snssdk1128:|assets\/)/.test(u||'')?u:'#';
const courses=[['chest-back','胸背两分化','推与拉交替，按当天器械替换。',[['barbell-bench-press','水平推',8,12,150],['narrow-seated-row','水平拉',8,12,120],['incline-dumbbell-chest-press','上斜推',8,12,120],['angled-handle-lat-pulldown','垂直拉',8,12,120]]],['glute-leg','臀腿两分化','膝主导、髋铰链、髋伸、屈膝四个槽位。',[['squat-pattern','蹲',8,12,150],['romanian-deadlift','髋铰链',8,12,150],['standing-cable-hip-extension','后踢腿髋伸',10,15,90],['prone-leg-curl','腿弯举屈膝',10,15,90]]]].map(([id,name,intro,steps])=>({id,name,intro,steps:steps.map(([ref,slot,min,max,rest])=>({ref,slot,min,max,rest}))}));
let refs=[],cards=[],details=new Map(),full=new Map(),overlay=new Map(),labels={},tonight=null,evidence=null,ui={q:'',filter:'全部'};
const stateKey='chenglan-route-state-v1',trainKey='chenglan-training-v3';
function readStored(key){try{const x=JSON.parse(localStorage.getItem(key)||'null');return x&&typeof x==='object'&&!Array.isArray(x)?x:null}catch{return null}}
function normalizeTraining(value){
  const plain=x=>x&&typeof x==='object'&&!Array.isArray(x),out={choices:{},sessions:{}};
  if(!plain(value))return out;
  if(plain(value.choices))for(const [k,v] of Object.entries(value.choices))if(typeof v==='string'&&v)out.choices[k]=v;
  if(plain(value.sessions))for(const [key,input] of Object.entries(value.sessions)){
    if(!plain(input))continue;
    const s={done:{},restSeconds:{},rest:null};
    if(plain(input.done))for(const [i,n] of Object.entries(input.done))if(/^[0-3]$/.test(i)&&Number.isInteger(+n)&&+n>=0&&+n<=2)s.done[i]=+n;
    if(plain(input.restSeconds))for(const [i,n] of Object.entries(input.restSeconds))if(/^[0-3]$/.test(i)&&[90,120,150,180].includes(+n))s.restSeconds[i]=+n;
    const r=input.rest;
    if(plain(r)&&Number.isInteger(+r.i)&&+r.i>=0&&+r.i<4){
      if(r.paused&&Number.isFinite(+r.left)&&+r.left>=0)s.rest={...r,i:+r.i,left:+r.left,paused:true};
      else if(!r.paused&&Number.isFinite(+r.deadline)&&+r.deadline>=0)s.rest={...r,i:+r.i,deadline:+r.deadline,paused:false};
    }
    out.sessions[key]=s;
  }
  return out;
}
function mergeTraining(current,legacy){
  const a=normalizeTraining(legacy),b=normalizeTraining(current);
  return {choices:{...a.choices,...b.choices},sessions:{...a.sessions,...b.sessions}};
}
const currentTraining=readStored(trainKey),legacyTraining=readStored('training-course-state-v2');
let train=mergeTraining(currentTraining,legacyTraining);
try{if(currentTraining||legacyTraining)localStorage.setItem(trainKey,JSON.stringify(train))}catch{}
const saveTrain=()=>{try{localStorage.setItem(trainKey,JSON.stringify(train))}catch{}};
function routeState(){try{return JSON.parse(sessionStorage.getItem(stateKey)||'{}')}catch{return {}}}
function detailState(){
  if(!app?.querySelectorAll)return {};
  const out={},seen={};
  for(const node of app.querySelectorAll('details')){
    const scope=node.closest?.('[data-detail-scope]')?.dataset.detailScope||location.hash||'#courses';
    const title=(node.querySelector('summary')?.textContent||'补充').trim();
    const base=`${scope}\u0000${title}`,n=seen[base]||0;seen[base]=n+1;
    if(node.open)out[`${base}\u0000${n}`]=true;
  }
  return out;
}
function restoreDetails(open){
  if(!open||!app?.querySelectorAll)return;
  const seen={};
  for(const node of app.querySelectorAll('details')){
    const scope=node.closest?.('[data-detail-scope]')?.dataset.detailScope||location.hash||'#courses';
    const title=(node.querySelector('summary')?.textContent||'补充').trim();
    const base=`${scope}\u0000${title}`,n=seen[base]||0;seen[base]=n+1;
    node.open=!!open[`${base}\u0000${n}`];
  }
}
function savePlace(){
  const key=location.hash||'#courses',all=routeState(),place={q:ui.q,filter:ui.filter,scrollY:Math.max(0,scrollY||0),details:detailState()};
  all[key]=place;try{sessionStorage.setItem(stateKey,JSON.stringify(all))}catch{}
  history.replaceState({...history.state,routeUI:place},'');
}
function restorePlace(h=location.hash||'#courses'){
  const saved=history.state?.routeUI||routeState()[h];
  ui={q:typeof saved?.q==='string'?saved.q:'',filter:typeof saved?.filter==='string'?saved.filter:'全部'};
  return saved;
}
function href(route){return `#${route}`}
function shell(body,active='courses'){
  return `<div class="shell"><aside class="side"><div class="brand">澄蓝训练<span>把课程带进每一次训练</span></div><nav class="nav"><a class="${active==='courses'?'on':''}" href="#courses">训练课程</a><a class="${active==='tonight'?'on':''}" href="#tonight">今晚清单</a><a class="${active==='library'?'on':''}" href="#library">查动作</a><a href="./training-tools.html">训练工具</a></nav></aside><section>${body}</section></div>`;
}
function course(id){return courses.find(x=>x.id===id)}function step(c,i){return course(c)?.steps[+i]}
function ref(id){return refs.find(x=>x.id===id)}
function preferredSource(x){
  if(['supported-one-arm-cable-row','pull-up'].includes(x?.id)){
    const preferred=x.supplements?.[0]?.sources?.find(s=>/^bilibili:/.test(s.url||''));
    if(preferred)return preferred;
  }
  return x?.primarySources?.find(s=>safe(s.url)!=='#');
}
function atoms(s){let x=[ref(s.ref)],a={"barbell-bench-press":"seated-machine-chest-press","narrow-seated-row":"supported-one-arm-cable-row","incline-dumbbell-chest-press":"incline-machine-press","angled-handle-lat-pulldown":"pull-up"}[s.ref];if(a)x.push(ref(a));let courseAtoms={"squat-pattern":['BV17aovBqEdg:goblet_squat','BV17aovBqEdg:goblet_squat_box_touch'],"romanian-deadlift":['BV17aovBqEdg:barbell_romanian_deadlift','BV1qF6wBaEWu__barbell_romanian_deadlift']}[s.ref]||[];courseAtoms.forEach(id=>{let c=cards.find(v=>v.id===id);if(c)x.push({id:c.id,name:c.n,card:c})});return x.filter(Boolean)}
function session(c){return train.sessions[c]||(train.sessions[c]={done:{},restSeconds:{},rest:null})}
function choice(c,i){const s=step(c,i);if(!s)return null;const a=atoms(s);return a.find(x=>x.id===train.choices[`${c}/${i}`])||a[0]}
function sourcePublicLink(s){return s?.url||`https://www.bilibili.com/video/${s?.bv}/?t=${Math.floor(s?.t||0)}`}
function inlineTeaching(id,card){
  const x=ref(id),o=card&&overlay.get(card.id),cue=o?.cue||x?.main?.cues?.[0]?.answer||x?.trainingDetails?.cues?.[0]?.answer||'';
  const notes=o?[...(o.setup||[]),...(o.execute||[]),...(o.mistakes||[]).map(v=>v.adjustment)].slice(0,3):[...(x?.main?.paragraphs||[]),...(x?.trainingDetails?.paragraphs||[])].slice(0,3);
  return {cue,notes};
}
function inlineVideoLinks(sources){return (sources||[]).map(s=>`<a class="secondary" href="${esc(sourcePublicLink(s))}">视频 · ${esc(s.topic||s.label||s.timeText||'原片')}${s.bv?` · ${Math.floor(s.t/60)}:${String(Math.floor(s.t%60)).padStart(2,'0')}`:''}</a>`).join('')}
function courseHome(){return shell(`<header class="hero"><div class="accent">训练主入口</div><h1>今天练什么，按步骤完成。</h1><p>从一节课程开始。动作教学、示意图和原片链接只在需要它们的地方出现。</p></header><div class="grid">${courses.map(c=>`<article class="card"><h2>${esc(c.name)}</h2><p>${esc(c.intro)}</p><p class="muted">4 个动作槽位 · 可替换 · 进度与休息计时会保存</p><div class="actions"><a class="primary" href="${href(`course/${c.id}/0`)}">开始训练</a></div></article>`).join('')}</div><section class="tools"><h2>今晚想练胸和腿后侧？</h2><p class="muted">已整理为可跳过、可换动作的来源清单。</p><a class="secondary" href="#tonight">打开今晚清单</a></section>`)}
function renderCourse(c,i){
  const s=step(c,i),a=s&&choice(c,i);if(!s||!a)return missing('课程步骤不存在','courses');
  const state=session(c),done=Math.min(2,Math.max(0,+state.done[i]||0)),rest=state.rest?.i===+i?state.rest:null,remain=rest?(rest.paused?rest.left:Math.max(0,rest.deadline-Date.now())):0,seconds=state.restSeconds[i]||s.rest;
  const teach=inlineTeaching(a.id,a.card),sources=a.card?[{bv:a.card.bv,t:a.card.t,topic:'本课程动作片段'}]:[preferredSource(a)].filter(Boolean);
  return shell(`<a class="back" href="#courses">返回课程</a><header class="hero"><div class="step-head"><div><div class="accent">${esc(course(c).name)} · ${+i+1}/4</div><h1>${esc(a.name)}</h1></div><span class="tag">${esc(s.slot)}</span></div><p>2 工作组 × ${s.min}–${s.max} 次 · 留 2–3 次余力</p><p class="muted">这是新增编排建议，并非原视频处方。</p></header><article class="card"><h2>组进度</h2><div class="progress"><i style="width:${done/2*100}%"></i></div><p>${done} / 2 组已完成 · 休息 ${seconds} 秒</p><label>休息 <select data-rest>${[90,120,150,180].map(v=>`<option value="${v}" ${seconds===v?'selected':''}>${v} 秒</option>`).join('')}</select></label>${rest?(rest.finished||remain<=0?'<p class="muted">本轮休息已结束；不会自动开始下一组。</p>':`<div class="timer" data-timer>${String(Math.ceil(remain/1000)).padStart(2,'0')} 秒</div><button data-action="pause">${rest.paused?'恢复':'暂停'}休息</button>`):''}<div class="actions"><button class="primary" data-action="set" ${done>=2?'disabled':''}>完成一组</button><button data-action="undo" ${!done?'disabled':''}>撤销一组</button></div></article><article class="card" data-detail-scope="course:${esc(a.id)}"><h2>动作卡</h2>${teach.cue?`<p><b>口诀：</b>${esc(teach.cue)}</p>`:'<p class="muted">当前未解析简短口诀；请先看视频确认动作。</p>'}${teach.notes.length?`<ul>${teach.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}<div class="actions">${inlineVideoLinks(sources)}<a class="secondary" href="${href(`course/${c}/${i}/exercise/${encodeURIComponent(a.id)}`)}">完整动作详情</a></div><details><summary>展开完整教学、补充与来源</summary>${a.card?courseBody(a.id):referenceBody(a)}</details><h3 style="margin-top:18px">同模式替换</h3><div class="actions">${atoms(s).map(x=>`<button data-replace="${esc(x.id)}" ${x.id===a.id?'disabled':''}>${esc(x.name)}</button>`).join('')}</div></article><div class="actions">${+i?`<a class="back" href="${href(`course/${c}/${+i-1}`)}">上一项</a>`:''}${+i<3?`<a class="primary" href="${href(`course/${c}/${+i+1}`)}">下一项</a>`:'<button class="primary" data-action="restart">开始新一轮</button>'}</div>`);
}
function courseDetail(c,i,id){
  const s=step(c,i),x=s&&atoms(s).find(v=>v.id===id);
  if(!s||!x)return missing('找不到这个动作详情',`course/${c}/${i}`);
  const source=x.card?{url:video(x.card.bv,x.card.t),timeText:Math.floor(x.card.t/60)+':'+String(Math.floor(x.card.t%60)).padStart(2,'0')}:preferredSource(x);
  return detailLayout({name:x.name,subtitle:s.slot+' · 动作相关教学与来源',source,media:x.media,body:x.card?courseBody(id):referenceBody(x),active:'courses'});
}
function library(){let fs=['全部',...new Set(refs.map(x=>x.body).filter(Boolean))],items=refs.filter(x=>(ui.filter==='全部'||x.body===ui.filter)&&JSON.stringify(x).toLowerCase().includes(ui.q.toLowerCase()));const videos=(evidence?.videos||[]).map(v=>`<a class="secondary" href="${href(`video/${encodeURIComponent(v.bv)}`)}">字幕整理 · ${esc(v.title)}</a>`).join('');return shell(`<header class="hero"><div class="accent">查动作</div><h1>按名字、部位或器械找动作。</h1><p>参考动作与课程动作资料分开浏览；所有已整理的内容均可直达。</p></header><div class="actions"><a class="secondary" href="#content">浏览 64 项课程动作与教练口令</a>${videos}</div><div class="toolbar"><input id="search" class="search" placeholder="搜索动作、部位或器械" value="${esc(ui.q)}">${fs.map(x=>`<button class="filter ${ui.filter===x?'on':''}" data-filter="${esc(x)}">${esc(x)}</button>`).join('')}</div><p class="muted">${items.length} 项参考动作</p><div class="list">${items.map(x=>`<article class="item"><div class="item-main"><h2>${esc(x.name)}</h2><span class="tag">${esc(x.body||'资料')}</span><p class="muted">${esc(x.training?.displayDose || (x.availability==='source_only'?'来源视频资料':''))}</p></div><a class="secondary" href="${href(`library/reference/${encodeURIComponent(x.id)}`)}">查看</a></article>`).join('')||'<p class="empty">没有符合的动作。试试更短的关键词。</p>'}</div>`,'library')}
function libraryDetail(id){
  const x=ref(id);if(!x)return missing('找不到这个参考动作','library');
  return detailLayout({name:x.name,subtitle:(x.body||'动作资料')+' · 参考动作',source:preferredSource(x),media:x.media,body:referenceBody(x)+evidenceSourcesFor({referenceId:id})});
}
function courseLibrary(){let q=ui.q.toLowerCase(),items=cards.filter(x=>JSON.stringify(x).toLowerCase().includes(q));return shell(`<header class="hero"><div class="accent">课程动作资料</div><h1>64 项课程动作与对应时间。</h1><p>教练口令、完整分段教学、补充与备注均保留在每个动作详情中。</p></header><div class="toolbar"><input id="search" class="search" placeholder="搜索课程动作" value="${esc(ui.q)}"><a class="secondary" href="#library">参考动作库</a></div><div class="list">${items.map(x=>`<article class="item"><div class="item-main"><h2>${esc(x.n)}</h2><span class="tag">${esc(x.role)}</span><p class="muted">${esc(overlay.get(x.id)?.cue||x.cues?.[0]?.text||'')}</p></div><a class="secondary" href="#library/course/${encodeURIComponent(x.id)}">完整要点</a></article>`).join('')}</div>`,'library')}
function courseLibraryDetail(id){
  const c=cards.find(x=>x.id===id);if(!c)return missing('找不到课程动作','content');
  return detailLayout({name:c.n,subtitle:(c.role||'')+' · '+(c.slot||''),source:{url:video(c.bv,c.t),timeText:Math.floor(c.t/60)+':'+String(Math.floor(c.t%60)).padStart(2,'0')},media:c.media,body:courseBody(id)});
}
function sourceTime(t){return `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`}
function evidenceSourcesFor(match){
  const linked=(evidence?.actions||[]).filter(a=>Object.entries(match).every(([k,v])=>a[k]===v));
  const rows=linked.flatMap(a=>(evidence.segments||[]).filter(s=>s.actionId===a.id).map(s=>{const v=(evidence.videos||[]).find(x=>x.id===s.videoId);return v&&`<a class="secondary" href="${href(`video/${encodeURIComponent(v.bv)}`)}">字幕来源 · ${esc(v.title)} · ${sourceTime(s.startSeconds)}</a>`})).filter(Boolean);
  return rows.length?`<section><h2>字幕整理来源</h2><div class="actions">${rows.join('')}</div></section>`:'';
}
function subtitleVideoPage(bv){
  const v=(evidence?.videos||[]).find(x=>x.bv===bv);if(!v)return missing('找不到这支字幕整理视频','library');
  const actions=new Map((evidence.actions||[]).map(x=>[x.id,x])),variants=new Map((evidence.variants||[]).map(x=>[x.id,x]));
  const rows=(evidence.segments||[]).filter(x=>x.videoId===v.id).map(s=>{
    const action=actions.get(s.actionId),card=cards.find(x=>x.id===action?.courseCardId),reference=ref(action?.referenceId),variant=variants.get(s.variantId),claims=(evidence.claims||[]).filter(x=>x.segmentId===s.id),cue=claims.find(x=>x.kind==='cue'),extra=claims.filter(x=>x!==cue),detail=card?href(`library/course/${encodeURIComponent(card.id)}`):reference?href(`library/reference/${encodeURIComponent(reference.id)}`):'';
    return `<article class="card" data-detail-scope="subtitle:${esc(s.id)}"><div class="step-head"><div><span class="tag">${esc(variant?.name||card?.role||reference?.body||'热身／活动度')}</span><h2>${esc(card?.n||reference?.name||variant?.name||'训练片段')}</h2></div><span class="tag">${sourceTime(s.startSeconds)}</span></div>${cue?`<p><b>核心提示：</b>${esc(cue.publicSummary)}</p>`:'<p class="muted">本段仅保留视频定位；尚未整理可公开的核心提示。</p>'}<div class="actions"><a class="secondary" href="${esc(sourcePublicLink({bv:v.bv,t:s.startSeconds}))}">视频 · ${sourceTime(s.startSeconds)}</a>${detail?`<a class="secondary" href="${detail}">现有动作详情</a>`:''}</div>${extra.length?`<details><summary>展开字幕整理要点</summary>${extra.map(c=>`<p>${c.kind==='dose'?'<b>原课剂量：</b>':c.kind==='superset'?'<b>组合：</b>':'<b>要点：</b>'}${esc(c.publicSummary)} <a href="${esc(sourcePublicLink({bv:v.bv,t:c.sourceSpans?.[0]?.[0]??s.startSeconds}))}">对应片段</a></p>`).join('')}</details>`:''}</article>`;
  }).join('');
  return shell(`<a class="back" href="#library">返回查动作</a><header class="hero"><div class="accent">字幕整理视频</div><h1>${esc(v.title)}</h1><p>${esc(v.creator)} · ${sourceTime(v.durationSeconds)} · 字幕时间戳整理</p><p class="muted">${esc(v.publicNote)}</p></header><div class="list">${rows}</div>`,'library');
}
const tonightKey='fitness-tonight-plan-v1';
function publicVideo(s){if(s.url)return s.url;return `https://www.bilibili.com/video/${s.bv}/?t=${Math.floor(s.t||0)}`}
function tonightState(){let x=readStored(tonightKey);return x?.steps&&typeof x.steps==='object'?x:{steps:{}}}
function saveTonight(x){try{localStorage.setItem(tonightKey,JSON.stringify(x))}catch{}}
function tonightDetailHref(id){return ref(id)?href(`library/reference/${encodeURIComponent(id)}`):cards.some(x=>x.id===id)?href(`library/course/${encodeURIComponent(id)}`):''}
function tonightPlan(){
  if(!tonight)return shell('<p class="loading">正在加载今晚清单…</p>','tonight');const state=tonightState();
  const row=(s)=>{const own=state.steps[s.actionId]||{},sets=own.sets??s.sets,reps=own.reps??s.reps,skip=!!own.skip,detail=tonightDetailHref(s.actionId),card=cards.find(x=>x.id===s.actionId),teach=inlineTeaching(s.actionId,card),long=card?courseBody(card.id):ref(s.actionId)?referenceBody(ref(s.actionId)):'';return `<article class="card" data-detail-scope="tonight:${esc(s.actionId)}" ${skip?'style="opacity:.58"':''}><div class="step-head"><div><span class="tag">${esc(s.role)}</span><h2>${esc(s.name)}</h2></div><label class="muted"><input type="checkbox" data-tonight-skip="${esc(s.actionId)}" ${skip?'checked':''}> 跳过</label></div><p class="muted">建议 ${esc(String(sets))} 组 · ${esc(String(reps))}${s.rest?` · 休息 ${s.rest} 秒`:''}；可现场修改。</p>${teach.cue?`<p><b>口诀：</b>${esc(teach.cue)}</p>`:'<p class="muted">未解析短口诀；请先看下方视频确认姿势。</p>'}${teach.notes.length?`<ul>${teach.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}<div class="actions">${inlineVideoLinks(s.sources)}${detail?`<a class="secondary" href="${detail}">完整动作详情</a>`:''}<label>组 <input class="small" data-tonight-field="sets" data-tonight-id="${esc(s.actionId)}" value="${esc(String(sets))}"></label><label>次数 <input class="small" data-tonight-field="reps" data-tonight-id="${esc(s.actionId)}" value="${esc(String(reps))}"></label></div>${long?`<details><summary>展开完整教学、补充与来源</summary>${long}</details>`:''}</article>`};
  return shell(`<header class="hero"><div class="accent">可增减清单</div><h1>${esc(tonight.title)}</h1><p>${esc(tonight.note)}</p><p class="muted">“优先”不是必做；“可加／可替换／可选”可按器械、疲劳和时间跳过。俯身腿弯举视频不适用于坐姿机。</p></header>${tonight.groups.map(g=>`<section class="tools"><h2>${esc(g.title)}</h2><div class="list">${g.steps.map(row).join('')}</div></section>`).join('')}`,'tonight');
}
function missing(text,back){return shell(`<article class="detail"><h1>${text}</h1><p class="muted">链接可能已过期，或该条目不在当前资料中。</p><a class="primary" href="#${back}">返回</a></article>`)}
function render(){
  let h=location.hash||'#courses';
  if(!location.hash)history.replaceState({...history.state},'',h);
  if(h==='#training'||h==='#tools'){location.replace('./training-tools.html');return}
  const saved=restorePlace(h),m=h.match(/^#course\/([^/]+)\/(\d+)(?:\/exercise\/(.+))?$/),l=h.match(/^#library\/reference\/(.+)$/),cl=h.match(/^#library\/course\/(.+)$/),v=h.match(/^#video\/([^/]+)$/);
  app.innerHTML=m?(m[3]?courseDetail(m[1],m[2],decode(m[3])):renderCourse(m[1],m[2])):l?libraryDetail(decode(l[1])):cl?courseLibraryDetail(decode(cl[1])):v?subtitleVideoPage(decode(v[1])):h==='#content'?courseLibrary():h==='#library'?library():h==='#tonight'?tonightPlan():h==='#courses'?courseHome():missing('页面不存在','courses');
  restoreDetails(saved?.details);
  requestAnimationFrame(()=>scrollTo(0,saved?.scrollY||0));
}
function close(){
  const h=location.hash,m=h.match(/^#course\/([^/]+)\/(\d+)\/exercise\//),parent=m?`#course/${m[1]}/${m[2]}`:h.startsWith('#library/course/')?'#content':'#library';
  if(history.state?.appNavigation&&/^#video\//.test(history.state.from||'')){history.back();return}
  if(history.state?.appNavigation&&history.state.from==='#tonight'){history.back();return}
  if(history.state?.appNavigation&&history.state.from===parent){history.back();return}
  navigate(parent,{replace:true,from:null});
}
function sourceLinks(sources){
  return (sources||[]).filter(s=>safe(s.url)!=='#').map(s=>`<p><a href="${esc(safe(s.url))}">${esc(s.label||s.timeText||'查看来源')}</a></p>`).join('');
}
function textParagraphs(value){
  if(value?.text)return `<p style="white-space:pre-line">${esc(value.text)}</p>`;
  return (value?.paragraphs||[]).map(p=>`<p>${esc(p)}</p>`).join('');
}
function referenceBody(x){
  const sequence=(x.stepSequences||[]).map(g=>`<section><h2>${esc(g.section||'动作步骤')}${g.variant?' · '+esc(g.variant):''}${g.version?' · '+esc(g.version):''}</h2>${(g.steps||[]).map((s,n)=>`<p><b>${n+1}. ${esc(s.title||'步骤')}</b><br>${esc(s.text||'')}</p>`).join('')}${g.complete===false?'<p class="muted">呼吸配合：待补</p>':''}</section>`).join('');
  const supplements=(x.supplements||[]).map(s=>`<details><summary>${esc(s.title||'补充教学')}</summary>${textParagraphs(s.content)}${sourceLinks(s.sources)}</details>`).join('');
  const training=(x.trainingDetails?.paragraphs||[]).map(p=>`<p>${esc(p)}</p>`).join('');
  const main=(x.main?.paragraphs||[]).map(p=>`<p>${esc(p)}</p>`).join('')||textParagraphs(x.main);
  const attribution=[x.primarySourceAttribution?.title,x.primarySourceAttribution?.author].filter(Boolean).join(' · ')||x.sourceSite?.name||'';
  return `${training?`<section><h2>训练安排</h2>${training}</section>`:''}${sequence}<section><h2>动作说明</h2>${main||'<p>本条提供来源视频资料。</p>'}</section>${supplements?`<section><h2>补充教学</h2>${supplements}</section>`:''}<section><h2>来源</h2>${sourceLinks(x.primarySources)||'<p class="muted">暂无可公开来源链接。</p>'}${x.sourceRecord?`<details><summary>来源记录</summary>${textParagraphs(x.sourceRecord)}</details>`:''}${attribution?`<details><summary>来源与归属</summary><p>${esc(attribution)}</p></details>`:''}</section>`;
}
function courseBody(id){
  const c=cards.find(x=>x.id===id);if(!c)return '';
  const f=full.get(id)||{},d=details.get(id)||{},o=overlay.get(id);
  const jump=row=>(row.source_spans||[]).map(s=>` <a href="${esc(video(c.bv,s.start_seconds))}">对应片段 ${Math.floor(s.start_seconds/60)}:${String(Math.floor(s.start_seconds%60)).padStart(2,'0')}</a>`).join('');
  const entries=Object.entries(f.sections||{});
  const sections=entries.map(([key,rows])=>`<section><h2>${esc(labels[key]||key)}</h2><ul>${rows.map(row=>`<li>${esc(row.text||row)}${jump(row)}</li>`).join('')}</ul></section>`).join('');
  const fallback=entries.length?'':[['setup','设置'],['steps','过程'],['breathing','呼吸'],['feel','感觉'],['errors','常见偏差'],['variations','变式']].map(([key,label])=>Array.isArray(d[key])&&d[key].length?`<section><h2>${label}</h2><ul>${d[key].map(t=>`<li>${esc(t.text||t)}</li>`).join('')}</ul></section>`:'').join('');
  const extra=(title,rows)=>rows?.length?`<details><summary>${title}</summary>${rows.map(row=>`<p>${esc(row.text||row)}${jump(row)}</p>`).join('')}</details>`:'';
  const coaching=o?`<section><h2>教练短口令</h2><p>${esc(o.cue||'')}</p>${o.setup?.length?`<h3>设置</h3><ul>${o.setup.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}${o.execute?.length?`<h3>执行</h3><ul>${o.execute.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}${o.targetfeel?`<h3>目标感受</h3><p>${esc(o.targetfeel)}</p>`:''}${o.mistakes?.length?`<h3>常见问题与调整</h3><ul>${o.mistakes.map(t=>`<li>${esc(t.observed_problem||'')} ${esc(t.adjustment||'')}</li>`).join('')}</ul>`:''}</section>`:'';
  return coaching+sections+fallback+extra('课程补充',f.course_supplement)+extra('来源与待核资料',f.editorial_metadata)+evidenceSourcesFor({courseCardId:id});
}
function detailLayout({name,subtitle,body,source,media,active='library'}){
  const url=source&&safe(source.url),label=url?.startsWith('bilibili:')?'用 B站 App 打开原片':url?.startsWith('snssdk1128:')?'用抖音 App 打开原片':'打开来源网页';
  return shell(`<article class="detail"><button class="back" data-close>${active==='courses'?'关闭教学':'关闭详情'}</button><h1>${esc(name)}</h1><p class="muted">${esc(subtitle||'')}</p>${media?.src?`<figure><img src="${esc(media.src)}" alt="${esc(name)} 动作示意"><figcaption class="muted">${esc(media.note||'动作示意')}</figcaption></figure>`:''}${url&&url!=='#'?`<div class="actions"><a class="primary" href="${esc(url)}">${label}${source.timeText?' · '+esc(source.timeText):''}</a></div>`:'<p class="muted">暂无可打开的原片链接。</p>'}${body}</article>`,active);
}
function isDetailRoute(h){return /^#course\/[^/]+\/\d+\/exercise\/.+$/.test(h)||/^#library\/(?:reference|course)\/.+$/.test(h)}
function navigate(target,{replace=false,from}={}){
  if(target===(location.hash||'#courses'))return;
  const previous=location.hash||'#courses';savePlace();
  const state={appNavigation:true,from:from===undefined?previous:from};
  if(isDetailRoute(target))state.routeUI={q:'',filter:'全部',scrollY:0};
  history[replace?'replaceState':'pushState'](state,'',target);render();
}
function setupListeners(){
  window.addEventListener('hashchange',render);window.addEventListener('popstate',render);window.addEventListener('beforeunload',savePlace);
  app.addEventListener('error',e=>{if(e.target.tagName!=='IMG')return;const p=document.createElement('p');p.className='muted';p.textContent='示意图暂不可用';e.target.replaceWith(p)},true);
  app.addEventListener('toggle',e=>{if(e.target.matches?.('details'))savePlace()},true);
  app.addEventListener('click',e=>{
    const a=e.target.closest('a[href^="#"]');
    if(!a||!app.contains(a)||e.defaultPrevented||e.button>0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    e.preventDefault();navigate(a.getAttribute('href'));
  },true);
  app.addEventListener('click',e=>{
    const closeBtn=e.target.closest('[data-close]'),replace=e.target.closest('[data-replace]'),action=e.target.closest('[data-action]'),filter=e.target.closest('[data-filter]');
    if(closeBtn){e.preventDefault();close();return}
    if(filter){ui.filter=filter.dataset.filter;savePlace();render();return}
    const m=location.hash.match(/^#course\/([^/]+)\/(\d+)$/);if(!m||!step(m[1],m[2]))return;
    const [c,i]=[m[1],m[2]],s=session(c);
    if(replace){
      if(replace.dataset.replace===choice(c,i)?.id)return;
      if(!atoms(step(c,i)).some(x=>x.id===replace.dataset.replace))return;
      if(confirm('替换会清空这个槽位的组进度。继续吗？')){train.choices[`${c}/${i}`]=replace.dataset.replace;delete s.done[i];if(s.rest?.i===+i)s.rest=null;saveTrain();render()}return;
    }
    if(!action)return;const kind=action.dataset.action;
    if(kind==='restart'){
      if(confirm('开始新一轮会清空本课程的组进度和休息计时。继续吗？')){train.sessions[c]={done:{},restSeconds:{},rest:null};saveTrain();navigate(`#course/${c}/0`,{replace:true,from:null})}return;
    }
    if(kind==='set'&&(+s.done[i]||0)<2){s.done[i]=(+s.done[i]||0)+1;s.rest={i:+i,deadline:Date.now()+(s.restSeconds[i]||step(c,i).rest)*1000,paused:false}}
    if(kind==='undo'&&(+s.done[i]||0)>0){s.done[i]=Math.max(0,(+s.done[i]||0)-1);if(s.rest?.i===+i)s.rest=null}
    if(kind==='pause'&&s.rest&&!s.rest.finished){if(s.rest.paused){s.rest.deadline=Date.now()+s.rest.left;s.rest.paused=false}else{s.rest.left=Math.max(0,s.rest.deadline-Date.now());s.rest.paused=true}}
    saveTrain();render();
  });
  app.addEventListener('input',e=>{if(e.target.id!=='search')return;ui.q=e.target.value;savePlace();render();const input=document.querySelector('#search');input?.focus();input?.setSelectionRange(ui.q.length,ui.q.length)});
  app.addEventListener('change',e=>{if(!e.target.matches('[data-rest]'))return;const m=location.hash.match(/^#course\/([^/]+)\/(\d+)$/),value=+e.target.value;if(m&&[90,120,150,180].includes(value)){session(m[1]).restSeconds[m[2]]=value;saveTrain()}});
  app.addEventListener('change',e=>{const id=e.target.dataset?.tonightSkip;if(!id)return;const state=tonightState();state.steps[id]={...(state.steps[id]||{}),skip:e.target.checked};saveTonight(state);savePlace();render()});
  app.addEventListener('input',e=>{const id=e.target.dataset?.tonightId,field=e.target.dataset?.tonightField;if(!id||!field)return;const state=tonightState();state.steps[id]={...(state.steps[id]||{}),[field]:e.target.value};saveTonight(state)});
  setInterval(()=>{
    const m=location.hash.match(/^#course\/([^/]+)\/(\d+)$/),r=m&&train.sessions[m[1]]?.rest;if(!r||r.paused||r.finished)return;
    const remaining=Math.max(0,r.deadline-Date.now());
    if(!remaining){r.finished=true;saveTrain();render();return}
    if(r.i===+m[2]){const out=document.querySelector('[data-timer]');if(out)out.textContent=`${String(Math.ceil(remaining/1000)).padStart(2,'0')} 秒`}
  },400);
}
setupListeners();
Promise.all(['course-content-20261009.json','coach-cues-20261009.json','course-full-detail-20261009.json','authorized-reference.json','tonight-chest-hamstrings-20261011.json','subtitle-video-evidence-20261012.json'].map(n=>fetch(`./data/${n}?v=${dataVersion}`).then(r=>r.ok?r.json():Promise.reject(Error(n))))).then(([c,o,f,r,p,e])=>{cards=c.sourceCards;details=new Map(c.details.map(x=>[x.id,x]));overlay=new Map(o.overlays.map(x=>[x.id,x]));labels=f.section_labels||{};full=new Map(f.cards.map(x=>[x.id,x]));refs=r.entries.filter(x=>x.detailStatus==='read'||x.detailStatus==='partial');tonight=p;evidence=e;render()}).catch(e=>app.innerHTML=missing(`资料加载失败：${e.message}`,'courses'));

