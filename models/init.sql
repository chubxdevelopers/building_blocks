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
  capability_id VARCHAR(100) PRIMARY KEY,
  features_json JSON
);

CREATE TABLE role_capability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(50),
  team VARCHAR(50),
  company VARCHAR(100),
  capability_id VARCHAR(100)
);
