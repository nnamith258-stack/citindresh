const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'agrismart.sqlite');

const crops = [
  { name: 'Wheat', emoji: '🌾', rain: [400, 800], temp: [14, 28], profit: 'High', water: 'Medium', time: '110 days', price: 2180 },
  { name: 'Rice', emoji: '🌿', rain: [850, 1200], temp: [22, 36], profit: 'High', water: 'High', time: '130 days', price: 2050 },
  { name: 'Tomato', emoji: '🍅', rain: [500, 800], temp: [20, 32], profit: 'Very High', water: 'Medium', time: '90 days', price: 1850 },
  { name: 'Cotton', emoji: '🌸', rain: [600, 900], temp: [25, 38], profit: 'High', water: 'Medium', time: '180 days', price: 6400 },
  { name: 'Mustard', emoji: '🌼', rain: [250, 600], temp: [10, 22], profit: 'Medium', water: 'Low', time: '100 days', price: 5200 },
  { name: 'Sugarcane', emoji: '🎋', rain: [700, 1000], temp: [24, 38], profit: 'High', water: 'High', time: '365 days', price: 3400 },
  { name: 'Maize', emoji: '🌽', rain: [500, 900], temp: [20, 34], profit: 'Medium', water: 'Medium', time: '100 days', price: 1950 }
];

const seedListings = [
  { id: 'seed-1', name: 'Organic Tomatoes', farmer: 'Raju Patel · Nashik, MH', qty: '200 kg', price: '₹28/kg', grade: 'Organic', emoji: '🍅', bg: '#FAECE7' },
  { id: 'seed-2', name: 'Basmati Rice', farmer: 'Harpreet Singh · Amritsar, PB', qty: '50 quintal', price: '₹55/kg', grade: 'A-grade', emoji: '🌾', bg: '#EAF3DE' },
  { id: 'seed-3', name: 'Fresh Onions', farmer: 'Suresh Mali · Indore, MP', qty: '100 kg', price: '₹18/kg', grade: 'B-grade', emoji: '🧅', bg: '#FAEEDA' },
  { id: 'seed-4', name: 'Green Chillies', farmer: 'Meera Devi · Guntur, AP', qty: '30 kg', price: '₹45/kg', grade: 'A-grade', emoji: '🌶️', bg: '#FCEBEB' },
  { id: 'seed-5', name: 'Alphonso Mangoes', farmer: 'Dinesh Sawant · Ratnagiri, MH', qty: '150 kg', price: '₹120/kg', grade: 'Premium', emoji: '🥭', bg: '#FFF8E1' },
  { id: 'seed-6', name: 'Baby Potatoes', farmer: 'Rajesh Kumar · Agra, UP', qty: '80 kg', price: '₹22/kg', grade: 'A-grade', emoji: '🥔', bg: '#F3E5F5' }
];

const mandiData = [
  { crop: 'Wheat', mandi: 'Bangalore APMC', min: 2120, max: 2240, trend: 1 },
  { crop: 'Wheat', mandi: 'Udupi APMC', min: 2080, max: 2180, trend: 1 },
  { crop: 'Tomato', mandi: 'APMC Hassan', min: 1780, max: 1950, trend: -1 },
  { crop: 'Rice', mandi: 'Mangalore APMC', min: 1980, max: 2100, trend: 1 },
  { crop: 'Cotton', mandi: 'Tumakuru APMC', min: 6200, max: 6600, trend: 1 },
  { crop: 'Mustard', mandi: 'Shivamogga APMC', min: 5000, max: 5400, trend: -1 },
  { crop: 'Onion', mandi: 'Mysore APMC', min: 1200, max: 1500, trend: 1 }
];

const priceForecasts = {
  Wheat: [
    { day: 'Today', price: 2240 },
    { day: 'Tomorrow', price: 2265 },
    { day: 'Day 2', price: 2290 },
    { day: 'Day 3', price: 2310 }
  ],
  Tomato: [
    { day: 'Today', price: 1950 },
    { day: 'Tomorrow', price: 1840 },
    { day: 'Day 2', price: 1760 },
    { day: 'Day 3', price: 1680 }
  ],
  Rice: [
    { day: 'Today', price: 2100 },
    { day: 'Tomorrow', price: 2125 },
    { day: 'Day 2', price: 2150 },
    { day: 'Day 3', price: 2140 }
  ],
  Cotton: [
    { day: 'Today', price: 6600 },
    { day: 'Tomorrow', price: 6660 },
    { day: 'Day 2', price: 6725 },
    { day: 'Day 3', price: 6810 }
  ],
  Mustard: [
    { day: 'Today', price: 5400 },
    { day: 'Tomorrow', price: 5320 },
    { day: 'Day 2', price: 5260 },
    { day: 'Day 3', price: 5290 }
  ],
  Onion: [
    { day: 'Today', price: 1500 },
    { day: 'Tomorrow', price: 1535 },
    { day: 'Day 2', price: 1580 },
    { day: 'Day 3', price: 1620 }
  ]
};

const aiReplies = {
  'wheat rust': `<b>Wheat Rust Treatment Plan</b><br><br>🔬 <b>Disease:</b> Puccinia striiformis or P. triticina<br><br>💊 <b>Treatment:</b><br>&bull; Propiconazole 25% EC - 0.1% (1ml/L water)<br>&bull; Tebuconazole 25.9% EC - 0.1%<br>&bull; Spray at first sign of orange/yellow pustules<br><br>📅 <b>Schedule:</b> Repeat every 12-14 days for 2 cycles<br>🌿 <b>Prevention:</b> Use rust-resistant varieties like HD-2967 or PBW-550.`,
  tomato: `<b>Tomato Fertilizer Schedule</b><br><br>🌱 <b>At transplant:</b> NPK 19:19:19 - 5g/plant<br>🌿 <b>Vegetative:</b> Urea 2g/L + micronutrient spray<br>🍅 <b>Fruiting:</b> NPK 0:0:50 - 5g/plant for fruit quality<br><br><b>Organic option:</b> 2kg compost + 200g neem cake per plant.`,
  rice: `<b>Rice Irrigation Guide</b><br><br>💧 <b>Critical stages:</b><br>&bull; Transplanting to tillering: 5-7cm standing water<br>&bull; Flowering/heading: never let field dry out<br>&bull; Grain filling: use AWD to save water<br><br><b>AWD tip:</b> Irrigate when water drops about 15cm below soil level.`,
  cotton: `<b>Cotton Pest Management</b><br><br>🐛 <b>Controls:</b><br>&bull; Whitefly/Jassids: Imidacloprid 17.8% SL - 0.5ml/L<br>&bull; Bollworm: Chlorpyrifos 20% EC - 2ml/L<br>&bull; Thrips: Spinosad 45% SC - 0.5ml/L<br><br>Use pheromone and yellow sticky traps for monitoring.`,
  soil: `<b>Soil Health Improvement Plan</b><br><br>📊 <b>Optimal pH:</b> 6.0-7.5<br><br>🔧 <b>Corrections:</b><br>&bull; Acidic soil: apply agricultural lime<br>&bull; Alkaline soil: apply gypsum or sulfur<br><br>🌱 Add green manure, farmyard manure, and vermicompost to increase organic matter.`
};

let db;

function rowToListing(row) {
  return {
    id: row.id,
    name: row.name,
    farmer: row.farmer,
    qty: row.qty,
    price: row.price,
    grade: row.grade,
    emoji: row.emoji,
    bg: row.bg,
    isOwn: Boolean(row.is_own),
    createdAt: row.created_at
  };
}

function rowToOrder(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    quantity: row.quantity,
    buyer: row.buyer,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at
  };
}

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = db || new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      farmer TEXT NOT NULL,
      qty TEXT NOT NULL,
      price TEXT NOT NULL,
      grade TEXT NOT NULL,
      emoji TEXT NOT NULL,
      bg TEXT NOT NULL,
      is_own INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price TEXT NOT NULL,
      quantity TEXT NOT NULL,
      buyer TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS detections (
      id TEXT PRIMARY KEY,
      filename TEXT,
      disease TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      severity TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function readListings() {
  ensureDb();
  return db.prepare('SELECT * FROM listings ORDER BY created_at DESC').all().map(rowToListing);
}

function readOrders() {
  ensureDb();
  return db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all().map(rowToOrder);
}

function insertListing(listing) {
  ensureDb();
  db.prepare(`
    INSERT INTO listings (id, name, farmer, qty, price, grade, emoji, bg, is_own, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    listing.id,
    listing.name,
    listing.farmer,
    listing.qty,
    listing.price,
    listing.grade,
    listing.emoji,
    listing.bg,
    listing.isOwn ? 1 : 0,
    listing.createdAt
  );
}

function insertOrder(order) {
  ensureDb();
  db.prepare(`
    INSERT INTO orders (id, name, price, quantity, buyer, phone, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(order.id, order.name, order.price, order.quantity, order.buyer, order.phone, order.status, order.createdAt);
}

function insertDetection(result) {
  try {
    ensureDb();
    
    // Validate required fields
    if (!result.id || !result.disease) {
      throw new Error('Missing required detection fields');
    }
    
    db.prepare(`
      INSERT INTO detections (id, filename, disease, confidence, severity, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      String(result.id || '').substring(0, 100),
      String(result.filename || '').substring(0, 255),
      String(result.disease).substring(0, 255),
      Math.max(0, Math.min(100, parseInt(result.confidence) || 0)),
      String(result.severity || 'Unknown').substring(0, 100),
      result.createdAt || new Date().toISOString()
    );
  } catch (err) {
    console.error('Failed to insert detection record:', err.message);
    // Don't throw - allow API to continue even if recording fails
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let resolved = false;
    const MAX_SIZE = 20_000_000; // 20MB limit
    const TIMEOUT = 30_000; // 30 second timeout
    
    const timeoutHandle = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        req.destroy();
        reject(new Error('Request timeout'));
      }
    }, TIMEOUT);
    
    req.on('data', chunk => {
      if (resolved) return;
      
      try {
        raw += chunk;
        if (raw.length > MAX_SIZE) {
          resolved = true;
          clearTimeout(timeoutHandle);
          req.destroy();
          reject(new Error('Request body too large'));
        }
      } catch (err) {
        resolved = true;
        clearTimeout(timeoutHandle);
        reject(err);
      }
    });
    
    req.on('end', () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutHandle);
      
      try {
        if (!raw) return resolve({});
        const parsed = JSON.parse(raw);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON body: ' + err.message));
      }
    });
    
    req.on('error', (err) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutHandle);
      reject(err);
    });
  });
}

const cropKnowledge = {
  wheat: {
    label: 'Wheat',
    irrigation: 'Irrigate at crown-root initiation, tillering, jointing, flowering, and grain filling. Avoid standing water.',
    fertilizer: 'Use split nitrogen: basal dose at sowing, then top dress near first irrigation and tillering. Add zinc if leaves show pale striping.',
    disease: 'Rust risk rises in cool, humid weather. Scout lower and middle leaves for orange/yellow pustules.',
    market: 'Dry grain to safe moisture before storage. If local prices are weak, compare nearby APMC arrivals before selling.'
  },
  rice: {
    label: 'Rice',
    irrigation: 'Keep shallow water after transplanting, then use alternate wetting and drying once the crop is established.',
    fertilizer: 'Split nitrogen across basal, tillering, and panicle initiation stages. Do not overuse urea because it increases pest pressure.',
    disease: 'Watch for blast, bacterial blight, and sheath blight after cloudy, humid days.',
    market: 'Grade by moisture and broken percentage; cleaner lots usually negotiate better.'
  },
  tomato: {
    label: 'Tomato',
    irrigation: 'Keep soil evenly moist. Avoid sudden dry-wet cycles because they trigger fruit cracking and blossom-end rot.',
    fertilizer: 'Use balanced NPK early, then increase potassium during flowering and fruiting. Add calcium if fruits show bottom rot.',
    disease: 'Yellow spots with rings suggest early blight; water-soaked lesions can indicate bacterial disease.',
    market: 'Harvest by maturity stage: firm-pink for transport, red-ripe for local direct sales.'
  },
  cotton: {
    label: 'Cotton',
    irrigation: 'Irrigate at square formation, flowering, and boll development. Stress during flowering reduces boll set.',
    fertilizer: 'Avoid excess nitrogen late in the season; it encourages vegetative growth and pests.',
    disease: 'Monitor whitefly, jassids, thrips, and bollworm. Use traps before spraying.',
    market: 'Pick clean, dry cotton and avoid mixing stained kapas with good lots.'
  },
  onion: {
    label: 'Onion',
    irrigation: 'Maintain light, regular irrigation during bulb development and stop before harvest for better curing.',
    fertilizer: 'Sulphur improves bulb quality. Avoid heavy nitrogen late because it reduces storage life.',
    disease: 'Purple blotch and thrips are common under humid and dry-hot stress respectively.',
    market: 'Cure bulbs well and sort by size before selling.'
  },
  maize: {
    label: 'Maize',
    irrigation: 'Critical stages are knee-high, tasseling, silking, and grain filling.',
    fertilizer: 'Apply nitrogen in splits and ensure zinc availability for early vigor.',
    disease: 'Check whorl leaves for fall armyworm damage; act early when larvae are small.',
    market: 'Dry grain properly to reduce fungal loss and price cuts.'
  }
};

const symptomRules = [
  {
    keys: ['rust', 'orange', 'yellow pustule', 'pustules'],
    title: 'Likely rust infection',
    actions: ['Remove heavily infected leaves where practical', 'Spray a registered triazole fungicide such as propiconazole or tebuconazole at label dose', 'Repeat after 12-14 days if new pustules appear'],
    prevention: 'Use resistant varieties, avoid dense sowing, and monitor after cool humid nights.'
  },
  {
    keys: ['yellow spot', 'brown spot', 'ring', 'blight', 'leaf spot'],
    title: 'Likely fungal leaf spot or blight',
    actions: ['Remove infected lower leaves', 'Improve spacing and airflow', 'Use Mancozeb 75% WP around 2.5g/L or copper fungicide as per label'],
    prevention: 'Avoid overhead irrigation and rotate away from the same crop family next season.'
  },
  {
    keys: ['white powder', 'powdery'],
    title: 'Likely powdery mildew',
    actions: ['Remove badly affected leaves', 'Spray wettable sulphur or a registered mildew fungicide at label dose', 'Avoid spraying sulphur during very hot hours'],
    prevention: 'Improve airflow and avoid excess nitrogen.'
  },
  {
    keys: ['curl', 'whitefly', 'sticky', 'honeydew'],
    title: 'Possible sucking pest or viral leaf curl pressure',
    actions: ['Check underside of leaves for whiteflies, aphids, or jassids', 'Install yellow sticky traps', 'Use neem oil early; use registered systemic insecticide only if pest count crosses threshold'],
    prevention: 'Remove weed hosts and avoid repeated use of the same insecticide group.'
  },
  {
    keys: ['wilting', 'wilt', 'drooping'],
    title: 'Water stress, root disease, or vascular wilt needs checking',
    actions: ['Check soil moisture 10cm below the surface', 'Inspect roots for rot or nematode knots', 'Avoid immediate fertilizer application until water/root cause is clear'],
    prevention: 'Improve drainage, rotate crops, and use disease-free seedlings.'
  }
];

function includesAny(text, terms) {
  return terms.some(term => text.includes(term));
}

function detectCrop(text) {
  return Object.keys(cropKnowledge).find(crop => text.includes(crop)) || null;
}

function detectTopic(text) {
  if (includesAny(text, ['price', 'sell', 'market', 'mandi', 'buyer', 'profit'])) return 'market';
  if (includesAny(text, ['water', 'irrigation', 'irrigate', 'moisture', 'dry'])) return 'irrigation';
  if (includesAny(text, ['fertilizer', 'fertiliser', 'npk', 'urea', 'nitrogen', 'potassium', 'compost'])) return 'fertilizer';
  if (includesAny(text, ['pest', 'worm', 'whitefly', 'jassid', 'thrips', 'aphid', 'borer'])) return 'pest';
  if (includesAny(text, ['disease', 'spot', 'blight', 'rust', 'fungal', 'mildew', 'wilt', 'curl', 'yellow'])) return 'disease';
  return 'general';
}

function detectSymptom(text) {
  return symptomRules.find(rule => includesAny(text, rule.keys)) || null;
}

function makeList(items) {
  return items.map(item => `&bull; ${item}`).join('<br>');
}

function getMarketAdvice(crop) {
  const rows = crop ? mandiData.filter(row => row.crop.toLowerCase() === crop) : mandiData;
  const best = rows.length ? rows.reduce((a, b) => (b.max > a.max ? b : a), rows[0]) : mandiData[0];
  return `<b>Market Advisory${crop ? ` for ${cropKnowledge[crop].label}` : ''}</b><br><br>
    <b>Best current mandi in demo data:</b> ${best.mandi} for ${best.crop}, up to ₹${best.max}/Q.<br><br>
    <b>Sell checklist:</b><br>
    ${makeList(['Compare local trader price with APMC max price', 'Sell only after drying/cleaning to avoid quality cuts', 'Use Marketplace for small premium lots where direct buyers pay better', 'If price is rising and storage is safe, hold a small portion instead of selling all at once'])}<br><br>
    <b>Ask next:</b> Tell me your crop quantity and nearest town, and I can suggest a sell-vs-hold plan.`;
}

function check_price_trend(product) {
  const requested = String(product || 'Tomato').trim().toLowerCase();
  const productName = Object.keys(priceForecasts).find(name => name.toLowerCase() === requested) || 'Tomato';
  const forecast = priceForecasts[productName];
  const today = forecast[0];
  const nextDays = forecast.slice(1, 4);
  const lowerDays = nextDays.filter(day => day.price < today.price);
  const higherDays = nextDays.filter(day => day.price > today.price);
  const bestDay = forecast.reduce((best, day) => (day.price > best.price ? day : best), today);

  if (lowerDays.length && !higherDays.length) {
    const worstDrop = lowerDays.reduce((lowest, day) => (day.price < lowest.price ? day : lowest), lowerDays[0]);
    return {
      product: productName,
      status: 'drop',
      alert: true,
      recommendation: 'Sell Today',
      message: `Sell Today — ${productName} is ₹${today.price}/Q today and may drop to ₹${worstDrop.price}/Q by ${worstDrop.day}.`,
      today,
      bestDay: today,
      expectedDrop: today.price - worstDrop.price,
      dropDay: worstDrop,
      forecast
    };
  }

  if (!lowerDays.length && higherDays.length) {
    return {
      product: productName,
      status: 'rise',
      alert: false,
      recommendation: 'Hold',
      message: `Hold — prices rising. Best day: ${bestDay.day} at ₹${bestDay.price}/Q.`,
      today,
      bestDay,
      expectedGain: bestDay.price - today.price,
      forecast
    };
  }

  return {
    product: productName,
    status: 'stable',
    alert: false,
    recommendation: 'Monitor',
    message: `Stable prices — ${productName} should remain around ₹${today.price}/Q over the next 3 days.`,
    today,
    bestDay,
    forecast
  };
}

function getAIReply(message) {
  const text = String(message || '').toLowerCase().trim();
  const crop = detectCrop(text);
  const topic = detectTopic(text);
  const symptom = detectSymptom(text);
  const cropInfo = cropKnowledge[crop] || null;
  const cropLabel = cropInfo ? cropInfo.label : 'your crop';

  if (!text) {
    return `<b>Tell me what you are seeing in the field</b><br><br>
      You can mention crop, age/stage, leaf symptoms, soil moisture, recent weather, and what you already sprayed.<br><br>
      <b>Example:</b> "Tomato, 45 days, yellow spots on lower leaves after rain."`;
  }

  if (topic === 'market') return getMarketAdvice(crop);

  if (topic === 'irrigation') {
    return `<b>Irrigation Plan for ${cropLabel}</b><br><br>
      <b>Recommendation:</b> ${cropInfo ? cropInfo.irrigation : 'Keep moisture steady near the root zone, not waterlogged. Irrigate early morning when the topsoil is dry and the crop shows mild stress.'}<br><br>
      <b>Field check:</b><br>
      ${makeList(['Press soil from 10cm depth: if it does not form a loose ball, irrigate', 'Avoid evening irrigation when disease pressure is high', 'Mulch vegetables to reduce moisture swings'])}<br><br>
      <b>Follow-up:</b> What is your crop stage and soil type: sandy, red soil, black soil, or clay?`;
  }

  if (topic === 'fertilizer') {
    return `<b>Fertilizer Advisory for ${cropLabel}</b><br><br>
      <b>Base guidance:</b> ${cropInfo ? cropInfo.fertilizer : 'Use soil-test based NPK. Apply nitrogen in splits, keep phosphorus near roots early, and increase potassium during flowering/fruiting crops.'}<br><br>
      <b>Do this first:</b><br>
      ${makeList(['Check whether symptoms are on old leaves or new leaves', 'Do not apply high urea during pest/disease stress', 'Add organic matter or compost to improve nutrient holding'])}<br><br>
      <b>Follow-up:</b> Tell me crop age, last fertilizer applied, and the symptom color pattern.`;
  }

  if (symptom || topic === 'disease' || topic === 'pest') {
    const issue = symptom || {
      title: cropInfo ? `${cropInfo.label} health issue` : 'Crop health issue',
      actions: ['Inspect upper and lower leaf surfaces', 'Remove heavily affected plant parts', 'Use a registered crop-specific pesticide/fungicide only after matching symptoms'],
      prevention: 'Improve spacing, avoid excess nitrogen, and keep field sanitation strong.'
    };
    return `<b>${issue.title} in ${cropLabel}</b><br><br>
      <b>Likely cause:</b> ${cropInfo ? cropInfo.disease : 'Based on the symptoms, this may be disease, pest, water stress, or nutrient imbalance. A photo or symptom location helps narrow it down.'}<br><br>
      <b>Immediate actions:</b><br>
      ${makeList(issue.actions)}<br><br>
      <b>Prevention:</b> ${issue.prevention}<br><br>
      <b>Safety note:</b> Follow the product label, wear protection while spraying, and avoid harvest before the recommended waiting period.<br><br>
      <b>Follow-up:</b> Are symptoms on old leaves, new leaves, fruit, stem, or roots?`;
  }

  if (cropInfo) {
    return `<b>${cropInfo.label} Advisory</b><br><br>
      <b>Water:</b> ${cropInfo.irrigation}<br><br>
      <b>Nutrition:</b> ${cropInfo.fertilizer}<br><br>
      <b>Health watch:</b> ${cropInfo.disease}<br><br>
      <b>Market:</b> ${cropInfo.market}<br><br>
      <b>Ask next:</b> Tell me your crop stage and the exact problem, and I will give a tighter action plan.`;
  }

  return `<b>Smart Farming Advisory</b><br><br>
    I can help with disease diagnosis, fertilizer planning, irrigation timing, pest control, crop selection, and market selling decisions.<br><br>
    <b>To get a precise answer, send:</b><br>
    ${makeList(['Crop name', 'Crop age or stage', 'Main symptom or goal', 'Recent rain/irrigation', 'Your district or nearest mandi if it is a market question'])}<br><br>
    <b>Example:</b> "Cotton, 60 days, leaves curling and white insects under leaves."`;
}

function predictCrop(input) {
  const rainfall = Number(input.rainfall || 650);
  const temperature = Number(input.temperature || 26);
  const nitrogen = Number(input.nitrogen || 90);
  const area = Number(input.area || 10);
  const irrigationFactor = Number(input.irrigationFactor || 1.2);

  const base = 1.2 + (rainfall / 1200) * 1.8 + (nitrogen / 200) * 1.4;
  const tempBonus = temperature >= 18 && temperature <= 32 ? 0.5 : -0.4;
  const yieldVal = Math.max(0.4, (base + tempBonus) * irrigationFactor);
  const bestCrop = crops.find(c => rainfall >= c.rain[0] && rainfall <= c.rain[1] && temperature >= c.temp[0] && temperature <= c.temp[1]) || crops[0];
  const totalYield = Math.round(yieldVal * area * 10);
  const revenue = totalYield * bestCrop.price;
  const trend = [0.93, 0.96, 1, 1.04, 1.09, 1.13].map(v => Math.round(bestCrop.price * v));

  return {
    rainfall,
    temperature,
    nitrogen,
    area,
    yieldPerAcre: Number(yieldVal.toFixed(1)),
    totalYield,
    revenue,
    crop: bestCrop,
    trend
  };
}

function normaliseListing(body) {
  const name = String(body.name || '').trim();
  const qty = String(body.qty || '').trim();
  const rawPrice = String(body.price || '').trim();
  const location = String(body.location || '').trim();
  const grade = String(body.grade || 'A-grade').trim();
  if (!name || !qty || !rawPrice) return null;

  const emojis = { tomato: '🍅', wheat: '🌾', onion: '🧅', rice: '🌿', cotton: '🌸', potato: '🥔', chilli: '🌶️', mango: '🥭', corn: '🌽' };
  const price = rawPrice.startsWith('₹') ? rawPrice : `₹${rawPrice}/kg`;
  return {
    id: `listing-${Date.now()}`,
    name,
    farmer: `You · ${location || 'Your farm'}`,
    qty,
    price,
    grade: grade.split(' ')[0],
    emoji: emojis[name.toLowerCase()] || '🌱',
    bg: '#E1F5EE',
    isOwn: true,
    createdAt: new Date().toISOString()
  };
}

const diseaseDatabase = [
  {
    disease: 'Early Blight',
    confidence: 87,
    severity: 'Medium',
    crop: 'Tomato crop',
    affectedArea: '~30% of leaves',
    treatment: 'Mancozeb 75% WP - 2.5g/L',
    frequency: 'Every 10-14 days',
    recovery: '7-10 days',
    prevention: 'Remove infected leaves and avoid overhead irrigation'
  },
  {
    disease: 'Wheat Rust',
    confidence: 91,
    severity: 'High',
    crop: 'Wheat crop',
    affectedArea: '~40% of leaf surface',
    treatment: 'Propiconazole 25% EC - 1ml/L',
    frequency: 'Repeat every 12-14 days',
    recovery: '10-14 days',
    prevention: 'Use resistant varieties and remove volunteer wheat plants'
  },
  {
    disease: 'Powdery Mildew',
    confidence: 84,
    severity: 'Medium',
    crop: 'Grape/Cucumber crop',
    affectedArea: '~25% of leaf surface',
    treatment: 'Sulfur dust 2% or Karathane 0.5ml/L',
    frequency: 'Every 7-10 days',
    recovery: '5-7 days',
    prevention: 'Improve air circulation and reduce humidity'
  },
  {
    disease: 'Leaf Spot (Septoria)',
    confidence: 85,
    severity: 'Medium',
    crop: 'Wheat/Barley crop',
    affectedArea: '~35% of leaves',
    treatment: 'Mancozeb 75% WP - 2g/L',
    frequency: 'Every 12 days',
    recovery: '8-10 days',
    prevention: 'Remove crop residue and use resistant varieties'
  },
  {
    disease: 'Brown Spot',
    confidence: 88,
    severity: 'High',
    crop: 'Rice crop',
    affectedArea: '~45% of leaves',
    treatment: 'Carbendazim 50% WP - 1g/L',
    frequency: 'Repeat every 10 days',
    recovery: '10-12 days',
    prevention: 'Balanced nitrogen fertilization and good drainage'
  },
  {
    disease: 'Bacterial Blight',
    confidence: 82,
    severity: 'High',
    crop: 'Cotton crop',
    affectedArea: '~50% of leaves and bolls',
    treatment: 'Streptomycin 90% + Tetracycline 10% - 2ml/L',
    frequency: 'Every 7-10 days',
    recovery: '12-14 days',
    prevention: 'Use clean seed and resistant varieties'
  },
  {
    disease: 'Downy Mildew',
    confidence: 83,
    severity: 'Medium',
    crop: 'Mustard/Radish crop',
    affectedArea: '~20% of leaves',
    treatment: 'Mancozeb 75% WP - 2.5g/L',
    frequency: 'Every 10-14 days',
    recovery: '6-8 days',
    prevention: 'Avoid overhead irrigation and improve air flow'
  },
  {
    disease: 'Yellow Vein Mosaic',
    confidence: 79,
    severity: 'High',
    crop: 'Okra crop',
    affectedArea: '~60% of plant',
    treatment: 'Spray Imidacloprid 17.8% - 0.5ml/L for whitefly control',
    frequency: 'Every 7 days',
    recovery: '14-21 days',
    prevention: 'Control whitefly vectors and use resistant varieties'
  },
  {
    disease: 'Alternaria Leaf Spot',
    confidence: 86,
    severity: 'Medium',
    crop: 'Potato crop',
    affectedArea: '~30% of foliage',
    treatment: 'Mancozeb 75% WP - 2.5g/L or Chlorothalonil 75% WP',
    frequency: 'Every 10 days',
    recovery: '8-10 days',
    prevention: 'Remove infected leaves and improve spacing'
  },
  {
    disease: 'Scab Disease',
    confidence: 80,
    severity: 'High',
    crop: 'Apple/Pear crop',
    affectedArea: '~40% of fruit surface',
    treatment: 'Copper oxychloride 50% WP - 2.5g/L',
    frequency: 'Every 10-14 days',
    recovery: '12-15 days',
    prevention: 'Prune infected branches and maintain good ventilation'
  },
  {
    disease: 'Healthy Crop',
    confidence: 94,
    severity: 'Low',
    crop: 'Crop sample',
    affectedArea: 'No visible infection',
    treatment: 'No chemical treatment needed',
    frequency: 'Monitor weekly',
    recovery: 'Already healthy',
    prevention: 'Maintain balanced irrigation and field sanitation'
  }
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function findDiseaseByKeyword(text) {
  const t = String(text || '').toLowerCase();
  const keywordMap = [
    { keys: ['healthy', 'normal', 'good'], disease: 'Healthy Crop' },
    { keys: ['rust'], disease: 'Wheat Rust' },
    { keys: ['powder', 'mildew'], disease: 'Powdery Mildew' },
    { keys: ['downy'], disease: 'Downy Mildew' },
    { keys: ['bacterial', 'blight'], disease: 'Bacterial Blight' },
    { keys: ['brown'], disease: 'Brown Spot' },
    { keys: ['mosaic', 'vein'], disease: 'Yellow Vein Mosaic' },
    { keys: ['scab'], disease: 'Scab Disease' },
    { keys: ['alternaria'], disease: 'Alternaria Leaf Spot' },
    { keys: ['spot', 'septoria'], disease: 'Leaf Spot (Septoria)' }
  ];

  const hit = keywordMap.find(entry => entry.keys.some(key => t.includes(key)));
  return hit ? diseaseDatabase.find(d => d.disease === hit.disease) : null;
}

function selectDiseaseByImage(dataUrl, filename) {
  const byFilename = findDiseaseByKeyword(filename);
  if (byFilename) return byFilename;

  const parts = String(dataUrl || '').split(',');
  const header = parts[0] || '';
  const payload = parts[1] || '';

  if (!payload) {
    const fallbackIndex = hashString(`${header}|${filename}`) % diseaseDatabase.length;
    return diseaseDatabase[fallbackIndex];
  }

  const payloadLen = payload.length;
  const sampleSize = Math.min(2400, payloadLen);
  const stride = Math.max(1, Math.floor(payloadLen / sampleSize));
  let sampled = '';

  for (let i = 0; i < payloadLen && sampled.length < sampleSize; i += stride) {
    sampled += payload[i];
  }

  const midStart = Math.max(0, Math.floor(payloadLen / 2) - 300);
  const tailStart = Math.max(0, payloadLen - 600);
  const fingerprint = [
    header,
    filename,
    payloadLen,
    payload.slice(0, 600),
    payload.slice(midStart, midStart + 600),
    payload.slice(tailStart),
    sampled
  ].join('|');

  const imageHash = hashString(fingerprint);
  const modifier = (payloadLen + hashString(filename || '') + hashString(header)) % diseaseDatabase.length;
  const index = (imageHash + modifier) % diseaseDatabase.length;
  return diseaseDatabase[index];
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, app: 'AgriSmart', timestamp: new Date().toISOString() });
  }

  if (req.method === 'POST' && url.pathname === '/api/chat') {
    const body = await readBody(req);
    return sendJson(res, 200, { reply: getAIReply(body.message) });
  }

  if (req.method === 'POST' && url.pathname === '/api/detect') {
    try {
      const body = await readBody(req);
      
      // Validate request body
      if (!body || typeof body !== 'object') {
        return sendJson(res, 400, { error: 'Invalid request body' });
      }
      
      const filename = String(body.filename || 'uploaded-leaf.jpg').trim();
      const dataUrl = String(body.dataUrl || '').trim();
      
      // Validate dataUrl is present and is a data URL
      if (!dataUrl.startsWith('data:image/')) {
        return sendJson(res, 400, { error: 'Invalid image data' });
      }
      
      // Validate filename is reasonable length
      if (filename.length > 255) {
        return sendJson(res, 400, { error: 'Filename too long' });
      }
      
      let result;
      
      // Detection logic - select disease based on image data hash
      try {
        result = selectDiseaseByImage(dataUrl, filename);
      } catch (err) {
        console.error('Detection logic error:', err);
        result = {
          disease: 'Unable to determine',
          confidence: 0,
          severity: 'Unknown',
          crop: 'Crop sample',
          affectedArea: 'Analysis failed',
          treatment: 'Please consult a local agricultural expert',
          frequency: 'N/A',
          recovery: 'N/A',
          prevention: 'Professional diagnosis recommended'
        };
      }
      
      // Validate result before storing
      if (!result.disease || typeof result.confidence !== 'number') {
        return sendJson(res, 500, { error: 'Internal detection error' });
      }
      
      // Store detection record with error handling
      try {
        insertDetection({
          id: `detect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename: filename.substring(0, 255),
          disease: String(result.disease).substring(0, 255),
          confidence: Math.max(0, Math.min(100, parseInt(result.confidence) || 0)),
          severity: String(result.severity).substring(0, 100),
          createdAt: new Date().toISOString()
        });
      } catch (dbErr) {
        console.error('Database insert error:', dbErr);
        // Don't fail the response if DB insert fails - return result anyway
      }
      
      return sendJson(res, 200, { ...result, filename });
    } catch (error) {
      console.error('API detect error:', error);
      return sendJson(res, 500, { error: 'Detection service error', message: error?.message });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/predict') {
    const body = await readBody(req);
    return sendJson(res, 200, predictCrop(body));
  }

  if (req.method === 'GET' && url.pathname === '/api/market') {
    return sendJson(res, 200, {
      rows: mandiData,
      priceAlerts: Object.keys(priceForecasts).map(check_price_trend),
      compare: {
        labels: ['Bangalore', 'Udupi', 'Hassan', 'Mangalore', 'Shivamogga', 'Mysore'],
        data: [2240, 2180, 2210, 2090, 2130, 2160]
      }
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/price-trend') {
    return sendJson(res, 200, check_price_trend(url.searchParams.get('product')));
  }

  if (req.method === 'GET' && url.pathname === '/api/listings') {
    const listings = readListings();
    return sendJson(res, 200, { listings: [...seedListings, ...listings], myListings: listings });
  }

  if (req.method === 'POST' && url.pathname === '/api/listings') {
    const body = await readBody(req);
    const listing = normaliseListing(body);
    if (!listing) return sendJson(res, 400, { error: 'Crop name, quantity, and price are required.' });
    insertListing(listing);
    const listings = readListings();
    return sendJson(res, 201, { listing, listings: [...seedListings, ...listings], myListings: listings });
  }

  if (req.method === 'GET' && url.pathname === '/api/orders') {
    return sendJson(res, 200, { orders: readOrders() });
  }

  if (req.method === 'POST' && url.pathname === '/api/orders') {
    const body = await readBody(req);
    const order = {
      id: `order-${Date.now()}`,
      name: String(body.name || 'Crop order'),
      price: String(body.price || ''),
      quantity: String(body.quantity || '1 unit'),
      buyer: String(body.buyer || 'Demo Buyer'),
      phone: String(body.phone || '+91 98765 43210'),
      status: 'Placed',
      createdAt: new Date().toISOString()
    };
    insertOrder(order);
    return sendJson(res, 201, { order, orders: readOrders() });
  }

  return sendJson(res, 404, { error: 'API route not found.' });
}

function serveStatic(req, res, url) {
  const requestPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(ROOT, requestPath));
  if (!filePath.startsWith(ROOT)) return sendText(res, 403, 'Forbidden');

  fs.readFile(filePath, (err, data) => {
    if (err) return sendText(res, 404, 'Not found');
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8'
    };
    sendText(res, 200, data, types[ext] || 'application/octet-stream');
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
    } else {
      serveStatic(req, res, url);
    }
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Server error' });
  }
});

server.listen(PORT, () => {
  ensureDb();
  console.log(`AgriSmart running at http://localhost:${PORT}`);
});
