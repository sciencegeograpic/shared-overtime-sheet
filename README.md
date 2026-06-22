# 공동 업무표 v5 - 서식 우선 버전

## 핵심 변경

- Excel 내보내기는 더 이상 가짜 `.xls`가 아니라 실제 `.xlsx` 파일로 생성됩니다.
- 시간외근무 개인세부내역은 월간 달력형 양식으로 생성됩니다.
- 시간외근무 확인표는 업로드된 확인표 양식에 맞춘 목록형 양식으로 생성됩니다.
- 주간계획은 Excel이 아니라 PDF 저장/인쇄 전용 화면으로 내보냅니다.
- 신용·체크카드 사용내역 모듈을 추가했습니다. 보조금, 자부담, 후원금 구분을 입력할 수 있습니다.
- 외부 npm 패키지는 사용하지 않습니다. Railway에서 `express` 누락 같은 오류가 나지 않습니다.

## 배포

기존 폴더에 통째로 덮어쓴 뒤 GitHub Desktop에서:

1. Summary: `Replace with v5 format-first build`
2. Commit to main
3. Push origin

Railway는 자동으로 재배포합니다.

## Railway Volume

기존과 동일하게 `/app/data`에 Volume을 붙이면 됩니다.

## 실행

```bash
npm install
npm start
```
