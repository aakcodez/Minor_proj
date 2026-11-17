const axios = require('axios');

/**
 * Fetches real-time places from Google Places API (Text Search)
 */
async function fetchDynamicPlaces(category, region = 'Karnataka') {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  // If no API key is set, fall back to open-source Overpass API (OpenStreetMap)
  if (!apiKey) {
    return fetchOpenStreetMapPlaces(category, region);
  }

  const query = `${category} places to visit in ${region}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

  const response = await axios.get(url);
  
  if (response.data.status !== 'OK') {
    throw new Error(`Google Places Error: ${response.data.status}`);
  }

  // Normalize response to match your engine's expected schema
  return response.data.results.map((place, index) => ({
    id: place.place_id || index + 1,
    name: place.name,
    category: category,
    district: place.formatted_address.split(',').slice(-3, -2)[0]?.trim() || region,
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    rating: place.rating || 4.5,
    entry_fee_inr: Math.floor(Math.random() * 200) + 50, // Default estimate if fee is unavailable
    opening_hours: place.opening_hours?.open_now ? 'Open Now' : '9:00 AM - 6:00 PM',
    best_time_to_visit: 'Morning / Sunset',
    image_url: place.photos?.[0]
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`
      : 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80',
    vibe_tag: place.types?.[0] || 'Popular Spot'
  }));
}

/**
 * Free fallback using OpenStreetMap Overpass API (no API key required)
 */
async function fetchOpenStreetMapPlaces(category, region) {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  const query = `
    [out:json][timeout:25];
    area["name"="Karnataka"]->.searchArea;
    (
      node["tourism"="attraction"](area.searchArea);
      node["historic"](area.searchArea);
    );
    out body 20;
  `;

  const res = await axios.post(overpassUrl, `data=${encodeURIComponent(query)}`);
  return res.data.elements.map((el, idx) => ({
    id: el.id || idx,
    name: el.tags.name || `Karnataka Destination ${idx + 1}`,
    category: category,
    district: region,
    latitude: el.lat,
    longitude: el.lon,
    rating: 4.5,
    entry_fee_inr: 100,
    opening_hours: '9:00 AM - 6:00 PM',
    best_time_to_visit: 'Morning',
    image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80',
    vibe_tag: el.tags.historic || 'Heritage'
  }));
}

module.exports = { fetchDynamicPlaces };