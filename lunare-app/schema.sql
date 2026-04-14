-- Run this once to set up your database
-- Railway: open your Postgres service → Query tab → paste and run

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  tag TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  swatch TEXT NOT NULL DEFAULT 'swatch-a',
  soap TEXT NOT NULL DEFAULT 'soap-a',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_subs (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default products
INSERT INTO products (tag, name, description, price, swatch, soap, sort_order)
VALUES
  ('New moon',  'Midnight clay',  'Activated charcoal, raw honey, and a whisper of vetiver. Deep-cleansing. Grounding.', 12.00, 'swatch-a', 'soap-a', 1),
  ('Full moon',  'River sage',     'White sage, oat milk, and peppermint leaf. Refreshing. Clarifying. Alive.',            14.00, 'swatch-b', 'soap-b', 2),
  ('Crescent',   'Lavender dusk',  'Real lavender buds, shea butter, and sweet almond oil. Soft. Calming. Tender.',       13.00, 'swatch-c', 'soap-c', 3)
ON CONFLICT DO NOTHING;

-- Seed default site settings
INSERT INTO site_settings (key, value) VALUES
  ('eyebrow',     'Handmade · Small batch · Moon-inspired'),
  ('tagline',     'Every Lunare bar is shaped by hand, cured under moonlight lore, and made with ingredients that are honest about where they came from.'),
  ('orders',      'true'),
  ('newsletter',  'true'),
  ('maintenance', 'false')
ON CONFLICT DO NOTHING;
