-- ./db_init/init.sql

-- 이 스크립트는 컨테이너가 처음 생성될 때 단 한 번만 실행
-- docker-compose.yml의 MYSQL_DATABASE와 동일한 이름을 사용
-- 만약 데이터베이스가 이미 존재하면 오류가 날 수 있으므로, 아래 라인을 추가하면 더 안전(혹시나 해서)
CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE};
USE ${MYSQL_DATABASE};

-- 최종 승인된 영수증 정보를 저장할 테이블
CREATE TABLE IF NOT EXISTS verified_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_id VARCHAR(255) UNIQUE NOT NULL, -- Redis에서 사용했던 고유 ID
    vendor_name VARCHAR(255),
    purchase_date DATE,
    total_amount DECIMAL(10, 2),
    items_json JSON, -- 구매 항목들은 JSON 형태로 저장
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 수동 등록 항목 (카테고리 등)을 관리할 테이블
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 필요하다면 초기 카테고리 데이터 추가
INSERT INTO categories (name, description) VALUES
('식비', '식사, 음료, 간식 등'),
('교통비', '대중교통, 주유비, 택시비 등'),
('사무용품', '문구류, 비품 구매 등')
ON DUPLICATE KEY UPDATE name=name; -- 이미 존재하면 무시