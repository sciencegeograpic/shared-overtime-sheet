const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'app-data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
fs.mkdirSync(DATA_DIR, { recursive: true });

const seed = () => ({
  overtime: {},
  vehicle: {},
  cards: {},
  weekly: {
    '2026-06-22': {
      start: '2026-06-22', end: '2026-06-27',
      pages: [
        { id:'p1', title:'노년사회화팀, 지역복지팀', approval:['','',''], rows:[
          {group:'노년사회화교육팀', business:'노년\n사회화\n교육', plan:['DSB방송단 6월 간담회 실시(수, 11시)','슬어생 5~6회기 실시(수,금 14시)','덕진동치매안심마을 운영위원회의참석(수 15시)','선배시민 권역 간담회 참석(목, 16시)','월드컵 단체 시청( 목, 10시)','2분기 신입회원 환영회(금, 10:30)','사회복지현장실습 실시(금, 13:30)'], place:['노년사회화','','문승영(덕진주민센터)','김수희','사랑방','2층 믿음방','3층 두란노']},
          {group:'노년사회화교육팀', business:'건강관리', plan:['인지향상프로그램(월, 14:00~15:00)','촉탁의 방문진료(수, 13:40~)','낙상예방 프로그램 2회차 참여자 모집'], place:['복종현,윤숙영']},
          {group:'노년사회화교육팀', business:'작은도서관', plan:['상반기 문화시설 이용자현황 제출(시립)','전북·전주 작은도서관 운영협의회 회비 납부'], place:['형이삭']},
          {group:'지역복지팀', business:'노인일자리', plan:['공원관리, 복지시설 사업단 활동물품 구입(주중)','초록정원관리사 혹서기 교육 사업계획서 작성(주중)','시니어 한끼 지원사업 참여자 만족도 조사서 제출(주중)','국민연금 수급자 공감여행 결과 및 정산보고 제출(주중)'], place:['노인일자리','','허혜경, 이혜수','김효진']},
          {group:'지역복지팀', business:'사례관리 및\n지역사회돌봄', plan:['노인자원봉사활성화 지원사업 6월 결과보고(주중)','함께헤어 봉사단 무료 이미용 진행(화, 09:30~11:30)','함께헤어 봉사단 이미용 봉사 협약식(화, 09:30)','희망여름 착착착 준비(주중)','사례관리 및 자원봉사자 관리(주중)'], place:['정인석']},
          {group:'지역복지팀', business:'노인복지관\n연계프로그램', plan:['경로당 파견 프로그램모니터링 및 강의일지 확인(주중)','경로당 영양쿠킹클래스 1회기 진행\n   (송천사랑 24일, 수, 14시)'], place:['조혜숙']},
          {group:'지역복지팀', business:'기획홍보 및\n지역복지총괄', plan:['금암노인복지관 25주년 행사 참가(목, 10:00)','선배시민 전주권역 간담회 참석 (목, 16:00~)','늘푸른합창단 개정면행정복지센터 공연(금, 9시10분~)','복지관홍보(주중)'], place:['중부비전센터,카페토브']},
          {group:'', business:'토', plan:['김수희, 문승영, 정인석'], place:[]},
          {group:'', business:'기타', plan:['휴가: 김수희(화), 문승영(화,오후), 형이삭(수)'], place:[]}
        ]},
        { id:'p2', title:'총무팀, 영양팀, 아중노인복지관', approval:['','',''], rows:[
          {group:'총무팀', business:'서무·회계', plan:['6월 직원 급여 및 퇴직금 이체(6/25)','2분기 운영위원회 관련 회계 서류 작성(~6/24)','상반기 연차사용촉진 관련서류 작성'], place:['임미정, 최혜림']},
          {group:'총무팀', business:'시설관리', plan:['안전훈련 및 소방훈련(6/22)','복지관 3층 복도 청소(6/26)','사회복무요원 복무예정자 인수(6/26)','전기 설비 정기 점검'], place:['최정환']},
          {group:'영양팀', business:'경로식당', plan:['경로당 쿠킹클래스 1회기 (송천사랑,오이피클)','3분기 생신잔치','조리종사자 주휴수당 및 급여기안작성'], place:['이경님,이기순']},
          {group:'아중노인복지관', business:'노년사회화\n분관총괄', plan:['깨끗한 세상 소득 2차(화)','집단상담 다시 피어나는 청춘 5회기 종결(수, 10시)','집단상담 프로그램 포토북 제작(주중)','분관 운영위원회 및 1차 추경예산 자료 작성(주중)','FIFA 북중미 월드컵 대한민국 대표팀 단체 시청(목, 10시)'], place:['엄라영 최유리']},
          {group:'아중노인복지관', business:'경로식당', plan:['조리종사자 급여 주휴수당 기안작성','상반기 생신잔치 실시(목)','6.26 대체식 포장 및 제공'], place:['윤재희','윤재희, 강정미','윤재희, 강정미']},
          {group:'아중노인복지관', business:'토당직(아중)', plan:['윤재희'], place:[]},
          {group:'아중노인복지관', business:'휴가', plan:['엄라영(화, 오후 2h), 강정미(금)'], place:[]},
          {group:'(노·지·총·영)', business:'부장', plan:['운영위원회 자료 취합 및 정리(주중)','늘푸른합창단 개정면 공연 버스지원(금 09:10)','복지관업무 총괄(후원,후백제교육관련준비,실습)'], place:['개정면행정복지센터']},
          {group:'', business:'사무국장', plan:['전주연탄은행 밥차 검사 지원(월)','금암노인복지관 25주년 행사 참가(목, 10:00)','3층 돌돌이 바닥청소(금. 14:00)','지역사회 버스지원(토)','직원 업무관리 및 사업주훈련 준비'], place:['국장','관장,국장,부장,김팀장','국장','국장','국장']}
        ]}
      ]
    }
  }
});
function load(){ try{ return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); } catch(e){ const d=seed(); save(d); return d; } }
function save(data){ fs.mkdirSync(DATA_DIR,{recursive:true}); fs.writeFileSync(DATA_FILE, JSON.stringify(data,null,2)); }
let db = load();

function ensureSchema(data){
  const base = seed();
  data = data && typeof data === 'object' ? data : {};
  data.overtime = data.overtime && typeof data.overtime === 'object' ? data.overtime : {};
  data.vehicle = data.vehicle && typeof data.vehicle === 'object' ? data.vehicle : {};
  data.cards = data.cards && typeof data.cards === 'object' ? data.cards : {};
  data.weekly = data.weekly && typeof data.weekly === 'object' ? data.weekly : {};
  Object.keys(base.weekly).forEach(k=>{
    if(!data.weekly[k] || !Array.isArray(data.weekly[k].pages)) data.weekly[k] = base.weekly[k];
  });
  return data;
}
db = ensureSchema(db);
save(db);

let clients = new Set();
function broadcast(){ const payload = `data: ${JSON.stringify({type:'update', ts:Date.now()})}\n\n`; clients.forEach(res=>{ try{res.write(payload);}catch(e){} }); }
function send(res, status, body, type='application/json; charset=utf-8'){ res.writeHead(status, {'Content-Type':type, 'Cache-Control':'no-store'}); res.end(body); }
function parseBody(req){ return new Promise(resolve=>{ let b=''; req.on('data',c=>b+=c); req.on('end',()=>{try{resolve(JSON.parse(b||'{}'))}catch(e){resolve({})}}); }); }
function esc(s){ return String(s??'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
function arr(v){ return Array.isArray(v) ? v : String(v||'').split('\n').filter(x=>x.trim()!==''); }
function monthKey(d=new Date()){ return d.toISOString().slice(0,7); }
function uid(){ return crypto.randomBytes(8).toString('hex'); }
function minutes(start,end,br){ if(!start||!end) return 0; let [sh,sm]=start.split(':').map(Number), [eh,em]=end.split(':').map(Number); let a=sh*60+sm,b=eh*60+em; if(b<a) b+=1440; return Math.max(0,b-a-(Number(br)||0)); }

const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};

function weeklyRowsWithSpan(rows){
  const counts={}; rows.forEach(r=>{ if(r.group) counts[r.group]=(counts[r.group]||0)+1; });
  const seen={};
  return rows.map(r=>{ const show = r.group && !seen[r.group]; if(r.group) seen[r.group]=true; return {...r, showGroup:show, groupSpan:show?counts[r.group]:0}; });
}
function weeklyPageHTML(page, start, end){
  const rows = weeklyRowsWithSpan(page.rows);
  return `<section class="weekly-page">
    <header class="weekly-head">
      <h1>주&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;간&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;계&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;획</h1>
      <table class="approval"><tr><td rowspan="2" class="approval-label">결<br>재</td><th>담&nbsp;당</th><th>부&nbsp;장</th></tr><tr><td>${esc(page.approval?.[0]||'')}</td><td>${esc(page.approval?.[1]||'')}</td></tr></table>
    </header>
    <div class="weekly-meta"><span>${esc(page.title)}</span><span>${formatPeriod(start,end)}</span></div>
    <table class="weekly-table">
      <colgroup><col class="c-group"><col class="c-biz"><col class="c-plan"><col class="c-place"></colgroup>
      <thead><tr><th>구분</th><th>사&nbsp;&nbsp;업</th><th>업&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;무&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;계&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;획</th><th>담당자 및 장소</th></tr></thead>
      <tbody>${rows.map(r=>`<tr class="row-lines-${Math.max(arr(r.plan).length, arr(r.place).length)}">
        ${r.showGroup?`<td class="vgroup" rowspan="${r.groupSpan}">${esc(r.group).split('').join('<br>')}</td>`:''}
        ${!r.group?`<td class="vgroup blank"></td>`:''}
        <td class="biz">${esc(r.business).replace(/\n/g,'<br>')}</td>
        <td class="plan">${arr(r.plan).map(x=>`<div>-&nbsp;${esc(x)}</div>`).join('')}</td>
        <td class="place">${arr(r.place).map(x=>`<div>-&nbsp;${esc(x)}</div>`).join('')}</td>
      </tr>`).join('')}</tbody>
    </table>
  </section>`;
}
function formatPeriod(s,e){
  const ds=new Date(s+'T00:00:00'), de=new Date(e+'T00:00:00');
  return `${ds.getFullYear()}년 ${ds.getMonth()+1}월 ${ds.getDate()}일 ~ ${de.getMonth()+1}월 ${de.getDate()}일`;
}
function weeklyPrintHTML(scope){
  db = ensureSchema(db);
  const w = (db.weekly && db.weekly[scope] && Array.isArray(db.weekly[scope].pages)) ? db.weekly[scope] : db.weekly['2026-06-22'];
  return `<!doctype html><html><head><meta charset="utf-8"><title>주간계획</title><link rel="stylesheet" href="/weekly-print.css"></head><body>
  <div class="printbar"><button onclick="window.print()">PDF로 저장/인쇄</button><span>각 페이지가 A4 세로 1장씩 출력됩니다.</span></div>
  ${w.pages.map(p=>weeklyPageHTML(p,w.start,w.end)).join('')}
  </body></html>`;
}

// Minimal XLSX writer (valid .xlsx, no npm). Focused on styled exports.
function crc32(buf){ let table=crc32.table||(crc32.table=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;})); let c=0xffffffff; for(const b of buf)c=table[(c^b)&255]^(c>>>8); return (c^0xffffffff)>>>0; }
function zip(files){ let chunks=[], central=[], off=0; const w16=n=>{let b=Buffer.alloc(2);b.writeUInt16LE(n);return b}, w32=n=>{let b=Buffer.alloc(4);b.writeUInt32LE(n>>>0);return b}; for(const f of files){ const name=Buffer.from(f.name); const data=Buffer.isBuffer(f.data)?f.data:Buffer.from(f.data); const crc=crc32(data); const local=Buffer.concat([w32(0x04034b50),w16(20),w16(0),w16(0),w16(0),w16(0),w32(crc),w32(data.length),w32(data.length),w16(name.length),w16(0),name]); chunks.push(local,data); central.push(Buffer.concat([w32(0x02014b50),w16(20),w16(20),w16(0),w16(0),w16(0),w16(0),w32(crc),w32(data.length),w32(data.length),w16(name.length),w16(0),w16(0),w16(0),w16(0),w32(0),w32(off),name])); off += local.length + data.length; } const cstart=off; const cbuf=Buffer.concat(central); const end=Buffer.concat([w32(0x06054b50),w16(0),w16(0),w16(files.length),w16(files.length),w32(cbuf.length),w32(cstart),w16(0)]); return Buffer.concat([...chunks,cbuf,end]); }
function col(n){ let s=''; while(n){ let m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26); } return s; }
function cell(v,r,c,s=1){ const ref=col(c)+r; if(typeof v==='number') return `<c r="${ref}" s="${s}"><v>${v}</v></c>`; return `<c r="${ref}" s="${s}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`; }
function sheetXML(rows, merges=[], widths=[]){
  const cols = widths.length?`<cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`:'';
  const sheetData = `<sheetData>${rows.map((r,ri)=>`<row r="${ri+1}" ht="${r.h||18}" customHeight="1">${r.cells.map((cv,ci)=>cv?cell(cv.v,ri+1,ci+1,cv.s||1):'').join('')}</row>`).join('')}</sheetData>`;
  const mergeXml = merges.length?`<mergeCells count="${merges.length}">${merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>`:'';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}${sheetData}${mergeXml}<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="portrait" paperSize="9" fitToWidth="1" fitToHeight="0"/></worksheet>`;
}
function xlsxBuffer(sheetName, rows, merges, widths){
 const files=[
 {name:'[Content_Types].xml',data:`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`},
 {name:'_rels/.rels',data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
 {name:'xl/_rels/workbook.xml.rels',data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
 {name:'xl/workbook.xml',data:`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(sheetName).slice(0,31)}" sheetId="1" r:id="rId1"/></sheets></workbook>`},
 {name:'xl/styles.xml',data:`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="11"/><name val="맑은 고딕"/></font><font><b/><sz val="18"/><name val="맑은 고딕"/></font><font><b/><sz val="11"/><name val="맑은 고딕"/></font><font><sz val="10"/><name val="맑은 고딕"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF3FA"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border><border><left style="medium"/><right style="medium"/><top style="medium"/><bottom style="medium"/><diagonal/></border></borders><cellXfs count="8"><xf fontId="0" fillId="0" borderId="0"/><xf fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf fontId="1" fillId="0" borderId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf fontId="2" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf fontId="3" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf fontId="0" fillId="0" borderId="2" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf fontId="2" fillId="0" borderId="2" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs></styleSheet>`},
 {name:'xl/worksheets/sheet1.xml',data:sheetXML(rows,merges,widths)}
 ]; return zip(files);
}
function overtimeXlsx(month){ db=ensureSchema(db); const rows=[{h:28,cells:[{v:'시간외근무 개인 일정표',s:2}]},{h:22,cells:[{v:`${month}`,s:0}]},{h:24,cells:[{v:'소속',s:3},{v:'성명',s:3},{v:'근무일',s:3},{v:'시작',s:3},{v:'종료',s:3},{v:'휴게',s:3},{v:'시간',s:3},{v:'내용',s:3},{v:'비고',s:3}]}]; const data=(db.overtime[month]||[]).sort((a,b)=>(a.workDate||'').localeCompare(b.workDate||'')); data.forEach(r=>rows.push({h:35,cells:[{v:r.department,s:1},{v:r.name,s:1},{v:r.workDate,s:1},{v:r.startTime,s:1},{v:r.endTime,s:1},{v:r.breakMinutes||0,s:1},{v:(minutes(r.startTime,r.endTime,r.breakMinutes)/60).toFixed(1),s:1},{v:r.reason,s:5},{v:r.note,s:5}]})); return xlsxBuffer('시간외근무',rows,['A1:I1'],[12,12,14,10,10,8,8,35,20]); }
function cardXlsx(month){ db=ensureSchema(db); const rows=[{h:28,cells:[{v:'신용·체크카드 사용내역',s:2}]},{h:22,cells:[{v:`${month}`,s:0}]},{h:24,cells:['사용일','구분','카드명','사용처','사용내역','금액','계정과목','증빙','비고'].map(v=>({v,s:3}))}]; (db.cards[month]||[]).forEach(r=>rows.push({h:30,cells:[{v:r.date,s:1},{v:r.type,s:1},{v:r.card,s:1},{v:r.vendor,s:1},{v:r.detail,s:5},{v:Number(r.amount)||0,s:1},{v:r.account,s:1},{v:r.proof,s:1},{v:r.note,s:5}]})); return xlsxBuffer('카드사용내역',rows,['A1:I1'],[12,12,16,20,35,12,16,14,20]); }
function vehicleXlsx(month){ db=ensureSchema(db); const rows=[{h:28,cells:[{v:'차량일지',s:2}]},{h:22,cells:[{v:`${month}`,s:0}]},{h:24,cells:['사용일','차량','운전자','행선지','사용목적','출발','복귀','출발km','도착km','운행km','주유량','비고'].map(v=>({v,s:3}))}]; (db.vehicle[month]||[]).sort((a,b)=>(a.date||'').localeCompare(b.date||'')).forEach(r=>rows.push({h:30,cells:[{v:r.date,s:1},{v:r.car,s:1},{v:r.driver,s:1},{v:r.dest,s:1},{v:r.purpose,s:5},{v:r.startTime,s:1},{v:r.endTime,s:1},{v:Number(r.startKm)||0,s:1},{v:Number(r.endKm)||0,s:1},{v:(Number(r.endKm)||0)-(Number(r.startKm)||0),s:1},{v:r.fuel,s:1},{v:r.note,s:5}]})); return xlsxBuffer('차량일지',rows,['A1:L1'],[12,12,12,18,30,10,10,10,10,10,10,20]); }

const server = http.createServer(async (req,res)=>{
  const parsed=url.parse(req.url,true); const p=decodeURIComponent(parsed.pathname);
  if(p==='/events'){ res.writeHead(200, {'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'}); res.write(`data: ${JSON.stringify({type:'hello'})}\n\n`); clients.add(res); req.on('close',()=>clients.delete(res)); return; }
  if(p==='/api/data') return send(res,200,JSON.stringify(db));
  if(p==='/api/save' && req.method==='POST'){ const body=await parseBody(req); db=body; save(db); broadcast(); return send(res,200,JSON.stringify({ok:true})); }
  if(p==='/api/add' && req.method==='POST'){ const {type,scope}=await parseBody(req); if(type==='overtime'){ db.overtime[scope]=db.overtime[scope]||[]; db.overtime[scope].push({id:uid(),department:'',name:'',workDate:scope+'-01',startTime:'18:00',endTime:'20:00',breakMinutes:0,reason:'',note:''}); } if(type==='vehicle'){ db.vehicle[scope]=db.vehicle[scope]||[]; db.vehicle[scope].push({id:uid(),date:scope+'-01',car:'',driver:'',dest:'',purpose:'',startTime:'',endTime:'',startKm:'',endKm:'',fuel:'',note:''}); } if(type==='cards'){ db.cards[scope]=db.cards[scope]||[]; db.cards[scope].push({id:uid(),date:scope+'-01',type:'보조금',card:'',vendor:'',detail:'',amount:'',account:'',proof:'',note:''}); } save(db); broadcast(); return send(res,200,JSON.stringify({ok:true})); }
  if(p==='/print/weekly') return send(res,200,weeklyPrintHTML(parsed.query.scope||'2026-06-22'),'text/html; charset=utf-8');
  if(p==='/download/overtime.xlsx'){ const m=parsed.query.month||monthKey(); res.writeHead(200, {'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="overtime_${m}.xlsx"`}); return res.end(overtimeXlsx(m)); }
  if(p==='/download/cards.xlsx'){ const m=parsed.query.month||monthKey(); res.writeHead(200, {'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="cards_${m}.xlsx"`}); return res.end(cardXlsx(m)); }
  if(p==='/download/vehicle.xlsx'){ const m=parsed.query.month||monthKey(); res.writeHead(200, {'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="vehicle_${m}.xlsx"`}); return res.end(vehicleXlsx(m)); }
  let file=p==='/'?'/index.html':p; let full=path.join(PUBLIC_DIR,file); if(!full.startsWith(PUBLIC_DIR)) return send(res,403,'forbidden','text/plain'); fs.readFile(full,(err,data)=>{ if(err) return send(res,404,'not found','text/plain'); send(res,200,data,mime[path.extname(full)]||'application/octet-stream'); });
});
server.listen(PORT,'0.0.0.0',()=>console.log(`Server running on ${PORT}`));
