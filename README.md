# 공동 업무표 v9 - 서식 우선 재구조화

## 핵심

- 주간계획은 일반 표가 아니라 원본 문서의 병합셀 구조를 따라 편집합니다.
- 주간계획 출력은 A4 세로 1쪽씩 PDF 저장/인쇄합니다.
- 시간외근무, 차량일지, 신용·체크카드 사용내역을 월별로 작성합니다.
- 입력 중 실시간 동기화 때문에 칸이 닫히지 않도록 수정했습니다.
- 외부 npm 패키지 없이 Node.js 기본 기능만 사용합니다.
- XLSX 다운로드는 실제 .xlsx zip 구조로 생성합니다.

## 실행

```bash
npm start
```

## Railway

- Start command: `npm start`
- Volume mount path: `/app/data`

## 적용

GitHub Desktop에서 기존 폴더에 전체 덮어쓰기 후:

- Summary: `Replace with v9 format-first editor`
- Commit to main
- Push origin
