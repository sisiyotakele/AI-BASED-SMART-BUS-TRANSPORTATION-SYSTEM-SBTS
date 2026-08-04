/**
 * PM2 Ecosystem Configuration
 * For production process management
 * 
 * Start: pm2 start ecosystem.config.js --env production
 * Monitor: pm2 monit
 * Logs: pm2 logs sbts-backend
 * Restart: pm2 restart sbts-backend
 * Stop: pm2 stop sbts-backend
 */

module.exports = {
    apps: [
        {
            name: 'sbts-backend',
            script: './dist/server.js',
            instances: 'max', // Use all CPU cores
            exec_mode: 'cluster',

            // Environment
            env_production: {
                NODE_ENV: 'production',
                PORT: 4000,
            },

            env_development: {
                NODE_ENV: 'development',
                PORT: 4000,
            },

            // Logging
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Monitoring
            max_memory_restart: '1G',
            min_uptime: '10s',
            max_restarts: 10,
            autorestart: true,

            // Advanced
            watch: false, // Don't watch in production
            ignore_watch: ['node_modules', 'logs', 'uploads'],

            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,
        },
    ],
};
