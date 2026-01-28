-- Migration 004: Add job seeker perspective columns
-- Date: 2026-01-28
-- Description: 취업준비생 관점 필드 추가 (5개 JSON 컬럼)

-- 1. job_market_info: 채용 시장 정보
ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS job_market_info JSON DEFAULT NULL
COMMENT '채용 시장 정보 {job_posting_frequency, preferred_industries, preferred_companies, requirement_type, public_sector_points, salary_premium}';

-- 2. cost_breakdown: 비용 상세
ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS cost_breakdown JSON DEFAULT NULL
COMMENT '비용 상세 {exam_fee, exam_fee_refund, textbook_cost, lecture_cost, total_estimated_cost, free_resources}';

-- 3. feasibility_info: 합격 가능성 정보
ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS feasibility_info JSON DEFAULT NULL
COMMENT '합격 가능성 정보 {non_major_pass_rate, working_adult_tips, self_study_possible, minimum_study_period, first_attempt_pass_rate}';

-- 4. exam_schedule_detail: 시험 일정 상세
ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS exam_schedule_detail JSON DEFAULT NULL
COMMENT '시험 일정 상세 {annual_exam_count, exam_type, cbt_available, next_exam_date, registration_period, result_announcement}';

-- 5. similar_certificates: 유사 자격증 비교
ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS similar_certificates JSON DEFAULT NULL
COMMENT '유사 자격증 비교 [{certificate_id, title, comparison}]';

-- 6. view_count: 조회수
ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0
COMMENT '조회수';

-- Verify columns added
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'certificates'
AND COLUMN_NAME IN ('job_market_info', 'cost_breakdown', 'feasibility_info', 'exam_schedule_detail', 'similar_certificates', 'view_count');
