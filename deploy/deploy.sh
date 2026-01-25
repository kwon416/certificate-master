#!/bin/bash
# Certificate Master - 배포 스크립트
# 사용법: ./deploy.sh [build|up|down|restart|logs|status]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 변수 파일 확인
check_env_files() {
    if [ ! -f "../backend/.env" ]; then
        log_error "backend/.env 파일이 없습니다!"
        log_info "backend/.env.example을 참고하여 backend/.env를 생성하세요."
        exit 1
    fi
    if [ ! -f "../frontend/.env" ] && [ ! -f "../frontend/.env.local" ]; then
        log_error "frontend/.env 또는 frontend/.env.local 파일이 없습니다!"
        log_info "frontend/.env.sample을 참고하여 frontend/.env를 생성하세요."
        exit 1
    fi
    log_info "환경 변수 파일 확인 완료"
}

# 빌드
build() {
    check_env_files
    log_info "Docker 이미지 빌드 중..."
    docker-compose build
    log_info "빌드 완료!"
}

# 시작
up() {
    check_env_files
    log_info "서비스 시작 중..."
    docker-compose up -d
    log_info "서비스 시작 완료!"
    log_info "Frontend: https://dev-cert.i-ve.ai"
    log_info "API Docs: https://dev-cert.i-ve.ai/docs"
}

# 중지
down() {
    log_info "서비스 중지 중..."
    docker-compose down
    log_info "서비스 중지 완료!"
}

# 재시작
restart() {
    log_info "서비스 재시작 중..."
    docker-compose restart
    log_info "재시작 완료!"
}

# 로그
logs() {
    docker-compose logs -f "$@"
}

# 상태
status() {
    docker-compose ps
}

# Health Check
health() {
    log_info "Health Check 실행 중..."
    curl -s http://localhost:5100/health | jq . || echo "Health check 실패"
}

# 업데이트 배포
update() {
    log_info "Git pull 중..."
    cd "$SCRIPT_DIR/.."
    git pull origin main
    cd "$SCRIPT_DIR"

    log_info "이미지 재빌드 중..."
    docker-compose build

    log_info "서비스 재시작 중..."
    docker-compose up -d

    log_info "업데이트 완료!"
}

# 메인
case "${1:-help}" in
    build)
        build
        ;;
    up)
        up
        ;;
    down)
        down
        ;;
    restart)
        restart
        ;;
    logs)
        shift
        logs "$@"
        ;;
    status)
        status
        ;;
    health)
        health
        ;;
    update)
        update
        ;;
    *)
        echo "Certificate Master 배포 스크립트"
        echo ""
        echo "사용법: $0 {command}"
        echo ""
        echo "명령어:"
        echo "  build    - Docker 이미지 빌드"
        echo "  up       - 서비스 시작"
        echo "  down     - 서비스 중지"
        echo "  restart  - 서비스 재시작"
        echo "  logs     - 로그 보기 (logs backend / logs frontend)"
        echo "  status   - 서비스 상태 확인"
        echo "  health   - Health check 실행"
        echo "  update   - 코드 업데이트 후 재배포"
        ;;
esac
