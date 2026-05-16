module.exports = {
  apps: [
    {
      name: "lgk",
      script: "npm",
      args: "run start",
      cwd: "/home/LGK",

      // Environment
      env: {
        NODE_ENV: "production",
      },

      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      out_file: "/var/log/lgk/out.log",
      error_file: "/var/log/lgk/error.log",
      merge_logs: true,

      // Log rotation (requires pm2-logrotate module)
      max_size: "10M",
      retain: 7,
      compress: true,

      // Restart behavior
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      restart_delay: 3000,
      max_restarts: 10,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
