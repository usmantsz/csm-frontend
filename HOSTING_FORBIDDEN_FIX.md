# Forbidden Error – Fix Steps (Hosting)

Jab "You don't have permission to access this resource" aaye, ye steps try karo:

---

## 1. .htaccess hata kar check karo

Kai hosts **.htaccess** allow nahi karte, isliye 403 Forbidden de dete hain.

- Hosting **File Manager** mein jao jahan app upload ki hai.
- **.htaccess** file ko **rename** karo (e.g. `htaccess.bak`) ya **delete** karo.
- Browser mein site dubara open karo: `https://your-subdomain.com`

**Agar ab site open ho jaye:**  
- Problem .htaccess ki thi. Direct URLs (e.g. `/customerbalance`) refresh pe 404 de sakte hain; baad mein host se pooch sakte ho ke "AllowOverride" / mod_rewrite enable hai ya nahi.
- Abhi ke liye home page se navigate karna kaam karega.

---

## 2. Permissions theek karo

- **Files** (e.g. `index.html`): **644**
- **Folders** (e.g. `assets`): **755**

File Manager mein file/folder → Right‑click → **Permissions / CHMOD** → 644 (files), 755 (folders).

---

## 3. Document root sahi hai confirm karo

- Jis folder mein **index.html** directly hai, subdomain ka **Document Root** wahi hona chahiye.
- Galat example: Document Root = `public_html/app/dist` (and andar **ek aur** folder ho) → Forbidden ho sakta hai.
- Sahi: Document Root = wahi folder jiske andar **index.html** aur **assets** same level pe hon.

---

## 4. Index file naam sahi hai

- File ka naam exactly **index.html** ho (chhota `i`), na ke `Index.html` ya `index.HTML`.
- Agar koi default index (e.g. `index.php`) pehle chal raha ho, to **DirectoryIndex** ya hosting panel se default document **index.html** set karo (agar option ho).

---

## 5. .htaccess phir se use karna ho to (minimal)

Agar host .htaccess allow karta ho aur tum chaho ke direct URLs bhi kaam karein, to sirf ye **ek line** wala .htaccess try karo (baaki sab delete karke):

```apache
DirectoryIndex index.html
```

Agar ye bhi Forbidden de, to .htaccess hata do (step 1).

---

## 6. Hosting support se poocho

Agar upar wale sab ke baad bhi Forbidden aaye, host se ye poocho:

- "Do you allow .htaccess and mod_rewrite for this subdomain?"
- "Is there any security (e.g. ModSecurity) blocking access to this folder?"

---

## Short checklist

| Step | Action |
|------|--------|
| 1 | .htaccess rename/delete karke site open karo |
| 2 | Files 644, folders 755 |
| 3 | Document root = jahan index.html hai |
| 4 | File name = index.html |
| 5 | Agar .htaccess chahiye to sirf `DirectoryIndex index.html` try karo |
