const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'app-data.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

const clients = new Set();

function id() { return crypto.randomUUID(); }
function todayMonth() { return new Date().toISOString().slice(0, 7); }
function todayDate() { return new Date().toISOString().slice(0, 10); }
function weekStartISO(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
function blankData() { return { version: 4, overtime: {}, weekly: {}, vehicle: {} }; }
function minutesBetween(start, end, breakMinutes) {
  if (!/^\d{2}:\d{2}$/.test(start || '') || !/^\d{2}:\d{2}$/.test(end || '')) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let s = sh * 60 + sm;
  let e = eh * 60 + em;
  if (e < s) e += 24 * 60;
  return Math.max(0, e - s - (Number(breakMinutes) || 0));
}
function formatHours(min) {
  const h = Math.floor((Number(min) || 0) / 60);
  const m = (Number(min) || 0) % 60;
  if (h && m) return `${h}시간 ${m}분`;
  if (h) return `${h}시간`;
  if (m) return `${m}분`;
  return '0';
}
function seedWeekly() {
  const key = '2026-06-22';
  return {
    [key]: [
      row('노년사회화교육팀','노년사회화교육','DSB방송단 6월 간담회 실시(수, 11시)\n슬어생 5~6회기 실시(수,금 14시)\n덕진동치매안심마을 운영위원회의 참석(수 15시)\n선배시민 권역 간담회 참석(목, 16시)\n월드컵 단체 시청(목, 10시)\n2분기 신입회원 환영회(금, 10:30)\n사회복지현장실습 실시(금, 13:30)','문승영(덕진주민센터)\n김수희\n사랑방 / 2층 믿음방 / 3층 두란노'),
      row('노년사회화교육팀','건강관리','인지향상프로그램(월, 14:00~15:00)\n촉탁의 방문진료(수, 13:40~)\n낙상예방 프로그램 2회차 참여자 모집','복종현, 윤숙영'),
      row('노년사회화교육팀','작은도서관','상반기 문화시설 이용자현황 제출(시립)\n전북·전주 작은도서관 운영협의회 회비 납부','형이삭'),
      row('지역복지팀','노인일자리','공원관리, 복지시설 사업단 활동물품 구입(주중)\n초록정원관리사 혹서기 교육 사업계획서 작성(주중)\n시니어 한끼 지원사업 참여자 만족도 조사서 제출(주중)\n국민연금 수급자 공감여행 결과 및 정산보고 제출(주중)','허혜경, 이혜수\n김효진'),
      row('지역복지팀','사례관리 및 지역사회돌봄','노인자원봉사활성화 지원사업 6월 결과보고(주중)\n함께헤어 봉사단 무료 이미용 진행(화, 09:30~11:30)\n함께헤어 봉사단 이미용 봉사 협약식(화, 09:30)\n희망여름 착착착 준비(주중)\n사례관리 및 자원봉사자 관리(주중)','정인석'),
      row('지역복지팀','노인복지관 연계프로그램','경로당 파견 프로그램 모니터링 및 강의일지 확인(주중)\n경로당 영양쿠킹클래스 1회기 진행(송천사랑 24일, 수, 14시)','조혜숙'),
      row('지역복지팀','기획홍보 및 지역복지총괄','금암노인복지관 25주년 행사 참가(목, 10:00)\n선배시민 전주권역 간담회 참석(목, 16:00~)\n늘푸른합창단 개정면행정복지센터 공연(금, 9시10분~)\n복지관 홍보(주중)','중부비전센터, 카페토브\n토: 김수희, 문승영, 정인석'),
      row('지역복지팀','기타','휴가: 김수희(화), 문승영(화, 오후), 형이삭(수)',''),
      row('총무팀','서무·회계','6월 직원 급여 및 퇴직금 이체(6/25)\n2분기 운영위원회 관련 회계 서류 작성(~6/24)\n상반기 연차사용촉진 관련서류 작성','임미정, 최혜림'),
      row('총무팀','시설관리','안전훈련 및 소방훈련(6/22)\n복지관 3층 복도 청소(6/26)\n사회복무요원 복무예정자 인수(6/26)\n전기 설비 정기 점검','최정환'),
      row('영양팀','경로식당','경로당 쿠킹클래스 1회기(송천사랑, 오이피클)\n3분기 생신잔치\n조리종사자 주휴수당 및 급여기안 작성','이경님, 이기순'),
      row('아중노인복지관','노년사회화 / 분관총괄','깨끗한 세상 소득 2차(화)\n집단상담 다시 피어나는 청춘 5회기 종결(수, 10시)\n집단상담 프로그램 포토북 제작(주중)\n분관 운영위원회 및 1차 추경예산 자료 작성(주중)\nFIFA 북중미 월드컵 대한민국 대표팀 단체 시청(목, 10시)','엄라영, 최유리'),
      row('아중노인복지관','경로식당','조리종사자 급여 주휴수당 기안 작성\n상반기 생신잔치 실시(목)\n6.26 대체식 포장 및 제공','윤재희\n윤재희, 강정미'),
      row('아중노인복지관','토당직 / 휴가','토당직(아중): 윤재희\n휴가: 엄라영(화, 오후 2h), 강정미(금)',''),
      row('(노·지·총·영)','부장','운영위원회 자료 취합 및 정리(주중)\n늘푸른합창단 개정면 공연 버스지원(금 09:10)\n복지관업무 총괄(후원, 후백제교육관련준비, 실습)','개정면행정복지센터'),
      row('(노·지·총·영)','사무국장','전주연탄은행 밥차 검사 지원(월)\n금암노인복지관 25주년 행사 참가(목, 10:00)\n3층 돌돌이 바닥청소(금, 14:00)\n지역사회 버스지원(토)\n직원 업무관리 및 사업주훈련 준비','관장, 국장, 부장, 김팀장')
    ]
  };
  function row(section,business,plan,ownerPlace,note='') { return { id:id(), section,business,plan,ownerPlace,note, updatedAt:new Date().toISOString() }; }
}
function migrate(data) {
  const base = blankData();
  if (Array.isArray(data)) {
    for (const r of data) {
      const m = /^\d{4}-\d{2}/.test(r.workDate || '') ? r.workDate.slice(0,7) : todayMonth();
      (base.overtime[m] ||= []).push({...r, totalMinutes: minutesBetween(r.startTime, r.endTime, r.breakMinutes)});
    }
    return base;
  }
  const out = { ...base, ...data, overtime:data.overtime||{}, weekly:data.weekly||{}, vehicle:data.vehicle||{} };
  if (!out.weekly['2026-06-22']) out.weekly = { ...seedWeekly(), ...out.weekly };
  return out;
}
function loadData() {
  try { return migrate(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))); }
  catch { const d = migrate(blankData()); saveData(d); return d; }
}
function saveData(data) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
let data = loadData();

function sortData() {
  for (const rows of Object.values(data.overtime)) rows.sort((a,b)=>String(a.workDate||'').localeCompare(String(b.workDate||'')) || String(a.startTime||'').localeCompare(String(b.startTime||'')) || String(a.name||'').localeCompare(String(b.name||'')));
  for (const rows of Object.values(data.vehicle)) rows.sort((a,b)=>String(a.useDate||'').localeCompare(String(b.useDate||'')) || String(a.departTime||'').localeCompare(String(b.departTime||'')));
}
function broadcast() {
  sortData();
  const payload = `data: ${JSON.stringify({ type:'data', data })}\n\n`;
  for (const res of clients) { try { res.write(payload); } catch {} }
}
function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Content-Length':Buffer.byteLength(body) });
  res.end(body);
}
function htmlEscape(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function readBody(req) { return new Promise((resolve,reject)=>{ let b=''; req.on('data',d=>{ b+=d; if (b.length>1e6) { req.destroy(); reject(new Error('too large')); } }); req.on('end',()=>resolve(b)); req.on('error',reject); }); }
function sanitizeName(name) { return String(name || 'download').replace(/[\\/:*?"<>|]/g, '_'); }

function upsert(type, scope, row) {
  if (!data[type]) data[type] = {};
  if (!data[type][scope]) data[type][scope] = [];
  const rows = data[type][scope];
  if (!row.id) row.id = id();
  row.updatedAt = new Date().toISOString();
  if (type === 'overtime') row.totalMinutes = minutesBetween(row.startTime, row.endTime, row.breakMinutes);
  if (type === 'vehicle') row.distance = Math.max(0, (Number(row.endKm)||0) - (Number(row.startKm)||0));
  const idx = rows.findIndex(r => r.id === row.id);
  if (idx >= 0) rows[idx] = { ...rows[idx], ...row }; else rows.push(row);
  sortData(); saveData(data); broadcast();
  return row;
}
function remove(type, scope, idval) {
  if (!data[type]?.[scope]) return false;
  data[type][scope] = data[type][scope].filter(r => r.id !== idval);
  saveData(data); broadcast();
  return true;
}
function ensureRows(type, scope) {
  if (!data[type]) data[type] = {};
  if (!data[type][scope]) data[type][scope] = [];
  return data[type][scope];
}

function approvalHtml() {
  return `<table class="approval"><tr><th>담당</th><th>팀장</th><th>부장</th><th>국장</th><th>관장</th></tr><tr><td></td><td></td><td></td><td></td><td></td></tr></table>`;
}
function xlsDoc(title, subtitle, tableHtml, extra='') {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{font-family:'Malgun Gothic','맑은 고딕',Arial,sans-serif;font-size:10pt;color:#111} h1{text-align:center;font-size:18pt;letter-spacing:6px;margin:8px 0 4px} .subtitle{text-align:center;font-size:11pt;margin-bottom:8px}.top{display:flex;justify-content:flex-end}.approval{border-collapse:collapse;margin-left:auto;margin-bottom:8px}.approval th,.approval td{border:1px solid #000;width:58px;height:28px;text-align:center;font-size:9pt}.approval td{height:44px}.sheet{border-collapse:collapse;width:100%;table-layout:fixed}.sheet th,.sheet td{border:1px solid #000;padding:4px;vertical-align:middle;white-space:pre-wrap;mso-number-format:'\\@';}.sheet th{text-align:center;background:#f2f2f2;font-weight:bold}.center{text-align:center}.stamp{margin-left:auto;margin-top:16px;border:1px solid #000;width:150px;height:58px;text-align:center;line-height:58px;font-weight:bold}
  </style></head><body>${approvalHtml()}<h1>${htmlEscape(title)}</h1><div class="subtitle">${htmlEscape(subtitle)}</div>${tableHtml}${extra}<div class="stamp">직인</div></body></html>`;
}
function sendXls(res, filename, html) {
  const body = Buffer.from('\ufeff' + html, 'utf8');
  res.writeHead(200, { 'Content-Type':'application/vnd.ms-excel; charset=utf-8', 'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`, 'Content-Length':body.length });
  res.end(body);
}
function overtimeXls(scope, mode) {
  const rows = ensureRows('overtime', scope);
  const title = mode === 'confirm' ? '개인시간외근무확인표' : '시간외근무 개인 일정표';
  const head = mode === 'confirm'
    ? '<tr><th style="width:48px">순번</th><th>소속</th><th>성명</th><th>근무일</th><th>근무시간</th><th>인정시간</th><th>근무내용</th><th>확인</th></tr>'
    : '<tr><th style="width:48px">순번</th><th>소속</th><th>성명</th><th>근무일</th><th>시작</th><th>종료</th><th>휴게</th><th>인정시간</th><th>근무 사유</th><th>비고</th></tr>';
  const body = rows.map((r,i)=> mode === 'confirm'
    ? `<tr><td class="center">${i+1}</td><td>${htmlEscape(r.department)}</td><td>${htmlEscape(r.name)}</td><td class="center">${htmlEscape(r.workDate)}</td><td class="center">${htmlEscape(r.startTime)}~${htmlEscape(r.endTime)}</td><td class="center">${htmlEscape(formatHours(r.totalMinutes))}</td><td>${htmlEscape(r.reason)}</td><td></td></tr>`
    : `<tr><td class="center">${i+1}</td><td>${htmlEscape(r.department)}</td><td>${htmlEscape(r.name)}</td><td class="center">${htmlEscape(r.workDate)}</td><td class="center">${htmlEscape(r.startTime)}</td><td class="center">${htmlEscape(r.endTime)}</td><td class="center">${htmlEscape(r.breakMinutes||0)}분</td><td class="center">${htmlEscape(formatHours(r.totalMinutes))}</td><td>${htmlEscape(r.reason)}</td><td>${htmlEscape(r.note)}</td></tr>`).join('');
  const total = rows.reduce((s,r)=>s+(Number(r.totalMinutes)||0),0);
  return xlsDoc(title, `${scope} / 총 ${formatHours(total)}`, `<table class="sheet">${head}${body}</table>`, `<p>총 인정시간: ${formatHours(total)}</p>`);
}
function weeklyXls(scope) {
  const rows = ensureRows('weekly', scope);
  const body = rows.map((r,i)=>`<tr><td class="center">${i+1}</td><td>${htmlEscape(r.section)}</td><td>${htmlEscape(r.business)}</td><td>${htmlEscape(r.plan)}</td><td>${htmlEscape(r.ownerPlace)}</td><td>${htmlEscape(r.note)}</td></tr>`).join('');
  return xlsDoc('주 간 계 획', `${scope} 주간`, `<table class="sheet"><tr><th style="width:45px">순번</th><th style="width:120px">구분</th><th style="width:120px">사업</th><th>업무계획</th><th style="width:160px">담당자 및 장소</th><th style="width:100px">비고</th></tr>${body}</table>`);
}
function vehicleXls(scope) {
  const rows = ensureRows('vehicle', scope);
  const body = rows.map((r,i)=>`<tr><td class="center">${i+1}</td><td class="center">${htmlEscape(r.useDate)}</td><td>${htmlEscape(r.car)}</td><td>${htmlEscape(r.driver)}</td><td>${htmlEscape(r.destination)}</td><td>${htmlEscape(r.purpose)}</td><td class="center">${htmlEscape(r.departTime)}</td><td class="center">${htmlEscape(r.returnTime)}</td><td class="center">${htmlEscape(r.startKm)}</td><td class="center">${htmlEscape(r.endKm)}</td><td class="center">${htmlEscape(r.distance)}</td><td class="center">${htmlEscape(r.fuel)}</td><td>${htmlEscape(r.note)}</td></tr>`).join('');
  return xlsDoc('차 량 운 행 일 지', `${scope}`, `<table class="sheet"><tr><th>순번</th><th>사용일</th><th>차량</th><th>운전자</th><th>행선지</th><th>사용목적</th><th>출발</th><th>복귀</th><th>출발km</th><th>도착km</th><th>운행km</th><th>주유량</th><th>비고</th></tr>${body}</table>`);
}

const mime = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon' };
function serveStatic(req, res, pathname) {
  let file = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  const fp = path.resolve(PUBLIC_DIR, file);
  if (!fp.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === 'GET' && u.pathname === '/api/events') {
      res.writeHead(200, { 'Content-Type':'text/event-stream; charset=utf-8', 'Cache-Control':'no-cache, no-transform', 'Connection':'keep-alive', 'X-Accel-Buffering':'no' });
      res.write(`data: ${JSON.stringify({ type:'data', data })}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (req.method === 'GET' && u.pathname === '/api/data') return json(res, 200, data);
    if (req.method === 'POST' && u.pathname === '/api/upsert') {
      const body = JSON.parse(await readBody(req) || '{}');
      const result = upsert(body.type, body.scope, body.row || {});
      return json(res, 200, { ok:true, row:result });
    }
    if (req.method === 'POST' && u.pathname === '/api/delete') {
      const body = JSON.parse(await readBody(req) || '{}');
      const ok = remove(body.type, body.scope, body.id);
      return json(res, 200, { ok });
    }
    if (req.method === 'POST' && u.pathname === '/api/reset-scope') {
      const body = JSON.parse(await readBody(req) || '{}');
      if (data[body.type]) data[body.type][body.scope] = [];
      saveData(data); broadcast();
      return json(res, 200, { ok:true });
    }
    if (req.method === 'GET' && u.pathname.startsWith('/api/export/')) {
      const type = u.pathname.split('/').pop();
      const scope = u.searchParams.get('scope') || todayMonth();
      const mode = u.searchParams.get('mode') || 'schedule';
      let html = '', name = '';
      if (type === 'overtime') { html = overtimeXls(scope, mode); name = `${scope}_${mode === 'confirm' ? '개인시간외근무확인표' : '시간외근무개인일정표'}.xls`; }
      else if (type === 'weekly') { html = weeklyXls(scope); name = `${scope}_주간계획.xls`; }
      else if (type === 'vehicle') { html = vehicleXls(scope); name = `${scope}_차량운행일지.xls`; }
      else return json(res, 404, { error:'unknown export type' });
      return sendXls(res, sanitizeName(name), html);
    }
    if (req.method === 'GET') return serveStatic(req, res, u.pathname);
    json(res, 405, { error:'method not allowed' });
  } catch (err) {
    console.error(err);
    json(res, 500, { error: String(err.message || err) });
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`shared-overtime-sheet v4 listening on ${PORT}`));
