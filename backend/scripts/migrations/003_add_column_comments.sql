-- MariaDB 컬럼 코멘트 추가 마이그레이션
-- 실행: MySQL/MariaDB 클라이언트에서 실행
-- 날짜: 2026-01-21

-- certificates 테이블 컬럼 코멘트 추가
ALTER TABLE certificates
    MODIFY COLUMN id VARCHAR(36) NOT NULL COMMENT '고유 식별자 (UUID)',
    MODIFY COLUMN code VARCHAR(10) NOT NULL COMMENT '자격증 코드 (S: 국가전문자격, T: 국가기술자격, Q: 과정평가형, W: 일학습병행)',
    MODIFY COLUMN category VARCHAR(100) NOT NULL COMMENT '자격증 분류 (국가기술자격, 국가전문자격, 과정평가형자격, 일학습병행자격)',
    MODIFY COLUMN series VARCHAR(200) COMMENT '자격증 시리즈/계열 (예: 정보처리, 전기, 건축 등)',
    MODIFY COLUMN title VARCHAR(300) NOT NULL COMMENT '자격증명 (예: 정보처리기사, 세무사)',
    MODIFY COLUMN raw_id VARCHAR(500) NOT NULL COMMENT '원본 식별자 (코드_자격증명, 중복 방지용)',
    MODIFY COLUMN overview TEXT COMMENT '자격증 개요 (LLM 생성, 자격증 소개/설명)',
    MODIFY COLUMN difficulty INT COMMENT '난이도 (1-5, 1: 매우 쉬움, 5: 매우 어려움)',
    MODIFY COLUMN study_period_days INT COMMENT '권장 학습 기간 (일 단위)',
    MODIFY COLUMN recommended_lectures JSON COMMENT '추천 강의 목록 [{platform, title, url, instructor, price, relevance_score}]',
    MODIFY COLUMN exam_info JSON COMMENT '시험 정보 {subjects, exam_type, passing_criteria, total_fee, schedule_link}',
    MODIFY COLUMN career_info JSON COMMENT '취업/진로 정보 {use_cases, related_jobs, average_salary, job_prospects, industry}',
    MODIFY COLUMN user_reviews JSON COMMENT '사용자 후기 요약 {summary, difficulty_feedback, study_tips}',
    MODIFY COLUMN official_sources JSON COMMENT '공식 출처 {official_site, issuing_organization, schedule_page}',
    MODIFY COLUMN study_guide JSON COMMENT '학습 가이드 {study_methods, learning_sequence, time_allocation, success_tips, recommended_books}',
    MODIFY COLUMN vector_id VARCHAR(100) COMMENT 'ChromaDB 벡터 ID (임베딩 동기화용)',
    MODIFY COLUMN passing_rate FLOAT COMMENT '합격률 (%, 0.0-100.0)',
    MODIFY COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    MODIFY COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간';

-- 컬럼 코멘트 확인
-- SHOW FULL COLUMNS FROM certificates;
