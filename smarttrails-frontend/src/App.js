import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ItineraryMap from './ItineraryMap';
import {
  INTEREST_OPTIONS, FALLBACK_IMG, STARTER_COMMUNITY,
  IconCompass, IconGlobe, IconBookmark, IconMap, IconPin, IconHeart,
  AuthModal, PublishModal
} from './AppModals';
import './App.css';

const DISCOVER_INSPO = [
  {
    id: 'inspo-1',
    hero: true,
    category: "Today's Inspo",
    tag: 'Western Ghats',
    title: 'Find me a misty peak & coffee estate trek in Chikmagalur',
    prompt: '2 days in Chikmagalur under ₹9000',
    image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'inspo-2',
    category: 'Heritage & Temples',
    tag: 'UNESCO Heritage',
    title: '2-day sunrise boulder & temple trail in Hampi',
    prompt: '2 days in Hampi under ₹8000',
    image: 'https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'inspo-3',
    category: 'Food & Coffee',
    tag: 'Coorg (Kodagu)',
    title: 'Filter coffee estates, Abbey Falls & Pandi curry in Madikeri',
    prompt: '2 days in Coorg under ₹10000',
    image: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'inspo-4',
    category: 'Beaches',
    tag: 'Uttara Kannada Coast',
    title: 'Om Beach cliff walk & sunset shacks in Gokarna',
    prompt: '2 days in Gokarna under ₹7500',
    image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'inspo-5',
    category: 'Heritage & Temples',
    tag: 'Royal Capital',
    title: 'Mysore Palace illumination, Chamundi Hills & Mylari Dosa',
    prompt: '2 days in Mysuru under ₹8500',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80'
  }
];

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('st_user') || 'null'));
  const [showAuthModal, setShowAuthModal] = useState(!localStorage.getItem('st_user'));
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', homeCity: 'Bengaluru', travelStyle: 'Couple' });

  // Left Mode: 'home' (Wanderboat Hero) | 'wizard' (3-Step Flow)
  const [leftMode, setLeftMode] = useState('home');
  // Right View: 'discover' | 'results' | 'community' | 'saved'
  const [rightView, setRightView] = useState('discover');
  // Segmented Toggle: 'list' | 'map'
  const [displayMode, setDisplayMode] = useState('list');
  const [discoverCat, setDiscoverCat] = useState("Today's Inspo");
  const [districts31, setDistricts31] = useState([]);
  const [divisionFilter, setDivisionFilter] = useState("All");
  const [districtSearch, setDistrictSearch] = useState("");
  const [baseCity, setBaseCity] = useState('Bengaluru, Karnataka');

  const [flowStep, setFlowStep] = useState(1);
  const [prefs, setPrefs] = useState({
    startingLocation: 'Bengaluru',
    interests: ['Nature', 'Heritage and Historical Places'],
    travellers: 2,
    days: 2,
    travelType: 'Couple',
    budgetINR: 10000
  });

  const [recommendations, setRecommendations] = useState([]);
  const [itineraryData, setItineraryData] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [showHighlights, setShowHighlights] = useState(false);
  const [stayForm, setStayForm] = useState({ city: "Bengaluru", checkIn: "Nov 23", checkOut: "Nov 25", guests: "1 room, 2 guests", vibe: "" });
  const [staysData, setStaysData] = useState(null);
  const [selectedStay, setSelectedStay] = useState(null);
  const [stayTab, setStayTab] = useState("About");
  const [savedTrips, setSavedTrips] = useState(() => {
    try { return JSON.parse(localStorage.getItem("smarttrails_saved_trips") || "[]"); } catch { return []; }
  });
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
  const [dayPlans, setDayPlans] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectingDest, setSelectingDest] = useState(null);
  const [apiError, setApiError] = useState('');

  const [communityFilter, setCommunityFilter] = useState('all');
  const [communityItems, setCommunityItems] = useState([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({ postType: 'post', destinationName: 'Coorg (Kodagu)', title: '', caption: '' });
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => {
    fetchCommunity('all');
    setSavedTrips(JSON.parse(localStorage.getItem('st_saved_trips') || '[]'));
    axios.get('/api/districts').then(res => setDistricts31(res.data.districts || [])).catch(() => {});
  }, []);

  const fetchCommunity = (type) => {
    const stored = JSON.parse(localStorage.getItem('st_community') || 'null') || STARTER_COMMUNITY;
    if (!localStorage.getItem('st_community')) localStorage.setItem('st_community', JSON.stringify(stored));
    setCommunityItems(type === 'all' ? stored : stored.filter((i) => i.post_type === type));
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const u = { full_name: authForm.fullName.trim(), email: authForm.email.trim(), home_city: authForm.homeCity, travel_style: authForm.travelStyle };
    setUser(u);
    localStorage.setItem('st_user', JSON.stringify(u));
    setBaseCity(`${u.home_city}, Karnataka`);
    setPrefs((p) => ({ ...p, startingLocation: u.home_city, travelType: u.travel_style }));
    setShowAuthModal(false);
  };

  
  
  const handleSaveCurrentTrip = () => {
    if (!itineraryData) return;
    const entry = {
      id: Date.now(),
      title: `${itineraryData.destination?.destination_name || "Karnataka"} (${dayPlans.length}D)`,
      savedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      data: { ...itineraryData, dayPlans }
    };
    const next = [entry, ...savedTrips.filter((t) => t.title !== entry.title)].slice(0, 12);
    setSavedTrips(next);
    localStorage.setItem("smarttrails_saved_trips", JSON.stringify(next));
    setMessages((prev) => [...prev, { role: "ai", text: `Saved "${entry.title}" to your Saved Trips!` }]);
  };

  const handleSearchStays = async (overrideCity, overrideVibe) => {
    const targetCity = overrideCity || stayForm.city || "Bengaluru";
    const targetVibe = overrideVibe !== undefined ? overrideVibe : stayForm.vibe;
    setStayForm((f) => ({ ...f, city: targetCity, vibe: targetVibe }));
    setLeftMode("stays");
    setRightView("stays");
    setDisplayMode("list");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/stays", {
        city: targetCity,
        checkIn: stayForm.checkIn,
        checkOut: stayForm.checkOut,
        guests: stayForm.guests,
        vibe: targetVibe || "Boutique, heritage & nature stays"
      });
      setSelectedStay(null);
      setStayTab("About");
      setStaysData(data);
    } catch (err) {
      setApiError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
      setSelectingDest(null);
    }
  };

  const runDirectPrompt = async (promptText) => {
    const text = (promptText || chatInput).trim();
    if (!text || loading) return;
    setChatInput('');
    setApiError('');
    setLoading(true);
        // If an itinerary is active and user asks a follow-up tweak, refine in-place like Wanderboat!
    const isFollowUpTweak = itineraryData && flowStep === 3 && !/\d+\s*days?\s+in/i.test(text) && !/tell me more|about /i.test(text);
    if (isFollowUpTweak) {
      setMessages((prev) => [...prev, { role: "user", text }]);
      setLoading(true);
      try {
        const { data } = await axios.post("/api/itinerary/refine", {
          currentItinerary: { ...itineraryData, dayPlans },
          instruction: text
        });
        if (data.updatedItinerary) {
          setItineraryData(data.updatedItinerary);
          setDayPlans(data.updatedItinerary.dayPlans || []);
        }
        setMessages((prev) => [...prev, { role: "ai", text: data.reply || "Updated your route!" }]);
      } catch (err) {
        setMessages((prev) => [...prev, { role: "ai", text: "Could not refine right now: " + err.message }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    const isSinglePlaceQuery = /tell me more|about |info|details|what should i see|caf[eé]s nearby|highlights|avoid crowds/i.test(text) && !/\d+\s*day/i.test(text);
    setLeftMode('wizard');
    setRightView('results');
    setShowHighlights(false);
    setMessages((prev) => isSinglePlaceQuery && placeDetails ? [...prev, { role: 'user', text }] : [{ role: 'user', text }]);

    try {
      if (isSinglePlaceQuery) {
        const targetQuery = /what should i see|caf[eé]s nearby|avoid crowds/i.test(text) && placeDetails
          ? `${text} at ${placeDetails.place_name}`
          : text;
        const { data } = await axios.post('/api/place/details', { query: targetQuery });
        setPlaceDetails(data);
        setItineraryData(null);
        setSelectedPlace({ name: data.place_name, latitude: data.latitude, longitude: data.longitude, category: data.category, price: data.hours });
        setMessages((prev) => [...prev, { role: 'ai', text: data.summary, placeCard: data }]);
        return;
      }

      setPlaceDetails(null);
      setFlowStep(3);
      const { data } = await axios.post('/api/chat', {
        message: text,
        preferences: { ...prefs, startingLocation: baseCity.split(',')[0] }
      });
      setPlaceDetails(null);
      setItineraryData(data);
      setDayPlans(data.dayPlans || []);
      const stops = (data.dayPlans || []).flatMap((d) => d?.stops || []);
      setSelectedPlace(stops[0] || null);
      setMessages((prev) => [...prev, { role: 'ai', text: data.overview || 'Itinerary ready.', stops }]);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setApiError(msg);
      setMessages((prev) => [...prev, { role: 'ai', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFindDestinations = async (e) => {
    if (e) e.preventDefault();
    setPlaceDetails(null);
    if (!prefs.interests.length) return setApiError('Select at least one interest.');
    setApiError('');
    setLoading(true);
    setMessages([{ role: 'user', text: `Find destinations from ${prefs.startingLocation} (${prefs.days}D, ${prefs.travellers} ${prefs.travelType}, ₹${prefs.budgetINR})` }]);

    try {
      const { data } = await axios.post('/api/recommendations', prefs);
      const recs = data.recommendations || [];
      setPlaceDetails(null);
      setRecommendations(recs);
      setFlowStep(2);
      setRightView('results');
      setMessages((prev) => [...prev, { role: 'ai', text: `Found ${recs.length} matching Karnataka destinations. Select one to build your day-by-day itinerary.` }]);
    } catch (err) {
      const msg = err.response?.data?.details || err.response?.data?.error || err.message;
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDestination = async (destCard) => {
    setPlaceDetails(null);
    setApiError('');
    setLoading(true);
    setSelectingDest(destCard.destination_name);
    setMessages((prev) => [...prev, { role: 'user', text: `Build ${prefs.days}-day itinerary for ${destCard.destination_name}.` }]);

    try {
      const { data } = await axios.post('/api/itinerary/generate', {
        destinationId: destCard.destination_id,
        destinationName: destCard.destination_name,
        startingLocation: prefs.startingLocation,
        days: prefs.days,
        travellers: prefs.travellers,
        travelType: prefs.travelType,
        budgetINR: prefs.budgetINR,
        interests: prefs.interests
      });
      setItineraryData(data);
      setDayPlans(data.dayPlans || []);
      const stops = (data.dayPlans || []).flatMap((d) => d?.stops || []);
      setSelectedPlace(stops[0] || null);
      setFlowStep(3);
      setRightView('results');
      setMessages((prev) => [...prev, { role: 'ai', text: data.overview || `Built itinerary for ${destCard.destination_name}.`, stops }]);
    } catch (err) {
      const msg = err.response?.data?.details || err.response?.data?.error || err.message;
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const visibleDistricts = districts31.filter(d =>
    (divisionFilter === "All" || d.division === divisionFilter) &&
    (!districtSearch.trim() || d.name.toLowerCase().includes(districtSearch.toLowerCase()) || d.topPlaces.some(p => p.toLowerCase().includes(districtSearch.toLowerCase())))
  );

  const mapPlaces = rightView === "stays" && staysData?.stays
    ? staysData.stays.map((st) => ({ day: 1, name: st.name, category: st.tag, latitude: st.latitude, longitude: st.longitude, price: `₹${st.price_per_night_inr}/night` }))
    : placeDetails && rightView === 'results'
    ? [{ day: 1, name: placeDetails.place_name, category: placeDetails.category, latitude: placeDetails.latitude, longitude: placeDetails.longitude, price: placeDetails.hours }]
    : rightView === 'discover' && discoverCat === 'All 31 Districts'
    ? visibleDistricts.map(d => ({ day: 1, name: d.name, category: d.division, latitude: d.latitude, longitude: d.longitude, price: d.headquarters }))
    : rightView === 'community'
    ? (communityItems || []).flatMap((i) => (Array.isArray(i.itinerary_json) ? i.itinerary_json.map((s) => ({ ...s, name: s.attraction_name || s.name })) : []))
    : flowStep === 2 && rightView === 'results'
    ? (recommendations || []).map((r) => ({ day: 1, name: r.destination_name, category: r.district, latitude: r.latitude, longitude: r.longitude, price: `₹${r.estimated_group_cost_inr}` }))
    : (dayPlans || []).flatMap((d) => (d?.stops || []).map((s) => ({ ...s, day: d.day, name: s.attraction_name || s.name, price: s.approximate_entry_fee === 0 ? 'Free Entry' : `₹${s.approximate_entry_fee} Entry` })));

  const filteredInspo = discoverCat === "Today's Inspo"
    ? DISCOVER_INSPO
    : DISCOVER_INSPO.filter((i) => i.category === discoverCat || i.hero);

  const scheduledNames = new Set((dayPlans || []).flatMap((d) => (d?.stops || []).map((s) => s.attraction_name)));
  const unscheduled = (itineraryData?.availableAttractions || []).filter((a) => !scheduledNames.has(a.attraction_name));

  return (
    <div className="wb-shell">
      {showAuthModal && <AuthModal authForm={authForm} setAuthForm={setAuthForm} onSubmit={handleLoginSubmit} />}
      {showPublishModal && (
        <PublishModal
          publishForm={publishForm}
          setPublishForm={setPublishForm}
          onClose={() => setShowPublishModal(false)}
          onSubmit={(e) => {
            e.preventDefault();
            const existing = JSON.parse(localStorage.getItem('st_community') || '[]');
            const next = [{
              post_id: Date.now(),
              author_name: user?.full_name || 'Explorer',
              author_city: user?.home_city || prefs.startingLocation,
              post_type: publishForm.postType,
              destination_name: publishForm.destinationName,
              title: publishForm.title,
              caption: publishForm.caption,
              image_url: itineraryData?.destination?.image_url || FALLBACK_IMG,
              days: prefs.days,
              budget_inr: prefs.budgetINR,
              likes_count: 1,
              itinerary_json: publishForm.postType === 'itinerary' ? (dayPlans || []).flatMap((d) => d?.stops || []) : []
            }, ...existing];
            localStorage.setItem('st_community', JSON.stringify(next));
            setShowPublishModal(false);
            fetchCommunity(communityFilter);
            setRightView('community');
          }}
        />
      )}

      {/* WANDERBOAT FULL-SCREEN PROPERTY DETAIL VIEW (MATCHING SCREENSHOT) */}
      {selectedStay && (
        <div className="wb-fade" style={{ position: "fixed", inset: 0, left: "58px", background: "#ffffff", zIndex: 900, display: "flex", overflow: "hidden" }}>
          {/* LEFT HALF: 7-PHOTO BENTO GALLERY + ABOUT/ROOMS/REVIEWS/NEARBY + HIGHLIGHTS & RATING */}
          <div style={{ width: "56%", height: "100vh", overflowY: "auto", padding: "22px 28px", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <button className="wb-pill-btn" style={{ padding: "5px 12px", fontSize: "11.5px" }} onClick={() => setSelectedStay(null)}>
                ← Back to Stays
              </button>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#0d9488" }}>
                From ₹{(selectedStay.price_per_night_inr || 4500).toLocaleString("en-IN")}/night
              </span>
            </div>

            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", lineHeight: 1.25 }}>{selectedStay.name}</h2>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
                <IconPin /> {selectedStay.address || selectedStay.area}
              </div>
            </div>

            {/* 7-PHOTO ASYMMETRIC MOSAIC (1 LARGE LEFT + 2 TOP-RIGHT + 4 BOTTOM THUMBNAILS) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: "8px", height: "235px" }}>
                <div style={{ borderRadius: "14px", overflow: "hidden" }}>
                  <img src={selectedStay.gallery?.[0] || selectedStay.image_url || FALLBACK_IMG} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: "8px" }}>
                  <div style={{ borderRadius: "12px", overflow: "hidden" }}>
                    <img src={selectedStay.gallery?.[1] || FALLBACK_IMG} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ borderRadius: "12px", overflow: "hidden" }}>
                    <img src={selectedStay.gallery?.[2] || FALLBACK_IMG} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", height: "84px" }}>
                {[3, 4, 5, 6].map((gi, idx) => (
                  <div key={gi} style={{ position: "relative", borderRadius: "10px", overflow: "hidden" }}>
                    <img src={selectedStay.gallery?.[gi] || FALLBACK_IMG} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {idx === 3 && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.52)", color: "#fff", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        See all photos
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* NAVIGATION TABS: ABOUT | ROOMS | REVIEWS | NEARBY */}
            <div style={{ display: "flex", gap: "18px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginTop: "4px" }}>
              {["About", "Rooms", "Reviews", "Nearby"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStayTab(tab)}
                  style={{
                    border: "none",
                    background: "none",
                    fontSize: "12.5px",
                    fontWeight: stayTab === tab ? 800 : 600,
                    color: stayTab === tab ? "#0d9488" : "#64748b",
                    borderBottom: stayTab === tab ? "2px solid #0d9488" : "2px solid transparent",
                    paddingBottom: "6px",
                    cursor: "pointer"
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            {stayTab === "About" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "16px", alignItems: "start" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "6px" }}>Property Highlights</div>
                  <p style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.6 }}>{selectedStay.highlights_text}</p>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ background: "#fef08a", color: "#0f172a", fontWeight: 800, fontSize: "12px", padding: "3px 8px", borderRadius: "6px" }}>{selectedStay.rating}</span>
                    <span style={{ fontWeight: 800, fontSize: "13px" }}>{selectedStay.label}</span>
                    <span style={{ fontSize: "11.5px", color: "#64748b" }}>({selectedStay.reviews})</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#334155", lineHeight: 1.5, fontStyle: "italic" }}>"{selectedStay.guest_review}"</p>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#0d9488" }}>— {selectedStay.reviewer_name || "Verified Guest"}</div>
                </div>
              </div>
            )}

            {stayTab === "Rooms" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(selectedStay.rooms || []).map((rm, ri) => (
                  <div key={ri} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13px" }}>{rm.type}</div>
                      <div style={{ fontSize: "11.5px", color: "#64748b" }}>{rm.bed}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: "14px", color: "#0d9488" }}>₹{rm.price_inr}/night</div>
                      <button className="wb-pill-btn active" style={{ marginTop: "4px", padding: "4px 10px", fontSize: "11px" }} onClick={() => alert(`Selected ${rm.type} at ${selectedStay.name}!`)}>
                        Reserve Room
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {stayTab === "Reviews" && (
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 800, fontSize: "13px", marginBottom: "6px" }}>⭐ {selectedStay.rating}/10 ({selectedStay.reviews} verified ratings)</div>
                <p style={{ fontSize: "12.5px", color: "#334155", lineHeight: 1.6 }}>"{selectedStay.guest_review}"</p>
              </div>
            )}

            {stayTab === "Nearby" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(selectedStay.nearby || []).map((nb, ni) => (
                  <span key={ni} className="wb-pill-btn" style={{ fontSize: "12px" }}>📍 {nb}</span>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT HALF: LIVE INTERACTIVE MAP WITH FLOATING PRICE PILL OVERLAY */}
          <div style={{ flex: 1, height: "100vh", position: "relative" }}>
            <ItineraryMap
              places={[{
                day: 1,
                name: selectedStay.name,
                category: selectedStay.tag,
                latitude: selectedStay.latitude,
                longitude: selectedStay.longitude,
                price: `₹${selectedStay.price_per_night_inr}/night`
              }]}
              selectedPlace={{ name: selectedStay.name, latitude: selectedStay.latitude, longitude: selectedStay.longitude }}
              onSelectPlace={() => {}}
            />
            <div style={{ position: "absolute", top: "18px", left: "18px", zIndex: 1000, background: "#7c3aed", color: "#ffffff", padding: "8px 16px", borderRadius: "999px", fontWeight: 800, fontSize: "13px", boxShadow: "0 8px 20px rgba(124,58,237,0.35)" }}>
              🛏️ ₹{(selectedStay.price_per_night_inr || 4800).toLocaleString("en-IN")} • {selectedStay.name}
            </div>
          </div>
        </div>
      )}

      {showSavedDrawer && (
        <div className="wb-fade" style={{ position: "fixed", top: 0, bottom: 0, left: "58px", width: "310px", background: "#ffffff", borderRight: "1px solid #e2e8f0", zIndex: 950, padding: "20px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "12px 0 32px rgba(15,23,42,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800, fontSize: "15px" }}>🔖 Saved Trips ({savedTrips.length})</div>
            <button className="wb-pill-btn" style={{ padding: "3px 9px", fontSize: "11px" }} onClick={() => setShowSavedDrawer(false)}>✕</button>
          </div>
          {savedTrips.length === 0 ? (
            <div style={{ fontSize: "12.5px", color: "#64748b", lineHeight: 1.5 }}>
              No saved trips yet. Build any Karnataka itinerary and click <strong>Save Trip</strong> to keep it here!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>
              {savedTrips.map((st) => (
                <div
                  key={st.id}
                  onClick={() => {
                    setItineraryData(st.data);
                    setDayPlans(st.data.dayPlans || []);
                    setLeftMode("wizard");
                    setFlowStep(3);
                    setRightView("results");
                    setShowSavedDrawer(false);
                  }}
                  style={{ padding: "11px 13px", borderRadius: "12px", border: "1px solid #e2e8f0", cursor: "pointer", background: "#f8fafc" }}
                >
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>{st.title}</div>
                  <div style={{ fontSize: "11px", color: "#0d9488", marginTop: "2px" }}>Saved {st.savedAt} • Click to open →</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* SLIM LEFT NAVIGATION RAIL */}
      <aside className="wb-rail">
        <div className="wb-logo-mark" title="SmartTrails Home" onClick={() => { setLeftMode('home'); setRightView('discover'); setDisplayMode('list'); }}>
          ST
        </div>
        <button className={`wb-rail-btn ${rightView === 'discover' ? 'active' : ''}`} title="Discover" onClick={() => { setLeftMode('home'); setRightView('discover'); setDisplayMode('list'); }}>
          <IconCompass />
        </button>
        <button className={`wb-rail-btn ${rightView === 'community' ? 'active' : ''}`} title="Community" onClick={() => { setRightView('community'); setDisplayMode('list'); fetchCommunity(communityFilter); }}>
          <IconGlobe />
        </button>
        <button className={`wb-rail-btn ${rightView === 'saved' ? 'active' : ''}`} title="Saved Trips" onClick={() => { setRightView('saved'); setDisplayMode('list'); }}>
          <IconBookmark />
        </button>
        <button className="wb-user-dot" title="Profile" onClick={() => setShowAuthModal(true)}>
          {(user?.full_name || 'U')[0].toUpperCase()}
        </button>
      </aside>

      {/* LEFT PANE: WANDERBOAT HERO OR 3-STEP TRIP WIZARD */}
      <section className="wb-left-pane">
        {leftMode === 'stays' ? (
          <div className="wb-hero-center wb-fade" style={{ justifyContent: "center" }}>
            <div className="wb-hero-brand">
              <span style={{ width: 28, height: 28, borderRadius: 8, background: "#0d9488", color: "#fff", fontSize: 13, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>ST</span>
              SmartTrails Stays
            </div>
            <div className="wb-hero-sub">Dreaming of your next Karnataka stay? Let's make it real.</div>

            <form
              className="wb-search-card"
              style={{ maxWidth: "490px", textAlign: "left" }}
              onSubmit={(e) => { e.preventDefault(); handleSearchStays(); }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>Where to</div>
                  <input value={stayForm.city} onChange={(e) => setStayForm({ ...stayForm, city: e.target.value })} placeholder="City or Taluk..." style={{ fontWeight: 700, fontSize: "12.5px" }} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>When</div>
                  <input value={`${stayForm.checkIn} - ${stayForm.checkOut}`} onChange={(e) => setStayForm({ ...stayForm, checkIn: e.target.value, checkOut: "" })} style={{ fontSize: "12px" }} />
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>People</div>
                  <input value={stayForm.guests} onChange={(e) => setStayForm({ ...stayForm, guests: e.target.value })} style={{ fontSize: "12px" }} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  placeholder="e.g., Coffee estate homestay in Chikmagalur or beach resort in Gokarna"
                  value={stayForm.vibe}
                  onChange={(e) => setStayForm({ ...stayForm, vibe: e.target.value })}
                />
                <button type="submit" className="wb-pill-btn active" disabled={loading} style={{ whiteSpace: "nowrap" }}>
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>

            <div className="wb-quick-pills">
              <button className="wb-pill-btn" onClick={() => { setLeftMode("home"); setRightView("discover"); }}>Home</button>
              <button className="wb-pill-btn" onClick={() => { setLeftMode("wizard"); setFlowStep(1); }}>Create trip</button>
              <button className="wb-pill-btn active">Find your stays</button>
            </div>
          </div>
        ) : leftMode === 'home' ? (
          <div className="wb-hero-center wb-fade">
            <div className="wb-hero-brand">
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#0d9488', color: '#fff', fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>ST</span>
              SmartTrails
            </div>
            <div className="wb-hero-sub">
              Hello, what's on your mind{user ? `, ${user.full_name.split(' ')[0]}` : ', Explorer'}?
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "7px", maxWidth: "520px", marginBottom: "2px" }}>
              {[
                "2 days in Coorg coffee hills",
                "Heritage trail in Hampi & Badami",
                "Waterfalls in Shivamogga",
                "Tell me more about Mysore Palace"
              ].map((vibe) => (
                <button key={vibe} type="button" className="wb-vibe-chip" onClick={() => runDirectPrompt(vibe)}>
                  ✨ {vibe}
                </button>
              ))}
            </div>
            <form className="wb-search-card" onSubmit={(e) => { e.preventDefault(); runDirectPrompt(chatInput); }}>
              <input
                placeholder="Ask anything or @mention a Karnataka place..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <div className="wb-search-actions">
                <button type="submit" className="wb-submit-pill" disabled={loading || !chatInput.trim()}>
                  ↑
                </button>
              </div>
            </form>

            {/* 3 WANDERBOAT ACTION CHIPS */}
            <div className="wb-quick-pills">
              <button className="wb-pill-btn" onClick={() => runDirectPrompt("Tell me more about Lalbagh Botanical Garden")}>
                Search places
              </button>
              <button className="wb-pill-btn active" onClick={() => { setLeftMode('wizard'); setFlowStep(1); }}>
                Create trip
              </button>
              <button className="wb-pill-btn" onClick={() => handleSearchStays(baseCity.split(",")[0], "")}>
                Find your stays
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0d9488' }}>SmartTrails Trip Builder</span>
              <button className="wb-pill-btn" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setLeftMode('home'); setRightView('discover'); }}>
                Back to Home
              </button>
            </div>

            <div className="wb-stepper">
              <div className={`wb-step-pill ${flowStep === 1 ? 'active' : 'done'}`} onClick={() => setFlowStep(1)}>1. Preferences</div>
              <div className={`wb-step-pill ${flowStep === 2 ? 'active' : recommendations.length ? 'done' : ''}`} onClick={() => recommendations.length && setFlowStep(2)}>2. Destinations</div>
              <div className={`wb-step-pill ${flowStep === 3 ? 'active' : itineraryData ? 'done' : ''}`} onClick={() => itineraryData && setFlowStep(3)}>3. Itinerary</div>
            </div>

            {flowStep === 1 ? (
              <form className="wb-form-box wb-fade" onSubmit={handleFindDestinations}>
                <div className="wb-grid-2">
                  <div className="wb-field"><label>Starting Location *</label><input required value={prefs.startingLocation} onChange={(e) => setPrefs({ ...prefs, startingLocation: e.target.value })} /></div>
                  <div className="wb-field">
                    <label>Travel Type *</label>
                    <select value={prefs.travelType} onChange={(e) => setPrefs({ ...prefs, travelType: e.target.value })}>
                      <option>Solo</option><option>Couple</option><option>Family</option><option>Friends</option><option>Group</option>
                    </select>
                  </div>
                  <div className="wb-field"><label>Travellers *</label><input type="number" min="1" max="30" required value={prefs.travellers} onChange={(e) => setPrefs({ ...prefs, travellers: Number(e.target.value) })} /></div>
                  <div className="wb-field"><label>Duration (Days) *</label><input type="number" min="1" max="14" required value={prefs.days} onChange={(e) => setPrefs({ ...prefs, days: Number(e.target.value) })} /></div>
                </div>
                <div className="wb-field"><label>Total Group Budget (INR ₹) *</label><input type="number" min="1000" step="500" required value={prefs.budgetINR} onChange={(e) => setPrefs({ ...prefs, budgetINR: Number(e.target.value) })} /></div>
                <div className="wb-field">
                  <label>Select Travel Interests *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {INTEREST_OPTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`wb-pill-btn ${prefs.interests.includes(item) ? 'active' : ''}`}
                        style={{ padding: '5px 10px', fontSize: '11px' }}
                        onClick={() => setPrefs((p) => ({ ...p, interests: p.interests.includes(item) ? p.interests.filter((x) => x !== item) : [...p.interests, item] }))}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  )}
                </div>
                {apiError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px', borderRadius: '10px', fontSize: '12px' }}>{apiError}</div>}
                <button type="submit" className="wb-primary-btn" disabled={loading}>
                  {loading ? 'Finding Matching Destinations...' : 'Find Matching Destinations'}
                </button>
              </form>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.map((m, i) =>
                    m.role === 'user' ? (
                      <div key={i} style={{ alignSelf: 'flex-end', background: '#0f172a', color: '#fff', padding: '9px 14px', borderRadius: '14px 14px 4px 14px', fontSize: '12.5px', maxWidth: '85%' }}>{m.text}</div>
                    ) : (
                      <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', fontSize: '12.5px', lineHeight: 1.55 }}>
                        <div>{m.text}</div>
                        {m.placeCard && (
                          <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#0d9488" }}>Top results from Picks</div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: "13.5px" }}>{m.placeCard.place_name} &gt;</div>
                              <div style={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>{m.placeCard.hours} • ⭐ {m.placeCard.rating} ({m.placeCard.reviews_count}) • {m.placeCard.category}</div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                              {(m.placeCard.photos || []).slice(0, 3).map((src, pi) => (
                                <div key={pi} style={{ position: "relative", height: "135px", borderRadius: "12px", overflow: "hidden" }}>
                                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent 60%)", padding: "8px", display: "flex", alignItems: "flex-end", color: "#fff", fontSize: "10px", lineHeight: 1.3 }}>
                                    {(m.placeCard.reel_captions || [])[pi] || "Great morning walk spot"}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize: "12px", color: "#334155", background: "#ffffff", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                              <strong style={{ color: "#0d9488" }}>Pick:</strong> {m.placeCard.pick_note}
                            </div>
                            <button className="wb-pill-btn active" style={{ alignSelf: "flex-start", fontSize: "11px" }} onClick={() => setShowHighlights(!showHighlights)}>
                              ↳ {showHighlights ? "Hide Highlights" : "Get the Highlights"}
                            </button>
                            {showHighlights && (
                              <ul style={{ paddingLeft: "18px", fontSize: "12px", color: "#0f172a", display: "flex", flexDirection: "column", gap: "4px" }}>
                                {(m.placeCard.highlights || []).map((h, hi) => <li key={hi}>{h}</li>)}
                              </ul>
                            )}
                            <div style={{ marginTop: "4px", borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                              <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>✦ Ask me more questions</div>
                              {(m.placeCard.follow_ups || []).map((fq, fi) => (
                                <div
                                  key={fi}
                                  onClick={() => runDirectPrompt(fq)}
                                  style={{ display: "flex", justifyContent: "space-between", padding: "7px 4px", borderBottom: "1px solid #f1f5f9", fontSize: "12px", color: "#334155", cursor: "pointer" }}
                                >
                                  <span>{fq}</span>
                                  <span style={{ color: "#94a3b8" }}>▷</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {m.stops?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                            {m.stops.map((s, si) => (
                              <button key={si} className="wb-pill-btn" style={{ padding: '3px 9px', fontSize: '11px' }} onClick={() => { setSelectedPlace({ ...s, name: s.attraction_name }); setDisplayMode('map'); }}>
                                <IconPin /> {s.attraction_name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  )}
                  {loading && <div style={{ fontSize: '12px', color: '#0d9488', fontWeight: 600 }}>Building route...</div>}
                  <div ref={chatEndRef} />
                </div>
                <form style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9' }} onSubmit={(e) => { e.preventDefault(); runDirectPrompt(chatInput); }}>
                  <div className="wb-search-card" style={{ flexDirection: 'row', alignItems: 'center', padding: '6px 8px 6px 14px' }}>
                    <input placeholder="What's the move? (e.g., Make Day 2 more relaxed or 2 days in Coorg)" value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                    <button type="submit" className="wb-submit-pill" disabled={loading || !chatInput.trim()}>↑</button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </section>

      {/* RIGHT PANE: WANDERBOAT DISCOVER BENTO / RESULTS / LIST|MAP SWITCH */}
      <main className="wb-right-pane">
        <div className="wb-discover-top">
          <div className="wb-discover-title-row">
            <h1 className="wb-discover-title">
              {rightView === 'discover' ? 'Discover' : rightView === 'community' ? 'Community' : rightView === 'saved' ? 'Saved Trips' : flowStep === 2 ? 'Recommended Destinations' : itineraryData?.destination?.destination_name || 'Itinerary'}
            </h1>
            <select className="wb-loc-select" value={baseCity} onChange={(e) => { setBaseCity(e.target.value); setPrefs((p) => ({ ...p, startingLocation: e.target.value.split(',')[0] })); }}>
              <option>Bengaluru, Karnataka</option>
              <option>Mysuru, Karnataka</option>
              <option>Hubballi, Karnataka</option>
              <option>Mangaluru, Karnataka</option>
            </select>
          </div>

          {/* WANDERBOAT SEGMENTED LIST | MAP TOGGLE */}
          <div className="wb-seg-toggle">
            <button className={`wb-seg-btn ${displayMode === 'list' ? 'active' : ''}`} onClick={() => setDisplayMode('list')}>
              List
            </button>
            <button className={`wb-seg-btn ${displayMode === 'map' ? 'active' : ''}`} onClick={() => setDisplayMode('map')}>
              <IconMap /> Map
            </button>
          </div>
        </div>

        {/* MAP VIEW WHEN 'MAP' SEGMENT IS CLICKED */}
        {displayMode === 'map' ? (
          <div style={{ flex: 1, width: '100%', position: 'relative' }}>
            <ItineraryMap places={mapPlaces} selectedPlace={selectedPlace} onSelectPlace={setSelectedPlace} />
            {placeDetails && (
              <div style={{ position: 'absolute', bottom: '18px', left: '18px', zIndex: 1000, width: '235px', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 28px rgba(15,23,42,0.22)' }}>
                <img src={placeDetails.photos?.[0] || FALLBACK_IMG} alt={placeDetails.place_name} style={{ width: '100%', height: '125px', objectFit: 'cover' }} />
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px' }}>{placeDetails.place_name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>⭐ {placeDetails.rating} ({placeDetails.reviews_count}) • {placeDetails.category}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* STAYS SHOWCASE VIEW (MATCHING WANDERBOAT HOTEL) */}
            {rightView === 'stays' && (
              <div className="wb-scroll-area wb-fade" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "10px" }}>Explore stays in popular Karnataka cities</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                    {[
                      { name: "Coorg", sub: "18°C - 25°C • Coffee Hills", img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80" },
                      { name: "Hampi", sub: "22°C - 31°C • Heritage Ruins", img: "https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?auto=format&fit=crop&w=600&q=80" },
                      { name: "Gokarna", sub: "24°C - 30°C • Beach Shacks", img: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=600&q=80" },
                      { name: "Mysuru", sub: "20°C - 28°C • Royal Stays", img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80" }
                    ].map((c) => (
                      <div key={c.name} className="wb-bento-card" style={{ height: "155px" }} onClick={() => handleSearchStays(c.name, "")}>
                        <img src={c.img} alt={c.name} />
                        <div className="wb-bento-overlay" style={{ padding: "12px" }}>
                          <div style={{ fontWeight: 800, fontSize: "14px" }}>{c.name}</div>
                          <div style={{ fontSize: "10.5px", color: "#e2e8f0" }}>{c.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "10px" }}>
                    {staysData ? `Deals for Weekend Getaways in ${staysData.city}` : "Deals for Weekend Getaways"}
                  </div>
                  {loading ? (
                    <div style={{ fontSize: "13px", color: "#0d9488", fontWeight: 600 }}>Finding verified stays & weekend rates...</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
                      {(staysData?.stays || []).map((st) => (
                        <div key={st.stay_id} className="wb-card" style={{ cursor: "pointer" }} onClick={() => { setSelectedStay(st); setStayTab("About"); }}>
                          <img className="wb-card-img" src={st.image_url || FALLBACK_IMG} alt={st.name} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                          <div className="wb-card-body">
                            <div className="wb-card-title" style={{ fontSize: "13.5px" }}>{st.name}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{st.area}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                              <span style={{ background: "#fef08a", color: "#0f172a", fontWeight: 800, fontSize: "10.5px", padding: "2px 6px", borderRadius: "6px" }}>{st.rating}</span>
                              <span style={{ fontSize: "11px", fontWeight: 700 }}>{st.label}</span>
                              <span style={{ fontSize: "10.5px", color: "#64748b" }}>({st.reviews})</span>
                            </div>
                            <div style={{ marginTop: "auto", paddingTop: "8px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontSize: "10px", color: "#64748b" }}>Lowest price</div>
                                <div style={{ fontSize: "12.5px", fontWeight: 800 }}>
                                  <span style={{ textDecoration: "line-through", color: "#94a3b8", fontWeight: 500, marginRight: "4px" }}>₹{st.original_price_inr}</span>
                                  From ₹{st.price_per_night_inr}/night
                                </div>
                              </div>
                              <button className="wb-pill-btn" style={{ padding: "3px 8px", fontSize: "10.5px" }} onClick={() => { setSelectedPlace({ name: st.name, latitude: st.latitude, longitude: st.longitude }); setDisplayMode("map"); }}>
                                Map
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DISCOVER BENTO MOSAIC (DEFAULT WANDERBOAT VIEW) */}
            {rightView === 'discover' && (
              <>
                <div className="wb-cat-tabs">
                  {["Today's Inspo", 'All 31 Districts', 'Hill Stations', 'Heritage & Temples', 'Waterfalls', 'Beaches', 'Food & Coffee'].map((cat) => (
                    <button key={cat} className={`wb-cat-tab ${discoverCat === cat ? 'active' : ''}`} onClick={() => setDiscoverCat(cat)}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="wb-scroll-area wb-fade">
                  {discoverCat === 'All 31 Districts' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {['All', 'Bengaluru Division', 'Mysuru Division', 'Belagavi Division', 'Kalaburagi Division'].map(div => (
                            <button key={div} className={`wb-pill-btn ${divisionFilter === div ? 'active' : ''}`} style={{ padding: '5px 11px', fontSize: '11px' }} onClick={() => setDivisionFilter(div)}>
                              {div === 'All' ? `All (${districts31.length})` : div.replace(' Division', '')}
                            </button>
                          ))}
                        </div>
                        <input
                          placeholder="Search district or place..."
                          value={districtSearch}
                          onChange={e => setDistrictSearch(e.target.value)}
                          style={{ padding: '6px 12px', borderRadius: '999px', border: '1px solid #cbd5e1', fontSize: '12px', width: '200px' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(235px, 1fr))', gap: '12px' }}>
                        {visibleDistricts.map(dist => (
                          <div key={dist.id} className="wb-card" style={{ padding: '14px', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="wb-badge">#{dist.id} • {dist.division.replace(' Division', '')}</span>
                              <span style={{ fontSize: '10.5px', color: '#64748b' }}>HQ: {dist.headquarters}</span>
                            </div>
                            <div className="wb-card-title">{dist.name}</div>
                            <div style={{ fontSize: "11.5px", color: "#475569", lineHeight: 1.45 }}>
                              <strong>Main Places:</strong> {dist.topPlaces.join(", ")}
                            </div>
                            {dist.taluks?.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" }}>
                                {dist.taluks.map((t) => (
                                  <span
                                    key={t}
                                    onClick={() => runDirectPrompt(`2 days in ${t}, ${dist.name}`)}
                                    title={`Explore ${t} Taluk`}
                                    style={{ fontSize: "10px", background: "#f1f5f9", color: "#334155", padding: "2px 7px", borderRadius: "999px", cursor: "pointer", fontWeight: 600 }}
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                              <button className="wb-pill-btn" style={{ padding: '4px 9px', fontSize: '11px' }} onClick={() => { setSelectedPlace({ name: dist.name, latitude: dist.latitude, longitude: dist.longitude }); setDisplayMode('map'); }}>
                                Map
                              </button>
                              <button className="wb-pill-btn active" style={{ padding: '4px 11px', fontSize: '11px' }} onClick={() => runDirectPrompt(`2 days in ${dist.name} covering ${dist.topPlaces.slice(0, 3).join(", ")}`)}>
                                Plan Trip →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="wb-bento-grid">
                      {filteredInspo.map((card) => (
                        <div key={card.id} className={`wb-bento-card ${card.hero ? 'hero' : ''}`} onClick={() => runDirectPrompt(card.prompt)}>
                          <img src={card.image} alt={card.title} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                          <div className="wb-bento-overlay">
                            <div className="wb-bento-tag">{card.tag}</div>
                            <div className="wb-bento-title">{card.title}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SINGLE PLACE PICKS CARD (WHEN VIEWING PLACE INFO) */}
            {rightView === 'results' && placeDetails && (
              <div className="wb-scroll-area wb-fade">
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', borderBottom: '2px solid #0d9488', display: 'inline-block', paddingBottom: '4px', marginBottom: '16px' }}>
                  Attractions
                </div>
                <div style={{ width: '275px', borderRadius: '18px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff' }}>
                  <div style={{ position: 'relative', height: '260px' }}>
                    <img src={placeDetails.photos?.[0] || FALLBACK_IMG} alt={placeDetails.place_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#fef08a', color: '#0f172a', fontSize: '10.5px', fontWeight: 800, padding: '3px 9px', borderRadius: '999px' }}>
                      ✦ Picks
                    </span>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 800, fontSize: '14px' }}>{placeDetails.place_name}</div>
                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '3px' }}>
                      ⭐ {placeDetails.rating} ({placeDetails.reviews_count}) • {placeDetails.category} • <span style={{ color: '#059669', fontWeight: 700 }}>Open</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{placeDetails.neighborhood}</div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: DESTINATION RECOMMENDATIONS */}
            {rightView === 'results' && flowStep === 2 && (
              <div className="wb-scroll-area wb-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="wb-grid-2">
                  {(recommendations || []).map((rec) => (
                    <div key={rec.destination_name} className="wb-card">
                      <img className="wb-card-img" src={rec.image_url || FALLBACK_IMG} alt={rec.destination_name} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                      <div className="wb-card-body">
                        <div className="wb-badge">{rec.district} • {rec.approximate_visit_duration}</div>
                        <div className="wb-card-title">{rec.destination_name}</div>
                        <div className="wb-card-desc">{rec.why_recommended}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: rec.within_budget ? '#0d9488' : '#dc2626' }}>Est. ₹{(rec.estimated_group_cost_inr || 0).toLocaleString('en-IN')}</span>
                          <button className="wb-pill-btn active" disabled={loading} onClick={() => handleSelectDestination(rec)}>
                            {selectingDest === rec.destination_name ? 'Building Route...' : 'Select Destination'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: DAY-BY-DAY ITINERARY + EXPENSE BREAKDOWN */}
            {rightView === 'results' && flowStep === 3 && itineraryData && (
              <div className="wb-scroll-area wb-fade" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Est. Total: <strong style={{ color: '#0f172a' }}>₹{(itineraryData.budgetSummary?.estimatedTotalCostINR || 0).toLocaleString('en-IN')}</strong> (₹{(itineraryData.budgetSummary?.perPersonCostINR || 0).toLocaleString('en-IN')}/person)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {recommendations.length > 0 && <button className="wb-pill-btn" onClick={() => setFlowStep(2)}>Change Destination</button>}
                    <button className="wb-pill-btn active" onClick={() => {
                      const next = [{ itinerary_id: Date.now(), title: `${prefs.days}D ${itineraryData.destination.destination_name}`, starting_location: prefs.startingLocation, destination_name: itineraryData.destination.destination_name, days: prefs.days, travellers: prefs.travellers, travel_type: prefs.travelType, estimated_cost_inr: itineraryData.budgetSummary?.estimatedTotalCostINR || 0, itinerary_json: dayPlans }, ...savedTrips];
                      setSavedTrips(next);
                      localStorage.setItem('st_saved_trips', JSON.stringify(next));
                      alert('Saved to My Trips.');
                    }}>Save Trip</button>
                    <button className="wb-pill-btn" onClick={() => { setPublishForm({ postType: 'itinerary', destinationName: itineraryData.destination?.destination_name || 'Karnataka', title: `${prefs.days}-Day ${itineraryData.destination?.destination_name} Itinerary`, caption: '' }); setShowPublishModal(true); }}>Share</button>
                  </div>
                </div>

                {(dayPlans || []).filter((d) => d && d.day && (d.stops || []).length > 0).map((dayObj) => (
                  <div key={dayObj.day} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f766e', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>Day {dayObj.day}: {dayObj.theme}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px' }}>
                      {(dayObj?.stops || []).map((stop, sIdx) => (
                        <div key={`${stop.attraction_name}-${sIdx}`} className={`wb-card ${selectedPlace?.name === stop.attraction_name ? 'selected' : ''}`}>
                          <img className="wb-card-img" src={stop.image_url || FALLBACK_IMG} alt={stop.attraction_name} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                          <div className="wb-card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span className="wb-badge">{stop.slot}</span>
                              <button style={{ border: 'none', background: 'none', color: '#dc2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }} onClick={() => setDayPlans((p) => p.map((d) => d.day === dayObj.day ? { ...d, stops: d.stops.filter((x) => x.attraction_name !== stop.attraction_name) } : d))}>Remove</button>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                              <div className="wb-card-title">{stop.attraction_name}</div>
                              <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#0f766e", background: "#f0fdfa", border: "1px solid #99f6e4", padding: "2px 6px", borderRadius: "999px", whiteSpace: "nowrap" }}>
                                ✓ {stop.verified_source || "Verified"}
                              </span>
                            </div>
                            <div className="wb-card-desc">{stop.description}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginTop: 'auto', paddingTop: '6px' }}>
                              <span>{stop.estimated_visit_duration} hrs • {stop.approximate_entry_fee === 0 ? 'Free Entry' : `₹${stop.approximate_entry_fee} Entry`}</span>
                              <div style={{ display: "flex", gap: "5px" }}>
                                <button className="wb-pill-btn" style={{ padding: "3px 8px", fontSize: "11px" }} onClick={() => { setSelectedPlace({ ...stop, name: stop.attraction_name }); setDisplayMode("map"); }}>
                                  <IconPin /> Map
                                </button>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.attraction_name + " " + (itineraryData?.destination?.destination_name || "Karnataka"))}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="wb-pill-btn"
                                  style={{ padding: "3px 8px", fontSize: "11px", textDecoration: "none" }}
                                >
                                  Verify ↗
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {unscheduled.length > 0 && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                    <div className="wb-badge" style={{ marginBottom: '8px' }}>Add More Attractions</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {unscheduled.map((a) => (
                        <button key={a.attraction_id} className="wb-pill-btn" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setDayPlans((p) => p.map((d, i) => i === p.length - 1 ? { ...d, stops: [...d.stops, { ...a, day: d.day, slot: '06:00 PM • Added' }] } : d))}>
                          + {a.attraction_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* COMMUNITY VIEW */}
            {rightView === 'community' && (
              <div className="wb-scroll-area wb-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ key: 'all', label: 'All' }, { key: 'post', label: 'Posts' }, { key: 'itinerary', label: 'Itineraries' }].map((t) => (
                      <button key={t.key} className={`wb-pill-btn ${communityFilter === t.key ? 'active' : ''}`} onClick={() => { setCommunityFilter(t.key); fetchCommunity(t.key); }}>{t.label}</button>
                    ))}
                  </div>
                  <button className="wb-pill-btn active" onClick={() => setShowPublishModal(true)}>+ Create Post</button>
                </div>
                <div className="wb-grid-2">
                  {communityItems.map((item) => (
                    <div key={item.post_id} className="wb-card">
                      <img className="wb-card-img" src={item.image_url || FALLBACK_IMG} alt={item.title} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                      <div className="wb-card-body">
                        <div className="wb-badge">{item.post_type === 'itinerary' ? 'Shared Itinerary' : 'Travel Post'} • {item.destination_name}</div>
                        <div className="wb-card-title">{item.title}</div>
                        <div className="wb-card-desc">{item.caption}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                          <button className="wb-pill-btn" onClick={() => {
                            const updated = communityItems.map((c) => c.post_id === item.post_id ? { ...c, likes_count: c.likes_count + 1 } : c);
                            setCommunityItems(updated);
                            localStorage.setItem('st_community', JSON.stringify(updated));
                          }}><IconHeart /> {item.likes_count}</button>
                          {Array.isArray(item.itinerary_json) && item.itinerary_json.length > 0 && (
                            <button className="wb-pill-btn active" onClick={() => {
                              setItineraryData({ destination: { destination_name: item.destination_name }, budgetSummary: { estimatedTotalCostINR: item.budget_inr, perPersonCostINR: Math.round(item.budget_inr / 2) } });
                              setDayPlans([{ day: 1, theme: item.title, stops: item.itinerary_json.map((s) => ({ ...s, attraction_name: s.attraction_name || s.name, estimated_visit_duration: s.duration || '1.5', approximate_entry_fee: 0 })) }]);
                              setLeftMode('wizard');
                              setFlowStep(3);
                              setRightView('results');
                            }}>Clone Route</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SAVED TRIPS VIEW */}
            {rightView === 'saved' && (
              <div className="wb-scroll-area wb-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {savedTrips.length === 0 ? <p style={{ fontSize: '13px', color: '#64748b' }}>No saved trips yet.</p> : (
                  <div className="wb-grid-2">
                    {savedTrips.map((trip) => (
                      <div key={trip.itinerary_id} className="wb-card">
                        <div className="wb-card-body">
                          <div className="wb-badge">{trip.days} Days • {trip.travel_type}</div>
                          <div className="wb-card-title">{trip.title}</div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button className="wb-pill-btn active" onClick={() => { setItineraryData({ destination: { destination_name: trip.destination_name }, budgetSummary: { estimatedTotalCostINR: trip.estimated_cost_inr, perPersonCostINR: Math.round((trip.estimated_cost_inr || 0) / 2) } }); setDayPlans(trip.itinerary_json || []); setLeftMode('wizard'); setFlowStep(3); setRightView('results'); }}>Open</button>
                            <button className="wb-pill-btn" onClick={() => { const next = savedTrips.filter((t) => t.itinerary_id !== trip.itinerary_id); setSavedTrips(next); localStorage.setItem('st_saved_trips', JSON.stringify(next)); }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
