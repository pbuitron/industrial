module.exports = {
  apps: [
    {
      name: 'industrial-website-server',
      script: './server/server.js',
      cwd: '/root/industrial',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Configuración de reinicio
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',

      // Logs
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,

      // Configuración de memoria
      max_memory_restart: '500M',

      // Variables de entorno específicas
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'industrial-project',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/root/industrial',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },

      // Configuración de reinicio
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',

      // Logs
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,

      // Configuración de memoria
      max_memory_restart: '800M',

      // Variables de entorno específicas
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}