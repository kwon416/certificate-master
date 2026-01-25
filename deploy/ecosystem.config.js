module.exports = {
  apps: [
    {
      name: 'certificate-frontend',
      cwd: '../frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 5100',
      instances: '1', // 클러스터 모드 (CPU 코어 수만큼)
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5100,
        BACKEND_INTERNAL_URL: 'http://127.0.0.1:8000',
      },
      // 로그 설정
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      merge_logs: true,
      // 자동 재시작 설정
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
    },
  ],
};
