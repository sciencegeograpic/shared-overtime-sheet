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

fs.mkdirSync(DATA_DIR, { recursive: true });
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '300kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function emptyData() { return { overtime: {}, weekly: {}, vehicle: {} }; }
function loadData() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (Array.isArray(parsed)) {
      const data = emptyData();
      for (const row of parsed) {
        const month = /^\d{4}-\d{2}/.test(row.workDate || '') ? row.workDate.slice(0, 7) : new Date().toISOString().slice(0, 7);
        (data.overtime[month] ||= []).push(row);
      }
      return data;
    }
    return { ...emptyData(), ...parsed, overtime: parsed.overtime || {}, weekly: parsed.weekly || {}, vehicle: parsed.vehicle || {} };
  } catch { return emptyData(); }
}
function saveData(data) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
function cleanText(v, max = 300) { return String(v ?? '').replace(/[<>]/g, '').slice(0, max); }
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
  const base = { id: old.id || row.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
  if (type === 'overtime') {
    const out = { ...base, department: cleanText(row.department, 50), name: cleanText(row.name, 50), workDate: validDate(row.workDate) ? row.workDate : '', startTime: validTime(row.startTime) ? row.startTime : '', endTime: validTime(row.endTime) ? row.endTime : '', breakMinutes: Math.min(600, Math.max(0, Number(row.breakMinutes) || 0)), reason: cleanText(row.reason), note: cleanText(row.note, 200) };
    out.totalMinutes = calcMinutes(out.startTime, out.endTime, out.breakMinutes); return out;
  }
  if (type === 'weekly') return { ...base, department: cleanText(row.department, 50), name: cleanText(row.name, 50), monday: cleanText(row.monday), tuesday: cleanText(row.tuesday), wednesday: cleanText(row.wednesday), thursday: cleanText(row.thursday), friday: cleanText(row.friday), note: cleanText(row.note, 200) };
  if (type === 'vehicle') return { ...base, useDate: validDate(row.useDate) ? row.useDate : '', vehicle: cleanText(row.vehicle, 50), driver: cleanText(row.driver, 50), destination: cleanText(row.destination, 100), purpose: cleanText(row.purpose, 200), departTime: validTime(row.departTime) ? row.departTime : '', returnTime: validTime(row.returnTime) ? row.returnTime : '', startKm: Math.max(0, Number(row.startKm) || 0), endKm: Math.max(0, Number(row.endKm) || 0), fuelLiters: Math.max(0, Number(row.fuelLiters) || 0), note: cleanText(row.note, 200) };
  throw new Error('Invalid sheet type');
}
function getRows(data, type, period) { return data[type]?.[period] || []; }
function sortRows(type, rows) {
  const copy = [...rows];
  if (type === 'overtime') copy.sort((a,b)=>(a.workDate||'').localeCompare(b.workDate||'') || (a.startTime||'').localeCompare(b.startTime||''));
  if (type === 'vehicle') copy.sort((a,b)=>(a.useDate||'').localeCompare(b.useDate||'') || (a.departTime||'').localeCompare(b.departTime||''));
  return copy;
}

app.get('/api/sheet', (req, res) => {
  const { type='overtime', period='' } = req.query;
  const data = loadData(); res.json(sortRows(type, getRows(data, type, period)));
});

app.get('/api/export.xlsx', async (req, res) => {
  const { type='overtime', period='' } = req.query;
  const rows = sortRows(type, getRows(loadData(), type, period));
  const workbook = new ExcelJS.Workbook(); workbook.creator = '공동 업무표';
  const names = { overtime:'시간외근무표', weekly:'주간계획', vehicle:'차량일지' };
  const ws = workbook.addWorksheet(names[type] || '업무표', { pageSetup: { orientation:'portrait', fitToPage:true, fitToWidth:1, fitToHeight:0, paperSize:9, margins:{left:.25,right:.25,top:.35,bottom:.35,header:.15,footer:.15} } });
  ws.mergeCells('A1:J1'); ws.getCell('A1').value = `${period} ${names[type] || ''}`; ws.getCell('A1').font={bold:true,size:16}; ws.getCell('A1').alignment={horizontal:'center'};
  const approvalStart = type === 'weekly' ? 'E2' : 'F2';
  const labels = ['담당','팀장','부장','국장','관장'];
  const startCol = ws.getCell(approvalStart).col;
  labels.forEach((label,i)=>{ const c=ws.getCell(2,startCol+i); c.value=label; c.alignment={horizontal:'center'}; c.font={bold:true,size:9}; ws.getCell(3,startCol+i).value=''; ws.getCell(3,startCol+i).height=35; });
  let cols;
  if(type==='overtime') cols=[['번호','no',5],['소속','department',11],['성명','name',9],['근무일','workDate',11],['시작','startTime',8],['종료','endTime',8],['휴게','breakMinutes',7],['시간','total',10],['근무 사유','reason',23],['비고','note',13]];
  else if(type==='weekly') cols=[['번호','no',5],['소속','department',11],['성명','name',9],['월','monday',15],['화','tuesday',15],['수','wednesday',15],['목','thursday',15],['금','friday',15],['비고','note',13]];
  else cols=[['번호','no',5],['사용일','useDate',10],['차량','vehicle',9],['운전자','driver',9],['행선지','destination',13],['목적','purpose',17],['출발','departTime',7],['복귀','returnTime',7],['출발km','startKm',8],['도착km','endKm',8],['운행km','distance',8],['주유L','fuelLiters',7],['비고','note',11]];
  const headerRow=5; cols.forEach((c,i)=>{ws.getCell(headerRow,i+1).value=c[0]; ws.getColumn(i+1).width=c[2];});
  rows.forEach((r,i)=>{ const out={...r,no:i+1,total:`${Math.floor((r.totalMinutes||0)/60)}시간 ${(r.totalMinutes||0)%60}분`,distance:Math.max(0,(r.endKm||0)-(r.startKm||0))}; cols.forEach((c,j)=>ws.getCell(headerRow+1+i,j+1).value=out[c[1]] ?? ''); });
  const lastRow=Math.max(headerRow+rows.length,headerRow);
  for(let r=headerRow;r<=lastRow;r++) for(let c=1;c<=cols.length;c++){ const cell=ws.getCell(r,c); cell.border={top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}}; cell.alignment={vertical:'middle',horizontal:r===headerRow?'center':'left',wrapText:true}; if(r===headerRow) cell.font={bold:true}; }
  for(let c=startCol;c<startCol+5;c++) for(let r=2;r<=3;r++){const cell=ws.getCell(r,c);cell.border={top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}};}
  ws.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;
  const buffer=await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(`${period}_${names[type]}.xlsx`)}`); res.send(Buffer.from(buffer));
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
