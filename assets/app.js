const $=id=>document.getElementById(id);
let dialogs=[],groups=[],choices=[],branchMap=[],chapters=[],enums=[],filtered=[],page=0;
const PAGE=200,selectedBranches={},textCache={},textMap={},portraitCache={},portraitMap={};
let currentLanguage='kor';
const localizedFiles={kor:'TextAsset/Text_Dialog_loc_kor.txt',eng:'TextAsset/Text_Dialog_loc_eng.txt'};
function resolveText(key){return textMap[key]||'';}
function resolvePortrait(id){return portraitMap['Portrait_Name_'+String(id)]||'';}
function parseLocalization(raw){const map={};raw.replace(/^\uFEFF/,'').split(/\r?\n/).forEach(line=>{const tab=line.indexOf('\t');if(tab>0)map[line.slice(0,tab)]=line.slice(tab+1)});return map;}
function formatText(value){return esc(String(value??'').replace(/\\\\r/g,'\n').replace(/\\\\n/g,'\n'));}
async function loadTextLanguage(lang='kor'){
 currentLanguage=lang;
 if(!textCache[lang]){
  const [dialogResponse,portraitResponse]=await Promise.all([
   fetch(localizedFiles[lang]),fetch('TextAsset/Text_Portrait_loc_'+lang+'.txt')
  ]);
  if(!dialogResponse.ok)throw Error('Text_Dialog_loc_'+lang+'.txt');
  if(!portraitResponse.ok)throw Error('Text_Portrait_loc_'+lang+'.txt');
  const [dialogRaw,portraitRaw]=await Promise.all([dialogResponse.text(),portraitResponse.text()]);
  textCache[lang]=parseLocalization(dialogRaw);portraitCache[lang]=parseLocalization(portraitRaw);
 }
 Object.keys(textMap).forEach(k=>delete textMap[k]);Object.assign(textMap,textCache[lang]);
 Object.keys(portraitMap).forEach(k=>delete portraitMap[k]);Object.assign(portraitMap,portraitCache[lang]);
 $('languageStatus').textContent='已載入 '+lang.toUpperCase()+' · 對話 '+Object.keys(textMap).length.toLocaleString()+' 筆／角色 '+Object.keys(portraitMap).length.toLocaleString()+' 筆';
}
const nfmt=n=>Number(n||0).toLocaleString();
async function load(){
 const files=['summary','dict-dialogs','dialog-groups','choice-blocks','branch-execution-map','chapters','dialog-type-enums'];
 const vals=await Promise.all(files.map(x=>fetch(`data/${x}.json`).then(r=>{if(!r.ok)throw Error(x);return r.json()})));
 const [sum,d,g,c,b,ch,e]=vals;dialogs=d;groups=g;choices=c;branchMap=b;chapters=ch;enums=e;
 $('stats').innerHTML=[['dialogRecords','Dialog records'],['dialogIds','Dialog IDs'],['choiceBlocks','Choice blocks'],['branchExecutionRows','Branch rows']].map(([k,l])=>`<div><b>${nfmt(sum[k])}</b><span>${l}</span></div>`).join('');
 chapters.filter(x=>x.id>0).forEach(c=>{const o=document.createElement('option');o.value=c.dialogIds[0]??'';o.textContent=`${c.label||c.nameKey} · Dialog ${c.dialogIds.join(', ')||'—'}`;$('chapter').append(o)});
 const t1=[...new Map(dialogs.map(x=>[x.type1,x.type1Name])).entries()].sort((a,b)=>a[0]-b[0]);
 t1.forEach(([v,n])=>{let o=document.createElement('option');o.value=v;o.textContent=`${v} · ${n}`;$('type1').append(o)});
 renderEnums();await loadTextLanguage('kor');$('language').value='kor';$('recordSummary').textContent='資料已載入，請輸入 ID 或選擇章節。';
}
function search(){
 const id=$('dialogId').value.trim(),key=$('textKey').value.trim().toLowerCase(),t1=$('type1').value;
 filtered=dialogs.filter(x=>(!id||x.id===Number(id))&&(!key||String(x.textKey).toLowerCase().includes(key)||resolveText(x.textKey).toLowerCase().includes(key)||String(x.strValue).toLowerCase().includes(key))&&(!t1||x.type1===Number(t1)));
 page=0;const chosen=id?Number(id):null;$('activeId').textContent=chosen===null?'篩選結果':`Dialog ${chosen}`;renderRecords();renderChoices(chosen);renderFlow(chosen);
}
function renderRecords(){
 const start=page*PAGE,part=filtered.slice(start,start+PAGE);
 $('recordSummary').textContent=`${nfmt(filtered.length)} 筆符合；每頁最多 ${PAGE} 筆`;
 $('records').innerHTML=part.length?part.map(x=>`<tr><td>${x.order}</td><td>${esc(x.type1Name)} <small>(${x.type1})</small></td><td>${esc(x.type2Name)} <small>(${x.type2})</small></td><td>${esc(x.type3Name)} <small>(${x.type3})</small></td><td><span class="speaker-name">${esc(resolvePortrait(x.portraitId)||'未知角色')}</span><small class="key">ID ${esc(x.portraitId)}</small></td><td><div class="localized-text">${formatText(resolveText(x.textKey))||'<span class="muted">（無對應文本）</span>'}</div><small class="key">${esc(x.textKey)}</small></td><td>${x.delay}</td><td>${esc(x.strValue)}</td></tr>`).join(''):`<tr><td colspan="8">沒有符合的記錄。</td></tr>`;
 $('pageInfo').textContent=`${filtered.length?start+1:0}–${Math.min(start+PAGE,filtered.length)} / ${filtered.length}`;$('prev').disabled=page===0;$('next').disabled=start+PAGE>=filtered.length;
}
function renderChoices(id){
 if(id===null){$('choices').innerHTML='<p class="muted">輸入 Dialog ID 以檢視其選項分支。</p>';return}
 const bs=choices.filter(x=>x.dialogId===id),ex=branchMap.filter(x=>x.dialogId===id);
 $('choices').innerHTML=bs.length?bs.map(b=>{const ee=ex.filter(e=>e.questionOrder===b.questionOrder),q=dialogs.find(x=>x.id===id&&x.order===b.questionOrder);return `<article class="choice-card"><div class="choice-title"><span>Question · Order ${b.questionOrder}</span><span>${b.optionCount} options</span></div><div class="localized-text">${formatText(resolveText(q?.textKey))}</div><small class="key">${esc(q?.textKey||'')}</small><div class="choice-meta">ChoiceEnd: ${b.choiceEndOrder??'未找到'} · 槽位對應：${b.slotMatch?'一致':'需檢查'}</div><div class="branches">${b.options.map(o=>{const e=ee.find(x=>x.choiceSlot===o.slot);return `<div class="branch"><b>Branch ${o.slot} · Order ${o.branchOrder??'—'}</b><span class="localized-text">${formatText(resolveText(o.textKey))||'（無對應文本）'}</span><small class="key">${esc(o.textKey)}</small><small><br>內容 ${e?.contentFirstOrder??'—'}–${e?.lastContentOrder??'—'} · 邊界 ${e?.nextBoundaryOrder??'—'}</small></div>`}).join('')}</div><div class="choice-meta">共通後續 Order：${ee[0]?.resumeAfterEndOrder??'—'} · ChoiceEnd ${b.choiceEndPresent?'存在':'未找到'}</div></article>`}).join(''):'<p class="muted">此 Dialog ID 沒有辨識到 ChoiceQuestion。</p>';
}
function renderFlow(id){
 const host=$('flowGraph');
 if(id===null){host.innerHTML='<p class="muted">輸入 Dialog ID 後，這裡會顯示可操作的劇情路徑。</p>';return}
 const rows=dialogs.filter(x=>x.id===id).sort((a,b)=>a.order-b.order);
 const bs=choices.filter(x=>x.dialogId===id).sort((a,b)=>a.questionOrder-b.questionOrder);
 const ex=branchMap.filter(x=>x.dialogId===id);
 if(!rows.length){host.innerHTML='<p class="muted">找不到此 Dialog ID。</p>';return}
 const branchRanges=ex.map(x=>({start:x.branchMarkerOrder,end:x.choiceEndOrder??x.lastContentOrder}));
 const questions=new Map(bs.map(b=>[b.questionOrder,b]));
 const questionOrders=new Set(bs.map(b=>b.questionOrder));
 const covered=o=>branchRanges.some(r=>o>=r.start&&o<=r.end);
 const events=[];
 for(const r of rows){if(questionOrders.has(r.order)){events.push({kind:'choice',value:questions.get(r.order)});continue}if(!covered(r.order))events.push({kind:'line',value:r})}
 host.innerHTML=`<div class="flow-toolbar"><span>${rows.length} 筆節點資料 · ${bs.length} 個選項節點</span><button class="ghost" id="flowReset">重設所有選擇</button></div><div class="flow-track">${events.map(ev=>ev.kind==='line'?flowLine(ev.value):flowChoice(ev.value,ex)).join('')}</div><p class="flow-footnote">分支內容依現有靜態執行索引推導；選項按鈕只用來切換檢視路徑，不會執行遊戲程式。巢狀分支及特殊跳轉仍需另行驗證。</p>`;
 $('flowReset').addEventListener('click',()=>{bs.forEach(b=>delete selectedBranches[`${id}:${b.questionOrder}`]);renderFlow(id)});
}
function flowLine(r){
 const label=[r.type1Name,r.type2Name,r.type3Name].filter(Boolean).join(' / ');
 return `<div class="flow-line"><span class="flow-order">ORDER ${r.order}</span><div><b>${esc(resolvePortrait(r.portraitId)||label||'Dialog record')}</b><div class="localized-text">${formatText(resolveText(r.textKey))}</div><small class="key">${esc(r.textKey||'')}</small>${r.strValue?`<small>${esc(r.strValue)}</small>`:''}</div></div>`;
}
function flowChoice(b,ex){
 const key=`${b.dialogId}:${b.questionOrder}`,picked=selectedBranches[key]??0,ee=ex.filter(x=>x.questionOrder===b.questionOrder);
 const options=b.options.map((o,i)=>{const e=ee.find(x=>x.choiceSlot===o.slot);return `<button class="flow-option ${picked===i?'selected':''}" data-q="${b.questionOrder}" data-i="${i}"><b>選項 ${i+1}</b><span class="localized-text">${formatText(resolveText(o.textKey))||'（無對應文本）'}</span><small class="key">${esc(o.textKey)}</small><small>Order ${e?.contentFirstOrder??'—'}–${e?.lastContentOrder??'—'}</small></button>`}).join('');
 const o=b.options[picked],e=o&&ee.find(x=>x.choiceSlot===o.slot);
 const segment=e?dialogs.filter(x=>x.id===b.dialogId&&x.order>=e.contentFirstOrder&&x.order<=e.lastContentOrder).sort((a,b)=>a.order-b.order):[];
 const content=segment.length?segment.map(r=>`<div class="flow-branch-line"><span>O${r.order}</span><b>${esc(resolvePortrait(r.portraitId)||r.type1Name||'Record')}</b><span><span class="localized-text">${formatText(resolveText(r.textKey))}</span><small class="key">${esc(r.textKey||'')}</small></span></div>`).join(''):'<div class="muted">此分支區間沒有可顯示的中間記錄。</div>';
 return `<section class="flow-choice"><div class="flow-choice-head"><span class="flow-order">ORDER ${b.questionOrder}</span><b>選項決策 · ${b.optionCount} 個選項</b><span class="flow-end">ChoiceEnd ${b.choiceEndOrder??'—'}</span></div><div class="flow-options">${options}</div><div class="flow-selected"><b>目前檢視：選項 ${picked+1} · ${esc(o?.textKey||'')}</b><div class="localized-text">${formatText(resolveText(o?.textKey))}</div><div class="flow-branch-content">${content}</div><div class="flow-merge">↳ 分支結束後匯合：Order ${e?.resumeAfterEndOrder??'未確認'}</div></div></section>`;
}
function renderEnums(){const by={};enums.forEach(x=>(by[x.enum]??=[]).push(x));$('enums').innerHTML=Object.entries(by).map(([name,items])=>`<div class="enum-group"><b>${esc(name)}</b><div class="enum-values">${items.map(x=>`<span>${x.value}: ${esc(x.name)}</span>`).join('')}</div></div>`).join('')}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('flowGraph').addEventListener('click',e=>{const btn=e.target.closest('[data-q]');if(!btn)return;const id=Number($('dialogId').value),q=Number(btn.dataset.q);selectedBranches[`${id}:${q}`]=Number(btn.dataset.i);renderFlow(id)});
$('language').addEventListener('change',async e=>{try{await loadTextLanguage(e.target.value);if($('dialogId').value.trim())search();else if(filtered.length)renderRecords()}catch(err){$('languageStatus').textContent='文本載入失敗：'+err.message;console.error(err)}});
$('search').addEventListener('click',search);
$('reset').addEventListener('click',()=>{$('dialogId').value='';$('textKey').value='';$('type1').value='';$('chapter').value='';filtered=[];page=0;$('activeId').textContent='未選擇';$('records').innerHTML='<tr><td colspan="8">請輸入搜尋條件。</td></tr>';$('choices').innerHTML='<p class="muted">選擇 Dialog ID 以檢視分支。</p>';$('flowGraph').innerHTML='<p class="muted">輸入 Dialog ID 後，這裡會顯示可操作的劇情路徑。</p>';$('recordSummary').textContent='已重設。'});
$('chapter').addEventListener('change',e=>{if(e.target.value){$('dialogId').value=e.target.value;$('type1').value='';$('textKey').value='';search()}});
$('prev').addEventListener('click',()=>{if(page>0){page--;renderRecords()}});
$('next').addEventListener('click',()=>{if((page+1)*PAGE<filtered.length){page++;renderRecords()}});
$('dialogId').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
$('textKey').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
load().catch(e=>{$('recordSummary').textContent='載入失敗：'+e.message+'。請透過本機 HTTP server 或 GitHub Pages 開啟。';console.error(e)});
