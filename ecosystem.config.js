module.exports = {
  apps: [
    {
      name: 'aguaone-whatsapp-bot',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '120M', // Auto-restart if memory ever leaks beyond 120MB
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      }
    }
  ]
};
