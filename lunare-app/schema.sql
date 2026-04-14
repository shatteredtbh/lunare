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

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  customer_email TEXT,
  customer_name TEXT,
  items JSONB,
  total NUMERIC(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO products (tag, name, description, price, swatch, soap, sort_order) VALUES
  ('New moon',   'Midnight clay',      'Activated charcoal, raw honey, and vetiver. Deep-cleansing. Grounding.',              12.00, 'swatch-a', 'soap-a', 1),
  ('Full moon',  'River sage',         'White sage, oat milk, and peppermint leaf. Refreshing. Clarifying. Alive.',           14.00, 'swatch-b', 'soap-b', 2),
  ('Crescent',   'Lavender dusk',      'Real lavender buds, shea butter, sweet almond oil. Soft. Calming. Tender.',           13.00, 'swatch-c', 'soap-c', 3),
  ('Waning',     'Honey oat',          'Raw local honey, colloidal oatmeal, and vanilla. Gentle enough for sensitive skin.',  15.00, 'swatch-a', 'soap-a', 4),
  ('New moon',   'Charcoal mint',      'Activated charcoal and peppermint oil. Purifying, cooling, and deeply clean.',        16.00, 'swatch-b', 'soap-b', 5),
  ('Full moon',  'Rose clay',          'French rose clay, rosehip oil, and geranium. Brightening and nourishing.',            18.00, 'swatch-c', 'soap-c', 6),
  ('Waxing',     'Cedar & pine',       'Wild cedarwood, pine needle, and eucalyptus. Fresh like a forest morning.',           14.00, 'swatch-a', 'soap-a', 7),
  ('Crescent',   'Turmeric glow',      'Turmeric, vitamin E, and sweet orange peel. Radiance-boosting. Warm. Bright.',        17.00, 'swatch-b', 'soap-b', 8),
  ('Full moon',  'Dead sea salt',      'Dead sea salt, argan oil, and bergamot. Exfoliating and deeply moisturising.',        20.00, 'swatch-c', 'soap-c', 9),
  ('Waning',     'Coconut lime',       'Coconut milk, lime zest, and lemongrass. Tropical, fresh, and energising.',           13.00, 'swatch-a', 'soap-a', 10),
  ('New moon',   'Black rose',         'Black seed oil, rose absolute, and oud. Luxurious. Mysterious. Unforgettable.',       24.00, 'swatch-b', 'soap-b', 11),
  ('Waxing',     'Calendula & oat',    'Calendula petals, oat milk, and chamomile. Ultra-soothing for dry or eczema skin.',   16.00, 'swatch-c', 'soap-c', 12)
ON CONFLICT DO NOTHING;

INSERT INTO site_settings (key, value) VALUES
  ('eyebrow',     'Handmade · Small batch · Moon-inspired'),
  ('tagline',     'Every Lunare bar is shaped by hand, cured under moonlight lore, and made with ingredients that are honest about where they came from.'),
  ('orders',      'true'),
  ('newsletter',  'true'),
  ('maintenance', 'false')
ON CONFLICT DO NOTHING;
