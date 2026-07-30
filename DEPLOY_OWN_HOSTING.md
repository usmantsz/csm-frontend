# Apni Hosting / Subdomain par Frontend Upload (Vercel ki jagah)

Commission Shop frontend ko apne hosting (cPanel, Hostinger, etc.) par subdomain pe deploy karne ke steps.

---

## 1. Local par build banao

Project folder mein:

```bash
cd "g:\My PROJECT\CommissionShopFrontEnd Current working"
npm run build
```

- Build complete hone par **`dist`** folder banega.
- Us **`dist`** folder ke **andar ki saari cheezein** (files + folders) upload karni hain, **`dist` folder khud nahi**.

---

## 2. Subdomain banao (hosting panel se)

- **cPanel** / **Hostinger** / **DirectAdmin** etc. mein jao.
- **Subdomains** (ya **Domains** → **Subdomains**) pe jao.
- Naya subdomain add karo, jaise:
  - **Subdomain:** `app` ya `shop` ya `commission`
  - **Domain:** `aapkadomain.com`
  - **Result:** `app.aapkadomain.com` (ya `shop.aapkadomain.com`)

- Subdomain ka **Document Root** note karo, jaise:
  - `public_html/app` ya
  - `home/username/public_html/shop`

---

## 3. Build ki files upload karo

**Option A – File Manager (browser se)**  
1. Hosting **File Manager** kholo.  
2. Subdomain ke **Document Root** folder mein jao (e.g. `public_html/app`).  
3. **Upload** pe click karo.  
4. **`dist`** folder ke andar ki **saari files aur folders** select karke upload karo:
   - `index.html` (root pe)
   - `assets` folder (saari CSS/JS files ke saath)

**Option B – FTP (FileZilla etc.)**  
1. FTP se connect karo (hosting panel se FTP user/password).  
2. Local: `g:\My PROJECT\CommissionShopFrontEnd Current working\dist`  
3. Remote: subdomain ka document root (e.g. `public_html/app`)  
4. `dist` ke andar ki saari files/folders drag karke upload karo (root pe `index.html` aur `assets` dikhna chahiye).

---

## 4. SPA routing (direct URL / refresh) – zaroori

Agar **.htaccess** build ke andar aa gaya ho (project mein `public/.htaccess` hai to build ke baad `dist/.htaccess` hona chahiye), to Apache pe subdomain pe refresh/direct URL theek kaam karenge.

- Agar **Apache** hai aur **.htaccess** support hai: kuch aur mat karo, bas upload sahi jagah karo.  
- Agar **.htaccess** upload ke baad bhi nahi dikh raha:  
  - `public/.htaccess` ko manually copy karke subdomain root pe `dist` wale folder mein **.htaccess** naam se upload karo.

**Nginx** use ho raha ho (VPS) to subdomain ke server block mein ye add karo:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Phir `sudo nginx -t` aur reload.

---

## 5. Environment / API URL

- Production API URL **build se pehle** set karo.
- `.env` mein (ya build run se pehle):

```env
VITE_API_BASE_URL=https://commissionshopapi.onrender.com
VITE_API_URL=https://commissionshopapi.onrender.com/api
```

- Phir **dubara build** chalao: `npm run build`
- Jo naya `dist` bane, wahi upload karo.

Agar hosting pe env set nahi kar sakte to same `.env` use karke hi build karna padega; Vite build time par env inject karta hai.

---

## 6. Backend CORS

- Backend (e.g. Render) pe **CORS** mein apna subdomain add karo, jaise:
  - `https://app.aapkadomain.com`
- Backend env / config:  
  `CORS_ORIGIN=https://app.aapkadomain.com`

---

## 7. Check karo

- Browser mein: `https://app.aapkadomain.com` (ya jo subdomain ho).
- Login / navigation test karo.
- Koi route direct open karo (e.g. `/customerbalance`) aur refresh karo – 404 nahi aana chahiye (agar .htaccess/nginx sahi hai).

---

## Short checklist

| Step | Kaam |
|------|------|
| 1 | `npm run build` |
| 2 | Hosting pe subdomain banao, document root note karo |
| 3 | `dist` ke andar ki saari cheezein subdomain root pe upload karo |
| 4 | Apache: `.htaccess` root pe hona chahiye; Nginx: `try_files $uri $uri/ /index.html;` |
| 5 | `.env` mein API URL set karke phir se build + upload |
| 6 | Backend CORS mein subdomain URL add karo |

Is tarah aap Vercel use kiye bina apni hosting par subdomain pe frontend upload kar sakte ho.
