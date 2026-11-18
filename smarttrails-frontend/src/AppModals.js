import React from 'react';

export const INTEREST_OPTIONS = [
  'Nature', 'Beaches', 'Heritage and Historical Places', 'Trekking',
  'Adventure', 'Waterfalls', 'Wildlife', 'Hill Stations',
  'Spiritual and Religious Places', 'Food and Culture'
];

export const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80';

export const STARTER_COMMUNITY = [
  {
    post_id: 1,
    author_name: 'Aarav Kulkarni',
    author_city: 'Bengaluru',
    post_type: 'itinerary',
    destination_name: 'Hampi',
    title: '2-Day Sunrise & Temple Trail in Hampi',
    caption: 'Started at Matanga Hill for sunrise, explored Virupaksha & Vittala Temple complex, and took a coracle ride across Tungabhadra.',
    image_url: 'https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?auto=format&fit=crop&w=800&q=80',
    days: 2,
    budget_inr: 7500,
    likes_count: 24,
    itinerary_json: [
      { day: 1, slot: '09:00 AM • Morning', name: 'Virupaksha Temple', category: 'Heritage and Historical Places', latitude: 15.3350, longitude: 76.4600, duration: '2 hrs', price: '₹50 Entry', description: 'Ancient Shiva temple at the heart of Hampi bazaar.' },
      { day: 1, slot: '02:00 PM • Afternoon', name: 'Vittala Temple & Stone Chariot', category: 'Heritage and Historical Places', latitude: 15.3422, longitude: 76.4754, duration: '2.5 hrs', price: '₹40 Entry', description: 'Iconic musical pillars and carved stone chariot.' },
      { day: 2, slot: '06:30 AM • Morning', name: 'Matanga Hill Sunrise Point', category: 'Trekking', latitude: 15.3364, longitude: 76.4658, duration: '1.5 hrs', price: 'Free Entry', description: 'Panoramic sunrise view over Hampi boulders.' }
    ]
  },
  {
    post_id: 2,
    author_name: 'Meera Nair',
    author_city: 'Mysuru',
    post_type: 'post',
    destination_name: 'Coorg (Kodagu)',
    title: 'Misty Mornings & Filter Coffee in Madikeri',
    caption: 'Visited Abbey Falls right at 8 AM before the crowds arrived, followed by a coffee estate walk and Raja’s Seat sunset.',
    image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
    days: 3,
    budget_inr: 11000,
    likes_count: 31,
    itinerary_json: []
  }
];

export const IconCompass = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

export const IconGlobe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const IconBookmark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export const IconMap = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

export const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const IconHeart = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export function AuthModal({ authForm, setAuthForm, onSubmit }) {
  return (
    <div className="wb-modal-backdrop">
      <form className="wb-modal" onSubmit={onSubmit}>
        <div className="wb-badge">SmartTrails Karnataka • Traveler Profile</div>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Sign In to SmartTrails</h2>
        <p style={{ fontSize: '12.5px', color: '#64748b' }}>
          Personalize your Karnataka travel recommendations, save routes, and share posts.
        </p>
        <div className="wb-field">
          <label>Full Name *</label>
          <input required placeholder="e.g., Anvita Rao" value={authForm.fullName} onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })} />
        </div>
        <div className="wb-field">
          <label>Email Address *</label>
          <input required type="email" placeholder="e.g., anvita@example.com" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
        </div>
        <div className="wb-form-grid">
          <div className="wb-field">
            <label>Home City</label>
            <input value={authForm.homeCity} onChange={(e) => setAuthForm({ ...authForm, homeCity: e.target.value })} />
          </div>
          <div className="wb-field">
            <label>Default Travel Style</label>
            <select value={authForm.travelStyle} onChange={(e) => setAuthForm({ ...authForm, travelStyle: e.target.value })}>
              <option>Solo</option><option>Couple</option><option>Family</option><option>Friends</option><option>Group</option>
            </select>
          </div>
        </div>
        <button type="submit" className="wb-primary-btn">Continue to Planner</button>
      </form>
    </div>
  );
}

export function PublishModal({ publishForm, setPublishForm, onClose, onSubmit }) {
  return (
    <div className="wb-modal-backdrop" onClick={onClose}>
      <form className="wb-modal" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div className="wb-badge">SmartTrails Community</div>
        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Share Post or Itinerary</h2>
        <div className="wb-form-grid">
          <div className="wb-field">
            <label>Share Type</label>
            <select value={publishForm.postType} onChange={(e) => setPublishForm({ ...publishForm, postType: e.target.value })}>
              <option value="post">Travel Story Post</option>
              <option value="itinerary">Cloneable Itinerary</option>
            </select>
          </div>
          <div className="wb-field">
            <label>Karnataka Destination</label>
            <input required value={publishForm.destinationName} onChange={(e) => setPublishForm({ ...publishForm, destinationName: e.target.value })} />
          </div>
        </div>
        <div className="wb-field">
          <label>Post Headline *</label>
          <input required placeholder="e.g., 2 Days in Hampi Under ₹7,500" value={publishForm.title} onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })} />
        </div>
        <div className="wb-field">
          <label>Experience & Notes *</label>
          <textarea rows="3" required placeholder="Share best timings, food spots, and route advice..." value={publishForm.caption} onChange={(e) => setPublishForm({ ...publishForm, caption: e.target.value })} />
        </div>
        <button type="submit" className="wb-primary-btn">Publish to Community</button>
      </form>
    </div>
  );
}
