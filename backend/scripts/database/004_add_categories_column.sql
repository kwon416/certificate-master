-- Certificate Master - 카테고리 M:N 관계 지원 마이그레이션
-- 실행 방법: mysql -h dev01.server.ivetech.co.kr -P 13306 -u ivetech -p certificate_master < 004_add_categories_column.sql

USE certificate_master;

-- 1. categories JSON 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS categories JSON DEFAULT NULL
COMMENT '자격증 분류 목록 [{code, name}] - 같은 자격증이 여러 카테고리에 속할 수 있음';

-- 2. 기존 데이터 마이그레이션 (기존 code, category 값을 categories 배열로 복사)
UPDATE certificates
SET categories = JSON_ARRAY(JSON_OBJECT('code', code, 'name', category))
WHERE categories IS NULL;

-- 3. 인덱스 추가 (JSON 검색 최적화) - MariaDB 10.2+에서 지원
-- 가상 컬럼을 생성하여 인덱스 지원
-- ALTER TABLE certificates ADD COLUMN category_first VARCHAR(100) AS (JSON_UNQUOTE(JSON_EXTRACT(categories, '$[0].name'))) VIRTUAL;
-- CREATE INDEX idx_category_first ON certificates(category_first);

-- 4. 결과 확인
SELECT 'Migration completed!' AS result;
SELECT id, title, code, category, categories FROM certificates LIMIT 5;

-- 5. 여러 카테고리를 가진 자격증 확인 쿼리 (마이그레이션 후 사용)
-- SELECT title, JSON_LENGTH(categories) as category_count, categories
-- FROM certificates
-- WHERE JSON_LENGTH(categories) > 1;
