require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./init');

function seedIfEmpty(table, rows, insertFn) {
  const count = db.prepare(`SELECT COUNT(*) c FROM ${table}`).get().c;
  if (count === 0) rows.forEach((row, i) => insertFn(row, i));
}

// --- Admin password ---
const adminExists = db.prepare('SELECT 1 FROM admin WHERE id = 1').get();
if (!adminExists) {
  const plain = process.env.ADMIN_INITIAL_PASSWORD || 'codenavs2026';
  const hash = bcrypt.hashSync(plain, 12);
  db.prepare('INSERT INTO admin (id, password_hash) VALUES (1, ?)').run(hash);
  console.log('Seeded admin password from ADMIN_INITIAL_PASSWORD. Change it from the admin panel.');
}

// --- Settings ---
if (!db.prepare('SELECT 1 FROM settings WHERE id = 1').get()) {
  const settings = {
    companyName: 'Codenavs Digital Limited',
    shortName: 'Codenavs',
    tagline: 'Driven by Code. Powered by Creativity',
    email: 'info@codenavs.com',
    phone: '+234 800 123 4567',
    address: 'Lagos, Nigeria',
    logo: '',
    favicon: '',
    facebook: 'https://facebook.com',
    twitter: 'https://x.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    whatsapp: '2348001234567',
    telegram: 'codenavs'
  };
  db.prepare('INSERT INTO settings (id, data) VALUES (1, ?)').run(JSON.stringify(settings));
}

// --- Sections (toggles + copy) ---
if (!db.prepare('SELECT 1 FROM sections WHERE id = 1').get()) {
  const sections = {
    hero: { enabled: true, headline: 'Driven by Code.', headline2: 'Powered by Creativity.',
      subheadline: "Codenavs Digital Limited builds the software, apps, brands and campaigns that help ambitious businesses and artists grow — under one roof.",
      ctaText: 'Start a project', ctaLink: 'contact', ctaText2: 'View our work', ctaLink2: 'portfolio' },
    stats: { enabled: true, items: [
      { value: '50+', label: 'Projects delivered' },
      { value: '30+', label: 'Clients served' },
      { value: '15+', label: 'Artists managed' },
      { value: '5+', label: 'Years of experience' }
    ]},
    allServicesOverview: { enabled: true,
      heading: 'Everything your brand needs, in one place',
      description: 'Codenavs brings together software engineering, mobile development, paid advertising, social media growth, artist management, digital marketing, video production and brand design into a single team.'
    },
    industries: { enabled: true },
    servicesHome: { enabled: true },
    clientsMarquee: { enabled: true },
    why: { enabled: true, items: [
      { title: 'One partner, every discipline', text: 'From code to campaigns, you deal with a single accountable team instead of five agencies.' },
      { title: 'Built for measurable growth', text: 'Every app, ad and design decision is tied back to a business or career outcome.' },
      { title: 'Local context, global standard', text: 'We understand the Nigerian market and build to international quality benchmarks.' }
    ]},
    ctaBanner: { enabled: true, heading: 'Ready to build something that works?', text: "Tell us about your project and we'll get back to you within 24 hours.", buttonText: 'Book a free consultation' },
    contactForm: { enabled: true }
  };
  db.prepare('INSERT INTO sections (id, data) VALUES (1, ?)').run(JSON.stringify(sections));
}

// --- About ---
if (!db.prepare('SELECT 1 FROM about WHERE id = 1').get()) {
  db.prepare('INSERT INTO about (id, story, mission, vision) VALUES (1, ?, ?, ?)').run(
    "Codenavs Digital Limited started with a simple observation: growing businesses and creatives were juggling too many disconnected vendors. We built Codenavs to be the single, dependable partner that handles it all.",
    'To power the growth of businesses and creatives across every digital touchpoint.',
    "To be Africa's most trusted end-to-end digital partner."
  );
}
seedIfEmpty('about_values', [
  ['Craft', 'We sweat the details, from clean code to pixel-perfect design.'],
  ['Accountability', 'We tie our work to outcomes our clients can measure.'],
  ['Partnership', 'We operate as an extension of your team, not an outside vendor.'],
  ['Momentum', 'We move fast without compromising quality.']
], (row, i) => db.prepare('INSERT INTO about_values (title, text, sort_order) VALUES (?, ?, ?)').run(row[0], row[1], i));

// --- Industries ---
seedIfEmpty('industries', [
  ['Real Estate', 'realestate'], ['Healthcare', 'health'], ['Education', 'edu'],
  ['Construction', 'construction'], ['Hospitality', 'hospitality'], ['Agriculture', 'agri'],
  ['Oil & Gas', 'oil'], ['E-commerce', 'ecom']
], (row, i) => db.prepare('INSERT INTO industries (name, icon, sort_order) VALUES (?, ?, ?)').run(row[0], row[1], i));

// --- Services ---
seedIfEmpty('services', [
  ['Build', 'code', 'Website & Software Development', 'Custom websites, web apps and business software engineered to be fast, secure and scalable.'],
  ['Build', 'mobile', 'Android & iOS App Development', 'Native and cross-platform mobile apps designed around real user journeys.'],
  ['Grow', 'ads', 'Social Media Ads Setup', 'Campaign structuring, pixel setup, targeting and creative testing.'],
  ['Grow', 'manage', 'Social Media Management & Monetization', 'Content calendars, community management and monetization strategy.'],
  ['Create', 'artist', 'Artist Management', 'Brand direction, booking support, release strategy and career guidance.'],
  ['Grow', 'marketing', 'Digital Marketing', 'SEO, funnels, email and performance marketing built around trackable goals.'],
  ['Create', 'design', 'Logo & Flyer Design', 'Distinctive logos, brand identity and event flyers.'],
  ['Create', 'video', 'Video Production', 'Promo videos, event coverage, music visuals and short-form content.']
], (row, i) => db.prepare('INSERT INTO services (category, icon, title, description, sort_order) VALUES (?, ?, ?, ?, ?)').run(row[0], row[1], row[2], row[3], i));

// --- Partners (for the all-services overview section) ---
seedIfEmpty('partners', [
  ['Meta Business Partner', 'Certified for ads across Facebook & Instagram.', 'ads'],
  ['Google Partner', 'Search, display and YouTube campaign specialists.', 'marketing'],
  ['Paystack / Flutterwave', 'Integrated payments for every build we ship.', 'handshake'],
  ['AWS / Cloud Partner', 'Reliable, scalable hosting for every product.', 'layers']
], (row, i) => db.prepare('INSERT INTO partners (name, description, icon, sort_order) VALUES (?, ?, ?, ?)').run(row[0], row[1], row[2], i));

// --- Team ---
if (!db.prepare('SELECT 1 FROM team_md WHERE id = 1').get()) {
  db.prepare('INSERT INTO team_md (id, name, role, photo, bio) VALUES (1, ?, ?, ?, ?)').run(
    'Managing Director', 'Managing Director & Founder', '',
    "Leads Codenavs' vision — bridging engineering discipline with creative strategy to deliver results across technology, marketing and the arts."
  );
}
seedIfEmpty('team_members', [
  ['Lead, Software Development', 'Head of Engineering', 'Oversees delivery of every web, app and software project end to end.'],
  ['Lead, Marketing & Ads', 'Head of Growth', 'Runs paid media, SEO and social strategy across all client accounts.'],
  ['Lead, Design & Brand', 'Head of Creative', 'Directs logo, flyer and brand identity work for clients and artists.']
], (row, i) => db.prepare('INSERT INTO team_members (name, role, bio, sort_order) VALUES (?, ?, ?, ?)').run(row[0], row[1], row[2], i));

// --- Portfolio ---
seedIfEmpty('portfolio_items', [
  ['RealEstate Connect App', 'App Development', 'A property listing and management app built for a growing real estate agency.'],
  ['Harvest Foods E-commerce', 'Web Development', 'A full online store with inventory, delivery tracking and payments.'],
  ['Rhythm & Rise Artist Brand', 'Artist Management', 'Complete brand identity and release campaign for an emerging recording artist.']
], (row, i) => db.prepare('INSERT INTO portfolio_items (title, category, description, sort_order) VALUES (?, ?, ?, ?)').run(row[0], row[1], row[2], i));

// --- Clients ---
seedIfEmpty('clients', [
  ['Harvest Foods', 'E-commerce & Food Distribution', 'Partnered with Codenavs for their online store build and ongoing digital marketing.'],
  ['BuildRight Construction', 'Construction & Facilities', 'Brand identity, logo and print flyer suite designed for site and office use.'],
  ['MedCare Clinic', 'Healthcare Provider', 'Lead-generation ad campaigns that grew patient bookings across three locations.']
], (row, i) => db.prepare('INSERT INTO clients (name, role, description, sort_order) VALUES (?, ?, ?, ?)').run(row[0], row[1], row[2], i));

console.log('Database seeded successfully.');
