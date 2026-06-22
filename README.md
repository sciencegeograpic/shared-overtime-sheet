# 공동 업무표 v3

로그인 없이 접속자가 함께 작성하는 공동 업무표입니다.

## 기능

- 시간외근무표: 월별 이동, 근무일/시작시간 자동 정렬, 총 시간 자동 계산
- 시간외근무 Excel 내보내기
  - 기본표
  - 개인세부내역 양식: 업로드한 `개별작성-시간외근무 개인 일정표` 양식 기반
  - 확인표 양식: 업로드한 `개별작성-개인시간외근무확인표` 양식 기반
- 주간계획: 2026년 6월 22일 주차 자료 초기 반영
- 차량일지: 월별 이동, 사용일 자동 정렬, 운행 km 자동 계산
- 인쇄: A4 세로, 우상단 결재란(담당/팀장/부장/국장/관장), 우하단 직인란
- 모바일/PC 자동 반응형 화면
- Socket.IO 실시간 동기화
- Railway Volume `/app/data` 영구 저장 지원

## 실행

```bash
npm install
npm start
```

브라우저에서 `http://localhost:3000` 접속.

## Railway 배포 반영

1. 기존 GitHub 폴더에 아래 파일/폴더를 덮어씁니다.
   - `server.js`
   - `public/`
   - `templates/`
   - `uploads/`
   - `README.md`
2. GitHub Desktop에서 Commit
3. Push origin
4. Railway 자동 재배포 확인

## 주의

현재 GitHub 저장소가 Public이면 `templates/`, `uploads/` 안의 파일도 공개될 수 있습니다. 실제 기관 자료를 넣을 경우 저장소를 Private으로 변경하는 것을 권장합니다.
