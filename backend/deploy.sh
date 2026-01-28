#!/bin/bash
set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Certificate Master - Backend Deploy  ${NC}"
echo -e "${GREEN}========================================${NC}"

# 스크립트 디렉토리로 이동
cd "$(dirname "$0")"

# 1. 이전 컨테이너 정리
echo -e "\n${YELLOW}[1/4] 이전 컨테이너 정리...${NC}"
docker-compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true

# 2. 이미지 빌드 (BuildKit 캐시 활용)
echo -e "\n${YELLOW}[2/4] Docker 이미지 빌드 (캐시 활용)...${NC}"
DOCKER_BUILDKIT=1 docker-compose -f docker-compose.yml build

# 3. 컨테이너 시작
echo -e "\n${YELLOW}[3/4] 컨테이너 시작...${NC}"
docker-compose -f docker-compose.yml up -d

# 4. 상태 확인
echo -e "\n${YELLOW}[4/4] 상태 확인...${NC}"
sleep 5

if docker ps | grep -q certificate-master-backend; then
    echo -e "\n${GREEN}✅ 백엔드 배포 성공!${NC}"
    echo -e "   컨테이너: certificate-master-backend"
    echo -e "   포트: 8000"
    echo -e "   Health: http://localhost:8000/health"
    echo -e "   Docs: http://localhost:8000/docs"

    # 로그 출력
    echo -e "\n${YELLOW}최근 로그:${NC}"
    docker logs certificate-master-backend --tail 10
else
    echo -e "\n${RED}❌ 배포 실패!${NC}"
    docker-compose -f docker-compose.yml logs
    exit 1
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  배포 완료!                            ${NC}"
echo -e "${GREEN}========================================${NC}"
