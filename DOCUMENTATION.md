# Kakilin Properties — Technical Documentation

**Version:** 1.0  
**Platform:** Kenya Property SPA  
**Tagline:** Your Trust, Our Priority

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [File Structure](#3-file-structure)
4. [Data Layer](#4-data-layer)
5. [Public Pages & Features](#5-public-pages--features)
6. [Admin Panel](#6-admin-panel)
7. [User Roles & Access Control](#7-user-roles--access-control)
8. [Service Pricing System](#8-service-pricing-system)
9. [Settings & Customization](#9-settings--customization)
10. [Deployment](#10-deployment)
11. [Default Credentials](#11-default-credentials)

---

## 1. Project Overview

Kakilin Properties is a full-featured Kenyan property platform built as a **Single Page Application (SPA)**. It enables property browsing, booking, due diligence requests, land transfer facilitation, and complete back-office management — all without a database server. All data is persisted in the browser's `localStorage`.

**Core capabilities:**
- Property listings (Land, House, Plot, Commercial)
- Property search and filtering across all 47 Kenyan counties
- Due diligence service requests (title search, ownership verification, etc.)
- Land transfer and subdivision facilitation with legal requirements
- Booking system (property viewings and consultations)
- CRM / lead management
- Admin dashboard with role-based access
- Full website customization from the admin panel
- Service pricing controlled by Super Admin

---

## 2. Architecture

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript (ES6+), no frameworks |
| Styling | Custom CSS with CSS custom properties (variables) |
| Routing | Hash-based (`#home`, `#properties`, `#admin`, etc.) |
| Storage | Browser `localStorage` (no backend database) |
| Server | Node.js built-in `http` module (static file server) |
| Deployment | Render.com (connected to GitHub) |

### SPA Pattern

The app is a **Single Page Application** driven by `window.location.hash`. The router listens for `hashchange` events and re-renders the `#page-content` div with the appropriate page. No page reloads occur during navigation.

```
URL Hash          → Function Called
#home             → renderHome()
#properties       → renderProperties()
#property?id=N    → renderPropertyDetail(id)
#services         → renderServices()
#due-diligence    → renderDueDiligence()
#transfers        → renderTransfers()
#booking          → renderBooking()
#contact          → renderContact()
#admin            → renderAdmin()
#developer        → renderDeveloperPortal()
```

### Rendering Pipeline

```
hashchange event
    ↓
parseHash() → { page, params }
    ↓
App.render()
    ↓
renderNavbar() → #navbar-placeholder
    ↓
render[Page]() → #page-content
    ↓
attachEventListeners()
```

---

## 3. File Structure

```
kakilin-properties/
├── index.html              HTML shell — loads CSS and JS, defines #navbar-placeholder and #page-content
├── server.js               Node.js static file server (serves all files, uses process.env.PORT)
├── package.json            Declares start script for Render.com deployment
├── css/
│   └── styles.css          Full design system — variables, components, layouts, mobile breakpoints
└── js/
    ├── data.js             Seed data + DB object (all data access)
    └── app.js              All page renderers, admin logic, router, helpers
```

### index.html

Minimal shell. Contains no page content — everything is injected by JavaScript:

```html
<div id="navbar-placeholder"></div>
<main id="page-content"></main>
<script src="js/data.js"></script>
<script src="js/app.js"></script>
```

---

## 4. Data Layer

All data is stored and accessed through the `DB` object defined in `js/data.js`.

### Storage Keys

| Key | Contents |
|---|---|
| `kakilin_db` | All entity tables (JSON object) |
| `kakilin_settings` | Site settings and service prices |

### Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `properties` | Property listings | id, title, type, county, location, price, status, images[], features[] |
| `developers` | Developer / agency profiles | id, name, contact, phone, commission |
| `leads` | CRM — client inquiries | id, name, phone, email, interest, propertyId, status, date |
| `bookings` | Viewing and consultation bookings | id, clientName, clientPhone, propertyId, date, time, type, status |
| `services` | Due diligence / transfer requests | id, type, service, clientName, status, submittedDate |
| `users` | Admin user accounts | id, name, username, password, role, email, active |

### DB API

```js
DB.get('properties')              // returns full array
DB.getById('properties', id)      // returns single record
DB.insert('leads', record)        // auto-assigns ID, persists
DB.update('properties', id, {})   // partial update, persists
DB.delete('developers', id)       // removes record, persists
DB.getSettings()                  // returns merged DEFAULT_SETTINGS + saved overrides
DB.saveSettings(settingsObj)      // saves to kakilin_settings
DB.reset()                        // clears all localStorage (factory reset)
```

### Property Types

`Land` | `House` | `Plot` | `Commercial`

### Property Statuses

`Available` | `Under Offer` | `Sold`

### Lead / Booking Statuses

Leads: `New Lead` | `Contacted` | `Viewing Scheduled` | `Closed`  
Bookings: `Pending` | `Confirmed` | `Completed` | `Cancelled`  
Service Requests: `Pending` | `In Progress` | `Completed`

### Seed Data

The app ships with seed data so it works immediately on first load:

- **8 properties** across Nairobi, Kajiado, Mombasa, Kilifi, and other counties
- **3 developers** (Kakilin Properties Ltd., Horizon Developers, Coastal Homes)
- **5 seed leads**
- **3 seed bookings**
- **4 seed service requests**
- **3 user accounts** (see Default Credentials)

---

## 5. Public Pages & Features

### Home Page (`#home`)

- **Hero section** with dynamic property search (type, county, area, max budget)
- **Live statistics** computed from real DB data: Properties Listed, Transactions Closed, Counties Covered, Clients Served
- **Featured listings** — 3 available properties shown as cards
- **Why Choose Us** — 6 value proposition cards
- **Services overview** — 4 service cards with prices pulled from admin-controlled settings
- **Testimonials** — 3 client testimonials
- **CTA section** — Browse Properties / Book a Consultation

**County-aware search:** Selecting a county populates the Area/Town dropdown dynamically from the `KENYA_COUNTIES` data (all 47 counties + sub-counties).

---

### Properties Page (`#properties`)

Full property listing page with live filtering:

| Filter | Options |
|---|---|
| Search | Free text by name or location |
| Type | Land, House, Plot, Commercial |
| County | All 47 Kenyan counties |
| Area/Town | Cascades from county selection |
| Status | Available, Under Offer, Sold |
| Max Price | Up to 1.5M / 3M / 5M / 10M / 15M / 30M / 50M / 100M |

Filters are applied via URL params so they are shareable and bookmarkable.

---

### Property Detail Page (`#property?id=N`)

- **Image gallery** — main image with clickable thumbnails (if images uploaded); falls back to a styled placeholder by type
- **Photo count badge** on cards and gallery
- **Specifications grid** — size, type, bedrooms, bathrooms, status, views
- **Full description** and features/amenities tags
- **Developer info** card
- **Inquiry card** (sticky sidebar) — price, Book Viewing button, Send Inquiry button
- **Due diligence upsell** panel
- **Inline inquiry modal** → saves to leads table

---

### Services Page (`#services`)

Overview of all 4 core services with admin-controlled prices:

1. **Due Diligence** — Title search, ownership, encumbrance, land history
2. **Land Transfer** — Sale agreement to title registration
3. **Land Subdivision** — Survey, county approval, new titles
4. **Property Management** — Portfolio management for developers

Also includes:
- 4-step "How It Works" process
- "Why Due Diligence Matters" callout panel

---

### Due Diligence Page (`#due-diligence`)

**5 individual checks with admin-controlled prices and turnaround times:**

| Check | Default Price | Turnaround |
|---|---|---|
| Title Search | KSh 5,000 | 2–3 days |
| Ownership Verification | KSh 4,000 | 1–2 days |
| Land History Check | KSh 8,000 | 3–5 days |
| Encumbrance Search | KSh 5,000 | 2–3 days |
| Full Due Diligence Package | KSh 18,000 | 5–7 days |

**Submission form:** Name, phone, email, service type, property/LR Number, notes — saved to `services` table with `Pending` status.

---

### Land Transfer & Subdivision Page (`#transfers`)

Tabbed interface: **Land Transfer** | **Subdivision**

#### Land Transfer Tab

**6-step process** (Sale Agreement → Valuation → Stamp Duty → LCB Consent → Title Transfer → Completion)

**9-item required documents checklist** with colour-coded badges:

| Document | Badge |
|---|---|
| Valuation Report | Mandatory |
| Stamp Duty Payment (2% rural / 4% urban via KRA iTax) | Government Fee |
| National IDs / Passports (buyer + seller) | Mandatory |
| KRA PIN Certificates (buyer + seller) | Mandatory |
| Passport Photos (2–3 each) | Mandatory |
| Spousal Consent Affidavit | If Applicable |
| Title Deed (Original) | Mandatory |
| Land Registry Fees (~KSh 1,500–2,500) | Government Fee |
| Land Control Board Consent (agricultural land) | If Agricultural |

Service fee displayed dynamically from admin settings.

#### Subdivision Tab

**6-step process** (Survey → Subdivision Approval → County Council → New Titles → Plot Numbering → Handover)

Required documents: LR Number / Title Deed, Survey Plan, ID/PIN, Land Control Board Certificate (if agricultural), County Council Approval, Rates Clearance Certificate.

---

### Booking Page (`#booking`)

**4-step booking form:**
1. Booking type: Property Viewing or Consultation
2. Property selection (pre-selected if arriving from property page)
3. Date (from today onwards) and time slot (9 available slots)
4. Client details: name, phone, email, notes

Saves to `bookings` table. Confirmation modal shown on success.

---

### Contact Page (`#contact`)

- Contact details (phone, email, address, hours) — pulled from admin settings
- **OpenStreetMap embed** — interactive map (URL configurable by admin)
- Contact inquiry form → saves to leads table
- Social media links (configurable)

---

### Developer Portal (`#developer`)

- Property management portal for registered developers
- Developers can log in and manage their own listings
- Tracks commission rates and portfolio performance
- Links to admin property management

---

## 6. Admin Panel

Accessed at `#admin`. Protected by username/password login.

### Sections

| Section | Role Access | Description |
|---|---|---|
| Overview | All | Dashboard with 8 KPI stat cards, recent leads table, upcoming bookings table |
| Analytics | Super Admin only | Charts and trends — property types, lead pipeline, booking rates, service volumes |
| Properties | Super Admin + Property Manager | Full property CRUD — add, edit, delete, upload images, manage status |
| Leads & Clients | Super Admin + Sales | CRM — view, update status, add notes, track follow-ups |
| Bookings | Super Admin + Sales | Manage bookings — confirm, complete, cancel |
| Service Requests | Super Admin + Sales | Track due diligence and transfer requests through stages |
| Developers | Super Admin only | Manage developer accounts |
| User Management | Super Admin only | Add/edit/deactivate admin users, assign roles |
| Customization | Super Admin only | Full site settings + service pricing |

### Properties Management

- Add new property with: title, type, price, county, area/town, size, bedrooms, bathrooms, description, features, status, developer
- **Image upload:** Admin pastes image URLs to populate gallery. Multiple images supported. Thumbnail shown on listing card; full gallery on detail page.
- Edit all fields on existing properties
- Delete property
- View live property page directly from admin

### Leads & CRM

- All leads from property inquiry forms, contact form, and due diligence requests appear here
- Update lead status: New Lead → Contacted → Viewing Scheduled → Closed
- Add internal notes per lead
- Filter and view by status

### Bookings

- All property viewings and consultations
- Update status: Pending → Confirmed → Completed / Cancelled
- See linked property details

### Service Requests

- Track due diligence and transfer service requests
- Update progress status: Pending → In Progress → Completed
- Record completion date

### Analytics Dashboard

- Property portfolio breakdown by type (Land / House / Plot / Commercial)
- Lead pipeline funnel by status
- Booking volume and completion rates
- Service request volume by type
- Top counties by listing count

---

## 7. User Roles & Access Control

Three roles are defined:

| Role | Label | Access |
|---|---|---|
| `superadmin` | ⭐ Super Admin | Full access to all sections including Analytics, Developers, User Management, Customization |
| `sales` | 💼 Sales Manager | Overview, Leads, Bookings, Service Requests |
| `properties` | 🏗️ Property Manager | Overview, Properties |

The admin sidebar is built dynamically — menu items only appear if the logged-in user's role has permission. A Sales Manager will never see User Management or Customization. A Property Manager will not see Leads or Bookings.

Login is checked against the `users` table in `localStorage`. Accounts can be activated/deactivated by Super Admin without deletion.

---

## 8. Service Pricing System

All service prices shown to the public are controlled by the Super Admin from **Admin → Customization → Service Pricing**.

| Service | Default Price | Shown On |
|---|---|---|
| Title Search | KSh 5,000 | Due Diligence page |
| Ownership Verification | KSh 4,000 | Due Diligence page |
| Land History Check | KSh 8,000 | Due Diligence page |
| Encumbrance Search | KSh 5,000 | Due Diligence page |
| Full Due Diligence Package | KSh 18,000 | Due Diligence page, Services page, Home page |
| Land Transfer | KSh 15,000 | Transfers page, Services page, Home page |
| Land Subdivision | KSh 30,000 | Transfers page, Services page, Home page |
| Property Management | KSh 0 (Custom) | Services page, Home page |

Setting a price to `0` displays **"Custom Pricing"** or **"Custom Packages"** on the public pages. All 4 public service surfaces (Home, Services, Due Diligence, Transfers) read prices live from admin settings — no code changes required to update pricing.

---

## 9. Settings & Customization

All settings are saved in `localStorage` under `kakilin_settings` and merged with `DEFAULT_SETTINGS` on read, so defaults are always preserved as fallback.

**Configurable from Admin → Customization:**

| Setting | Description |
|---|---|
| Site Name | Used in navbar and page titles |
| Tagline | Under site name in navbar |
| Logo URL | URL to logo image (replaces 🏘️ emoji icon) |
| Favicon URL | Browser tab icon |
| Primary Color | Main brand color (navbar, buttons, hero) |
| Accent Color | Highlight color (prices, badges, CTAs) |
| Phone / Email / Address / Hours | Used on Contact page and footer |
| Map Embed URL | OpenStreetMap iframe URL for Contact page map |
| Hero Title | Main headline on homepage |
| Hero Subtitle | Sub-copy below headline |
| Social links | Facebook, Twitter, Instagram, LinkedIn |
| Service Prices | All 8 service prices (see Section 8) |

---

## 10. Deployment

### Server

`server.js` is a minimal Node.js static file server:

```js
const PORT = process.env.PORT || 3002;
```

Render.com injects `PORT` automatically. The server serves all static files with correct MIME types.

### Render.com Setup

| Setting | Value |
|---|---|
| Environment | Node |
| Build Command | *(leave blank)* |
| Start Command | `node server.js` |
| Branch | `main` (or your default branch) |
| Auto-Deploy | Yes (on push to GitHub) |

### Deployment Steps

1. Push all files to GitHub repository
2. Connect repository to Render.com
3. Set start command to `node server.js`
4. Deploy — site goes live at your Render URL

### Files Required in Repository

```
index.html
server.js
package.json
css/styles.css
js/data.js
js/app.js
```

---

## 11. Default Credentials

> These are the out-of-the-box admin accounts loaded on first use. Change passwords after initial setup.

| Name | Username | Password | Role |
|---|---|---|---|
| Super Admin | `admin` | `kakilin2024` | superadmin |
| Sales Manager | `sales` | `sales2024` | sales |
| Property Manager | `listings` | `listings24` | properties |

**Login:** Navigate to `#admin` and enter the username and password.

Super Admin can add, edit, deactivate, or delete other admin accounts from **Admin → User Management**. The Super Admin account cannot be deleted.

---

## Appendix: Kenya Counties

The app includes all **47 Kenyan counties** with their sub-counties and major towns. County data is in `KENYA_COUNTIES` in `js/data.js`. It powers:

- Hero search county/area cascading dropdowns
- Properties page filtering cascading dropdowns
- Property listing form county/area fields in admin

Counties covered include: Nairobi, Mombasa, Kwale, Kilifi, Tana River, Lamu, Taita-Taveta, Garissa, Wajir, Mandera, Marsabit, Isiolo, Meru, Tharaka-Nithi, Embu, Kitui, Machakos, Makueni, Nyandarua, Nyeri, Kirinyaga, Murang'a, Kiambu, Turkana, West Pokot, Samburu, Trans-Nzoia, Uasin Gishu, Elgeyo-Marakwet, Nandi, Baringo, Laikipia, Nakuru, Narok, Kajiado, Kericho, Bomet, Kakamega, Vihiga, Bungoma, Busia, Siaya, Kisumu, Homa Bay, Migori, Kisii, Nyamira.

---

*Kakilin Properties — Kenya's Trusted Property Partner*
