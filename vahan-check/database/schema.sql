-- =============================================================
-- Vahan-Check: Fleet Compliance Portal - MySQL Database Schema
-- =============================================================

CREATE DATABASE IF NOT EXISTS vahan_check CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vahan_check;

-- -------------------------------------------------------
-- USERS TABLE (RBAC: admin, fleet_manager, operations)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  role         ENUM('admin','fleet_manager','operations') NOT NULL DEFAULT 'operations',
  phone        VARCHAR(15),
  is_active    TINYINT(1) DEFAULT 1,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- -------------------------------------------------------
-- VEHICLES TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  reg_number      VARCHAR(15) NOT NULL UNIQUE,
  make            VARCHAR(50),
  model           VARCHAR(50),
  fuel_type       ENUM('Petrol','Diesel','CNG','Electric','Hybrid') DEFAULT 'Diesel',
  vehicle_type    ENUM('HCV','LCV','Trailer','Bus','Other') DEFAULT 'HCV',
  chassis_number  VARCHAR(50),
  engine_number   VARCHAR(50),
  owner_name      VARCHAR(100),
  owner_contact   VARCHAR(15),
  ins_expiry      DATE,
  puc_expiry      DATE,
  fit_expiry      DATE,
  rc_expiry       DATE,
  permit_expiry   DATE,
  tax_expiry      DATE,
  last_sync       DATETIME,
  is_blacklisted  TINYINT(1) DEFAULT 0,
  assigned_driver INT,
  assigned_manager INT,
  created_by      INT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reg_number (reg_number),
  INDEX idx_ins_expiry (ins_expiry),
  INDEX idx_puc_expiry (puc_expiry),
  INDEX idx_fit_expiry (fit_expiry),
  FOREIGN KEY (assigned_driver)  REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_manager) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)       REFERENCES users(id) ON DELETE SET NULL
);

-- -------------------------------------------------------
-- COMPLIANCE DOCUMENTS (Document Vault)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_documents (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id   INT NOT NULL,
  doc_type     ENUM('RC','Insurance','PUC','Fitness','Permit','Tax','Other') NOT NULL,
  file_name    VARCHAR(255) NOT NULL,
  file_path    VARCHAR(500) NOT NULL,
  file_size    INT,
  mime_type    VARCHAR(50),
  is_active    TINYINT(1) DEFAULT 1,
  uploaded_by  INT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vehicle_doc (vehicle_id, doc_type),
  FOREIGN KEY (vehicle_id)   REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by)  REFERENCES users(id) ON DELETE SET NULL
);

-- -------------------------------------------------------
-- MAINTENANCE LOGS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id       INT NOT NULL,
  odometer_reading INT NOT NULL,
  service_type     VARCHAR(100),
  parts_replaced   TEXT,
  total_cost       DECIMAL(10,2) DEFAULT 0.00,
  notes            TEXT,
  service_date     DATE NOT NULL,
  next_service_km  INT,
  next_service_date DATE,
  logged_by        INT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vehicle_maint (vehicle_id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (logged_by)  REFERENCES users(id) ON DELETE SET NULL
);

-- -------------------------------------------------------
-- NOTIFICATION LOGS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_logs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id   INT NOT NULL,
  doc_type     VARCHAR(20),
  channel      ENUM('email','whatsapp','sms','push') NOT NULL,
  recipient    VARCHAR(150),
  message      TEXT,
  status       ENUM('sent','failed','pending','retrying') DEFAULT 'pending',
  days_before  INT,
  retry_count  INT DEFAULT 0,
  sent_at      DATETIME,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vehicle_notif (vehicle_id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- -------------------------------------------------------
-- AUDIT LOGS (Manual override tracking - BR-3)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id   INT,
  user_id      INT,
  action       VARCHAR(50),
  field_name   VARCHAR(50),
  old_value    TEXT,
  new_value    TEXT,
  ip_address   VARCHAR(45),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vehicle_audit (vehicle_id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE SET NULL
);

-- -------------------------------------------------------
-- SYSTEM LOGS (API errors, failures)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_logs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  log_type     ENUM('error','warning','info') DEFAULT 'info',
  source       VARCHAR(100),
  message      TEXT,
  stack_trace  TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_log_type (log_type)
);

-- -------------------------------------------------------
-- SEED: Default admin user (password: Admin@123)
-- -------------------------------------------------------
INSERT INTO users (name, email, password, role, phone) VALUES
  ('System Admin',    'admin@vahancheck.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',         '+919876500001'),
  ('Rajesh Kumar',    'manager@vahancheck.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'fleet_manager', '+919876500002'),
  ('Priya Ops',       'ops@vahancheck.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operations',    '+919876500003');

-- -------------------------------------------------------
-- SEED: Sample vehicles
-- -------------------------------------------------------
INSERT INTO vehicles (reg_number, make, model, fuel_type, vehicle_type, chassis_number, engine_number, owner_name, owner_contact, ins_expiry, puc_expiry, fit_expiry, rc_expiry, permit_expiry, tax_expiry, assigned_manager, created_by) VALUES
  ('MH01AB1234', 'Tata Motors', 'Prima 4028.S', 'Diesel', 'HCV',     'MAT447121N2A00001', 'GNX50001',  'LogiCorp India',    '+919001112221', DATE_ADD(CURDATE(), INTERVAL 45 DAY),  DATE_ADD(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 200 DAY), DATE_ADD(CURDATE(), INTERVAL 3 YEAR), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 2, 2),
  ('DL01GB5678', 'Ashok Leyland','Dost Strong', 'Diesel', 'LCV',     'MAT452600N1B00002', 'H6CR50002', 'FastMove Logistics', '+919001112222', DATE_ADD(CURDATE(), INTERVAL 5 DAY),   DATE_ADD(CURDATE(), INTERVAL 60 DAY), DATE_ADD(CURDATE(), INTERVAL -10 DAY), DATE_ADD(CURDATE(), INTERVAL 3 YEAR), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 2, 2),
  ('KA01MJ1234', 'Tata Motors', 'Prima 4028.S', 'Diesel', 'HCV',     'MAT447121N3C00003', 'GNX50003',  'KarnatakaFleet',    '+919001112223', DATE_ADD(CURDATE(), INTERVAL 90 DAY),  DATE_ADD(CURDATE(), INTERVAL 80 DAY), DATE_ADD(CURDATE(), INTERVAL 300 DAY), DATE_ADD(CURDATE(), INTERVAL 3 YEAR), DATE_ADD(CURDATE(), INTERVAL 2 YEAR), DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 2, 2),
  ('TN22CD9012', 'Mahindra',    'Blazo X 35',  'Diesel', 'Trailer',  'MAT455300N2D00004', 'M2D150004', 'SunTransport',      '+919001112224', DATE_ADD(CURDATE(), INTERVAL -5 DAY),  DATE_ADD(CURDATE(), INTERVAL -2 DAY), DATE_ADD(CURDATE(), INTERVAL 100 DAY), DATE_ADD(CURDATE(), INTERVAL 2 YEAR), DATE_ADD(CURDATE(), INTERVAL 3 MONTH), DATE_ADD(CURDATE(), INTERVAL 3 MONTH), 2, 2),
  ('GJ05EF3456', 'Volvo',       'FH16 750',    'Diesel', 'HCV',      'YV2RT58B5HA001005', 'D16G0005',  'GujaratCargo',      '+919001112225', DATE_ADD(CURDATE(), INTERVAL 120 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), DATE_ADD(CURDATE(), INTERVAL 400 DAY), DATE_ADD(CURDATE(), INTERVAL 3 YEAR), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 2, 2);