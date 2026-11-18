CREATE DATABASE IF NOT EXISTS smarttrails_karnataka;
USE smarttrails_karnataka;

CREATE TABLE IF NOT EXISTS destinations (
  destination_id INT AUTO_INCREMENT PRIMARY KEY,
  destination_name VARCHAR(150) NOT NULL UNIQUE,
  district VARCHAR(100) NOT NULL,
  description TEXT,
  destination_categories JSON,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  image_url TEXT,
  approximate_visit_duration VARCHAR(50) DEFAULT '2-3 Days',
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attractions (
  attraction_id INT AUTO_INCREMENT PRIMARY KEY,
  destination_id INT NOT NULL,
  attraction_name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  estimated_visit_duration DECIMAL(4, 1) DEFAULT 1.5,
  approximate_entry_fee INT DEFAULT 0,
  estimated_activity_cost INT DEFAULT 0,
  best_time_to_visit VARCHAR(100) DEFAULT 'Morning (08:00 AM - 11:00 AM)',
  image_url TEXT,
  place_reference_id VARCHAR(255) DEFAULT NULL,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_dest_attr (destination_id, attraction_name),
  FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_itineraries (
  itinerary_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200),
  starting_location VARCHAR(100),
  destination_id INT,
  destination_name VARCHAR(150),
  days INT,
  travellers INT,
  travel_type VARCHAR(50),
  total_budget_inr INT,
  estimated_cost_inr INT,
  itinerary_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE SET NULL
);
