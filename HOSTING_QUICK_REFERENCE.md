# HOSTING FORM - QUICK FILL REFERENCE

## FOR BACKEND SERVICE

```
Service Name:       MHTCET-Backend
Language:           Node.js
Branch:             main
Region:             Oregon (US West)
Root Directory:     college-predictor-platform/backend
Build Command:      npm install
Start Command:      npm start
Instance Type:      Starter ($7/month) recommended, Free acceptable

Environment Variables to Add:
  KEY                    VALUE
  ─────────────────────────────────────────────────────
  GEMINI_API_KEY        AIzaSyD7Rrfb6m-GHY82Llyd91eRN6GGECdzvY4
  SERVER_PORT           3001
  NODE_ENV              production
  MONGODB_URI           (Get from MongoDB Atlas - required)
  JWT_SECRET            (Generate: openssl rand -base64 32)
  CORS_ORIGIN           https://mhtcet-frontend.onrender.com
```

---

## FOR FRONTEND SERVICE

```
Service Name:       MHTCET-Frontend
Language:           Node.js
Branch:             main
Region:             Oregon (US West)
Root Directory:     college-predictor-platform/frontend
Build Command:      npm install && npm run build
Start Command:      npm start
Instance Type:      Free tier acceptable

Environment Variables to Add:
  KEY                    VALUE
  ─────────────────────────────────────────────────────
  VITE_API_URL          https://mhtcet-backend.onrender.com
  PORT                  3000
```

---

## SETUP ORDER

1. Create Backend service first (get the deployed URL)
2. Create Frontend service with Backend URL from step 1
3. Setup MongoDB Atlas (free tier)
4. Add MongoDB connection string to Backend env vars
5. Test both services

---

## IMPORTANT NOTES

- ⚠️ Replace MONGODB_URI with your actual MongoDB Atlas connection string
- ⚠️ Generate a strong JWT_SECRET (don't use default)
- ⚠️ Starter ($7) recommended for production; Free tier suitable for testing
- ℹ️ Both services in same region for faster communication
- ℹ️ Frontend will show as "Undeployed" until you add VITE_API_URL env var
