const socket=io();let rows=[];const tbody=document.querySelector('tbody'),empty=document.querySelector('#empty');
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function fmt(m){m=Number(m)||0;return `${Math.floor(m/60)}시간${m%60?` ${m%60}분`:''}`}
function summary(){document.querySelector('#count').textContent=rows.length;document.querySelector('#total').textContent=fmt(rows.reduce((a,r)=>a+(r.totalMinutes||0),0));empty.style.display=rows.length?'none':'block'}
function cell(r,key,type='text'){return `<td data-id="${r.id}" data-key="${key}"><input type="${type}" value="${esc(r[key])}" aria-label="${key}"></td>`}
function rowHtml(r,i){return `<tr data-row="${r.id}"><td>${i+1}</td>${cell(r,'department')}${cell(r,'name')}${cell(r,'workDate','date')}${cell(r,'startTime','time')}${cell(r,'endTime','time')}${cell(r,'breakMinutes','number')}<td class="calc">${fmt(r.totalMinutes)}</td>${cell(r,'reason')}${cell(r,'note')}<td><button class="delete" aria-label="삭제">삭제</button></td></tr>`}
function render(){tbody.innerHTML=rows.map(rowHtml).join('');summary()}
function markSaved(text='자동 저장됨'){document.querySelector('#saved').textContent=text}
socket.on('connect',()=>{document.querySelector('#connection').textContent='실시간 연결';document.querySelector('#dot').style.background='#16a36a'});socket.on('disconnect',()=>{document.querySelector('#connection').textContent='재연결 중';document.querySelector('#dot').style.background='#f59e0b'});
socket.on('rows:init',d=>{rows=d;render();markSaved()});
socket.on('row:added',r=>{if(!rows.some(x=>x.id===r.id)){rows.push(r);render();document.querySelector(`[data-row="${r.id}"]`)?.classList.add('row-new')}});
socket.on('row:updated',r=>{const i=rows.findIndex(x=>x.id===r.id);if(i>=0){rows[i]=r;const active=document.activeElement;const editing=active?.closest('tr')?.dataset.row===r.id;if(!editing)render();else{active.closest('tr').querySelector('.calc').textContent=fmt(r.totalMinutes);summary()}}});
socket.on('row:deleted',id=>{rows=rows.filter(r=>r.id!==id);render()});
socket.on('cell:focused',({id,key,socketId})=>document.querySelector(`td[data-id="${id}"][data-key="${key}"]`)?.classList.add('editing'));
socket.on('cell:blurred',({id,key})=>document.querySelector(`td[data-id="${id}"][data-key="${key}"]`)?.classList.remove('editing'));
document.querySelector('#add').onclick=()=>socket.emit('row:add',{department:'',name:'',workDate:new Date().toISOString().slice(0,10),startTime:'18:00',endTime:'20:00',breakMinutes:0,reason:'',note:''},res=>{if(res?.ok){const el=document.querySelector(`[data-row="${res.row.id}"] input`);el?.focus()}});
tbody.addEventListener('focusin',e=>{const td=e.target.closest('td[data-key]');if(td)socket.emit('cell:focus',{id:td.dataset.id,key:td.dataset.key})});
tbody.addEventListener('focusout',e=>{const td=e.target.closest('td[data-key]');if(td)socket.emit('cell:blur',{id:td.dataset.id,key:td.dataset.key})});
tbody.addEventListener('change',e=>{if(!e.target.matches('input'))return;const tr=e.target.closest('tr'),id=tr.dataset.row,row=rows.find(r=>r.id===id);if(!row)return;const key=e.target.closest('td').dataset.key;row[key]=e.target.type==='number'?Number(e.target.value):e.target.value;markSaved('저장 중…');socket.emit('row:update',row,res=>{if(res?.ok){const i=rows.findIndex(r=>r.id===id);rows[i]=res.row;tr.querySelector('.calc').textContent=fmt(res.row.totalMinutes);summary();markSaved()}})});
tbody.addEventListener('click',e=>{if(!e.target.classList.contains('delete'))return;const id=e.target.closest('tr').dataset.row;if(confirm('이 행을 삭제할까요?'))socket.emit('row:delete',id)});
document.querySelector('#print').onclick=()=>window.print();
