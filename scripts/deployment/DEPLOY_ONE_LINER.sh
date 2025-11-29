cd /var/www/cryptorafts && (tar -xzf cryptorafts.tar.gz 2>/dev/null || true) && ([ -d cryptorafts ] && mv cryptorafts/* . 2>/dev/null && mv cryptorafts/.* . 2>/dev/null && rmdir cryptorafts 2>/dev/null || true) && ([ -d DEPLOY_TO_VPS ] && mv DEPLOY_TO_VPS/* . 2>/dev/null && mv DEPLOY_TO_VPS/.* . 2>/dev/null && rmdir DEPLOY_TO_VPS 2>/dev/null || true) && ls -la package.json && ls -la src/app/page.tsx && export NVM_DIR="$HOME/.nvm" && ([ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" || (curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh")) && nvm install 20 && nvm use 20 && npm install --legacy-peer-deps && rm -rf .next out && NODE_ENV=production npm run build && cat > server.js << 'EOFSERVER'
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
NODE_PATH=$(which node) && cat > ecosystem.config.js << 'EOFPM2'
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
EOFPM2
mkdir -p logs && pm2 stop all 2>/dev/null || true && pm2 delete all 2>/dev/null || true && pm2 start ecosystem.config.js && pm2 save && pm2 status && echo "✅ DEPLOYMENT COMPLETE! Visit: https://www.cryptorafts.com"

