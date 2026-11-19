const KARNATAKA_31_DISTRICTS = require('../data/karnataka31Districts');

const USER_AGENT = 'SmartTrails-Karnataka-GeoRAG/2.0';

async function geocodeKarnatakaPlace(query) {
  const clean = (query || '').replace(/\s*district$/i, '').trim();
  if (!clean) return null;

  const aliases = {
    mysur: 'Mysuru', mysore: 'Mysuru',
    bangalore: 'Bengaluru', bengaluru: 'Bengaluru',
    coorg: 'Madikeri, Kodagu', madikeri: 'Madikeri, Kodagu',
    chikmagalur: 'Chikkamagaluru', chikkmagaluru: 'Chikkamagaluru',
    mangalore: 'Mangaluru', mangaluru: 'Mangaluru',
    hubli: 'Hubballi, Dharwad', hubballi: 'Hubballi, Dharwad',
    bijapur: 'Vijayapura', gulbarga: 'Kalaburagi',
    bellary: 'Ballari', belgaum: 'Belagavi',
    shimoga: 'Shivamogga', tumkur: 'Tumakuru',
    hospet: 'Hosapete, Vijayanagara', hampi: 'Hampi, Vijayanagara',
    badami: 'Badami, Bagalkot', gokarna: 'Gokarna, Uttara Kannada'
  };

  const lower = clean.toLowerCase();
  const normalizedQuery = aliases[lower] || clean;

  // Match against 31-district registry first for exact headquarters/district anchoring
  const dist = KARNATAKA_31_DISTRICTS.find(
    (d) =>
      lower === d.name.toLowerCase() ||
      lower.includes(d.name.toLowerCase()) ||
      d.name.toLowerCase().includes(lower) ||
      d.headquarters.toLowerCase() === lower ||
      (d.taluks || []).some((t) => t.toLowerCase() === lower)
  );

  try {
    const searchStr = dist && lower.includes(dist.name.toLowerCase())
      ? `${dist.headquarters}, ${dist.name}, Karnataka, India`
      : `${normalizedQuery}, Karnataka, India`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchStr)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const hit = data[0];
      return {
        name: dist ? dist.name : hit.name || normalizedQuery,
        district: dist ? dist.name : hit.address?.state_district || normalizedQuery,
        latitude: parseFloat(hit.lat),
        longitude: parseFloat(hit.lon)
      };
    }
  } catch (_) {}

  if (dist) {
    return {
      name: dist.name,
      district: dist.name,
      latitude: dist.latitude,
      longitude: dist.longitude
    };
  }

  return null;
}

async function fetchVerifiedPOIs(lat, lon, districtRecord = null, radiusMeters = 45000) {
  const results = [];
  const seenNames = new Set();

  const addUnique = (item) => {
    const key = (item.attraction_name || '').toLowerCase().trim();
    if (!key || key.length < 3 || seenNames.has(key)) return;
    if (/district|taluk|constituency|railway station|bus stand|hospital|bank/i.test(key)) return;
    seenNames.add(key);
    results.push(item);
  };

  // Source A: Wikipedia Geosearch (35km radius)
  try {
    const wikiGeoUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}|${lon}&ggsradius=20000&ggslimit=25&prop=coordinates|pageimages|extracts&exintro=1&explaintext=1&exsentences=2&pithumbsize=800&format=json&origin=*`;
    const res = await fetch(wikiGeoUrl, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    for (const p of Object.values(data?.query?.pages || {})) {
      const coord = p.coordinates?.[0];
      if (!coord) continue;
      addUnique({
        attraction_name: p.title,
        latitude: coord.lat,
        longitude: coord.lon,
        category: 'Heritage & Landmark',
        description: (p.extract || `Notable landmark in ${districtRecord?.name || 'Karnataka'}.`).slice(0, 180),
        image_url: p.thumbnail?.source || null,
        source: 'Wikipedia GeoIndex'
      });
    }
  } catch (_) {}

  // Source B: OpenStreetMap Overpass API (45km radius across tourism, historic, parks, waterfalls, temples)
  try {
    const overpassQuery = `
      [out:json][timeout:12];
      (
        node["tourism"~"attraction|viewpoint|museum|zoo|theme_park"](around:${radiusMeters},${lat},${lon});
        node["historic"~"monument|fort|castle|ruins|archaeological_site|temple"](around:${radiusMeters},${lat},${lon});
        node["waterway"="waterfall"](around:${radiusMeters},${lat},${lon});
        node["leisure"="park"]["name"](around:${radiusMeters},${lat},${lon});
        way["historic"~"fort|monument|ruins"](around:${radiusMeters},${lat},${lon});
        way["tourism"~"attraction|museum|zoo"](around:${radiusMeters},${lat},${lon});
      );
      out center 30;
    `;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });
    const data = await res.json();
    for (const el of data.elements || []) {
      const name = (el.tags?.['name:en'] || el.tags?.name || '').trim();
      const elLat = el.lat || el.center?.lat;
      const elLon = el.lon || el.center?.lon;
      if (!name || !elLat || !elLon) continue;
      const tagType = el.tags?.waterway || el.tags?.historic || el.tags?.tourism || 'Attraction';
      addUnique({
        attraction_name: name,
        latitude: elLat,
        longitude: elLon,
        category: tagType.charAt(0).toUpperCase() + tagType.slice(1),
        description: el.tags?.description || `Verified ${tagType} in ${districtRecord?.name || 'Karnataka'}.`,
        image_url: null,
        source: 'OpenStreetMap'
      });
    }
  } catch (_) {}

  // Source C: Always merge verified District Anchor Places & geocode them so smaller districts never lack spots!
  if (districtRecord?.topPlaces?.length) {
    for (let i = 0; i < districtRecord.topPlaces.length; i++) {
      const placeTitle = districtRecord.topPlaces[i];
      if (seenNames.has(placeTitle.toLowerCase())) continue;

      let pLat = lat + (i - 2) * 0.035;
      let pLon = lon + ((i % 2 === 0 ? 1 : -1) * 0.03);
      try {
        const gUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeTitle + ', ' + districtRecord.name + ', Karnataka')}&format=json&limit=1`;
        const gRes = await fetch(gUrl, { headers: { 'User-Agent': USER_AGENT } });
        const gData = await gRes.json();
        if (gData?.[0]) {
          pLat = parseFloat(gData[0].lat);
          pLon = parseFloat(gData[0].lon);
        }
      } catch (_) {}

      addUnique({
        attraction_name: placeTitle,
        latitude: pLat,
        longitude: pLon,
        category: districtRecord.categories?.[0] || 'Heritage',
        description: `Signature destination in ${districtRecord.name} District, Karnataka.`,
        image_url: null,
        source: 'Karnataka 31-District Index'
      });
    }
  }

  return results.slice(0, 24);
}

module.exports = { geocodeKarnatakaPlace, fetchVerifiedPOIs };
