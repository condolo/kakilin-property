/* ============================================================
   KAKILIN PROPERTIES — MAIN APPLICATION
   ============================================================ */

/* ── App state ── */
let _galleryActiveIdx = 0;  // tracks which gallery thumbnail is active for lightbox
const App = {
  page: 'home',
  subpage: null,
  params: {},
  adminUser: null,   // { id, name, username, role }
  adminSection: 'overview',

  navigate(page, params = {}) {
    this.page = page;
    this.params = params;
    window.location.hash = page + (Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '');
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMobileNav();
  },

  render() {
    const content = document.getElementById('page-content');
    updateNavActive();
    switch (this.page) {
      case 'home':           content.innerHTML = renderHome();           break;
      case 'properties':     content.innerHTML = renderProperties();     break;
      case 'property':       content.innerHTML = renderPropertyDetail(this.params.id); break;
      case 'services':       content.innerHTML = renderServices();       break;
      case 'due-diligence':  content.innerHTML = renderDueDiligence();   break;
      case 'transfers':      content.innerHTML = renderTransfers();      break;
      case 'booking':        content.innerHTML = renderBooking();        break;
      case 'contact':        content.innerHTML = renderContact();        break;
      case 'admin':          content.innerHTML = renderAdmin();          break;
      case 'developer':      content.innerHTML = renderDeveloperPortal(); break;
      case 'vehicles':       content.innerHTML = renderVehicles();       break;
      case 'vehicle':        content.innerHTML = renderVehicleDetail(this.params.id); break;
      default:               content.innerHTML = render404();            break;
    }
    attachEventListeners();
  }
};

/* ── Router ── */
function parseHash() {
  const hash = window.location.hash.slice(1) || 'home';
  const [page, qs] = hash.split('?');
  const params = {};
  if (qs) new URLSearchParams(qs).forEach((v, k) => { params[k] = isNaN(v) ? v : Number(v); });
  return { page, params };
}

window.addEventListener('hashchange', () => {
  const { page, params } = parseHash();
  App.page = page; App.params = params;
  App.render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── Helpers ── */
const fmt = n => 'KSh ' + Number(n).toLocaleString('en-KE');
const fmtShort = n => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(0)+'K' : n;
const today = () => new Date().toISOString().split('T')[0];
const propertyTypeClass = t => 'type-' + (t||'').toLowerCase().replace(/\s+/g,'-');
const propertyTypeIcon  = t => ({Land:'🌳', House:'🏠', Plot:'📐', Commercial:'🏢'}[t] || '🏗️');
const statusBadge = s => {
  const map = { 'Available':'badge-green','Under Offer':'badge-yellow','Sold':'badge-red',
    'New Lead':'badge-blue','Contacted':'badge-yellow','Viewing Scheduled':'badge-green','Closed':'badge-gray',
    'Pending':'badge-yellow','In Progress':'badge-blue','Completed':'badge-green','Confirmed':'badge-green','Cancelled':'badge-red' };
  return `<span class="badge ${map[s]||'badge-gray'}">${s}</span>`;
};

const vehicleTypeIcon = t => ({SUV:'🚙',Sedan:'🚗',Pickup:'🛻',Hatchback:'🚘',Van:'🚐',Bus:'🚌',Truck:'🚛',Motorbike:'🏍️',Coupe:'🏎️'}[t] || '🚗');
const vehicleTypeClass = t => 'type-' + (t||'').toLowerCase().replace(/\s+/g,'-');
const fmtMileage = n => Number(n).toLocaleString('en-KE') + ' km';

function setGalleryMain(url, el) {
  document.getElementById('gallery-main').style.background = `url('${url}') center/cover no-repeat`;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

/* ── Photo Lightbox ── */
let _lightboxImages = [];
let _lightboxIdx = 0;

function openLightbox(images, idx) {
  _lightboxImages = images;
  _lightboxIdx = idx;
  const ov = document.createElement('div');
  ov.id = 'lightbox-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;';
  ov.innerHTML = `
    <button onclick="closeLightbox()" style="position:absolute;top:20px;right:24px;background:none;border:none;color:#fff;font-size:2rem;cursor:pointer;line-height:1">✕</button>
    <div style="position:relative;max-width:90vw;max-height:80vh;display:flex;align-items:center;gap:16px">
      <button id="lb-prev" onclick="lightboxNav(-1)" style="background:rgba(255,255,255,.15);border:none;color:#fff;font-size:1.8rem;cursor:pointer;padding:12px 16px;border-radius:50%;flex-shrink:0">‹</button>
      <img id="lb-img" src="${images[idx]}" style="max-width:80vw;max-height:78vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 48px rgba(0,0,0,.5)" onclick="event.stopPropagation()">
      <button id="lb-next" onclick="lightboxNav(1)" style="background:rgba(255,255,255,.15);border:none;color:#fff;font-size:1.8rem;cursor:pointer;padding:12px 16px;border-radius:50%;flex-shrink:0">›</button>
    </div>
    <div style="color:rgba(255,255,255,.6);margin-top:16px;font-size:.88rem" id="lb-counter">${idx+1} / ${images.length}</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;justify-content:center;max-width:90vw">
      ${images.map((img,i) => `<div onclick="lightboxGoto(${i})" style="width:52px;height:40px;background:url('${img}') center/cover;border-radius:4px;cursor:pointer;opacity:${i===idx?1:.5};border:${i===idx?'2px solid #fff':'2px solid transparent'}" id="lb-dot-${i}"></div>`).join('')}
    </div>`;
  ov.addEventListener('click', e => { if (e.target === ov) closeLightbox(); });
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';
  // Hide prev/next if only 1 image
  if (images.length <= 1) { document.getElementById('lb-prev').style.visibility='hidden'; document.getElementById('lb-next').style.visibility='hidden'; }
}

function closeLightbox() {
  document.getElementById('lightbox-overlay')?.remove();
  document.body.style.overflow = '';
}

function lightboxNav(dir) {
  lightboxGoto((_lightboxIdx + dir + _lightboxImages.length) % _lightboxImages.length);
}

function lightboxGoto(idx) {
  _lightboxIdx = idx;
  document.getElementById('lb-img').src = _lightboxImages[idx];
  document.getElementById('lb-counter').textContent = `${idx+1} / ${_lightboxImages.length}`;
  document.querySelectorAll('[id^="lb-dot-"]').forEach((el, i) => {
    el.style.opacity = i === idx ? 1 : 0.5;
    el.style.borderColor = i === idx ? '#fff' : 'transparent';
  });
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox-overlay')) return;
  if (e.key === 'ArrowRight') lightboxNav(1);
  if (e.key === 'ArrowLeft')  lightboxNav(-1);
  if (e.key === 'Escape')     closeLightbox();
});

function showToast(msg, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':'ℹ️'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function openModal(html) {
  const ov = document.createElement('div');
  ov.className = 'modal-overlay'; ov.id = 'modal-overlay';
  ov.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if (e.target === ov) closeModal(); });
}
function closeModal() { document.getElementById('modal-overlay')?.remove(); }

/* ── Navigation ── */
function renderNavbar() {
  const s = DB.getSettings();
  const logoHtml = s.logoUrl
    ? `<img src="${s.logoUrl}" alt="${s.siteName}" style="height:40px;width:auto;border-radius:6px;object-fit:contain">`
    : `<div class="nav-brand-icon">🏘️</div>`;
  return `
  <nav id="navbar">
    <div class="nav-inner">
      <div class="nav-brand" onclick="App.navigate('home')">
        ${logoHtml}
        <div class="nav-brand-text">
          <span class="nav-brand-name">${s.siteName}</span>
          <span class="nav-brand-tagline">${s.tagline}</span>
        </div>
      </div>
      <div class="nav-menu">
        <span class="nav-link" data-page="home">Home</span>
        <span class="nav-link" data-page="properties">Properties</span>
        <span class="nav-link" data-page="vehicles">Vehicles</span>
        <span class="nav-link" data-page="services">Services</span>
        <span class="nav-link" data-page="booking">Book Viewing</span>
        <span class="nav-link" data-page="contact">Contact</span>
      </div>
      <div class="nav-actions">
        <button class="btn btn-primary btn-sm" onclick="App.navigate('booking')">📅 Book Now</button>
        <button class="btn btn-outline btn-sm" onclick="App.navigate('admin')" title="Admin">⚙️</button>
      </div>
      <button class="nav-hamburger" id="hamburger" onclick="toggleMobileNav()">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  <div class="nav-mobile" id="nav-mobile">
    <span class="nav-link" data-page="home">🏠 Home</span>
    <span class="nav-link" data-page="properties">🏗️ Properties</span>
    <span class="nav-link" data-page="vehicles">🚗 Vehicles</span>
    <span class="nav-link" data-page="services">📋 Services</span>
    <span class="nav-link" data-page="due-diligence">🔍 Due Diligence</span>
    <span class="nav-link" data-page="transfers">📑 Transfers & Subdivision</span>
    <span class="nav-link" data-page="booking">📅 Book Viewing</span>
    <span class="nav-link" data-page="contact">📞 Contact</span>
    <div style="padding: 12px 0; border-top: 1px solid var(--border); margin-top: 12px;">
      <span class="nav-link" data-page="admin">⚙️ Admin Panel</span>
    </div>
  </div>`;
}

function updateNavActive() {
  document.querySelectorAll('.nav-link[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === App.page);
  });
}

function toggleMobileNav() {
  document.getElementById('nav-mobile')?.classList.toggle('open');
}
function closeMobileNav() {
  document.getElementById('nav-mobile')?.classList.remove('open');
}

/* ── Footer ── */
function renderFooter() {
  return `
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="nav-brand" style="cursor:pointer" onclick="App.navigate('home')">
            <div class="nav-brand-icon">🏘️</div>
            <div class="nav-brand-text">
              <span class="nav-brand-name" style="color:#fff">Kakilin Properties</span>
              <span class="nav-brand-tagline">Your Trust, Our Priority</span>
            </div>
          </div>
          <p class="footer-brand-tagline">Kenya's trusted property partner — helping you find, buy, and secure property with confidence and full legal compliance.</p>
          <div class="footer-social">
            <a href="#">📘</a><a href="#">🐦</a><a href="#">📸</a><a href="#">💼</a>
          </div>
        </div>
        <div>
          <div class="footer-heading">Quick Links</div>
          <ul class="footer-links">
            <li><a onclick="App.navigate('properties')">Browse Properties</a></li>
            <li><a onclick="App.navigate('vehicles')">Browse Vehicles</a></li>
            <li><a onclick="App.navigate('services')">Our Services</a></li>
            <li><a onclick="App.navigate('booking')">Book a Viewing</a></li>
            <li><a onclick="App.navigate('contact')">Contact Us</a></li>
          </ul>
        </div>
        <div>
          <div class="footer-heading">Services</div>
          <ul class="footer-links">
            <li><a onclick="App.navigate('due-diligence')">Due Diligence</a></li>
            <li><a onclick="App.navigate('transfers')">Land Transfer</a></li>
            <li><a onclick="App.navigate('transfers')">Subdivision</a></li>
            <li><a onclick="App.navigate('developer')">Developer Portal</a></li>
          </ul>
        </div>
        <div>
          <div class="footer-heading">Contact</div>
          <ul class="footer-links">
            <li><a>📍 Nairobi, Kenya</a></li>
            <li><a>📞 +254 700 000 000</a></li>
            <li><a>✉️ info@kakilin.co.ke</a></li>
            <li><a>🕐 Mon–Fri: 8am – 6pm</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Kakilin Properties Ltd. All rights reserved.</span>
        <div style="display:flex;gap:20px">
          <a style="color:rgba(255,255,255,.4)">Privacy Policy</a>
          <a style="color:rgba(255,255,255,.4)">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>`;
}

/* ============================================================
   HOME PAGE
   ============================================================ */
function renderHome() {
  const s        = DB.getSettings();
  const allProps = DB.get('properties');
  const allVehs  = DB.get('vehicles');
  const featured = allProps.filter(p => p.status !== 'Sold').slice(0, 3);
  const totalProps    = allProps.length;
  const sold          = allProps.filter(p => p.status === 'Sold').length;
  const soldVehs      = allVehs.filter(v => v.status === 'Sold').length;
  const countiesCovered = [...new Set(allProps.map(p => p.county))].length;
  const totalLeads    = DB.get('leads').length;

  return `
  <section class="hero">
    <div class="container hero-content">
      <div style="max-width:780px">
        <div class="hero-eyebrow">🏆 Kenya's Trusted Property & Vehicle Partner</div>
        <h1>Find Your Perfect <span>Property</span> or <span>Vehicle</span> in Kenya</h1>
        <p>From premium land and plots to family homes and quality vehicles — we connect buyers with verified listings and handle every step with full legal due diligence.</p>

        <!-- Search tabs -->
        <div class="hero-search" style="padding:0;overflow:hidden">
          <div style="display:flex;background:rgba(255,255,255,.08);border-radius:var(--radius-lg) var(--radius-lg) 0 0">
            <button id="hs-tab-prop" onclick="switchHeroTab('prop')" style="flex:1;padding:14px;font-weight:700;font-size:.92rem;background:rgba(255,255,255,.18);color:#fff;border:none;border-radius:var(--radius-lg) 0 0 0;cursor:pointer;border-bottom:3px solid var(--accent)">🏗️ Properties</button>
            <button id="hs-tab-veh" onclick="switchHeroTab('veh')" style="flex:1;padding:14px;font-weight:700;font-size:.92rem;background:none;color:rgba(255,255,255,.6);border:none;border-radius:0 var(--radius-lg) 0 0;cursor:pointer;border-bottom:3px solid transparent">🚗 Vehicles</button>
          </div>

          <!-- Property search -->
          <div id="hs-panel-prop" style="display:flex;flex-wrap:wrap;gap:12px;padding:20px;background:rgba(255,255,255,.08)">
            <div class="form-group" style="flex:1;min-width:140px">
              <label style="color:rgba(255,255,255,.75)">Property Type</label>
              <select class="form-control" id="hs-type">
                <option value="">All Types</option>
                <option>Land</option><option>House</option><option>Plot</option><option>Commercial</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;min-width:140px">
              <label style="color:rgba(255,255,255,.75)">County</label>
              <select class="form-control" id="hs-county" onchange="updateHeroAreas()">
                <option value="">All Counties</option>
                ${Object.keys(KENYA_COUNTIES).sort().map(c => `<option>${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="flex:1;min-width:140px">
              <label style="color:rgba(255,255,255,.75)">Area / Town</label>
              <select class="form-control" id="hs-area">
                <option value="">All Areas</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;min-width:140px">
              <label style="color:rgba(255,255,255,.75)">Max Budget (KSh)</label>
              <select class="form-control" id="hs-price">
                <option value="">Any Budget</option>
                <option value="1500000">Up to 1.5M</option>
                <option value="3000000">Up to 3M</option>
                <option value="5000000">Up to 5M</option>
                <option value="10000000">Up to 10M</option>
                <option value="15000000">Up to 15M</option>
                <option value="30000000">Up to 30M</option>
                <option value="50000000">Up to 50M</option>
                <option value="100000000">Up to 100M</option>
              </select>
            </div>
            <div style="display:flex;align-items:flex-end">
              <button class="btn btn-primary" onclick="heroSearch()">🔍 Search</button>
            </div>
          </div>

          <!-- Vehicle search -->
          <div id="hs-panel-veh" style="display:none;flex-wrap:wrap;gap:12px;padding:20px;background:rgba(255,255,255,.08)">
            <div class="form-group" style="flex:1;min-width:130px">
              <label style="color:rgba(255,255,255,.75)">Vehicle Type</label>
              <select class="form-control" id="hs-vtype">
                <option value="">All Types</option>
                ${['SUV','Sedan','Pickup','Hatchback','Van','Bus','Truck','Motorbike','Coupe'].map(t=>`<option>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="flex:1;min-width:130px">
              <label style="color:rgba(255,255,255,.75)">Fuel Type</label>
              <select class="form-control" id="hs-vfuel">
                <option value="">Any Fuel</option>
                <option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;min-width:130px">
              <label style="color:rgba(255,255,255,.75)">Transmission</label>
              <select class="form-control" id="hs-vtrans">
                <option value="">Any</option>
                <option>Automatic</option><option>Manual</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;min-width:130px">
              <label style="color:rgba(255,255,255,.75)">Max Price (KSh)</label>
              <select class="form-control" id="hs-vprice">
                <option value="">Any Price</option>
                <option value="500000">Up to 500K</option>
                <option value="1000000">Up to 1M</option>
                <option value="2000000">Up to 2M</option>
                <option value="3500000">Up to 3.5M</option>
                <option value="5000000">Up to 5M</option>
                <option value="8000000">Up to 8M</option>
                <option value="15000000">Up to 15M</option>
              </select>
            </div>
            <div style="display:flex;align-items:flex-end">
              <button class="btn btn-primary" onclick="heroVehicleSearch()">🔍 Search</button>
            </div>
          </div>
        </div>

        <div class="hero-stats" style="margin-top:28px">
          <div><div class="hero-stat-num">${totalProps}+</div><div class="hero-stat-label">Properties Listed</div></div>
          <div><div class="hero-stat-num">${allVehs.length}+</div><div class="hero-stat-label">Vehicles for Sale</div></div>
          <div><div class="hero-stat-num">${sold + soldVehs}+</div><div class="hero-stat-label">Deals Closed</div></div>
          <div><div class="hero-stat-num">${totalLeads}+</div><div class="hero-stat-label">Clients Served</div></div>
        </div>
      </div>
    </div>
  </section>

  <!-- Featured Properties -->
  <section class="section section-alt">
    <div class="container">
      <div class="section-header" style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div class="section-label">Featured Listings</div>
          <h2 class="section-title">Properties Available Now</h2>
        </div>
        <button class="btn btn-outline" onclick="App.navigate('properties')">View All Properties →</button>
      </div>
      <div class="properties-grid">
        ${featured.map(p => renderPropertyCard(p)).join('')}
      </div>
    </div>
  </section>

  <!-- Featured Vehicles -->
  ${(() => {
    const featuredVehicles = DB.get('vehicles').filter(v => v.status !== 'Sold').slice(0, 3);
    if (!featuredVehicles.length) return '';
    return `
  <section class="section">
    <div class="container">
      <div class="section-header" style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div class="section-label">Cars & Vehicles</div>
          <h2 class="section-title">Vehicles for Sale</h2>
          <p class="section-subtitle" style="margin-top:4px">Sold on behalf of verified private owners — inspected, listed, transferred.</p>
        </div>
        <button class="btn btn-outline" onclick="App.navigate('vehicles')">View All Vehicles →</button>
      </div>
      <div class="properties-grid">
        ${featuredVehicles.map(v => renderVehicleCard(v)).join('')}
      </div>
    </div>
  </section>`;
  })()}

  <!-- Why Choose Us -->
  <section class="section">
    <div class="container">
      <div class="section-header text-center">
        <div class="section-label">Why Kakilin</div>
        <h2 class="section-title">Your Property Journey, Simplified</h2>
        <p class="section-subtitle">We handle the complexity so you can focus on making the right decision with full confidence.</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:28px;margin-top:8px">
        ${[
          ['🛡️','Verified Listings','Every property undergoes title verification before listing. No fraud, no surprises.'],
          ['⚖️','Legal Due Diligence','Full title search, history checks, and ownership verification done for you.'],
          ['🤝','End-to-End Support','From search to transfer — we walk with you through every step.'],
          ['⚡','Fast Turnaround','Quick response times and efficient processing. Your time matters.'],
          ['📊','Transparent Pricing','No hidden costs. Clear pricing on all properties and services.'],
          ['🗺️','Local Expertise','Deep knowledge of the Kenyan property market and legal landscape.']
        ].map(([icon, title, desc]) => `
          <div style="padding:28px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow)">
            <div style="font-size:2.2rem;margin-bottom:14px">${icon}</div>
            <h3 style="font-weight:700;margin-bottom:8px;font-size:1rem">${title}</h3>
            <p style="font-size:.86rem;color:var(--text-light);line-height:1.65">${desc}</p>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- Services Overview -->
  <section class="section section-alt">
    <div class="container">
      <div class="section-header text-center">
        <div class="section-label">Our Services</div>
        <h2 class="section-title">More Than Just Listings</h2>
        <p class="section-subtitle">We offer a full suite of property services to protect your investment at every stage.</p>
      </div>
      <div class="services-grid" style="margin-top:8px">
        ${(() => {
          const sp = s.prices || {};
          const fp = v => v ? `From KSh ${Number(v).toLocaleString('en-KE')}` : 'Custom Packages';
          return [
            ['🔍','Due Diligence','Title searches, ownership verification, and land history checks so you buy with confidence.', fp(sp.fullDueDiligence),'due-diligence'],
            ['📑','Land Transfer','Full facilitation of land transfer from seller to buyer, including stamp duty guidance.', fp(sp.landTransfer),'transfers'],
            ['📐','Subdivision','Professionally managed land subdivision with survey and new title registration.', fp(sp.subdivision),'transfers'],
            ['🏗️','Property Management','We manage your property portfolio on your behalf — marketing, sales, and reporting.',sp.propertyManagement ? fp(sp.propertyManagement) : 'Custom Packages','developer']
          ];
        })().map(([icon,title,desc,price,page]) => `
          <div class="service-card" onclick="App.navigate('${page}')">
            <div class="service-icon">${icon}</div>
            <h3>${title}</h3>
            <p>${desc}</p>
            <div class="service-card-footer">
              <span class="service-price">${price}</span>
              <span style="font-size:.82rem;color:var(--accent);font-weight:600">Learn More →</span>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section class="section section-dark">
    <div class="container">
      <div class="section-header text-center">
        <div class="section-label" style="color:var(--accent)">Testimonials</div>
        <h2 class="section-title">What Our Clients Say</h2>
      </div>
      <div class="testimonials-grid">
        ${[
          ['MW','Mary W.','Land Buyer — Karen',5,'Kakilin made buying land so stress-free. The due diligence team flagged a potential title issue before we paid — saved us millions. Highly recommend!'],
          ['DO','David O.','Plot Investor — Kitengela',5,'Bought 3 plots through Kakilin. Smooth process, transparent pricing, and the transfer was completed in record time. My go-to for all future investments.'],
          ['FH','Fatuma H.','Home Buyer — Runda',5,'The team went above and beyond to help us find our dream home. Professional, responsive, and genuinely invested in getting the right result for us.']
        ].map(([init,name,role,stars,text]) => `
          <div class="testimonial-card">
            <div class="testimonial-stars">${'⭐'.repeat(stars)}</div>
            <p class="testimonial-text">"${text}"</p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">${init}</div>
              <div><div class="testimonial-name">${name}</div><div class="testimonial-role">${role}</div></div>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- CTA -->
  <div class="cta-section">
    <div class="container">
      <h2>Ready to Find Your Next Property or Vehicle?</h2>
      <p>Talk to our team today. We'll help you navigate the market with confidence and clarity — whether it's land, a home, or your next car.</p>
      <div class="cta-actions">
        <button class="btn btn-primary" onclick="App.navigate('properties')">🏗️ Browse Properties</button>
        <button class="btn btn-primary" onclick="App.navigate('vehicles')" style="background:var(--accent)">🚗 Browse Vehicles</button>
        <button class="btn btn-outline-light" onclick="App.navigate('booking')">📅 Book a Consultation</button>
      </div>
    </div>
  </div>
  ${renderFooter()}`;
}

function heroSearch() {
  const type   = document.getElementById('hs-type')?.value   || '';
  const county = document.getElementById('hs-county')?.value || '';
  const area   = document.getElementById('hs-area')?.value   || '';
  const price  = document.getElementById('hs-price')?.value  || '';
  App.navigate('properties', { type, county, area, maxPrice: price });
}

function heroVehicleSearch() {
  App.navigate('vehicles', {
    type:     document.getElementById('hs-vtype')?.value  || '',
    fuel:     document.getElementById('hs-vfuel')?.value  || '',
    trans:    document.getElementById('hs-vtrans')?.value || '',
    maxPrice: document.getElementById('hs-vprice')?.value || '',
  });
}

function switchHeroTab(tab) {
  const propPanel = document.getElementById('hs-panel-prop');
  const vehPanel  = document.getElementById('hs-panel-veh');
  const propTab   = document.getElementById('hs-tab-prop');
  const vehTab    = document.getElementById('hs-tab-veh');
  if (!propPanel || !vehPanel) return;
  if (tab === 'prop') {
    propPanel.style.display = 'flex';
    vehPanel.style.display  = 'none';
    propTab.style.background = 'rgba(255,255,255,.18)';
    propTab.style.color      = '#fff';
    propTab.style.borderBottomColor = 'var(--accent)';
    vehTab.style.background  = 'none';
    vehTab.style.color       = 'rgba(255,255,255,.6)';
    vehTab.style.borderBottomColor  = 'transparent';
  } else {
    vehPanel.style.display  = 'flex';
    propPanel.style.display = 'none';
    vehTab.style.background  = 'rgba(255,255,255,.18)';
    vehTab.style.color       = '#fff';
    vehTab.style.borderBottomColor  = 'var(--accent)';
    propTab.style.background = 'none';
    propTab.style.color      = 'rgba(255,255,255,.6)';
    propTab.style.borderBottomColor = 'transparent';
  }
}

function updateHeroAreas() {
  const county = document.getElementById('hs-county')?.value;
  const areaEl = document.getElementById('hs-area');
  if (!areaEl) return;
  const areas = county && KENYA_COUNTIES[county] ? KENYA_COUNTIES[county] : [];
  areaEl.innerHTML = `<option value="">All Areas</option>` + areas.sort().map(a => `<option>${a}</option>`).join('');
}

function updateFilterAreas() {
  const county = document.getElementById('f-county')?.value;
  const areaEl = document.getElementById('f-area');
  if (!areaEl) return;
  const areas = county && KENYA_COUNTIES[county] ? KENYA_COUNTIES[county] : [];
  areaEl.innerHTML = `<option value="">All Areas</option>` + areas.sort().map(a => `<option>${a}</option>`).join('');
}

/* ============================================================
   PROPERTY CARD
   ============================================================ */
function renderPropertyCard(p) {
  const firstImg = p.images && p.images.length > 0 ? p.images[0] : null;
  return `
  <div class="property-card" onclick="App.navigate('property', {id:'${p.id}'})"  style="cursor:pointer">
    <div class="property-card-img ${firstImg ? '' : propertyTypeClass(p.type)}" style="${firstImg ? `background:url('${firstImg}') center/cover no-repeat` : ''}">
      ${!firstImg ? `<div class="property-card-icon">${propertyTypeIcon(p.type)}</div>` : ''}
      <div class="property-card-badges">
        ${statusBadge(p.status)}
        <span class="badge badge-gray">${p.type}</span>
      </div>
      ${firstImg && p.images.length > 1 ? `<div class="property-card-fav" style="background:rgba(0,0,0,.5);color:#fff;font-size:.75rem;width:auto;padding:3px 8px;border-radius:100px">📷 ${p.images.length}</div>` : ''}
    </div>
    <div class="property-card-body">
      <div class="property-card-type">${p.type}</div>
      <div class="property-card-title">${p.title}</div>
      <div class="property-card-loc">📍 ${p.location}, ${p.county}</div>
      <div class="property-card-meta">
        <div class="property-card-meta-item">📐 ${p.size}</div>
        ${p.bedrooms ? `<div class="property-card-meta-item">🛏 ${p.bedrooms} Beds</div>` : ''}
        ${p.bathrooms ? `<div class="property-card-meta-item">🚿 ${p.bathrooms} Baths</div>` : ''}
      </div>
      <div class="property-card-footer">
        <div class="property-card-price">${fmt(p.price)}<span> total</span></div>
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();App.navigate('booking',{propertyId:'${p.id}'})">Book Viewing</button>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   PROPERTIES PAGE
   ============================================================ */
function renderProperties() {
  const all = DB.get('properties');
  const types = [...new Set(all.map(p => p.type))];
  const counties = [...new Set(all.map(p => p.county))];

  const fType   = App.params.type     || '';
  const fCounty = App.params.county   || '';
  const fArea   = App.params.area     || '';
  const fMax    = App.params.maxPrice ? Number(App.params.maxPrice) : null;
  const fStatus = App.params.status   || '';
  const fSearch = App.params.q        || '';

  let filtered = all.filter(p => {
    if (fType   && p.type   !== fType)   return false;
    if (fCounty && p.county !== fCounty) return false;
    if (fArea   && p.location.toLowerCase() !== fArea.toLowerCase()) return false;
    if (fMax    && p.price  > fMax)      return false;
    if (fStatus && p.status !== fStatus) return false;
    if (fSearch && !p.title.toLowerCase().includes(fSearch.toLowerCase()) && !p.location.toLowerCase().includes(fSearch.toLowerCase()) && !p.county.toLowerCase().includes(fSearch.toLowerCase())) return false;
    return true;
  });

  return `
  <div class="container" style="padding-top:40px;padding-bottom:80px">
    <div class="section-header">
      <div class="section-label">Listings</div>
      <h1 class="section-title">Browse Properties</h1>
      <p class="section-subtitle">${all.length} properties across Kenya — filter to find exactly what you need.</p>
    </div>

    <!-- Search -->
    <div style="margin-bottom:16px">
      <div style="display:flex;gap:10px">
        <input class="form-control" id="prop-search" placeholder="🔍 Search by name or location..." value="${fSearch}" style="max-width:360px">
        <button class="btn btn-primary" onclick="applyFilters()">Search</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="form-group">
        <label>Type</label>
        <select class="form-control" id="f-type">
          <option value="">All Types</option>
          ${types.map(t => `<option value="${t}" ${fType===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>County</label>
        <select class="form-control" id="f-county" onchange="updateFilterAreas()">
          <option value="">All Counties</option>
          ${Object.keys(KENYA_COUNTIES).sort().map(c => `<option value="${c}" ${fCounty===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Area / Town</label>
        <select class="form-control" id="f-area">
          <option value="">All Areas</option>
          ${fCounty && KENYA_COUNTIES[fCounty] ? KENYA_COUNTIES[fCounty].sort().map(a => `<option value="${a}" ${fArea===a?'selected':''}>${a}</option>`).join('') : ''}
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select class="form-control" id="f-status">
          <option value="">All Status</option>
          <option value="Available" ${fStatus==='Available'?'selected':''}>Available</option>
          <option value="Under Offer" ${fStatus==='Under Offer'?'selected':''}>Under Offer</option>
          <option value="Sold" ${fStatus==='Sold'?'selected':''}>Sold</option>
        </select>
      </div>
      <div class="form-group">
        <label>Max Price (KSh)</label>
        <select class="form-control" id="f-price">
          <option value="">Any Price</option>
          <option value="1500000" ${fMax===1500000?'selected':''}>Up to 1.5M</option>
          <option value="3000000" ${fMax===3000000?'selected':''}>Up to 3M</option>
          <option value="5000000" ${fMax===5000000?'selected':''}>Up to 5M</option>
          <option value="10000000" ${fMax===10000000?'selected':''}>Up to 10M</option>
          <option value="15000000" ${fMax===15000000?'selected':''}>Up to 15M</option>
          <option value="30000000" ${fMax===30000000?'selected':''}>Up to 30M</option>
          <option value="50000000" ${fMax===50000000?'selected':''}>Up to 50M</option>
          <option value="100000000" ${fMax===100000000?'selected':''}>Up to 100M</option>
        </select>
      </div>
      <div style="display:flex;gap:8px;align-items:flex-end">
        <button class="btn btn-primary" onclick="applyFilters()">Apply</button>
        <button class="btn btn-outline" onclick="App.navigate('properties')">Clear</button>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:8px">
      <p style="color:var(--text-light);font-size:.88rem">Showing <strong>${filtered.length}</strong> of ${all.length} properties</p>
    </div>

    ${filtered.length === 0 ? `
      <div class="empty-state">
        <div class="icon">🏗️</div>
        <h3>No Properties Found</h3>
        <p>Try adjusting your filters or <span style="color:var(--accent);cursor:pointer" onclick="App.navigate('properties')">clear all filters</span>.</p>
      </div>` : `
      <div class="properties-grid">${filtered.map(p => renderPropertyCard(p)).join('')}</div>`}
  </div>
  ${renderFooter()}`;
}

function applyFilters() {
  const type     = document.getElementById('f-type')?.value     || '';
  const county   = document.getElementById('f-county')?.value   || '';
  const area     = document.getElementById('f-area')?.value     || '';
  const maxPrice = document.getElementById('f-price')?.value    || '';
  const status   = document.getElementById('f-status')?.value   || '';
  const q        = document.getElementById('prop-search')?.value || '';
  App.navigate('properties', { type, county, area, maxPrice, status, q });
}

/* ============================================================
   PROPERTY DETAIL
   ============================================================ */
function renderPropertyDetail(id) {
  const p = DB.getById('properties', id);
  if (!p) return `<div class="container" style="padding:80px 0"><div class="empty-state"><div class="icon">🏚️</div><h3>Property Not Found</h3><p><span style="color:var(--accent);cursor:pointer" onclick="App.navigate('properties')">Back to listings</span></p></div></div>`;

  const dev = DB.getById('developers', p.developerId);

  const hasImgs = p.images && p.images.length > 0;
  return `
  <div>
    ${hasImgs ? `
    <div class="prop-gallery">
      <div class="prop-gallery-main" id="gallery-main" style="background:url('${p.images[0]}') center/cover no-repeat;cursor:zoom-in" onclick="openLightbox(${JSON.stringify(p.images)},_galleryActiveIdx||0)">
        <div class="hero-badges" style="position:absolute;top:16px;left:16px;opacity:1">${statusBadge(p.status)}<span class="badge badge-gray" style="margin-left:6px">${p.type}</span></div>
        ${p.images.length > 1 ? `<div class="gallery-counter" style="cursor:zoom-in">📷 ${p.images.length} photos · Click to expand</div>` : '<div class="gallery-counter" style="cursor:zoom-in">🔍 Click to expand</div>'}
      </div>
      ${p.images.length > 1 ? `<div class="prop-gallery-thumbs">${p.images.slice(0,5).map((img,i) => `<div class="gallery-thumb ${i===0?'active':''}" style="background:url('${img}') center/cover;cursor:zoom-in" onclick="setGalleryMain('${img}',this);_galleryActiveIdx=${i}"></div>`).join('')}</div>` : ''}
    </div>` : `
    <div class="property-detail-hero ${propertyTypeClass(p.type)}">
      <span>${propertyTypeIcon(p.type)}</span>
      <div class="hero-badges">
        ${statusBadge(p.status)}
        <span class="badge badge-gray">${p.type}</span>
      </div>
    </div>`}

    <div class="container">
      <div class="property-detail-body">
        <!-- Left: Details -->
        <div>
          <div class="page-breadcrumb" style="margin-top:16px">
            <span onclick="App.navigate('home')">Home</span>
            <span class="sep">›</span>
            <span onclick="App.navigate('properties')">Properties</span>
            <span class="sep">›</span>
            <span style="color:var(--text)">${p.title}</span>
          </div>
          <h1 style="font-size:1.8rem;font-weight:800;margin-bottom:8px;line-height:1.25">${p.title}</h1>
          <p style="color:var(--text-light);margin-bottom:20px;display:flex;align-items:center;gap:6px">📍 ${p.location}, ${p.county}</p>

          <div class="property-spec-grid">
            <div class="property-spec-item">
              <div class="property-spec-icon">📐</div>
              <div><div class="property-spec-label">Size</div><div class="property-spec-value">${p.size}</div></div>
            </div>
            <div class="property-spec-item">
              <div class="property-spec-icon">🏷️</div>
              <div><div class="property-spec-label">Type</div><div class="property-spec-value">${p.type}</div></div>
            </div>
            ${p.bedrooms ? `<div class="property-spec-item"><div class="property-spec-icon">🛏️</div><div><div class="property-spec-label">Bedrooms</div><div class="property-spec-value">${p.bedrooms}</div></div></div>` : ''}
            ${p.bathrooms ? `<div class="property-spec-item"><div class="property-spec-icon">🚿</div><div><div class="property-spec-label">Bathrooms</div><div class="property-spec-value">${p.bathrooms}</div></div></div>` : ''}
            <div class="property-spec-item">
              <div class="property-spec-icon">📋</div>
              <div><div class="property-spec-label">Status</div><div class="property-spec-value">${p.status}</div></div>
            </div>
            <div class="property-spec-item">
              <div class="property-spec-icon">👁️</div>
              <div><div class="property-spec-label">Views</div><div class="property-spec-value">${p.views}</div></div>
            </div>
          </div>

          <div class="divider"></div>
          <h3 style="font-weight:700;margin-bottom:12px">About This Property</h3>
          <p style="color:var(--text-light);line-height:1.75;font-size:.95rem">${p.description}</p>

          <div class="divider"></div>
          <h3 style="font-weight:700;margin-bottom:14px">Features & Amenities</h3>
          <div class="property-features">
            ${p.features.map(f => `<span class="property-feature-tag">✓ ${f}</span>`).join('')}
          </div>

          ${dev ? `
          <div class="divider"></div>
          <h3 style="font-weight:700;margin-bottom:14px">Listed By</h3>
          <div style="display:flex;align-items:center;gap:14px;background:var(--bg);padding:18px;border-radius:var(--radius-lg)">
            <div style="width:48px;height:48px;background:var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem">🏢</div>
            <div>
              <div style="font-weight:700">${dev.name}</div>
              <div style="font-size:.84rem;color:var(--text-light)">${dev.contact} · ${dev.phone}</div>
            </div>
          </div>` : ''}
        </div>

        <!-- Right: Inquiry card -->
        <div>
          <div class="inquiry-card">
            <div class="inquiry-card-price">${fmt(p.price)}</div>
            <div class="inquiry-card-per">Total asking price</div>

            ${p.status === 'Sold' ? `
              <div class="alert alert-error">This property has been sold. <span style="cursor:pointer;text-decoration:underline" onclick="App.navigate('properties')">View similar listings.</span></div>
            ` : `
              <button class="btn btn-primary btn-block" style="margin-bottom:10px" onclick="App.navigate('booking',{propertyId:'${p.id}'})">📅 Book a Viewing</button>
              <button class="btn btn-outline btn-block" onclick="openInquiryModal('${p.id}')">✉️ Send Inquiry</button>
              <div class="divider"></div>
              <div style="background:var(--bg);border-radius:var(--radius);padding:14px;font-size:.84rem;color:var(--text-light)">
                <p style="margin-bottom:8px">📞 <strong>Call us:</strong> +254 700 000 000</p>
                <p>🕐 Available Mon–Fri, 8am–6pm</p>
              </div>
            `}

            <div class="divider"></div>
            <div style="font-size:.8rem;color:var(--text-muted)">
              <p style="margin-bottom:6px">📋 Listed: ${new Date(p.listedDate).toLocaleDateString('en-KE',{month:'long',day:'numeric',year:'numeric'})}</p>
              <p>🔍 ${p.inquiries} inquiries on this property</p>
            </div>
          </div>

          <!-- Due diligence upsell -->
          <div style="background:var(--accent-light);border:1px solid rgba(200,146,26,.25);border-radius:var(--radius-lg);padding:20px;margin-top:20px">
            <div style="font-size:1.2rem;margin-bottom:8px">🛡️</div>
            <div style="font-weight:700;margin-bottom:6px;font-size:.95rem">Protect Your Investment</div>
            <p style="font-size:.83rem;color:var(--text-light);margin-bottom:14px">Before paying any deposit, get a full title search and ownership verification on this property.</p>
            <button class="btn btn-primary btn-sm btn-block" onclick="App.navigate('due-diligence')">Request Due Diligence</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  ${renderFooter()}`;
}

function openInquiryModal(propertyId) {
  const p = DB.getById('properties', propertyId);
  openModal(`
    <div class="modal-header">
      <h2>Send Inquiry</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="alert alert-info" style="margin-bottom:20px">Inquiring about: <strong>${p?.title}</strong></div>
      <div class="form-group"><label>Full Name *</label><input class="form-control" id="inq-name" placeholder="Your full name"></div>
      <div class="form-row">
        <div class="form-group"><label>Phone *</label><input class="form-control" id="inq-phone" placeholder="+254 7XX XXX XXX"></div>
        <div class="form-group"><label>Email</label><input class="form-control" id="inq-email" type="email" placeholder="your@email.com"></div>
      </div>
      <div class="form-group"><label>Message</label><textarea class="form-control" id="inq-msg" rows="3" placeholder="Tell us what you're looking for..."></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitInquiry('${propertyId}')">Send Inquiry</button>
    </div>`);
}

async function submitInquiry(propertyId) {
  const name  = document.getElementById('inq-name')?.value.trim();
  const phone = document.getElementById('inq-phone')?.value.trim();
  if (!name || !phone) { showToast('Please fill in your name and phone number.', 'error'); return; }
  await DB.insert('leads', { name, phone, email: document.getElementById('inq-email')?.value || '', interest: DB.getById('properties', propertyId)?.title || '', propertyId, status: 'New Lead', date: today(), notes: document.getElementById('inq-msg')?.value || '' });
  closeModal();
  showToast('Inquiry sent! We\'ll be in touch within 24 hours. ✅');
}

/* ============================================================
   SERVICES PAGE
   ============================================================ */
function renderServices() {
  const s = DB.getSettings();
  const p = s.prices || {};
  const fmtP = v => v ? `From KSh ${Number(v).toLocaleString('en-KE')}` : 'Custom Pricing';

  return `
  <div>
    <div style="background:var(--primary);padding:64px 0 56px;text-align:center">
      <div class="container">
        <div class="section-label" style="color:var(--accent)">What We Offer</div>
        <h1 class="section-title" style="color:var(--white);margin:8px 0">Property Services</h1>
        <p class="section-subtitle" style="margin:0 auto">Professional, legally compliant services to protect your investment at every stage.</p>
      </div>
    </div>
    <div class="container" style="padding:60px 24px 80px">
      <div class="services-grid">
        ${[
          ['🔍','Due Diligence','Full property investigation including title search, ownership verification, land history, and encumbrance checks. Essential before any purchase.', fmtP(p.fullDueDiligence),'Get Started','due-diligence',
           ['Title Search','Ownership Verification','Encumbrance Check','Land History Report']],
          ['📑','Land Transfer','Complete facilitation of land transfer — from sale agreement drafting to stamp duty payment and final title registration in the buyer\'s name.', fmtP(p.landTransfer),'Request Transfer','transfers',
           ['Sale Agreement','Stamp Duty Guidance','Title Registration','Completion Certificate']],
          ['📐','Land Subdivision','Professionally managed subdivision with licensed surveyor engagement, county council approval, and new title issuance for each sub-plot.', fmtP(p.subdivision),'Request Subdivision','transfers',
           ['Survey & Mapping','County Approval','New Titles Issued','Plot Numbering']],
          ['🏗️','Property Management','Full property portfolio management for developers — listing, marketing, lead management, sales tracking, and performance reporting.',p.propertyManagement ? fmtP(p.propertyManagement) : 'Custom Pricing','Contact Us','developer',
           ['Portfolio Listing','Lead Management','Sales Reporting','Commission Tracking']]
        ].map(([icon,title,desc,price,cta,page,items]) => `
          <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow)">
            <div style="padding:28px 28px 0">
              <div class="service-icon">${icon}</div>
              <h3 style="font-size:1.2rem;font-weight:800;margin-bottom:10px">${title}</h3>
              <p style="font-size:.88rem;color:var(--text-light);line-height:1.65;margin-bottom:20px">${desc}</p>
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px">
                ${items.map(i => `<span class="badge badge-blue">${i}</span>`).join('')}
              </div>
            </div>
            <div style="padding:18px 28px;border-top:1px solid var(--border);background:var(--bg);display:flex;align-items:center;justify-content:space-between">
              <span style="font-weight:700;color:var(--accent)">${price}</span>
              <button class="btn btn-primary btn-sm" onclick="App.navigate('${page}')">${cta} →</button>
            </div>
          </div>`).join('')}
      </div>

      <!-- Process -->
      <div style="margin-top:64px;display:grid;grid-template-columns:1fr 1fr;gap:48px" class="contact-grid">
        <div>
          <div class="section-label">How It Works</div>
          <h2 style="font-size:1.6rem;font-weight:800;margin-bottom:28px">Simple, Clear Process</h2>
          <div class="process-steps">
            ${[['Submit Request','Fill in our online form with property details and the service you need.'],
               ['We Verify','Our team conducts the required checks and investigation.'],
               ['You Stay Updated','Track your request status in real time.'],
               ['Get Your Report','Receive a comprehensive report or completion certificate.']
            ].map(([t,d],i) => `
              <div class="process-step">
                <div class="process-num">${i+1}</div>
                <div class="process-content"><h4>${t}</h4><p>${d}</p></div>
              </div>`).join('')}
          </div>
        </div>
        <div style="background:var(--primary);border-radius:var(--radius-lg);padding:36px;color:var(--white)">
          <div style="font-size:2rem;margin-bottom:16px">🛡️</div>
          <h3 style="font-size:1.3rem;font-weight:800;margin-bottom:14px">Why Due Diligence Matters</h3>
          <p style="color:rgba(255,255,255,.75);font-size:.9rem;line-height:1.75;margin-bottom:20px">Land fraud is a serious risk in Kenya. A clear title today can become disputed tomorrow if proper verification was skipped. Our due diligence protects you legally and financially.</p>
          ${['Title fraud prevention','Legal ownership confirmation','Encumbrance discovery','Peace of mind'].map(i => `<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;font-size:.9rem;color:rgba(255,255,255,.8)"><span style="color:var(--accent)">✓</span>${i}</div>`).join('')}
          <button class="btn btn-primary" style="margin-top:8px" onclick="App.navigate('due-diligence')">Start Due Diligence</button>
        </div>
      </div>
    </div>
  </div>
  ${renderFooter()}`;
}

/* ============================================================
   DUE DILIGENCE PAGE
   ============================================================ */
function renderDueDiligence() {
  const s = DB.getSettings();
  const p = s.prices || {};
  const fmtP = v => v ? `KSh ${Number(v).toLocaleString('en-KE')}` : 'Contact Us';

  return `
  <div>
    <div style="background:var(--primary);padding:56px 0;text-align:center">
      <div class="container">
        <div class="section-label" style="color:var(--accent)">Property Verification</div>
        <h1 class="section-title" style="color:var(--white);margin:8px 0">Due Diligence Services</h1>
        <p class="section-subtitle" style="margin:0 auto">Know exactly what you're buying before you pay. We verify the title, the owner, and the legal standing of any property.</p>
      </div>
    </div>
    <div class="container" style="padding:56px 24px 80px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px" class="contact-grid">
        <!-- Services list -->
        <div>
          <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:24px">Available Checks</h2>
          ${[
            ['🔍','Title Search', fmtP(p.titleSearch),'2–3 days','Verify the title deed at the Ministry of Lands registry. Confirms the title is clean and in the seller\'s name.','titleSearch'],
            ['👤','Ownership Verification', fmtP(p.ownershipVerification),'1–2 days','Confirm the current registered owner and any previous ownership changes.','ownershipVerification'],
            ['📜','Land History Check', fmtP(p.landHistoryCheck),'3–5 days','Full history of the parcel — previous transactions, disputes, and any cautions or caveats.','landHistoryCheck'],
            ['⚖️','Encumbrance Search', fmtP(p.encumbranceSearch),'2–3 days','Check for loans, mortgages, charges, or court orders registered against the property.','encumbranceSearch'],
            ['📦','Full Due Diligence Package', fmtP(p.fullDueDiligence),'5–7 days','All of the above in one comprehensive report with our legal team\'s assessment.','fullDueDiligence']
          ].map(([icon,title,price,time,desc]) => `
            <div style="border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;margin-bottom:14px;background:var(--white);box-shadow:var(--shadow)">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:8px">
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-size:1.4rem">${icon}</span>
                  <strong style="font-size:1rem">${title}</strong>
                </div>
                <div style="text-align:right">
                  <div style="font-weight:700;color:var(--accent)">${price}</div>
                  <div style="font-size:.75rem;color:var(--text-muted)">⏱ ${time}</div>
                </div>
              </div>
              <p style="font-size:.84rem;color:var(--text-light)">${desc}</p>
            </div>`).join('')}
        </div>

        <!-- Request form -->
        <div>
          <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;box-shadow:var(--shadow-lg);position:sticky;top:calc(var(--nav-height)+20px)">
            <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:20px">Submit a Request</h2>
            <div id="dd-form">
              <div class="form-group"><label>Full Name *</label><input class="form-control" id="dd-name" placeholder="Your full name"></div>
              <div class="form-row">
                <div class="form-group"><label>Phone *</label><input class="form-control" id="dd-phone" placeholder="+254 7XX XXX XXX"></div>
                <div class="form-group"><label>Email</label><input class="form-control" id="dd-email" type="email" placeholder="your@email.com"></div>
              </div>
              <div class="form-group">
                <label>Service Required *</label>
                <select class="form-control" id="dd-service">
                  <option value="">Select a service...</option>
                  <option>Title Search</option>
                  <option>Ownership Verification</option>
                  <option>Land History Check</option>
                  <option>Encumbrance Search</option>
                  <option>Full Due Diligence Package</option>
                </select>
              </div>
              <div class="form-group"><label>Property Details / LR Number *</label><textarea class="form-control" id="dd-property" rows="3" placeholder="E.g. LR No. 3782/Vol.47 in Karen, Nairobi..."></textarea></div>
              <div class="form-group"><label>Additional Notes</label><textarea class="form-control" id="dd-notes" rows="2" placeholder="Any specific concerns or questions..."></textarea></div>
              <button class="btn btn-primary btn-block" onclick="submitDueDiligence()">Submit Request →</button>
              <p style="font-size:.78rem;color:var(--text-muted);text-align:center;margin-top:12px">We'll confirm receipt within 2 hours and begin work promptly.</p>
            </div>
            <div id="dd-success" class="hidden">
              <div style="text-align:center;padding:20px">
                <div style="font-size:3rem;margin-bottom:16px">✅</div>
                <h3 style="margin-bottom:10px">Request Submitted!</h3>
                <p style="color:var(--text-light);font-size:.9rem;margin-bottom:20px">We've received your request and will be in touch within 2 hours to confirm details and payment.</p>
                <button class="btn btn-outline" onclick="resetDdForm()">Submit Another</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  ${renderFooter()}`;
}

async function submitDueDiligence() {
  const name     = document.getElementById('dd-name')?.value.trim();
  const phone    = document.getElementById('dd-phone')?.value.trim();
  const service  = document.getElementById('dd-service')?.value;
  const property = document.getElementById('dd-property')?.value.trim();
  if (!name || !phone || !service || !property) { showToast('Please fill in all required fields.', 'error'); return; }
  await DB.insert('services', { type: 'Due Diligence', service, clientName: name, clientPhone: phone, propertyDetails: property, status: 'Pending', submittedDate: today(), completedDate: null });
  document.getElementById('dd-form').classList.add('hidden');
  document.getElementById('dd-success').classList.remove('hidden');
}
function resetDdForm() {
  document.getElementById('dd-form').classList.remove('hidden');
  document.getElementById('dd-success').classList.add('hidden');
  ['dd-name','dd-phone','dd-email','dd-property','dd-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('dd-service').value = '';
}

/* ============================================================
   TRANSFERS & SUBDIVISION PAGE
   ============================================================ */
function renderTransfers() {
  const s = DB.getSettings();
  const p = s.prices || {};
  const fmtP = v => v ? `KSh ${Number(v).toLocaleString('en-KE')}` : 'Contact Us';

  return `
  <div>
    <div style="background:var(--primary);padding:56px 0;text-align:center">
      <div class="container">
        <div class="section-label" style="color:var(--accent)">Legal Transactions</div>
        <h1 class="section-title" style="color:var(--white);margin:8px 0">Land Transfer & Subdivision</h1>
        <p class="section-subtitle" style="margin:0 auto">We handle all the legal groundwork — from sale agreements to title registration.</p>
      </div>
    </div>
    <div class="container" style="padding:56px 24px 80px">
      <!-- Service tabs -->
      <div class="admin-tabs" style="margin-bottom:36px">
        <div class="admin-tab active" id="tab-transfer" onclick="switchTransferTab('transfer')">📑 Land Transfer</div>
        <div class="admin-tab" id="tab-subdivision" onclick="switchTransferTab('subdivision')">📐 Subdivision</div>
      </div>

      <!-- Land Transfer -->
      <div id="section-transfer">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px" class="contact-grid">
          <div>
            <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:16px">Land Transfer Service</h2>
            <p style="color:var(--text-light);margin-bottom:24px;line-height:1.7">Our legal team manages the complete land transfer process — ensuring the transaction is legally binding, all taxes are paid, and the title is registered correctly in the buyer's name.</p>

            <!-- Process steps -->
            <div class="process-steps" style="margin-bottom:28px">
              ${[
                ['Sale Agreement Drafting','We prepare a legally binding sale agreement protecting both parties.'],
                ['Valuation Report','A licensed valuer assesses the property to determine stamp duty payable.'],
                ['Stamp Duty Payment','We guide you through payment at KRA — 2% rural, 4% urban property value.'],
                ['Land Control Board Consent','Where applicable (agricultural land), we obtain LCB consent.'],
                ['Title Transfer & Registration','We lodge all documents at the Lands Registry and ensure the new title is issued.'],
                ['Completion & Handover','You receive the transferred title deed and a completion certificate.']
              ].map(([t,d],i) => `<div class="process-step"><div class="process-num">${i+1}</div><div class="process-content"><h4>${t}</h4><p>${d}</p></div></div>`).join('')}
            </div>

            <!-- Required documents checklist -->
            <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow)">
              <div style="background:var(--primary);padding:14px 20px">
                <h3 style="color:var(--white);font-size:1rem;font-weight:700">📋 Required Documents & Steps</h3>
              </div>
              <div style="padding:20px">
                ${[
                  ['📄','Valuation Report','Required to determine the stamp duty payable. Must be done by a licensed valuer.','Mandatory'],
                  ['🏦','Stamp Duty Payment','Proof of payment to KRA — <strong>2% of value for rural</strong> and <strong>4% for urban</strong> property. Processed through the iTax portal.','Government Fee'],
                  ['🪪','National IDs / Passports','Certified copies of National ID or passport for <strong>both buyer and seller</strong>. Must be valid.','Mandatory'],
                  ['📌','KRA PIN Certificates','KRA PIN certificates for <strong>both buyer and seller</strong>. Required for stamp duty and registration.','Mandatory'],
                  ['📸','Passport Photos','<strong>2–3 recent passport-size photos</strong> for both buyer and seller.','Mandatory'],
                  ['💍','Spousal Consent Affidavit','If the land is considered family/matrimonial property, a sworn <strong>spousal consent affidavit</strong> is required (Commissioner for Oaths).','If Applicable'],
                  ['🏠','Title Deed (Original)','The original title deed of the property being transferred must be surrendered for cancellation and reissuance.','Mandatory'],
                  ['🏛️','Land Registry Fees','Payment of government registration fees — approximately <strong>KSh 1,500–2,500</strong> — to the land registry for transferring the title.','Government Fee'],
                  ['✅','Land Control Board Consent','Required for agricultural land transfers. We handle the application and hearing process on your behalf.','If Agricultural'],
                ].map(([icon, title, desc, tag]) => {
                  const tagColor = tag === 'Mandatory' ? 'badge-blue' : tag === 'Government Fee' ? 'badge-yellow' : 'badge-gray';
                  return `
                  <div style="display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--border-light)">
                    <div style="font-size:1.4rem;min-width:28px;text-align:center">${icon}</div>
                    <div style="flex:1">
                      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                        <strong style="font-size:.9rem">${title}</strong>
                        <span class="badge ${tagColor}">${tag}</span>
                      </div>
                      <p style="font-size:.84rem;color:var(--text-light);line-height:1.6">${desc}</p>
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </div>

            <!-- Pricing -->
            <div style="margin-top:20px;background:var(--accent-light);border:1px solid rgba(200,146,26,.25);border-radius:var(--radius-lg);padding:20px">
              <div style="font-weight:700;margin-bottom:8px;font-size:1rem">💰 Our Professional Fees</div>
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
                <p style="font-size:.88rem;color:var(--text-light);margin:0">Land transfer facilitation fees (excl. government charges)</p>
                <div style="font-size:1.3rem;font-weight:800;color:var(--accent)">From ${fmtP(p.landTransfer)}</div>
              </div>
              <div class="divider" style="margin:12px 0"></div>
              <div style="font-size:.82rem;color:var(--text-muted)">
                <strong>Note on government charges (paid separately):</strong><br>
                Stamp Duty: 2% (rural) or 4% (urban) of agreed sale price · Land Registry: ~KSh 1,500–2,500 · Valuation: varies by property value
              </div>
            </div>
          </div>

          <div>
            <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;box-shadow:var(--shadow-lg);position:sticky;top:calc(var(--nav-height)+20px)">
              <h3 style="font-weight:800;margin-bottom:6px">Request Land Transfer</h3>
              <p style="font-size:.84rem;color:var(--text-muted);margin-bottom:20px">Fill in your details and we'll contact you within 24 hours to guide you through the next steps.</p>
              <div class="form-group"><label>Buyer Full Name *</label><input class="form-control" id="tr-buyer" placeholder="Full legal name as on ID"></div>
              <div class="form-group"><label>Seller Full Name *</label><input class="form-control" id="tr-seller" placeholder="Full legal name as on ID"></div>
              <div class="form-row">
                <div class="form-group"><label>Your Phone *</label><input class="form-control" id="tr-phone" placeholder="+254 7XX XXX XXX"></div>
                <div class="form-group"><label>Email</label><input class="form-control" id="tr-email" type="email" placeholder="you@email.com"></div>
              </div>
              <div class="form-group"><label>Property / LR Number *</label><input class="form-control" id="tr-property" placeholder="e.g. LR No. 12345 or Plot No. 456"></div>
              <div class="form-group"><label>Agreed Sale Price (KSh) *</label><input class="form-control" id="tr-price" type="number" placeholder="e.g. 5000000"></div>
              <div class="form-group"><label>Property Location / County</label><input class="form-control" id="tr-location" placeholder="e.g. Karen, Nairobi County"></div>
              <div class="form-group">
                <label>Documents You Currently Have</label>
                <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
                  ${[
                    'Original Title Deed',
                    'National IDs (both parties)',
                    'KRA PIN Certificates',
                    'Passport Photos',
                    'Valuation Report',
                    'Spousal Consent Affidavit'
                  ].map(d => `<label style="display:flex;align-items:center;gap:8px;font-weight:400;cursor:pointer;font-size:.88rem"><input type="checkbox" value="${d}" class="tr-doc" style="accent-color:var(--accent)"> ${d}</label>`).join('')}
                </div>
                <div class="form-hint">Don't worry if you don't have everything yet — we'll guide you on what's missing.</div>
              </div>
              <div class="form-group"><label>Additional Notes</label><textarea class="form-control" id="tr-notes" rows="2" placeholder="Any questions or special circumstances..."></textarea></div>
              <button class="btn btn-primary btn-block" onclick="submitTransfer()">Submit Request →</button>
              <p style="font-size:.78rem;color:var(--text-muted);text-align:center;margin-top:10px">We respond within 24 hours on working days.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Subdivision -->
      <div id="section-subdivision" class="hidden">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px" class="contact-grid">
          <div>
            <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:16px">Land Subdivision Service</h2>
            <p style="color:var(--text-light);margin-bottom:24px;line-height:1.7">We manage the entire subdivision process — from engaging a licensed surveyor, obtaining county approvals, to registering new titles for each sub-parcel.</p>
            <div class="process-steps">
              ${[['Survey & Pegging','Licensed surveyor demarcates the sub-plots and prepares a mutation form.'],
                 ['County Approval','We submit to the relevant county for physical planning approval.'],
                 ['Lands Ministry Approval','Approval from the Ministry of Lands for the new registry entries.'],
                 ['New Titles Issued','Individual title deeds created for each new sub-parcel.'],
                 ['Handover','All new titles and survey plans delivered to you.']
              ].map(([t,d],i) => `<div class="process-step"><div class="process-num">${i+1}</div><div class="process-content"><h4>${t}</h4><p>${d}</p></div></div>`).join('')}
            </div>
            <div style="margin-top:24px;background:var(--accent-light);border:1px solid rgba(200,146,26,.25);border-radius:var(--radius-lg);padding:20px">
              <div style="font-weight:700;margin-bottom:8px;font-size:1rem">💰 Our Professional Fees</div>
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
                <p style="font-size:.88rem;color:var(--text-light);margin:0">Subdivision facilitation fees (excl. government & survey charges)</p>
                <div style="font-size:1.3rem;font-weight:800;color:var(--accent)">From ${fmtP(p.subdivision)}</div>
              </div>
              <div class="divider" style="margin:12px 0"></div>
              <div style="font-size:.82rem;color:var(--text-muted)">Survey fees vary by plot size and county. County and Lands Ministry approval charges are quoted separately after initial assessment.</div>
            </div>
          </div>
          <div>
            <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;box-shadow:var(--shadow-lg)">
              <h3 style="font-weight:800;margin-bottom:20px">Request Subdivision</h3>
              <div class="form-group"><label>Your Full Name *</label><input class="form-control" id="sub-name" placeholder="Full legal name"></div>
              <div class="form-row">
                <div class="form-group"><label>Phone *</label><input class="form-control" id="sub-phone" placeholder="+254 7XX XXX XXX"></div>
                <div class="form-group"><label>Email</label><input class="form-control" id="sub-email" type="email" placeholder="you@email.com"></div>
              </div>
              <div class="form-group"><label>Property / LR Number *</label><input class="form-control" id="sub-property" placeholder="LR No. / Title Deed No."></div>
              <div class="form-group"><label>Total Land Size</label><input class="form-control" id="sub-size" placeholder="e.g. 5 Acres"></div>
              <div class="form-group"><label>Number of Sub-plots Required *</label><input class="form-control" id="sub-count" type="number" placeholder="e.g. 10"></div>
              <div class="form-group"><label>County / Location *</label><input class="form-control" id="sub-location" placeholder="e.g. Kiambu County"></div>
              <div class="form-group"><label>Additional Notes</label><textarea class="form-control" id="sub-notes" rows="2" placeholder="Any special requirements..."></textarea></div>
              <button class="btn btn-primary btn-block" onclick="submitSubdivision()">Submit Request →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  ${renderFooter()}`;
}

function switchTransferTab(tab) {
  ['transfer','subdivision'].forEach(t => {
    document.getElementById(`tab-${t}`)?.classList.toggle('active', t === tab);
    document.getElementById(`section-${t}`)?.classList.toggle('hidden', t !== tab);
  });
}

async function submitTransfer() {
  const buyer = document.getElementById('tr-buyer')?.value.trim();
  const phone  = document.getElementById('tr-phone')?.value.trim();
  const property = document.getElementById('tr-property')?.value.trim();
  if (!buyer || !phone || !property) { showToast('Please fill in all required fields.', 'error'); return; }
  await DB.insert('services', { type: 'Land Transfer', service: 'Land Transfer', clientName: buyer, clientPhone: phone, propertyDetails: property + ' — Price: KSh ' + (document.getElementById('tr-price')?.value || 'TBD'), status: 'Pending', submittedDate: today(), completedDate: null });
  showToast('Transfer request submitted! We\'ll contact you within 24 hours.');
  ['tr-buyer','tr-seller','tr-phone','tr-email','tr-property','tr-price','tr-location'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

async function submitSubdivision() {
  const name  = document.getElementById('sub-name')?.value.trim();
  const phone = document.getElementById('sub-phone')?.value.trim();
  const prop  = document.getElementById('sub-property')?.value.trim();
  const count = document.getElementById('sub-count')?.value;
  if (!name || !phone || !prop || !count) { showToast('Please fill in all required fields.', 'error'); return; }
  await DB.insert('services', { type: 'Subdivision', service: 'Land Subdivision', clientName: name, clientPhone: phone, propertyDetails: `${prop} — ${count} sub-plots — ${document.getElementById('sub-size')?.value || ''}`, status: 'Pending', submittedDate: today(), completedDate: null });
  showToast('Subdivision request submitted! Our team will reach out within 24 hours.');
  ['sub-name','sub-phone','sub-email','sub-property','sub-size','sub-count','sub-location','sub-notes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

/* ============================================================
   BOOKING PAGE
   ============================================================ */
function renderBooking() {
  const properties = DB.get('properties').filter(p => p.status === 'Available');
  const preselected = App.params.propertyId ? Number(App.params.propertyId) : null;
  const times = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];

  return `
  <div>
    <div style="background:var(--primary);padding:56px 0;text-align:center">
      <div class="container">
        <div class="section-label" style="color:var(--accent)">Schedule</div>
        <h1 class="section-title" style="color:var(--white);margin:8px 0">Book a Viewing or Consultation</h1>
        <p class="section-subtitle" style="margin:0 auto">Choose what you'd like to book and pick a convenient time. We'll confirm within 2 hours.</p>
      </div>
    </div>
    <div class="container" style="padding:56px 24px 80px;max-width:760px">
      <!-- Type selection -->
      <h3 style="font-weight:700;margin-bottom:16px">1. What would you like to book?</h3>
      <div class="booking-types">
        <div class="booking-type-card selected" id="btype-viewing" onclick="selectBookingType('viewing')">
          <div style="font-size:1.6rem;margin-bottom:10px">🏠</div>
          <h3>Property Viewing</h3>
          <p>Schedule a site visit to view a specific property with our agent.</p>
        </div>
        <div class="booking-type-card" id="btype-consultation" onclick="selectBookingType('consultation')">
          <div style="font-size:1.6rem;margin-bottom:10px">💬</div>
          <h3>Consultation</h3>
          <p>General meeting to discuss your property needs, investment goals, or services.</p>
        </div>
      </div>

      <!-- Property selection (for viewing) -->
      <div id="booking-property-row">
        <div class="divider"></div>
        <h3 style="font-weight:700;margin-bottom:14px">2. Select Property</h3>
        <div class="form-group">
          <select class="form-control" id="b-property">
            <option value="">— Select a property —</option>
            ${properties.map(p => `<option value="${p.id}" ${preselected===p.id?'selected':''}>${p.title} — ${p.location} (${fmt(p.price)})</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="divider"></div>
      <h3 style="font-weight:700;margin-bottom:14px">3. Pick a Date & Time</h3>
      <div class="form-row">
        <div class="form-group"><label>Preferred Date *</label><input class="form-control" id="b-date" type="date" min="${today()}"></div>
        <div class="form-group"><label>Time Slot *</label>
          <select class="form-control" id="b-time">
            <option value="">Select time...</option>
            ${times.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="divider"></div>
      <h3 style="font-weight:700;margin-bottom:14px">4. Your Details</h3>
      <div class="form-group"><label>Full Name *</label><input class="form-control" id="b-name" placeholder="Your full name"></div>
      <div class="form-row">
        <div class="form-group"><label>Phone *</label><input class="form-control" id="b-phone" placeholder="+254 7XX XXX XXX"></div>
        <div class="form-group"><label>Email</label><input class="form-control" id="b-email" type="email" placeholder="your@email.com"></div>
      </div>
      <div class="form-group"><label>Additional Notes</label><textarea class="form-control" id="b-notes" rows="2" placeholder="Anything we should know..."></textarea></div>

      <button class="btn btn-primary btn-block" style="margin-top:8px;padding:14px" onclick="submitBooking()">📅 Confirm Booking</button>
      <p style="font-size:.8rem;color:var(--text-muted);text-align:center;margin-top:12px">We'll send a confirmation message to your phone number within 2 hours of submission.</p>
    </div>
  </div>
  ${renderFooter()}`;
}

let _bookingType = 'viewing';
function selectBookingType(type) {
  _bookingType = type;
  document.getElementById('btype-viewing')?.classList.toggle('selected', type === 'viewing');
  document.getElementById('btype-consultation')?.classList.toggle('selected', type === 'consultation');
  const propRow = document.getElementById('booking-property-row');
  if (propRow) propRow.style.display = type === 'viewing' ? '' : 'none';
}

async function submitBooking() {
  const name  = document.getElementById('b-name')?.value.trim();
  const phone = document.getElementById('b-phone')?.value.trim();
  const date  = document.getElementById('b-date')?.value;
  const time  = document.getElementById('b-time')?.value;
  if (!name || !phone || !date || !time) { showToast('Please fill in all required fields.', 'error'); return; }
  const propertyId = _bookingType === 'viewing' ? (document.getElementById('b-property')?.value || null) : null;
  await DB.insert('bookings', { type: _bookingType === 'viewing' ? 'Property Viewing' : 'Consultation', clientName: name, clientPhone: phone, clientEmail: document.getElementById('b-email')?.value || '', propertyId, date, time, status: 'Pending', notes: document.getElementById('b-notes')?.value || '' });
  openModal(`
    <div class="modal-body" style="text-align:center;padding:48px 36px">
      <div style="font-size:3.5rem;margin-bottom:16px">🎉</div>
      <h2 style="margin-bottom:12px">Booking Confirmed!</h2>
      <p style="color:var(--text-light);margin-bottom:24px">Thank you, <strong>${name}</strong>! Your booking for <strong>${date} at ${time}</strong> has been received.<br><br>We'll confirm within 2 hours at <strong>${phone}</strong>.</p>
      <button class="btn btn-primary" onclick="closeModal();App.navigate('home')">Back to Home</button>
    </div>`);
}

/* ============================================================
   CONTACT PAGE
   ============================================================ */
function renderContact() {
  const s = DB.getSettings();
  return `
  <div>
    <div style="background:var(--primary);padding:56px 0;text-align:center">
      <div class="container">
        <div class="section-label" style="color:var(--accent)">Get In Touch</div>
        <h1 class="section-title" style="color:var(--white);margin:8px 0">Contact Us</h1>
        <p class="section-subtitle" style="margin:0 auto">Have a question or ready to start your property journey? We're here to help.</p>
      </div>
    </div>
    <div class="container" style="padding:60px 24px 80px">
      <div class="contact-grid">
        <!-- Info -->
        <div>
          <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:28px">Get in Touch</h2>
          <div class="contact-info-item"><div class="contact-info-icon">📍</div><div><div class="contact-info-label">Office</div><div class="contact-info-value">${s.address}</div></div></div>
          <div class="contact-info-item"><div class="contact-info-icon">📞</div><div><div class="contact-info-label">Phone</div><div class="contact-info-value">${s.phone}</div></div></div>
          <div class="contact-info-item"><div class="contact-info-icon">✉️</div><div><div class="contact-info-label">Email</div><div class="contact-info-value">${s.email}</div></div></div>
          <div class="contact-info-item"><div class="contact-info-icon">🕐</div><div><div class="contact-info-label">Working Hours</div><div class="contact-info-value">${s.hours.replace('|','<br>')}</div></div></div>
          <div class="divider"></div>
          <h3 style="font-weight:700;margin-bottom:14px">Quick Links</h3>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${[['Browse Properties','properties'],['Book a Viewing','booking'],['Due Diligence','due-diligence'],['Land Transfer','transfers']].map(([l,p]) => `<span style="display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--accent);font-weight:600;font-size:.9rem" onclick="App.navigate('${p}')">→ ${l}</span>`).join('')}
          </div>
        </div>

        <!-- Form -->
        <div>
          <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:36px;box-shadow:var(--shadow-lg)">
            <h3 style="font-weight:800;margin-bottom:24px">Send a Message</h3>
            <div class="form-group"><label>Full Name *</label><input class="form-control" id="ct-name" placeholder="Your full name"></div>
            <div class="form-row">
              <div class="form-group"><label>Phone *</label><input class="form-control" id="ct-phone" placeholder="+254 7XX XXX XXX"></div>
              <div class="form-group"><label>Email</label><input class="form-control" id="ct-email" type="email" placeholder="your@email.com"></div>
            </div>
            <div class="form-group">
              <label>Subject</label>
              <select class="form-control" id="ct-subject">
                <option>General Inquiry</option><option>Property Inquiry</option>
                <option>Due Diligence</option><option>Land Transfer</option>
                <option>Subdivision</option><option>Developer Partnership</option>
              </select>
            </div>
            <div class="form-group"><label>Message *</label><textarea class="form-control" id="ct-message" rows="5" placeholder="Tell us how we can help you..."></textarea></div>
            <button class="btn btn-primary btn-block" onclick="submitContact()">Send Message →</button>
          </div>
        </div>
      </div>

      <!-- Map -->
      <div style="margin-top:48px">
        <h3 style="font-weight:800;margin-bottom:16px;font-size:1.2rem">📍 Find Us</h3>
        <div style="border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--border);box-shadow:var(--shadow)">
          <iframe
            src="${s.mapEmbedUrl}"
            width="100%" height="380" frameborder="0"
            style="display:block" loading="lazy"
            title="Kakilin Properties Location">
          </iframe>
        </div>
        <p style="font-size:.82rem;color:var(--text-muted);margin-top:8px;text-align:center">${s.address}</p>
      </div>
    </div>
  </div>
  ${renderFooter()}`;
}

function submitContact() {
  const name = document.getElementById('ct-name')?.value.trim();
  const phone = document.getElementById('ct-phone')?.value.trim();
  const msg = document.getElementById('ct-message')?.value.trim();
  if (!name || !phone || !msg) { showToast('Please fill in all required fields.', 'error'); return; }
  showToast('Message sent! We\'ll respond within 24 hours. ✅');
  ['ct-name','ct-phone','ct-email','ct-message'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

/* ============================================================
   DEVELOPER PORTAL
   ============================================================ */
function renderDeveloperPortal() {
  return `
  <div>
    <div style="background:var(--primary);padding:56px 0;text-align:center">
      <div class="container">
        <div class="section-label" style="color:var(--accent)">For Developers</div>
        <h1 class="section-title" style="color:var(--white);margin:8px 0">Developer Partner Portal</h1>
        <p class="section-subtitle" style="margin:0 auto">List your properties, track sales performance, and grow your business through Kakilin.</p>
      </div>
    </div>
    <div class="container" style="padding:60px 24px 80px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px" class="contact-grid">
        <div>
          <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:16px">Why Partner With Kakilin?</h2>
          <p style="color:var(--text-light);margin-bottom:24px;line-height:1.7">We handle the marketing, lead generation, and transaction management — you focus on building. Access our verified buyer network and track every sale through the admin dashboard.</p>
          ${[['📢','Marketing & Exposure','Your properties listed on our platform, promoted to qualified buyers across Kenya.'],
             ['🎯','Qualified Leads','We pre-qualify every inquiry before passing it to you. No time wasted on tyre-kickers.'],
             ['📊','Sales Dashboard','Real-time view of your property listings, inquiries, viewings, and conversion rates.'],
             ['⚖️','Legal Support','Our legal team handles due diligence and transfers, giving buyers confidence to buy faster.']
          ].map(([icon,title,desc]) => `
            <div style="display:flex;gap:16px;margin-bottom:24px">
              <div style="width:44px;height:44px;min-width:44px;background:var(--accent-light);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;font-size:1.3rem">${icon}</div>
              <div><div style="font-weight:700;margin-bottom:4px">${title}</div><p style="font-size:.86rem;color:var(--text-light)">${desc}</p></div>
            </div>`).join('')}
        </div>
        <div>
          <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:32px;box-shadow:var(--shadow-lg)">
            <h3 style="font-weight:800;margin-bottom:20px">Register as a Developer Partner</h3>
            <div class="form-group"><label>Company / Developer Name *</label><input class="form-control" id="dev-company" placeholder="e.g. Greenpark Developments Ltd"></div>
            <div class="form-group"><label>Contact Person *</label><input class="form-control" id="dev-contact" placeholder="Full name"></div>
            <div class="form-row">
              <div class="form-group"><label>Phone *</label><input class="form-control" id="dev-phone" placeholder="+254 7XX XXX XXX"></div>
              <div class="form-group"><label>Email *</label><input class="form-control" id="dev-email" type="email" placeholder="you@company.co.ke"></div>
            </div>
            <div class="form-group"><label>Number of Properties to List</label><input class="form-control" id="dev-units" type="number" placeholder="e.g. 25"></div>
            <div class="form-group"><label>Property Types</label>
              <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px">
                ${['Land','Houses','Plots','Commercial'].map(t => `<label style="display:flex;align-items:center;gap:6px;font-weight:400;cursor:pointer"><input type="checkbox" value="${t}" class="dev-type"> ${t}</label>`).join('')}
              </div>
            </div>
            <div class="form-group"><label>Brief Description of Projects</label><textarea class="form-control" id="dev-desc" rows="3" placeholder="Tell us about your developments..."></textarea></div>
            <button class="btn btn-primary btn-block" onclick="submitDeveloper()">Submit Application →</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  ${renderFooter()}`;
}

async function submitDeveloper() {
  const company = document.getElementById('dev-company')?.value.trim();
  const contact = document.getElementById('dev-contact')?.value.trim();
  const phone   = document.getElementById('dev-phone')?.value.trim();
  const email   = document.getElementById('dev-email')?.value.trim();
  if (!company || !contact || !phone || !email) { showToast('Please fill in all required fields.', 'error'); return; }
  await DB.insert('developers', { name: company, contact, phone, email, properties: [], totalUnits: Number(document.getElementById('dev-units')?.value) || 0, unitsSold: 0, joined: today(), status: 'Pending' });
  showToast('Application submitted! Our team will review and contact you within 48 hours.');
  ['dev-company','dev-contact','dev-phone','dev-email','dev-units','dev-desc'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

/* ============================================================
   ADMIN DASHBOARD
   ============================================================ */
function renderAdmin() {
  if (!App.adminUser) return renderAdminLogin();

  const props    = DB.get('properties');
  const leads    = DB.get('leads');
  const bookings = DB.get('bookings');
  const services = DB.get('services');
  const devs     = DB.get('developers');

  const newLeads   = leads.filter(l => l.status === 'New Lead').length;
  const pendingBkg = bookings.filter(b => b.status === 'Pending').length;
  const section    = App.adminSection || 'overview';
  const role       = App.adminUser.role;
  const isSuperAdmin  = role === 'superadmin';
  const canSales      = ['superadmin','sales'].includes(role);
  const canProperties = ['superadmin','properties'].includes(role);

  // Build sidebar items based on role
  const sidebarItems = [
    ['overview','📊','Overview','', true],
    ['analytics','📈','Analytics','', isSuperAdmin],
    ['properties','🏗️','Properties','', canProperties],
    ['vehicles','🚗','Vehicles','', canProperties],
    ['vehicleOwners','🤝','Vehicle Owners','', canProperties],
    ['leads','🧑‍💼','Leads & Clients', newLeads > 0 ? newLeads : '', canSales],
    ['bookings','📅','Bookings', pendingBkg > 0 ? pendingBkg : '', canSales],
    ['services','🔍','Service Requests','', canSales],
    ['developers','🏢','Developers','', isSuperAdmin],
    ['users','👥','User Management','', isSuperAdmin],
    ['customization','🎨','Customization','', isSuperAdmin],
  ].filter(item => item[4]);

  return `
  <div class="admin-layout">
    <!-- Sidebar -->
    <div class="admin-sidebar">
      <div class="admin-sidebar-brand">
        <div style="font-size:.65rem;color:rgba(255,255,255,.4);margin-bottom:4px;text-transform:uppercase;letter-spacing:.8px">${role === 'superadmin' ? '⭐ Super Admin' : role === 'sales' ? '💼 Sales' : '🏗️ Properties'}</div>
        <div style="font-weight:700;color:var(--white);font-size:.88rem">${App.adminUser.name}</div>
      </div>
      ${sidebarItems.map(([id,icon,label,badge]) => `
        <div class="admin-nav-item ${section===id?'active':''}" onclick="switchAdminSection('${id}')">
          <span class="nav-icon">${icon}</span> <span>${label}</span>
          ${badge ? `<span class="nav-badge">${badge}</span>` : ''}
        </div>`).join('')}
      <div style="flex:1"></div>
      <div class="admin-nav-item" onclick="App.navigate('home')"><span class="nav-icon">🌐</span> <span>View Site</span></div>
      <div class="admin-nav-item" onclick="adminLogout()"><span class="nav-icon">🚪</span> <span>Logout</span></div>
    </div>

    <!-- Main content -->
    <div class="admin-main" id="admin-main">
      ${renderAdminSection(section, props, leads, bookings, services, devs)}
    </div>
  </div>`;
}

function renderAdminSection(section, props, leads, bookings, services, devs) {
  switch(section) {
    case 'overview':       return renderAdminOverview(props, leads, bookings, services);
    case 'analytics':      return renderAdminAnalytics(props, leads, bookings, services);
    case 'properties':     return renderAdminProperties(props, devs);
    case 'vehicles':       return renderAdminVehicles(DB.get('vehicles'), DB.get('vehicleOwners'));
    case 'vehicleOwners':  return renderAdminVehicleOwners(DB.get('vehicleOwners'), DB.get('vehicles'));
    case 'leads':          return renderAdminLeads(leads, props);
    case 'bookings':       return renderAdminBookings(bookings, props);
    case 'services':       return renderAdminServices(services);
    case 'developers':     return renderAdminDevelopers(devs, props);
    case 'users':          return renderAdminUsers(DB.get('users'));
    case 'customization':  return renderAdminCustomization();
    default:               return '';
  }
}

function switchAdminSection(section) {
  App.adminSection = section;
  const props    = DB.get('properties');
  const leads    = DB.get('leads');
  const bookings = DB.get('bookings');
  const services = DB.get('services');
  const devs     = DB.get('developers');
  document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
  // Mark active by finding the item whose onclick matches
  document.querySelectorAll(`.admin-nav-item`).forEach(el => {
    if (el.getAttribute('onclick') === `switchAdminSection('${section}')`) el.classList.add('active');
  });
  document.getElementById('admin-main').innerHTML = renderAdminSection(section, props, leads, bookings, services, devs);
  attachEventListeners();
}

/* ─ Overview ─ */
function renderAdminOverview(props, leads, bookings, services) {
  const available  = props.filter(p => p.status === 'Available').length;
  const sold       = props.filter(p => p.status === 'Sold').length;
  const totalValue = props.filter(p => p.status === 'Available').reduce((s,p) => s+p.price, 0);
  const newLeads   = leads.filter(l => l.status === 'New Lead').length;
  const vehicles   = DB.get('vehicles');
  const availVehs  = vehicles.filter(v => v.status === 'Available').length;
  const soldVehs   = vehicles.filter(v => v.status === 'Sold').length;

  return `
  <div>
    <div class="admin-page-header">
      <div><h1>Dashboard Overview</h1><p style="color:var(--text-muted);font-size:.88rem">${new Date().toLocaleDateString('en-KE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" onclick="switchAdminSection('vehicles')">+ Add Vehicle</button>
        <button class="btn btn-primary btn-sm" onclick="openAddPropertyModal()">+ Add Property</button>
      </div>
    </div>
    <div class="stat-cards">
      <div class="stat-card"><div class="stat-card-icon">🏗️</div><div class="stat-card-value">${props.length}</div><div class="stat-card-label">Total Properties</div></div>
      <div class="stat-card"><div class="stat-card-icon">✅</div><div class="stat-card-value">${available}</div><div class="stat-card-label">Properties Available</div></div>
      <div class="stat-card"><div class="stat-card-icon">🚗</div><div class="stat-card-value">${vehicles.length}</div><div class="stat-card-label">Total Vehicles</div></div>
      <div class="stat-card"><div class="stat-card-icon">🔑</div><div class="stat-card-value">${availVehs}</div><div class="stat-card-label">Vehicles Available</div></div>
      <div class="stat-card"><div class="stat-card-icon">🤝</div><div class="stat-card-value">${sold + soldVehs}</div><div class="stat-card-label">Total Deals Closed</div></div>
      <div class="stat-card"><div class="stat-card-icon">💰</div><div class="stat-card-value">${fmtShort(totalValue)}</div><div class="stat-card-label">Property Portfolio (KSh)</div></div>
      <div class="stat-card"><div class="stat-card-icon">🧑‍💼</div><div class="stat-card-value">${leads.length}</div><div class="stat-card-label">Total Leads</div></div>
      <div class="stat-card"><div class="stat-card-icon">🔔</div><div class="stat-card-value">${newLeads}</div><div class="stat-card-label">New Leads</div></div>
      <div class="stat-card"><div class="stat-card-icon">📅</div><div class="stat-card-value">${bookings.filter(b=>b.status==='Pending').length}</div><div class="stat-card-label">Pending Bookings</div></div>
      <div class="stat-card"><div class="stat-card-icon">📋</div><div class="stat-card-value">${services.filter(s=>s.status!=='Completed').length}</div><div class="stat-card-label">Active Requests</div></div>
    </div>

    <!-- Recent leads -->
    <div class="data-table-wrap" style="margin-bottom:24px">
      <div class="data-table-header">
        <h3>Recent Leads</h3>
        <button class="btn btn-outline btn-sm" onclick="switchAdminSection('leads')">View All</button>
      </div>
      <div class="table-overflow">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Interest</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            ${leads.slice(-5).reverse().map(l => `
              <tr>
                <td><strong>${l.name}</strong></td>
                <td>${l.phone}</td>
                <td style="color:var(--text-light)">${l.interest}</td>
                <td>${statusBadge(l.status)}</td>
                <td style="color:var(--text-muted)">${new Date(l.date).toLocaleDateString()}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent bookings -->
    <div class="data-table-wrap">
      <div class="data-table-header">
        <h3>Upcoming Bookings</h3>
        <button class="btn btn-outline btn-sm" onclick="switchAdminSection('bookings')">View All</button>
      </div>
      <div class="table-overflow">
        <table class="data-table">
          <thead><tr><th>Client</th><th>Type</th><th>Date & Time</th><th>Status</th></tr></thead>
          <tbody>
            ${bookings.slice(-5).reverse().map(b => `
              <tr>
                <td><strong>${b.clientName}</strong><br><span style="font-size:.8rem;color:var(--text-muted)">${b.clientPhone}</span></td>
                <td>${b.type}</td>
                <td>${b.date} at ${b.time}</td>
                <td>${statusBadge(b.status)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

/* ─ Properties ─ */
function renderAdminProperties(props, devs) {
  return `
  <div>
    <div class="admin-page-header">
      <h1>Properties (${props.length})</h1>
      <button class="btn btn-primary" onclick="openAddPropertyModal()">+ Add Property</button>
    </div>
    <div class="data-table-wrap">
      <div class="table-overflow">
        <table class="data-table">
          <thead><tr><th>Title</th><th>Type</th><th>Location</th><th>Price (KSh)</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${props.map(p => `
              <tr>
                <td><strong>${p.title}</strong><br><span style="font-size:.78rem;color:var(--text-muted)">${p.size}</span></td>
                <td><span class="badge badge-gray">${p.type}</span></td>
                <td>${p.location}, ${p.county}</td>
                <td style="font-weight:700">${fmt(p.price)}</td>
                <td>${statusBadge(p.status)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="App.navigate('property',{id:'${p.id}'})">View</button>
                    <button class="btn btn-outline btn-sm" onclick="openEditPropertyModal('${p.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProperty('${p.id}')">Del</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

/* ─ Vehicles ─ */
function renderAdminVehicles(vehicles, owners) {
  const condColor = {Excellent:'badge-green',Good:'badge-blue',Fair:'badge-yellow'};
  return `
  <div>
    <div class="admin-page-header">
      <h1>Vehicles (${vehicles.length})</h1>
      <button class="btn btn-primary" onclick="openAddVehicleModal()">+ Add Vehicle</button>
    </div>
    <div class="data-table-wrap">
      <div class="table-overflow">
        <table class="data-table">
          <thead><tr><th>Vehicle</th><th>Type</th><th>Condition</th><th>Mileage</th><th>Price (KSh)</th><th>Owner</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${vehicles.map(v => {
              const owner = owners.find(o => o.id === v.ownerId);
              return `
              <tr>
                <td>
                  <strong>${v.year} ${v.make} ${v.model}</strong>
                  <br><span style="font-size:.78rem;color:var(--text-muted)">${v.fuel} · ${v.transmission} · ${v.engineCC}cc</span>
                </td>
                <td><span class="badge badge-gray">${vehicleTypeIcon(v.type)} ${v.type}</span></td>
                <td><span class="badge ${condColor[v.condition]||'badge-gray'}">${v.condition}</span></td>
                <td style="font-size:.88rem">${fmtMileage(v.mileage)}</td>
                <td style="font-weight:700">${fmt(v.price)}</td>
                <td style="font-size:.84rem">${owner ? owner.name : '—'}</td>
                <td>${statusBadge(v.status)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="App.navigate('vehicle',{id:'${v.id}'})">View</button>
                    <button class="btn btn-outline btn-sm" onclick="openEditVehicleModal('${v.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteVehicle('${v.id}')">Del</button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function openAddVehicleModal() {
  const owners = DB.get('vehicleOwners');
  openModal(`
    <div class="modal-header"><h2>Add Vehicle</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body" style="max-height:70vh;overflow-y:auto">
      <div class="form-row">
        <div class="form-group"><label>Make *</label><input class="form-control" id="av-make" placeholder="Toyota, Honda, Mercedes..."></div>
        <div class="form-group"><label>Model *</label><input class="form-control" id="av-model" placeholder="Land Cruiser, Fit, C200..."></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Year *</label><input class="form-control" id="av-year" type="number" placeholder="2020" min="2000" max="${new Date().getFullYear()}"></div>
        <div class="form-group"><label>Colour</label><input class="form-control" id="av-color" placeholder="White, Black, Silver..."></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Type *</label>
          <select class="form-control" id="av-type">
            ${['SUV','Sedan','Pickup','Hatchback','Van','Bus','Truck','Motorbike','Coupe'].map(t=>`<option>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Condition *</label>
          <select class="form-control" id="av-condition">
            <option>Excellent</option><option>Good</option><option>Fair</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Fuel *</label>
          <select class="form-control" id="av-fuel">
            <option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option>
          </select>
        </div>
        <div class="form-group"><label>Transmission *</label>
          <select class="form-control" id="av-trans">
            <option>Automatic</option><option>Manual</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Mileage (km) *</label><input class="form-control" id="av-mileage" type="number" placeholder="45000" min="0"></div>
        <div class="form-group"><label>Engine (cc)</label><input class="form-control" id="av-engine" type="number" placeholder="2000" min="50"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Price (KSh) *</label><input class="form-control" id="av-price" type="number" placeholder="2500000" min="0"></div>
        <div class="form-group"><label>Status</label>
          <select class="form-control" id="av-status">
            <option>Available</option><option>Reserved</option><option>Sold</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>Owner *</label>
        <select class="form-control" id="av-owner">
          <option value="">— Select owner —</option>
          ${owners.map(o=>`<option value="${o.id}">${o.name} (${o.phone})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Description</label><textarea class="form-control" id="av-desc" rows="3" placeholder="Describe the vehicle condition, history, extras..."></textarea></div>
      <div class="form-group">
        <label>Features (comma-separated)</label>
        <input class="form-control" id="av-features" placeholder="Sunroof, Leather Seats, Reverse Camera...">
      </div>
      <div class="form-group">
        <label>Image URLs (one per line)</label>
        <textarea class="form-control" id="av-images" rows="3" placeholder="https://example.com/car1.jpg&#10;https://example.com/car2.jpg"></textarea>
        <small style="color:var(--text-muted)">Paste image URLs — first image is the main cover photo</small>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewVehicle()">Add Vehicle</button>
    </div>`);
}

async function saveNewVehicle() {
  const make  = document.getElementById('av-make')?.value.trim();
  const model = document.getElementById('av-model')?.value.trim();
  const year  = Number(document.getElementById('av-year')?.value);
  const price = Number(document.getElementById('av-price')?.value);
  const mileage = Number(document.getElementById('av-mileage')?.value);
  const ownerId = document.getElementById('av-owner')?.value || '';
  if (!make || !model || !year || !price || !ownerId) { showToast('Please fill in all required fields.', 'error'); return; }
  const rawImgs = document.getElementById('av-images')?.value || '';
  const images = rawImgs.split('\n').map(s=>s.trim()).filter(Boolean);
  const rawFeatures = document.getElementById('av-features')?.value || '';
  const features = rawFeatures.split(',').map(s=>s.trim()).filter(Boolean);
  await DB.insert('vehicles', {
    make, model, year,
    type:         document.getElementById('av-type')?.value || 'SUV',
    condition:    document.getElementById('av-condition')?.value || 'Good',
    mileage:      mileage || 0,
    fuel:         document.getElementById('av-fuel')?.value || 'Petrol',
    transmission: document.getElementById('av-trans')?.value || 'Automatic',
    engineCC:     Number(document.getElementById('av-engine')?.value) || 0,
    color:        document.getElementById('av-color')?.value.trim() || '',
    price, status: document.getElementById('av-status')?.value || 'Available',
    ownerId, description: document.getElementById('av-desc')?.value.trim() || '',
    features, images, listedDate: today(), views: 0, inquiries: 0
  });
  closeModal();
  showToast('Vehicle added successfully! ✅');
  switchAdminSection('vehicles');
}

function openEditVehicleModal(id) {
  const v = DB.getById('vehicles', id);
  if (!v) return;
  const owners = DB.get('vehicleOwners');
  openModal(`
    <div class="modal-header"><h2>Edit Vehicle</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body" style="max-height:70vh;overflow-y:auto">
      <div class="form-row">
        <div class="form-group"><label>Make *</label><input class="form-control" id="ev-make" value="${v.make}"></div>
        <div class="form-group"><label>Model *</label><input class="form-control" id="ev-model" value="${v.model}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Year *</label><input class="form-control" id="ev-year" type="number" value="${v.year}"></div>
        <div class="form-group"><label>Colour</label><input class="form-control" id="ev-color" value="${v.color}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Type</label>
          <select class="form-control" id="ev-type">
            ${['SUV','Sedan','Pickup','Hatchback','Van','Bus','Truck','Motorbike','Coupe'].map(t=>`<option ${v.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Condition</label>
          <select class="form-control" id="ev-condition">
            ${['Excellent','Good','Fair'].map(c=>`<option ${v.condition===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Fuel</label>
          <select class="form-control" id="ev-fuel">
            ${['Petrol','Diesel','Hybrid','Electric'].map(f=>`<option ${v.fuel===f?'selected':''}>${f}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Transmission</label>
          <select class="form-control" id="ev-trans">
            <option ${v.transmission==='Automatic'?'selected':''}>Automatic</option>
            <option ${v.transmission==='Manual'?'selected':''}>Manual</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Mileage (km)</label><input class="form-control" id="ev-mileage" type="number" value="${v.mileage}"></div>
        <div class="form-group"><label>Engine (cc)</label><input class="form-control" id="ev-engine" type="number" value="${v.engineCC}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Price (KSh)</label><input class="form-control" id="ev-price" type="number" value="${v.price}"></div>
        <div class="form-group"><label>Status</label>
          <select class="form-control" id="ev-status">
            ${['Available','Reserved','Sold'].map(s=>`<option ${v.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group"><label>Owner</label>
        <select class="form-control" id="ev-owner">
          ${owners.map(o=>`<option value="${o.id}" ${v.ownerId===o.id?'selected':''}>${o.name} (${o.phone})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Description</label><textarea class="form-control" id="ev-desc" rows="3">${v.description}</textarea></div>
      <div class="form-group"><label>Features (comma-separated)</label><input class="form-control" id="ev-features" value="${v.features.join(', ')}"></div>
      <div class="form-group">
        <label>Image URLs (one per line)</label>
        <textarea class="form-control" id="ev-images" rows="3">${v.images.join('\n')}</textarea>
        <small style="color:var(--text-muted)">First image is the cover photo</small>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditVehicle('${id}')">Save Changes</button>
    </div>`);
}

async function saveEditVehicle(id) {
  const rawImgs     = document.getElementById('ev-images')?.value || '';
  const images      = rawImgs.split('\n').map(s=>s.trim()).filter(Boolean);
  const rawFeatures = document.getElementById('ev-features')?.value || '';
  const features    = rawFeatures.split(',').map(s=>s.trim()).filter(Boolean);
  await DB.update('vehicles', id, {
    make:         document.getElementById('ev-make')?.value.trim(),
    model:        document.getElementById('ev-model')?.value.trim(),
    year:         Number(document.getElementById('ev-year')?.value),
    color:        document.getElementById('ev-color')?.value.trim(),
    type:         document.getElementById('ev-type')?.value,
    condition:    document.getElementById('ev-condition')?.value,
    mileage:      Number(document.getElementById('ev-mileage')?.value) || 0,
    fuel:         document.getElementById('ev-fuel')?.value,
    transmission: document.getElementById('ev-trans')?.value,
    engineCC:     Number(document.getElementById('ev-engine')?.value) || 0,
    price:        Number(document.getElementById('ev-price')?.value),
    status:       document.getElementById('ev-status')?.value,
    ownerId:      document.getElementById('ev-owner')?.value || '',
    description:  document.getElementById('ev-desc')?.value.trim(),
    features, images
  });
  closeModal();
  showToast('Vehicle updated! ✅');
  switchAdminSection('vehicles');
}

async function deleteVehicle(id) {
  if (!confirm('Delete this vehicle listing?')) return;
  await DB.delete('vehicles', id);
  showToast('Vehicle deleted.');
  switchAdminSection('vehicles');
}

/* ─ Vehicle Owners ─ */
function renderAdminVehicleOwners(owners, vehicles) {
  return `
  <div>
    <div class="admin-page-header">
      <h1>Vehicle Owners (${owners.length})</h1>
      <button class="btn btn-primary" onclick="openAddVehicleOwnerModal()">+ Add Owner</button>
    </div>
    <div class="alert alert-info" style="margin-bottom:20px">
      These are private individuals who have brought vehicles for Kakilin to sell on their behalf. Commission is deducted from the sale price upon completion.
    </div>
    <div class="data-table-wrap">
      <div class="table-overflow">
        <table class="data-table">
          <thead><tr><th>Owner</th><th>Phone</th><th>ID Number</th><th>Commission</th><th>Vehicles</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            ${owners.map(o => {
              const ownerVehicles = vehicles.filter(v => v.ownerId === o.id);
              const activeCars    = ownerVehicles.filter(v => v.status !== 'Sold').length;
              const soldCars      = ownerVehicles.filter(v => v.status === 'Sold').length;
              return `
              <tr>
                <td>
                  <strong>${o.name}</strong>
                  <br><span style="font-size:.78rem;color:var(--text-muted)">${o.email || '—'}</span>
                  ${o.notes ? `<br><span style="font-size:.75rem;color:var(--text-muted);font-style:italic">${o.notes}</span>` : ''}
                </td>
                <td>${o.phone}</td>
                <td><code style="font-size:.82rem;background:var(--bg);padding:2px 6px;border-radius:4px">${o.idNumber || '—'}</code></td>
                <td><span style="font-weight:700;color:var(--accent)">${o.commission}%</span></td>
                <td>
                  <div style="font-size:.84rem">
                    <span class="badge badge-green">${activeCars} active</span>
                    <span class="badge badge-gray" style="margin-left:4px">${soldCars} sold</span>
                  </div>
                </td>
                <td style="font-size:.84rem;color:var(--text-muted)">${new Date(o.joined).toLocaleDateString()}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="openEditVehicleOwnerModal('${o.id}')">Edit</button>
                    ${ownerVehicles.length === 0 ? `<button class="btn btn-danger btn-sm" onclick="deleteVehicleOwner('${o.id}')">Del</button>` : ''}
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function openAddVehicleOwnerModal() {
  openModal(`
    <div class="modal-header"><h2>Add Vehicle Owner</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label>Full Name *</label><input class="form-control" id="vo-name" placeholder="Owner's full name"></div>
      <div class="form-row">
        <div class="form-group"><label>Phone *</label><input class="form-control" id="vo-phone" placeholder="+254 7XX XXX XXX"></div>
        <div class="form-group"><label>Email</label><input class="form-control" id="vo-email" type="email" placeholder="owner@email.com"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>ID Number</label><input class="form-control" id="vo-id" placeholder="National ID number"></div>
        <div class="form-group"><label>Commission (%)</label><input class="form-control" id="vo-commission" type="number" value="5" min="1" max="20"></div>
      </div>
      <div class="form-group"><label>Notes</label><textarea class="form-control" id="vo-notes" rows="2" placeholder="Any notes about this owner..."></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewVehicleOwner()">Add Owner</button>
    </div>`);
}

async function saveNewVehicleOwner() {
  const name  = document.getElementById('vo-name')?.value.trim();
  const phone = document.getElementById('vo-phone')?.value.trim();
  if (!name || !phone) { showToast('Name and phone are required.', 'error'); return; }
  await DB.insert('vehicleOwners', {
    name, phone,
    email:      document.getElementById('vo-email')?.value.trim() || '',
    idNumber:   document.getElementById('vo-id')?.value.trim()   || '',
    commission: Number(document.getElementById('vo-commission')?.value) || 5,
    joined:     today(),
    notes:      document.getElementById('vo-notes')?.value.trim() || ''
  });
  closeModal();
  showToast('Vehicle owner added! ✅');
  switchAdminSection('vehicleOwners');
}

function openEditVehicleOwnerModal(id) {
  const o = DB.getById('vehicleOwners', id);
  if (!o) return;
  openModal(`
    <div class="modal-header"><h2>Edit Owner</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label>Full Name *</label><input class="form-control" id="evo-name" value="${o.name}"></div>
      <div class="form-row">
        <div class="form-group"><label>Phone *</label><input class="form-control" id="evo-phone" value="${o.phone}"></div>
        <div class="form-group"><label>Email</label><input class="form-control" id="evo-email" value="${o.email||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>ID Number</label><input class="form-control" id="evo-id" value="${o.idNumber||''}"></div>
        <div class="form-group"><label>Commission (%)</label><input class="form-control" id="evo-commission" type="number" value="${o.commission}"></div>
      </div>
      <div class="form-group"><label>Notes</label><textarea class="form-control" id="evo-notes" rows="2">${o.notes||''}</textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditVehicleOwner('${id}')">Save</button>
    </div>`);
}

async function saveEditVehicleOwner(id) {
  const name  = document.getElementById('evo-name')?.value.trim();
  const phone = document.getElementById('evo-phone')?.value.trim();
  if (!name || !phone) { showToast('Name and phone are required.', 'error'); return; }
  await DB.update('vehicleOwners', id, {
    name, phone,
    email:      document.getElementById('evo-email')?.value.trim()      || '',
    idNumber:   document.getElementById('evo-id')?.value.trim()         || '',
    commission: Number(document.getElementById('evo-commission')?.value) || 5,
    notes:      document.getElementById('evo-notes')?.value.trim()      || ''
  });
  closeModal();
  showToast('Owner updated! ✅');
  switchAdminSection('vehicleOwners');
}

async function deleteVehicleOwner(id) {
  if (!confirm('Delete this owner? (Only possible if they have no vehicles.)')) return;
  await DB.delete('vehicleOwners', id);
  showToast('Owner removed.');
  switchAdminSection('vehicleOwners');
}

/* ─ Leads ─ */
function renderAdminLeads(leads, props) {
  return `
  <div>
    <div class="admin-page-header"><h1>Leads & Clients (${leads.length})</h1></div>
    <div class="data-table-wrap">
      <div class="table-overflow">
        <table class="data-table">
          <thead><tr><th>Client</th><th>Phone</th><th>Interest</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${leads.map(l => `
              <tr>
                <td><strong>${l.name}</strong>${l.email?`<br><span style="font-size:.78rem;color:var(--text-muted)">${l.email}</span>`:''}</td>
                <td>${l.phone}</td>
                <td style="max-width:200px">${l.interest}</td>
                <td>${statusBadge(l.status)}</td>
                <td style="white-space:nowrap">${new Date(l.date).toLocaleDateString()}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="openUpdateLeadModal('${l.id}')">Update</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteLead('${l.id}')">Del</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

/* ─ Bookings ─ */
function renderAdminBookings(bookings, props) {
  return `
  <div>
    <div class="admin-page-header"><h1>Bookings (${bookings.length})</h1></div>
    <div class="data-table-wrap">
      <div class="table-overflow">
        <table class="data-table">
          <thead><tr><th>Client</th><th>Type</th><th>Property</th><th>Date & Time</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${bookings.map(b => {
              const prop = b.propertyId ? DB.getById('properties', b.propertyId) : null;
              return `<tr>
                <td><strong>${b.clientName}</strong><br><span style="font-size:.78rem;color:var(--text-muted)">${b.clientPhone}</span></td>
                <td>${b.type}</td>
                <td style="font-size:.85rem">${prop ? prop.title : '—'}</td>
                <td style="white-space:nowrap">${b.date}<br><span style="color:var(--text-muted);font-size:.8rem">${b.time}</span></td>
                <td>${statusBadge(b.status)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="updateBookingStatus('${b.id}','Confirmed')">Confirm</button>
                    <button class="btn btn-outline btn-sm" onclick="updateBookingStatus('${b.id}','Completed')">Done</button>
                    <button class="btn btn-danger btn-sm" onclick="updateBookingStatus('${b.id}','Cancelled')">Cancel</button>
                  </div>
                </td>
              </tr>`;}).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

/* ─ Services ─ */
function renderAdminServices(services) {
  return `
  <div>
    <div class="admin-page-header"><h1>Service Requests (${services.length})</h1></div>
    <div class="data-table-wrap">
      <div class="table-overflow">
        <table class="data-table">
          <thead><tr><th>Client</th><th>Service</th><th>Property Details</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${services.map(s => `
              <tr>
                <td><strong>${s.clientName}</strong><br><span style="font-size:.78rem;color:var(--text-muted)">${s.clientPhone}</span></td>
                <td><span class="badge badge-blue">${s.type}</span><br><span style="font-size:.8rem">${s.service}</span></td>
                <td style="font-size:.84rem;max-width:200px;color:var(--text-light)">${s.propertyDetails}</td>
                <td style="white-space:nowrap">${new Date(s.submittedDate).toLocaleDateString()}</td>
                <td>${statusBadge(s.status)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="updateServiceStatus('${s.id}','In Progress')">Start</button>
                    <button class="btn btn-outline btn-sm" onclick="updateServiceStatus('${s.id}','Completed')">Complete</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteService('${s.id}')">Del</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

/* ─ Developers ─ */
function renderAdminDevelopers(devs, props) {
  return `
  <div>
    <div class="admin-page-header"><h1>Developer Partners (${devs.length})</h1></div>
    <div class="data-table-wrap">
      <div class="table-overflow">
        <table class="data-table">
          <thead><tr><th>Developer</th><th>Contact</th><th>Properties</th><th>Units Sold</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${devs.map(d => `
              <tr>
                <td><strong>${d.name}</strong><br><span style="font-size:.78rem;color:var(--text-muted)">Since ${new Date(d.joined).toLocaleDateString()}</span></td>
                <td>${d.contact}<br><span style="font-size:.78rem;color:var(--text-muted)">${d.phone}</span></td>
                <td>${props.filter(p => p.developerId === d.id).length} listed</td>
                <td>${d.unitsSold} / ${d.totalUnits}</td>
                <td>${statusBadge(d.status)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="activateDeveloper('${d.id}')">Activate</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteDeveloper('${d.id}')">Del</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   ADMIN — MODALS & ACTIONS
   ============================================================ */
function openAddPropertyModal() {
  const devs = DB.get('developers');
  openModal(`
    <div class="modal-header">
      <h2>Add New Property</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group"><label>Title *</label><input class="form-control" id="ap-title" placeholder="e.g. Prime Land — Karen"></div>
      <div class="form-row">
        <div class="form-group"><label>Type *</label>
          <select class="form-control" id="ap-type">
            <option>Land</option><option>House</option><option>Plot</option><option>Commercial</option>
          </select>
        </div>
        <div class="form-group"><label>Status</label>
          <select class="form-control" id="ap-status">
            <option>Available</option><option>Under Offer</option><option>Sold</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Location *</label><input class="form-control" id="ap-location" placeholder="e.g. Karen"></div>
        <div class="form-group"><label>County *</label><input class="form-control" id="ap-county" placeholder="e.g. Nairobi"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Price (KSh) *</label><input class="form-control" id="ap-price" type="number" placeholder="e.g. 15000000"></div>
        <div class="form-group"><label>Size *</label><input class="form-control" id="ap-size" placeholder="e.g. 0.5 Acres"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Bedrooms</label><input class="form-control" id="ap-beds" type="number" placeholder="Leave blank if not applicable"></div>
        <div class="form-group"><label>Bathrooms</label><input class="form-control" id="ap-baths" type="number" placeholder="Leave blank if not applicable"></div>
      </div>
      <div class="form-group"><label>Description *</label><textarea class="form-control" id="ap-desc" rows="3" placeholder="Describe the property..."></textarea></div>
      <div class="form-group"><label>Features (comma separated)</label><input class="form-control" id="ap-features" placeholder="e.g. Tarmac Road, Water, Electricity"></div>
      <div class="form-group"><label>Developer</label>
        <select class="form-control" id="ap-dev">
          <option value="">— No developer —</option>
          ${devs.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Property Images (paste image URLs, one per line)</label>
        <textarea class="form-control" id="ap-images" rows="3" placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"></textarea>
        <div class="form-hint">Paste direct image URLs. You can use Google Drive, Cloudinary, Imgur, or any public image link.</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewProperty()">Save Property</button>
    </div>`);
}

async function saveNewProperty() {
  const title = document.getElementById('ap-title')?.value.trim();
  const location = document.getElementById('ap-location')?.value.trim();
  const county = document.getElementById('ap-county')?.value.trim();
  const price = Number(document.getElementById('ap-price')?.value);
  const size  = document.getElementById('ap-size')?.value.trim();
  const desc  = document.getElementById('ap-desc')?.value.trim();
  if (!title || !location || !county || !price || !size || !desc) { showToast('Please fill in all required fields.', 'error'); return; }
  const features = (document.getElementById('ap-features')?.value || '').split(',').map(f => f.trim()).filter(Boolean);
  const images   = (document.getElementById('ap-images')?.value || '').split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
  await DB.insert('properties', {
    title, type: document.getElementById('ap-type')?.value, location, county, price, size, description: desc,
    status: document.getElementById('ap-status')?.value, features, images,
    bedrooms: Number(document.getElementById('ap-beds')?.value) || null,
    bathrooms: Number(document.getElementById('ap-baths')?.value) || null,
    developerId: Number(document.getElementById('ap-dev')?.value) || null,
    listedDate: today(), views: 0, inquiries: 0
  });
  closeModal();
  showToast('Property added successfully!');
  switchAdminSection('properties');
}

function openEditPropertyModal(id) {
  const p = DB.getById('properties', id);
  if (!p) return;
  openModal(`
    <div class="modal-header">
      <h2>Edit Property</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group"><label>Title</label><input class="form-control" id="ep-title" value="${p.title}"></div>
      <div class="form-row">
        <div class="form-group"><label>Price (KSh)</label><input class="form-control" id="ep-price" type="number" value="${p.price}"></div>
        <div class="form-group"><label>Status</label>
          <select class="form-control" id="ep-status">
            ${['Available','Under Offer','Sold'].map(s => `<option ${p.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Location</label><input class="form-control" id="ep-location" value="${p.location}"></div>
        <div class="form-group"><label>County</label><input class="form-control" id="ep-county" value="${p.county}"></div>
      </div>
      <div class="form-group"><label>Size</label><input class="form-control" id="ep-size" value="${p.size}"></div>
      <div class="form-group"><label>Description</label><textarea class="form-control" id="ep-desc" rows="3">${p.description}</textarea></div>
      <div class="form-group">
        <label>Property Images (one URL per line)</label>
        <textarea class="form-control" id="ep-images" rows="3" placeholder="https://example.com/photo.jpg">${(p.images||[]).join('\n')}</textarea>
        <div class="form-hint">Paste direct image URLs. First image is the cover photo.</div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditProperty('${id}')">Save Changes</button>
    </div>`);
}

async function saveEditProperty(id) {
  const images = (document.getElementById('ep-images')?.value || '').split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
  const updates = {
    title:    document.getElementById('ep-title')?.value.trim(),
    price:    Number(document.getElementById('ep-price')?.value),
    status:   document.getElementById('ep-status')?.value,
    location: document.getElementById('ep-location')?.value.trim(),
    county:   document.getElementById('ep-county')?.value.trim(),
    size:     document.getElementById('ep-size')?.value.trim(),
    description: document.getElementById('ep-desc')?.value.trim(),
    images
  };
  await DB.update('properties', id, updates);
  closeModal();
  showToast('Property updated!');
  switchAdminSection('properties');
}

async function deleteProperty(id) {
  if (!confirm('Delete this property? This cannot be undone.')) return;
  await DB.delete('properties', id);
  showToast('Property deleted.', 'error');
  switchAdminSection('properties');
}

function openUpdateLeadModal(id) {
  const l = DB.getById('leads', id);
  openModal(`
    <div class="modal-header">
      <h2>Update Lead — ${l.name}</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group"><label>Status</label>
        <select class="form-control" id="ul-status">
          ${['New Lead','Contacted','Viewing Scheduled','Closed'].map(s => `<option ${l.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Notes</label><textarea class="form-control" id="ul-notes" rows="3">${l.notes||''}</textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveLeadUpdate('${id}')">Save</button>
    </div>`);
}

async function saveLeadUpdate(id) {
  await DB.update('leads', id, { status: document.getElementById('ul-status')?.value, notes: document.getElementById('ul-notes')?.value });
  closeModal();
  showToast('Lead updated!');
  switchAdminSection('leads');
}

async function deleteLead(id) {
  if (!confirm('Delete this lead?')) return;
  await DB.delete('leads', id);
  showToast('Lead deleted.', 'error');
  switchAdminSection('leads');
}

async function updateBookingStatus(id, status) {
  await DB.update('bookings', id, { status });
  showToast(`Booking marked as ${status}.`);
  switchAdminSection('bookings');
}

async function updateServiceStatus(id, status) {
  const updates = { status };
  if (status === 'Completed') updates.completedDate = today();
  await DB.update('services', id, updates);
  showToast(`Request marked as ${status}.`);
  switchAdminSection('services');
}

async function deleteService(id) {
  if (!confirm('Delete this service request?')) return;
  await DB.delete('services', id);
  showToast('Request deleted.', 'error');
  switchAdminSection('services');
}

function activateDeveloper(id) {
  DB.update('developers', id, { status: 'Active' });
  showToast('Developer activated!');
  switchAdminSection('developers');
}

async function deleteDeveloper(id) {
  if (!confirm('Remove this developer partner?')) return;
  await DB.delete('developers', id);
  showToast('Developer removed.', 'error');
  switchAdminSection('developers');
}

/* ============================================================
   ADMIN LOGIN
   ============================================================ */
function renderAdminLogin() {
  return `
  <div class="admin-login-wrap">
    <div class="admin-login-card">
      <div class="admin-login-logo">
        <div class="icon">🔐</div>
        <h2>Admin Panel</h2>
        <p>Kakilin Properties</p>
      </div>
      <div id="login-error" class="hidden"></div>
      <div class="form-group"><label>Username</label><input class="form-control" id="adm-user" placeholder="admin" value="admin"></div>
      <div class="form-group"><label>Password</label><input class="form-control" id="adm-pass" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')doAdminLogin()"></div>
      <button class="btn btn-primary btn-block" style="margin-top:8px" onclick="doAdminLogin()">Sign In →</button>
      <p style="text-align:center;margin-top:16px;font-size:.8rem;color:var(--text-muted)">Default: admin / kakilin2024</p>
    </div>
  </div>`;
}

function doAdminLogin() {
  const username = document.getElementById('adm-user')?.value.trim();
  const password = document.getElementById('adm-pass')?.value;
  const users = DB.get('users');
  const found = users.find(u => u.username === username && u.password === password && u.active);
  if (found) {
    App.adminUser = { id: found.id, name: found.name, username: found.username, role: found.role };
    App.adminSection = 'overview';
    App.render();
  } else {
    const err = document.getElementById('login-error');
    if (err) { err.className = 'alert alert-error'; err.textContent = 'Invalid credentials. Check your username and password.'; }
  }
}

function adminLogout() {
  const name = App.adminUser?.name || 'Admin';
  App.adminUser = null;
  App.adminSection = 'overview';
  App.navigate('home');
  showToast(`Goodbye, ${name}! Logged out successfully.`);
}

/* ============================================================
   ADMIN — ANALYTICS
   ============================================================ */
function renderAdminAnalytics(props, leads, bookings, services) {
  const available = props.filter(p => p.status === 'Available').length;
  const underOffer = props.filter(p => p.status === 'Under Offer').length;
  const sold      = props.filter(p => p.status === 'Sold').length;
  const totalValue = props.filter(p => p.status !== 'Sold').reduce((s,p) => s+p.price, 0);
  const soldValue  = props.filter(p => p.status === 'Sold').reduce((s,p) => s+p.price, 0);
  const leadsByStatus = { 'New Lead':0, 'Contacted':0, 'Viewing Scheduled':0, 'Closed':0 };
  leads.forEach(l => { if (leadsByStatus[l.status] !== undefined) leadsByStatus[l.status]++; });
  const convRate = leads.length ? Math.round((leadsByStatus['Closed'] / leads.length) * 100) : 0;
  const topProps = [...props].sort((a,b) => b.inquiries - a.inquiries).slice(0,5);
  const byType = {};
  props.forEach(p => { byType[p.type] = (byType[p.type]||0)+1; });

  const bar = (val, max, color='var(--accent)') => {
    const pct = max ? Math.round((val/max)*100) : 0;
    return `<div style="display:flex;align-items:center;gap:10px"><div style="flex:1;background:var(--border);border-radius:100px;height:8px"><div style="width:${pct}%;background:${color};height:8px;border-radius:100px;transition:width .4s"></div></div><span style="font-size:.8rem;font-weight:700;min-width:28px;text-align:right">${val}</span></div>`;
  };

  return `
  <div>
    <div class="admin-page-header"><h1>Analytics & Performance</h1><span style="font-size:.85rem;color:var(--text-muted)">Live data from your listings</span></div>

    <!-- KPI cards -->
    <div class="stat-cards" style="margin-bottom:32px">
      <div class="stat-card"><div class="stat-card-icon">💰</div><div class="stat-card-value">KSh ${fmtShort(totalValue)}</div><div class="stat-card-label">Active Portfolio Value</div></div>
      <div class="stat-card"><div class="stat-card-icon">✅</div><div class="stat-card-value">KSh ${fmtShort(soldValue)}</div><div class="stat-card-label">Total Sales Value</div></div>
      <div class="stat-card"><div class="stat-card-icon">🔄</div><div class="stat-card-value">${convRate}%</div><div class="stat-card-label">Lead Conversion Rate</div></div>
      <div class="stat-card"><div class="stat-card-icon">👁️</div><div class="stat-card-value">${props.reduce((s,p)=>s+p.views,0)}</div><div class="stat-card-label">Total Property Views</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px" class="contact-grid">
      <!-- Property status breakdown -->
      <div class="data-table-wrap" style="padding:24px">
        <h3 style="font-weight:800;margin-bottom:20px">Property Status</h3>
        <div style="display:flex;flex-direction:column;gap:14px">
          ${[['Available',available,'var(--success)'],['Under Offer',underOffer,'var(--warning)'],['Sold',sold,'var(--danger)']].map(([label,val,color]) => `
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:.85rem;font-weight:600">${label}</span><span style="font-size:.85rem;color:var(--text-muted)">${props.length ? Math.round(val/props.length*100) : 0}%</span></div>
              ${bar(val, props.length, color)}
            </div>`).join('')}
        </div>
        <div class="divider"></div>
        <h3 style="font-weight:800;margin-bottom:16px">By Property Type</h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${Object.entries(byType).map(([type,count]) => `
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:.85rem;font-weight:600">${propertyTypeIcon(type)} ${type}</span></div>
              ${bar(count, props.length)}
            </div>`).join('')}
        </div>
      </div>

      <!-- Lead pipeline -->
      <div class="data-table-wrap" style="padding:24px">
        <h3 style="font-weight:800;margin-bottom:20px">Lead Pipeline</h3>
        <div style="display:flex;flex-direction:column;gap:14px">
          ${Object.entries(leadsByStatus).map(([status,count]) => `
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:.85rem;font-weight:600">${status}</span><span style="font-size:.85rem;color:var(--text-muted)">${leads.length ? Math.round(count/leads.length*100) : 0}%</span></div>
              ${bar(count, leads.length, status==='Closed'?'var(--success)':status==='New Lead'?'var(--accent)':'var(--primary)')}
            </div>`).join('')}
        </div>
        <div class="divider"></div>
        <h3 style="font-weight:800;margin-bottom:16px">Bookings</h3>
        ${[['Pending','var(--warning)'],['Confirmed','var(--success)'],['Completed','var(--primary)'],['Cancelled','var(--danger)']].map(([st,col]) => {
          const n = DB.get('bookings').filter(b=>b.status===st).length;
          const tot = DB.get('bookings').length;
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-light)"><span style="font-size:.85rem">${statusBadge(st)}</span><strong>${n} / ${tot}</strong></div>`;
        }).join('')}
      </div>
    </div>

    <!-- Top properties by inquiries -->
    <div class="data-table-wrap">
      <div class="data-table-header"><h3>Top Properties by Interest</h3></div>
      <div class="table-overflow">
        <table class="data-table">
          <thead><tr><th>Property</th><th>Type</th><th>Price</th><th>Views</th><th>Inquiries</th><th>Status</th></tr></thead>
          <tbody>
            ${topProps.map(p => `
              <tr>
                <td><strong>${p.title}</strong><br><span style="font-size:.78rem;color:var(--text-muted)">${p.location}, ${p.county}</span></td>
                <td>${propertyTypeIcon(p.type)} ${p.type}</td>
                <td style="font-weight:700">${fmt(p.price)}</td>
                <td>👁️ ${p.views}</td>
                <td>✉️ ${p.inquiries}</td>
                <td>${statusBadge(p.status)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

async function saveServicePrices() {
  const current = DB.getSettings();
  const priceMap = {
    titleSearch:           'cs-price-title-search',
    ownershipVerification: 'cs-price-ownership',
    landHistoryCheck:      'cs-price-history',
    encumbranceSearch:     'cs-price-encumbrance',
    fullDueDiligence:      'cs-price-full-dd',
    landTransfer:          'cs-price-transfer',
    subdivision:           'cs-price-subdivision',
    propertyManagement:    'cs-price-mgmt',
  };
  const prices = {};
  Object.entries(priceMap).forEach(([key, elId]) => {
    const val = Number(document.getElementById(elId)?.value) || 0;
    prices[key] = val;
  });
  await DB.saveSettings({ ...current, prices });
  showToast('Service prices saved! All service pages updated. ✅');
}

/* ============================================================
   ADMIN — USER MANAGEMENT
   ============================================================ */
function renderAdminUsers(users) {
  const roleLabel = r => ({'superadmin':'⭐ Super Admin','sales':'💼 Sales Manager','properties':'🏗️ Property Manager'}[r] || r);
  return `
  <div>
    <div class="admin-page-header">
      <h1>User Management</h1>
      <button class="btn btn-primary" onclick="openAddUserModal()">+ Add User</button>
    </div>
    <div class="alert alert-info" style="margin-bottom:20px">
      <strong>Role permissions:</strong> Super Admin — full access &amp; site customization | Sales Manager — leads, bookings, service requests | Property Manager — add and manage listings
    </div>
    <div class="data-table-wrap">
      <div class="table-overflow">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.name}</strong><br><span style="font-size:.78rem;color:var(--text-muted)">Since ${new Date(u.joined).toLocaleDateString()}</span></td>
                <td><code style="background:var(--bg);padding:2px 8px;border-radius:4px;font-size:.83rem">${u.username}</code></td>
                <td>${roleLabel(u.role)}</td>
                <td style="font-size:.85rem">${u.email||'—'}</td>
                <td>${u.active ? '<span class="badge badge-green">Active</span>' : '<span class="badge badge-red">Inactive</span>'}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-outline btn-sm" onclick="openEditUserModal('${u.id}')">Edit</button>
                    ${u.role !== 'superadmin' ? `<button class="btn btn-outline btn-sm" onclick="toggleUserActive('${u.id}',${!u.active})">${u.active?'Deactivate':'Activate'}</button>` : ''}
                    ${u.role !== 'superadmin' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">Del</button>` : ''}
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function openAddUserModal() {
  openModal(`
    <div class="modal-header"><h2>Add Admin User</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label>Full Name *</label><input class="form-control" id="nu-name" placeholder="e.g. Jane Njoroge"></div>
      <div class="form-row">
        <div class="form-group"><label>Username *</label><input class="form-control" id="nu-username" placeholder="e.g. jane"></div>
        <div class="form-group"><label>Password *</label><input class="form-control" id="nu-password" type="password" placeholder="Set a strong password"></div>
      </div>
      <div class="form-group"><label>Email</label><input class="form-control" id="nu-email" type="email" placeholder="jane@kakilin.co.ke"></div>
      <div class="form-group"><label>Role *</label>
        <select class="form-control" id="nu-role">
          <option value="sales">💼 Sales Manager — leads, bookings, service requests</option>
          <option value="properties">🏗️ Property Manager — listings management</option>
          <option value="superadmin">⭐ Super Admin — full access</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewUser()">Create User</button>
    </div>`);
}

async function saveNewUser() {
  const name     = document.getElementById('nu-name')?.value.trim();
  const username = document.getElementById('nu-username')?.value.trim();
  const password = document.getElementById('nu-password')?.value;
  const role     = document.getElementById('nu-role')?.value;
  if (!name || !username || !password) { showToast('Please fill in all required fields.', 'error'); return; }
  const exists = DB.get('users').find(u => u.username === username);
  if (exists) { showToast('Username already taken. Choose a different one.', 'error'); return; }
  await DB.insert('users', { name, username, password, role, email: document.getElementById('nu-email')?.value || '', active: true, joined: today() });
  closeModal(); showToast(`User "${name}" created successfully!`);
  switchAdminSection('users');
}

function openEditUserModal(id) {
  const u = DB.getById('users', id);
  if (!u) return;
  openModal(`
    <div class="modal-header"><h2>Edit User — ${u.name}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label>Full Name</label><input class="form-control" id="eu-name" value="${u.name}"></div>
      <div class="form-group"><label>Email</label><input class="form-control" id="eu-email" type="email" value="${u.email||''}"></div>
      <div class="form-group"><label>New Password</label><input class="form-control" id="eu-password" type="password" placeholder="Leave blank to keep current"></div>
      ${u.role !== 'superadmin' ? `<div class="form-group"><label>Role</label>
        <select class="form-control" id="eu-role">
          <option value="sales" ${u.role==='sales'?'selected':''}>💼 Sales Manager</option>
          <option value="properties" ${u.role==='properties'?'selected':''}>🏗️ Property Manager</option>
          <option value="superadmin" ${u.role==='superadmin'?'selected':''}>⭐ Super Admin</option>
        </select></div>` : '<div class="alert alert-info">Super Admin role cannot be changed.</div>'}
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditUser('${id}')">Save Changes</button>
    </div>`);
}

async function saveEditUser(id) {
  const updates = { name: document.getElementById('eu-name')?.value.trim(), email: document.getElementById('eu-email')?.value.trim() };
  const newPass = document.getElementById('eu-password')?.value;
  if (newPass) updates.password = newPass;
  const roleEl = document.getElementById('eu-role');
  if (roleEl) updates.role = roleEl.value;
  await DB.update('users', id, updates);
  closeModal(); showToast('User updated!');
  switchAdminSection('users');
}

async function toggleUserActive(id, active) {
  await DB.update('users', id, { active });
  showToast(active ? 'User activated.' : 'User deactivated.');
  switchAdminSection('users');
}

async function deleteUser(id) {
  if (!confirm('Delete this user? They will lose admin access immediately.')) return;
  await DB.delete('users', id);
  showToast('User deleted.', 'error');
  switchAdminSection('users');
}

/* ============================================================
   ADMIN — WEBSITE CUSTOMIZATION
   ============================================================ */
function renderAdminCustomization() {
  const s = DB.getSettings();
  return `
  <div>
    <div class="admin-page-header"><h1>Website Customization</h1><span style="font-size:.85rem;color:var(--text-muted)">Changes apply instantly site-wide</span></div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px" class="contact-grid">
      <!-- Branding -->
      <div class="data-table-wrap" style="padding:28px">
        <h3 style="font-weight:800;margin-bottom:20px">🎨 Branding</h3>
        <div class="form-group"><label>Site Name</label><input class="form-control" id="cs-name" value="${s.siteName}"></div>
        <div class="form-group"><label>Tagline</label><input class="form-control" id="cs-tagline" value="${s.tagline}"></div>
        <div class="form-group">
          <label>Logo URL</label>
          <input class="form-control" id="cs-logo" value="${s.logoUrl}" placeholder="https://... (leave blank to use default icon)">
          <div class="form-hint">Paste a direct link to your logo image (PNG or SVG, transparent background recommended).</div>
          ${s.logoUrl ? `<div style="margin-top:10px;padding:10px;background:var(--bg);border-radius:var(--radius);border:1px solid var(--border)"><img src="${s.logoUrl}" style="height:40px;object-fit:contain"></div>` : ''}
        </div>
        <div class="form-group">
          <label>Favicon URL</label>
          <input class="form-control" id="cs-favicon" value="${s.faviconUrl}" placeholder="https://... (32×32 or 64×64 icon)">
          <div class="form-hint">URL to a .ico, .png or .svg favicon. Changes the browser tab icon.</div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Primary Color</label>
            <div style="display:flex;gap:8px;align-items:center">
              <input type="color" id="cs-primary" value="${s.primaryColor}" style="width:44px;height:38px;padding:2px;border:1px solid var(--border);border-radius:var(--radius);cursor:pointer">
              <input class="form-control" id="cs-primary-hex" value="${s.primaryColor}" style="flex:1;font-family:monospace" placeholder="#1a2744" oninput="document.getElementById('cs-primary').value=this.value">
            </div>
          </div>
          <div class="form-group">
            <label>Accent Color</label>
            <div style="display:flex;gap:8px;align-items:center">
              <input type="color" id="cs-accent" value="${s.accentColor}" style="width:44px;height:38px;padding:2px;border:1px solid var(--border);border-radius:var(--radius);cursor:pointer">
              <input class="form-control" id="cs-accent-hex" value="${s.accentColor}" style="flex:1;font-family:monospace" placeholder="#c8921a" oninput="document.getElementById('cs-accent').value=this.value">
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-block" onclick="saveCustomization()">💾 Save Branding</button>
      </div>

      <!-- Contact & Content -->
      <div>
        <div class="data-table-wrap" style="padding:28px;margin-bottom:20px">
          <h3 style="font-weight:800;margin-bottom:20px">📞 Contact Information</h3>
          <div class="form-group"><label>Phone Number</label><input class="form-control" id="cs-phone" value="${s.phone}"></div>
          <div class="form-group"><label>Email Address</label><input class="form-control" id="cs-email" type="email" value="${s.email}"></div>
          <div class="form-group"><label>Office Address</label><input class="form-control" id="cs-address" value="${s.address}"></div>
          <div class="form-group"><label>Working Hours</label><input class="form-control" id="cs-hours" value="${s.hours}" placeholder="Mon–Fri: 8am–6pm | Saturday: 9am–1pm"></div>
          <button class="btn btn-primary btn-block" onclick="saveCustomization()">💾 Save Contact Info</button>
        </div>

        <div class="data-table-wrap" style="padding:28px;margin-bottom:20px">
          <h3 style="font-weight:800;margin-bottom:20px">🗺️ Map Embed</h3>
          <div class="form-group">
            <label>Map Embed URL</label>
            <input class="form-control" id="cs-map" value="${s.mapEmbedUrl}" placeholder="OpenStreetMap or Google Maps embed URL">
            <div class="form-hint">From Google Maps: Share → Embed a map → copy the <code>src="..."</code> URL. Or use the default OpenStreetMap link.</div>
          </div>
          <button class="btn btn-primary btn-block" onclick="saveCustomization()">💾 Save Map</button>
        </div>

        <div class="data-table-wrap" style="padding:28px;margin-bottom:20px">
          <h3 style="font-weight:800;margin-bottom:20px">🌐 Hero Content</h3>
          <div class="form-group"><label>Hero Title</label><input class="form-control" id="cs-hero-title" value="${s.heroTitle}"></div>
          <div class="form-group"><label>Hero Subtitle</label><textarea class="form-control" id="cs-hero-sub" rows="3">${s.heroSubtitle}</textarea></div>
          <button class="btn btn-primary btn-block" onclick="saveCustomization()">💾 Save Hero Content</button>
        </div>
      </div>
    </div>

    <!-- Service Pricing -->
    <div class="data-table-wrap" style="padding:28px;margin-top:24px">
      <h3 style="font-weight:800;margin-bottom:6px">💰 Service Pricing</h3>
      <p style="font-size:.85rem;color:var(--text-muted);margin-bottom:20px">These prices display on the Services, Due Diligence, and Transfers pages. Set to 0 to show "Custom Pricing".</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">
        ${[
          ['cs-price-title-search',       'titleSearch',           '🔍 Title Search',              'KSh'],
          ['cs-price-ownership',          'ownershipVerification', '👤 Ownership Verification',    'KSh'],
          ['cs-price-history',            'landHistoryCheck',      '📜 Land History Check',        'KSh'],
          ['cs-price-encumbrance',        'encumbranceSearch',     '⚖️ Encumbrance Search',        'KSh'],
          ['cs-price-full-dd',            'fullDueDiligence',      '📦 Full Due Diligence Package', 'KSh'],
          ['cs-price-transfer',           'landTransfer',          '📑 Land Transfer',             'KSh'],
          ['cs-price-subdivision',        'subdivision',           '📐 Land Subdivision',          'KSh'],
          ['cs-price-mgmt',               'propertyManagement',    '🏗️ Property Management',       'KSh'],
        ].map(([elId, key, label]) => `
          <div class="form-group" style="margin:0">
            <label style="font-size:.82rem">${label}</label>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:.85rem;font-weight:600;color:var(--text-muted)">KSh</span>
              <input class="form-control" id="${elId}" type="number" value="${(s.prices||{})[key]||0}" placeholder="0 = Custom Pricing" min="0" step="500">
            </div>
          </div>`).join('')}
      </div>
      <div style="margin-top:20px">
        <button class="btn btn-primary" onclick="saveServicePrices()">💾 Save All Prices</button>
      </div>
    </div>
  </div>`;
}

async function saveCustomization() {
  const primary = document.getElementById('cs-primary-hex')?.value || document.getElementById('cs-primary')?.value || DB.getSettings().primaryColor;
  const accent  = document.getElementById('cs-accent-hex')?.value  || document.getElementById('cs-accent')?.value  || DB.getSettings().accentColor;
  const updates = {
    siteName:     document.getElementById('cs-name')?.value.trim()       || DB.getSettings().siteName,
    tagline:      document.getElementById('cs-tagline')?.value.trim()    || DB.getSettings().tagline,
    logoUrl:      document.getElementById('cs-logo')?.value.trim()       ?? DB.getSettings().logoUrl,
    faviconUrl:   document.getElementById('cs-favicon')?.value.trim()    ?? DB.getSettings().faviconUrl,
    phone:        document.getElementById('cs-phone')?.value.trim()      || DB.getSettings().phone,
    email:        document.getElementById('cs-email')?.value.trim()      || DB.getSettings().email,
    address:      document.getElementById('cs-address')?.value.trim()    || DB.getSettings().address,
    hours:        document.getElementById('cs-hours')?.value.trim()      || DB.getSettings().hours,
    mapEmbedUrl:  document.getElementById('cs-map')?.value.trim()        || DB.getSettings().mapEmbedUrl,
    heroTitle:    document.getElementById('cs-hero-title')?.value.trim() || DB.getSettings().heroTitle,
    heroSubtitle: document.getElementById('cs-hero-sub')?.value.trim()   || DB.getSettings().heroSubtitle,
    primaryColor: primary,
    accentColor:  accent
  };
  await DB.saveSettings(updates);
  applySettings();
  // Refresh navbar to pick up new logo/sitename
  document.getElementById('navbar-placeholder').innerHTML = renderNavbar();
  document.querySelectorAll('.nav-link[data-page]').forEach(el => el.addEventListener('click', () => App.navigate(el.dataset.page)));
  showToast('Settings saved and applied! ✅');
}

/* ============================================================
   VEHICLE CARD
   ============================================================ */
function renderVehicleCard(v) {
  const firstImg = v.images && v.images.length > 0 ? v.images[0] : null;
  const condColor = {Excellent:'badge-green',Good:'badge-blue',Fair:'badge-yellow'}[v.condition] || 'badge-gray';
  return `
  <div class="property-card" onclick="App.navigate('vehicle', {id:'${v.id}'})" style="cursor:pointer">
    <div class="property-card-img ${firstImg ? '' : vehicleTypeClass(v.type)}" style="${firstImg ? `background:url('${firstImg}') center/cover no-repeat` : 'background:linear-gradient(135deg,var(--primary) 0%,#2d4a8a 100%)'}">
      ${!firstImg ? `<div class="property-card-icon">${vehicleTypeIcon(v.type)}</div>` : ''}
      <div class="property-card-badges">
        ${statusBadge(v.status)}
        <span class="badge ${condColor}">${v.condition}</span>
      </div>
      ${firstImg && v.images.length > 1 ? `<div class="property-card-fav" style="background:rgba(0,0,0,.5);color:#fff;font-size:.75rem;width:auto;padding:3px 8px;border-radius:100px">📷 ${v.images.length}</div>` : ''}
    </div>
    <div class="property-card-body">
      <div class="property-card-type">${v.type}</div>
      <div class="property-card-title">${v.year} ${v.make} ${v.model}</div>
      <div class="property-card-loc">🎨 ${v.color} &nbsp;·&nbsp; ⛽ ${v.fuel} &nbsp;·&nbsp; ⚙️ ${v.transmission}</div>
      <div class="property-card-meta">
        <div class="property-card-meta-item">🔢 ${fmtMileage(v.mileage)}</div>
        <div class="property-card-meta-item">🔧 ${v.engineCC}cc</div>
      </div>
      <div class="property-card-footer">
        <div class="property-card-price">${fmt(v.price)}<span> asking</span></div>
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openVehicleInquiryModal('${v.id}')">Enquire</button>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   VEHICLES LISTING PAGE
   ============================================================ */
function renderVehicles() {
  const all = DB.get('vehicles');
  const fType   = App.params.type      || '';
  const fMake   = App.params.make      || '';
  const fFuel   = App.params.fuel      || '';
  const fTrans  = App.params.trans     || '';
  const fMax    = App.params.maxPrice  ? Number(App.params.maxPrice) : null;
  const fStatus = App.params.status    || '';
  const fSearch = App.params.q         || '';
  const fCond   = App.params.condition || '';

  const allMakes = [...new Set(all.map(v => v.make))].sort();
  const allTypes = ['SUV','Sedan','Pickup','Hatchback','Van','Bus','Truck','Motorbike','Coupe'];

  let filtered = all.filter(v => {
    if (fType   && v.type   !== fType)   return false;
    if (fMake   && v.make   !== fMake)   return false;
    if (fFuel   && v.fuel   !== fFuel)   return false;
    if (fTrans  && v.transmission !== fTrans) return false;
    if (fMax    && v.price  > fMax)      return false;
    if (fStatus && v.status !== fStatus) return false;
    if (fCond   && v.condition !== fCond) return false;
    if (fSearch && !(`${v.make} ${v.model} ${v.year} ${v.color} ${v.type}`).toLowerCase().includes(fSearch.toLowerCase())) return false;
    return true;
  });

  return `
  <div>
    <div style="background:var(--primary);padding:56px 0 40px;text-align:center">
      <div class="container">
        <div class="section-label" style="color:var(--accent)">Cars & Vehicles</div>
        <h1 class="section-title" style="color:var(--white);margin:8px 0">Browse Vehicles for Sale</h1>
        <p class="section-subtitle" style="margin:0 auto">${all.length} vehicles listed — sold on behalf of verified private owners. All vehicles are inspected before listing.</p>
      </div>
    </div>

    <div class="container" style="padding:40px 24px 80px">
      <!-- Search -->
      <div style="margin-bottom:16px">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <input class="form-control" id="veh-search" placeholder="🔍 Search make, model, year, colour..." value="${fSearch}" style="max-width:380px;flex:1">
          <button class="btn btn-primary" onclick="applyVehicleFilters()">Search</button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="form-group">
          <label>Type</label>
          <select class="form-control" id="vf-type">
            <option value="">All Types</option>
            ${allTypes.map(t => `<option value="${t}" ${fType===t?'selected':''}>${vehicleTypeIcon(t)} ${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Make</label>
          <select class="form-control" id="vf-make">
            <option value="">All Makes</option>
            ${allMakes.map(m => `<option value="${m}" ${fMake===m?'selected':''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Fuel</label>
          <select class="form-control" id="vf-fuel">
            <option value="">Any Fuel</option>
            ${['Petrol','Diesel','Hybrid','Electric'].map(f => `<option value="${f}" ${fFuel===f?'selected':''}>${f}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Transmission</label>
          <select class="form-control" id="vf-trans">
            <option value="">Any</option>
            <option value="Automatic" ${fTrans==='Automatic'?'selected':''}>Automatic</option>
            <option value="Manual" ${fTrans==='Manual'?'selected':''}>Manual</option>
          </select>
        </div>
        <div class="form-group">
          <label>Condition</label>
          <select class="form-control" id="vf-cond">
            <option value="">Any</option>
            ${['Excellent','Good','Fair'].map(c => `<option value="${c}" ${fCond===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="form-control" id="vf-status">
            <option value="">All</option>
            <option value="Available" ${fStatus==='Available'?'selected':''}>Available</option>
            <option value="Reserved" ${fStatus==='Reserved'?'selected':''}>Reserved</option>
            <option value="Sold" ${fStatus==='Sold'?'selected':''}>Sold</option>
          </select>
        </div>
        <div class="form-group">
          <label>Max Price (KSh)</label>
          <select class="form-control" id="vf-price">
            <option value="">Any Price</option>
            <option value="500000"   ${fMax===500000  ?'selected':''}>Up to 500K</option>
            <option value="1000000"  ${fMax===1000000 ?'selected':''}>Up to 1M</option>
            <option value="2000000"  ${fMax===2000000 ?'selected':''}>Up to 2M</option>
            <option value="3500000"  ${fMax===3500000 ?'selected':''}>Up to 3.5M</option>
            <option value="5000000"  ${fMax===5000000 ?'selected':''}>Up to 5M</option>
            <option value="8000000"  ${fMax===8000000 ?'selected':''}>Up to 8M</option>
            <option value="15000000" ${fMax===15000000?'selected':''}>Up to 15M</option>
          </select>
        </div>
        <div style="display:flex;gap:8px;align-items:flex-end">
          <button class="btn btn-primary" onclick="applyVehicleFilters()">Apply</button>
          <button class="btn btn-outline" onclick="App.navigate('vehicles')">Clear</button>
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:8px">
        <p style="color:var(--text-light);font-size:.88rem">Showing <strong>${filtered.length}</strong> of ${all.length} vehicles</p>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state">
          <div class="icon">🚗</div>
          <h3>No Vehicles Found</h3>
          <p>Try adjusting your filters or <span style="color:var(--accent);cursor:pointer" onclick="App.navigate('vehicles')">clear all filters</span>.</p>
        </div>` : `
        <div class="properties-grid">${filtered.map(v => renderVehicleCard(v)).join('')}</div>`}

      <!-- Consignment CTA -->
      <div style="margin-top:64px;background:var(--primary);border-radius:var(--radius-lg);padding:40px;text-align:center;color:var(--white)">
        <div style="font-size:2rem;margin-bottom:12px">🤝</div>
        <h3 style="font-size:1.4rem;font-weight:800;margin-bottom:10px">Selling Your Car?</h3>
        <p style="color:rgba(255,255,255,.75);margin-bottom:24px;max-width:480px;margin-left:auto;margin-right:auto">We sell on your behalf — full inspection, professional listing, and verified buyers. Commission from 4%.</p>
        <button class="btn btn-primary" onclick="App.navigate('contact')">📞 List Your Vehicle</button>
      </div>
    </div>
  </div>
  ${renderFooter()}`;
}

function applyVehicleFilters() {
  App.navigate('vehicles', {
    type:      document.getElementById('vf-type')?.value    || '',
    make:      document.getElementById('vf-make')?.value    || '',
    fuel:      document.getElementById('vf-fuel')?.value    || '',
    trans:     document.getElementById('vf-trans')?.value   || '',
    condition: document.getElementById('vf-cond')?.value    || '',
    status:    document.getElementById('vf-status')?.value  || '',
    maxPrice:  document.getElementById('vf-price')?.value   || '',
    q:         document.getElementById('veh-search')?.value || '',
  });
}

/* ============================================================
   VEHICLE DETAIL PAGE
   ============================================================ */
function renderVehicleDetail(id) {
  const v = DB.getById('vehicles', id);
  if (!v) return `<div class="container" style="padding:80px 0"><div class="empty-state"><div class="icon">🚗</div><h3>Vehicle Not Found</h3><p><span style="color:var(--accent);cursor:pointer" onclick="App.navigate('vehicles')">Back to listings</span></p></div></div>`;

  const owner = DB.getById('vehicleOwners', v.ownerId);
  const hasImgs = v.images && v.images.length > 0;
  const condColor = {Excellent:'badge-green',Good:'badge-blue',Fair:'badge-yellow'}[v.condition] || 'badge-gray';

  return `
  <div>
    ${hasImgs ? `
    <div class="prop-gallery">
      <div class="prop-gallery-main" id="gallery-main" style="background:url('${v.images[0]}') center/cover no-repeat;cursor:zoom-in" onclick="openLightbox(${JSON.stringify(v.images)},_galleryActiveIdx||0)">
        <div class="hero-badges" style="position:absolute;top:16px;left:16px;opacity:1">${statusBadge(v.status)}<span class="badge ${condColor}" style="margin-left:6px">${v.condition}</span></div>
        ${v.images.length > 1 ? `<div class="gallery-counter" style="cursor:zoom-in">📷 ${v.images.length} photos · Click to expand</div>` : '<div class="gallery-counter" style="cursor:zoom-in">🔍 Click to expand</div>'}
      </div>
      ${v.images.length > 1 ? `<div class="prop-gallery-thumbs">${v.images.slice(0,5).map((img,i) => `<div class="gallery-thumb ${i===0?'active':''}" style="background:url('${img}') center/cover;cursor:zoom-in" onclick="setGalleryMain('${img}',this);_galleryActiveIdx=${i}"></div>`).join('')}</div>` : ''}
    </div>` : `
    <div class="property-detail-hero" style="background:linear-gradient(135deg,var(--primary) 0%,#2d4a8a 100%)">
      <span style="font-size:4rem">${vehicleTypeIcon(v.type)}</span>
      <div class="hero-badges">${statusBadge(v.status)}<span class="badge ${condColor}" style="margin-left:6px">${v.condition}</span></div>
    </div>`}

    <div class="container">
      <div class="property-detail-body">
        <!-- Left: Details -->
        <div>
          <div class="page-breadcrumb" style="margin-top:16px">
            <span onclick="App.navigate('home')">Home</span>
            <span class="sep">›</span>
            <span onclick="App.navigate('vehicles')">Vehicles</span>
            <span class="sep">›</span>
            <span style="color:var(--text)">${v.year} ${v.make} ${v.model}</span>
          </div>
          <h1 style="font-size:1.8rem;font-weight:800;margin-bottom:8px;line-height:1.25">${v.year} ${v.make} ${v.model}</h1>
          <p style="color:var(--text-light);margin-bottom:20px;display:flex;align-items:center;gap:6px">🎨 ${v.color} &nbsp;·&nbsp; ${v.type}</p>

          <div class="property-spec-grid">
            <div class="property-spec-item"><div class="property-spec-icon">📅</div><div><div class="property-spec-label">Year</div><div class="property-spec-value">${v.year}</div></div></div>
            <div class="property-spec-item"><div class="property-spec-icon">🔢</div><div><div class="property-spec-label">Mileage</div><div class="property-spec-value">${fmtMileage(v.mileage)}</div></div></div>
            <div class="property-spec-item"><div class="property-spec-icon">⛽</div><div><div class="property-spec-label">Fuel Type</div><div class="property-spec-value">${v.fuel}</div></div></div>
            <div class="property-spec-item"><div class="property-spec-icon">⚙️</div><div><div class="property-spec-label">Transmission</div><div class="property-spec-value">${v.transmission}</div></div></div>
            <div class="property-spec-item"><div class="property-spec-icon">🔧</div><div><div class="property-spec-label">Engine</div><div class="property-spec-value">${v.engineCC}cc</div></div></div>
            <div class="property-spec-item"><div class="property-spec-icon">⭐</div><div><div class="property-spec-label">Condition</div><div class="property-spec-value">${v.condition}</div></div></div>
            <div class="property-spec-item"><div class="property-spec-icon">🎨</div><div><div class="property-spec-label">Colour</div><div class="property-spec-value">${v.color}</div></div></div>
            <div class="property-spec-item"><div class="property-spec-icon">👁️</div><div><div class="property-spec-label">Views</div><div class="property-spec-value">${v.views}</div></div></div>
          </div>

          <div class="divider"></div>
          <h3 style="font-weight:700;margin-bottom:12px">About This Vehicle</h3>
          <p style="color:var(--text-light);line-height:1.75;font-size:.95rem">${v.description}</p>

          <div class="divider"></div>
          <h3 style="font-weight:700;margin-bottom:14px">Features & Extras</h3>
          <div class="property-features">
            ${v.features.map(f => `<span class="property-feature-tag">✓ ${f}</span>`).join('')}
          </div>

          <!-- Consignment info -->
          <div class="divider"></div>
          <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <span style="font-size:1.3rem">🤝</span>
              <strong>Consignment Sale</strong>
            </div>
            <p style="font-size:.86rem;color:var(--text-light);line-height:1.6">This vehicle is listed on behalf of a verified private owner. Kakilin Properties handles the entire transaction — inspection, paperwork, and transfer — ensuring a safe, transparent deal for both buyer and seller.</p>
          </div>
        </div>

        <!-- Right: Price & Action card -->
        <div>
          <div class="inquiry-card">
            <div class="inquiry-card-price">${fmt(v.price)}</div>
            <div class="inquiry-card-per">Asking price</div>

            ${v.status === 'Sold' ? `
              <div class="alert alert-error">This vehicle has been sold. <span style="cursor:pointer;text-decoration:underline" onclick="App.navigate('vehicles')">Browse more vehicles.</span></div>
            ` : v.status === 'Reserved' ? `
              <div class="alert alert-warning" style="background:#fff8e1;border-color:#f9a825;color:#7a5800">This vehicle is currently reserved. Contact us to join the waiting list.</div>
              <button class="btn btn-outline btn-block" onclick="openVehicleInquiryModal('${v.id}')" style="margin-top:10px">✉️ Join Waiting List</button>
            ` : `
              <button class="btn btn-primary btn-block" style="margin-bottom:10px" onclick="openVehicleInquiryModal('${v.id}')">✉️ Make an Enquiry</button>
              <button class="btn btn-outline btn-block" onclick="App.navigate('booking')">📅 Book an Inspection</button>
              <div class="divider"></div>
              <div style="background:var(--bg);border-radius:var(--radius);padding:14px;font-size:.84rem;color:var(--text-light)">
                <p style="margin-bottom:8px">📞 <strong>Call us:</strong> +254 700 000 000</p>
                <p>🕐 Available Mon–Fri, 8am–6pm</p>
              </div>
            `}

            <div class="divider"></div>
            <div style="font-size:.8rem;color:var(--text-muted)">
              <p style="margin-bottom:6px">📋 Listed: ${new Date(v.listedDate).toLocaleDateString('en-KE',{month:'long',day:'numeric',year:'numeric'})}</p>
              <p>🔍 ${v.inquiries} enquiries on this vehicle</p>
            </div>
          </div>

          <!-- Inspection note -->
          <div style="background:var(--accent-light);border:1px solid rgba(200,146,26,.25);border-radius:var(--radius-lg);padding:20px;margin-top:20px">
            <div style="font-size:1.2rem;margin-bottom:8px">🔍</div>
            <div style="font-weight:700;margin-bottom:6px;font-size:.95rem">Pre-Purchase Inspection</div>
            <p style="font-size:.83rem;color:var(--text-light);margin-bottom:14px">We recommend an independent mechanical inspection before purchase. We'll arrange access for your preferred mechanic.</p>
            <button class="btn btn-primary btn-sm btn-block" onclick="App.navigate('contact')">Arrange Inspection</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  ${renderFooter()}`;
}

function openVehicleInquiryModal(vehicleId) {
  const v = DB.getById('vehicles', vehicleId);
  openModal(`
    <div class="modal-header">
      <h2>Vehicle Enquiry</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="alert alert-info" style="margin-bottom:20px">Enquiring about: <strong>${v ? `${v.year} ${v.make} ${v.model}` : 'Vehicle'}</strong></div>
      <div class="form-group"><label>Full Name *</label><input class="form-control" id="vinq-name" placeholder="Your full name"></div>
      <div class="form-row">
        <div class="form-group"><label>Phone *</label><input class="form-control" id="vinq-phone" placeholder="+254 7XX XXX XXX"></div>
        <div class="form-group"><label>Email</label><input class="form-control" id="vinq-email" type="email" placeholder="your@email.com"></div>
      </div>
      <div class="form-group"><label>Message</label><textarea class="form-control" id="vinq-msg" rows="3" placeholder="Any specific questions about this vehicle?"></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitVehicleInquiry(${vehicleId})">Send Enquiry</button>
    </div>`);
}

async function submitVehicleInquiry(vehicleId) {
  const name  = document.getElementById('vinq-name')?.value.trim();
  const phone = document.getElementById('vinq-phone')?.value.trim();
  if (!name || !phone) { showToast('Please fill in your name and phone number.', 'error'); return; }
  const v = DB.getById('vehicles', vehicleId);
  await DB.insert('leads', { name, phone, email: document.getElementById('vinq-email')?.value || '', interest: v ? `${v.year} ${v.make} ${v.model}` : 'Vehicle Enquiry', propertyId: null, vehicleId, status: 'New Lead', date: today(), notes: document.getElementById('vinq-msg')?.value || '' });
  // increment inquiries
  await DB.update('vehicles', vehicleId, { inquiries: (v?.inquiries || 0) + 1 });
  closeModal();
  showToast('Enquiry sent! We\'ll be in touch within 24 hours. ✅');
}

/* ============================================================
   404
   ============================================================ */
function render404() {
  return `
  <div class="container" style="padding:120px 24px;text-align:center">
    <div style="font-size:5rem;margin-bottom:16px">🏚️</div>
    <h1 style="font-size:2.5rem;font-weight:800;margin-bottom:12px">Page Not Found</h1>
    <p style="color:var(--text-light);margin-bottom:28px">This page doesn't exist or has been moved.</p>
    <button class="btn btn-primary" onclick="App.navigate('home')">Back to Home</button>
  </div>
  ${renderFooter()}`;
}

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
function attachEventListeners() {
  // Nav links (delegated)
  document.querySelectorAll('.nav-link[data-page]').forEach(el => {
    el.addEventListener('click', () => App.navigate(el.dataset.page));
  });
  // Footer links
  document.querySelectorAll('.footer-links a[onclick]').forEach(el => {});
}

/* ============================================================
   INIT
   ============================================================ */
/* ── Apply site settings (logo, favicon, colors, meta) ── */
function applySettings() {
  const s = DB.getSettings();
  // Favicon
  if (s.faviconUrl) {
    let link = document.querySelector("link[rel='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = s.faviconUrl;
  }
  // Page title
  document.title = s.siteName + ' — ' + s.tagline;
  // CSS custom properties for theming
  document.documentElement.style.setProperty('--primary', s.primaryColor);
  document.documentElement.style.setProperty('--primary-hover', adjustColor(s.primaryColor, 20));
  document.documentElement.style.setProperty('--accent', s.accentColor);
  document.documentElement.style.setProperty('--accent-hover', adjustColor(s.accentColor, -20));
  document.documentElement.style.setProperty('--accent-light', hexToRgba(s.accentColor, 0.12));
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function hexToRgba(hex, alpha) {
  const num = parseInt(hex.replace('#',''), 16);
  return `rgba(${num>>16},${(num>>8)&0xff},${num&0xff},${alpha})`;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Show loading spinner while fetching data from MongoDB
  document.getElementById('page-content').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:18px">
      <div style="font-size:3rem">🏘️</div>
      <p style="color:var(--text-light);font-size:1rem">Loading Kakilin Properties…</p>
    </div>`;

  try {
    await DB.init();
  } catch (e) {
    console.error('Failed to load data from API:', e);
  }

  // Apply settings (colors, favicon, title)
  applySettings();

  // Inject navbar
  document.getElementById('navbar-placeholder').innerHTML = renderNavbar();

  // Re-attach nav links after render
  document.querySelectorAll('.nav-link[data-page]').forEach(el => {
    el.addEventListener('click', () => App.navigate(el.dataset.page));
  });

  // Initial route
  const { page, params } = parseHash();
  App.page = page; App.params = params;
  App.render();
});
