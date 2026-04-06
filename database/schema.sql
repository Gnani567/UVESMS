-- ============================================================
-- UVESMS - University Visitor Entry and Security Management System
-- PostgreSQL Database Schema
-- NIT Calicut
-- ============================================================

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'security_staff');
CREATE TYPE id_proof_type AS ENUM ('Aadhar', 'PAN', 'Passport', 'Driving License', 'Voter ID');
CREATE TYPE visitor_status AS ENUM ('active', 'inactive');
CREATE TYPE entry_status AS ENUM ('inside', 'exited');

-- ============================================================
-- Table: users (base table for all system users)
-- ============================================================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    user_id     TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    email       TEXT,
    password    TEXT NOT NULL,
    role        user_role NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: admin
-- ============================================================
CREATE TABLE admin (
    id          SERIAL PRIMARY KEY,
    user_id     TEXT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    admin_id    TEXT NOT NULL UNIQUE
);

-- ============================================================
-- Table: security_staff
-- ============================================================
CREATE TABLE security_staff (
    id              SERIAL PRIMARY KEY,
    user_id         TEXT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    staff_id        TEXT NOT NULL UNIQUE,
    staff_name      TEXT NOT NULL,
    gate_assigned   TEXT,
    phone           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- Table: visitors
-- ============================================================
CREATE TABLE visitors (
    id              SERIAL PRIMARY KEY,
    visitor_name    TEXT NOT NULL,
    phone_number    TEXT NOT NULL,
    id_proof_type   id_proof_type NOT NULL,
    id_proof_number TEXT NOT NULL,
    department      TEXT,
    visitor_status  visitor_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: entry_logs
-- ============================================================
CREATE TABLE entry_logs (
    id                  SERIAL PRIMARY KEY,
    visitor_id          INTEGER NOT NULL REFERENCES visitors(id) ON DELETE RESTRICT,
    staff_id            INTEGER REFERENCES security_staff(id) ON DELETE SET NULL,
    visit_date          TEXT NOT NULL,
    entry_time          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exit_time           TIMESTAMPTZ,
    purpose_of_visit    TEXT NOT NULL,
    host_name           TEXT,
    gate_number         TEXT,
    pass_number         TEXT,
    status              entry_status NOT NULL DEFAULT 'inside'
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_entry_logs_visitor_id   ON entry_logs(visitor_id);
CREATE INDEX idx_entry_logs_visit_date   ON entry_logs(visit_date);
CREATE INDEX idx_entry_logs_status       ON entry_logs(status);
CREATE INDEX idx_visitors_status         ON visitors(visitor_status);
CREATE INDEX idx_security_staff_user_id  ON security_staff(user_id);

-- ============================================================
-- Sample seed data
-- ============================================================

-- 🔐 bcrypt hash for "password123"
-- $2b$10$KbQi6vZl8GZ3yP0vX8xZ2e6pFQ3lW4Y8YQzvVvV6Vw9Zz6yQn7K5G

-- Admin user
INSERT INTO users (user_id, name, email, password, role)
VALUES ('ADMIN001', 'ADMINISTRATOR', 'admin@nitc.ac.in',
        '$2b$10$KbQi6vZl8GZ3yP0vX8xZ2e6pFQ3lW4Y8YQzvVvV6Vw9Zz6yQn7K5G', 'admin');

INSERT INTO admin (user_id, admin_id)
VALUES ('ADMIN001', 'ADMIN001');

-- Security staff
INSERT INTO users (user_id, name, password, role)
VALUES
  ('SEC001', 'Rajesh Kumar',  '$2b$10$KbQi6vZl8GZ3yP0vX8xZ2e6pFQ3lW4Y8YQzvVvV6Vw9Zz6yQn7K5G', 'security_staff'),
  ('SEC002', 'Priya Menon',   '$2b$10$KbQi6vZl8GZ3yP0vX8xZ2e6pFQ3lW4Y8YQzvVvV6Vw9Zz6yQn7K5G', 'security_staff'),
  ('SEC003', 'Arun Nair',     '$2b$10$KbQi6vZl8GZ3yP0vX8xZ2e6pFQ3lW4Y8YQzvVvV6Vw9Zz6yQn7K5G', 'security_staff');

INSERT INTO security_staff (user_id, staff_id, staff_name, gate_assigned, phone)
VALUES
  ('SEC001', 'SEC001', 'Rajesh Kumar', 'Gate 1 - Main Entrance', '9876543210'),
  ('SEC002', 'SEC002', 'Priya Menon',  'Gate 2 - East Wing',     '9876543211'),
  ('SEC003', 'SEC003', 'Arun Nair',    'Gate 3 - West Wing',     '9876543212');