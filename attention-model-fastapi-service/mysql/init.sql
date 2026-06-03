-- MySQL 초기화 스크립트
-- AI 집중도 분석 데이터베이스 초기 설정

CREATE DATABASE IF NOT EXISTS focus_analysis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE focus_analysis;

-- 시간대 설정
SET time_zone = '+00:00';

-- 성능 최적화 설정
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL query_cache_size = 64M;

-- 사용자 권한 설정
GRANT ALL PRIVILEGES ON focus_analysis.* TO 'focus_user'@'%';
GRANT ALL PRIVILEGES ON focus_analysis.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- 인덱스 최적화를 위한 설정
SET GLOBAL innodb_stats_on_metadata = OFF;