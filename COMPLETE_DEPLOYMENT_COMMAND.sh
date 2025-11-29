#!/bin/bash
# Complete deployment command - copies everything and deploys
# This script moves files from DEPLOY_TO_VPS and deploys the app

cd /var/www/cryptorafts && ([ -d "DEPLOY_TO_VPS" ] && (echo "Moving files from DEPLOY_TO_VPS..." && mv DEPLOY_TO_VPS/* . 2>/dev/null || true) && (mv DEPLOY_TO_VPS/.* . 2>/dev/null || true) && rmdir DEPLOY_TO_VPS 2>/dev/null && echo "✅ Files moved!" || echo "Files already in place")) && ls -la package.json && ls -la src/app/page.tsx && export NVM_DIR="$HOME/.nvm" && ([ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" || (echo "Installing NVM..." && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh")) && echo "Installing Node.js 20..." && nvm install 20 && nvm use 20 && echo "✅ Node.js $(node --version) active" && echo "Installing dependencies (5-10 minutes)..." && npm install --legacy-peer-deps && echo "✅ Dependencies installed" && echo "Building app (5-10 minutes)..." && rm -rf .next out node_modules/.cache && NODE_ENV=production npm run build && echo "✅ Build completed" && cat > server.js << 'EOFSERVER'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
EOFSERVER
NODE_PATH=$(which node) && cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'cryptorafts',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      interpreter: '$NODE_PATH',
      env: { NODE_ENV: 'production', PORT: 3000 },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
EOF
mkdir -p logs && echo "Stopping old PM2 processes..." && pm2 stop all 2>/dev/null || true && pm2 delete all 2>/dev/null || true && sleep 2 && echo "Starting PM2..." && pm2 start ecosystem.config.js && pm2 save && pm2 status && sleep 5 && pm2 logs cryptorafts --lines 20 --nostream && echo "" && echo "✅ DEPLOYMENT COMPLETE!" && echo "🌐 Visit: https://www.cryptorafts.com"

