module.exports = {
  apps: [
    {
      name: 'certificate-master-frontend',
      script: 'pnpm',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5100
      },
      error_file: '/data01/logs/certificate-master-frontend-service/error.log',
      out_file: '/data01/logs/certificate-master-frontend-service/app.log',
      time: true
    }
  ]
}
