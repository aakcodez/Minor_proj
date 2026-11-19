const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require("fs");
const path = require("path");
const KARNATAKA_31_DISTRICTS = require("./data/karnataka31Districts");
const VERIFIED_DB_PATH = path.join(__dirname, "data", "karnataka_verified_pois.json");
const VERIFIED_POI_DB = fs.existsSync(VERIFIED_DB_PATH) ? JSON.parse(fs.readFileSync(VERIFIED_DB_PATH, "utf8")) : {};
const { geocodeKarnatakaPlace, fetchVerifiedPOIs } = require('./services/geoPlaceEngine');

const app = express();
app.use(cors());
app.use(express.json());

const USER_AGENT = 'SmartTrails-Karnataka-GeoRAG/1.0';
const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
const groqKey = (process.env.GROQ_API_KEY || '').trim();

const ai = geminiKey && !geminiKey.includes('PASTE') && !geminiKey.includes('YOUR_') && geminiKey.startsWith('AIza')
  ? new GoogleGenAI({ apiKey: geminiKey })
  : null;

async function askAI(systemPrompt, userPrompt, temp = 0.4) {
  if (groqKey && !groqKey.includes('PASTE') && !groqKey.includes('YOUR_')) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: temp
        })
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return JSON.parse(text);
    } catch (err) {
      console.warn('Groq issue:', err.message);
    }
  }

  if (ai) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\nRequest: ${userPrompt}`,
      config: { responseMimeType: 'application/json', temperature: temp }
    });
    const clean = (response.text || '').replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
    if (clean) return JSON.parse(clean);
  }

  throw new Error('Add a valid GROQ_API_KEY or GEMINI_API_KEY in smarttrails-backend/.env');
}

const CURATED_FALLBACKS = [
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mysore_Palace_Morning.jpg/960px-Mysore_Palace_Morning.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Hampi_virupaksha_temple.jpg/960px-Hampi_virupaksha_temple.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Jog_Falls_05092014.jpg/960px-Jog_Falls_05092014.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Badami_cave_temples.jpg/960px-Badami_cave_temples.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Gol_Gumbaz2.jpg/960px-Gol_Gumbaz2.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Mullayanagiri_peak.jpg/960px-Mullayanagiri_peak.jpg"
];

async function getPlaceImage(placeName, cityHint = "Karnataka", index = 0) {
  const queries = [`${placeName} ${cityHint}`, `${placeName} Karnataka`, placeName];

  // Pass 1: Wikipedia Article PageImages
  for (const q of queries) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=3&prop=pageimages&pithumbsize=800&format=json&origin=*`;
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      const data = await res.json();
      const pages = Object.values(data?.query?.pages || {});
      for (const p of pages) {
        const src = p?.thumbnail?.source;
        if (src && !src.includes(".svg") && !src.includes("Flag_of") && !src.includes("Map")) {
          return src;
        }
      }
    } catch (_) {}
  }

  // Pass 2: Wikimedia Commons Photo Repository (gsrnamespace=6) for regional towns & attractions
  try {
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(placeName + " " + cityHint)}&gsrnamespace=6&gsrlimit=4&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
    const cRes = await fetch(commonsUrl, { headers: { "User-Agent": USER_AGENT } });
    const cData = await cRes.json();
    for (const p of Object.values(cData?.query?.pages || {})) {
      const thumb = p?.imageinfo?.[0]?.thumburl;
      if (thumb && /\.(jpg|jpeg|png|webp)/i.test(thumb)) {
        return thumb;
      }
    }
  } catch (_) {}

  return CURATED_FALLBACKS[index % CURATED_FALLBACKS.length];
}

// 0. ALL 31 DISTRICTS REGISTRY
app.get('/api/districts', (req, res) => {
  const { division = 'All', q = '' } = req.query;
  let list = KARNATAKA_31_DISTRICTS;
  if (division && division !== 'All') {
    list = list.filter((d) => d.division.toLowerCase() === division.toLowerCase());
  }
  if (q.trim()) {
    const term = q.trim().toLowerCase();
    list = list.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.headquarters.toLowerCase().includes(term) ||
        d.topPlaces.some((p) => p.toLowerCase().includes(term)) || (d.taluks || []).some((t) => t.toLowerCase().includes(term))
    );
  }
  res.json({ total: list.length, districts: list });
});

// 1. GEO-RANKED DESTINATION RECOMMENDATIONS ACROSS ALL 31 DISTRICTS
app.post('/api/recommendations', async (req, res) => {
  const {
    startingLocation = 'Bengaluru',
    interests = ['Nature'],
    travellers = 2,
    days = 2,
    travelType = 'Couple',
    budgetINR = 10000
  } = req.body;

  const startGeo = await geocodeKarnatakaPlace(startingLocation);
  const matchingPool = KARNATAKA_31_DISTRICTS.filter((d) =>
    d.categories.some((c) => interests.includes(c))
  );
  const pool = matchingPool.length >= 6 ? matchingPool : KARNATAKA_31_DISTRICTS;

  const candidates = [...pool]
    .sort((a, b) => {
      if (!startGeo) return Math.random() - 0.5;
      const dA = Math.hypot(a.latitude - startGeo.latitude, a.longitude - startGeo.longitude);
      const dB = Math.hypot(b.latitude - startGeo.latitude, b.longitude - startGeo.longitude);
      const reachPenaltyA = days <= 2 && dA > 3.4 ? 8 : 0;
      const reachPenaltyB = days <= 2 && dB > 3.4 ? 8 : 0;
      return dA + reachPenaltyA - (dB + reachPenaltyB) + (Math.random() * 1.2 - 0.6);
    })
    .slice(0, 8);

  const candidateList = candidates
    .map((d) => `- ${d.name} District (HQ: ${d.headquarters}, Lat: ${d.latitude}, Lng: ${d.longitude}, Key Places: ${d.topPlaces.join(', ')})`)
    .join('\n');

  const sysPrompt = `
You are SmartTrails Karnataka's Geo-RAG travel recommender.
Select 4 DISTINCT destinations from these verified Karnataka districts for a ${days}-day ${travelType} trip (${travellers} travellers) starting from "${startingLocation}" with total group budget ₹${budgetINR} and interests: ${interests.join(', ')}.

Verified District Candidates:
${candidateList}

Return ONLY valid JSON:
{
  "recommendations": [
    {
      "destination_id": 1,
      "destination_name": "Official District Name",
      "district": "Official District Name",
      "description": "2-sentence overview",
      "latitude": 15.3350,
      "longitude": 76.4600,
      "approximate_visit_duration": "${days} Days",
      "matched_interests": ["Interest 1", "Interest 2"],
      "why_recommended": "2-sentence explanation referencing travel distance from ${startingLocation}, matched interests, and ₹${budgetINR} group budget.",
      "important_attractions": ["Verified Place 1", "Verified Place 2", "Verified Place 3"],
      "estimated_group_cost_inr": 7500
    }
  ]
}`;

  try {
    const data = await askAI(sysPrompt, JSON.stringify(req.body), 0.6);
    const enriched = await Promise.all(
      (data.recommendations || []).slice(0, 4).map(async (item, idx) => ({
        ...item,
        destination_id: idx + 1,
        image_url: await getPlaceImage(item.important_attractions?.[0] || item.destination_name, item.district || 'Karnataka', idx),
        within_budget: (Number(item.estimated_group_cost_inr) || 0) <= budgetINR
      }))
    );
    res.json({ recommendations: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.message });
  }
});

// 2. WANDERBOAT-STYLE ID-ONLY GOLDEN DATABASE ITINERARY BUILDER (ZERO HALLUCINATION)
app.post("/api/itinerary/generate", async (req, res) => {
  const {
    destinationName = "Mysuru",
    startingLocation = "Bengaluru",
    days = 2,
    travellers = 2,
    travelType = "Couple",
    budgetINR = 10000,
    interests = []
  } = req.body;

  try {
    const geo = (await geocodeKarnatakaPlace(destinationName)) || {
      name: destinationName,
      district: destinationName,
      latitude: 12.2958,
      longitude: 76.6394
    };

    const distRecord = KARNATAKA_31_DISTRICTS.find(
      (d) =>
        d.name.toLowerCase().includes(geo.name.toLowerCase()) ||
        geo.name.toLowerCase().includes(d.name.toLowerCase()) ||
        d.headquarters.toLowerCase() === geo.name.toLowerCase() ||
        (d.taluks || []).some((t) => t.toLowerCase() === geo.name.toLowerCase())
    );

    // Load Golden Verified POIs for the matched district (or live Geo-RAG if custom town)
    const goldenList =
      distRecord && VERIFIED_POI_DB[distRecord.name]?.pois?.length
        ? VERIFIED_POI_DB[distRecord.name].pois
        : await fetchVerifiedPOIs(geo.latitude, geo.longitude, distRecord, 45000);

    // Ensure every Golden POI has a guaranteed valid poi_id and high-res photo
    const catalog = goldenList.map((p, idx) => ({
      ...p,
      poi_id: String(p.poi_id || `poi-${idx + 1}`),
      image_url: p.image_url || CURATED_FALLBACKS[idx % CURATED_FALLBACKS.length]
    }));

    const catalogById = new Map(catalog.map((p) => [p.poi_id, p]));
    const catalogPromptLines = catalog
      .map((p) => `[${p.poi_id}] ${p.attraction_name} (${p.category}) — ${p.description}`)
      .join("\n");

    const targetDays = Math.max(1, Math.min(10, Number(days) || 2));

    // LLM acts STRICTLY as an ID sequencer & storyteller — forbidden from inventing names or coordinates!
    const sysPrompt = `
You are SmartTrails Karnataka's route sequencer.
Select the best verified place IDs from the Golden Catalog below for a ${targetDays}-day ${travelType} trip (${travellers} travellers) in "${geo.name}" (${distRecord?.name || geo.district}, Karnataka) with total group budget ₹${budgetINR} and interests: ${interests.join(", ") || "General"}.

GOLDEN VERIFIED CATALOG (Return ONLY these exact poi_id strings!):
${catalogPromptLines}

Rules:
1. Pick 3 UNIQUE poi_id values per day (Morning, Midday, Evening). NEVER repeat a poi_id across days.
2. Put up to 4 remaining unused poi_id values into "extra_poi_ids".
3. Write a concise 1-2 sentence visitor description for each selected stop.

Return ONLY valid JSON:
{
  "overview": "2-sentence personalized summary of this ${geo.name} trip",
  "days": [
    {
      "day": 1,
      "theme": "Day 1 Theme",
      "stops": [
        { "poi_id": "${catalog[0]?.poi_id || "1-1"}", "slot": "09:00 AM • Morning", "description": "Factual visitor guide", "duration": 1.5, "entry_fee": 20 }
      ]
    }
  ],
  "extra_poi_ids": ["${catalog[3]?.poi_id || ""}"],
  "estimatedTotalCostINR": 7600
}`;

    const aiPlan = await askAI(sysPrompt, `Sequence ${targetDays}-day trip for ${geo.name}`, 0.3);

    // Hydrate 100% of names, GPS coordinates, photos & sources from Golden Catalog
    const usedIds = new Set();
    const slots = ["09:00 AM • Morning", "12:30 PM • Midday", "04:00 PM • Evening"];
    const hydratedDays = [];

    for (let dNum = 1; dNum <= targetDays; dNum++) {
      const rawDay = (aiPlan.days || [])[dNum - 1] || {};
      const dayStops = [];

      for (const st of rawDay.stops || []) {
        const id = String(st?.poi_id || "").trim();
        const verified = catalogById.get(id);
        if (verified && !usedIds.has(id)) {
          usedIds.add(id);
          dayStops.push({
            attraction_id: verified.poi_id,
            attraction_name: verified.attraction_name,
            category: verified.category || "Heritage & Nature",
            slot: st.slot || slots[dayStops.length] || "04:00 PM • Evening",
            description: st.description || verified.description,
            latitude: verified.latitude,
            longitude: verified.longitude,
            estimated_visit_duration: Number(st.duration) || 1.5,
            approximate_entry_fee: Number(st.entry_fee) || 20,
            image_url: verified.image_url,
            verified_source: verified.source || "Golden Karnataka DB"
          });
        }
      }

      // Deterministically backfill any remaining slot with unused Golden POIs
      for (const candidate of catalog) {
        if (dayStops.length >= 3) break;
        if (!usedIds.has(candidate.poi_id)) {
          usedIds.add(candidate.poi_id);
          dayStops.push({
            attraction_id: candidate.poi_id,
            attraction_name: candidate.attraction_name,
            category: candidate.category || "Heritage & Nature",
            slot: slots[dayStops.length] || "04:00 PM • Evening",
            description: candidate.description,
            latitude: candidate.latitude,
            longitude: candidate.longitude,
            estimated_visit_duration: 1.5,
            approximate_entry_fee: 20,
            image_url: candidate.image_url,
            verified_source: candidate.source || "Golden Karnataka DB"
          });
        }
      }

      hydratedDays.push({
        day: dNum,
        theme: (rawDay.theme && String(rawDay.theme).trim()) || `${geo.name} Highlights — Day ${dNum}`,
        stops: dayStops
      });
    }

    const availableAttractions = catalog
      .filter((c) => !usedIds.has(c.poi_id))
      .slice(0, 5)
      .map((c) => ({
        attraction_id: c.poi_id,
        attraction_name: c.attraction_name,
        category: c.category || "Landmark",
        description: c.description,
        latitude: c.latitude,
        longitude: c.longitude,
        estimated_visit_duration: 1.5,
        approximate_entry_fee: 20,
        image_url: c.image_url,
        verified_source: c.source || "Golden Karnataka DB"
      }));

    const rawEst = Number(aiPlan.estimatedTotalCostINR);
    const minRealistic = Math.max(2400, targetDays * travellers * 950);
    const est = rawEst >= 1500 ? rawEst : Math.min(Number(budgetINR) || 10000, minRealistic);

    res.json({
      destination: {
        destination_name: distRecord ? distRecord.name : geo.name,
        district: distRecord ? distRecord.name : geo.district,
        latitude: distRecord ? distRecord.latitude : geo.latitude,
        longitude: distRecord ? distRecord.longitude : geo.longitude
      },
      overview: aiPlan.overview || `Curated ${targetDays}-day itinerary across verified landmarks in ${geo.name}.`,
      dayPlans: hydratedDays,
      availableAttractions,
      budgetSummary: {
        totalBudgetINR: Number(budgetINR) || 10000,
        estimatedTotalCostINR: est,
        perPersonCostINR: Math.round(est / Math.max(1, travellers)),
        withinBudget: est <= (Number(budgetINR) || 10000),
        warning:
          est > (Number(budgetINR) || 10000)
            ? `Estimated cost (₹${est.toLocaleString("en-IN")}) exceeds your ₹${Number(budgetINR).toLocaleString("en-IN")} budget.`
            : null,
        breakdown: {
          accommodationINR: Math.round(est * 0.38),
          foodINR: Math.round(est * 0.28),
          transportINR: Math.round(est * 0.26),
          entryAndActivitiesINR: Math.round(est * 0.08)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.message });
  }
});

// 3. SMART SEARCH / CHAT ENDPOINT (GEOCODES ANY KARNATAKA PLACE OR TYPO!)
app.post('/api/chat', async (req, res) => {
  const { message = '', preferences = {} } = req.body;
  try {
    const parsed = await askAI(
      `Extract the Karnataka destination/town/district name (correcting any spelling mistakes like "mysur"->"Mysuru", "chikmaglur"->"Chikkamagaluru", "hubli"->"Hubballi"), trip days, and INR budget from the user message.
Return ONLY JSON: {"place": "Corrected Karnataka Place Name", "days": 2, "budgetINR": 10000}`,
      message,
      0.1
    );

    const targetPlace = (parsed.place || message).trim();

    const resp = await fetch(`http://127.0.0.1:${process.env.PORT || 5000}/api/itinerary/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationName: targetPlace,
        startingLocation: preferences.startingLocation || 'Bengaluru',
        days: Number(parsed.days) || Number(preferences.days) || 2,
        travellers: Number(preferences.travellers) || 2,
        travelType: preferences.travelType || 'Couple',
        budgetINR: Number(parsed.budgetINR) || Number(preferences.budgetINR) || 10000,
        interests: preferences.interests || []
      })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 4. SINGLE-PLACE DEEP DIVE (WANDERBOAT "TELL ME MORE ABOUT..." FEATURE)
app.post("/api/place/details", async (req, res) => {
  const { query = "Lalbagh Botanical Garden" } = req.body;
  try {
    const geo = (await geocodeKarnatakaPlace(query)) || {
      name: query,
      district: "Karnataka",
      latitude: 12.9507,
      longitude: 77.5848
    };

    // Fetch up to 4 real Wikimedia/Wikipedia photos for the horizontal story reel
    const photos = [];
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(geo.name + " Karnataka")}&gsrlimit=6&prop=pageimages|extracts&exintro=1&explaintext=1&exsentences=2&pithumbsize=800&format=json&origin=*`;
      const wRes = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      const wData = await wRes.json();
      for (const p of Object.values(wData?.query?.pages || {})) {
        if (p?.thumbnail?.source && !p.thumbnail.source.includes(".svg") && !photos.includes(p.thumbnail.source)) {
          photos.push(p.thumbnail.source);
        }
        if (photos.length >= 4) break;
      }
    } catch (_) {}

    while (photos.length < 3) {
      photos.push(CURATED_FALLBACKS[photos.length % CURATED_FALLBACKS.length]);
    }

    const sysPrompt = `
You are SmartTrails Karnataka's local place concierge (like Wanderboat's single-place guide).
The user asked: "${query}" (Resolved place: ${geo.name}, ${geo.district}, Lat: ${geo.latitude}, Lng: ${geo.longitude}).

Return ONLY valid JSON:
{
  "place_name": "${geo.name}",
  "category": "Garden / Monument / Waterfall / Temple / Beach",
  "neighborhood": "Exact area & district in Karnataka",
  "hours": "Open daily 6:00 AM - 7:00 PM",
  "rating": "4.6",
  "reviews_count": "18.4K",
  "summary": "2-3 sentence engaging local overview mentioning exact timings and area.",
  "pick_note": "2-sentence insider tip on the best time to visit and what makes it special.",
  "highlights": ["Must-see spot 1 inside/at the place", "Must-see spot 2", "Must-see spot 3"],
  "reel_captions": [
    "Short 8-word traveler vibe caption 1",
    "Short 8-word traveler vibe caption 2",
    "Short 8-word traveler vibe caption 3"
  ],
  "follow_ups": [
    "What should I see there first?",
    "Any good local food or cafés nearby?",
    "Best time of day to avoid crowds?"
  ]
}`;

    const details = await askAI(sysPrompt, query, 0.4);
    res.json({
      ...details,
      latitude: geo.latitude,
      longitude: geo.longitude,
      photos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 5. WANDERBOAT STAYS + SPLIT-SCREEN PROPERTY DETAIL VIEW
app.post("/api/stays", async (req, res) => {
  const {
    city = "Bengaluru",
    checkIn = "Nov 23",
    checkOut = "Nov 25",
    guests = "1 room, 2 guests",
    vibe = "Heritage, coffee estate & boutique stays"
  } = req.body;

  const geo = (await geocodeKarnatakaPlace(city)) || {
    name: city,
    district: "Karnataka",
    latitude: 12.9716,
    longitude: 77.5946
  };

  const sysPrompt = `
You are SmartTrails Karnataka's Stays & Property Concierge (matching Wanderboat Hotel's full property view).
Recommend 6 real, well-known hotels, coffee estate homestays, or heritage resorts in or near "${geo.name}" (${geo.district}, Karnataka) for ${guests} (${checkIn} - ${checkOut}) matching: "${vibe}".
Each stay MUST include rich property details, room tiers in INR, a guest review snippet, and nearby landmarks.

Return ONLY valid JSON:
{
  "city": "${geo.name}",
  "stays": [
    {
      "stay_id": 1,
      "name": "Real Hotel / Resort / Homestay Name",
      "address": "Exact Street / Area, ${geo.name}, Karnataka",
      "area": "Exact Neighborhood / Taluk, ${geo.name}",
      "rating": "8.9",
      "label": "Superb",
      "reviews": "1.2K",
      "original_price_inr": 6500,
      "price_per_night_inr": 4800,
      "tag": "Coffee Estate / Heritage / Boutique",
      "highlights_text": "3-sentence engaging property highlights describing rooms, dining, views, and complimentary breakfast/Wi-Fi.",
      "guest_review": "2-sentence authentic-sounding guest review praising location, hospitality, and comfort.",
      "reviewer_name": "Verified Guest • Couple",
      "rooms": [
        { "type": "Deluxe Garden View Room", "bed": "1 King Bed • Breakfast Included", "price_inr": 4800 },
        { "type": "Heritage Verandah Suite", "bed": "1 King Bed + Balcony • All Meals", "price_inr": 7200 }
      ],
      "nearby": ["Nearby Attraction 1 (1.2 km)", "Nearby Attraction 2 (3.5 km)", "Local Cafe / Market (0.8 km)"],
      "latitude": ${geo.latitude},
      "longitude": ${geo.longitude}
    }
  ]
}`;

  const STAY_GALLERY_POOL = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
  ];

  try {
    const data = await askAI(sysPrompt, JSON.stringify(req.body), 0.45);
    const enrichedStays = await Promise.all(
      (data.stays || []).slice(0, 6).map(async (st, idx) => {
        const primaryImg = await getPlaceImage(st.name, geo.name, idx);
        const gallery = [
          primaryImg,
          STAY_GALLERY_POOL[(idx + 1) % STAY_GALLERY_POOL.length],
          STAY_GALLERY_POOL[(idx + 2) % STAY_GALLERY_POOL.length],
          STAY_GALLERY_POOL[(idx + 3) % STAY_GALLERY_POOL.length],
          STAY_GALLERY_POOL[(idx + 4) % STAY_GALLERY_POOL.length],
          STAY_GALLERY_POOL[(idx + 5) % STAY_GALLERY_POOL.length],
          STAY_GALLERY_POOL[(idx + 6) % STAY_GALLERY_POOL.length]
        ];
        return {
          ...st,
          latitude: Number(st.latitude) || geo.latitude + (idx - 2) * 0.008,
          longitude: Number(st.longitude) || geo.longitude + (idx % 2 === 0 ? 0.007 : -0.007),
          image_url: primaryImg,
          gallery
        };
      })
    );
    res.json({ city: geo.name, stays: enrichedStays });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 6. CONVERSATIONAL ITINERARY REFINEMENT ("WHAT'S THE MOVE?" FOLLOW-UPS)
app.post("/api/itinerary/refine", async (req, res) => {
  const { currentItinerary, instruction } = req.body;
  if (!currentItinerary || !instruction) {
    return res.status(400).json({ error: "Missing currentItinerary or instruction" });
  }

  try {
    const distName = currentItinerary.destination?.district || currentItinerary.destination?.destination_name || "Mysuru";
    const distRecord = KARNATAKA_31_DISTRICTS.find(
      (d) => d.name.toLowerCase().includes(distName.toLowerCase()) || distName.toLowerCase().includes(d.name.toLowerCase())
    );
    const catalog = (distRecord && VERIFIED_POI_DB[distRecord.name]?.pois) || [];
    const catalogById = new Map(catalog.map((p) => [String(p.poi_id), p]));

    const catalogLines = catalog
      .map((p) => `[${p.poi_id}] ${p.attraction_name} (${p.category}) — ${p.description}`)
      .join("\n");

    const currentSummary = (currentItinerary.dayPlans || [])
      .map((d) => `Day ${d.day} (${d.theme}): ${(d.stops || []).map((st) => `[${st.attraction_id}] ${st.attraction_name}`).join(", ")}`)
      .join("\n");

    const sysPrompt = `
You are SmartTrails Karnataka's conversational trip editor (like Wanderboat's follow-up chat).
The user has this active itinerary in ${distName}:
${currentSummary}

Available verified places in ${distName} (use ONLY these exact poi_id strings):
${catalogLines}

User follow-up request: "${instruction}"

Update the itinerary to satisfy the user's request while keeping 3 unique stops per day.
Return ONLY valid JSON:
{
  "reply": "1-2 sentence conversational response explaining what you updated",
  "days": [
    {
      "day": 1,
      "theme": "Updated Day 1 Theme",
      "stops": [
        { "poi_id": "17-1", "slot": "09:00 AM • Morning", "description": "Updated visitor tip", "duration": 1.5, "entry_fee": 20 }
      ]
    }
  ]
}`;

    const aiUpdate = await askAI(sysPrompt, instruction, 0.35);
    const usedIds = new Set();
    const slots = ["09:00 AM • Morning", "12:30 PM • Midday", "04:00 PM • Evening"];

    const updatedDayPlans = (currentItinerary.dayPlans || []).map((origDay, idx) => {
      const rawDay = (aiUpdate.days || [])[idx] || {};
      const stops = [];

      for (const st of rawDay.stops || []) {
        const id = String(st?.poi_id || "").trim();
        const verified = catalogById.get(id);
        if (verified && !usedIds.has(id)) {
          usedIds.add(id);
          stops.push({
            attraction_id: verified.poi_id,
            attraction_name: verified.attraction_name,
            category: verified.category || "Heritage",
            slot: st.slot || slots[stops.length] || "04:00 PM • Evening",
            description: st.description || verified.description,
            latitude: verified.latitude,
            longitude: verified.longitude,
            estimated_visit_duration: Number(st.duration) || 1.5,
            approximate_entry_fee: Number(st.entry_fee) || 20,
            image_url: verified.image_url,
            verified_source: verified.source || "Golden Karnataka DB"
          });
        }
      }

      // Keep original stops if AI returned empty for that day
      if (stops.length === 0) return origDay;

      return {
        day: origDay.day,
        theme: rawDay.theme || origDay.theme,
        stops
      };
    });

    res.json({
      reply: aiUpdate.reply || "Updated your Karnataka route based on your request!",
      updatedItinerary: {
        ...currentItinerary,
        dayPlans: updatedDayPlans
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`⚡ SmartTrails Geo-RAG Engine (OSM + Wiki + 31 Districts) running on port ${PORT}`));
