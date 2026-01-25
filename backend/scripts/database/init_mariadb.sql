-- Certificate Master - MariaDB Tables
-- 실행 방법: mysql -h dev01.server.ivetech.co.kr -P 13306 -u ivetech -p < init_mariadb.sql

-- 1. 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS certificate_master
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE certificate_master;

-- 2. CERTIFICATES 테이블
CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) NOT NULL COMMENT '자격구분코드 - deprecated, categories 사용 권장',
    category VARCHAR(100) NOT NULL COMMENT '자격구분명 - deprecated, categories 사용 권장',
    categories JSON DEFAULT NULL COMMENT '자격증 분류 목록 [{code, name}] - M:N 관계 지원',
    series VARCHAR(200),
    title VARCHAR(300) NOT NULL,
    raw_id VARCHAR(500) UNIQUE NOT NULL,

    -- Enriched data
    overview TEXT,
    difficulty INT,
    study_period_days INT,
    recommended_lectures JSON,
    exam_info JSON,
    career_info JSON,
    user_reviews JSON,
    official_sources JSON,
    study_guide JSON,
    vector_id VARCHAR(100),
    passing_rate DECIMAL(5,2),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_title (title),
    INDEX idx_category (category),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. STUDY_PLANS 테이블
CREATE TABLE IF NOT EXISTS study_plans (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    certificate_id VARCHAR(36) NOT NULL,
    title VARCHAR(300) NOT NULL,
    target_date DATE NOT NULL,
    daily_study_hours DECIMAL(4,2) DEFAULT 2.0,
    status VARCHAR(20) DEFAULT 'active',
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,
    total_weeks INT,
    estimated_total_hours DECIMAL(8,2),
    topics JSON,
    milestones JSON,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. CHECKINS 테이블
CREATE TABLE IF NOT EXISTS checkins (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    study_plan_id VARCHAR(36) NOT NULL,
    checkin_date DATE NOT NULL,
    hours_studied DECIMAL(4,2) NOT NULL,
    completed_topics JSON,
    notes TEXT,
    mood VARCHAR(20),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_user_plan_date (user_id, study_plan_id, checkin_date),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 샘플 데이터
INSERT INTO certificates (id, code, category, categories, title, raw_id, difficulty, overview) VALUES
(UUID(), 'T', '국가기술자격', JSON_ARRAY(JSON_OBJECT('code', 'T', 'name', '국가기술자격')), '정보처리기사', 'T_정보처리기사', 3, '정보처리기사는 컴퓨터를 효과적으로 활용하기 위해 하드웨어뿐만 아니라 정보 처리 기술 및 소프트웨어 운용 기술을 갖춘 전문 인력을 양성하기 위한 국가기술자격입니다.'),
(UUID(), 'T', '국가기술자격', JSON_ARRAY(JSON_OBJECT('code', 'T', 'name', '국가기술자격')), '정보처리산업기사', 'T_정보처리산업기사', 2, '정보처리산업기사는 정보처리기사의 전 단계 자격증으로, 정보 시스템 개발 및 운영에 필요한 기본 지식을 평가합니다.'),
(UUID(), 'S', '국가전문자격', JSON_ARRAY(JSON_OBJECT('code', 'S', 'name', '국가전문자격')), '세무사', 'S_세무사', 5, '세무사는 세무에 관한 전문적인 지식을 바탕으로 납세자의 세금 신고를 대리하고, 세무 상담 및 자문을 제공하는 국가전문자격입니다.');

-- 결과 확인
SELECT 'Tables created successfully!' AS result;
SELECT COUNT(*) AS certificate_count FROM certificates;
