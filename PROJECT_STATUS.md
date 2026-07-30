# Commission Shop Frontend – Project Status

## Tech Stack
- **React 18** + **Vite** + **TypeScript**
- **Redux** (theme, RTL, locale), **React Router 6**, **react-i18next** (EN/Urdu)
- **Mantine** (DataTable, UI), **Tailwind CSS**, **ApexCharts**, **Formik/Yup**

---

## User Roles
| Role        | Code       | Access |
|------------|------------|--------|
| Super Admin| `0`        | Full system, Pesticide POS admin, Team, Support |
| Shop Owner | `1`        | Dashboard, My Crops, POS Management, Customers, Finance, Expenses, Support |
| Sub Admin  | `2`        | Permissions-based (shops, owners, subscriptions, tickets) |
| Team Member| `3`        | Permissions-based |
| Customer   | `customer` | Dashboard, My Balance, My Profile |

---

## Features Implemented

### ✅ Authentication
- Landing, Shop Owner Login, Admin Login, Team Member Login, Customer Login, POS (Pesticide) Login
- Protected routes with role checks (`PrivateRoute`)

### ✅ Admin (Super Admin / permitted roles)
- **Dashboard:** AdminOverview (stats, quick actions), TeamMemberOverview for Sub Admin/Team
- **Shops & Owners:** All Shops, Shop View (details), Shop Owners list, Create Shop Owner (wizard), Edit Shop Owner
- **Subscriptions:** All Subscriptions, Add Subscription, Edit Subscription, Subscription History, View History specific
- **Crops:** All Crops, Add New Crop, Edit Crop
- **Pesticide POS:** Register Pesticide Shop, POS Subscriptions, Subscription History, Shop List, Owners List, Edit Shop, Edit POS Subscription
- **Team:** Team List, Add Team Member
- **Support:** All Tickets (for admin/team with permission)
- **Per-shop:** Customers, Finance, Expenses (admin view)

### ✅ Shop Owner
- **Dashboard:** Commission & loan summary, quick actions
- **My Crops:** Get Assigned Shop Crops (crop cards, manage orders)
- **POS Shop Management:** Commission shop connection
- **Customers:** Customer List, Add Customer, Edit Customer, Customer Balance
- **Finance:** Finance form, Loan list, Crop finance list
- **Expenses:** Expense management page
- **Support:** Create Ticket, My Tickets

### ✅ Customer
- Dashboard, My Balance, My Profile

### ✅ Pesticide POS (separate layout – `/pos/*`)
- POS Dashboard, Sale, Sale Edit, Products, Customers, Sales History, Pending Requests, Commission Shop Management, View Record, Profile, Receipt

### ✅ Connections (Shop Owner ↔ POS)
- Pos Shop Management, Pos Payments, Pos View Record

### ✅ Receipt / Orders
- Dana Mandi: Add Order, Crop Order List, Customer List, Customer Order List
- Vegetable: Add Vegetable Order

---

## Internationalization (EN / Urdu – pk)

### Implemented
- **Locale switch** (EN / Urdu) with RTL support (`themeConfigSlice`, Header)
- **~537 translation keys** in `public/locales/en/translation.json` and `public/locales/pk/translation.json`
- **Layout:** Header horizontal menu fully translated (Dashboard, Shops & Owners, Subscriptions, Crops, My Crops, POS Shop Management, Customers, Finance, Expenses, My Balance, My Profile, etc.)
- **Pages with full/strong translation:**  
  Dashboard, AdminOverview, TeamMemberOverview, Shop, ShopView, UserShopOwner, CreateUserShopOwner, ViewAllSubcriptions, AddNewSubcription, SubcriptionHistory, RegisterPesticideShop, PesticidePosSubscriptions, PosSubscriptionHistory, PesticideShopList, PosOwnersList, TeamList, AddTeamMember, ViewAllCrops, AddNewCrop, EditCrop, GetAssginShopCrops

### Partially / not yet translated
- Some POS layout pages (PosDashboard, PosSale, PosProducts, etc.) – have some `t()` usage but not full
- Support (CreateTicket, MyTickets, TicketDetail, SupportTicketsAll) – minimal
- Some Customer/Receipt/Finance/Connections pages – mixed
- Login/Landing – minimal
- Template/demo pages (Components, Elements, Forms, etc.) – low priority

---

## Rough Completion Estimate

| Area              | Estimate | Notes |
|-------------------|----------|--------|
| **Core features** | **~88%** | Auth, roles, dashboards, CRUD for shops/owners/subscriptions/crops/team, Pesticide POS, Support, Finance, Expenses, Customers, Receipts, POS module, Connections – all present and wired |
| **i18n (EN/Urdu)** | **~72%** | Main admin & shop-owner flows and horizontal nav translated; POS layout, Support, and some secondary pages still partial |
| **Overall project** | **~82%** | App is usable end-to-end; remaining work is more translation, polish, and optional/template pages |

---

## Suggested Next Steps
1. Complete Urdu/EN for POS layout pages (PosDashboard, PosSale, PosProducts, etc.).
2. Translate Support (tickets) and remaining Customer/Receipt/Finance labels.
3. Translate login/landing and profile/account settings if needed.
4. Remove or hide unused template routes (Components, Elements, DataTables, etc.) if not required.
5. Security: move DB credentials out of `PROJECT_OVERVIEW.md` (root) into `.env` or a secure config and add to `.gitignore` if not already.

---
*Last updated: Feb 2025*
