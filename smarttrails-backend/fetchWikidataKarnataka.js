const fs = require('fs');
const path = require('path');

const sparqlQuery = `
SELECT DISTINCT ?item ?itemLabel ?lat ?lon ?image ?districtLabel WHERE {
  ?item wdt:P131* wd:Q1185. # Located in Karnataka
  VALUES ?type {
    wd:Q23413   # Castle / Fort
    wd:Q34038   # Waterfall
    wd:Q44539   # Temple
    wd:Q839954  # Archaeological site
    wd:Q33506   # Museum
    wd:Q473972  # Protected area / Wildlife sanctuary
    wd:Q8502    # Mountain / Hill
    wd:Q40080   # Beach
  }
  ?item wdt:P31/wdt:P279* ?type.
  ?item wdt:P625 ?coord.
  ?item wdt:P18 ?image.
  OPTIONAL { ?item wdt:P131 ?district. }
  BIND(geof:latitude(?coord) AS ?lat)
  BIND(geof:longitude(?coord) AS ?lon)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 600
`;

(async () => {
  console.log('🌐 Querying Wikidata SPARQL for verified Karnataka landmarks with real photos...');
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparqlQuery)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SmartTrails-Karnataka-Bot/1.0 (student-project)', Accept: 'application/sparql-results+json' }
  });
  const data = await res.json();
  const rows = data?.results?.bindings || [];
  console.log(`✅ Retrieved ${rows.length} verified Karnataka landmarks with GPS + Photos!`);

  const outPath = path.join(__dirname, 'data', 'wikidata_karnataka_raw.json');
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));
  console.log(`💾 Saved to ${outPath}`);
})();
