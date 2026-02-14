-- 005: certificates 테이블에 slug 컬럼 추가
-- URL 구조 개선: UUID → 슬러그 마이그레이션
-- 예: /certificates/ec9afe49-... → /certificates/정보처리기사

ALTER TABLE certificates
ADD COLUMN slug VARCHAR(500) NULL UNIQUE
COMMENT 'URL용 슬러그 (예: 정보처리기사, 소방설비기사-전기분야)';

-- slug 생성 후 NOT NULL로 변경:
-- ALTER TABLE certificates MODIFY COLUMN slug VARCHAR(500) NOT NULL;
