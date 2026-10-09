const app=document.querySelector('#app');
const courses=[
 {id:'chest-back',name:'胸背两分化',intro:'推拉交替，动作可按器械替换。',steps:[
  {actionId:'bench',name:'杠铃卧推',sets:'默认 2 工作组 × 8–12 次 · 休息 150 秒',cue:'水平推：肩胛稳定，杠铃落点可控。',alternatives:['incline','pushup']},
  {actionId:'row',name:'坐姿划船',sets:'默认 2 工作组 × 8–12 次 · 休息 120 秒',cue:'水平拉：肘向后带，躯干保持稳定。',alternatives:['pulldown','chest-row']},
  {actionId:'incline',name:'哑铃上斜卧推',sets:'默认 2 工作组 × 8–12 次 · 休息 120 秒',cue:'上斜推：上斜角度适中，手腕中立。',alternatives:['machine-press','pushup']},
  {actionId:'pulldown',name:'高位下拉',sets:'默认 2 工作组 × 8–12 次 · 休息 120 秒',cue:'垂直拉：先下沉肩胛，再向下拉肘。',alternatives:['assist-pullup','row']}
 ]},
 {id:'glute-leg',name:'臀腿两分化',intro:'髋主导与膝主导兼顾，按当天器械选择。',steps:[
  {actionId:'squat',name:'深蹲',sets:'默认 2 工作组 × 8–12 次 · 休息 150 秒',cue:'膝主导：脚掌稳定，膝盖跟随脚尖。',alternatives:['leg-press','goblet-squat']},
  {actionId:'r',name:'罗马尼亚硬拉',sets:'默认 2 工作组 × 8–12 次 · 休息 150 秒',cue:'髋铰链：髋向后移，背部中立。',alternatives:['hip-hinge','back-extension']},
  {actionId:'hip-thrust',name:'臀推（待配置）',sets:'默认 2 工作组 × 10–15 次 · 休息 90 秒',cue:'髋伸槽位：尚未配置可靠教学来源。',alternatives:['glute-bridge','cable-pullthrough']},
  {actionId:'leg-curl',name:'腿弯举（待配置）',sets:'默认 2 工作组 × 10–15 次 · 休息 90 秒',cue:'屈膝槽位：尚未配置可靠教学来源。',alternatives:[]}
 ]}
];
const atoms={bench:{name:'杠铃卧推',source:'课程动作：杠铃卧推',detail:'胸部推举；可从课程资料查看完整技术与教练口令。'},incline:{name:'哑铃上斜卧推',source:'课程动作：哑铃上斜卧推',detail:'上胸推举；以稳定轨迹完成。'},r:{name:'罗马尼亚硬拉',source:'课程动作：罗马尼亚硬拉',detail:'髋主导训练；保持负重贴近身体。'},row:{name:'坐姿划船',source:'动作库资料',detail:'背部水平拉；以肩胛控制为先。'},pulldown:{name:'高位下拉',source:'动作库资料',detail:'背部垂直拉；避免耸肩代偿。'},pushup:{name:'俯卧撑',source:'可替换动作',detail:'自重推举替代。'},'machine-press':{name:'器械推胸',source:'可替换动作',detail:'器械可用时的推举替代。'},squat:{name:'深蹲',source:'动作库资料',detail:'膝主导下肢训练。'},'hip-thrust':{name:'臀推（待配置）',source:'未配置可靠教学来源',detail:'保留髋伸训练槽位，不冒充现有课程已教。'},'leg-curl':{name:'腿弯举（待配置）',source:'未配置可靠教学来源',detail:'保留屈膝训练槽位，不冒充现有课程已教。'}};
Object.assign(atoms,{'chest-row':{name:'胸托划船'},'assist-pullup':{name:'辅助引体'},'hip-hinge':{name:'髋铰链练习'},'back-extension':{name:'背伸'},'leg-press':{name:'腿举'},'goblet-squat':{name:'高脚杯深蹲'},'glute-bridge':{name:'臀桥'},'cable-pullthrough':{name:'绳索拉臀'}});
const getCourse=id=>courses.find(x=>x.id===id),atom=id=>atoms[id]||{name:id,source:'可替换动作',detail:'按现有器械和状态选择。'};
const replacementKey='training-course-replacements-v1';let replacements={};try{replacements=JSON.parse(localStorage.getItem(replacementKey)||'{}')}catch{}const chosen=(c,i)=>replacements[c.id+'/'+i]||c.steps[i].actionId;const saveChoice=(c,i,id)=>{replacements[c.id+'/'+i]=id;localStorage.setItem(replacementKey,JSON.stringify(replacements))};
const href=(c,i,detail)=>'#course/'+c.id+'/'+i+(detail?'/exercise/'+detail:'');
function list(){app.innerHTML='<section data-testid=course-root class=hero><h1>训练课</h1><p class=sub>两分化课程 · 稳定动作 ID · 可替换卡片</p></section><div class=filters><button data-testid=course-library>内容资料</button><button data-testid=course-training>训练工具</button></div>'+courses.map(c=>'<article class=card><h2>'+c.name+'</h2><p>'+c.intro+'</p><p class=muted>'+c.steps.length+' 个动作步骤</p><a class="back primary" data-testid=course-open href="#course/'+c.id+'/0">开始课程</a></article>').join('')}
function detail(c,index,id){let a=atom(id);app.innerHTML='<button class=back data-testid=course-detail-back>← 返回步骤</button><article data-testid=course-atom-detail class="card detail"><h1>'+a.name+'</h1><p class=muted>稳定动作 ID：'+id+'</p><p>'+a.detail+'</p><p class=muted>'+a.source+'</p><p>替换不会更改原课程步骤；可随时回到本步骤选择其他动作。</p></article>'}
function route(){let m=location.hash.match(/^#course\/([^/]+)\/(\d+)(?:\/exercise\/([^/]+))?$/);if(location.hash==='#courses')return list();if(!m)return;let c=getCourse(m[1]),i=Number(m[2]);if(!c||!c.steps[i]){location.hash='#courses';return}m[3]?detail(c,i,m[3]):steps(c,i)}
document.addEventListener('click',e=>{let b=e.target.closest('[data-testid]');if(!b||!app.contains(b))return;if(b.dataset.testid==='course-library'){e.preventDefault();e.stopImmediatePropagation();location.hash='content'}if(b.dataset.testid==='course-training'){e.preventDefault();e.stopImmediatePropagation();location.hash='training';location.reload()}if(b.dataset.testid==='course-atom'||b.dataset.testid==='course-replace'){let m=location.hash.match(/^#course\/([^/]+)\/(\d+)/);if(m){e.preventDefault();e.stopImmediatePropagation();let c=getCourse(m[1]),i=Number(m[2]);if(b.dataset.testid==='course-replace')saveChoice(c,i,b.dataset.atom);location.hash=href(c,i,b.dataset.atom)}}if(b.dataset.testid==='course-detail-back'){let m=location.hash.match(/^#course\/([^/]+)\/(\d+)/);if(m){e.preventDefault();e.stopImmediatePropagation();history.back()}}},true);
window.addEventListener('hashchange',route);window.addEventListener('popstate',route);
const observer=new MutationObserver(()=>{if(location.hash===''||location.hash==='#content'){let root=app.querySelector('[data-testid=content-root]');if(root&&!app.querySelector('[data-testid=course-tab]')){let b=document.createElement('button');b.dataset.testid='course-tab';b.textContent='训练课';root.after(b)}}});observer.observe(app,{childList:true,subtree:true});
document.addEventListener('click',e=>{let b=e.target.closest('[data-testid=course-tab]');if(b){e.stopImmediatePropagation();location.hash='courses'}},true);
function steps(c,index){
 const s=c.steps[index],action=chosen(c,index);
 app.innerHTML='<section data-testid=course-steps class=hero><p class=muted>'+c.name+' · '+(index+1)+'/'+c.steps.length+'</p><h1>'+s.name+'</h1><p>'+s.sets+' · 留 2–3 次余力 · 休息 90–180 秒（可调）</p><p>'+s.cue+'</p><p class=muted>热身 5–10 分钟；首个大项可做 1–2 轻热身组（不计工作组）。这是保守模板，不是原视频处方；时长 30–45 分钟仅为估计。</p></section><article class=card><h2>动作卡</h2><button data-testid=course-atom data-atom="'+action+'">'+atom(action).name+' · 查看要点</button><h3>同模式替换</h3><div class=filters>'+s.alternatives.map(id=>'<button data-testid=course-replace data-atom="'+id+'">'+atom(id).name+'</button>').join('')+'</div></article><div class=actions><a class=back href="#courses">返回课程</a>'+(index?'<a class=back href="'+href(c,index-1)+'">上一项</a>':'')+(index<c.steps.length-1?'<a class="back primary" href="'+href(c,index+1)+'">下一项</a>':'')+'</div>';
}
route();
