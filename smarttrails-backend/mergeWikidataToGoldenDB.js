const fs = require('fs');
const path = require('path');
const KARNATAKA_31_DISTRICTS = require('./data/karnataka31Districts');

const dbPath = path.join(__dirname, 'data', 'karnataka_verified_pois.json');
const db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf8')) : {};

const sparqlQuery = `
SELECT DISTINCT ?item ?itemLabel ?lat ?lon ?image ?typeLabel WHERE {
  ?item wdt:P131* wd:Q1185.
  VALUES ?type {
    wd:Q23413
    wd:Q34038
    wd:Q44539
    wd:Q839954
    wd:Q33506
    wd:Q473972
    wd:Q8502
    wd:Q40080
  }
  ?item wdt:P31/wdt:P279* ?type.
  ?item wdt:P625 ?coord.
  ?item wdt:P18 ?image.
  BIND(geof:latitude(?coord) AS ?lat)
  BIND(geof:longitude(?coord) AS ?lon)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 600
`;

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestDistrict(lat, lon) {
  let best = null;
  let minKm = Infinity;
  for (const d of KARNATAKA_31_DISTRICTS) {
    const km = haversineKm(lat, lon, d.latitude, d.longitude);
    if (km < minKm) {
      minKm = km;
      best = d;
    }
  }
  return minKm <= 85 ? best : null;
}

(async () => {
  console.log('🌐 Fetching 600 photo-verified Karnataka landmarks from Wikidata SPARQL...');
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparqlQuery)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'SmartTrails-Karnataka-GeoRAG/3.0',
      Accept: 'application/sparql-results+json'
    }
  });
  const json = await res.json();
  const rows = json?.results?.bindings || [];
  console.log(`✅ Downloaded ${rows.length} raw Wikidata records.`);

  let addedCount = 0;
  let upgradedPhotos = 0;

  for (const row of rows) {
    const name = (row.itemLabel?.value || '').trim();
    const lat = parseFloat(row.lat?.value);
    const lon = parseFloat(row.lon?.value);
    let image = (row.image?.value || '').trim();
    const rawCat = (row.typeLabel?.value || 'Landmark').trim();

    if (!name || /^Q\d+$/.test(name) || isNaN(lat) || isNaN(lon) || !image) continue;
    if (/\.svg$/i.test(image)) continue;

    // Convert Special:FilePath URL to clean 900px HTTPS Wikimedia thumbnail
    if (image.startsWith('http://')) image = image.replace('http://', 'https://');
    if (image.includes('Special:FilePath/')) {
      image = `${image}?width=900`;
    }

    const nearest = findNearestDistrict(lat, lon);
    if (!nearest) continue;

    if (!db[nearest.name]) {
      db[nearest.name] = {
        id: nearest.id,
        name: nearest.name,
        division: nearest.division,
        headquarters: nearest.headquarters,
        latitude: nearest.latitude,
        longitude: nearest.longitude,
        taluks: nearest.taluks || [],
        pois: []
      };
    }

    const list = db[nearest.name].pois;
    const existing = list.find(
      (p) => p.attraction_name.toLowerCase().trim() === name.toLowerCase()
    );

    if (existing) {
      if (!existing.image_url) {
        existing.image_url = image;
        existing.source = 'Wikidata Verified';
        upgradedPhotos++;
      }
      continue;
    }

    if (list.length < 18) {
      list.push({
        poi_id: `${nearest.id}-wd-${list.length + 1}`,
        attraction_name: name,
        district: nearest.name,
        division: nearest.division,
        latitude: lat,
        longitude: lon,
        category: rawCat.charAt(0).toUpperCase() + rawCat.slice(1),
        description: `Verified ${rawCat} in ${nearest.name} District, Karnataka.`,
        image_url: image,
        source: 'Wikidata Verified'
      });
      addedCount++;
    }
  }

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log(`🎉 Merged ${addedCount} new photo-verified POIs and upgraded ${upgradedPhotos} missing images across all 31 districts!`);
})();
