(() => {
'use strict';
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const DATA = 'data/';
let rawDialogs=[], storyMap=[], friendshipMap=[], choices=[], branchMap=[], birthdayRows=[], birthdayTalkIndex=null;
let textMap={}, heroMap={}, writerMap={}, portraitMap={}, mobMap={}, friendshipTitleMap={}, talkTextMap={}, chapterMap={};
let lang='kor', loaded=false, loading=false, category='', selectedChapter=null, selectedGroup=null, selectedHero=null;
let storyItems=[], activeStory=null, timeline=[], stepIndex=0, selectedBranches={}, toastTimer=null;
const languageCache={};
const textTypes=new Set([1,2,3,4,5,20,21,23]);
function showToast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200);}
async function json(path){const r=await fetch(DATA+path);if(!r.ok)throw Error('無法載入 '+path+' ('+r.status+')');return r.json();}
async function localization(path){const r=await fetch('TextAsset/'+path);if(!r.ok)throw Error('無法載入 TextAsset/'+path);return r.text();}
function parseLoc(raw){const out={};String(raw||'').replace(/^\uFEFF/,'').split(/\r?\n/).forEach(line=>{const i=line.indexOf('\t');if(i>0)out[line.slice(0,i)]=line.slice(i+1)});return out;}
function formatText(raw){return String(raw??'').replace(/\\\\r/g,'\n').replace(/\\\\n/g,'\n').trim();}
function nameForHero(id){return heroMap['Hero_Name_'+String(id).padStart(4,'0')]||('Hero '+id);}
function speakerName(id){const v=String(id??'-1');if(v==='-1')return '旁白';const k=v.padStart(4,'0');return heroMap['Hero_Name_'+k]||writerMap['Writer_Name_'+k]||portraitMap['Portrait_Name_'+k]||mobMap['Mob_Name_'+k]||('角色 '+v);}
function storyName(row){if(row.type==='main')return 'Chapter '+row.chapterId+'-'+row.order;if(row.type==='substory_read')return (lang==='eng'?row.title_en:row.title_ko)||('支線 '+row.order);return '劇情';}
function friendName(storyId){const key='FriendshipStory_StoryName_'+String(storyId).padStart(4,'0');return friendshipTitleMap[key]||('好感度劇情 '+(storyId%1000));}
function dateLabel(month,day){return month&&day?String(month).padStart(2,'0')+'/'+String(day).padStart(2,'0'):'生日劇情';}
function setLoadStatus(message,error=false){const el=$('loadStatus');el.textContent=message;el.classList.toggle('error',error);}
async function loadLanguage(next){
 lang=next;
 if(!languageCache[lang]){
  const suffix=lang+'.txt';
  const [dialogRaw,heroRaw,writerRaw,portraitRaw,mobRaw,friendRaw,talkRaw,chapterRaw]=await Promise.all([
   localization('Text_Dialog_loc_'+suffix),localization('Text_Hero_loc_'+suffix),localization('Text_Writer_loc_'+suffix),localization('Text_Portrait_loc_'+suffix),localization('Text_Mob_loc_'+suffix),localization('Text_FriendshipStory_loc_'+suffix),localization('Text_Talk_loc_'+suffix),localization('Text_Chapter_loc_'+suffix)
  ]);
  languageCache[lang]={
   dialog:parseLoc(dialogRaw),hero:parseLoc(heroRaw),writer:parseLoc(writerRaw),portrait:parseLoc(portraitRaw),mob:parseLoc(mobRaw),friendship:parseLoc(friendRaw),talk:parseLoc(talkRaw),chapter:parseLoc(chapterRaw)
  };
 }
 const p=languageCache[lang];textMap=p.dialog;heroMap=p.hero;writerMap=p.writer;portraitMap=p.portrait;mobMap=p.mob;friendshipTitleMap=p.friendship;talkTextMap=p.talk;chapterMap=p.chapter;
 $('languageStatus').textContent='文本語言：'+(lang==='kor'?'韓文':'英文');
 if(loaded){renderSidebar();renderStoryStrip();renderCurrent();}
}
async function loadAll(){
 if(loading||loaded)return;loading=true;
 try{
  setLoadStatus('正在載入章節、故事目錄與 Dialog 記錄…');
  const files=await Promise.all([
   json('dict-dialogs.json'),json('story-dialog-title-map.json'),json('friendship-story-dialog-map.json'),json('choice-blocks.json'),json('branch-execution-map.json'),json('birthday-dialog-index.json'),json('birthday-talk-index.json'),json('chapters.json')
  ]);
  [rawDialogs,storyMap,friendshipMap,choices,branchMap,birthdayRows,birthdayTalkIndex]=files;
  setLoadStatus('已讀取 '+rawDialogs.length.toLocaleString()+' 筆 Dialog 記錄，正在載入本地化文本…');
  await loadLanguage('kor');
  loaded=true;loading=false;
  document.querySelectorAll('[data-category]').forEach(b=>b.disabled=false);
  $('language').disabled=false;
  setLoadStatus('資料已就緒 · 主線 9 章 · 支線 '+storyMap.filter(x=>x.type==='substory_read').length+' 話 · 好感度 '+friendshipMap.length+' 話');
 }catch(err){
  loading=false;setLoadStatus('載入失敗：'+err.message,true);console.error(err);
 }
}
function allBirthdayEntries(){
 const entries=birthdayRows.filter(r=>!r[6]).map(r=>({kind:'birthdayDialog',heroId:r[0],month:r[1],day:r[2],dialogId:r[3],count:r[4],key:'BD'+r[0],title:'生日劇情',meta:'生日劇情 · '+dateLabel(r[1],r[2])}));
 for(const h of birthdayTalkIndex.heroEntries||[]){
  entries.push({kind:'birthdayTalk',heroId:h.heroId,talkIds:h.talkIds,behaviour:h.behaviour,key:'BT'+h.heroId,title:'生日劇情',meta:'生日劇情 · Talk '+h.talkIds.join(' / ')});
 }
 return entries;
}
function affectionByHero(){
 const map=new Map();
 friendshipMap.forEach(pair=>{
  const dialogId=Number(pair[0]),storyId=Number(pair[1]),heroId=Math.floor(storyId/1000),order=storyId%1000;
  if(!map.has(heroId))map.set(heroId,[]);
  map.get(heroId).push({kind:'friendship',heroId,storyId,order,dialogId,key:'F'+storyId,title:friendName(storyId),meta:'好感度劇情 · '+String(order).padStart(2,'0')});
 });
 allBirthdayEntries().forEach(entry=>{
  if(!map.has(entry.heroId))map.set(entry.heroId,[]);
  map.get(entry.heroId).push(entry);
 });
 for(const [heroId,items] of map){
  items.sort((a,b)=>(a.kind==='friendship'?a.order:999)-(b.kind==='friendship'?b.order:999));
 }
 return map;
}
function categoryEntries(){
 if(category==='main')return storyMap.filter(x=>x.type==='main'&&x.chapterId===selectedChapter).sort((a,b)=>a.order-b.order).map(x=>({kind:'dialog',key:'D'+x.dialogId,dialogId:x.dialogId,title:storyName(x),chipTitle:storyName(x),smallLabel:'CHAPTER '+x.chapterId+'-'+x.order,meta:'主線劇情 · Chapter '+x.chapterId+'-'+x.order}));
 if(category==='side')return storyMap.filter(x=>x.type==='substory_read'&&String(x.groupId)===String(selectedGroup)).sort((a,b)=>a.order-b.order).map(x=>({kind:'dialog',key:'D'+x.dialogId,dialogId:x.dialogId,title:(lang==='eng'?x.title_en:x.title_ko)||('支線 '+x.order),chipTitle:(lang==='eng'?x.title_en:x.title_ko)||('支線 '+x.order),smallLabel:'SIDE STORY · '+String(x.order).padStart(2,'0'),meta:(lang==='eng'?x.parent_title_en:x.parent_title_ko)||'支線劇情'}));
 if(category==='affection')return (affectionByHero().get(selectedHero)||[]).map(x=>({...x,chipTitle:x.title,smallLabel:x.kind==='friendship'?'好感度 '+String(x.order).padStart(2,'0'):'BIRTHDAY'}));
 return [];
}
function groupRows(){
 const rows=storyMap.filter(x=>x.type==='substory_read');
 const map=new Map();
 rows.forEach(r=>{const key=String(r.groupId);if(!map.has(key))map.set(key,{id:key,title:lang==='eng'?r.parent_title_en:r.parent_title_ko,count:0,first:r.order});const v=map.get(key);v.count++;v.first=Math.min(v.first,r.order);});
 return [...map.values()].sort((a,b)=>Number(a.id)-Number(b.id));
}
function renderSidebar(){
 const list=$('sideList');let html='';
 if(category==='main'){
  $('sidebarKicker').textContent='MAIN STORY';$('sidebarTitle').textContent='Chapter';
  html=Array.from({length:9},(_,i)=>{const id=i+1,count=storyMap.filter(x=>x.type==='main'&&x.chapterId===id).length;return '<button class="side-item '+(selectedChapter===id?'active':'')+'" data-left="'+id+'"><span>Chapter '+id+'</span><small>'+count+'</small></button>'}).join('');
 }else if(category==='side'){
  $('sidebarKicker').textContent='SIDE STORY';$('sidebarTitle').textContent='支線篇章';
  html=groupRows().map(g=>'<button class="side-item '+(String(selectedGroup)===g.id?'active':'')+'" data-left="'+escapeHtml(g.id)+'"><span>'+escapeHtml(g.title)+'</span><small>'+g.count+'</small></button>').join('');
 }else{
  $('sidebarKicker').textContent='AFFECTION STORY';$('sidebarTitle').textContent='角色';
  const all=affectionByHero();html=[...all.keys()].sort((a,b)=>a-b).map(id=>'<button class="side-item '+(selectedHero===id?'active':'')+'" data-left="'+id+'"><span>'+escapeHtml(nameForHero(id))+'</span><small>'+all.get(id).length+'</small></button>').join('');
 }
 list.innerHTML=html||'<p class="sidebar-note">目前沒有可顯示的資料。</p>';
 list.querySelectorAll('[data-left]').forEach(btn=>btn.addEventListener('click',()=>selectSidebar(btn.dataset.left)));
 $('sidebarNote').textContent=category==='main'?'選擇 Chapter 後，上方會列出該章節的所有話數。':category==='side'?'選擇篇章後，上方會列出該支線的各個故事。':'好感度故事依 Story ID 的 Hero ID 分組；生日劇情一併列在角色故事末端。';
}
function selectSidebar(value){
 if(category==='main')selectedChapter=Number(value);
 else if(category==='side')selectedGroup=String(value);
 else selectedHero=Number(value);
 renderSidebar();renderStoryStrip();
}
function renderStoryStrip(){
 storyItems=categoryEntries();
 $('storyStrip').innerHTML=storyItems.length?storyItems.map((x,i)=>'<button class="story-chip '+(activeStory?.key===x.key?'active':'')+'" data-story-index="'+i+'"><small>'+escapeHtml(x.smallLabel||'STORY')+'</small><b>'+escapeHtml(x.chipTitle||x.title)+'</b></button>').join(''):'<div class="sidebar-note">這個分類目前沒有可播放的故事。</div>';
 $('storyStrip').querySelectorAll('[data-story-index]').forEach(btn=>btn.addEventListener('click',()=>openStory(storyItems[Number(btn.dataset.storyIndex)])));
 if(category==='main'){$('readerTitle').textContent='Chapter '+selectedChapter;$('readerSubtitle').textContent=storyItems.length+' 話 · 選擇上方話數開始閱讀';}
 else if(category==='side'){const g=groupRows().find(x=>x.id===String(selectedGroup));$('readerTitle').textContent=g?.title||'支線劇情';$('readerSubtitle').textContent=storyItems.length+' 話 · SIDE STORY';}
 else{$('readerTitle').textContent=nameForHero(selectedHero);$('readerSubtitle').textContent=storyItems.length+' 篇 · 好感度及生日劇情';}
 $('readerKicker').textContent=category==='main'?'MAIN STORY':category==='side'?'SIDE STORY':'AFFECTION STORY';
}
function selectCategory(next){
 if(!loaded){showToast('劇情資料仍在載入');return}
 category=next;selectedChapter=next==='main'?1:null;selectedGroup=next==='side'?(groupRows()[0]?.id??null):null;selectedHero=next==='affection'?[...affectionByHero().keys()].sort((a,b)=>a-b)[0]??null:null;
 activeStory=null;timeline=[];stepIndex=0;
 $('home').hidden=true;$('library').hidden=false;$('sidebar').hidden=false;$('readerEmpty').hidden=false;$('stage').hidden=true;$('controls').hidden=true;
 renderSidebar();renderStoryStrip();
 $('readerEmpty').hidden=false;$('readerEmpty').innerHTML='<div><div class="home-mark">✧</div><b style="display:block;color:#f0e4c8;margin-bottom:8px">選擇一段故事</b><span>從上方的話數清單開始閱讀。</span></div>';
}
function showHome(){
 category='';activeStory=null;timeline=[];stepIndex=0;
 $('home').hidden=false;$('library').hidden=true;$('sidebar').hidden=true;
}
function openStory(item){
 activeStory=item;selectedBranches={};stepIndex=0;
 timeline=buildTimeline(item);
 $('readerEmpty').hidden=true;$('stage').hidden=false;$('controls').hidden=false;
 $('stageCaption').textContent=category==='main'?'MAIN STORY':category==='side'?'SIDE STORY':'AFFECTION STORY';
 $('stageTitle').textContent=item.title||item.chipTitle||'故事';
 $('stageSubtitle').textContent=item.meta||'';
 renderStoryStrip();renderCurrent();
}
function rowVisible(row){
 const text=formatText(textMap[row.textKey]||'');
 return !!text&&(textTypes.has(Number(row.type1))||!!text);
}
function makeLine(row){return {kind:'line',row,text:formatText(textMap[row.textKey]||''),key:row.textKey||''};}
function buildTimeline(item){
 if(item.kind==='birthdayTalk'){
  return (birthdayTalkIndex.talks||[]).filter(x=>item.talkIds.includes(x.id)).sort((a,b)=>a.id-b.id).map(x=>({kind:'talk',talk:x,text:formatText(talkTextMap[x.textKey]||''),key:x.textKey}));
 }
 const rows=rawDialogs.filter(x=>Number(x.id)===Number(item.dialogId)).sort((a,b)=>Number(a.order)-Number(b.order));
 const qs=choices.filter(x=>Number(x.dialogId)===Number(item.dialogId)).sort((a,b)=>a.questionOrder-b.questionOrder);
 const branches=branchMap.filter(x=>Number(x.dialogId)===Number(item.dialogId));
 const questions=new Map(qs.map(x=>[Number(x.questionOrder),x]));
 const ranges=branches.map(x=>({start:Number(x.branchMarkerOrder),end:Number(x.choiceEndOrder??x.lastContentOrder)}));
 const covered=order=>ranges.some(x=>order>=x.start&&order<=x.end);
 const out=[];
 for(const row of rows){
  const order=Number(row.order),block=questions.get(order);
  if(block){
   out.push({kind:'choice',block,row});
   const picked=selectedBranches[order];
   if(picked!==undefined){
    const option=block.options.find(x=>Number(x.slot)===Number(picked));
    const branch=branches.find(x=>Number(x.questionOrder)===order&&Number(x.choiceSlot)===Number(option?.slot));
    if(branch){
     rows.filter(x=>Number(x.order)>=Number(branch.contentFirstOrder)&&Number(x.order)<=Number(branch.lastContentOrder)).sort((a,b)=>a.order-b.order).filter(rowVisible).forEach(x=>out.push(makeLine(x)));
    }
   }
   continue;
  }
  if(covered(order))continue;
  if(rowVisible(row))out.push(makeLine(row));
 }
 // Some extracted choice questions have a metadata node without a corresponding event row.
 for(const block of qs){if(!rows.some(x=>Number(x.order)===Number(block.questionOrder)))out.push({kind:'choice',block,row:null});}
 return out;
}
function progress(){
 const total=timeline.length||0;const now=total?Math.min(stepIndex+1,total):0;
 $('progressText').textContent=total?now+' / '+total:'0 / 0';
 $('progressFill').style.width=total?((now/total)*100)+'%':'0%';
 $('prevBtn').disabled=stepIndex<=0;
 $('nextBtn').disabled=!activeStory||!timeline.length||(timeline[stepIndex]?.kind==='choice'&&selectedBranches[Number(timeline[stepIndex].block.questionOrder)]===undefined);
 $('restartBtn').disabled=!activeStory;
}
function setLine(speaker,text,key,meta){
 $('speaker').textContent=speaker||'旁白';$('lineText').textContent=text||'';
 $('lineMetaLeft').textContent=meta||'';$('lineMetaRight').textContent=key||'';
 $('lineText').scrollTop=0;
}
function renderCurrent(){
 if(!activeStory)return;
 $('stageTitle').textContent=activeStory.title||activeStory.chipTitle||'故事';
 $('stageSubtitle').textContent=activeStory.meta||'';
 const step=timeline[stepIndex];
 $('choicePanel').innerHTML='';
 if(!step){
  setLine('童話圖書館','— 故事完 —','',activeStory.meta||'');
  $('lineText').textContent='這段劇情已閱讀完畢。\n可以使用「重新開始」重讀，或從上方選擇其他話數。';
  progress();return;
 }
 if(step.kind==='line'){
  const row=step.row,speaker=speakerName(row.portraitId);
  setLine(speaker,step.text,step.key,(row.type1Name||'Dialog')+' · Order '+row.order);
 }else if(step.kind==='talk'){
  setLine(nameForHero(step.talk.heroId),step.text,step.key,'DictTalk '+step.talk.id+' · behaviour '+step.talk.behaviour+' · expression '+step.talk.expressionID);
 }else{
  const prompt=step.row?formatText(textMap[step.row.textKey]||''):'';
  const speaker=step.row?speakerName(step.row.portraitId):'旁白';
  setLine(speaker,prompt||'請選擇回應。',step.row?.textKey||'','CHOICE · Order '+step.block.questionOrder);
  $('choicePanel').innerHTML='<div class="choice-prompt">'+escapeHtml(prompt||'選擇一個選項，繼續故事。')+'</div>'+step.block.options.map((o,i)=>{const selected=selectedBranches[Number(step.block.questionOrder)]===Number(o.slot);return '<button class="choice-option '+(selected?'selected':'')+'" data-choice-slot="'+o.slot+'">'+escapeHtml(formatText(textMap[o.textKey]||'（沒有對應文本）'))+'</button>'}).join('');
  $('choicePanel').querySelectorAll('[data-choice-slot]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();selectedBranches[Number(step.block.questionOrder)]=Number(btn.dataset.choiceSlot);timeline=buildTimeline(activeStory);stepIndex=Math.max(0,timeline.findIndex(x=>x.kind==='choice'&&Number(x.block.questionOrder)===Number(step.block.questionOrder))+1);renderCurrent();}));
 }
 progress();
}
function nextStep(){
 if(!activeStory)return;
 const step=timeline[stepIndex];
 if(step?.kind==='choice'&&selectedBranches[Number(step.block.questionOrder)]===undefined){showToast('請先選擇一個選項');return}
 if(stepIndex<timeline.length)stepIndex++;
 renderCurrent();
}
function previousStep(){if(!activeStory)return;stepIndex=Math.max(0,stepIndex-1);renderCurrent();}
function restartStory(){if(!activeStory)return;selectedBranches={};stepIndex=0;timeline=buildTimeline(activeStory);renderCurrent();}
function handleKey(e){
 if($('library').hidden||$('stage').hidden||e.target.matches('input,select,textarea,button'))return;
 if(e.code==='Space'||e.code==='ArrowRight'){e.preventDefault();nextStep()}
 if(e.code==='ArrowLeft'){e.preventDefault();previousStep()}
}
document.querySelectorAll('[data-category]').forEach(btn=>btn.addEventListener('click',()=>selectCategory(btn.dataset.category)));
$('backCategories').addEventListener('click',showHome);
$('language').addEventListener('change',async e=>{try{await loadLanguage(e.target.value)}catch(err){showToast('語言載入失敗：'+err.message);console.error(err)}});
$('prevBtn').addEventListener('click',previousStep);$('nextBtn').addEventListener('click',nextStep);$('restartBtn').addEventListener('click',restartStory);
$('readCard').addEventListener('click',e=>{if(e.target.closest('.choice-panel'))return;nextStep()});
document.addEventListener('keydown',handleKey);
loadAll();
})();