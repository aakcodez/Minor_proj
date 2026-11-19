const KARNATAKA_31_DISTRICTS = [
  // ================= BENGALURU DIVISION (10 Districts) =================
  {
    id: 1, name: 'Bengaluru Urban', division: 'Bengaluru Division', headquarters: 'Bengaluru',
    latitude: 12.9716, longitude: 77.5946,
    taluks: ['Bengaluru North', 'Bengaluru South', 'Bengaluru East', 'Yelahanka', 'Anekal'],
    categories: ['Food and Culture', 'Heritage and Historical Places', 'Nature'],
    topPlaces: ['Lalbagh Botanical Garden', 'Cubbon Park', 'Bangalore Palace', 'Vidhana Soudha', 'Bannerghatta Biological Park']
  },
  {
    id: 2, name: 'Bengaluru Rural', division: 'Bengaluru Division', headquarters: 'Doddaballapura',
    latitude: 13.2847, longitude: 77.6078,
    taluks: ['Devanahalli', 'Doddaballapura', 'Hosakote', 'Nelamangala'],
    categories: ['Trekking', 'Heritage and Historical Places', 'Spiritual and Religious Places'],
    topPlaces: ['Devanahalli Fort', 'Savandurga Hills', 'Ghati Subramanya Temple', 'Makalidurga Fort', 'Shivagange']
  },
  {
    id: 3, name: 'Chikkaballapura', division: 'Bengaluru Division', headquarters: 'Chikkaballapura',
    latitude: 13.4355, longitude: 77.7315,
    taluks: ['Chikkaballapura', 'Bagepalli', 'Chintamani', 'Gauribidanur', 'Gudibande', 'Sidlaghatta', 'Chelur', 'Manchenahalli'],
    categories: ['Hill Stations', 'Trekking', 'Spiritual and Religious Places'],
    topPlaces: ['Nandi Hills', 'Skandagiri Trek', 'Bhoga Nandeeshwara Temple', 'Avalabetta', 'Gudibande Fort']
  },
  {
    id: 4, name: 'Chitradurga', division: 'Bengaluru Division', headquarters: 'Chitradurga',
    latitude: 14.2251, longitude: 76.3980,
    taluks: ['Chitradurga', 'Challakere', 'Hiriyur', 'Holalkere', 'Hosadurga', 'Molakalmuru'],
    categories: ['Heritage and Historical Places', 'Trekking', 'Nature'],
    topPlaces: ['Chitradurga Fort (Kallina Kote)', 'Chandravalli Caves', 'Vani Vilas Sagar Dam', 'Jogimatti Forest Reserve']
  },
  {
    id: 5, name: 'Davanagere', division: 'Bengaluru Division', headquarters: 'Davanagere',
    latitude: 14.4644, longitude: 75.9218,
    taluks: ['Davanagere', 'Harihara', 'Channagiri', 'Honnali', 'Jagalur', 'Nyamathi'],
    categories: ['Food and Culture', 'Spiritual and Religious Places', 'Nature'],
    topPlaces: ['Kunduvada Kere', 'Harihareshwara Temple', 'Sulekere (Shanti Sagara)', 'Davanagere Benne Dosa Trail']
  },
  {
    id: 6, name: 'Kolar', division: 'Bengaluru Division', headquarters: 'Kolar',
    latitude: 13.1362, longitude: 78.1291,
    taluks: ['Kolar', 'Bangarapet', 'Kolar Gold Fields (KGF)', 'Malur', 'Mulbagal', 'Srinivaspur'],
    categories: ['Spiritual and Religious Places', 'Trekking', 'Heritage and Historical Places'],
    topPlaces: ['Kotilingeshwara Temple', 'Antaragange Caves & Night Trek', 'Someshwara Temple Kolar', 'Kurudumale Ganesha Temple']
  },
  {
    id: 7, name: 'Ramanagara', division: 'Bengaluru Division', headquarters: 'Ramanagara',
    latitude: 12.7209, longitude: 77.2799,
    taluks: ['Ramanagara', 'Channapatna', 'Kanakapura', 'Magadi', 'Harohalli'],
    categories: ['Trekking', 'Adventure', 'Nature'],
    topPlaces: ['Ramadevara Betta (Sholay Hills)', 'Janapada Loka', 'Channapatna Toy Town', 'Mekedatu & Sangama', 'Chunchi Falls']
  },
  {
    id: 8, name: 'Shivamogga', division: 'Bengaluru Division', headquarters: 'Shivamogga',
    latitude: 13.9299, longitude: 75.5681,
    taluks: ['Shivamogga', 'Bhadravathi', 'Hosanagara', 'Sagara', 'Shikaripura', 'Soraba', 'Thirthahalli'],
    categories: ['Waterfalls', 'Nature', 'Wildlife', 'Trekking'],
    topPlaces: ['Jog Falls', 'Agumbe Rainforest & Sunset Point', 'Kodachadri Peak', 'Sakrebailu Elephant Camp', 'Kavaledurga Fort']
  },
  {
    id: 9, name: 'Tumakuru', division: 'Bengaluru Division', headquarters: 'Tumakuru',
    latitude: 13.3379, longitude: 77.1173,
    taluks: ['Tumakuru', 'Chikkanayakanahalli', 'Gubbi', 'Koratagere', 'Kunigal', 'Madhugiri', 'Pavagada', 'Sira', 'Tiptur', 'Turuvekere'],
    categories: ['Trekking', 'Spiritual and Religious Places', 'Nature'],
    topPlaces: ['Devarayanadurga Hills', 'Siddaganga Mutt', 'Madhugiri Monolith Fort', 'Namada Chilume', 'Pavagada Fort']
  },
  {
    id: 10, name: 'Vijayanagara', division: 'Bengaluru Division', headquarters: 'Hosapete',
    latitude: 15.2689, longitude: 76.3909,
    taluks: ['Hosapete', 'Hagaribommanahalli', 'Harapanahalli', 'Hoovina Hadagali', 'Kotturu', 'Kudligi'],
    categories: ['Heritage and Historical Places', 'Trekking', 'Food and Culture'],
    topPlaces: ['Hampi UNESCO Ruins', 'Virupaksha Temple', 'Vittala Temple & Stone Chariot', 'Matanga Hill', 'Tungabhadra Dam']
  },

  // ================= MYSURU DIVISION (8 Districts) =================
  {
    id: 11, name: 'Chamarajanagar', division: 'Mysuru Division', headquarters: 'Chamarajanagar',
    latitude: 11.9261, longitude: 76.9437,
    taluks: ['Chamarajanagar', 'Gundlupet', 'Kollegal', 'Yelandur', 'Hanur'],
    categories: ['Wildlife', 'Spiritual and Religious Places', 'Waterfalls'],
    topPlaces: ['Bandipur Tiger Reserve', 'BR Hills (Biligiriranga Hills)', 'Male Mahadeshwara Hills', 'Bharachukki & Hogenakkal Falls']
  },
  {
    id: 12, name: 'Chikkamagaluru', division: 'Mysuru Division', headquarters: 'Chikkamagaluru',
    latitude: 13.3161, longitude: 75.7720,
    taluks: ['Chikkamagaluru', 'Kadur', 'Koppa', 'Mudigere', 'Narasimharajapura', 'Sringeri', 'Tarikere', 'Ajjampura', 'Kalasa'],
    categories: ['Hill Stations', 'Trekking', 'Waterfalls', 'Nature'],
    topPlaces: ['Mullayanagiri Peak', 'Baba Budangiri', 'Hebbe Falls', 'Kudremukh National Park', 'Sringeri Sharada Peetham']
  },
  {
    id: 13, name: 'Dakshina Kannada', division: 'Mysuru Division', headquarters: 'Mangaluru',
    latitude: 12.9141, longitude: 74.8560,
    taluks: ['Mangaluru', 'Bantwal', 'Belthangady', 'Puttur', 'Sullia', 'Moodabidri', 'Kadaba', 'Mulki', 'Ullal'],
    categories: ['Beaches', 'Spiritual and Religious Places', 'Food and Culture'],
    topPlaces: ['Panambur Beach', 'Tannirbhavi Beach', 'Kudroli Gokarnath Temple', 'Dharmasthala Manjunatha Temple', 'Thousand Pillar Temple Moodabidri']
  },
  {
    id: 14, name: 'Hassan', division: 'Mysuru Division', headquarters: 'Hassan',
    latitude: 13.0033, longitude: 76.1004,
    taluks: ['Hassan', 'Alur', 'Arkalgud', 'Arsikere', 'Belur', 'Channarayapatna', 'Holenarasipura', 'Sakleshpur'],
    categories: ['Heritage and Historical Places', 'Hill Stations', 'Spiritual and Religious Places'],
    topPlaces: ['Belur Chennakeshava Temple', 'Halebidu Hoysaleswara Temple', 'Shravanabelagola', 'Sakleshpur & Manjarabad Fort']
  },
  {
    id: 15, name: 'Kodagu (Coorg)', division: 'Mysuru Division', headquarters: 'Madikeri',
    latitude: 12.4244, longitude: 75.7382,
    taluks: ['Madikeri', 'Somwarpet', 'Virajpet', 'Kushalnagar', 'Ponnampet'],
    categories: ['Hill Stations', 'Waterfalls', 'Nature', 'Wildlife'],
    topPlaces: ['Abbey Falls', 'Raja’s Seat Madikeri', 'Dubare Elephant Camp', 'Talacauvery', 'Namdroling Golden Temple']
  },
  {
    id: 16, name: 'Mandya', division: 'Mysuru Division', headquarters: 'Mandya',
    latitude: 12.5218, longitude: 76.8951,
    taluks: ['Mandya', 'Krishnarajapet', 'Maddur', 'Malavalli', 'Nagamangala', 'Pandavapura', 'Srirangapatna'],
    categories: ['Waterfalls', 'Wildlife', 'Heritage and Historical Places'],
    topPlaces: ['Shivanasamudra Falls', 'Ranganathittu Bird Sanctuary', 'Srirangapatna Fort', 'KRS Brindavan Gardens', 'Melukote Temple']
  },
  {
    id: 17, name: 'Mysuru', division: 'Mysuru Division', headquarters: 'Mysuru',
    latitude: 12.2958, longitude: 76.6394,
    taluks: ['Mysuru', 'Heggadadevanakote (HD Kote)', 'Hunsur', 'Krishnarajanagara', 'Nanjangud', 'Periyapatna', 'Tirumakudalu Narasipura', 'Saragur', 'Saligrama'],
    categories: ['Heritage and Historical Places', 'Food and Culture', 'Wildlife'],
    topPlaces: ['Mysore Palace', 'Chamundi Hills', 'Mysuru Zoo', 'Nanjangud Srikanteshwara Temple', 'Kabini Wildlife Reserve']
  },
  {
    id: 18, name: 'Udupi', division: 'Mysuru Division', headquarters: 'Udupi',
    latitude: 13.3409, longitude: 74.7421,
    taluks: ['Udupi', 'Karkala', 'Kundapura', 'Brahmavar', 'Byndoor', 'Hebri', 'Kapu'],
    categories: ['Beaches', 'Spiritual and Religious Places', 'Food and Culture'],
    topPlaces: ['Udupi Sri Krishna Matha', 'Malpe Beach & St. Mary’s Island', 'Kapu Beach & Lighthouse', 'Kollur Mookambika Temple', 'Gommateshwara Statue Karkala']
  },

  // ================= BELAGAVI DIVISION (7 Districts) =================
  {
    id: 19, name: 'Bagalkot', division: 'Belagavi Division', headquarters: 'Bagalkot',
    latitude: 16.1691, longitude: 75.6615,
    taluks: ['Bagalkot', 'Badami', 'Bilagi', 'Hungund', 'Jamkhandi', 'Mudhol', 'Ilkal', 'Rabkavi Banhatti', 'Guledgudda'],
    categories: ['Heritage and Historical Places', 'Spiritual and Religious Places'],
    topPlaces: ['Badami Cave Temples', 'Pattadakal UNESCO Monuments', 'Aihole Temple Complex', 'Banashankari Temple', 'Kudalasangama']
  },
  {
    id: 20, name: 'Belagavi', division: 'Belagavi Division', headquarters: 'Belagavi',
    latitude: 15.8497, longitude: 74.4977,
    taluks: ['Belagavi', 'Athani', 'Bailhongal', 'Chikkodi', 'Gokak', 'Hukkeri', 'Khanapur', 'Ramdurg', 'Raybag', 'Saundatti', 'Kittur', 'Nippani', 'Kagwad', 'Mudalagi'],
    categories: ['Waterfalls', 'Heritage and Historical Places', 'Nature'],
    topPlaces: ['Gokak Falls', 'Belagavi Fort', 'Kittur Rani Channamma Fort', 'Jamboti Hills & Vajrapoha Falls', 'Saundatti Yellamma Temple']
  },
  {
    id: 21, name: 'Dharwad', division: 'Belagavi Division', headquarters: 'Dharwad',
    latitude: 15.4589, longitude: 75.0078,
    taluks: ['Dharwad', 'Hubballi', 'Hubballi Urban', 'Kalghatgi', 'Kundgol', 'Navalgund', 'Alnavar', 'Annigeri'],
    categories: ['Food and Culture', 'Nature', 'Heritage and Historical Places'],
    topPlaces: ['Unkal Lake Hubballi', 'Nrupatunga Betta', 'Chandramouleshwara Temple', 'Sadankeri Park', 'Amruteshwara Temple Annigeri']
  },
  {
    id: 22, name: 'Gadag', division: 'Belagavi Division', headquarters: 'Gadag',
    latitude: 15.4315, longitude: 75.6355,
    taluks: ['Gadag', 'Mundargi', 'Nargund', 'Ron', 'Shirahatti', 'Gajendragad', 'Lakshmeshwar'],
    categories: ['Heritage and Historical Places', 'Wildlife'],
    topPlaces: ['Lakkundi Stepwells & Temples', 'Trikuteshwara Temple', 'Magadi Bird Sanctuary', 'Gajendragad Fort', 'Someshwara Temple Lakshmeshwar']
  },
  {
    id: 23, name: 'Haveri', division: 'Belagavi Division', headquarters: 'Haveri',
    latitude: 14.7951, longitude: 75.3991,
    taluks: ['Haveri', 'Byadagi', 'Hangal', 'Hirekerur', 'Ranebennur', 'Savanur', 'Shiggaon', 'Rattihalli'],
    categories: ['Wildlife', 'Spiritual and Religious Places', 'Heritage and Historical Places'],
    topPlaces: ['Bankapura Peacock Sanctuary', 'Ranebennur Blackbuck Sanctuary', 'Galageshwara Temple', 'Utsav Rock Garden', 'Tarakeshwara Temple Hangal']
  },
  {
    id: 24, name: 'Uttara Kannada', division: 'Belagavi Division', headquarters: 'Karwar',
    latitude: 14.8136, longitude: 74.1297,
    taluks: ['Karwar', 'Ankola', 'Bhatkal', 'Haliyal', 'Honnavar', 'Joida', 'Kumta', 'Mundgod', 'Siddapur', 'Sirsi', 'Yellapur', 'Dandeli'],
    categories: ['Beaches', 'Waterfalls', 'Nature', 'Trekking'],
    topPlaces: ['Gokarna Om & Kudle Beach', 'Murudeshwar Temple & Beach', 'Dandeli River Rafting', 'Yana Caves', 'Jog-Unchalli & Sathodi Falls']
  },
  {
    id: 25, name: 'Vijayapura', division: 'Belagavi Division', headquarters: 'Vijayapura',
    latitude: 16.8302, longitude: 75.7100,
    taluks: ['Vijayapura', 'Basavana Bagewadi', 'Indi', 'Muddebihal', 'Sindagi', 'Babaleshwar', 'Chadchan', 'Devara Hipparagi', 'Kolhar', 'Nidagundi', 'Talikoti', 'Tikota'],
    categories: ['Heritage and Historical Places', 'Food and Culture'],
    topPlaces: ['Gol Gumbaz', 'Ibrahim Rauza', 'Bara Kaman', 'Jamia Masjid Vijayapura', 'Almatti Dam Gardens']
  },

  // ================= KALABURAGI DIVISION (6 Districts) =================
  {
    id: 26, name: 'Ballari', division: 'Kalaburagi Division', headquarters: 'Ballari',
    latitude: 15.1394, longitude: 76.9214,
    taluks: ['Ballari', 'Kampli', 'Kurugodu', 'Sandur', 'Siruguppa'],
    categories: ['Heritage and Historical Places', 'Wildlife', 'Nature'],
    topPlaces: ['Ballari Fort', 'Daroji Sloth Bear Sanctuary', 'Sandur Hills & Kumaraswamy Temple']
  },
  {
    id: 27, name: 'Bidar', division: 'Kalaburagi Division', headquarters: 'Bidar',
    latitude: 17.9104, longitude: 77.5199,
    taluks: ['Bidar', 'Aurad', 'Basavakalyan', 'Bhalki', 'Humnabad', 'Chitguppa', 'Hulsoor', 'Kamalnagar'],
    categories: ['Heritage and Historical Places', 'Spiritual and Religious Places'],
    topPlaces: ['Bidar Fort', 'Bahmani Tombs', 'Guru Nanak Jhira Sahib', 'Mahmud Gawan Madrasa', 'Basavakalyan Fort']
  },
  {
    id: 28, name: 'Kalaburagi', division: 'Kalaburagi Division', headquarters: 'Kalaburagi',
    latitude: 17.3297, longitude: 76.8343,
    taluks: ['Kalaburagi', 'Afzalpur', 'Aland', 'Chincholi', 'Chittapur', 'Jevargi', 'Sedam', 'Kamalapura', 'Kalagi', 'Shahabad', 'Yedrami'],
    categories: ['Heritage and Historical Places', 'Spiritual and Religious Places'],
    topPlaces: ['Kalaburagi Fort & Jama Masjid', 'Sharana Basaveshwara Temple', 'Khwaja Banda Nawaz Dargah', 'Sannati Buddhist Stupa', 'Chincholi Wildlife Sanctuary']
  },
  {
    id: 29, name: 'Koppal', division: 'Kalaburagi Division', headquarters: 'Koppal',
    latitude: 15.3547, longitude: 76.1548,
    taluks: ['Koppal', 'Gangavathi', 'Kushtagi', 'Yelburga', 'Kanakagiri', 'Karatagi', 'Kukanoor'],
    categories: ['Heritage and Historical Places', 'Trekking', 'Spiritual and Religious Places'],
    topPlaces: ['Anegundi Heritage Village', 'Anjanadri Hill (Hanuman Birthplace)', 'Mahadeva Temple Itagi', 'Kanakagiri Temple']
  },
  {
    id: 30, name: 'Raichur', division: 'Kalaburagi Division', headquarters: 'Raichur',
    latitude: 16.2120, longitude: 77.3439,
    taluks: ['Raichur', 'Devadurga', 'Lingsugur', 'Manvi', 'Sindhanur', 'Maski', 'Sirwar'],
    categories: ['Heritage and Historical Places', 'Spiritual and Religious Places'],
    topPlaces: ['Raichur Fort', 'Mudgal Fort', 'Maski Ashokan Rock Edict', 'Hatti & Tungabhadra Riverfront']
  },
  {
    id: 31, name: 'Yadgir', division: 'Kalaburagi Division', headquarters: 'Yadgir',
    latitude: 16.7702, longitude: 77.1376,
    taluks: ['Yadgir', 'Shahapur', 'Shorapur (Surpur)', 'Gurmitkal', 'Hunsagi', 'Vadagera'],
    categories: ['Heritage and Historical Places', 'Nature'],
    topPlaces: ['Yadgir Fort', 'Sleeping Buddha Hill (Shahapur)', 'Surpur Fort', 'Basavasagar Dam (Narayanpur)']
  }
];

module.exports = KARNATAKA_31_DISTRICTS;
