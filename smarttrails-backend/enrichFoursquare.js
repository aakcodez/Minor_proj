const fs = require('fs');
const path = require('path');
require('dotenv').config();

const FSQ_KEY = (process.env.FOURSQUARE_API_KEY || '').trim();
if (!FSQ_KEY) {
  console.log('ℹ️ Add FOURSQUARE_API_KEY=fsq3... in smarttrails-backend/.env first.');
  process.exit(0);
}

const dbPath = path.join(__dirname, 'data', 'karnataka_verified_pois.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

(async () => {
  for (const [distName, distObj] of Object.entries(db)) {
    for (const poi of distObj.pois || []) {
      try {
        const searchUrl = `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(poi.attraction_name)}&ll=${poi.latitude},${poi.longitude}&radius=15000&limit=1&fields=fsq_id,name,rating,photos,location`;
        const res = await fetch(searchUrl, {
          headers: { Authorization: FSQ_KEY, Accept: 'application/json' }
        });
        const data = await res.json();
        const hit = data?.results?.[0];
        if (hit?.photos?.[0]) {
          poi.image_url = `${hit.photos[0].prefix}800x600${hit.photos[0].suffix}`;
          poi.source = 'Foursquare Verified';
          if (hit.rating) poi.rating = hit.rating;
        }
      } catch (_) {}
    }
    console.log(`✅ Enriched ${distName}`);
  }
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('🎉 Golden Database upgraded with Foursquare commercial photos!');
})();
