CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(50),
  team VARCHAR(50),
  company VARCHAR(100)
);

CREATE TABLE features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feature_name VARCHAR(100),
  feature_tag VARCHAR(100),
  type ENUM('frontend', 'backend')
);

CREATE TABLE features_capability (
  capability_id INT AUTO_INCREMENT PRIMARY KEY,
  features_json JSON,
  CONSTRAINT chk_valid_json CHECK (JSON_VALID(features_json))
);


CREATE TABLE role_capability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(50),
  team VARCHAR(50),
  company VARCHAR(100),
  capability_id INT,
  FOREIGN KEY (capability_id) REFERENCES features_capability(capability_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Companies table used to store app/company specific settings and slug
CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

