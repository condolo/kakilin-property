# Kakilin Properties — Developer Documentation

**Version:** 2.2.0  
**Last Updated:** 2026-05-16  
**Platform:** Kenya Property & Vehicle SPA  
**Tagline:** Your Trust, Our Priority

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [File Structure](#3-file-structure)
4. [Environment Variables](#4-environment-variables)
5. [Architecture & Data Flow](#5-architecture--data-flow)
6. [Database — MongoDB Atlas](#6-database--mongodb-atlas)
7. [REST API Reference](#7-rest-api-reference)
8. [Frontend — SPA Router](#8-frontend--spa-router)
9. [Public Pages](#9-public-pages)
10. [Admin Panel](#10-admin-panel)
11. [User Roles & Access Control](#11-user-roles--access-control)
12. [Notifications — Email & WhatsApp](#12-notifications--email--whatsapp)
13. [Service Pricing System](#13-service-pricing-system)
14. [Settings & Customization](#14-settings--customization)
15. [Deployment — Render.com](#15-deployment--rendercom)
16. [Local Development Setup](#16-local-development-setup)
17. [Default Credentials](#17-default-credentials)
18. [Known Limitations & Roadmap](#18-known-limitations--roadmap)

---

## 1. Project Overview

Kakilin Properties is a full-stack Kenyan property and vehicle marketplace built as a **Single Page Application (SPA)** with a **Node.js + Express + MongoDB Atlas** backend.

### Core Capabilities

| Domain | Features |
|---|---|
| **Properties** | Land, House, Plot, Commercial listings — search, filter, book, enquire |
| **Vehicles** | Cars sold on consignment — SUVs, Sedans, Pickups, Buses, etc. |
| **Due Diligence** | Title search, ownership verification, land history checks |
| **Land Transfer** | Full transfer facilitation with document checklist |
| **Subdivision** | Land subdivision with county approval workflow |
| **Bookings** | Property viewings and consultation appointments |
| **CRM** | Lead management — inquiries, status tracking, follow-ups |
| **Admin Panel** | Role-based dashboard, CRUD for all entities, customization |
| **Notifications** | Email (Nodemailer) + WhatsApp (wa.me link) |

---

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vanilla JavaScript ES6+ | No frameworks — zero build step |
| Styling | Custom CSS with CSS variables | Responsive, mobile-first |
| Routing | Hash-based SPA | `#home`, `#vehicles`, `#admin`, etc. |
| Backend | Node.js + Express 4 | REST API + static file server |
| Database | MongoDB Atlas | Cloud-hosted, Mongoose ODM |
| Email | Nodemailer + Gmail SMTP | Free tier, 500 emails/day |
| WhatsApp | `wa.me` deep link | No API cost, no approval required |
| Hosting | Render.com | Free tier or paid, auto-deploy from GitHub |
| Version Control | GitHub | `condolo/kakilin-property` |

---

## 3. File Structure

```
kakilin-property/
├── index.html              # HTML shell — loads CSS + JS, defines mount points
├── server.js               # Express server — API routes, Mongoose models, auto-seed
├── package.json            # Dependencies and start script
├── .env.example            # Environment variable template (copy to .env)
├── .gitignore              # Excludes .env, node_modules
├── CHANGELOG.md            # Version history
├── DOCUMENTATION.md        # This file
├── css/
│   └── styles.css          # Full design system — variables, components, layouts
└── js/
    ├── data.js             # KENYA_COUNTIES, DEFAULT_SETTINGS, AppCache, DB object
    └── app.js              # All page renderers, admin logic, router, helpers
```

### `index.html`
Minimal HTML shell. Contains no page content — everything is injected by JavaScript:
```html
<div id="navbar-placeholder"></div>
<main id="page-content"></main>
<script src="js/data.js"></script>
<script src="js/app.js"></script>
```

### `server.js`
Single file containing:
- All 9 Mongoose schemas and models
- Generic `crudRouter()` factory
- API routes for all 8 entity collections
- Settings singleton endpoints
- Auth endpoint
- Email notification logic (Nodemailer)
- Auto-seed function (`seedIfEmpty()`)
- MongoDB connection and server start

### `js/data.js`
- `KENYA_COUNTIES` — all 47 counties with sub-counties (used by all dropdowns)
- `DEFAULT_SETTINGS` — fallback site config if no settings saved in DB
- `AppCache` — in-memory store populated from API at init
- `DB` — unified data access object (sync reads from cache, async writes to API)

### `js/app.js`
- `App` object — page state and router
- `parseHash()` — URL parser
- All page render functions (`renderHome`, `renderVehicles`, etc.)
- All admin section renderers
- Helper functions: `fmt()`, `statusBadge()`, `vehicleTypeIcon()`, etc.
- Lightbox, Toast, Modal utilities
- WhatsApp float button injection
- `attachEventListeners()` — runs after every page render
- `applySettings()` — applies theme colors, favicon, page title

---

## 4. Environment Variables

Create a `.env` file in the project root (never commit this file):

```env
# MongoDB Atlas connection string
# Atlas → Cluster → Connect → Drivers → copy URI → replace <password>
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/kakilin?retryWrites=true&w=majority

# Gmail SMTP credentials for email notifications
# Use a dedicated Gmail account (not personal)
# Enable 2FA → generate App Password → paste here
MAIL_USER=kakilin.notifications@gmail.com
MAIL_PASS=xxxx xxxx xxxx xxxx

# Where admin alerts are delivered (bookings, enquiries, service requests)
ADMIN_EMAIL=admin@kakilin.co.ke

# Server port — Render sets this automatically
PORT=3002
```

### Setting on Render.com
Dashboard → your service → **Environment** tab → **Add Environment Variable** for each key above.

### Email Setup (Gmail App Password)
1. Create a Gmail account: e.g. `kakilin.alerts@gmail.com`
2. Enable **2-Step Verification** on that account
3. Go to **Google Account → Security → App Passwords**
4. Create app password for "Mail" → copy the 16-character code
5. Paste as `MAIL_PASS` (with or without spaces)

---

## 5. Architecture & Data Flow

### SPA Pattern
```
Browser URL change (hash)
    ↓
parseHash() → { page, params }
    ↓
App.render()
    ↓
render[Page]() → innerHTML of #page-content
    ↓
attachEventListeners()
    ↓
injectWhatsAppButton() (public pages only)
```

### Data Flow — Reads (Synchronous)
```
DB.init() called on DOMContentLoaded
    ↓
fetch('/api/properties'), fetch('/api/vehicles'), ... (all parallel)
    ↓
AppCache populated with all collections
    ↓
DB.get('properties') → returns AppCache.properties (sync, instant)
DB.getById('vehicles', id) → finds by id or _id string match (sync)
```

### Data Flow — Writes (Async)
```
User submits form
    ↓
async function (e.g. submitInquiry)
    ↓
await DB.insert('leads', record)
    ↓
fetch POST /api/leads → Mongoose creates document → email triggered
    ↓
Response returned → AppCache.leads prepended with new record
    ↓
showToast('Success')
```

### Session Flow
```
Admin enters username + password
    ↓
adminLogin() checks DB.get('users') (from cache)
    ↓
Match found → App.adminUser = { id, name, username, role }
             → sessionStorage.setItem('kakilin_admin', JSON.stringify(...))
    ↓
Page refresh → DOMContentLoaded restores from sessionStorage
    ↓
adminLogout() → App.adminUser = null → sessionStorage.removeItem(...)
```

---

## 6. Database — MongoDB Atlas

### Connection
```js
mongoose.connect(process.env.MONGODB_URI)
```
The server exits with a clear error if `MONGODB_URI` is not set.

### Collections (Tables)

| Collection | Model | Key Fields |
|---|---|---|
| `properties` | Property | title, type, county, location, price, status, developerId, images[], features[] |
| `vehicles` | Vehicle | make, model, year, type, condition, mileage, fuel, transmission, engineCC, color, price, status, ownerId, images[], features[] |
| `vehicleowners` | VehicleOwner | name, phone, email, idNumber, commission, joined, notes |
| `developers` | Developer | name, contact, phone, email, totalUnits, unitsSold, status |
| `leads` | Lead | name, phone, email, interest, propertyId, vehicleId, status, date, notes |
| `bookings` | Booking | clientName, clientPhone, clientEmail, type, propertyId, date, time, status, notes |
| `services` | Service | type, service, clientName, clientPhone, propertyDetails, status, submittedDate, completedDate |
| `users` | User | name, username (unique), password, role, email, active, joined |
| `settings` | Settings | siteName, tagline, heroTitle, phone, email, prices{}, colors, social links |

### ID Handling
MongoDB IDs are 24-character hex strings (ObjectId). All `id` fields in the codebase are handled as strings.

The `toJSON` virtual exposes `id` alongside `_id`:
```js
const jOpts = {
  toJSON: {
    virtuals: true,
    transform: (_, ret) => { delete ret.__v; return ret; }
  }
};
```

`DB.getById()` compares both `r.id` and `r._id` as strings:
```js
getById(table, id) {
  return (AppCache[table] || []).find(r =>
    String(r.id) === String(id) || String(r._id) === String(id)
  );
}
```

### Auto-Seed
`seedIfEmpty()` runs on every server start. It only inserts data if the collection has 0 documents. Seed order:
1. Settings
2. Users (3 default accounts)
3. Developers → Properties (uses real developer ObjectIds)
4. VehicleOwners → Vehicles (uses real owner ObjectIds)
5. Leads, Bookings, Services

### Network Access
MongoDB Atlas must allow connections from Render's IPs. For simplicity, allow `0.0.0.0/0` (all IPs):
- Atlas → Network Access → Add IP Address → Allow Access from Anywhere

---

## 7. REST API Reference

Base URL: `https://kakilin-property.onrender.com/api` (or `http://localhost:3002/api`)

### Generic CRUD (all 8 collections follow this pattern)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/properties` | All properties, sorted newest first |
| `GET` | `/api/properties/:id` | Single property by ObjectId |
| `POST` | `/api/properties` | Create new property |
| `PUT` | `/api/properties/:id` | Update property (partial) |
| `DELETE` | `/api/properties/:id` | Delete property |

Same pattern applies to: `/api/vehicles`, `/api/vehicleOwners`, `/api/developers`, `/api/leads`, `/api/bookings`, `/api/services`, `/api/users`

### Special Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/settings` | Get site settings (creates default if none) |
| `PUT` | `/api/settings` | Update site settings (upsert) |
| `POST` | `/api/auth/login` | Login — body: `{ username, password }` |
| `GET` | `/api/health` | Health check — returns `{ ok: true, ts: ... }` |

### Email Triggers (server-side, on POST only)
| Endpoint | Admin Email | Client Email |
|---|---|---|
| `POST /api/leads` | ✅ New enquiry alert | ✅ Auto-reply if email provided |
| `POST /api/bookings` | ✅ New booking alert | ✅ Confirmation if email provided |
| `POST /api/services` | ✅ New service request | ❌ None yet |

---

## 8. Frontend — SPA Router

### URL Structure
```
#home                      → renderHome()
#properties                → renderProperties()
#properties?type=Land      → renderProperties() with filters pre-applied
#property?id=<objectId>    → renderPropertyDetail(id)
#vehicles                  → renderVehicles()
#vehicle?id=<objectId>     → renderVehicleDetail(id)
#services                  → renderServices()
#due-diligence             → renderDueDiligence()
#transfers                 → renderTransfers()
#booking                   → renderBooking()
#booking?propertyId=<id>   → renderBooking() with property pre-selected
#contact                   → renderContact()
#admin                     → renderAdmin() (login wall if not authenticated)
#developer                 → renderDeveloperPortal()
```

### Hash Parameter Parsing
```js
function parseHash() {
  const hash = window.location.hash.slice(1) || 'home';
  const [page, qs] = hash.split('?');
  const params = {};
  if (qs) new URLSearchParams(qs).forEach((v, k) => { params[k] = v; });
  return { page, params };
}
```
> **Note:** Parameters are kept as strings. Do not wrap IDs with `Number()` — MongoDB IDs are hex strings.

### Navigation
```js
App.navigate('property', { id: '507f1f77bcf86cd799439011' });
// Produces: #property?id=507f1f77bcf86cd799439011
```

### onclick ID Safety
All onclick handlers that embed IDs must quote them:
```js
// ✅ Correct — ID quoted as string
onclick="App.navigate('property', {id:'${p.id}'})"
onclick="openEditPropertyModal('${p.id}')"

// ❌ Wrong — breaks with MongoDB ObjectId strings
onclick="App.navigate('property', {id:${p.id}})"
```

---

## 9. Public Pages

### Home (`#home`)
- Dual-tab hero search: Properties tab + Vehicles tab
- Featured Properties grid (up to 3 available)
- Featured Vehicles grid (up to 3 non-sold)
- Hero stats: total properties, vehicles, deals closed, clients served
- Why Choose Us — 6 value cards
- Services overview — 4 service cards with live admin-controlled prices
- Testimonials
- Dual CTA: Browse Properties + Browse Vehicles + Book Consultation
- WhatsApp floating button

### Properties (`#properties`)
Filters: Search text, Type, County, Area/Town (cascades from county), Status, Max Price

### Property Detail (`#property?id=...`)
- Image gallery with thumbnails + **clickable lightbox** (fullscreen expand, keyboard nav)
- Spec grid, description, features, developer info
- Booking and inquiry buttons
- Due diligence upsell panel

### Vehicles (`#vehicles`)
Filters: Search text, Type, Make, Fuel, Transmission, Condition, Status, Max Price  
Consignment CTA banner at bottom.

### Vehicle Detail (`#vehicle?id=...`)
- Image gallery with thumbnails + **clickable lightbox**
- Spec grid: year, mileage, fuel, transmission, engine CC, condition, colour, views
- Consignment disclosure section
- Enquire / Book Inspection / Join Waiting List (if Reserved)
- Pre-purchase inspection callout

### Services (`#services`)
4 service cards: Due Diligence, Land Transfer, Subdivision, Property Management — all prices from admin settings.

### Due Diligence (`#due-diligence`)
5 check types with prices and turnaround times. Submission form → saves to `services` table + admin email.

### Land Transfer & Subdivision (`#transfers`)
Tabbed page. Transfer tab: 6-step process, 9-item document checklist. Subdivision tab: 6-step process.

### Booking (`#booking`)
4-step form: type → property select → date/time → client details. Saves to `bookings` → admin + client email sent.

### Contact (`#contact`)
Phone, email, address from settings. OpenStreetMap embed. Inquiry form → saves to `leads`.

---

## 10. Admin Panel

Accessed at `#admin`. Username/password login required.

### Sections

| Section | Roles | Description |
|---|---|---|
| Overview | All | 10 KPI stat cards, recent leads, upcoming bookings |
| Analytics | Super Admin | Charts by type, lead pipeline, booking rates |
| Properties | Super Admin + Property Manager | Full property CRUD — add, edit, delete, image URLs |
| Vehicles | Super Admin + Property Manager | Full vehicle CRUD with owner assignment |
| Vehicle Owners | Super Admin + Property Manager | Consignment seller management |
| Leads & Clients | Super Admin + Sales | CRM — status, notes, history |
| Bookings | Super Admin + Sales | Confirm, complete, cancel bookings |
| Service Requests | Super Admin + Sales | Track due diligence/transfer progress |
| Developers | Super Admin | Developer/agency accounts |
| User Management | Super Admin | Add/edit/deactivate admin users |
| Customization | Super Admin | Site settings + service pricing |

### Adding Images to Properties/Vehicles
Images are added as **URLs** (one per line) in the Add/Edit modal.

Recommended free image hosting options:
- **Cloudinary** — https://cloudinary.com (free tier: 25GB)
- **ImgBB** — https://imgbb.com (free)
- **Google Drive** (public link, not ideal for performance)

First image in the list is used as the card cover photo.

### Lead Statuses
`New Lead` → `Contacted` → `Viewing Scheduled` → `Closed`

### Booking Statuses
`Pending` → `Confirmed` → `Completed` | `Cancelled`

### Service Request Statuses
`Pending` → `In Progress` → `Completed`

---

## 11. User Roles & Access Control

| Role | Label | Access |
|---|---|---|
| `superadmin` | ⭐ Super Admin | Full access — all sections |
| `sales` | 💼 Sales Manager | Overview, Leads, Bookings, Service Requests |
| `properties` | 🏗️ Property Manager | Overview, Properties, Vehicles, Vehicle Owners |

Admin sidebar items are rendered conditionally based on role. A Sales Manager will never see Customization or User Management.

### Session Persistence
- Login state stored in `sessionStorage` as `kakilin_admin` JSON
- Survives page refresh; cleared on browser tab close or explicit logout
- Does **not** survive across different browsers or incognito sessions

> ⚠️ **Security Note:** Passwords are currently stored in plain text in MongoDB. Before going to production with sensitive data, implement bcrypt password hashing.

---

## 12. Notifications — Email & WhatsApp

### Email (Nodemailer)

**Required env vars:** `MAIL_USER`, `MAIL_PASS`, `ADMIN_EMAIL`

```js
// server.js — sendMail helper
async function sendMail({ to, subject, html }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return; // silent skip
  await mailer.sendMail({ from: '"Kakilin Properties" <...>', to, subject, html });
}
```

If the env vars are not set, emails are skipped silently — the server continues working normally.

**Triggers:**

| Event | Admin email | Client email |
|---|---|---|
| New enquiry (lead) | ✅ | ✅ (if email provided) |
| New booking | ✅ | ✅ (if email provided) |
| New service request | ✅ | ❌ |

### WhatsApp Floating Button

No API or approval needed. Uses `wa.me` deep link:
```
https://wa.me/<phone>?text=<pre-filled message>
```
- Phone number read from `DB.getSettings().phone` — update it in Admin → Customization
- Button injected on all public pages via `injectWhatsAppButton()` called in `attachEventListeners()`
- Automatically removed on admin pages

---

## 13. Service Pricing System

All service prices shown publicly are controlled by **Admin → Customization → Service Pricing**.

| Setting Key | Default | Shown On |
|---|---|---|
| `titleSearch` | 5,000 | Due Diligence page |
| `ownershipVerification` | 4,000 | Due Diligence page |
| `landHistoryCheck` | 8,000 | Due Diligence page |
| `encumbranceSearch` | 5,000 | Due Diligence page |
| `fullDueDiligence` | 18,000 | Due Diligence + Services + Home |
| `landTransfer` | 15,000 | Transfers + Services + Home |
| `subdivision` | 30,000 | Transfers + Services + Home |
| `propertyManagement` | 0 | Services + Home |

Setting a price to `0` displays **"Custom Pricing"** on public pages.

---

## 14. Settings & Customization

All settings stored in the `settings` MongoDB collection (singleton document). Falls back to `DEFAULT_SETTINGS` from `data.js` if nothing is saved.

**Configurable from Admin → Customization:**

| Setting | Effect |
|---|---|
| Site Name | Navbar brand name, page title |
| Tagline | Under brand name in navbar |
| Logo URL | Replaces 🏘️ emoji icon in navbar |
| Favicon URL | Browser tab icon |
| Primary Color | Navbar, buttons, hero background |
| Accent Color | Prices, badges, CTAs |
| Phone | Contact page, WhatsApp button, footer |
| Email | Contact page, footer |
| Address | Contact page, footer |
| Business Hours | Contact page |
| Map Embed URL | OpenStreetMap iframe on Contact page |
| Hero Title | Homepage main headline |
| Hero Subtitle | Homepage sub-copy |
| Social Links | Facebook, Twitter, Instagram, LinkedIn |
| Service Prices | All 8 prices (see Section 13) |

---

## 15. Deployment — Render.com

### Live URL
`https://kakilin-property.onrender.com`

### GitHub Repository
`https://github.com/condolo/kakilin-property`

### Render Service Configuration

| Setting | Value |
|---|---|
| Environment | Node |
| Branch | `main` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Auto-Deploy | Yes (on every push to `main`) |
| Free Tier | Spins down after 15 min inactivity (50s cold start delay) |

### Environment Variables on Render
Set these under **Service → Environment → Add Environment Variable**:

| Key | Value |
|---|---|
| `MONGODB_URI` | Your Atlas connection string |
| `MAIL_USER` | Gmail address for notifications |
| `MAIL_PASS` | Gmail App Password (16 chars) |
| `ADMIN_EMAIL` | Admin's receiving email |

> `PORT` is set automatically by Render — do not override it.

### Deploy Flow
1. Make code changes locally
2. `git add` → `git commit` → `git push origin main`
3. Render detects the push and automatically redeploys
4. Check deploy logs in Render dashboard if it fails

---

## 16. Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/condolo/kakilin-property.git
cd kakilin-property

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Edit .env with your MongoDB URI and email credentials

# 4. Start the server
node server.js
# → Server running at http://localhost:3002
# → MongoDB connected ✅
# → Auto-seed runs if collections are empty ✅
```

### No Build Step Required
The frontend is pure vanilla JS/CSS. No webpack, no bundler, no transpilation. Edit `js/app.js` or `css/styles.css` and refresh the browser.

---

## 17. Default Credentials

> Change passwords after first login. These are seeded on first startup.

| Name | Username | Password | Role |
|---|---|---|---|
| Super Admin | `admin` | `kakilin2024` | superadmin |
| Sales Manager | `sales` | `sales2024` | sales |
| Property Manager | `listings` | `listings24` | properties |

**Login:** Navigate to `#admin` → enter username and password.

The Super Admin account cannot be deleted. Other accounts can be deactivated or deleted from **Admin → User Management**.

---

## 18. Known Limitations & Roadmap

### Current Limitations

| Issue | Severity | Status |
|---|---|---|
| Passwords stored in plain text | 🔴 High | Not yet hashed (bcrypt needed) |
| No file upload — images by URL only | 🔴 High | Cloudinary integration planned |
| No pagination on large listings | 🟡 Medium | Will slow down at 100+ records |
| No SEO meta tags per page | 🟡 Medium | SPA pages not indexable by Google |
| Contact form doesn't send email | 🟡 Medium | Saves lead but no email trigger |
| No input sanitization (XSS) | 🟡 Medium | innerHTML used with user content |
| Analytics section uses mock data | 🟢 Low | Charts not wired to live DB queries |

### Planned Features (Next Phases)

| Feature | Phase |
|---|---|
| Image upload via Cloudinary | Phase 3 |
| bcrypt password hashing | Phase 3 |
| M-Pesa Daraja STK Push integration | Phase 4 |
| Tenant / rental management module | Phase 4 |
| Online rent payment + receipts | Phase 4 |
| Automated payment reminders (SMS/email) | Phase 4 |
| Google Analytics integration | Phase 3 |
| Sitemap.xml for SEO | Phase 3 |
| Property comparison tool | Phase 5 |
| Pagination / infinite scroll | Phase 3 |

---

## Appendix A — Kenya Counties Data

`KENYA_COUNTIES` in `js/data.js` covers all **47 Kenyan counties** with sub-counties and major towns. Used by:
- Hero search county/area cascading dropdowns
- Properties page filter dropdowns
- Property add/edit form in admin

## Appendix B — Vehicle Types Supported

`SUV` · `Sedan` · `Pickup` · `Hatchback` · `Van` · `Bus` · `Truck` · `Motorbike` · `Coupe`

## Appendix C — Property Types

`Land` · `House` · `Plot` · `Commercial`

---

*Kakilin Properties — Kenya's Trusted Property & Vehicle Partner*  
*Documentation maintained alongside the codebase. Update this file with every significant change.*
