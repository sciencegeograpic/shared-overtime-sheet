# shared-overtime-sheet v9.1

Railway Volume에 남아 있던 구버전 데이터 구조 때문에 서버가 죽는 문제를 수정한 패치 버전입니다.

수정 내용:
- 기존 Volume 데이터에 `cards`, `weekly.pages`가 없어도 자동 보정
- 주간계획 PDF/인쇄 요청 시 fallback 처리
- 카드 사용내역 XLSX 요청 시 빈 월이어도 서버가 죽지 않음
