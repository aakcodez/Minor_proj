require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// --- 1. MONGODB CONNECTION & SCHEMA ---
let isMongoConnected = false;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vibeka_db';

const PlaceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, default: 'Attractions', index: true }, // Attractions | Food & Cafes | Stays
  subCategory: { type: String, default: 'Landmark', index: true },  // Temples | Waterfalls | Forts & Heritage | Nature & Hills | Beaches | Food & Cafes | Stays
  city: { type: String, index: true },
  district: { type: String, required: true, index: true },
  latitude: Number,
  longitude: Number,
  rating: { type: Number, default: 4.7 },
  reviews: { type: String, default: '14.2K' },
  entryFeeINR: { type: Number, default: 0 },
  price: { type: String, default: 'Free Entry' },
  durationHours: { type: Number, default: 2 },
  duration: { type: String, default: '2 hrs' },
  timings: { type: String, default: '06:00 AM – 06:00 PM' },
  vibeTags: [String],
  localTips: String,
  description: String,
  image_url: String,
  source: { type: String, default: 'Wikidata-SPARQL-KG' },
  updatedAt: { type: Date, default: Date.now }
});

const TripSchema = new mongoose.Schema({
  destination: { type: String, required: true },
  days: { type: Number, default: 2 },
  budgetINR: { type: Number, default: 5000 },
  dates: String,
  travelers: String,
  preferences: String,
  createdAt: { type: Date, default: Date.now }
});

const CommunityPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, default: 'VibeKA Explorer' },
  district: String,
  summary: String,
  image_url: String,
  likes: { type: Number, default: 12 },
  placesCount: { type: Number, default: 4 },
  createdAt: { type: Date, default: Date.now }
});

const PlaceCache = mongoose.model('PlaceCache', PlaceSchema);
const Trip = mongoose.model('Trip', TripSchema);
const CommunityPost = mongoose.model('CommunityPost', CommunityPostSchema);

// --- 2. EXACT CITY & TOWN COORDINATES + 31 DISTRICT CENTERS ---
const CITY_CENTERS = {
  hubli: { label: 'Hubli', district: 'Dharwad', lat: 15.3647, lon: 75.1240, radiusKm: 16 },
  hubballi: { label: 'Hubballi', district: 'Dharwad', lat: 15.3647, lon: 75.1240, radiusKm: 16 },
  dharwad: { label: 'Dharwad', district: 'Dharwad', lat: 15.4589, lon: 75.0078, radiusKm: 16 },
  madikeri: { label: 'Madikeri', district: 'Kodagu', lat: 12.4244, lon: 75.7382, radiusKm: 18 },
  kushalnagar: { label: 'Kushalnagar', district: 'Kodagu', lat: 12.4588, lon: 75.9598, radiusKm: 18 },
  virajpet: { label: 'Virajpet', district: 'Kodagu', lat: 12.1952, lon: 75.8037, radiusKm: 20 },
  coorg: { label: 'Coorg (Kodagu)', district: 'Kodagu', lat: 12.3375, lon: 75.8069, radiusKm: 35 },
  hampi: { label: 'Hampi', district: 'Vijayanagara', lat: 15.3350, lon: 76.4600, radiusKm: 15 },
  hospet: { label: 'Hosapete', district: 'Vijayanagara', lat: 15.2689, lon: 76.3909, radiusKm: 15 },
  hosapete: { label: 'Hosapete', district: 'Vijayanagara', lat: 15.2689, lon: 76.3909, radiusKm: 15 },
  gokarna: { label: 'Gokarna', district: 'Uttara Kannada', lat: 14.5479, lon: 74.3188, radiusKm: 15 },
  karwar: { label: 'Karwar', district: 'Uttara Kannada', lat: 14.8136, lon: 74.1297, radiusKm: 18 },
  dandeli: { label: 'Dandeli', district: 'Uttara Kannada', lat: 15.2361, lon: 74.6173, radiusKm: 22 },
  murudeshwar: { label: 'Murudeshwar', district: 'Uttara Kannada', lat: 14.0943, lon: 74.4845, radiusKm: 15 },
  sirsi: { label: 'Sirsi', district: 'Uttara Kannada', lat: 14.6195, lon: 74.8354, radiusKm: 22 },
  badami: { label: 'Badami', district: 'Bagalkote', lat: 15.9149, lon: 75.6768, radiusKm: 15 },
  pattadakal: { label: 'Pattadakal', district: 'Bagalkote', lat: 15.9481, lon: 75.8167, radiusKm: 12 },
  aihole: { label: 'Aihole', district: 'Bagalkote', lat: 16.0191, lon: 75.8825, radiusKm: 12 },
  belur: { label: 'Belur', district: 'Hassan', lat: 13.1628, lon: 75.8655, radiusKm: 15 },
  halebidu: { label: 'Halebidu', district: 'Hassan', lat: 13.2131, lon: 75.9942, radiusKm: 15 },
  sakleshpur: { label: 'Sakleshpur', district: 'Hassan', lat: 12.9442, lon: 75.7866, radiusKm: 22 },
  shravanabelagola: { label: 'Shravanabelagola', district: 'Hassan', lat: 12.8573, lon: 76.4883, radiusKm: 15 },
  mangalore: { label: 'Mangaluru', district: 'Dakshina Kannada', lat: 12.9141, lon: 74.8560, radiusKm: 18 },
  mangaluru: { label: 'Mangaluru', district: 'Dakshina Kannada', lat: 12.9141, lon: 74.8560, radiusKm: 18 },
  manipal: { label: 'Manipal', district: 'Udupi', lat: 13.3525, lon: 74.7928, radiusKm: 14 },
  malpe: { label: 'Malpe', district: 'Udupi', lat: 13.3524, lon: 74.7037, radiusKm: 12 },
  kollur: { label: 'Kollur', district: 'Udupi', lat: 13.8639, lon: 74.8147, radiusKm: 18 },
  agumbe: { label: 'Agumbe', district: 'Shivamogga', lat: 13.5024, lon: 75.0906, radiusKm: 18 },
  jog: { label: 'Jog Falls', district: 'Shivamogga', lat: 14.2294, lon: 74.8124, radiusKm: 18 },
  sagar: { label: 'Sagara', district: 'Shivamogga', lat: 14.1670, lon: 75.0403, radiusKm: 20 },
  chikmagalur: { label: 'Chikkamagaluru', district: 'Chikkamagaluru', lat: 13.3161, lon: 75.7720, radiusKm: 28 },
  kemmanagundi: { label: 'Kemmanagundi', district: 'Chikkamagaluru', lat: 13.5481, lon: 75.7583, radiusKm: 18 },
  sringeri: { label: 'Sringeri', district: 'Chikkamagaluru', lat: 13.4198, lon: 75.2567, radiusKm: 18 },
  'nandi hills': { label: 'Nandi Hills', district: 'Chikkaballapura', lat: 13.3702, lon: 77.6835, radiusKm: 15 },
  srirangapatna: { label: 'Srirangapatna', district: 'Mandya', lat: 12.4237, lon: 76.6829, radiusKm: 14 },
  bandipur: { label: 'Bandipur', district: 'Chamarajanagar', lat: 11.6664, lon: 76.6292, radiusKm: 22 },
  bangalore: { label: 'Bengaluru', district: 'Bengaluru Urban', lat: 12.9716, lon: 77.5946, radiusKm: 22 },
  bengaluru: { label: 'Bengaluru', district: 'Bengaluru Urban', lat: 12.9716, lon: 77.5946, radiusKm: 22 },
  mysore: { label: 'Mysuru', district: 'Mysuru', lat: 12.2958, lon: 76.6394, radiusKm: 20 },
  bijapur: { label: 'Vijayapura', district: 'Vijayapura', lat: 16.8302, lon: 75.7100, radiusKm: 20 },
  gulbarga: { label: 'Kalaburagi', district: 'Kalaburagi', lat: 17.3297, lon: 76.8343, radiusKm: 20 },
  bellary: { label: 'Ballari', district: 'Ballari', lat: 15.1394, lon: 76.9214, radiusKm: 22 },
  belgaum: { label: 'Belagavi', district: 'Belagavi', lat: 15.8497, lon: 74.4977, radiusKm: 22 },
  shimoga: { label: 'Shivamogga', district: 'Shivamogga', lat: 13.9299, lon: 75.5681, radiusKm: 25 }
};

const DISTRICT_CENTERS = {
  'Bagalkote': { lat: 16.1691, lon: 75.6615 },
  'Ballari': { lat: 15.1394, lon: 76.9214 },
  'Belagavi': { lat: 15.8497, lon: 74.4977 },
  'Bengaluru Rural': { lat: 13.2846, lon: 77.6078 },
  'Bengaluru Urban': { lat: 12.9716, lon: 77.5946 },
  'Bidar': { lat: 17.9104, lon: 77.5199 },
  'Chamarajanagar': { lat: 11.9261, lon: 76.9437 },
  'Chikkaballapura': { lat: 13.4355, lon: 77.7315 },
  'Chikkamagaluru': { lat: 13.3161, lon: 75.7720 },
  'Chitradurga': { lat: 14.2251, lon: 76.3980 },
  'Dakshina Kannada': { lat: 12.8438, lon: 75.2479 },
  'Davanagere': { lat: 14.4644, lon: 75.9218 },
  'Dharwad': { lat: 15.4589, lon: 75.0078 },
  'Gadag': { lat: 15.4315, lon: 75.6355 },
  'Hassan': { lat: 13.0068, lon: 76.0996 },
  'Haveri': { lat: 14.7951, lon: 75.3991 },
  'Kalaburagi': { lat: 17.3297, lon: 76.8343 },
  'Kodagu': { lat: 12.3375, lon: 75.8069 },
  'Kolar': { lat: 13.1362, lon: 78.1291 },
  'Koppal': { lat: 15.3547, lon: 76.1548 },
  'Mandya': { lat: 12.5218, lon: 76.8951 },
  'Mysuru': { lat: 12.2958, lon: 76.6394 },
  'Raichur': { lat: 16.2120, lon: 77.3439 },
  'Ramanagara': { lat: 12.7150, lon: 77.2813 },
  'Shivamogga': { lat: 13.9299, lon: 75.5681 },
  'Tumakuru': { lat: 13.3379, lon: 77.1173 },
  'Udupi': { lat: 13.3409, lon: 74.7421 },
  'Uttara Kannada': { lat: 14.7937, lon: 74.6869 },
  'Vijayanagara': { lat: 15.2689, lon: 76.3909 },
  'Vijayapura': { lat: 16.8302, lon: 75.7100 },
  'Yadgir': { lat: 16.7700, lon: 77.1300 }
};

// --- 3. HAVERSINE DISTANCE & SUB-CATEGORY CLASSIFIER ---
function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifySubCategory(name = '', desc = '', category = 'Attractions') {
  if (category === 'Food & Cafes') return 'Food & Cafes';
  if (category === 'Stays') return 'Stays';
  const text = `${name} ${desc}`.toLowerCase();
  if (/temple|matha|basadi|shrine|mosque|church|gurudwara|linga|devalaya|ishwara|swamy|devi/.test(text)) return 'Temples & Shrines';
  if (/waterfall|falls|cascad/.test(text)) return 'Waterfalls';
  if (/fort|palace|monument|tomb|ruins|heritage|archaeological|cave|museum|mahal/.test(text)) return 'Forts & Heritage';
  if (/beach|island|coast|sea|cove/.test(text)) return 'Beaches & Coast';
  if (/sanctuary|national park|wildlife|forest|tiger|elephant|bird/.test(text)) return 'Wildlife & Safari';
  if (/hill|peak|betta|giri|lake|garden|park|viewpoint|dam|river/.test(text)) return 'Nature & Lakes';
  return 'Attractions';
}

function detectRequestedSubCategory(query) {
  const q = query.toLowerCase();
  if (/temple|shrine|spiritual|darshan|matha|church|mosque/.test(q)) return 'Temples & Shrines';
  if (/waterfall|falls/.test(q)) return 'Waterfalls';
  if (/fort|palace|heritage|history|monument|cave|museum/.test(q)) return 'Forts & Heritage';
  if (/beach|island|coast/.test(q)) return 'Beaches & Coast';
  if (/wildlife|safari|sanctuary|forest/.test(q)) return 'Wildlife & Safari';
  if (/hill|lake|garden|park|nature|viewpoint/.test(q)) return 'Nature & Lakes';
  if (/cafe|food|restaurant|eat|dosa|coffee|breakfast/.test(q)) return 'Food & Cafes';
  if (/stay|resort|hotel|homestay/.test(q)) return 'Stays';
  return null;
}

function resolveLocationTarget(query) {
  const q = query.toLowerCase();
  // 1. Check specific city/town first (e.g., "hubli" stays locked to Hubli lat/lon!)
  for (const [key, info] of Object.entries(CITY_CENTERS)) {
    if (q.includes(key)) {
      return {
        displayName: info.label,
        district: info.district,
        lat: info.lat,
        lon: info.lon,
        radiusKm: info.radiusKm,
        isSpecificCity: true
      };
    }
  }
  // 2. Otherwise check full district name
  const dist = Object.keys(DISTRICT_CENTERS).find((d) => q.includes(d.toLowerCase()));
  if (dist) {
    return {
      displayName: dist,
      district: dist,
      lat: DISTRICT_CENTERS[dist].lat,
      lon: DISTRICT_CENTERS[dist].lon,
      radiusKm: 35,
      isSpecificCity: false
    };
  }
  return null;
}

// --- 4. LIVE CITY-CENTERED WIKIPEDIA GEOSEARCH + OVERPASS DISCOVERY ---
async function discoverCityPlaces(target, desiredSubCat = null) {
  const results = [];
  try {
    if (desiredSubCat === 'Food & Cafes' || desiredSubCat === 'Stays') {
      const osmTag = desiredSubCat === 'Stays'
        ? 'node["tourism"~"hotel|resort|guest_house"]'
        : 'node["amenity"~"restaurant|cafe"]';
      const overpassQuery = `[out:json][timeout:8];(${osmTag}(around:10000,${target.lat},${target.lon}););out body 10;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: overpassQuery });
      const data = await res.json();
      for (const el of data.elements || []) {
        if (!el.tags?.name) continue;
        const fee = desiredSubCat === 'Stays' ? 2500 : 300;
        results.push({
          name: el.tags.name,
          category: desiredSubCat,
          subCategory: desiredSubCat,
          city: target.displayName,
          district: target.district,
          latitude: Number(el.lat.toFixed(4)),
          longitude: Number(el.lon.toFixed(4)),
          rating: 4.6,
          reviews: '7.4K',
          entryFeeINR: fee,
          price: desiredSubCat === 'Stays' ? `₹${fee}/night` : `₹${fee} for two`,
          durationHours: desiredSubCat === 'Stays' ? 12 : 1,
          duration: desiredSubCat === 'Stays' ? 'Overnight' : '1 hr',
          timings: desiredSubCat === 'Stays' ? '24 Hours Check-in' : '07:30 AM – 10:30 PM',
          localTips: el.tags?.cuisine ? `Known for ${el.tags.cuisine} dishes.` : `Located right in ${target.displayName}.`,
          description: `Verified ${desiredSubCat.toLowerCase()} in ${target.displayName}, ${target.district}.`,
          image_url: '',
          source: 'OpenStreetMap-City'
        });
      }
    } else {
      // Search Wikipedia strictly within target.radiusKm (e.g. 15km around Hubli, NOT Dharwad!)
      const radiusMeters = Math.min(20000, target.radiusKm * 1000);
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${target.lat}|${target.lon}&ggsradius=${radiusMeters}&ggslimit=15&prop=coordinates|pageimages|extracts&exintro&explaintext&exsentences=1&pithumbsize=700&format=json&origin=*`;
      const res = await fetch(wikiUrl);
      const data = await res.json();
      const pages = Object.values(data?.query?.pages || {});

      for (const p of pages) {
        if (/district|taluk|constituency|division|railway|airport|corporation|university|college|school/i.test(p.title)) continue;
        const lat = p.coordinates?.[0]?.lat;
        const lon = p.coordinates?.[0]?.lon;
        if (!lat || !lon) continue;

        const subCat = classifySubCategory(p.title, p.extract || '', 'Attractions');
        results.push({
          name: p.title,
          category: 'Attractions',
          subCategory: subCat,
          city: target.displayName,
          district: target.district,
          latitude: Number(lat.toFixed(4)),
          longitude: Number(lon.toFixed(4)),
          rating: 4.7,
          reviews: '14.8K',
          entryFeeINR: subCat === 'Temples & Shrines' ? 0 : 25,
          price: subCat === 'Temples & Shrines' ? 'Free Entry' : '₹25 Entry',
          durationHours: 1.5,
          duration: '1.5 hrs',
          timings: subCat === 'Temples & Shrines' ? '06:00 AM – 08:30 PM' : '06:00 AM – 06:30 PM',
          localTips: `Located in ${target.displayName} (${getDistanceKm(target.lat, target.lon, lat, lon).toFixed(1)} km from center).`,
          description: p.extract || `${subCat} landmark in ${target.displayName}, Karnataka.`,
          image_url: p.thumbnail?.source || '',
          source: 'Wikipedia-CityGeo'
        });
      }
    }
  } catch (e) {}
  return results;
}

// --- 5. TIME & BUDGET SCHEDULE BUILDER ---
function buildTimeAndBudgetSummary(places, days = 2, budgetINR = 5000) {
  const maxStops = Math.min(places.length, days * 3);
  const selected = places.slice(0, maxStops);
  const slots = ['09:00 AM (Morning)', '01:30 PM (Afternoon)', '05:00 PM (Evening)'];

  const schedule = selected.map((p, idx) => ({
    day: Math.floor(idx / 3) + 1,
    slot: slots[idx % 3],
    place: p.name,
    subCategory: p.subCategory || p.category,
    duration: p.duration || `${p.durationHours || 2} hrs`,
    entryFeeINR: p.entryFeeINR || 0,
    timings: p.timings || '06:00 AM – 06:00 PM'
  }));

  const totalEntryFees = selected.reduce((sum, p) => sum + (Number(p.entryFeeINR) || 0), 0);
  const estimatedFood = days * 700;
  const estimatedStay = Math.max(0, days - 1) * 2200;
  const totalEstimatedINR = totalEntryFees + estimatedFood + estimatedStay;

  return {
    days,
    userBudgetINR: budgetINR,
    totalEntryFeesINR: totalEntryFees,
    estimatedFoodINR: estimatedFood,
    estimatedStayINR: estimatedStay,
    totalEstimatedINR,
    withinBudget: totalEstimatedINR <= budgetINR,
    schedule
  };
}

// --- 6. CONNECT MONGODB & AUTO-TAG EXISTING 264 PLACES ---
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2500 })
  .then(async () => {
    isMongoConnected = true;
    // Backfill subCategory on existing records if missing
    const untagged = await PlaceCache.find({ $or: [{ subCategory: { $exists: false } }, { subCategory: null }] });
    for (const doc of untagged) {
      doc.subCategory = classifySubCategory(doc.name, doc.description, doc.category);
      await doc.save().catch(() => {});
    }
    const count = await PlaceCache.countDocuments();
    console.log(`✅ MongoDB Connected: vibeka_db (${count} categorized places ready)`);
  })
  .catch((err) => console.warn('⚠️ MongoDB offline:', err.message));

// --- 7. PRECISION CITY + CATEGORY PLANNER API ---
app.post('/api/chat', async (req, res) => {
  const { message = '', category = 'Attractions', subCategory = '', days = 2, budgetINR = 5000 } = req.body;
  const cleanQuery = message.trim() || 'Mysuru';

  const dayMatch = cleanQuery.match(/(\d+)\s*day/i);
  const budgetMatch = cleanQuery.match(/(?:₹|rs\.?|inr|under|budget)\s*(\d{3,6})/i);
  const parsedDays = dayMatch ? Number(dayMatch[1]) : Number(days) || 2;
  const parsedBudget = budgetMatch ? Number(budgetMatch[1]) : Number(budgetINR) || 5000;
  const desiredCount = Math.min(12, Math.max(6, parsedDays * 3));

  const target = resolveLocationTarget(cleanQuery);
  const requestedSubCat = subCategory || detectRequestedSubCategory(cleanQuery) || (category !== 'Attractions' ? category : null);

  let candidates = [];

  if (isMongoConnected && target) {
    // Query all places in that district, then rank strictly by proximity to the exact city center!
    const dbPlaces = await PlaceCache.find({ district: new RegExp(`^${target.district}$`, 'i') }).lean();
    candidates = dbPlaces.map((p) => ({
      ...p,
      subCategory: p.subCategory || classifySubCategory(p.name, p.description, p.category),
      distanceKm: Number(getDistanceKm(target.lat, target.lon, p.latitude, p.longitude).toFixed(1))
    }));

    // If user asked for a specific city (e.g. "Hubli"), keep ONLY places within radiusKm (16 km) of Hubli!
    if (target.isSpecificCity) {
      candidates = candidates.filter((p) => p.distanceKm <= target.radiusKm);
    }
  } else if (isMongoConnected) {
    const words = cleanQuery.replace(/[₹,\d]/g, '').split(/\s+/).filter((w) => w.length > 3);
    if (words.length > 0) {
      const regexes = words.map((k) => new RegExp(k, 'i'));
      const dbPlaces = await PlaceCache.find({
        $or: [{ name: { $in: regexes } }, { description: { $in: regexes } }, { subCategory: { $in: regexes } }]
      }).limit(20).lean();
      candidates = dbPlaces.map((p) => ({
        ...p,
        subCategory: p.subCategory || classifySubCategory(p.name, p.description, p.category)
      }));
    }
  }

  // If city-specific radius has fewer than 5 places (or user asked for Temples/Cafes/Stays), discover live around that exact city!
  if (target && (candidates.length < 5 || requestedSubCat)) {
    const discovered = await discoverCityPlaces(target, requestedSubCat);
    for (const doc of discovered) {
      const distKm = Number(getDistanceKm(target.lat, target.lon, doc.latitude, doc.longitude).toFixed(1));
      if (distKm <= target.radiusKm && !candidates.some((c) => c.name.toLowerCase() === doc.name.toLowerCase())) {
        candidates.push({ ...doc, distanceKm: distKm });
        if (isMongoConnected) {
          await PlaceCache.findOneAndUpdate({ name: doc.name }, doc, { upsert: true, returnDocument: 'after' }).catch(() => {});
        }
      }
    }
  }

  // Filter by requested subCategory (e.g. "Temples & Shrines", "Waterfalls", "Food & Cafes") if specified
  let filtered = requestedSubCat
    ? candidates.filter((p) => (p.subCategory || '').toLowerCase() === requestedSubCat.toLowerCase() || (p.category || '').toLowerCase() === requestedSubCat.toLowerCase())
    : candidates;

  if (filtered.length === 0) filtered = candidates;

  // Sort: Closest to the exact city first, then places with photos
  filtered = filtered
    .sort((a, b) => {
      const distDiff = (a.distanceKm ?? 50) - (b.distanceKm ?? 50);
      if (Math.abs(distDiff) > 5) return distDiff;
      return (b.image_url ? 1 : 0) - (a.image_url ? 1 : 0);
    })
    .slice(0, desiredCount);

  // Collect all distinct subCategories present in this city/district for frontend filter pills
  const availableCategories = ['All', ...new Set(candidates.map((p) => p.subCategory).filter(Boolean))];

  const planSummary = buildTimeAndBudgetSummary(filtered, parsedDays, parsedBudget);
  const label = target ? target.displayName : cleanQuery;

  return res.json({
    status: 'success',
    reply: `Showing ${filtered.length} verified ${requestedSubCat || 'places'} right in ${label} (${parsedDays}-day plan • Est. ₹${planSummary.totalEstimatedINR} vs ₹${parsedBudget} budget).`,
    suggestedQuestions: target
      ? [
          `Temples in ${target.displayName}`,
          `Food & Cafes in ${target.displayName}`,
          `Stays in ${target.displayName}`
        ]
      : [
          `Temples in Hubli`,
          `Waterfalls in Coorg`,
          `Forts & Heritage in Bidar`
        ],
    places: filtered,
    availableCategories,
    planSummary
  });
});

// --- 8. TRIPS & COMMUNITY CRUD ---
app.get('/api/trips', async (req, res) => {
  res.json(isMongoConnected ? await Trip.find().sort({ createdAt: -1 }) : []);
});

app.post('/api/trips', async (req, res) => {
  if (isMongoConnected) return res.status(201).json(await Trip.create(req.body));
  res.status(201).json(req.body);
});

app.delete('/api/trips/:id', async (req, res) => {
  if (isMongoConnected) await Trip.findByIdAndDelete(req.params.id);
  res.json({ deleted: true });
});

app.get('/api/community', async (req, res) => {
  if (isMongoConnected) {
    const posts = await CommunityPost.find().sort({ createdAt: -1 });
    if (posts.length > 0) return res.json(posts);
    return res.json([
      { _id: 'g1', title: '2-Day Coffee & Mist Trail in Madikeri', author: 'Ananya R.', district: 'Kodagu', summary: 'Waterfalls, viewpoints & coffee estates.', likes: 28, placesCount: 6, image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Abbey_Falls_Coorg.jpg?width=700' },
      { _id: 'g2', title: 'Hampi Temples & Boulder Heritage Circuit', author: 'Karthik M.', district: 'Vijayanagara', summary: 'UNESCO stone temples & boulder sunsets.', likes: 41, placesCount: 6, image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Virupaksha_Temple_in_Hampi.jpg?width=700' },
      { _id: 'g3', title: 'Hubli Temples, Lakes & Local Food Trail', author: 'Sneha K.', district: 'Dharwad', summary: 'Unkal Lake, Chandramouleshwara Temple & Hubli eats.', likes: 35, placesCount: 6, image_url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Unkal_Lake_Hubli.jpg?width=700' }
    ]);
  }
  res.json([]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 VibeKA City-Precision & Categorized Server on http://localhost:${PORT}`));
