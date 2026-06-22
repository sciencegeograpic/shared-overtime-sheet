# 공동 업무표 v4

이번 버전은 Railway에서 `Cannot find module 'express'` 같은 오류가 다시 나지 않도록 **외부 패키지를 전혀 사용하지 않는 구조**로 다시 만든 버전입니다.

## 핵심

- Node.js 기본 모듈만 사용
- `npm install`을 해도 설치할 dependency 없음
- Railway에서 `npm ci` 후 `npm start`로 실행 가능
- 실시간 동기화는 Socket.IO 대신 Server-Sent Events(SSE) 사용
- 데이터는 `/app/data/app-data.json`에 저장 가능
- Railway Volume mount path는 `/app/data`

## 기능

- 시간외근무표
  - 월별 이동
  - 근무일/시작시간 기준 자동 정렬
  - 개인 일정표 Excel(.xls) 다운로드
  - 확인표 Excel(.xls) 다운로드
- 주간계획
  - 주별 이동
  - 2026-06-22 주간계획 기본 반영
  - Excel(.xls) 다운로드
- 차량일지
  - 월별 이동
  - 사용일 기준 자동 정렬
  - 운행거리 자동 계산
  - Excel(.xls) 다운로드
- 인쇄
  - A4 세로
  - 결재란: 담당/팀장/부장/국장/관장
  - 직인란
  - 모바일/PC 자동 반응형

## 실행

```bash
npm install
npm start
```

접속:

```text
http://localhost:3000
```

## Railway

Railway Volume을 붙인 경우 Mount Path는 다음으로 설정하세요.

```text
/app/data
```

이 버전은 dependency가 없으므로 Railway에서 패키지 누락 오류가 나지 않아야 합니다.
