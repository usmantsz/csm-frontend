# Testing Checklist: Role Flows & Language Switch

Use this checklist to manually test each role and the EN/Urdu language switch. Run the app (`npm run dev`) before starting.

---

## Role reference

| Role          | Code       | Login URL           |
|---------------|------------|---------------------|
| Super Admin   | `0`        | `/admin-login`      |
| Shop Owner    | `1`        | `/shopowner-login`  |
| Sub Admin     | `2`        | `/team-member-login`|
| Team Member   | `3`        | `/team-member-login`|
| Customer      | `customer` | `/customer-login`   |
| POS (Pesticide)| `1` (POS)  | `/pos-login`        |

---

## 1. Super Admin (role `0`)

**Login:** Go to `/admin-login`, sign in as Super Admin.

- [ ] **Dashboard** – After login, lands on dashboard. Sees "Admin Overview" (or Urdu equivalent). Cards: Total Shops, Shop Owners, Total Customers, Total Crops, Dana Mandi Orders, Sabzi Mandi Orders. Quick Actions: Shops, Shop Owners, Crops, Subscriptions.
- [ ] **Shops & Owners** – Menu: Shops & Owners → All Shops. Page loads, table shows shops. Open one shop (Shop View). Back to menu → Shop Owners → list loads. → Create Shop Owner → wizard steps (User Details, Shop Details, Subscription, Assign Crops) work.
- [ ] **Subscriptions** – Menu: Subscriptions → All Subscriptions, Add Subscription, Subscription History. Pages load; forms and tables show correctly.
- [ ] **Crops** – Menu: Crops → All Crops, Add New Crop. List and add form work. Edit an existing crop.
- [ ] **Pesticide POS** – Go to `/pesticide-pos/register`, `/pesticide-pos/subscriptions`, `/pesticide-pos/shops`, `/pesticide-pos/owners`, `/pesticide-pos/subscription-history`. All pages load (no redirect to login).
- [ ] **Team** – Go to `/admin/team` (or Team from menu). Team list loads. Add Team Member form works.
- [ ] **Support** – If menu has "All Tickets" or similar, open it; list/detail loads.
- [ ] **Shop deep links** – From All Shops, open a shop → View. Then try: Customers, Finance, Expenses tabs/pages for that shop. All load.

---

## 2. Shop Owner (role `1`)

**Login:** Go to `/shopowner-login`, sign in as Shop Owner.

- [ ] **Dashboard** – Lands on shop owner dashboard. Commission panel, loan panel, quarter filter, quick actions visible.
- [ ] **My Crops** – Menu: My Crops → `/getassginshopcrops`. Page shows assigned crops or empty state. Click a crop if any; flow works.
- [ ] **POS Shop Management** – Menu: POS Shop Management → `/pos-shop-management`. Page loads.
- [ ] **Customers** – Menu: Customers → Customer List, Add Customer, Customer Balance. List and add form work. Balance page loads.
- [ ] **Finance** – Menu: Finance → `/finance`. Page loads. Try loan list / crop finance if linked.
- [ ] **Expenses** – Menu: Expenses → `/expense-management`. Page loads.
- [ ] **Support** – Create Ticket, My Tickets (if in menu). Pages load and submit works.

---

## 3. Sub Admin (role `2`)

**Login:** Go to `/team-member-login`, sign in as a **Sub Admin** user.

- [ ] **Dashboard** – Lands on Team Dashboard / overview. Content matches permissions (no "no permissions" if they have access).
- [ ] **Permitted menus** – Only menus allowed by permissions appear (e.g. Shops, Shop Owners, Subscriptions, Crops, Support – depends on backend permissions). Click each; pages load.
- [ ] **Restricted routes** – Direct URL to admin-only route (e.g. `/pesticide-pos/register`) should redirect or show "no access", not full page.

---

## 4. Team Member (role `3`)

**Login:** Go to `/team-member-login`, sign in as a **Team Member** user.

- [ ] **Dashboard** – Team Dashboard / overview. Same as Sub Admin, content by permissions.
- [ ] **Permitted menus** – Same as Sub Admin; only allowed items visible. Each opens correct page.
- [ ] **Restricted routes** – Same as Sub Admin; no access to admin-only URLs.

---

## 5. Customer (role `customer`)

**Login:** Go to `/customer-login`, sign in as Customer.

- [ ] **Dashboard** – Lands on customer dashboard (limited menu).
- [ ] **My Balance** – Menu: My Balance → `/customerbalance`. Page loads.
- [ ] **My Profile** – Menu: My Profile → `/users/profile` (or profile route). Page loads.
- [ ] **No admin/shop menus** – Shops, Shop Owners, Subscriptions, Crops, POS Management, etc. should NOT appear.

---

## 6. POS (Pesticide shop – layout `pos`)

**Login:** Go to `/pos-login`, sign in with a user that has POS layout (shop owner with POS).

- [ ] **Layout** – Uses POS layout (different header/sidebar), not main dashboard layout.
- [ ] **POS Dashboard** – `/pos/dashboard` loads.
- [ ] **Sale** – `/pos/sale` – add sale flow works (or page loads without error).
- [ ] **Products** – `/pos/products` loads.
- [ ] **Customers** – `/pos/customers` loads.
- [ ] **Sales History** – `/pos/sales-history` loads.
- [ ] **Pending Requests** – `/pos/pending-requests` loads.
- [ ] **Commission Shop Management** – `/pos/commission-shop-management` loads.
- [ ] **Profile** – `/pos/profile` loads.
- [ ] **Receipt** – Create a sale if possible, then open receipt; `/pos/receipt/:id` loads.

---

## 7. Language switch (EN ↔ Urdu)

Test with **one role** (e.g. Super Admin), then optionally repeat with Shop Owner.

### Switch to Urdu (pk)

- [ ] **Language switcher** – Find language/locale switch in header (or settings). Select **Urdu** (or "pk").
- [ ] **Layout** – Page direction switches to **RTL** (content aligned right, sidebar/menu on correct side).
- [ ] **Dashboard** – Titles, labels, card names, quick actions show in Urdu (e.g. "ڈیش بورڈ", "دکانیں اور مالکان").
- [ ] **Horizontal menu** – All items translated: Dashboard, Shops & Owners, Subscriptions, Crops, My Crops, POS Shop Management, Customers, Finance, Expenses, My Balance, My Profile (if visible).
- [ ] **Sub-menus** – Dropdowns (e.g. Shops & Owners → All Shops, Shop Owners, Create Shop Owner) show in Urdu.
- [ ] **Page content** – Open Shops, Shop Owners, Subscriptions, Crops, Create Shop Owner. Table headers, form labels, buttons, empty messages in Urdu.
- [ ] **No raw keys** – No visible translation keys (e.g. `shops_and_owners`) or missing strings; fallback to EN is acceptable if key missing.

### Switch back to English (en)

- [ ] Select **English** (or "en"). Layout switches to **LTR**.
- [ ] Same pages as above show text in English. No mixed Urdu where it should be EN.

### Persist after refresh

- [ ] Set language to Urdu, refresh page (F5). Language remains Urdu and RTL.
- [ ] Set to English, refresh. Language remains English and LTR.

---

## 8. Quick smoke (all roles)

- [ ] Each role can log in and reach its dashboard (or first allowed page).
- [ ] Logout works from each role; after logout, protected URLs redirect to login (or home).
- [ ] No console errors on dashboard load for any role (or note and fix critical ones).

---

## Notes

- **Permissions:** Sub Admin and Team Member see only what their permissions allow; if you don’t have test users with different permission sets, document "tested with default permissions".
- **Data:** Some pages may be empty (no shops, no crops). Test that empty states and messages show correctly in both languages.
- **Browser:** Prefer testing in Chrome/Edge; check RTL in one other browser if possible.

---

*Last updated: Feb 2025*
