# GitHub par Frontend Push karne ke steps

Apne **Command Prompt**, **PowerShell**, ya **VS Code Terminal** mein (jahan Git install hai) ye commands run karo:

---

## 1. Project folder mein jao

```bash
cd "g:\My PROJECT\CommissionShopFrontEnd Current working"
```

---

## 2. README banao (agar pehle se nahi hai)

```bash
echo # commissionShopFrontEnd >> README.md
```

*(Agar README.md pehle se hai to is step ko skip karo.)*

---

## 3. Git repo start karo

```bash
git init
```

---

## 4. Saari files add karo

```bash
git add .
```

*(Sirf README add karna ho to: `git add README.md`)*

---

## 5. Pehla commit karo

```bash
git commit -m "first commit"
```

---

## 6. Branch name set karo

```bash
git branch -M main
```

---

## 7. GitHub remote add karo

```bash
git remote add origin https://github.com/usmantsz/commissionShopFrontEnd.git
```

**Agar pehle se remote add hai** to pehle remove karo, phir dubara add:

```bash
git remote remove origin
git remote add origin https://github.com/usmantsz/commissionShopFrontEnd.git
```

---

## 8. GitHub par push karo

```bash
git push -u origin main
```

- Pehli bar GitHub username / password (ya Personal Access Token) maangega.
- Agar 2FA / HTTPS use kar rahe ho to **Personal Access Token** use karo, password ki jagah.

---

## Ek saath copy-paste (order se run karo)

```bash
cd "g:\My PROJECT\CommissionShopFrontEnd Current working"
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/usmantsz/commissionShopFrontEnd.git
git push -u origin main
```

---

## Errors / Tips

| Error | Solution |
|--------|----------|
| `git is not recognized` | Git install karo: https://git-scm.com/download/win. Install ke baad terminal band karke dubara kholo. |
| `remote origin already exists` | `git remote remove origin` run karo, phir `git remote add origin ...` dubara chalao. |
| `failed to push` / 403 | GitHub par repo **commissionShopFrontEnd** pehle se bana lo (empty repo, README mat add karo). Phir `git push -u origin main`. |
| Password not accepted | GitHub par **Settings → Developer settings → Personal access tokens** se token banao, use token as password. |

---

**Note:** `.env` file `.gitignore` mein hai, isliye push nahi hogi (theek hai). Production ke liye Vercel par Environment Variables set karna hoga.
