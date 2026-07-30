# Local Setup – Kaise local par kaam karen (Team live test karegi)

Ye guide unke liye hai jo **local** par backend + frontend chalate hain; **team** uploaded (live) site test karegi.

---

## 1. Frontend – Local vs Live env

**File:** `CommissionShopFrontEnd Current working\.env`

- **Local par kaam karte waqt:** LOCAL block **uncomment**, LIVE block **comment**  
  - `VITE_API_BASE_URL=http://localhost:4000`  
  - `VITE_API_URL=http://localhost:4000/api`
- **Build for upload / live test:** LOCAL block **comment**, LIVE block **uncomment**  
  - `VITE_API_BASE_URL=https://commissionshopapi.onrender.com`  
  - `VITE_API_URL=https://commissionshopapi.onrender.com/api`

Switch karte waqt sirf .env mein dono blocks ko comment/uncomment karna hai.

---

## 2. Backend – Local vs Live env

**File:** `commissionShopApi Now working\.env`

- **Local par backend chalate waqt:** LOCAL block use karo (copy from `.env.example` if needed):
  - `NODE_ENV=development`
  - `PORT=4000`
  - `MONGODB_URI=...` (local MongoDB ya Atlas)
  - `CORS_ORIGIN=http://localhost:5173,http://localhost:5174`
- **Live (Render):** Wahan env variables panel se set hote hain; .env file upload nahi karni.

---

## 3. Local par kaise chalaen

### Backend (API)

```bash
cd "g:\My PROJECT\commissionShopApi Now working"
npm install
npm start
```

- API: **http://localhost:4000**  
- Ensure `.env` mein LOCAL block active ho (CORS = `http://localhost:5173` etc.).

### Frontend (React)

```bash
cd "g:\My PROJECT\CommissionShopFrontEnd Current working"
npm install
npm run dev
```

- App: **http://localhost:5173**  
- Ensure `.env` mein LOCAL block active ho (API = `http://localhost:4000`).

### Database

- Local MongoDB: `mongodb://localhost:27017/commissionShop`  
- Ya Atlas: .env mein `MONGODB_URI=mongodb+srv://...` daalen.

---

## 4. Build for upload (team live test)

1. **Frontend .env:** LIVE block uncomment, LOCAL comment.
2. Build: `npm run build` (frontend folder mein).
3. `dist` ki contents hosting par upload karo.
4. Kaam khatam hone ke baad .env wapas LOCAL par set kar lena (LOCAL uncomment, LIVE comment).

---

## 5. Short checklist

| Kaam              | Frontend .env     | Backend .env / Run      |
|-------------------|-------------------|--------------------------|
| Local development | LOCAL block on    | LOCAL block on, `npm start` |
| Build for upload  | LIVE block on     | –                        |
| Team live test    | –                 | Team uploaded site use karegi |
