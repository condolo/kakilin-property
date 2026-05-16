/* ============================================================
   KAKILIN PROPERTIES — SEED DATA & DATA LAYER
   ============================================================ */

/* All 47 Kenyan Counties with their sub-counties / major towns */
const KENYA_COUNTIES = {
  "Nairobi":         ["Westlands","Karen","Kilimani","Kileleshwa","Lavington","Runda","Gigiri","Muthaiga","Parklands","Upper Hill","Embakasi","Kasarani","Ruaraka","Dagoretti","Langata","Starehe","Roysambu","Makadara","Mathare","Njiru","Kayole","Pangani"],
  "Mombasa":         ["Mvita","Nyali","Changamwe","Jomvu","Kisauni","Likoni"],
  "Kwale":           ["Msambweni","Lunga Lunga","Matuga","Kinango","Ukunda","Shimba Hills"],
  "Kilifi":          ["Kilifi North","Kilifi South","Kaloleni","Rabai","Ganze","Malindi","Magarini","Watamu","Mtwapa"],
  "Tana River":      ["Garsen","Galole","Bura","Hola"],
  "Lamu":            ["Lamu East","Lamu West","Mpeketoni","Witu","Mokowe"],
  "Taita-Taveta":    ["Voi","Wundanyi","Mwatate","Taveta","Mwatate","Kasigau"],
  "Garissa":         ["Garissa Township","Balambala","Lagdera","Dadaab","Fafi","Ijara","Hulugho"],
  "Wajir":           ["Wajir East","Wajir West","Wajir North","Wajir South","Eldas","Tarbaj"],
  "Mandera":         ["Mandera East","Mandera West","Mandera North","Mandera South","Banissa","Lafey"],
  "Marsabit":        ["Moyale","North Horr","Saku","Laisamis","Marsabit Town"],
  "Isiolo":          ["Isiolo North","Isiolo South","Garbatulla","Merti","Kina"],
  "Meru":            ["Igembe South","Igembe Central","Igembe North","Tigania West","Tigania East","Central Imenti","Buuri","North Imenti","South Imenti","Meru Town","Nkubu"],
  "Tharaka-Nithi":   ["Maara","Chuka","Igambang'ombe","Tharaka North","Tharaka South"],
  "Embu":            ["Manyatta","Runyenjes","Mbeere South","Mbeere North","Embu Town"],
  "Kitui":           ["Mwingi North","Mwingi Central","Mwingi West","Kitui West","Kitui Rural","Kitui Central","Kitui East","Kitui South","Mutomo"],
  "Machakos":        ["Masinga","Yatta","Kangundo","Matungulu","Kathiani","Mavoko","Machakos Town","Mwala","Athi River","Mlolongo","Syokimau","Tala"],
  "Makueni":         ["Makueni Town","Kibwezi West","Kibwezi East","Kilome","Kaiti","Mbooni","Wote"],
  "Nyandarua":       ["Kinangop","Kipipiri","Ol Kalou","Ndaragwa","Ol Joro Orok","Engineer"],
  "Nyeri":           ["Tetu","Kieni East","Kieni West","Mathira East","Mathira West","Othaya","Mukurwe-ini","Nyeri Town","Naro Moru","Karatina"],
  "Kirinyaga":       ["Mwea East","Mwea West","Gichugu","Ndia","Kirinyaga Central","Kerugoya","Kutus"],
  "Murang'a":        ["Kangema","Mathioya","Kiharu","Kigumo","Maragua","Kandara","Gatanga","Murang'a Town","Kenol","Thika Road","Maragua Ridge"],
  "Kiambu":          ["Gatundu South","Gatundu North","Juja","Thika Town","Ruiru","Githunguri","Kiambu Town","Kabete","Kikuyu","Limuru","Lari","Sigona","Tigoni","Banana","Karuri"],
  "Turkana":         ["Turkana North","Turkana West","Turkana Central","Loima","Turkana South","Turkana East","Lodwar","Kakuma"],
  "West Pokot":      ["Kapenguria","Sigor","Kacheliba","Pokot South","Lomut","Chepareria"],
  "Samburu":         ["Samburu North","Samburu East","Samburu West","Maralal","Wamba"],
  "Trans-Nzoia":     ["Kwanza","Endebess","Saboti","Kiminini","Cherangany","Kitale","Waitaluk"],
  "Uasin Gishu":     ["Soy","Turbo","Moiben","Ainabkoi","Kapseret","Kesses","Eldoret","Burnt Forest","Ziwa"],
  "Elgeyo-Marakwet": ["Marakwet East","Marakwet West","Keiyo North","Keiyo South","Iten","Kapsowar","Chepkorio"],
  "Nandi":           ["Tinderet","Aldai","Nandi Hills","Chesumei","Emgwen","Mosop","Kapsabet"],
  "Baringo":         ["Tiaty","Baringo North","Baringo Central","Baringo South","Mogotio","Eldama Ravine","Kabarnet","Marigat"],
  "Laikipia":        ["Laikipia West","Laikipia East","Laikipia North","Nanyuki","Rumuruti","Nyahururu","Kinamba","Mukogodo"],
  "Nakuru":          ["Molo","Njoro","Naivasha","Gilgil","Kuresoi South","Kuresoi North","Subukia","Rongai","Nakuru Town East","Nakuru Town West","Bahati","Mau Narok","Longonot"],
  "Narok":           ["Kilgoris","Emurua Dikirr","Narok North","Narok East","Narok South","Narok West","Narok Town","Sekenani"],
  "Kajiado":         ["Kajiado North","Kajiado Central","Kajiado East","Kajiado West","Kajiado South","Ngong","Ongata Rongai","Kitengela","Athi River","Loitokitok","Magadi","Kiserian","Imarisha","Namanga"],
  "Kericho":         ["Kipkelion East","Kipkelion West","Ainamoi","Bureti","Belgut","Soin/Sigowet","Kericho Town","Litein","Londiani"],
  "Bomet":           ["Sotik","Chepalungu","Bomet East","Bomet Central","Konoin","Bomet Town"],
  "Kakamega":        ["Lugari","Likuyani","Malava","Lurambi","Navakholo","Mumias West","Mumias East","Matungu","Butere","Khwisero","Shinyalu","Ikolomani","Kakamega Town"],
  "Vihiga":          ["Vihiga","Sabatia","Hamisi","Luanda","Emuhaya","Mbale"],
  "Bungoma":         ["Mt. Elgon","Sirisia","Kabuchai","Bumula","Kanduyi","Webuye East","Webuye West","Kimilili","Tongaren","Bungoma Town","Chwele"],
  "Busia":           ["Teso North","Teso South","Nambale","Matayos","Butula","Funyula","Budalangi","Busia Town","Malaba"],
  "Siaya":           ["Ugenya","Ugunja","Alego Usonga","Gem","Bondo","Rarieda","Siaya Town","Yala"],
  "Kisumu":          ["Kisumu East","Kisumu West","Kisumu Central","Seme","Nyando","Muhoroni","Nyakach","Kisumu CBD","Kondele","Mamboleo"],
  "Homa Bay":        ["Kasipul","Kabondo Kasipul","Karachuonyo","Rangwe","Homa Bay Town","Ndhiwa","Suba North","Suba South","Kendu Bay"],
  "Migori":          ["Rongo","Awendo","Suna East","Suna West","Uriri","Nyatike","Kuria West","Kuria East","Migori Town","Isebania"],
  "Kisii":           ["Bonchari","South Mugirango","Bomachoge Borabu","Bobasi","Bomachoge Chache","Nyaribari Masaba","Nyaribari Chache","Kitutu Chache North","Kitutu Chache South","Kisii Town","Ogembo","Suneka"],
  "Nyamira":         ["Kitutu Masaba","West Mugirango","North Mugirango","Borabu","Nyamira Town","Keroka","Nyansiongo"]
};

/* ================================================================
   DEFAULT SETTINGS — client-side fallback while API loads
   ================================================================ */
const DEFAULT_SETTINGS = {
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
   IN-MEMORY CACHE  (populated from API on init, updated after writes)
   ================================================================ */
const AppCache = {
  properties: [], vehicles: [], vehicleOwners: [],
  developers: [], leads: [], bookings: [], services: [], users: [],
  settings: null
};

/* ================================================================
   DB — async API client with synchronous cache reads
   ================================================================ */
const DB = {
  /* ── Synchronous reads (from in-memory cache) ── */
  get(table)       { return AppCache[table] || []; },
  getById(table, id) {
    return (AppCache[table] || []).find(r =>
      String(r.id) === String(id) || String(r._id) === String(id)
    );
  },
  getSettings()    { return AppCache.settings || { ...DEFAULT_SETTINGS }; },

  /* ── Async writes (API call + cache update) ── */
  async insert(table, record) {
    const res = await fetch(`/api/${table}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(record)
    });
    if (!res.ok) throw new Error(await res.text());
    const created = await res.json();
    AppCache[table] = [created, ...(AppCache[table] || [])];
    return created;
  },

  async update(table, id, updates) {
    const res = await fetch(`/api/${table}/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(await res.text());
    const updated = await res.json();
    const arr = AppCache[table] || [];
    const idx = arr.findIndex(r => String(r.id) === String(id) || String(r._id) === String(id));
    if (idx !== -1) arr[idx] = updated; else arr.unshift(updated);
    AppCache[table] = [...arr];
    return updated;
  },

  async delete(table, id) {
    const res = await fetch(`/api/${table}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    AppCache[table] = (AppCache[table] || []).filter(
      r => String(r.id) !== String(id) && String(r._id) !== String(id)
    );
  },

  async saveSettings(settings) {
    const res = await fetch('/api/settings', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(settings)
    });
    if (!res.ok) throw new Error(await res.text());
    AppCache.settings = await res.json();
  },

  /* ── Init: fetch all collections from API in parallel ── */
  async init() {
    const tables = ['properties','vehicles','vehicleOwners','developers',
                    'leads','bookings','services','users'];
    const fetches = [
      ...tables.map(t => fetch(`/api/${t}`).then(r => r.ok ? r.json() : []).catch(() => [])),
      fetch('/api/settings').then(r => r.ok ? r.json() : null).catch(() => null)
    ];
    const results = await Promise.all(fetches);
    tables.forEach((t, i) => { AppCache[t] = Array.isArray(results[i]) ? results[i] : []; });
    AppCache.settings = results[tables.length] || { ...DEFAULT_SETTINGS };
  }
};

