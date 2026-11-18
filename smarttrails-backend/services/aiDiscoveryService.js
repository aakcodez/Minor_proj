const { GoogleGenAI } = require('@google/genai');
const db = require('../db');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ALLOWED_CATEGORIES = [
  'Nature', 'Beaches', 'Heritage and Historical Places', 'Trekking',
  'Adventure', 'Waterfalls', 'Wildlife', 'Hill Stations',
  'Spiritual and Religious Places', 'Food and Culture'
];

// Validate coordinates lie inside Karnataka
function isInsideKarnataka(lat, lng) {
  return lat >= 11.4 && lat <= 18.6 && lng >= 73.8 && lng <= 78.8;
}

// Step 1: Fetch real factual places from Google Places API
async function fetchGooglePlacesKarnataka(queryText) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is missing in .env');

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    queryText + ' tourist attractions in Karnataka India'
  )}&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${data.status}`);
  }

  return (data.results || []).filter((p) => {
    const lat = p.geometry?.location?.lat;
    const lng = p.geometry?.location?.lng;
    return lat && lng && isInsideKarnataka(lat, lng);
  });
}

// Step 2: Use Gemini to classify & summarize real Google Places (Zero hallucination)
async function classifyPlacesWithGemini(destinationName, rawPlaces) {
  if (!rawPlaces.length) return [];

  const factualInput = rawPlaces.map((p) => ({
    place_id: p.place_id,
    name: p.name,
    address: p.formatted_address,
    types: p.types,
    rating: p.rating || 4.5
  }));

  const prompt = `
You are a Karnataka tourism data classifier for SmartTrails Karnataka.
Classify ONLY the provided factual places in ${destinationName}, Karnataka. Do NOT invent new places.
Allowed categories: ${JSON.stringify(ALLOWED_CATEGORIES)}.

Input places:
${JSON.stringify(factualInput)}

Return ONLY a JSON array where each item has:
- "place_id": exact place_id from input
- "category": one exact value from the allowed categories list
- "description": concise 1-2 sentence tourist summary
- "estimated_visit_duration": number in hours (e.g., 1.5, 2.0)
- "approximate_entry_fee": realistic Indian citizen entry fee in INR (number, 0 if free)
- "best_time_to_visit": e.g., "Morning (07:00 AM - 10:00 AM)" or "Sunset (04:30 PM - 06:30 PM)"
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  return JSON.parse(response.text || '[]');
}

// Step 3: Discover, Validate, Deduplicate & Store in MySQL
async function discoverAndStoreAttractions(destinationId, destinationName, autoVerify = false) {
  const googleResults = await fetchGooglePlacesKarnataka(destinationName);
  const classified = await classifyPlacesWithGemini(destinationName, googleResults.slice(0, 10));

  const savedRecords = [];
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

  for (const raw of googleResults.slice(0, 10)) {
    const aiMeta = classified.find((c) => c.place_id === raw.place_id);
    if (!aiMeta) continue;

    // Prevent duplicate entries using Google Place ID
    const [existing] = await db.query(
      'SELECT attraction_id FROM attractions WHERE place_reference_id = ?',
      [raw.place_id]
    );
    if (existing.length > 0) continue;

    const photoRef = raw.photos?.[0]?.photo_reference;
    const imageUrl = photoRef
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${mapsKey}`
      : null;

    const category = ALLOWED_CATEGORIES.includes(aiMeta.category)
      ? aiMeta.category
      : 'Heritage and Historical Places';

    const [insertResult] = await db.query(
      `INSERT INTO attractions 
       (destination_id, attraction_name, category, description, latitude, longitude, 
        estimated_visit_duration, approximate_entry_fee, best_time_to_visit, image_url, 
        place_reference_id, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        destinationId,
        raw.name,
        category,
        aiMeta.description,
        raw.geometry.location.lat,
        raw.geometry.location.lng,
        Number(aiMeta.estimated_visit_duration) || 1.5,
        Number(aiMeta.approximate_entry_fee) || 0,
        aiMeta.best_time_to_visit || 'Morning (08:00 AM - 11:00 AM)',
        imageUrl,
        raw.place_id,
        autoVerify ? 1 : 0
      ]
    );

    savedRecords.push({
      attraction_id: insertResult.insertId,
      attraction_name: raw.name,
      category,
      is_verified: autoVerify
    });
  }

  return savedRecords;
}

module.exports = { discoverAndStoreAttractions, isInsideKarnataka };