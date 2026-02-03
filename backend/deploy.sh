#!/bin/bash
# ============================================================
# Certificate Master Backend - 통합 배포 스크립트
# ============================================================
# 사용법:
#   ./deploy.sh dev   - 개발 환경 배포
#   ./deploy.sh prod  - 운영 환경 배포
# ============================================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 스크립트 디렉토리
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 설정
IMAGE_NAME="certificate-master-backend"
CONTAINER_NAME="certificate-master-backend"
HEALTH_CHECK_URL="http://localhost:8000/health"

# 환경 인자 처리
ENV="${1:-dev}"

case "$ENV" in
    dev|development)
        ENV_NAME="개발"
        COMPOSE_FILE="docker-compose.yml"
        MAX_STARTUP_TIME=60
        BACKUP_ENABLED=false
        ;;
    prod|production)
        ENV_NAME="운영"
        COMPOSE_FILE="docker-compose.production.yml"
        MAX_STARTUP_TIME=120
        BACKUP_ENABLED=true
        BACKUP_RETENTION=3
        ;;
    *)
        echo -e "${RED}[ERROR] 알 수 없는 환경: $ENV${NC}"
        echo ""
        echo "사용법: $0 [dev|prod]"
        echo "  dev  - 개발 환경 배포 (기본값)"
        echo "  prod - 운영 환경 배포"
        exit 1
        ;;
esac

# 유틸리티 함수
log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ============================================================
# 배포 시작
# ============================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Certificate Master - ${ENV_NAME} 배포  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 환경 검사
log "1/6. 환경 검사..."

[[ -f ".env" ]] || error ".env 파일이 없습니다."
[[ -f "$COMPOSE_FILE" ]] || error "$COMPOSE_FILE 파일이 없습니다."

# 필수 환경 변수 검사
source .env
[[ -n "$MARIADB_HOST" ]] || error "MARIADB_HOST가 설정되지 않았습니다."
[[ -n "$CHROMA_HOST" ]] || error "CHROMA_HOST가 설정되지 않았습니다."
[[ -n "$SUPABASE_URL" ]] || error "SUPABASE_URL이 설정되지 않았습니다."
[[ -n "$SEARXNG_BASE_URL" ]] || error "SEARXNG_BASE_URL이 설정되지 않았습니다."

log "   ✅ 환경 변수 검사 완료"
log "   📍 환경: $ENV_NAME"
log "   📍 Compose: $COMPOSE_FILE"
log "   📍 DB: $MARIADB_HOST:$MARIADB_PORT"

# 2. 이전 이미지 백업 (운영만)
log "2/6. 이전 이미지 백업..."

if [[ "$BACKUP_ENABLED" == "true" ]] && docker images | grep -q "$IMAGE_NAME"; then
    BACKUP_TAG="backup-$(date +%Y%m%d-%H%M%S)"
    docker tag "$IMAGE_NAME:latest" "$IMAGE_NAME:$BACKUP_TAG" 2>/dev/null || true
    log "   ✅ 백업 태그: $IMAGE_NAME:$BACKUP_TAG"

    # 오래된 백업 정리
    OLD_BACKUPS=$(docker images "$IMAGE_NAME" --format "{{.Tag}}" | grep "^backup-" | sort -r | tail -n +$((BACKUP_RETENTION + 1)))
    for tag in $OLD_BACKUPS; do
        docker rmi "$IMAGE_NAME:$tag" 2>/dev/null || true
        log "   🗑️ 오래된 백업 삭제: $tag"
    done
else
    log "   ⏭️ 백업 스킵 (개발 환경 또는 이전 이미지 없음)"
fi

# 3. 이전 컨테이너 정리
log "3/6. 이전 컨테이너 정리..."
docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

# 4. 이미지 빌드
log "4/6. Docker 이미지 빌드..."

if [[ "$ENV" == "prod" || "$ENV" == "production" ]]; then
    # 운영: BuildKit + 클린 빌드 (캐시 마운트는 유지)
    DOCKER_BUILDKIT=1 docker-compose -f "$COMPOSE_FILE" build --no-cache || error "빌드 실패"
else
    # 개발: BuildKit + 캐시 활용
    DOCKER_BUILDKIT=1 docker-compose -f "$COMPOSE_FILE" build || error "빌드 실패"
fi
log "   ✅ 빌드 완료"

# 5. 컨테이너 시작
log "5/6. 컨테이너 시작..."
docker-compose -f "$COMPOSE_FILE" up -d || error "컨테이너 시작 실패"

# 6. Health check
log "6/6. Health check..."
start_time=$(date +%s)

while true; do
    if curl -sf "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
        echo ""
        log "   ✅ 서비스 정상 동작!"
        break
    fi

    elapsed=$(($(date +%s) - start_time))
    if [[ $elapsed -gt $MAX_STARTUP_TIME ]]; then
        echo ""
        error "서비스가 ${MAX_STARTUP_TIME}초 내에 시작되지 않았습니다."
    fi

    echo -ne "   ⏳ 서비스 시작 대기 중... ($elapsed/${MAX_STARTUP_TIME}s)\r"
    sleep 3
done

# ============================================================
# 결과 출력
# ============================================================

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ ${ENV_NAME} 배포 완료!             ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  📍 환경:    ${ENV_NAME}"
echo -e "  📍 Health:  $HEALTH_CHECK_URL"
echo -e "  📍 Docs:    http://localhost:8000/docs"
echo ""

# 최근 로그 출력
echo -e "${YELLOW}최근 로그:${NC}"
docker logs "$CONTAINER_NAME" --tail 10
echo ""

# DB 상태 확인
log "DB 연결 확인..."
DB_STATUS=$(curl -sf "http://localhost:8000/health/db" 2>/dev/null || echo '{"status":"unknown"}')
echo -e "  📊 DB 상태: $DB_STATUS"
echo ""
