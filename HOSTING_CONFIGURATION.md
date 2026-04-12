# MHTCET College Predictor Platform - Hosting Configuration

## Project Overview
This is a **full-stack MERN application** with separate Frontend (React/Vite) and Backend (Node.js/Express).

---

## 🚀 DEPLOYMENT STRATEGY

### Option 1: Deploy Backend and Frontend Separately (RECOMMENDED)

#### **BACKEND DEPLOYMENT**

**Service Name:** `mhtcet-backend` or `college-predictor-api`

**Language:** Node.js

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Root Directory:** 
```
college-predictor-platform/backend
```

**Environment Variables:**
```
GEMINI_API_KEY=AIzaSyD7Rrfb6m-GHY82Llyd91eRN6GGECdzvY4
SERVER_PORT=3001
NODE_ENV=production
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<generate-a-secure-key>
CORS_ORIGIN=https://your-frontend-domain.com
```

**Instance Type:** 
- **Free Tier** (Hobby): 512MB RAM, 0.1 CPU - Suitable for low traffic
- **Starter**: $7/month - Recommended for small-medium traffic

**Memory Requirements:** Minimum 512MB (Puppeteer for PDF generation needs resources)

---

#### **FRONTEND DEPLOYMENT**

**Service Name:** `mhtcet-frontend` or `college-predictor-web`

**Language:** Node.js (for serving built app)

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```
*(This serves the built frontend from `/dist` with proper port binding for production)*

**Root Directory:**
```
college-predictor-platform/frontend
```

**Environment Variables:**
```
VITE_API_URL=https://your-backend-api.onrender.com
VITE_ENV=production
PORT=3000
```

**Instance Type:**
- **Free Tier**: Sufficient for static content serving
- **Starter**: $7/month if you need more reliability

---

### Option 2: Deploy as Single Service (Full Stack)

If you prefer a single deployment, you'll need to:
1. Modify the backend to serve the built frontend
2. Update the backend start command to handle static file serving

---

## 📋 COMPLETE HOSTING FORM - BACKEND

| Field | Value |
|-------|-------|
| **Name** | MHTCET-Backend |
| **Language** | Node.js |
| **Branch** | main |
| **Region** | Oregon (US West) |
| **Root Directory** | `college-predictor-platform/backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Starter ($7/month) or Free |

### Environment Variables (Backend):
```
GEMINI_API_KEY=AIzaSyD7Rrfb6m-GHY82Llyd91eRN6GGECdzvY4
SERVER_PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mhtcet
JWT_SECRET=your_secret_key_here_min_32_chars
CORS_ORIGIN=https://mhtcet-frontend.onrender.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password_here
```

---

## 📋 COMPLETE HOSTING FORM - FRONTEND

| Field | Value |
|-------|-------|
| **Name** | MHTCET-Frontend |
| **Language** | Node.js |
| **Branch** | main |
| **Region** | Oregon (US West) |
| **Root Directory** | `college-predictor-platform/frontend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free or Starter ($7/month) |

### Environment Variables (Frontend):
```
VITE_API_URL=https://mhtcet-backend.onrender.com
VITE_ENV=production
PORT=3000
```

---

## 🗄️ DATABASE SETUP

### MongoDB Setup (Required)
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Generate connection string: `mongodb+srv://username:password@cluster.mongodb.net/mhtcet`
4. Add connection string to backend environment variables as `MONGODB_URI`

---

## 🔑 CRITICAL ENVIRONMENT VARIABLES EXPLANATION

| Variable | Purpose | Example |
|----------|---------|---------|
| `GEMINI_API_KEY` | Google's AI API for content generation | `AIzaSyD...` |
| `MONGODB_URI` | Database connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Token signing key (min 32 chars) | Generate with: `openssl rand -base64 32` |
| `NODE_ENV` | Environment mode | `production` |
| `CORS_ORIGIN` | Allowed frontend domain | `https://mhtcet-frontend.onrender.com` |
| `SERVER_PORT` | Backend port | `3001` |
| `VITE_API_URL` | Backend API URL for frontend | `https://mhtcet-backend.onrender.com` |

---

## 📊 RESOURCE REQUIREMENTS

### Backend Specifications
- **CPU:** 0.5 CPU minimum (uses Puppeteer for PDF generation)
- **RAM:** 512MB minimum, 1GB recommended
- **Disk:** 1GB (includes node_modules)
- **Concurrent Users:** 50-100 on Free tier

### Frontend Specifications
- **CPU:** 0.1 CPU sufficient
- **RAM:** 512MB (static content serving)
- **Disk:** 500MB
- **Users:** Unlimited (CDN-friendly)

### Python Models
- If using enhanced ML models, deploy separately as Python service
- Location: `python_models/` directory
- Framework: Flask
- Recommendation: Python 3.11 runtime on separate service

---

## 🔒 SECURITY CHECKLIST

Before deployment:
- [ ] Generate new JWT_SECRET (don't use default)
- [ ] Rotate GEMINI_API_KEY if exposed
- [ ] Enable CORS with specific frontend domain
- [ ] Use environment variables for ALL secrets
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS (automatic on Render)
- [ ] Configure MongoDB IP whitelist
- [ ] Set rate limiting (already configured in backend)

---

## 📈 SCALING RECOMMENDATIONS

**Current Architecture Load:**
- Free tier: ~50-100 concurrent users
- Starter ($7): ~500-1000 concurrent users
- Standard ($25): ~5000+ concurrent users

**When to upgrade:**
- >50% CPU usage consistently
- >80% memory usage
- Database response time > 500ms

---

## 🚀 DEPLOYMENT STEPS SUMMARY

1. **Create Render Account** → [render.com](https://render.com)
2. **Create Backend Service**
   - Connect GitHub repo
   - Set Root Directory: `college-predictor-platform/backend`
   - Add environment variables (see above)
   - Deploy

3. **Create Frontend Service**
   - Connect GitHub repo
   - Set Root Directory: `college-predictor-platform/frontend`
   - Add `VITE_API_URL` pointing to backend
   - Deploy

4. **Setup Database**
   - Create MongoDB Atlas cluster
   - Add connection string to backend env vars
   - Run seeder: POST `/api/seed` (optional)

5. **Test Integration**
   - Frontend URL should connect to Backend URL
   - Check browser console for API errors
   - Test prediction functionality

6. **Monitor**
   - Watch logs in Render dashboard
   - Monitor performance metrics
   - Set up alerts for errors

---

## 📞 QUICK TROUBLESHOOTING

**"Cannot connect to API"**
- Check CORS_ORIGIN matches frontend domain
- Verify VITE_API_URL is correct
- Check backend logs

**"Puppeteer out of memory"**
- Upgrade instance to at least Starter
- Reduce concurrent PDF generation requests

**"Database connection failed"**
- Verify MONGODB_URI format
- Check MongoDB whitelist IP (add 0.0.0.0/0 for Render)

**"Build fails"**
- Check Node version compatibility (v16+)
- Run `npm install` locally to verify
- Check build logs in Render

**"No open ports detected on 0.0.0.0" (Frontend)**
- This error occurs when using `vite preview` (which only binds to localhost)
- ✅ Fixed: Now using Express server (`npm start`) that properly binds to `0.0.0.0:3000`
- Ensure your build command includes: `npm install && npm run build`
- Ensure your start command is: `npm start`

---

## 💰 ESTIMATED MONTHLY COSTS

| Component | Tier | Cost |
|-----------|------|------|
| Backend | Starter | $7 |
| Frontend | Free | $0 |
| MongoDB | Free | $0 |
| **Total** | | **$7-15/month** |

*Upgrade to Standard ($25) for production reliability*

---

## 📚 TECHNOLOGY STACK SUMMARY

**Frontend:**
- React 18 + Vite
- Tailwind CSS + Shadcn UI
- Axios for API calls
- React Router for navigation

**Backend:**
- Node.js + Express.js
- Mongoose + MongoDB
- JWT authentication
- Puppeteer for PDF generation
- Helmet for security

**APIs & Services:**
- Google Gemini AI (chat/predictions)
- MongoDB Atlas (database)
- Cloudinary (optional for images)

---

## 🆘 Getting Help

- **Render Support:** docs.render.com
- **MongoDB Help:** docs.mongodb.com
- **Backend Issues:** Check `/backend/README.md`
- **Frontend Issues:** Check `/frontend/README.md`

---

*Last Updated: April 2026*
