require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const path      = require('path');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3002;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

/* ================================================================
   EMAIL HELPER (Nodemailer — Gmail SMTP)
   Set MAIL_USER and MAIL_PASS in .env / Render env vars
   ================================================================ */
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
});

async function sendMail({ to, subject, html }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return; // skip silently if not configured
  try {
    await mailer.sendMail({
      from: `"Kakilin Properties" <${process.env.MAIL_USER}>`,
      to, subject, html
    });
    console.log(`📧 Email sent → ${to}`);
  } catch (e) {
    console.error('📧 Email failed:', e.message);
  }
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.MAIL_USER || '';

function emailTable(rows) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(([k,v])=>`<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:40%;border:1px solid #ddd">${k}</td><td style="padding:8px 12px;border:1px solid #ddd">${v||'—'}</td></tr>`).join('')}</table>`;
}

function emailWrapper(title, body) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff">
    <div style="background:#1a2744;padding:24px 32px;text-align:center">
      <h2 style="color:#fff;margin:0;font-size:20px">🏘️ Kakilin Properties</h2>
      <p style="color:#c8921a;margin:4px 0 0;font-size:13px">Your Trust, Our Priority</p>
    </div>
    <div style="padding:28px 32px">
      <h3 style="color:#1a2744;margin-top:0">${title}</h3>
      ${body}
    </div>
    <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:12px;color:#888">
      Kakilin Properties · Westlands, Nairobi · info@kakilin.co.ke
    </div>
  </div>`;
}

/* ================================================================
   MONGOOSE SCHEMAS & MODELS
   ================================================================ */

const jOpts = {
  toJSON: {
    virtuals: true,
    transform: (_, ret) => { delete ret.__v; return ret; }
  }
};

const PropertySchema = new mongoose.Schema({
  title: String, type: String, location: String, county: String,
  price: Number, size: String, bedrooms: Number, bathrooms: Number,
  status: { type: String, default: 'Available' }, developerId: String,
  description: String, features: [String], images: [String],
  listedDate: String,
  views:     { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 }
}, jOpts);

const VehicleSchema = new mongoose.Schema({
  make: String, model: String, year: Number, type: String,
  condition: String, mileage: Number, fuel: String, transmission: String,
  engineCC: Number, color: String, price: Number,
  status: { type: String, default: 'Available' }, ownerId: String,
  description: String, features: [String], images: [String],
  listedDate: String,
  views:     { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 }
}, jOpts);

const VehicleOwnerSchema = new mongoose.Schema({
  name: String, phone: String, email: String, idNumber: String,
  commission: { type: Number, default: 5 },
  joined: String, notes: String
}, jOpts);

const DeveloperSchema = new mongoose.Schema({
  name: String, contact: String, phone: String, email: String,
  properties: [String], totalUnits: Number, unitsSold: Number,
  joined: String, status: String
}, jOpts);

const LeadSchema = new mongoose.Schema({
  name: String, phone: String, email: String, interest: String,
  propertyId: String, vehicleId: String,
  status: { type: String, default: 'New Lead' },
  date: String, notes: String
}, jOpts);

const BookingSchema = new mongoose.Schema({
  type: String, clientName: String, clientPhone: String, clientEmail: String,
  propertyId: String, vehicleId: String,
  date: String, time: String,
  status: { type: String, default: 'Pending' },
  notes: String
}, jOpts);

const ServiceSchema = new mongoose.Schema({
  type: String, service: String, clientName: String, clientPhone: String,
  propertyDetails: String,
  status: { type: String, default: 'Pending' },
  submittedDate: String, completedDate: String
}, jOpts);

const UserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, sparse: true },
  password: String, role: String, email: String,
  active: { type: Boolean, default: true },
  joined: String
}, jOpts);

const SettingsSchema = new mongoose.Schema({
  siteName: String, tagline: String, heroTitle: String, heroSubtitle: String,
  phone: String, email: String, address: String, hours: String,
  logoUrl: String, faviconUrl: String, mapEmbedUrl: String,
  primaryColor: String, accentColor: String,
  socialFacebook: String, socialTwitter: String,
  socialInstagram: String, socialLinkedin: String,
  prices: {
    titleSearch: Number, ownershipVerification: Number,
    landHistoryCheck: Number, encumbranceSearch: Number,
    fullDueDiligence: Number, landTransfer: Number,
    subdivision: Number, propertyManagement: Number
  }
}, jOpts);

const Property     = mongoose.model('Property',     PropertySchema);
const Vehicle      = mongoose.model('Vehicle',      VehicleSchema);
const VehicleOwner = mongoose.model('VehicleOwner', VehicleOwnerSchema);
const Developer    = mongoose.model('Developer',    DeveloperSchema);
const Lead         = mongoose.model('Lead',         LeadSchema);
const Booking      = mongoose.model('Booking',      BookingSchema);
const Service      = mongoose.model('Service',      ServiceSchema);
const User         = mongoose.model('User',         UserSchema);
const Settings     = mongoose.model('Settings',     SettingsSchema);

/* ================================================================
   GENERIC CRUD ROUTER
   ================================================================ */
function crudRouter(Model) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try { res.json(await Model.find().sort({ _id: -1 })); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/:id', async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id);
      doc ? res.json(doc) : res.status(404).json({ error: 'Not found' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.post('/', async (req, res) => {
    try { res.status(201).json(await Model.create(req.body)); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });

  router.put('/:id', async (req, res) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      doc ? res.json(doc) : res.status(404).json({ error: 'Not found' });
    } catch (e) { res.status(400).json({ error: e.message }); }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await Model.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return router;
}

/* ================================================================
   API ROUTES
   ================================================================ */
app.use('/api/properties',    crudRouter(Property));
app.use('/api/vehicles',      crudRouter(Vehicle));
app.use('/api/vehicleOwners', crudRouter(VehicleOwner));
app.use('/api/developers',    crudRouter(Developer));
app.use('/api/users',         crudRouter(User));

/* ── Leads — with email notification on new lead ── */
app.use('/api/leads', (() => {
  const router = crudRouter(Lead);
  // Override POST to send email
  router.post('/', async (req, res) => {
    try {
      const lead = await Lead.create(req.body);
      res.status(201).json(lead);
      // Notify admin
      if (ADMIN_EMAIL) {
        sendMail({
          to: ADMIN_EMAIL,
          subject: `🔔 New Enquiry — ${lead.name}`,
          html: emailWrapper('New Client Enquiry', `
            <p>A new enquiry has been submitted on Kakilin Properties.</p>
            ${emailTable([
              ['Name', lead.name],
              ['Phone', lead.phone],
              ['Email', lead.email],
              ['Interest', lead.interest],
              ['Date', new Date(lead.date).toLocaleDateString('en-KE')],
            ])}
            <p style="margin-top:20px;color:#888;font-size:13px">Log in to your admin panel to follow up.</p>`)
        });
      }
      // Auto-reply to client if they left email
      if (lead.email) {
        sendMail({
          to: lead.email,
          subject: `Thank you for your enquiry — Kakilin Properties`,
          html: emailWrapper('We Received Your Enquiry!', `
            <p>Dear <strong>${lead.name}</strong>,</p>
            <p>Thank you for reaching out to Kakilin Properties. We've received your enquiry about <strong>${lead.interest || 'our listings'}</strong> and our team will get back to you within <strong>24 hours</strong>.</p>
            <p>In the meantime, feel free to browse more listings on our website or call us directly.</p>
            <p style="margin-top:24px">Warm regards,<br><strong>Kakilin Properties Team</strong></p>`)
        });
      }
    } catch (e) { res.status(400).json({ error: e.message }); }
  });
  return router;
})());

/* ── Bookings — with email notification on new booking ── */
app.use('/api/bookings', (() => {
  const router = crudRouter(Booking);
  router.post('/', async (req, res) => {
    try {
      const booking = await Booking.create(req.body);
      res.status(201).json(booking);
      // Notify admin
      if (ADMIN_EMAIL) {
        sendMail({
          to: ADMIN_EMAIL,
          subject: `📅 New Booking — ${booking.clientName}`,
          html: emailWrapper('New Booking Request', `
            <p>A new booking has been submitted.</p>
            ${emailTable([
              ['Client', booking.clientName],
              ['Phone', booking.clientPhone],
              ['Email', booking.clientEmail],
              ['Type', booking.type],
              ['Date', booking.date],
              ['Time', booking.time],
              ['Notes', booking.notes],
            ])}`)
        });
      }
      // Confirm to client
      if (booking.clientEmail) {
        sendMail({
          to: booking.clientEmail,
          subject: `Booking Confirmed — Kakilin Properties`,
          html: emailWrapper('Your Booking is Received!', `
            <p>Dear <strong>${booking.clientName}</strong>,</p>
            <p>Your <strong>${booking.type}</strong> has been scheduled for <strong>${booking.date} at ${booking.time}</strong>.</p>
            <p>Our team will confirm this appointment and send you any location details shortly. If you need to reschedule, please call us.</p>
            <p style="margin-top:24px">Warm regards,<br><strong>Kakilin Properties Team</strong></p>`)
        });
      }
    } catch (e) { res.status(400).json({ error: e.message }); }
  });
  return router;
})());

/* ── Services — with email notification on new request ── */
app.use('/api/services', (() => {
  const router = crudRouter(Service);
  router.post('/', async (req, res) => {
    try {
      const svc = await Service.create(req.body);
      res.status(201).json(svc);
      // Notify admin
      if (ADMIN_EMAIL) {
        sendMail({
          to: ADMIN_EMAIL,
          subject: `🔍 New Service Request — ${svc.service}`,
          html: emailWrapper('New Service Request', `
            <p>A new ${svc.type} request has been submitted.</p>
            ${emailTable([
              ['Service', svc.service],
              ['Client', svc.clientName],
              ['Phone', svc.clientPhone],
              ['Property Details', svc.propertyDetails],
              ['Submitted', new Date(svc.submittedDate).toLocaleDateString('en-KE')],
            ])}`)
        });
      }
    } catch (e) { res.status(400).json({ error: e.message }); }
  });
  return router;
})());

/* ── Settings (singleton document) ── */
app.get('/api/settings', async (req, res) => {
  try {
    let s = await Settings.findOne();
    if (!s) s = await Settings.create(DEFAULT_SETTINGS_OBJ);
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/settings', async (req, res) => {
  try {
    const s = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(s);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

/* ── Auth ── */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password, active: true });
    user ? res.json(user) : res.status(401).json({ error: 'Invalid username or password' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── Health check ── */
app.get('/api/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

/* ── SPA fallback ── */
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ================================================================
   DEFAULT SETTINGS
   ================================================================ */
const DEFAULT_SETTINGS_OBJ = {
  siteName: 'Kakilin Properties', tagline: 'Your Trust, Our Priority',
  heroTitle: 'Find Your Perfect Property in Kenya',
  heroSubtitle: 'From premium land and plots to family homes — we connect buyers with verified properties and handle every step with full legal due diligence.',
  phone: '+254 700 000 000', email: 'info@kakilin.co.ke',
  address: 'Westlands Commercial Centre, Nairobi, Kenya',
  hours: 'Mon–Fri: 8:00am – 6:00pm | Saturday: 9:00am – 1:00pm',
  logoUrl: '', faviconUrl: '',
  mapEmbedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=36.7806%2C-1.2756%2C36.8206%2C-1.2456&layer=mapnik&marker=-1.2600%2C36.8006',
  primaryColor: '#1a2744', accentColor: '#c8921a',
  socialFacebook: '', socialTwitter: '', socialInstagram: '', socialLinkedin: '',
  prices: {
    titleSearch: 5000, ownershipVerification: 4000, landHistoryCheck: 8000,
    encumbranceSearch: 5000, fullDueDiligence: 18000,
    landTransfer: 15000, subdivision: 30000, propertyManagement: 0
  }
};

/* ================================================================
   AUTO-SEED (first startup only — skips if collections are populated)
   ================================================================ */
async function seedIfEmpty() {
  if (!(await Settings.countDocuments()))
    await Settings.create(DEFAULT_SETTINGS_OBJ);

  if (!(await User.countDocuments())) {
    await User.insertMany([
      { name: 'Super Admin',      username: 'admin',    password: 'kakilin2024', role: 'superadmin', email: 'admin@kakilin.co.ke',    active: true, joined: '2025-01-01' },
      { name: 'Sales Manager',    username: 'sales',    password: 'sales2024',   role: 'sales',       email: 'sales@kakilin.co.ke',    active: true, joined: '2025-01-15' },
      { name: 'Property Manager', username: 'listings', password: 'listings24',  role: 'properties',  email: 'listings@kakilin.co.ke', active: true, joined: '2025-02-01' }
    ]);
    console.log('  ✔ Users seeded');
  }

  // Seed developers first, then use their real MongoDB IDs for properties
  if (!(await Developer.countDocuments())) {
    const devs = await Developer.insertMany([
      { name: 'Greenpark Developments', contact: 'James Mwangi', phone: '+254 712 345 678', email: 'james@greenpark.co.ke', totalUnits: 45,  unitsSold: 32, joined: '2023-06-01', status: 'Active' },
      { name: 'Savanna Estates Ltd',    contact: 'Grace Otieno',  phone: '+254 722 456 789', email: 'grace@savanna.co.ke',   totalUnits: 120, unitsSold: 78, joined: '2023-09-15', status: 'Active' },
      { name: 'Urban Prime Realty',     contact: 'Peter Kamau',   phone: '+254 733 567 890', email: 'peter@urbanprime.co.ke',totalUnits: 30,  unitsSold: 25, joined: '2024-01-20', status: 'Active' }
    ]);
    const [d1, d2, d3] = devs.map(d => d._id.toString());
    console.log('  ✔ Developers seeded');

    if (!(await Property.countDocuments())) {
      await Property.insertMany([
        { title: 'Prime Residential Land — Karen',  type: 'Land',       location: 'Karen',      county: 'Nairobi',  price: 18500000, size: '0.5 Acres',  status: 'Available',   developerId: d1, description: "A premium half-acre plot in the heart of Karen. Flat, fenced, tarmac road frontage. Title deed available.", features: ['Tarmac Road Access','Water Available','Electricity Connected','Corner Plot','Clear Title','Surveyed'], images: [], listedDate: '2025-01-10', views: 312, inquiries: 14 },
        { title: '5-Bedroom Villa — Runda',          type: 'House',      location: 'Runda',      county: 'Nairobi',  price: 45000000, size: '0.75 Acres', bedrooms: 5, bathrooms: 4, status: 'Available', developerId: d1, description: "Stunning contemporary villa in Runda. Open-plan living, chef's kitchen, master suite, swimming pool, landscaped garden. 24/7 security estate.", features: ['Swimming Pool','Guest Wing','Staff Quarters','Double Garage','Borehole','Solar Panels','Smart Home','Garden'], images: [], listedDate: '2025-01-15', views: 541, inquiries: 28 },
        { title: 'Serviced Plots — Kitengela',       type: 'Plot',       location: 'Kitengela',  county: 'Kajiado', price: 1250000,  size: '50×100 ft',  status: 'Available',   developerId: d2, description: 'Ready-to-build serviced plots in fast-growing Kitengela. Tarmac roads, water, electricity, and street lighting installed. Clear title.', features: ['Tarmac Roads','Water & Electricity','Street Lighting','Surveyed','Fenced Perimeter','Community Gate'], images: [], listedDate: '2025-01-20', views: 870, inquiries: 45 },
        { title: '3-Bedroom Townhouse — Kileleshwa', type: 'House',      location: 'Kileleshwa', county: 'Nairobi',  price: 16500000, size: '200 sqm',    bedrooms: 3, bathrooms: 2, status: 'Available', developerId: d1, description: 'Modern townhouse in a quiet close in Kileleshwa. Open-plan ground floor, fitted kitchen, rooftop terrace, private garden.', features: ['Rooftop Terrace','Fitted Kitchen','DSQ','Parking x2','Garden','Generator Backup','CCTV'], images: [], listedDate: '2025-02-01', views: 286, inquiries: 18 },
        { title: 'Agricultural Land — Thika',        type: 'Land',       location: 'Thika',      county: 'Kiambu',   price: 4200000,  size: '2 Acres',    status: 'Available',   developerId: d2, description: 'Fertile 2-acre agricultural land along the Thika–Garissa highway. River frontage, good road access. Title deed ready.', features: ['River Frontage','Fertile Soil','Road Frontage','Electricity Nearby','Good Rainfall'], images: [], listedDate: '2025-02-10', views: 198, inquiries: 9 },
        { title: 'Commercial Plot — Westlands',      type: 'Commercial', location: 'Westlands',  county: 'Nairobi',  price: 95000000, size: '0.3 Acres',  status: 'Under Offer', developerId: d3, description: 'Rare corner commercial plot in Westlands CBD. Mixed-use zoning up to 10 floors. High foot traffic and visibility.', features: ['Corner Plot','Mixed-Use Zoning','High Foot Traffic','Title Ready','Utilities Connected'], images: [], listedDate: '2025-02-15', views: 430, inquiries: 22 },
        { title: 'Gated Community Plots — Rongai',   type: 'Plot',       location: 'Rongai',     county: 'Kajiado', price: 850000,   size: '40×80 ft',   status: 'Available',   developerId: d2, description: 'Affordable plots in a secure gated estate 5 km from Rongai Town. Borehole water, electricity, electrified fence.', features: ['Gated Community','Tarmac Roads','Borehole Water','Electricity','Electrified Fence'], images: [], listedDate: '2025-02-20', views: 654, inquiries: 38 },
        { title: '4-Bedroom Maisonette — Syokimau',  type: 'House',      location: 'Syokimau',   county: 'Machakos', price: 12800000, size: '150 sqm',    bedrooms: 4, bathrooms: 3, status: 'Sold', developerId: d3, description: 'Brand new 4-bedroom maisonette near SGR station. Quality finishes, tiled throughout. Easy access to Nairobi CBD.', features: ['SGR Access','Fitted Kitchen','Tiled Throughout','Parking x2','Garden','Security'], images: [], listedDate: '2025-01-05', views: 920, inquiries: 56 }
      ]);
      console.log('  ✔ Properties seeded');
    }
  }

  // Seed vehicle owners first, then vehicles with their real IDs
  if (!(await VehicleOwner.countDocuments())) {
    const owners = await VehicleOwner.insertMany([
      { name: 'Joseph Kamau', phone: '+254 712 100 200', email: 'joseph.k@gmail.com', idNumber: '12345678', commission: 5, joined: '2025-01-10', notes: 'Long-term client, reliable seller.' },
      { name: 'Susan Njeri',  phone: '+254 733 300 400', email: 'susan.n@yahoo.com',  idNumber: '23456789', commission: 5, joined: '2025-02-05', notes: '' },
      { name: 'Ali Hassan',   phone: '+254 722 500 600', email: 'ali.h@gmail.com',    idNumber: '34567890', commission: 4, joined: '2025-03-01', notes: 'Prefers cash settlement after sale.' }
    ]);
    const [o1, o2, o3] = owners.map(o => o._id.toString());
    console.log('  ✔ Vehicle owners seeded');

    if (!(await Vehicle.countDocuments())) {
      await Vehicle.insertMany([
        { make: 'Toyota',        model: 'Land Cruiser Prado', year: 2020, type: 'SUV',       condition: 'Excellent', mileage: 45000,  fuel: 'Diesel',  transmission: 'Automatic', engineCC: 2700, color: 'White',        price: 8500000, status: 'Available', ownerId: o1, description: 'Well-maintained Land Cruiser Prado TX. Single owner, full service history at Toyota Kenya. Accident-free.',                 features: ['Sunroof','Leather Seats','Reverse Camera','7-Seater','Alloy Wheels','Cruise Control','Bluetooth'], images: [], listedDate: '2025-03-01', views: 210, inquiries: 12 },
        { make: 'Subaru',        model: 'Forester XT',        year: 2018, type: 'SUV',       condition: 'Good',      mileage: 72000,  fuel: 'Petrol',  transmission: 'Automatic', engineCC: 2000, color: 'Silver',       price: 2350000, status: 'Available', ownerId: o2, description: 'Subaru Forester XT Turbo. Full-time AWD, turbocharged engine. Full logbook available.',                                    features: ['AWD','Turbo Engine','Sunroof','Bluetooth','Climate Control','Reverse Sensors'], images: [], listedDate: '2025-03-08', views: 165, inquiries: 8 },
        { make: 'Toyota',        model: 'Hilux Double Cab',   year: 2021, type: 'Pickup',    condition: 'Excellent', mileage: 38000,  fuel: 'Diesel',  transmission: 'Automatic', engineCC: 2400, color: 'Grey',         price: 5200000, status: 'Available', ownerId: o1, description: 'Toyota Hilux 4×4 in superb condition. Used lightly for farm visits. Bed liner, towbar fitted. Full service history.', features: ['4WD','Towbar','Bed Liner','Alloy Wheels','Reverse Camera','Bluetooth','Diff Lock'], images: [], listedDate: '2025-03-15', views: 290, inquiries: 18 },
        { make: 'Honda',         model: 'Fit Hybrid',         year: 2016, type: 'Hatchback', condition: 'Good',      mileage: 58000,  fuel: 'Hybrid',  transmission: 'Automatic', engineCC: 1300, color: 'Blue',         price: 890000,  status: 'Available', ownerId: o3, description: 'Honda Fit GP5 hybrid. Excellent fuel economy — 20 km/l. Ideal city car or first vehicle.',                              features: ['Hybrid Engine','Fuel Efficient','Reverse Camera','Bluetooth','Push Start','Magic Seats'], images: [], listedDate: '2025-03-20', views: 420, inquiries: 25 },
        { make: 'Mercedes-Benz', model: 'C200',               year: 2019, type: 'Sedan',     condition: 'Excellent', mileage: 32000,  fuel: 'Petrol',  transmission: 'Automatic', engineCC: 1500, color: 'Black',        price: 5800000, status: 'Reserved',  ownerId: o2, description: 'Mercedes-Benz C200 EQ Boost. Panoramic sunroof, Burmester sound, heated leather seats, AMG package. Full MB Kenya history.', features: ['Panoramic Sunroof','Burmester Sound','Heated Seats','AMG Package','360 Camera','Wireless Charging'], images: [], listedDate: '2025-02-28', views: 385, inquiries: 22 },
        { make: 'Isuzu',         model: 'NQR 33-Seater',      year: 2017, type: 'Bus',       condition: 'Good',      mileage: 120000, fuel: 'Diesel',  transmission: 'Manual',    engineCC: 5200, color: 'White/Yellow', price: 2800000, status: 'Sold',      ownerId: o3, description: 'Isuzu NQR 33-seater. NTSA inspected, insurance and logbook in order. Ready to transfer.',                              features: ['33 Seater','NTSA Inspected','Power Steering','Air Brakes','Good Tyres'], images: [], listedDate: '2025-02-01', views: 178, inquiries: 11 }
      ]);
      console.log('  ✔ Vehicles seeded');
    }
  }

  if (!(await Lead.countDocuments())) {
    await Lead.insertMany([
      { name: 'Mary Wanjiku',   phone: '+254 722 111 222', email: 'mary.w@gmail.com',   interest: 'Land in Karen',        status: 'Viewing Scheduled', date: '2025-03-15', notes: 'Interested in building a family home. Budget confirmed.' },
      { name: 'David Omondi',   phone: '+254 733 333 444', email: 'david.o@yahoo.com',  interest: 'Plots in Kitengela',   status: 'Contacted',          date: '2025-03-18', notes: 'Looking for investment plots. Has capacity for 3 plots.' },
      { name: 'Fatuma Hassan',  phone: '+254 712 555 666', email: 'fatuma.h@gmail.com', interest: '5BR Villa Runda',      status: 'New Lead',           date: '2025-03-20', notes: '' },
      { name: 'Samuel Njoroge', phone: '+254 700 777 888', email: 'samuel.n@email.com', interest: 'Rongai Plots',         status: 'Closed',             date: '2025-02-28', notes: 'Purchased 2 plots. Transaction complete.' },
      { name: 'Agnes Muthoni',  phone: '+254 724 999 000', email: 'agnes.m@gmail.com',  interest: 'Townhouse Kileleshwa', status: 'New Lead',           date: '2025-03-22', notes: '' }
    ]);
    console.log('  ✔ Leads seeded');
  }

  if (!(await Booking.countDocuments())) {
    await Booking.insertMany([
      { type: 'Property Viewing', clientName: 'Mary Wanjiku',  clientPhone: '+254 722 111 222', clientEmail: 'mary.w@gmail.com',   date: '2025-04-02', time: '10:00', status: 'Confirmed', notes: 'First viewing requested.' },
      { type: 'Consultation',     clientName: 'David Omondi',  clientPhone: '+254 733 333 444', clientEmail: 'david.o@yahoo.com',  date: '2025-04-05', time: '14:00', status: 'Pending',   notes: 'Wants to discuss investment options.' },
      { type: 'Property Viewing', clientName: 'Fatuma Hassan', clientPhone: '+254 712 555 666', clientEmail: 'fatuma.h@gmail.com', date: '2025-04-08', time: '11:00', status: 'Pending',   notes: 'Second viewing - spouse joining.' }
    ]);
    console.log('  ✔ Bookings seeded');
  }

  if (!(await Service.countDocuments())) {
    await Service.insertMany([
      { type: 'Due Diligence', service: 'Title Search',           clientName: 'Paul Kamau',      clientPhone: '+254 711 222 333', propertyDetails: 'LR No. 3782/Vol.47 — Westlands',             status: 'Completed',   submittedDate: '2025-03-01', completedDate: '2025-03-08' },
      { type: 'Due Diligence', service: 'Ownership Verification', clientName: 'Esther Achieng',  clientPhone: '+254 722 444 555', propertyDetails: 'Plot No. 456, Athi River',                   status: 'In Progress', submittedDate: '2025-03-20', completedDate: null },
      { type: 'Land Transfer', service: 'Land Transfer',           clientName: 'John Mwangi',     clientPhone: '+254 733 666 777', propertyDetails: 'LR No. 12345 — Karen',                       status: 'Pending',     submittedDate: '2025-03-22', completedDate: null },
      { type: 'Subdivision',   service: 'Land Subdivision',        clientName: 'Miriam Odhiambo', clientPhone: '+254 700 888 999', propertyDetails: '3 Acres in Kiambu — to divide into 6 plots', status: 'In Progress', submittedDate: '2025-03-10', completedDate: null }
    ]);
    console.log('  ✔ Services seeded');
  }

  console.log('✅ Database ready.');
}

/* ================================================================
   CONNECT & START
   ================================================================ */
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI environment variable is not set.\n    Add it to .env (local) or Render environment variables.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    await seedIfEmpty();
    app.listen(PORT, () =>
      console.log(`🚀 Kakilin Properties → http://localhost:${PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
