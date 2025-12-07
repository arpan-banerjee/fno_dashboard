# Free Hosting Deployment Guide

This guide will help you deploy your FNO Dashboard to free hosting platforms.

## 📋 Overview

- **Frontend (React)**: Deploy to Vercel or Netlify
- **Backend (Node.js API)**: Deploy to Render
- **Database**: JSON files (included in deployment)
- **Redis**: Optional (can use Render's Redis or disable)

---

## 🚀 Step 1: Deploy Backend API to Render

### Option A: Using Render Dashboard (Recommended)

1. **Create a Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub (recommended for easier deployment)

2. **Connect Your GitHub Repository**
   - Push your code to GitHub if you haven't already
   - In Render Dashboard, click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the Web Service**
   - **Name**: `fno-dashboard-api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build --workspace=apps/api`
   - **Start Command**: `npm start --workspace=apps/api`
   - **Instance Type**: Free

4. **Add Environment Variables**
   Click "Advanced" and add these environment variables:
   ```
   NODE_ENV=production
   PORT=4000
   JWT_SECRET=<generate-a-strong-random-string>
   CORS_ORIGIN=https://your-frontend-app.vercel.app
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your API URL: `https://fno-dashboard-api.onrender.com`

### Option B: Using render.yaml (Blueprint)

1. In Render Dashboard, click "New +" → "Blueprint"
2. Connect repository and select `render.yaml`
3. Update environment variables
4. Deploy

---

## 🌐 Step 2: Deploy Frontend to Vercel

### Using Vercel Dashboard

1. **Create a Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a monorepo

3. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   In Project Settings → Environment Variables:
   ```
   VITE_API_BASE_URL=https://fno-dashboard-api.onrender.com
   ```

5. **Deploy**
   - Click "Deploy"
   - Note your frontend URL: `https://your-project.vercel.app`

6. **Update Backend CORS**
   - Go back to Render
   - Update `CORS_ORIGIN` environment variable with your Vercel URL
   - Redeploy the API

---

## 🔄 Alternative: Deploy Frontend to Netlify

### Using Netlify Dashboard

1. **Create a Netlify Account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub

2. **Add New Site**
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository

3. **Configure Build Settings**
   - **Base directory**: `apps/web`
   - **Build command**: `npm run build`
   - **Publish directory**: `apps/web/dist`

4. **Add Environment Variables**
   In Site settings → Build & deploy → Environment:
   ```
   VITE_API_BASE_URL=https://fno-dashboard-api.onrender.com
   ```

5. **Deploy**
   - Click "Deploy site"
   - Note your frontend URL

---

## 🔧 Step 3: Update Configuration Files

### 1. Update Frontend Environment
Edit `apps/web/.env.production`:
```env
VITE_API_BASE_URL=https://fno-dashboard-api.onrender.com
```

### 2. Update Backend CORS
In Render dashboard, set:
```env
CORS_ORIGIN=https://your-project.vercel.app
```

---

## 📝 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Code is pushed to GitHub
- [ ] All dependencies are in `package.json`
- [ ] Build scripts work locally:
  ```bash
  npm run build --workspace=apps/api
  npm run build --workspace=apps/web
  ```
- [ ] Environment variables are documented
- [ ] `.gitignore` excludes sensitive files

---

## 🔐 Security Considerations

### JWT Secret
Generate a strong JWT secret:
```bash
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

### Environment Variables
Never commit:
- `.env` files with real credentials
- JWT secrets
- Dhan API tokens

---

## 📊 Cost Breakdown (Free Tier Limits)

### Render (Backend)
- ✅ 750 hours/month (always free)
- ✅ 512 MB RAM
- ⚠️  Spins down after 15 min inactivity (cold starts ~30s)
- ✅ Custom domains
- ✅ SSL included

### Vercel (Frontend)
- ✅ Unlimited personal projects
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions
- ✅ Automatic SSL
- ✅ Global CDN

### Netlify (Alternative Frontend)
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Continuous deployment
- ✅ SSL included

---

## 🐛 Troubleshooting

### Backend won't start
- Check build logs in Render dashboard
- Verify `PORT` environment variable
- Ensure start command is correct

### Frontend shows connection errors
- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings in backend
- Ensure API is deployed and running

### Cold Start Issues (Render Free Tier)
- First request after inactivity takes 30-60 seconds
- Consider upgrading to paid tier ($7/month) for always-on
- Or use a cron job to ping your API every 10 minutes

### WebSocket Connection Issues
- Render free tier supports WebSockets
- Ensure WS endpoint is correct (wss://)
- Check firewall/proxy settings

---

## 🔄 Continuous Deployment

Both Vercel and Render support automatic deployments:

1. **Enable Auto-Deploy** (usually enabled by default)
2. **Push to GitHub**: 
   ```bash
   git add .
   git commit -m "Update features"
   git push origin main
   ```
3. **Auto-deploy triggers** for both frontend and backend

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)

---

## 🎯 Quick Command Reference

```bash
# Build both apps locally
npm run build

# Test production build locally
npm run build --workspace=apps/web
npm run build --workspace=apps/api
npm start --workspace=apps/api
```

---

## ✅ Post-Deployment

After successful deployment:

1. Test all features in production
2. Monitor logs in Render dashboard
3. Set up custom domain (optional)
4. Enable analytics (optional)
5. Set up monitoring/uptime checks

---

## 🆘 Need Help?

If you encounter issues:
1. Check deployment logs
2. Verify environment variables
3. Test API endpoints directly
4. Check browser console for errors
