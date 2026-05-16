# Changelog — Kakilin Properties

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [2.2.0] — 2026-05-16

### Added
- **Email notifications** via Nodemailer (Gmail SMTP):
  - New enquiry → admin email alert + automatic client reply
  - New booking → admin email alert + client confirmation email
  - New service request (due diligence/transfer) → admin email alert
  - Emails degrade silently if `MAIL_USER`/`MAIL_PASS` env vars are not set — no crashes
- **WhatsApp floating button** on all public pages:
  - Green WhatsApp FAB fixed to bottom-right corner
  - Reads phone number live from admin settings
  - Pre-filled message: "Hello Kakilin Properties! I'd like to enquire about a listing."
  - Hidden automatically on the admin panel
  - Hover animation and shadow effect
- **Admin session persistence** across page refreshes:
  - Login state saved to `sessionStorage` on successful login
  - Restored automatically on `DOMContentLoaded`
  - Cleared on logout
- `MAIL_USER`, `MAIL_PASS`, `ADMIN_EMAIL` environment variables documented in `.env.example`
- `nodemailer ^6.9.14` added to `package.json`

### Fixed
- Admin users were logged out every time the page was refreshed (session lived only in memory)
- Contact form submitted leads without any notification to admin

---

## [2.1.0] — 2026-05-16

### Added
- **Photo lightbox** — click any gallery image to open fullscreen viewer:
  - Thumbnail strip at bottom with active highlight
  - Previous / Next arrow buttons
  - Keyboard navigation: `←` `→` arrows, `Escape` to close
  - Click outside image to close
  - Works on both property detail and vehicle detail pages
- **Homepage dual-tab search** — Properties and Vehicles tabs in the hero:
  - Properties tab: Type, County, Area/Town, Max Budget filters
  - Vehicles tab: Vehicle Type, Fuel Type, Transmission, Max Price filters
  - Tab switching with visual active state
- **Homepage rebranded** to cover both properties and vehicles:
  - Hero title: "Find Your Perfect Property or Vehicle in Kenya"
  - Hero stats: Properties Listed, Vehicles for Sale, Deals Closed, Clients Served
  - CTA section: Browse Properties + Browse Vehicles + Book Consultation buttons
- `_galleryActiveIdx` global to track active gallery thumbnail for lightbox index sync
- `switchHeroTab()`, `heroVehicleSearch()` functions

### Fixed
- **All MongoDB ObjectId strings were unquoted in `onclick` handlers** — root cause of vehicles not being clickable. All handlers across the entire app fixed:
  - `renderPropertyCard` — navigate, booking button
  - `renderPropertyDetail` — booking button, inquiry button
  - `openInquiryModal` — submitInquiry call
  - `renderVehicleCard` — navigate, enquire button
  - `renderVehicleDetail` — enquire buttons (available + reserved states)
  - Admin properties table — View, Edit, Delete buttons
  - Admin vehicles table — View, Edit, Delete buttons
  - Admin vehicle owners table — Edit, Delete buttons
  - Admin leads table — Update, Delete buttons
  - Admin bookings table — Confirm, Done, Cancel buttons
  - Admin services table — Start, Complete, Delete buttons
  - Admin developers table — Activate, Delete buttons
  - Admin users table — Edit, Deactivate/Activate, Delete buttons
  - Edit modals — save button calls (saveEditProperty, saveEditVehicle, saveEditVehicleOwner, saveLeadUpdate, saveEditUser)
- `ownerId` in `saveNewVehicle` and `saveEditVehicle` was wrapped in `Number()` — MongoDB IDs are strings, not numbers. Fixed to use raw string value
- Booking form `propertyId` was wrapped in `Number()` — fixed to string
- Gallery thumbnails now correctly track active index for lightbox sync

---

## [2.0.0] — 2026-05-16

### Breaking Changes
- **Storage migrated from `localStorage` to MongoDB Atlas** — all previous localStorage data is no longer used. The app now requires a `MONGODB_URI` environment variable. Without it, the server exits with a clear error message.

### Added
- **Full Express.js REST API backend** (`server.js` rewritten):
  - Generic `crudRouter(Model)` factory generates GET all, GET by ID, POST, PUT, DELETE for any Mongoose model
  - 9 Mongoose schemas: Property, Vehicle, VehicleOwner, Developer, Lead, Booking, Service, User, Settings
  - All schemas include `toJSON: { virtuals: true }` so MongoDB `_id` is exposed as `id` string
  - Settings singleton endpoint (`GET /api/settings`, `PUT /api/settings`)
  - Auth endpoint (`POST /api/auth/login`) — validates username + password + active flag
  - Health check endpoint (`GET /api/health`)
  - SPA fallback — all non-API routes serve `index.html`
- **MongoDB Atlas** as the cloud database (Mongoose ODM)
- **Auto-seed on first startup** (`seedIfEmpty()`):
  - Seeds in dependency order: Settings → Users → Developers → Properties → VehicleOwners → Vehicles → Leads → Bookings → Services
  - Uses real MongoDB `_id` values for cross-references (developerId, ownerId)
  - Skips any collection that already has documents — safe to restart
- **In-memory cache layer** (`AppCache` in `data.js`):
  - All collections fetched from API in parallel at init (`DB.init()`)
  - Synchronous reads (`DB.get()`, `DB.getById()`) from cache — no async needed in renderers
  - Async writes (`DB.insert()`, `DB.update()`, `DB.delete()`) hit the API then update cache
  - ID comparison uses `String(r.id) === String(id)` to handle both ObjectId strings and numeric legacy IDs
- **Vehicles module** — complete buy/sell marketplace:
  - Public vehicle listing page (`#vehicles`) with 7 filters: Type, Make, Fuel, Transmission, Condition, Status, Max Price
  - Vehicle detail page (`#vehicle?id=...`) with specs grid, features, gallery, inquiry card, consignment disclosure
  - Vehicle enquiry modal → saves to leads table
  - Consignment CTA section on listing page
- **Vehicle Owners module** — private sellers on consignment:
  - Owner profiles: name, phone, email, ID number, commission %
  - Admin CRUD: add, edit, delete (only if no active vehicles)
  - Vehicle count per owner (active / sold) shown in admin table
- **Vehicles in admin panel**:
  - Full vehicle CRUD with Add/Edit/Delete modals
  - Image URLs (one per line), features (comma-separated)
  - All vehicle fields: make, model, year, type, condition, mileage, fuel, transmission, engine CC, colour, price, status, owner
- **Vehicles on homepage**: Featured Vehicles section (up to 3 non-sold vehicles)
- **Vehicles in nav stats**: Vehicles Available count in hero stats
- `vehicleTypeIcon()`, `vehicleTypeClass()`, `fmtMileage()` helper functions
- `dotenv ^16.4.5`, `mongoose ^8.4.1` added as dependencies

### Changed
- `server.js` — rewritten from a simple `http` static file server to a full Express + Mongoose API server
- `data.js` — all seed data, localStorage DB object, and numeric IDs removed; replaced with `AppCache` + async `DB` object
- `DOMContentLoaded` handler made async — shows loading spinner while fetching from API
- All 28 write functions in `app.js` converted from synchronous to `async` with `await`
- Property and vehicle IDs changed from auto-increment integers to MongoDB ObjectId strings
- `parseHash()` no longer converts MongoDB IDs to numbers — string IDs preserved

### Removed
- `localStorage` dependency — no data is stored in the browser
- All `SEED_*` constants from `data.js`
- Old synchronous `DB` object (get, insert, update, delete, reset)
- `DB.reset()` function (no longer applicable)

---

## [1.0.0] — 2026-05-14 (Initial Build)

### Added
- Full Single Page Application (SPA) with hash-based router
- Property listings — Land, House, Plot, Commercial
- Property search and filtering across all 47 Kenyan counties with sub-county cascading dropdowns
- Property detail page with image gallery, spec grid, features, developer info, inquiry card
- Due Diligence page with 5 service tiers and submission form
- Land Transfer & Subdivision page — tabbed, with 6-step process, required documents checklist, and request forms
- Booking system — 4-step form (type, property, date/time, client details)
- Contact page with OpenStreetMap embed and inquiry form
- Services overview page
- Developer Portal page
- Admin panel with login and role-based access control:
  - Overview dashboard with 10 KPI stat cards
  - Analytics section (Super Admin only)
  - Properties management — full CRUD with image URL gallery
  - Leads & CRM — status updates, notes
  - Bookings management — confirm, complete, cancel
  - Service Requests — track due diligence and transfer progress
  - Developers management
  - User Management — add/edit/deactivate/delete admin users
  - Customization panel — site name, tagline, logo, colors, contact info, map URL, social links, service prices
- 3 user roles: `superadmin`, `sales`, `properties` — dynamic sidebar based on role
- Service pricing system — all 8 prices controlled from admin, displayed live on public pages
- `DEFAULT_SETTINGS` fallback — site works even before admin saves settings
- Footer with quick links, services, contact info
- Responsive navbar with hamburger mobile menu
- Toast notification system
- Modal system
- `KENYA_COUNTIES` — all 47 counties with sub-counties/towns
- Node.js static file server (`server.js`)
- Deployment config for Render.com
- `DOCUMENTATION.md` — initial technical documentation

---

*Maintained by the Kakilin Properties development team.*
