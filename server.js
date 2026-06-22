const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const helmet = require('helmet');
const ExcelJS = require('exceljs');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e6 });
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'rows.json');
const TEMPLATE_DIR = path.join(__dirname, 'templates');

fs.mkdirSync(DATA_DIR, { recursive: true });
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '500kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function id() { return crypto.randomUUID(); }
function emptyData() { return { version: 3, seededWeekly20260622: false, overtime: {}, weekly: {}, vehicle: {} }; }
function seedWeeklyRows() {
  const mk = (section, business, plan, ownerPlace = '', note = '') => ({ id: id(), section, business, plan, ownerPlace, note, updatedAt: new Date().toISOString() });
  return [
    mk('노년사회화교육팀','노년사회화교육','DSB방송단 6월 간담회 실시(수, 11시)\n슬어생 5~6회기 실시(수,금 14시)\n덕진동치매안심마을 운영위원회의 참석(수 15시)\n선배시민 권역 간담회 참석(목, 16시)\n월드컵 단체 시청(목, 10시)\n2분기 신입회원 환영회(금, 10:30)\n사회복지현장실습 실시(금, 13:30)','노년사회화\n문승영(덕진주민센터)\n김수희\n사랑방 / 2층 믿음방 / 3층 두란노'),
    mk('노년사회화교육팀','건강관리','인지향상프로그램(월, 14:00~15:00)\n촉탁의 방문진료(수, 13:40~)\n낙상예방 프로그램 2회차 참여자 모집','복종현, 윤숙영'),
    mk('노년사회화교육팀','작은도서관','상반기 문화시설 이용자현황 제출(시립)\n전북·전주 작은도서관 운영협의회 회비 납부','형이삭'),
    mk('지역복지팀','노인일자리','공원관리, 복지시설 사업단 활동물품 구입(주중)\n초록정원관리사 혹서기 교육 사업계획서 작성(주중)\n시니어 한끼 지원사업 참여자 만족도 조사서 제출(주중)\n국민연금 수급자 공감여행 결과 및 정산보고 제출(주중)','노인일자리\n허혜경, 이혜수\n김효진'),
    mk('지역복지팀','사례관리 및 지역사회돌봄','노인자원봉사활성화 지원사업 6월 결과보고(주중)\n함께헤어 봉사단 무료 이미용 진행(화, 09:30~11:30)\n함께헤어 봉사단 이미용 봉사 협약식(화, 09:30)\n희망여름 착착착 준비(주중)\n사례관리 및 자원봉사자 관리(주중)','정인석'),
    mk('지역복지팀','노인복지관 연계프로그램','경로당 파견 프로그램 모니터링 및 강의일지 확인(주중)\n경로당 영양쿠킹클래스 1회기 진행(송천사랑 24일, 수, 14시)','조혜숙'),
    mk('지역복지팀','기획홍보 및 지역복지총괄','금암노인복지관 25주년 행사 참가(목, 10:00)\n선배시민 전주권역 간담회 참석(목, 16:00~)\n늘푸른합창단 개정면행정복지센터 공연(금, 9시10분~)\n복지관 홍보(주중)','중부비전센터, 카페토브\n토: 김수희, 문승영, 정인석'),
    mk('지역복지팀','기타','휴가: 김수희(화), 문승영(화, 오후), 형이삭(수)',''),
    mk('총무팀','서무·회계','6월 직원 급여 및 퇴직금 이체(6/25)\n2분기 운영위원회 관련 회계 서류 작성(~6/24)\n상반기 연차사용촉진 관련서류 작성','임미정, 최혜림'),
    mk('총무팀','시설관리','안전훈련 및 소방훈련(6/22)\n복지관 3층 복도 청소(6/26)\n사회복무요원 복무예정자 인수(6/26)\n전기 설비 정기 점검','최정환'),
    mk('영양팀','경로식당','경로당 쿠킹클래스 1회기(송천사랑, 오이피클)\n3분기 생신잔치\n조리종사자 주휴수당 및 급여기안 작성','이경님, 이기순'),
    mk('아중노인복지관','노년사회화 / 분관총괄','깨끗한 세상 소득 2차(화)\n집단상담 다시 피어나는 청춘 5회기 종결(수, 10시)\n집단상담 프로그램 포토북 제작(주중)\n분관 운영위원회 및 1차 추경예산 자료 작성(주중)\nFIFA 북중미 월드컵 대한민국 대표팀 단체 시청(목, 10시)','엄라영, 최유리'),
    mk('아중노인복지관','경로식당','조리종사자 급여 주휴수당 기안 작성\n상반기 생신잔치 실시(목)\n6.26 대체식 포장 및 제공','윤재희\n윤재희, 강정미'),
    mk('아중노인복지관','토당직 / 휴가','토당직(아중): 윤재희\n휴가: 엄라영(화, 오후 2h), 강정미(금)',''),
    mk('(노·지·총·영)','부장','운영위원회 자료 취합 및 정리(주중)\n늘푸른합창단 개정면 공연 버스지원(금 09:10)\n복지관업무 총괄(후원, 후백제교육관련준비, 실습)','개정면행정복지센터'),
    mk('(노·지·총·영)','사무국장','전주연탄은행 밥차 검사 지원(월)\n금암노인복지관 25주년 행사 참가(목, 10:00)\n3층 돌돌이 바닥청소(금, 14:00)\n지역사회 버스지원(토)\n직원 업무관리 및 사업주훈련 준비','관장, 국장, 부장, 김팀장')
  ];
}
function applySeed(data) {
  data.version = Math.max(Number(data.version || 1), 3);
  if (!data.seededWeekly20260622) {
    data.weekly ||= {};
    if (!Array.isArray(data.weekly['2026-06-22']) || data.weekly['2026-06-22'].length === 0) data.weekly['2026-06-22'] = seedWeeklyRows();
    data.seededWeekly20260622 = true;
  }
  return data;
}
function migrate(parsed) {
  if (Array.isArray(parsed)) {
    const data = emptyData();
    for (const row of parsed) {
      const month = /^\d{4}-\d{2}/.test(row.workDate || '') ? row.workDate.slice(0, 7) : new Date().toISOString().slice(0, 7);
      (data.overtime[month] ||= []).push(row);
    }
    return data;
  }
  return { ...emptyData(), ...parsed, overtime: parsed.overtime || {}, weekly: parsed.weekly || {}, vehicle: parsed.vehicle || {} };
}
function loadData() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const data = applySeed(migrate(parsed));
    if (!parsed.seededWeekly20260622) saveData(data);
    return data;
  } catch {
    const data = applySeed(emptyData());
    saveData(data);
    return data;
  }
}
function saveData(data) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
function cleanText(v, max = 1200) { return String(v ?? '').replace(/[<>]/g, '').slice(0, max); }
function validTime(v) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(v || ''); }
function validDate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v || ''); }
function calcMinutes(start, end, breakMinutes) {
  if (!validTime(start) || !validTime(end)) return 0;
  const [sh, sm] = start.split(':').map(Number), [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  return Math.max(0, mins - Math.max(0, Number(breakMinutes) || 0));
}
function normalize(type, row, old = {}) {
  const base = { id: old.id || row.id || id(), updatedAt: new Date().toISOString() };
  if (type === 'overtime') {
    const out = { ...base, department: cleanText(row.department, 50), name: cleanText(row.name, 50), workDate: validDate(row.workDate) ? row.workDate : '', startTime: validTime(row.startTime) ? row.startTime : '', endTime: validTime(row.endTime) ? row.endTime : '', breakMinutes: Math.min(600, Math.max(0, Number(row.breakMinutes) || 0)), reason: cleanText(row.reason, 400), note: cleanText(row.note, 300) };
    out.totalMinutes = calcMinutes(out.startTime, out.endTime, out.breakMinutes); return out;
  }
  if (type === 'weekly') return { ...base, section: cleanText(row.section || row.department, 80), business: cleanText(row.business || row.name, 120), plan: cleanText(row.plan || row.monday, 2000), ownerPlace: cleanText(row.ownerPlace || row.tuesday, 600), note: cleanText(row.note, 400) };
  if (type === 'vehicle') return { ...base, useDate: validDate(row.useDate) ? row.useDate : '', vehicle: cleanText(row.vehicle, 50), driver: cleanText(row.driver, 50), destination: cleanText(row.destination, 100), purpose: cleanText(row.purpose, 300), departTime: validTime(row.departTime) ? row.departTime : '', returnTime: validTime(row.returnTime) ? row.returnTime : '', startKm: Math.max(0, Number(row.startKm) || 0), endKm: Math.max(0, Number(row.endKm) || 0), fuelLiters: Math.max(0, Number(row.fuelLiters) || 0), note: cleanText(row.note, 300) };
  throw new Error('Invalid sheet type');
}
function getRows(data, type, period) { return data[type]?.[period] || []; }
function sortRows(type, rows) {
  const copy = [...rows];
  if (type === 'overtime') copy.sort((a,b)=>(a.workDate||'').localeCompare(b.workDate||'') || (a.startTime||'').localeCompare(b.startTime||'') || (a.name||'').localeCompare(b.name||''));
  if (type === 'weekly') copy.sort((a,b)=>(a.section||'').localeCompare(b.section||'') || (a.business||'').localeCompare(b.business||''));
  if (type === 'vehicle') copy.sort((a,b)=>(a.useDate||'').localeCompare(b.useDate||'') || (a.departTime||'').localeCompare(b.departTime||''));
  return copy;
}
function copyCellStyle(from, to) { to.style = JSON.parse(JSON.stringify(from.style || {})); to.numFmt = from.numFmt; to.alignment = from.alignment; to.border = from.border; to.fill = from.fill; to.font = from.font; }
function copyRowStyle(ws, fromRow, toRow, maxCol) {
  ws.getRow(toRow).height = ws.getRow(fromRow).height;
  for (let c=1;c<=maxCol;c++) copyCellStyle(ws.getCell(fromRow,c), ws.getCell(toRow,c));
}
function hourText(minutes) {
  const h = Math.round((Number(minutes)||0)/60*10)/10;
  return Number.isInteger(h) ? String(h) : String(h).replace(/\.0$/,'');
}
function monthParts(period) { const [y,m] = String(period).split('-').map(Number); return { y, m }; }
function listDays(y, m) { return new Date(y, m, 0).getDate(); }
function removeOtherSheets(wb, keep) {
  const ids = wb.worksheets.map(ws=>ws.id);
  for (const sid of ids) if (sid !== keep.id) wb.removeWorksheet(sid);
}
async function exportOvertimeSchedule(period, rows, res) {
  const { y, m } = monthParts(period);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(TEMPLATE_DIR, 'overtime_schedule_template.xlsx'));
  let ws = wb.getWorksheet(`${m}월`) || wb.getWorksheet('6월') || wb.worksheets[0];
  removeOtherSheets(wb, ws); ws.name = `${m}월`;
  ws.getCell('B2').value = `${y}년 ${m}월 시간외근무 개인세부내역 `;
  const dateRows = [5,13,21,29,37,45];
  const dayCols = [2,3,4,5,6,7,8];
  if (!ws.getRow(45).height && ws.getRow(37).height) {
    for (let r=45; r<=52; r++) copyRowStyle(ws, 37 + ((r-45)%8), r, 8);
  }
  for (const dr of dateRows) {
    for (const c of dayCols) {
      ws.getCell(dr,c).value = '';
      for (let rr=dr+1; rr<=dr+7; rr++) ws.getCell(rr,c).value = '';
    }
  }
  const grouped = {};
  for (const r of rows) if (validDate(r.workDate)) (grouped[Number(r.workDate.slice(8,10))] ||= []).push(r);
  const first = new Date(y, m-1, 1).getDay();
  const days = listDays(y,m);
  for (let d=1; d<=days; d++) {
    const offset = first + d - 1;
    const week = Math.floor(offset/7), dow = offset%7;
    const dr = dateRows[week], col = dayCols[dow];
    if (!dr) continue;
    ws.getCell(dr,col).value = ` ${m}/${d}`;
    const arr = (grouped[d] || []).sort((a,b)=>(a.startTime||'').localeCompare(b.startTime||''));
    arr.forEach((r,i)=>{
      const targetRow = dr+1+i;
      if (targetRow <= dr+7) ws.getCell(targetRow,col).value = `${r.name || ''}(${hourText(r.totalMinutes)})`;
      else ws.getCell(dr+7,col).value = `${ws.getCell(dr+7,col).value || ''}\n${r.name || ''}(${hourText(r.totalMinutes)})`;
    });
  }
  await sendWorkbook(wb, res, `${period}_시간외근무_개인세부내역.xlsx`);
}
async function exportOvertimeConfirm(period, rows, res) {
  const { y, m } = monthParts(period);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(TEMPLATE_DIR, 'overtime_confirm_template.xlsx'));
  let ws = wb.getWorksheet(`${m}월`) || wb.getWorksheet('6월') || wb.worksheets[0];
  removeOtherSheets(wb, ws); ws.name = `${m}월`;
  ws.getCell('A1').value = `${m}월 시간외근무 확인표(${m}/${listDays(y,m)} 기준)`;
  if (ws.getCell('E1')) ws.getCell('E1').value = `1) 작성 및 제출은 익월 5일 이전까지(${m+1}/5)    2) 근무시간은 앞뒤로 정시기준 5분정도만 차이나게 작성해주세요.`;
  const byName = new Map();
  for (const r of rows) {
    const key = `${r.department||''}||${r.name||''}`;
    if (!byName.has(key)) byName.set(key, { department:r.department||'', name:r.name||'', items:[] });
    const day = validDate(r.workDate) ? Number(r.workDate.slice(8,10)) : '';
    byName.get(key).items.push(`${m}/${day}(${hourText(r.totalMinutes)})`);
  }
  const items = [...byName.values()].sort((a,b)=>(a.department||'').localeCompare(b.department||'') || (a.name||'').localeCompare(b.name||''));
  const start = 3, maxCol = 8, neededLast = Math.max(start + items.length - 1, 18);
  for (let r=start; r<=neededLast; r++) {
    if (r>18) copyRowStyle(ws, 18, r, maxCol);
    for (let c=1;c<=maxCol;c++) ws.getCell(r,c).value = '';
  }
  items.forEach((it, idx)=>{
    const r = start + idx;
    ws.getCell(r,1).value = idx+1;
    ws.getCell(r,2).value = it.department;
    ws.getCell(r,3).value = '';
    ws.getCell(r,4).value = it.name;
    ws.getCell(r,5).value = it.items.length ? '작성' : '';
    ws.getCell(r,6).value = it.items.join(', ');
    ws.getCell(r,7).value = '';
    ws.getCell(r,8).value = '';
  });
  ws.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, margins: { left:.25, right:.25, top:.35, bottom:.35, header:.15, footer:.15 } };
  await sendWorkbook(wb, res, `${period}_시간외근무_확인표.xlsx`);
}
function styleCell(cell, opts={}) { cell.alignment = { vertical:'middle', horizontal:opts.center?'center':'left', wrapText:true }; cell.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }; }
function addApproval(ws, startCol=4) {
  const labels = ['담당','팀장','부장','국장','관장'];
  labels.forEach((label,i)=>{ ws.getCell(1,startCol+i).value=label; ws.getCell(2,startCol+i).value=''; });
  for(let c=startCol;c<startCol+5;c++) for(let r=1;r<=2;r++){ const cell=ws.getCell(r,c); styleCell(cell,{center:true}); if(r===1) cell.font={bold:true,size:9}; ws.getColumn(c).width=8; }
  ws.getRow(2).height = 35;
}
async function exportGeneric(type, period, rows, res) {
  const names = { overtime:'시간외근무표', weekly:'주간계획', vehicle:'차량일지' };
  const wb = new ExcelJS.Workbook(); wb.creator = '공동 업무표';
  const ws = wb.addWorksheet(names[type] || '업무표', { pageSetup: { orientation:'portrait', fitToPage:true, fitToWidth:1, fitToHeight:0, paperSize:9, margins:{left:.25,right:.25,top:.35,bottom:.35,header:.15,footer:.15} } });
  ws.mergeCells('A1:C2'); ws.getCell('A1').value = `${period} ${names[type] || ''}`; ws.getCell('A1').font={bold:true,size:16}; ws.getCell('A1').alignment={horizontal:'center',vertical:'middle'};
  addApproval(ws, type === 'weekly' ? 5 : 7);
  let cols;
  if(type==='overtime') cols=[['번호','no',5],['소속','department',11],['성명','name',9],['근무일','workDate',11],['시작','startTime',8],['종료','endTime',8],['휴게','breakMinutes',7],['시간','total',10],['근무 사유','reason',23],['비고','note',13]];
  else if(type==='weekly') cols=[['번호','no',5],['구분/소속','section',14],['사업','business',18],['업무계획','plan',48],['담당자 및 장소','ownerPlace',24],['비고','note',14]];
  else cols=[['번호','no',5],['사용일','useDate',10],['차량','vehicle',9],['운전자','driver',9],['행선지','destination',13],['목적','purpose',17],['출발','departTime',7],['복귀','returnTime',7],['출발km','startKm',8],['도착km','endKm',8],['운행km','distance',8],['주유L','fuelLiters',7],['비고','note',11]];
  const headerRow=4; cols.forEach((c,i)=>{ws.getCell(headerRow,i+1).value=c[0]; ws.getColumn(i+1).width=c[2];});
  rows.forEach((r,i)=>{ const out={...r,no:i+1,total:`${Math.floor((r.totalMinutes||0)/60)}시간 ${(r.totalMinutes||0)%60}분`,distance:Math.max(0,(r.endKm||0)-(r.startKm||0))}; cols.forEach((c,j)=>ws.getCell(headerRow+1+i,j+1).value=out[c[1]] ?? ''); });
  const lastRow=Math.max(headerRow+rows.length,headerRow);
  for(let r=headerRow;r<=lastRow;r++) { ws.getRow(r).height = type==='weekly' && r>headerRow ? 58 : 22; for(let c=1;c<=cols.length;c++){ const cell=ws.getCell(r,c); styleCell(cell,{center:r===headerRow||c===1}); if(r===headerRow){ cell.font={bold:true}; cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEFEFEF'}}; } } }
  const stampRow = lastRow + 3;
  ws.getCell(stampRow, Math.max(1, cols.length-1)).value = '직인';
  ws.mergeCells(stampRow, Math.max(1, cols.length-1), stampRow+2, cols.length);
  const stamp = ws.getCell(stampRow, Math.max(1, cols.length-1)); styleCell(stamp,{center:true}); stamp.font = { bold:true };
  ws.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;
  await sendWorkbook(wb, res, `${period}_${names[type]}.xlsx`);
}
async function sendWorkbook(wb, res, filename) {
  const buffer=await wb.xlsx.writeBuffer();
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`); res.send(Buffer.from(buffer));
}

app.get('/api/sheet', (req, res) => { const { type='overtime', period='' } = req.query; const data = loadData(); res.json(sortRows(type, getRows(data, type, period))); });
app.get('/api/export.xlsx', async (req, res) => {
  const { type='overtime', period='', format='default' } = req.query;
  const rows = sortRows(type, getRows(loadData(), type, period));
  try {
    if (type === 'overtime' && format === 'schedule') return await exportOvertimeSchedule(period, rows, res);
    if (type === 'overtime' && format === 'confirm') return await exportOvertimeConfirm(period, rows, res);
    return await exportGeneric(type, period, rows, res);
  } catch (err) { console.error(err); res.status(500).json({ error: 'export_failed', message: err.message }); }
});

io.on('connection', socket => {
  socket.on('sheet:join', ({type,period}, ack) => { socket.join(`${type}:${period}`); ack?.({ok:true,rows:sortRows(type,getRows(loadData(),type,period))}); });
  socket.on('row:add', ({type,period,row}, ack) => { const data=loadData(); const item=normalize(type,row||{}); (data[type][period] ||= []).push(item); saveData(data); io.to(`${type}:${period}`).emit('row:added',{type,period,row:item}); ack?.({ok:true,row:item}); });
  socket.on('row:update', ({type,period,row}, ack) => { const data=loadData(); const list=(data[type][period] ||= []); const idx=list.findIndex(r=>r.id===row?.id); if(idx<0)return ack?.({ok:false}); const item=normalize(type,row,list[idx]); list[idx]=item; saveData(data); socket.to(`${type}:${period}`).emit('row:updated',{type,period,row:item}); ack?.({ok:true,row:item}); });
  socket.on('row:delete', ({type,period,id}, ack) => { const data=loadData(); const list=(data[type][period] ||= []); const next=list.filter(r=>r.id!==id); if(next.length===list.length)return ack?.({ok:false}); data[type][period]=next; saveData(data); io.to(`${type}:${period}`).emit('row:deleted',{type,period,id}); ack?.({ok:true}); });
  socket.on('cell:focus', info => socket.to(`${info.type}:${info.period}`).emit('cell:focused',{...info,socketId:socket.id}));
  socket.on('cell:blur', info => socket.to(`${info.type}:${info.period}`).emit('cell:blurred',{...info,socketId:socket.id}));
});
server.listen(PORT,'0.0.0.0',()=>console.log(`http://localhost:${PORT}`));
