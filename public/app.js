let DB=null;
let dirty=false;
let activeKey=null;
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const today=new Date();
const ym=()=>today.toISOString().slice(0,7);
function monday(d){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); return x.toISOString().slice(0,10); }
function addDays(s,n){ const d=new Date(s+'T00:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function lines(v){return Array.isArray(v)?v:String(v||'').split('\n');}
function setStatus(t){$('#status').textContent=t;}
async function load(){ DB=await (await fetch('/api/data')).json(); initDates(); renderAll(); setStatus('저장됨'); }
async function saveSoon(){ dirty=true; setStatus('저장 중...'); clearTimeout(saveSoon.t); saveSoon.t=setTimeout(saveNow,350); }
async function saveNow(){ if(!DB) return; dirty=false; await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(DB)}); setStatus('저장됨'); }
function initDates(){ $('#otMonth').value=$('#otMonth').value||ym(); $('#cardMonth').value=$('#cardMonth').value||ym(); $('#vehMonth').value=$('#vehMonth').value||ym(); $('#weekScope').value=$('#weekScope').value||'2026-06-22'; }
function renderAll(){ if(document.activeElement && ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return; renderWeekly(); renderOvertime(); renderCards(); renderVehicle(); }
function tab(name){ $$('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name)); $$('.panel').forEach(p=>p.classList.toggle('active',p.id===name)); }
$$('.tabs button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
function periodText(s,e){ const ds=new Date(s+'T00:00:00'), de=new Date(e+'T00:00:00'); return `${ds.getFullYear()}년 ${ds.getMonth()+1}월 ${ds.getDate()}일 ~ ${de.getMonth()+1}월 ${de.getDate()}일`; }
function blankWeekly(scope){ return {start:scope, end:addDays(scope,5), pages:[{id:'p'+Date.now(), title:'새 주간계획', rows:[{group:'', business:'', plan:[''], place:['']}]}]}; }
function blankPage(){ return {id:'p'+Date.now()+Math.random().toString(16).slice(2), title:'새 주간계획', rows:[{group:'', business:'', plan:[''], place:['']}]} }
function weeklyData(){ const scope=$('#weekScope').value; if(!DB.weekly) DB.weekly={}; if(!DB.weekly[scope] || !Array.isArray(DB.weekly[scope].pages)){ DB.weekly[scope]=blankWeekly(scope); saveSoon(); } if(!DB.weekly[scope].start) DB.weekly[scope].start=scope; if(!DB.weekly[scope].end) DB.weekly[scope].end=addDays(DB.weekly[scope].start,5); return DB.weekly[scope]; }
function rowsWithSpan(rows){ const counts={}; rows.forEach(r=>{ if(r.group) counts[r.group]=(counts[r.group]||0)+1; }); const seen={}; return rows.map((r,i)=>{ const show=r.group&&!seen[r.group]; if(r.group)seen[r.group]=true; return {...r,showGroup:show,span:show?counts[r.group]:0,_i:i}; }); }
function renderWeekly(){
  const w=weeklyData();
  const box=$('#weeklyEditor');
  box.innerHTML=`<div class="doc-tabs">
    ${w.pages.map((p,i)=>`<button class="${i===0?'active':''}" data-page="${i}">${i+1}. ${esc(p.title||'새 주간계획')}</button>`).join('')}
    <button class="add-page" id="addWeeklyPage">+ 주간계획표 추가</button>
  </div><div class="weekly-form"></div>`;
  $$('.doc-tabs button[data-page]').forEach(b=>b.onclick=()=>{ $$('.doc-tabs button[data-page]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderWeeklyPage(Number(b.dataset.page)); });
  $('#addWeeklyPage').onclick=()=>{ w.pages.push(blankPage()); renderWeekly(); saveSoon(); };
  renderWeeklyPage(0);
}
function renderWeeklyPage(pi){
  const w=weeklyData();
  if(!w.pages[pi]) pi=0;
  const p=w.pages[pi];
  const rows=rowsWithSpan(p.rows);
  const form=$('.weekly-form');
  form.innerHTML=`<div class="weekly-page-edit">
    <div class="edit-head simple-head"><h2>주간계획 입력</h2><div class="page-tools"><button data-delpage="${pi}">현재 주간계획표 삭제</button></div></div>
    <div class="meta-edit form-meta">
      <label>제목/팀명 <input data-week="title" data-page="${pi}" value="${esc(p.title||'')}"></label>
      <label>시작일 <input type="date" data-week="start" value="${esc(w.start)}"></label>
      <label>종료일 <input type="date" data-week="end" value="${esc(w.end)}"></label>
    </div>
    <p class="editor-note">결재칸은 인쇄/PDF 화면에만 표시됩니다. 여기서는 실제 표에 들어갈 제목, 날짜, 구분, 사업, 업무계획, 담당자 및 장소만 입력합니다.</p>
    <table class="weekly-edit-table"><colgroup><col class="gcol"><col class="bcol"><col class="pcol"><col class="rcol"></colgroup><thead><tr><th>구분</th><th>사 업</th><th>업 무 계 획</th><th>담당자 및 장소</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.showGroup?`<td class="vertical" rowspan="${r.span}"><textarea data-week="row" data-page="${pi}" data-row="${r._i}" data-field="group">${esc(r.group)}</textarea></td>`:''}${!r.group?`<td class="vertical"><textarea data-week="row" data-page="${pi}" data-row="${r._i}" data-field="group">${esc(r.group)}</textarea></td>`:''}<td class="biz"><textarea data-week="row" data-page="${pi}" data-row="${r._i}" data-field="business">${esc(r.business)}</textarea></td><td><textarea class="plan" data-week="row" data-page="${pi}" data-row="${r._i}" data-field="plan">${esc(lines(r.plan).join('\n'))}</textarea></td><td><textarea data-week="row" data-page="${pi}" data-row="${r._i}" data-field="place">${esc(lines(r.place).join('\n'))}</textarea></td></tr>`).join('')}</tbody></table>
    <div class="mini-actions"><button data-addrow="${pi}">행 추가</button><button data-delrow="${pi}">마지막 행 삭제</button></div>
  </div>`;
  bindWeekly();
}
function bindWeekly(){
  $$('[data-week]').forEach(el=>{
    el.onfocus=()=>activeKey='weekly';
    el.oninput=()=>{
      const w=weeklyData();
      const pi=Number(el.dataset.page||0);
      if(el.dataset.week==='title') w.pages[pi].title=el.value;
      if(el.dataset.week==='start') w.start=el.value;
      if(el.dataset.week==='end') w.end=el.value;
      if(el.dataset.week==='row'){
        const r=w.pages[pi].rows[Number(el.dataset.row)];
        const f=el.dataset.field;
        r[f]=(f==='plan'||f==='place')?el.value.split('\n'):el.value;
      }
      saveSoon();
    };
    el.onblur=()=>{activeKey=null;};
  });
  $$('[data-addrow]').forEach(b=>b.onclick=()=>{weeklyData().pages[Number(b.dataset.addrow)].rows.push({group:'',business:'',plan:[''],place:['']}); renderWeeklyPage(Number(b.dataset.addrow)); saveSoon();});
  $$('[data-delrow]').forEach(b=>b.onclick=()=>{const p=weeklyData().pages[Number(b.dataset.delrow)]; if(p.rows.length>1)p.rows.pop(); renderWeeklyPage(Number(b.dataset.delrow)); saveSoon();});
  $$('[data-delpage]').forEach(b=>b.onclick=()=>{ const w=weeklyData(); const pi=Number(b.dataset.delpage); if(w.pages.length<=1){ alert('주간계획표는 최소 1개가 필요합니다.'); return; } if(confirm('현재 주간계획표를 삭제할까요?')){ w.pages.splice(pi,1); renderWeekly(); saveSoon(); } });
}
function inputCell(type,scope,id,field,value,kind='text',opts=[]){ if(kind==='select') return `<select data-t="${type}" data-s="${scope}" data-id="${id}" data-f="${field}">${opts.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select>`; if(kind==='textarea') return `<textarea data-t="${type}" data-s="${scope}" data-id="${id}" data-f="${field}">${esc(value)}</textarea>`; return `<input type="${kind}" data-t="${type}" data-s="${scope}" data-id="${id}" data-f="${field}" value="${esc(value)}">`; }
function bindGrid(){ $$('[data-t]').forEach(el=>{ el.onfocus=()=>activeKey='grid'; el.oninput=()=>{ const rows=DB[el.dataset.t][el.dataset.s]; const r=rows.find(x=>x.id===el.dataset.id); r[el.dataset.f]=el.value; saveSoon(); }; el.onchange=el.oninput; el.onblur=()=>activeKey=null; }); $$('.del').forEach(b=>b.onclick=()=>{ const a=b.dataset; DB[a.t][a.s]=DB[a.t][a.s].filter(x=>x.id!==a.id); renderAll(); saveSoon();}); }
async function add(type,scope){ await fetch('/api/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,scope})}); DB=await (await fetch('/api/data')).json(); renderAll(); }
function renderOvertime(){ const s=$('#otMonth').value; const data=(DB.overtime[s]||[]).sort((a,b)=>(a.workDate||'').localeCompare(b.workDate||'')); $('#overtimeTable').innerHTML=`<table class="grid"><thead><tr>${['소속','성명','근무일','시작','종료','휴게(분)','시간','내용','비고','삭제'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${data.map(r=>`<tr><td>${inputCell('overtime',s,r.id,'department',r.department)}</td><td>${inputCell('overtime',s,r.id,'name',r.name)}</td><td>${inputCell('overtime',s,r.id,'workDate',r.workDate,'date')}</td><td>${inputCell('overtime',s,r.id,'startTime',r.startTime,'time')}</td><td>${inputCell('overtime',s,r.id,'endTime',r.endTime,'time')}</td><td>${inputCell('overtime',s,r.id,'breakMinutes',r.breakMinutes||0,'number')}</td><td>${calcHours(r)}</td><td>${inputCell('overtime',s,r.id,'reason',r.reason,'textarea')}</td><td>${inputCell('overtime',s,r.id,'note',r.note,'textarea')}</td><td><button class="del" data-t="overtime" data-s="${s}" data-id="${r.id}">삭제</button></td></tr>`).join('')}</tbody></table>`; bindGrid(); }
function calcHours(r){ const a=r.startTime,b=r.endTime; if(!a||!b)return ''; let [ah,am]=a.split(':').map(Number),[bh,bm]=b.split(':').map(Number); let m=bh*60+bm-ah*60-am; if(m<0)m+=1440; m-=Number(r.breakMinutes)||0; return (Math.max(0,m)/60).toFixed(1); }
function renderCards(){ const s=$('#cardMonth').value; const data=DB.cards[s]||[]; $('#cardTable').innerHTML=`<table class="grid"><thead><tr>${['사용일','구분','카드명','사용처','사용내역','금액','계정과목','증빙','비고','삭제'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${data.map(r=>`<tr><td>${inputCell('cards',s,r.id,'date',r.date,'date')}</td><td>${inputCell('cards',s,r.id,'type',r.type,'select',['보조금','자부담','후원금'])}</td><td>${inputCell('cards',s,r.id,'card',r.card)}</td><td>${inputCell('cards',s,r.id,'vendor',r.vendor)}</td><td>${inputCell('cards',s,r.id,'detail',r.detail,'textarea')}</td><td>${inputCell('cards',s,r.id,'amount',r.amount,'number')}</td><td>${inputCell('cards',s,r.id,'account',r.account)}</td><td>${inputCell('cards',s,r.id,'proof',r.proof)}</td><td>${inputCell('cards',s,r.id,'note',r.note,'textarea')}</td><td><button class="del" data-t="cards" data-s="${s}" data-id="${r.id}">삭제</button></td></tr>`).join('')}</tbody></table>`; bindGrid(); }
function renderVehicle(){ const s=$('#vehMonth').value; const data=(DB.vehicle[s]||[]).sort((a,b)=>(a.date||'').localeCompare(b.date||'')); $('#vehicleTable').innerHTML=`<table class="grid"><thead><tr>${['사용일','차량','운전자','행선지','사용목적','출발','복귀','출발km','도착km','운행km','주유량','비고','삭제'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${data.map(r=>`<tr><td>${inputCell('vehicle',s,r.id,'date',r.date,'date')}</td><td>${inputCell('vehicle',s,r.id,'car',r.car)}</td><td>${inputCell('vehicle',s,r.id,'driver',r.driver)}</td><td>${inputCell('vehicle',s,r.id,'dest',r.dest)}</td><td>${inputCell('vehicle',s,r.id,'purpose',r.purpose,'textarea')}</td><td>${inputCell('vehicle',s,r.id,'startTime',r.startTime,'time')}</td><td>${inputCell('vehicle',s,r.id,'endTime',r.endTime,'time')}</td><td>${inputCell('vehicle',s,r.id,'startKm',r.startKm,'number')}</td><td>${inputCell('vehicle',s,r.id,'endKm',r.endKm,'number')}</td><td>${(Number(r.endKm)||0)-(Number(r.startKm)||0)||''}</td><td>${inputCell('vehicle',s,r.id,'fuel',r.fuel)}</td><td>${inputCell('vehicle',s,r.id,'note',r.note,'textarea')}</td><td><button class="del" data-t="vehicle" data-s="${s}" data-id="${r.id}">삭제</button></td></tr>`).join('')}</tbody></table>`; bindGrid(); }
function bumpMonth(id,n){ const el=$('#'+id); const [y,m]=el.value.split('-').map(Number); const d=new Date(y,m-1+n,1); el.value=d.toISOString().slice(0,7); renderAll(); }
$$('[data-prev]').forEach(b=>b.onclick=()=>bumpMonth(b.dataset.prev,-1)); $$('[data-next]').forEach(b=>b.onclick=()=>bumpMonth(b.dataset.next,1));
$('#prevWeek').onclick=()=>{$('#weekScope').value=addDays($('#weekScope').value,-7); renderWeekly();}; $('#nextWeek').onclick=()=>{$('#weekScope').value=addDays($('#weekScope').value,7); renderWeekly();}; $('#weekScope').onchange=()=>{$('#weekScope').value=monday($('#weekScope').value); renderWeekly();};
$('#addOvertime').onclick=()=>add('overtime',$('#otMonth').value); $('#addCard').onclick=()=>add('cards',$('#cardMonth').value); $('#addVehicle').onclick=()=>add('vehicle',$('#vehMonth').value);
$('#printWeekly').onclick=async()=>{await saveNow(); window.open(`/print/weekly?scope=${$('#weekScope').value}`,'_blank');};
$('#downloadOvertime').onclick=async()=>{await saveNow(); location.href=`/download/overtime.xlsx?month=${$('#otMonth').value}`;}; $('#downloadCards').onclick=async()=>{await saveNow(); location.href=`/download/cards.xlsx?month=${$('#cardMonth').value}`;}; $('#downloadVehicle').onclick=async()=>{await saveNow(); location.href=`/download/vehicle.xlsx?month=${$('#vehMonth').value}`;};
['otMonth','cardMonth','vehMonth'].forEach(id=>$('#'+id).onchange=renderAll);
new EventSource('/events').onmessage=async ev=>{ if(activeKey || dirty) return; DB=await (await fetch('/api/data')).json(); renderAll(); setStatus('다른 사용자 변경 반영'); };
load();
