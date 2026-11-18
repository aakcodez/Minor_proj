import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ItineraryMap from './ItineraryMap';
import {
  INTEREST_OPTIONS, FALLBACK_IMG, STARTER_COMMUNITY,
  IconCompass, IconGlobe, IconBookmark, IconMap, IconPin, IconHeart,
  AuthModal, PublishModal
} from './AppModals';
import './App.css';

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('st_user') || 'null'));
  const [showAuthModal, setShowAuthModal] = useState(!localStorage.getItem('st_user'));
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', homeCity: 'Bengaluru', travelStyle: 'Couple' });

  const [navTab, setNavTab] = useState('planner');
  const [showMap, setShowMap] = useState(false);
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
  const [dayPlans, setDayPlans] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const [communityFilter, setCommunityFilter] = useState('all');
  const [communityItems, setCommunityItems] = useState([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({ postType: 'post', destinationName: 'Coorg (Kodagu)', title: '', caption: '' });
  const [savedTrips, setSavedTrips] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { fetchCommunity('all'); setSavedTrips(JSON.parse(localStorage.getItem('st_saved_trips') || '[]')); }, []);

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
    setPrefs((p) => ({ ...p, startingLocation: u.home_city, travelType: u.travel_style }));
    setShowAuthModal(false);
  };

  const handleFindDestinations = async (e) => {
    if (e) e.preventDefault();
    if (!prefs.interests.length) return setApiError('Select at least one travel interest.');
    setApiError('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', text: `Find Karnataka destinations from ${prefs.startingLocation} (${prefs.days}D, ${prefs.travellers} ${prefs.travelType}, ₹${prefs.budgetINR})` }]);

    try {
      const { data } = await axios.post('/api/recommendations', prefs);
      const recs = data.recommendations || [];
      setRecommendations(recs);
      setFlowStep(2);
      setMessages((prev) => [...prev, { role: 'ai', text: `Found ${recs.length} matching destinations. Select one to build your day-by-day itinerary.` }]);
    } catch (err) {
      const msg = err.response?.data?.details || err.response?.data?.error || err.message;
      setApiError(msg);
      setMessages((prev) => [...prev, { role: 'ai', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDestination = async (destCard) => {
    setApiError('');
    setLoading(true);
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
      const stops = (data.dayPlans || []).flatMap((d) => d.stops);
      setSelectedPlace(stops[0] || null);
      setFlowStep(3);
      setMessages((prev) => [...prev, { role: 'ai', text: data.overview || `Built ${prefs.days}-day itinerary for ${destCard.destination_name}.`, stops }]);
    } catch (err) {
      const msg = err.response?.data?.details || err.response?.data?.error || err.message;
      setApiError(msg);
      setMessages((prev) => [...prev, { role: 'ai', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || loading) return;
    setChatInput('');
    setApiError('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', text }]);

    try {
      const { data } = await axios.post('/api/chat', { message: text, preferences: prefs });
      setItineraryData(data);
      setDayPlans(data.dayPlans || []);
      const stops = (data.dayPlans || []).flatMap((d) => d.stops);
      setSelectedPlace(stops[0] || null);
      setFlowStep(3);
      setNavTab('planner');
      setMessages((prev) => [...prev, { role: 'ai', text: data.overview || 'Itinerary ready.', stops }]);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setApiError(msg);
      setMessages((prev) => [...prev, { role: 'ai', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const mapPlaces = navTab === 'community'
    ? communityItems.flatMap((i) => (Array.isArray(i.itinerary_json) ? i.itinerary_json.map((s) => ({ ...s, name: s.attraction_name || s.name })) : []))
    : flowStep === 2
    ? recommendations.map((r) => ({ day: 1, name: r.destination_name, category: r.district, latitude: r.latitude, longitude: r.longitude, price: `₹${r.estimated_group_cost_inr}` }))
    : dayPlans.flatMap((d) => d.stops.map((s) => ({ ...s, day: d.day, name: s.attraction_name || s.name, price: s.approximate_entry_fee === 0 ? 'Free Entry' : `₹${s.approximate_entry_fee} Entry` })));

  const scheduledNames = new Set(dayPlans.flatMap((d) => d.stops.map((s) => s.attraction_name)));
  const unscheduled = (itineraryData?.availableAttractions || []).filter((a) => !scheduledNames.has(a.attraction_name));

  return (
    <div className="wb-layout">
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
              itinerary_json: publishForm.postType === 'itinerary' ? dayPlans.flatMap((d) => d.stops) : []
            }, ...existing];
            localStorage.setItem('st_community', JSON.stringify(next));
            setShowPublishModal(false);
            fetchCommunity(communityFilter);
            setNavTab('community');
          }}
        />
      )}

      <aside className="wb-rail">
        <div className="wb-brand-icon">ST</div>
        <button className={`wb-rail-item ${navTab === 'planner' ? 'active' : ''}`} title="Trip Planner" onClick={() => setNavTab('planner')}><IconCompass /></button>
        <button className={`wb-rail-item ${navTab === 'community' ? 'active' : ''}`} title="Community" onClick={() => { setNavTab('community'); fetchCommunity(communityFilter); }}><IconGlobe /></button>
        <button className={`wb-rail-item ${navTab === 'saved' ? 'active' : ''}`} title="Saved Trips" onClick={() => setNavTab('saved')}><IconBookmark /></button>
        <button className="wb-avatar-btn" onClick={() => setShowAuthModal(true)}>{(user?.full_name || 'U')[0].toUpperCase()}</button>
      </aside>

      <section className="wb-copilot">
        <div className="wb-pane-header">
          <span className="wb-pane-title">{user ? `Hi, ${user.full_name.split(' ')[0]}` : 'SmartTrails Copilot'}</span>
          <button className="wb-chip-btn" onClick={() => setShowAuthModal(true)}>{user ? `${user.home_city} • ${user.travel_style}` : 'Sign In'}</button>
        </div>

        <div className="wb-stepper">
          <div className={`wb-step-pill ${flowStep === 1 ? 'active' : 'done'}`} onClick={() => { setNavTab('planner'); setFlowStep(1); }}>1. Preferences</div>
          <div className={`wb-step-pill ${flowStep === 2 ? 'active' : recommendations.length ? 'done' : ''}`} onClick={() => recommendations.length && setFlowStep(2)}>2. Destinations</div>
          <div className={`wb-step-pill ${flowStep === 3 ? 'active' : itineraryData ? 'done' : ''}`} onClick={() => itineraryData && setFlowStep(3)}>3. Itinerary</div>
        </div>

        {flowStep === 1 ? (
          <form className="wb-form-card wb-animate-in" onSubmit={handleFindDestinations}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#065f46' }}>Configure your Karnataka trip preferences</div>
            <div className="wb-form-grid">
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
              <div className="wb-tag-cloud">
                {INTEREST_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`wb-tag ${prefs.interests.includes(item) ? 'selected' : ''}`}
                    onClick={() => setPrefs((p) => ({ ...p, interests: p.interests.includes(item) ? p.interests.filter((x) => x !== item) : [...p.interests, item] }))}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            {apiError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 12px', borderRadius: '10px', fontSize: '12px' }}>{apiError}</div>}
            <button type="submit" className="wb-primary-btn" disabled={loading}>{loading ? 'Finding Matching Destinations...' : 'Find Matching Destinations'}</button>
          </form>
        ) : (
          <>
            <div className="wb-chat-scroll">
              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="wb-user-msg">{m.text}</div>
                ) : (
                  <div key={i} className="wb-ai-msg">
                    <div>{m.text}</div>
                    {m.stops?.length > 0 && (
                      <div className="wb-tag-cloud">
                        {m.stops.map((s, si) => (
                          <button key={si} className={`wb-inline-place ${selectedPlace?.name === s.attraction_name ? 'active' : ''}`} onClick={() => { setSelectedPlace({ ...s, name: s.attraction_name }); setShowMap(true); }}>
                            <IconPin /> {s.attraction_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
              {loading && <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>Generating itinerary...</div>}
              <div ref={chatEndRef} />
            </div>
            <form className="wb-prompt-footer" onSubmit={handleChatSend}>
              <div className="wb-prompt-bar">
                <input placeholder="Ask e.g., 3 days in Gokarna under ₹9000..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                <button type="submit" className="wb-send-circle" disabled={loading || !chatInput.trim()}>↑</button>
              </div>
            </form>
          </>
        )}
      </section>

      <main className="wb-main-board">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div className="wb-badge">
            {navTab === 'planner' ? `Step ${flowStep} of 3 • SmartTrails Karnataka` : navTab === 'community' ? 'SmartTrails Community' : 'Saved Trips'}
          </div>
          <button className={`wb-chip-btn ${showMap ? 'active' : ''}`} onClick={() => setShowMap(!showMap)}>
            <IconMap /> {showMap ? 'Hide Route Map' : 'View Route Map'}
          </button>
        </div>

        {navTab === 'planner' && flowStep === 1 && (
          <div className="wb-animate-in" style={{ margin: 'auto', textAlign: 'center', maxWidth: '400px' }}>
            <div className="wb-badge">Step 1 of 3 • Preference Intake</div>
            <h2 style={{ fontSize: '21px', fontWeight: 800, margin: '8px 0' }}>Configure Your Karnataka Trip</h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.65 }}>
              Enter your starting city, travel interests, group size, duration, and budget on the left. We will rank matching Karnataka destinations first, and then build your day-by-day itinerary.
            </p>
          </div>
        )}

        {navTab === 'planner' && flowStep === 2 && (
          <div className="wb-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 800 }}>Recommended Karnataka Destinations</h2>
              <button className="wb-chip-btn" onClick={() => setFlowStep(1)}>Edit Preferences</button>
            </div>
            {apiError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '12px', fontSize: '12.5px' }}>{apiError}</div>}
            <div className="wb-grid-2">
              {recommendations.map((rec) => (
                <div key={rec.destination_name} className="wb-card">
                  <img className="wb-card-img" src={rec.image_url || FALLBACK_IMG} alt={rec.destination_name} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                  <div className="wb-card-body">
                    <div className="wb-badge">{rec.district} • {rec.approximate_visit_duration}</div>
                    <div className="wb-card-title">{rec.destination_name}</div>
                    <div className="wb-card-desc">{rec.why_recommended}</div>
                    <div className="wb-tag-cloud">
                      {(rec.matched_interests || []).map((t) => <span key={t} className="wb-tag selected" style={{ fontSize: '10px', padding: '2px 8px' }}>{t}</span>)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: rec.within_budget ? '#059669' : '#dc2626' }}>Est. ₹{(rec.estimated_group_cost_inr || 0).toLocaleString('en-IN')}</span>
                      <button className="wb-chip-btn active" disabled={loading} onClick={() => handleSelectDestination(rec)}>
                        {loading ? 'Loading...' : 'Select Destination'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {navTab === 'planner' && flowStep === 3 && itineraryData && (
          <div className="wb-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{itineraryData.destination?.destination_name}, Karnataka</h2>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="wb-chip-btn" onClick={() => setFlowStep(2)}>Change Destination</button>
                <button className="wb-chip-btn active" onClick={() => {
                  const next = [{ itinerary_id: Date.now(), title: `${prefs.days}D ${itineraryData.destination.destination_name}`, starting_location: prefs.startingLocation, destination_name: itineraryData.destination.destination_name, days: prefs.days, travellers: prefs.travellers, travel_type: prefs.travelType, estimated_cost_inr: itineraryData.budgetSummary?.estimatedTotalCostINR || 0, itinerary_json: dayPlans }, ...savedTrips];
                  setSavedTrips(next);
                  localStorage.setItem('st_saved_trips', JSON.stringify(next));
                  alert('Saved to My Trips.');
                }}>Save Trip</button>
                <button className="wb-chip-btn" onClick={() => { setPublishForm({ postType: 'itinerary', destinationName: itineraryData.destination?.destination_name || 'Karnataka', title: `${prefs.days}-Day ${itineraryData.destination?.destination_name} Itinerary`, caption: '' }); setShowPublishModal(true); }}>Share</button>
              </div>
            </div>

            {itineraryData.budgetSummary?.warning && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '12px', fontSize: '12.5px' }}>{itineraryData.budgetSummary.warning}</div>
            )}

            <div className="wb-grid-2">
              <div className="wb-kpi-box">
                <div className="wb-kpi-label">Total Group Estimate</div>
                <div className="wb-kpi-val">₹{(itineraryData.budgetSummary?.estimatedTotalCostINR || 0).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>Per Person: ₹{(itineraryData.budgetSummary?.perPersonCostINR || 0).toLocaleString('en-IN')} • Limit: ₹{prefs.budgetINR.toLocaleString('en-IN')}</div>
              </div>
              <div className="wb-kpi-box">
                <div className="wb-kpi-label">Cost Breakdown (Approx.)</div>
                <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', lineHeight: 1.55 }}>
                  Stay: ₹{itineraryData.budgetSummary?.breakdown?.accommodationINR || 0} • Food: ₹{itineraryData.budgetSummary?.breakdown?.foodINR || 0} • Transport: ₹{itineraryData.budgetSummary?.breakdown?.transportINR || 0} • Entry: ₹{itineraryData.budgetSummary?.breakdown?.entryAndActivitiesINR || 0}
                </div>
              </div>
            </div>

            {dayPlans.map((dayObj) => (
              <div key={dayObj.day} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#065f46', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Day {dayObj.day}: {dayObj.theme}</div>
                <div className="wb-grid-2">
                  {dayObj.stops.map((stop, sIdx) => (
                    <div key={`${stop.attraction_name}-${sIdx}`} className={`wb-card ${selectedPlace?.name === stop.attraction_name ? 'selected' : ''}`} onClick={() => setSelectedPlace({ ...stop, name: stop.attraction_name })}>
                      <img className="wb-card-img" src={stop.image_url || FALLBACK_IMG} alt={stop.attraction_name} onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} />
                      <div className="wb-card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span className="wb-badge">{stop.slot}</span>
                          <button style={{ border: 'none', background: 'none', color: '#dc2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setDayPlans((p) => p.map((d) => d.day === dayObj.day ? { ...d, stops: d.stops.filter((x) => x.attraction_name !== stop.attraction_name) } : d)); }}>Remove</button>
                        </div>
                        <div className="wb-card-title">{stop.attraction_name}</div>
                        <div className="wb-card-desc">{stop.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginTop: 'auto', paddingTop: '6px' }}>
                          <span>{stop.estimated_visit_duration} hrs • {stop.approximate_entry_fee === 0 ? 'Free Entry' : `₹${stop.approximate_entry_fee} Entry`}</span>
                          <button className="wb-inline-place" onClick={(e) => { e.stopPropagation(); setSelectedPlace({ ...stop, name: stop.attraction_name }); setShowMap(true); }}><IconPin /> Map</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {unscheduled.length > 0 && (
              <div className="wb-kpi-box">
                <div className="wb-kpi-label" style={{ marginBottom: '8px' }}>Add More Attractions</div>
                <div className="wb-tag-cloud">
                  {unscheduled.map((a) => (
                    <button key={a.attraction_id} className="wb-tag" onClick={() => setDayPlans((p) => p.map((d, i) => i === p.length - 1 ? { ...d, stops: [...d.stops, { ...a, day: d.day, slot: '06:00 PM • Added' }] } : d))}>
                      + {a.attraction_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {navTab === 'community' && (
          <div className="wb-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 800 }}>Explore Traveler Posts & Itineraries</h2>
              <button className="wb-chip-btn active" onClick={() => setShowPublishModal(true)}>+ Create Post</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[{ key: 'all', label: 'All Community' }, { key: 'post', label: 'Travel Posts' }, { key: 'itinerary', label: 'Shared Itineraries' }].map((t) => (
                <button key={t.key} className={`wb-chip-btn ${communityFilter === t.key ? 'active' : ''}`} onClick={() => { setCommunityFilter(t.key); fetchCommunity(t.key); }}>{t.label}</button>
              ))}
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
                      <button className="wb-chip-btn" onClick={() => {
                        const updated = communityItems.map((c) => c.post_id === item.post_id ? { ...c, likes_count: c.likes_count + 1 } : c);
                        setCommunityItems(updated);
                        localStorage.setItem('st_community', JSON.stringify(updated));
                      }}><IconHeart /> {item.likes_count}</button>
                      {Array.isArray(item.itinerary_json) && item.itinerary_json.length > 0 && (
                        <button className="wb-chip-btn active" onClick={() => {
                          setItineraryData({ destination: { destination_name: item.destination_name }, budgetSummary: { estimatedTotalCostINR: item.budget_inr, perPersonCostINR: Math.round(item.budget_inr / 2) } });
                          setDayPlans([{ day: 1, theme: item.title, stops: item.itinerary_json.map((s) => ({ ...s, attraction_name: s.attraction_name || s.name, estimated_visit_duration: s.duration || '1.5', approximate_entry_fee: 0 })) }]);
                          setFlowStep(3);
                          setNavTab('planner');
                        }}>Clone Route</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {navTab === 'saved' && (
          <div className="wb-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '19px', fontWeight: 800 }}>Your Saved Karnataka Itineraries</h2>
            {savedTrips.length === 0 ? <p style={{ fontSize: '13px', color: '#64748b' }}>No saved trips yet.</p> : (
              <div className="wb-grid-2">
                {savedTrips.map((trip) => (
                  <div key={trip.itinerary_id} className="wb-card">
                    <div className="wb-card-body">
                      <div className="wb-badge">{trip.days} Days • {trip.travel_type}</div>
                      <div className="wb-card-title">{trip.title}</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button className="wb-chip-btn active" onClick={() => { setItineraryData({ destination: { destination_name: trip.destination_name }, budgetSummary: { estimatedTotalCostINR: trip.estimated_cost_inr, perPersonCostINR: Math.round((trip.estimated_cost_inr || 0) / 2) } }); setDayPlans(trip.itinerary_json || []); setFlowStep(3); setNavTab('planner'); }}>Open</button>
                        <button className="wb-chip-btn" onClick={() => { const next = savedTrips.filter((t) => t.itinerary_id !== trip.itinerary_id); setSavedTrips(next); localStorage.setItem('st_saved_trips', JSON.stringify(next)); }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <aside className={`wb-map-drawer ${showMap ? 'open' : ''}`}>
        {showMap && (
          <>
            <div className="wb-pane-header">
              <span className="wb-pane-title">Route Map</span>
              <button className="wb-chip-btn" onClick={() => setShowMap(false)}>Close</button>
            </div>
            <div className="wb-map-box">
              <ItineraryMap places={mapPlaces} selectedPlace={selectedPlace} onSelectPlace={setSelectedPlace} />
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
