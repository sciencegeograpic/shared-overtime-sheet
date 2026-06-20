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
const DATA_FILE = path.join(__dirname, 'data', 'rows.json');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '200kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function loadRows() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}
function saveRows(rows) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
function cleanText(v, max = 200) { return String(v ?? '').replace(/[<>]/g, '').slice(0, max); }
function validTime(v) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(v || ''); }
function calcMinutes(start, end, breakMinutes) {
  if (!validTime(start) || !validTime(end)) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return Math.max(0, mins - Math.max(0, Number(breakMinutes) || 0));
}
function normalize(row, old = {}) {
  const allowed = {
    id: old.id || row.id || crypto.randomUUID(),
    department: cleanText(row.department, 50),
    name: cleanText(row.name, 50),
    workDate: /^\d{4}-\d{2}-\d{2}$/.test(row.workDate || '') ? row.workDate : '',
    startTime: validTime(row.startTime) ? row.startTime : '',
    endTime: validTime(row.endTime) ? row.endTime : '',
    breakMinutes: Math.min(600, Math.max(0, Number(row.breakMinutes) || 0)),
    reason: cleanText(row.reason, 300),
    note: cleanText(row.note, 200),
    updatedAt: new Date().toISOString()
  };
  allowed.totalMinutes = calcMinutes(allowed.startTime, allowed.endTime, allowed.breakMinutes);
  return allowed;
}

app.get('/api/rows', (_req, res) => res.json(loadRows()));
app.get('/api/export.xlsx', async (_req, res) => {
  const rows = loadRows();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '공동 시간외근무표';
  const ws = workbook.addWorksheet('시간외근무', { pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 } });
  ws.columns = [
    { header: '번호', key: 'no', width: 8 }, { header: '소속', key: 'department', width: 16 },
    { header: '성명', key: 'name', width: 14 }, { header: '근무일', key: 'workDate', width: 14 },
    { header: '시작시간', key: 'startTime', width: 12 }, { header: '종료시간', key: 'endTime', width: 12 },
    { header: '휴게(분)', key: 'breakMinutes', width: 12 }, { header: '총 시간', key: 'total', width: 12 },
    { header: '근무 사유', key: 'reason', width: 36 }, { header: '비고', key: 'note', width: 24 }
  ];
  rows.forEach((r, i) => ws.addRow({ no:i+1, ...r, total:`${Math.floor(r.totalMinutes/60)}시간 ${r.totalMinutes%60}분` }));
  const total = rows.reduce((s,r)=>s+r.totalMinutes,0);
  ws.addRow({ reason: '전체 합계', total: `${Math.floor(total/60)}시간 ${total%60}분` });
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: 'A1', to: 'J1' };
  ws.eachRow((row) => row.eachCell((cell) => { cell.border = {top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}}; cell.alignment = { vertical:'middle', wrapText:true }; }));
  ws.pageSetup.printTitlesRow = '1:1';
  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('시간외근무_공동작성표.xlsx')}`);
  res.send(Buffer.from(buffer));
});

io.on('connection', (socket) => {
  socket.emit('rows:init', loadRows());
  socket.on('row:add', (payload, ack) => {
    const rows = loadRows(); const row = normalize(payload || {}); rows.push(row); saveRows(rows);
    io.emit('row:added', row); ack?.({ ok:true, row });
  });
  socket.on('row:update', (payload, ack) => {
    const rows = loadRows(); const idx = rows.findIndex(r => r.id === payload?.id);
    if (idx < 0) return ack?.({ ok:false, error:'행을 찾을 수 없습니다.' });
    const row = normalize(payload, rows[idx]); rows[idx] = row; saveRows(rows);
    socket.broadcast.emit('row:updated', row); ack?.({ ok:true, row });
  });
  socket.on('row:delete', (id, ack) => {
    const rows = loadRows(); const next = rows.filter(r => r.id !== id);
    if (next.length === rows.length) return ack?.({ ok:false });
    saveRows(next); io.emit('row:deleted', id); ack?.({ ok:true });
  });
  socket.on('cell:focus', (info) => socket.broadcast.emit('cell:focused', { ...info, socketId: socket.id }));
  socket.on('cell:blur', (info) => socket.broadcast.emit('cell:blurred', { ...info, socketId: socket.id }));
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
