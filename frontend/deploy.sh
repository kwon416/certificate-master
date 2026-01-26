#!/bin/bash
set -e

echo "=== Frontend PM2 Deploy ==="

# 프론트엔드 디렉토리로 이동
cd "$(dirname "$0")"

# 의존성 설치
echo "[1/4] Installing dependencies..."
npm ci

# 빌드
echo "[2/4] Building Next.js..."
npm run build

# 로그 디렉토리 생성
echo "[3/4] Creating log directory..."
mkdir -p logs

# PM2로 실행 (이미 실행 중이면 reload)
echo "[4/4] Starting/Reloading PM2..."

if pm2 describe certificate-frontend > /dev/null 2>&1; then
    echo "Reloading existing process..."
    pm2 reload ecosystem.config.js --update-env
else
    echo "Starting new process..."
    pm2 start ecosystem.config.js
fi

# PM2 상태 저장 (서버 재시작 시 자동 복구)
pm2 save

echo "=== Deploy Complete ==="
pm2 status
