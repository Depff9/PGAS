# Server quick tutorial

## First deploy

1. Connect to server:
   - `ssh root@<SERVER_IP>`
2. Pull latest code:
   - `cd /var/www/pgas-system && git pull`
3. Install/update dependencies:
   - `npm install`
   - `cd backend && npm install`
4. Apply DB migrations:
   - `npm run prisma:deploy`
5. (Optional for demo reset) reseed DB:
   - `npm run prisma:seed`
6. Build frontend:
   - `cd /var/www/pgas-system`
   - `VITE_API_URL="https://api.pgas-demo-site.online/api" npm run build`
7. Restart backend:
   - `pm2 restart pgas-backend`
8. Reload nginx:
   - `systemctl reload nginx`

## Health checks

- Backend:
  - `curl https://api.pgas-demo-site.online/api/health`
- Frontend:
  - open `https://demo.pgas-demo-site.online`

## Useful commands

- Backend logs:
  - `pm2 logs pgas-backend --lines 100`
- PM2 status:
  - `pm2 status`
- Nginx config test:
  - `nginx -t`

