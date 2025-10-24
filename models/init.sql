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
CREATE TABLE apps (
  id INT AUTO_INCREMENT PRIMARY KEY,                 -- unique app ID (auto-generated)
  name VARCHAR(200) NOT NULL,                        -- name of the app (e.g. "Analytics Dashboard")
  slug VARCHAR(100) NOT NULL UNIQUE,                 -- unique slug used in URLs (e.g. "analytics")
  settings JSON,                                     -- custom configuration or metadata for this app
  company_id INT,                                    -- foreign key referencing the owning company
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- auto timestamp of creation
  FOREIGN KEY (company_id) REFERENCES companies(id)  -- ensures app belongs to an existing company
);


CREATE TABLE teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  company_id INT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  team_id INT NOT NULL,
  company_id INT NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INT,
  team_id INT,
  company_id INT,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
