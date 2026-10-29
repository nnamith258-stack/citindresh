const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'agrismart.sqlite');

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
  Wheat: [{ day: 'Today', price: 2240 }, { day: 'Tomorrow', price: 2265 }, { day: 'Day 2', price: 2290 }, { day: 'Day 3', price: 2310 }],
  Tomato: [{ day: 'Today', price: 1950 }, { day: 'Tomorrow', price: 1840 }, { day: 'Day 2', price: 1760 }, { day: 'Day 3', price: 1680 }],
  Rice: [{ day: 'Today', price: 2100 }, { day: 'Tomorrow', price: 2125 }, { day: 'Day 2', price: 2150 }, { day: 'Day 3', price: 2140 }],
  Cotton: [{ day: 'Today', price: 6600 }, { day: 'Tomorrow', price: 6660 }, { day: 'Day 2', price: 6725 }, { day: 'Day 3', price: 6810 }],
  Mustard: [{ day: 'Today', price: 5400 }, { day: 'Tomorrow', price: 5320 }, { day: 'Day 2', price: 5260 }, { day: 'Day 3', price: 5290 }],
  Onion: [{ day: 'Today', price: 1500 }, { day: 'Tomorrow', price: 1535 }, { day: 'Day 2', price: 1580 }, { day: 'Day 3', price: 1620 }]
};

let db;

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
  `);
}

function readListings() {
  ensureDb();
  return db.prepare('SELECT * FROM listings ORDER BY created_at DESC').all().map(row => ({
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
  }));
}

function readOrders() {
  ensureDb();
  return db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all().map(row => ({
    id: row.id,
    name: row.name,
    price: row.price,
    quantity: row.quantity,
    buyer: row.buyer,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at
  }));
}

function insertListing(listing) {
  ensureDb();
  db.prepare(`
    INSERT INTO listings (id, name, farmer, qty, price, grade, emoji, bg, is_own, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(listing.id, listing.name, listing.farmer, listing.qty, listing.price, listing.grade, listing.emoji, listing.bg, 1, listing.createdAt);
}

function insertOrder(order) {
  ensureDb();
  db.prepare(`
    INSERT INTO orders (id, name, price, quantity, buyer, phone, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(order.id, order.name, order.price, order.quantity, order.buyer, order.phone, order.status, order.createdAt);
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    const timeout = setTimeout(() => {
      req.destroy();
      reject(new Error('Request timed out.'));
    }, 30_000);

    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        clearTimeout(timeout);
        req.destroy();
        reject(new Error('Request body is too large.'));
      }
    });
    req.on('end', () => {
      clearTimeout(timeout);
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error(`Invalid JSON body: ${error.message}`));
      }
    });
    req.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function checkPriceTrend(product) {
  const requested = String(product || 'Tomato').trim().toLowerCase();
  const productName = Object.keys(priceForecasts).find(name => name.toLowerCase() === requested) || 'Tomato';
  const forecast = priceForecasts[productName];
  const today = forecast[0];
  const nextDays = forecast.slice(1);
  const lowerDays = nextDays.filter(day => day.price < today.price);
  const higherDays = nextDays.filter(day => day.price > today.price);
  const bestDay = forecast.reduce((best, day) => day.price > best.price ? day : best, today);

  if (lowerDays.length && !higherDays.length) {
    const worstDrop = lowerDays.reduce((lowest, day) => day.price < lowest.price ? day : lowest, lowerDays[0]);
    return {
      product: productName,
      status: 'drop',
      recommendation: 'Sell Today',
      message: `Sell Today — ${productName} is ₹${today.price}/Q today and may drop to ₹${worstDrop.price}/Q by ${worstDrop.day}.`,
      today,
      bestDay: today,
      expectedDrop: today.price - worstDrop.price,
      forecast
    };
  }
  if (!lowerDays.length && higherDays.length) {
    return {
      product: productName,
      status: 'rise',
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
    recommendation: 'Monitor',
    message: `Stable prices — ${productName} should remain around ₹${today.price}/Q over the next 3 days.`,
    today,
    bestDay,
    forecast
  };
}

function normaliseListing(body) {
  const name = String(body.name || '').trim().slice(0, 100);
  const qty = String(body.qty || '').trim().slice(0, 50);
  const rawPrice = String(body.price || '').trim();
  const location = String(body.location || '').trim().slice(0, 100);
  const grade = String(body.grade || 'A-grade').trim().slice(0, 40);
  const numericPrice = Number(rawPrice.replace(/[₹,]/g, ''));
  if (!name || !qty || !Number.isFinite(numericPrice) || numericPrice <= 0) return null;

  const emojis = { tomato: '🍅', wheat: '🌾', onion: '🧅', rice: '🌿', cotton: '🌸', potato: '🥔', chilli: '🌶️', mango: '🥭', corn: '🌽' };
  return {
    id: `listing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    farmer: `Farmer · ${location || 'Your farm'}`,
    qty,
    price: `₹${numericPrice}/kg`,
    grade: grade.split(' ')[0],
    emoji: emojis[name.toLowerCase()] || '🌱',
    bg: '#E1F5EE',
    createdAt: new Date().toISOString()
  };
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, app: 'AgriSmart', timestamp: new Date().toISOString() });
  }
  if (req.method === 'GET' && url.pathname === '/api/market') {
    return sendJson(res, 200, {
      rows: mandiData,
      priceAlerts: Object.keys(priceForecasts).map(checkPriceTrend),
      compare: {
        labels: ['Bangalore', 'Udupi', 'Hassan', 'Mangalore', 'Shivamogga', 'Mysore'],
        data: [2240, 2180, 2210, 2090, 2130, 2160]
      }
    });
  }
  if (req.method === 'GET' && url.pathname === '/api/price-trend') {
    return sendJson(res, 200, checkPriceTrend(url.searchParams.get('product')));
  }
  if (req.method === 'GET' && url.pathname === '/api/listings') {
    const listings = readListings();
    return sendJson(res, 200, { listings: [...seedListings, ...listings], myListings: listings });
  }
  if (req.method === 'POST' && url.pathname === '/api/listings') {
    const listing = normaliseListing(await readBody(req));
    if (!listing) return sendJson(res, 400, { error: 'Crop name, quantity, and a valid price are required.' });
    insertListing(listing);
    const listings = readListings();
    return sendJson(res, 201, { listing, listings: [...seedListings, ...listings], myListings: listings });
  }
  if (req.method === 'GET' && url.pathname === '/api/orders') {
    return sendJson(res, 200, { orders: readOrders() });
  }
  if (req.method === 'POST' && url.pathname === '/api/orders') {
    const body = await readBody(req);
    const name = String(body.name || '').trim().slice(0, 100);
    const price = String(body.price || '').trim().slice(0, 50);
    const quantity = String(body.quantity || '').trim().slice(0, 50);
    if (!name || !price || !quantity) return sendJson(res, 400, { error: 'Product, price, and quantity are required.' });
    const order = {
      id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      price,
      quantity,
      buyer: String(body.buyer || 'Marketplace buyer').slice(0, 100),
      phone: String(body.phone || '').slice(0, 40),
      status: 'Placed',
      createdAt: new Date().toISOString()
    };
    insertOrder(order);
    return sendJson(res, 201, { order, orders: readOrders() });
  }
  return sendJson(res, 404, { error: 'API route not found.' });
}

function serveStatic(req, res, url) {
  let requestPath;
  try {
    requestPath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  } catch {
    return sendText(res, 400, 'Invalid path');
  }
  const filePath = path.resolve(ROOT, `.${requestPath}`);
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) return sendText(res, 403, 'Forbidden');
  fs.readFile(filePath, (error, data) => {
    if (error) return sendText(res, 404, 'Not found');
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8'
    };
    sendText(res, 200, data, types[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
    else serveStatic(req, res, url);
  } catch (error) {
    if (!res.headersSent) sendJson(res, 500, { error: error.message || 'Server error' });
  }
});

server.listen(PORT, () => {
  ensureDb();
  console.log(`AgriSmart running at http://localhost:${PORT}`);
});
