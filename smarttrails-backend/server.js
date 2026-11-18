const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const USER_AGENT = 'SmartTrails-Karnataka-LiveAI/3.0';
const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
const groqKey = (process.env.GROQ_API_KEY || '').trim();

const ai = geminiKey && !geminiKey.includes('PASTE') && !geminiKey.includes('YOUR_')
  ? new GoogleGenAI({ apiKey: geminiKey })
  : null;

// --- DIRECT AI ENGINE (GROQ + GEMINI) ---
async function askAI(systemPrompt, userPrompt) {
  // 1. Try Groq first (ultra-fast JSON)
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
          temperature: 0.35
        })
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return JSON.parse(text);
    } catch (err) {
      console.warn('Groq fallback to Gemini:', err.message);
    }
  }

  // 2. Try Google Gemini 2.5 Flash
  if (ai) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\nRequest: ${userPrompt}`,
      config: { responseMimeType: 'application/json', temperature: 0.35 }
    });
    const clean = (response.text || '').replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
    if (clean) return JSON.parse(clean);
  }

  throw new Error('Add a valid GROQ_API_KEY or GEMINI_API_KEY in smarttrails-backend/.env');
}

// --- WIKIPEDIA PHOTO FETCHER ---
async function getPlaceImage(placeName) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(placeName + ' Karnataka')}&gsrlimit=1&prop=pageimages&pithumbsize=800&format=json&origin=*`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    const pages = Object.values(data?.query?.pages || {});
    return pages[0]?.thumbnail?.source || null;
  } catch (_) {
    return null;
  }
}

// --- 1. DIRECT AI DESTINATION RECOMMENDATIONS ---
app.post('/api/recommendations', async (req, res) => {
  const {
    startingLocation = 'Bengaluru',
    interests = ['Nature'],
    travellers = 2,
    days = 2,
    travelType = 'Couple',
    budgetINR = 10000
  } = req.body;

  const sysPrompt = `
You are SmartTrails Karnataka's live AI travel planner.
Recommend 4 real, distinct tourist destinations strictly inside Karnataka, India based on:
- Starting City: ${startingLocation}
- Interests: ${interests.join(', ')}
- Duration: ${days} days | Group: ${travellers} (${travelType}) | Total Budget: ₹${budgetINR}

Provide accurate real-world Karnataka latitude & longitude coordinates for each destination.
Return ONLY valid JSON:
{
  "recommendations": [
    {
      "destination_id": 1,
      "destination_name": "Destination Name",
      "district": "District Name",
      "description": "2-sentence overview",
      "latitude": 12.4244,
      "longitude": 75.7382,
      "approximate_visit_duration": "${days} Days",
      "matched_interests": ["Interest 1", "Interest 2"],
      "why_recommended": "2-sentence personalized reason why this fits their interests & ₹${budgetINR} budget",
      "important_attractions": ["Spot 1", "Spot 2", "Spot 3", "Spot 4"],
      "estimated_group_cost_inr": 8500
    }
  ]
}`;

  try {
    const data = await askAI(sysPrompt, JSON.stringify(req.body));
    const enriched = await Promise.all(
      (data.recommendations || []).slice(0, 4).map(async (item, idx) => ({
        ...item,
        destination_id: idx + 1,
        image_url: await getPlaceImage(item.destination_name),
        within_budget: (Number(item.estimated_group_cost_inr) || 0) <= budgetINR
      }))
    );
    res.json({ recommendations: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.message });
  }
});

// --- 2. DIRECT AI DYNAMIC ITINERARY & BUDGET GENERATOR ---
app.post('/api/itinerary/generate', async (req, res) => {
  const {
    destinationName = 'Coorg',
    startingLocation = 'Bengaluru',
    days = 2,
    travellers = 2,
    travelType = 'Couple',
    budgetINR = 10000,
    interests = []
  } = req.body;

  const sysPrompt = `
You are SmartTrails Karnataka's live AI itinerary architect.
Generate a complete, realistic ${days}-day itinerary for "${destinationName}", Karnataka, India for ${travellers} ${travelType} travellers starting from ${startingLocation} with a group budget of ₹${budgetINR} (Interests: ${interests.join(', ') || 'All'}).

Rules:
- Include 3 real, geographically clustered attractions per day (total ${days * 3} stops) + 3 extra optional nearby attractions in "availableAttractions".
- Provide accurate real-world latitude & longitude inside Karnataka for every stop.
- Provide realistic INR cost estimates for stay, food, transport, and entry fees.

Return ONLY valid JSON:
{
  "destination": {
    "destination_name": "${destinationName}",
    "district": "Karnataka District",
    "latitude": 12.4244,
    "longitude": 75.7382
  },
  "overview": "2-sentence personalized summary of this ${days}-day trip",
  "travelerGuide": {
    "howToReach": "Best train/bus/flight/road access from ${startingLocation}",
    "bestSeason": "Ideal months to visit",
    "stayRecommendation": "Best area to book stay",
    "mustTryFood": "Famous local Karnataka dishes",
    "localTransportTip": "Best local commute option"
  },
  "dayPlans": [
    {
      "day": 1,
      "theme": "Day 1 Theme",
      "stops": [
        {
          "attraction_id": 101,
          "attraction_name": "Exact Attraction Name",
          "category": "Nature",
          "slot": "09:00 AM • Morning",
          "description": "1-2 sentence factual description",
          "latitude": 12.4572,
          "longitude": 75.7166,
          "estimated_visit_duration": 1.5,
          "approximate_entry_fee": 30
        }
      ]
    }
  ],
  "availableAttractions": [
    {
      "attraction_id": 201,
      "attraction_name": "Extra Nearby Spot",
      "category": "Heritage and Historical Places",
      "description": "1-sentence description",
      "latitude": 12.4148,
      "longitude": 75.7369,
      "estimated_visit_duration": 1.5,
      "approximate_entry_fee": 20
    }
  ],
  "budgetSummary": {
    "totalBudgetINR": ${budgetINR},
    "estimatedTotalCostINR": 8400,
    "perPersonCostINR": 4200,
    "withinBudget": true,
    "warning": null,
    "breakdown": {
      "accommodationINR": 3200,
      "foodINR": 2200,
      "transportINR": 2600,
      "entryAndActivitiesINR": 400
    }
  }
}`;

  try {
    const plan = await askAI(sysPrompt, `Build a ${days}-day itinerary for ${destinationName}, Karnataka`);

    // Attach real Wikipedia photos to every stop & extra spot
    if (Array.isArray(plan.dayPlans)) {
      for (const d of plan.dayPlans) {
        if (Array.isArray(d.stops)) {
          await Promise.all(
            d.stops.map(async (s) => {
              s.image_url = await getPlaceImage(s.attraction_name);
            })
          );
        }
      }
    }
    if (Array.isArray(plan.availableAttractions)) {
      await Promise.all(
        plan.availableAttractions.map(async (a) => {
          a.image_url = await getPlaceImage(a.attraction_name);
        })
      );
    }

    // Ensure budget warning is accurate
    const est = Number(plan.budgetSummary?.estimatedTotalCostINR) || days * travellers * 1800;
    if (plan.budgetSummary) {
      plan.budgetSummary.withinBudget = est <= budgetINR;
      plan.budgetSummary.perPersonCostINR = Math.round(est / Math.max(1, travellers));
      plan.budgetSummary.warning =
        est > budgetINR
          ? `Estimated cost (₹${est.toLocaleString('en-IN')}) exceeds your ₹${budgetINR.toLocaleString('en-IN')} budget. Try KSRTC buses or budget homestays.`
          : null;
    }

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.message });
  }
});

// --- 3. DIRECT COPILOT CHAT BRIDGE ---
app.post('/api/chat', async (req, res) => {
  const { message = '', preferences = {} } = req.body;
  try {
    const intent = await askAI(
      'Extract Karnataka destination, days, and INR budget from user prompt. Return ONLY JSON: {"destination": "City Name", "days": 2, "budgetINR": 10000}',
      message
    );
    const resp = await fetch(`http://127.0.0.1:${process.env.PORT || 5000}/api/itinerary/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationName: intent.destination || 'Coorg',
        startingLocation: preferences.startingLocation || 'Bengaluru',
        days: Number(intent.days) || Number(preferences.days) || 2,
        travellers: Number(preferences.travellers) || 2,
        travelType: preferences.travelType || 'Couple',
        budgetINR: Number(intent.budgetINR) || Number(preferences.budgetINR) || 10000,
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`⚡ Direct Groq + Gemini Server (No MySQL) running on port ${PORT}`));
