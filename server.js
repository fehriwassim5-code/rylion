const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const buildPredictor = require('./services/property-price-predictor');

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFromFile(path.join(__dirname, '.env'));

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PROPERTY_FILE = path.join(ROOT_DIR, 'data', 'properties.json');
const CONTACT_FILE = path.join(ROOT_DIR, 'data', 'contact-requests.json');
const SITE_SETTINGS_FILE = path.join(ROOT_DIR, 'data', 'site-settings.json');

const PAGE_SIZE = 12;
const TOTAL_PAGES = 5;
const TOTAL_PROPERTIES = 50;
const DEFAULT_HERO_IMAGE = '/assets/img/kelibia/kelibia-real-cover.jpg';
const DEFAULT_HOME_SETTINGS = {
  heroImage: DEFAULT_HERO_IMAGE,
  heroEyebrow: 'Kelibia, Tunisie',
  heroTitle: 'Trouvez votre bien a Kelibia',
  heroSubtitle: "Residences et villas pensees pour le confort, l'emplacement et la valeur.",
  heroMicrocopy: ['Front de mer', 'Centre-ville', 'Quartiers calmes'],
  heroCtaLabel: 'Explorer les biens',
  heroCtaHref: '/properties?page=1',
  sceneCaptionTitle: 'Rylion\nImmobilière',
  sceneCaptionSubtitle: 'Art de vivre cotier',
  sceneImageSmallA: '/assets/img/real-estate/property-exterior-2.webp',
  sceneImageSmallB: '/assets/img/real-estate/property-interior-8.webp'
};

const images = {
  hero: DEFAULT_HERO_IMAGE,
  exteriors: [
    '/assets/img/real-estate/showcase-3.webp',
    '/assets/img/real-estate/property-exterior-1.webp',
    '/assets/img/real-estate/property-exterior-2.webp',
    '/assets/img/real-estate/property-exterior-3.webp',
    '/assets/img/real-estate/property-exterior-4.webp',
    '/assets/img/real-estate/property-exterior-5.webp',
    '/assets/img/real-estate/property-exterior-7.webp',
    '/assets/img/real-estate/property-exterior-8.webp',
    '/assets/img/real-estate/property-exterior-9.webp'
  ],
  interiors: [
    '/assets/img/real-estate/property-interior-1.webp',
    '/assets/img/real-estate/property-interior-2.webp',
    '/assets/img/real-estate/property-interior-4.webp',
    '/assets/img/real-estate/property-interior-5.webp',
    '/assets/img/real-estate/property-interior-6.webp',
    '/assets/img/real-estate/property-interior-7.webp',
    '/assets/img/real-estate/property-interior-8.webp',
    '/assets/img/real-estate/property-interior-9.webp'
  ]
};

const zoneProfiles = {
  Beachfront: {
    label: 'Kelibia, Front de mer',
    shortLabel: 'Kelibia, Front de mer',
    zoneLabel: 'Front de mer',
    neighborhoods: ['Mansoura', 'La Corniche', 'Cote du Fort', 'Baie Azur'],
    residenceBase: 165000,
    villaBase: 715000
  },
  'City Center': {
    label: 'Kelibia, Centre-ville',
    shortLabel: 'Kelibia, Centre-ville',
    zoneLabel: 'Centre-ville',
    neighborhoods: ['Centre Ville', 'Avenue du Port', 'Place MosaIque', 'Lisiere de la Medina'],
    residenceBase: 145000,
    villaBase: 535000
  },
  'Quiet Areas': {
    label: 'Kelibia, Quartiers calmes',
    shortLabel: 'Kelibia, Quartiers calmes',
    zoneLabel: 'Quartiers calmes',
    neighborhoods: ['Sidi Mansour', 'Quartier Jardin', 'Hauteurs des Oliviers', 'Vue Nefza'],
    residenceBase: 130000,
    villaBase: 365000
  }
};

const residenceNames = [
  'Residence Azur Doree',
  'Residence Selene',
  'Residence Marina Blanche',
  'Residence Cap Marine',
  'Residence Clair Horizon',
  'Residence Sable Fin',
  'Residence Ocean Verre',
  'Residence Belvedere Bleu',
  'Residence Medina Light',
  'Residence Cour Jardin',
  'Residence Place Royale',
  'Residence Palm Archive',
  'Residence Atelier du Port',
  'Residence Dune Calme',
  'Residence Jardin Secret',
  'Residence Ambre Coast',
  'Residence Bay Signature',
  'Residence White Terrace',
  'Residence Carthage Line',
  'Residence Sea Mosaic',
  'Residence Coast Atelier',
  'Residence Lumiere du Cap',
  'Residence Harbor Silk',
  'Residence Quiet Pearl',
  'Residence Nacre Garden',
  'Residence Azure Court'
];

const villaNames = [
  'Villa Mansoura Privilege',
  'Villa Coral Horizon',
  'Villa Fort Azure',
  'Villa Dune Prestige',
  'Villa White Crest',
  'Villa Ocean Frame',
  'Villa Plage Signature',
  'Villa Port Lumiere',
  'Villa Medina Edition',
  'Villa City Courtyard',
  'Villa Saphir Avenue',
  'Villa Palm Address',
  'Villa Mosaic Garden',
  'Villa Cedar Quiet',
  'Villa Olive Retreat',
  'Villa Garden Coast',
  'Villa Sunline',
  'Villa Nefza House',
  'Villa Terrace Lane',
  'Villa Quiet Harbor',
  'Villa Soft Sand',
  'Villa Horizon Patio',
  'Villa Cour Douce',
  'Villa Olive Pearl'
];

const residenceZonePlan = [
  'Beachfront', 'Beachfront', 'Beachfront', 'Beachfront', 'Beachfront', 'Beachfront', 'Beachfront', 'Beachfront',
  'City Center', 'City Center', 'City Center', 'City Center', 'City Center', 'City Center', 'City Center', 'City Center', 'City Center',
  'Quiet Areas', 'Quiet Areas', 'Quiet Areas', 'Quiet Areas', 'Quiet Areas', 'Quiet Areas', 'Quiet Areas', 'Quiet Areas', 'Quiet Areas'
];

const villaZonePlan = [
  'Beachfront', 'Beachfront', 'Beachfront', 'Beachfront', 'Beachfront', 'Beachfront', 'Beachfront', 'Beachfront',
  'City Center', 'City Center', 'City Center', 'City Center', 'City Center', 'City Center', 'City Center', 'City Center',
  'Quiet Areas', 'Quiet Areas', 'Quiet Areas', 'Quiet Areas', 'Quiet Areas', 'Quiet Areas', 'Quiet Areas', 'Quiet Areas'
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function formatCurrency(value) {
  return `${formatNumber(value)} TND`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildUnits(type, count, minSurface, maxSurface, startOffset, step, priceFormula) {
  return Array.from({ length: count }, (_, unitIndex) => {
    const spread = maxSurface - minSurface + 1;
    const rawSurface = minSurface + ((startOffset + unitIndex * step) % spread);
    const surface = clamp(rawSurface, minSurface, maxSurface);
    return {
      type,
      surface,
      price: Math.round(priceFormula(surface, unitIndex) / 100) * 100
    };
  }).sort((left, right) => left.surface - right.surface);
}

function enrichResidenceUnits(zone, index, apartmentCount) {
  const profile = zoneProfiles[zone];
  const remaining = apartmentCount - 2;
  const s1Count = clamp(3 + (index % 3), 2, remaining - 2);
  const s2Count = remaining - s1Count;

  const s1Units = buildUnits(
    'S+1',
    s1Count,
    80,
    120,
    4 + index * 3,
    7,
    (surface, unitIndex) => profile.residenceBase + (surface - 80) * 720 + unitIndex * 2600 + index * 950
  );

  const s2Units = buildUnits(
    'S+2',
    s2Count,
    120,
    149,
    3 + index * 2,
    5,
    (surface, unitIndex) => profile.residenceBase + 42000 + (surface - 120) * 980 + unitIndex * 3200 + index * 1100
  );

  const s3Units = buildUnits(
    'S+3',
    2,
    170,
    190,
    5 + index,
    9,
    (surface, unitIndex) => profile.residenceBase + 94000 + (surface - 170) * 1320 + unitIndex * 4800 + index * 1400
  );

  return {
    distribution: {
      'S+1': s1Units.length,
      'S+2': s2Units.length,
      'S+3': s3Units.length
    },
    units: {
      'S+1': s1Units,
      'S+2': s2Units,
      'S+3': s3Units
    }
  };
}

function summarizeResidenceUnits(units) {
  const all = [...units['S+1'], ...units['S+2'], ...units['S+3']];
  return {
    startingPrice: Math.min(...all.map((unit) => unit.price)),
    minSurface: Math.min(...all.map((unit) => unit.surface)),
    maxSurface: Math.max(...all.map((unit) => unit.surface))
  };
}

function pickNeighborhood(zone, index) {
  const neighborhoods = zoneProfiles[zone].neighborhoods;
  return neighborhoods[index % neighborhoods.length];
}

function buildResidence(index) {
  const zone = residenceZonePlan[index];
  const apartmentCount = 8 + (index % 5);
  const cover = images.exteriors[index % images.exteriors.length];
  const unitData = enrichResidenceUnits(zone, index, apartmentCount);
  const summary = summarizeResidenceUnits(unitData.units);

  return {
    id: `residence-${index + 1}`,
    type: 'Residence',
    title: `Residence ${index + 1}`,
    zone: 'Kelibia',
    location: 'Kelibia',
    locationShort: 'Kelibia',
    zoneLabel: 'Kelibia',
    neighborhood: 'Kelibia',
    apartmentCount,
    availableTypes: ['S+1', 'S+2', 'S+3'],
    distribution: unitData.distribution,
    units: unitData.units,
    startingPrice: summary.startingPrice,
    surfaceRange: `${summary.minSurface}-${summary.maxSurface} m2`,
    thumbnail: cover,
    images: [
      cover,
      images.interiors[index % images.interiors.length],
      images.interiors[(index + 2) % images.interiors.length],
      images.exteriors[(index + 3) % images.exteriors.length]
    ]
  };
}

function buildVilla(index) {
  const zone = villaZonePlan[index];
  const zoneMeta = zoneProfiles[zone];
  const neighborhood = pickNeighborhood(zone, index + 1);
  const cover = images.exteriors[(index + 4) % images.exteriors.length];
  const rooms = 5 + (index % 3);
  const surface = zone === 'Beachfront'
    ? 235 + index * 7
    : zone === 'City Center'
      ? 205 + (index - 8) * 6
      : 185 + (index - 16) * 5;
  const price = zoneMeta.villaBase + surface * 920 + rooms * 12000 + index * 8500;

  return {
    id: `villa-${index + 1}`,
    type: 'Villa',
    title: `Villa ${index + 1}`,
    zone,
    location: `${zoneMeta.label}, ${neighborhood}`,
    locationShort: `Kelibia, ${neighborhood}`,
    zoneLabel: zoneMeta.zoneLabel,
    neighborhood,
    price: Math.round(price / 1000) * 1000,
    surface,
    rooms,
    thumbnail: cover,
    images: [
      cover,
      images.interiors[(index + 1) % images.interiors.length],
      images.interiors[(index + 3) % images.interiors.length],
      images.exteriors[(index + 6) % images.exteriors.length]
    ]
  };
}

function buildProperties() {
  const residences = Array.from({ length: 20 }, (_, index) => buildResidence(index));
  const villas = Array.from({ length: 20 }, (_, index) => buildVilla(index));
  return [...residences, ...villas];
}

const properties = buildProperties();
const pricePredictor = buildPredictor();

function ensureContactFile() {
  fs.mkdirSync(path.dirname(CONTACT_FILE), { recursive: true });
  if (!fs.existsSync(CONTACT_FILE)) {
    fs.writeFileSync(CONTACT_FILE, '[]', 'utf8');
  }
}

function saveContactRequest(entry) {
  ensureContactFile();
  const raw = fs.readFileSync(CONTACT_FILE, 'utf8') || '[]';
  const list = JSON.parse(raw);
  list.unshift(entry);
  fs.writeFileSync(CONTACT_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function ensurePropertyFile() {
  fs.mkdirSync(path.dirname(PROPERTY_FILE), { recursive: true });
  if (!fs.existsSync(PROPERTY_FILE)) {
    fs.writeFileSync(PROPERTY_FILE, '[]', 'utf8');
  }
}

function sanitizeHeroImagePath(value) {
  const pathValue = String(value || '').trim();
  if (!pathValue) {
    return '';
  }
  if (pathValue.startsWith('/uploads/') || pathValue.startsWith('/assets/')) {
    return pathValue;
  }
  return '';
}

function sanitizeTextValue(value, fallback, maxLength = 240) {
  const text = String(value == null ? '' : value).trim();
  if (!text) {
    return fallback;
  }
  return text.slice(0, maxLength);
}

function sanitizeHrefValue(value, fallback) {
  const href = String(value || '').trim();
  if (!href) {
    return fallback;
  }
  if (href.startsWith('/') || href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  return fallback;
}

function sanitizeMicrocopy(value, fallback) {
  const rawList = Array.isArray(value)
    ? value
    : String(value || '').split(/[\n,]/);
  const cleaned = rawList
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 8);

  return cleaned.length ? cleaned : fallback;
}

function normalizeSiteSettings(rawSettings) {
  const safe = rawSettings && typeof rawSettings === 'object' && !Array.isArray(rawSettings)
    ? rawSettings
    : {};

  return {
    heroImage: sanitizeHeroImagePath(safe.heroImage) || DEFAULT_HOME_SETTINGS.heroImage,
    heroEyebrow: sanitizeTextValue(safe.heroEyebrow, DEFAULT_HOME_SETTINGS.heroEyebrow, 120),
    heroTitle: sanitizeTextValue(safe.heroTitle, DEFAULT_HOME_SETTINGS.heroTitle, 180),
    heroSubtitle: sanitizeTextValue(safe.heroSubtitle, DEFAULT_HOME_SETTINGS.heroSubtitle, 420),
    heroMicrocopy: sanitizeMicrocopy(safe.heroMicrocopy, DEFAULT_HOME_SETTINGS.heroMicrocopy),
    heroCtaLabel: sanitizeTextValue(safe.heroCtaLabel, DEFAULT_HOME_SETTINGS.heroCtaLabel, 80),
    heroCtaHref: sanitizeHrefValue(safe.heroCtaHref, DEFAULT_HOME_SETTINGS.heroCtaHref),
    sceneCaptionTitle: sanitizeTextValue(safe.sceneCaptionTitle, DEFAULT_HOME_SETTINGS.sceneCaptionTitle, 120),
    sceneCaptionSubtitle: sanitizeTextValue(safe.sceneCaptionSubtitle, DEFAULT_HOME_SETTINGS.sceneCaptionSubtitle, 120),
    sceneImageSmallA: sanitizeHeroImagePath(safe.sceneImageSmallA) || DEFAULT_HOME_SETTINGS.sceneImageSmallA,
    sceneImageSmallB: sanitizeHeroImagePath(safe.sceneImageSmallB) || DEFAULT_HOME_SETTINGS.sceneImageSmallB
  };
}

function ensureSiteSettingsFile() {
  fs.mkdirSync(path.dirname(SITE_SETTINGS_FILE), { recursive: true });
  if (!fs.existsSync(SITE_SETTINGS_FILE)) {
    fs.writeFileSync(SITE_SETTINGS_FILE, JSON.stringify(DEFAULT_HOME_SETTINGS, null, 2), 'utf8');
  }
}

function readSiteSettings() {
  ensureSiteSettingsFile();

  try {
    const raw = fs.readFileSync(SITE_SETTINGS_FILE, 'utf8') || '{}';
    const parsed = JSON.parse(raw);
    return normalizeSiteSettings(parsed);
  } catch (error) {
    return { ...DEFAULT_HOME_SETTINGS };
  }
}

function writeSiteSettings(nextSettings) {
  const merged = normalizeSiteSettings({
    ...readSiteSettings(),
    ...nextSettings
  });
  fs.writeFileSync(SITE_SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

function readPropertiesFile() {
  ensurePropertyFile();
  const raw = fs.readFileSync(PROPERTY_FILE, 'utf8') || '[]';
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writePropertiesFile(list) {
  ensurePropertyFile();
  fs.writeFileSync(PROPERTY_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function sortPublicProperties(list) {
  const typeOrder = {
    Residence: 0,
    Villa: 1
  };

  return [...list].sort((left, right) => {
    const leftRank = Object.prototype.hasOwnProperty.call(typeOrder, left.type) ? typeOrder[left.type] : 2;
    const rightRank = Object.prototype.hasOwnProperty.call(typeOrder, right.type) ? typeOrder[right.type] : 2;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftTitle = String(left.title || '');
    const rightTitle = String(right.title || '');
    return leftTitle.localeCompare(rightTitle, 'fr', { numeric: true, sensitivity: 'base' });
  });
}

function getPublicProperties() {
  const storedProperties = readPropertiesFile();
  return storedProperties.length ? sortPublicProperties(storedProperties) : sortPublicProperties(properties);
}

function hasPoolAmenity(property) {
  if (typeof property?.piscine === 'boolean') {
    return property.piscine;
  }

  return Array.isArray(property?.amenities)
    ? property.amenities.some((item) => String(item || '').toLowerCase().includes('piscine'))
    : false;
}

function isNearBeachProperty(property) {
  const explicitDistance = Number(property?.distance_plage ?? property?.distancePlage);
  if (Number.isFinite(explicitDistance) && explicitDistance > 0) {
    return explicitDistance <= 1;
  }

  const haystack = [
    property?.zone,
    property?.address,
    property?.city,
    property?.location,
    property?.locationShort
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return ['beachfront', 'plage', 'corniche', 'mer', 'mansoura'].some((token) => haystack.includes(token));
}

function normalizeInvestmentItems(list) {
  return list.flatMap((property) => {
    const rawType = String(property?.type || '').toLowerCase();

    if (rawType === 'villa') {
      return [{
        id: property.id,
        sourceId: property.id,
        title: property.title || property.headline || 'Villa',
        parentTitle: property.title || property.headline || 'Villa',
        type: 'Villa',
        categorie: null,
        chambres: Number(property.chambres ?? property.bedrooms ?? 0),
        piscine: hasPoolAmenity(property),
        prochePlage: isNearBeachProperty(property),
        prix: Number(property.prix ?? property.price ?? 0),
        address: property.address || '',
        city: property.city || '',
        zone: property.zone || '',
        thumbnail: property.thumbnail || '',
        detailHref: `/property/${property.id}`
      }];
    }

    if (property?.units && typeof property.units === 'object') {
      return Object.entries(property.units).flatMap(([categorie, units]) =>
        (Array.isArray(units) ? units : []).map((unit, index) => ({
          id: `${property.id}-${categorie}-${index}`,
          sourceId: property.id,
          title: `${property.title || 'Appartement'} ${categorie}`,
          parentTitle: property.title || 'Appartement',
          type: 'Appartement',
          categorie,
          chambres: 0,
          piscine: false,
          prochePlage: isNearBeachProperty(property),
          prix: Number(unit?.price ?? property?.price ?? 0),
          address: property.address || '',
          city: property.city || '',
          zone: property.zone || '',
          thumbnail: property.thumbnail || '',
          surface: Number(unit?.surface ?? 0),
          detailHref: `/property/${property.id}`
        }))
      );
    }

    return [{
      id: property.id,
      sourceId: property.id,
      title: property.title || property.headline || 'Appartement',
      parentTitle: property.title || property.headline || 'Appartement',
      type: 'Appartement',
      categorie: property.categorie || property.category || 'S+2',
      chambres: 0,
      piscine: false,
      prochePlage: isNearBeachProperty(property),
      prix: Number(property.prix ?? property.price ?? 0),
      address: property.address || '',
      city: property.city || '',
      zone: property.zone || '',
      thumbnail: property.thumbnail || '',
      detailHref: `/property/${property.id}`
    }];
  });
}

function enrichInvestmentItem(item) {
  if (item.type === 'Villa') {
    const priceNight = 250 + (item.chambres * 50) + (item.piscine ? 150 : 0);
    const revenuEte = priceNight * 90 * 0.75;
    const revenuAnnuel = (priceNight * 10) * 12;
    const roi = item.prix > 0 ? (revenuAnnuel / item.prix) * 100 : 0;
    const paybackYears = revenuAnnuel > 0 ? item.prix / revenuAnnuel : 0;

    return {
      ...item,
      prixNuit: priceNight,
      revenuEte,
      revenuAnnuel,
      roi,
      paybackYears,
      strategy: item.piscine ? 'Villa premium saisonniere' : 'Villa familiale rentable',
      confidence: item.prochePlage ? 'Fort potentiel locatif' : 'Potentiel stable'
    };
  }

  const baseMap = {
    'S+1': 150,
    'S+2': 200,
    'S+3': 250
  };
  const category = Object.prototype.hasOwnProperty.call(baseMap, item.categorie) ? item.categorie : 'S+2';
  const base = baseMap[category] * (item.prochePlage ? 1.25 : 1);
  const revenuEte = base * 90 * 0.6;
  const revenuAnnuel = (base * 8) * 12;
  const roi = item.prix > 0 ? (revenuAnnuel / item.prix) * 100 : 0;
  const paybackYears = revenuAnnuel > 0 ? item.prix / revenuAnnuel : 0;

  return {
    ...item,
    prixNuit: base,
    revenuEte,
    revenuAnnuel,
    roi,
    paybackYears,
    strategy: item.prochePlage ? 'Appartement bord de mer' : 'Appartement patrimonial',
    confidence: item.prochePlage ? 'Boost plage inclus' : 'Rendement classique'
  };
}

function buildInvestmentAnalysis(list) {
  const entries = normalizeInvestmentItems(list)
    .map(enrichInvestmentItem)
    .sort((left, right) => right.roi - left.roi);

  const summary = {
    count: entries.length,
    averagePrice: entries.length ? entries.reduce((sum, item) => sum + item.prix, 0) / entries.length : 0,
    averageROI: entries.length ? entries.reduce((sum, item) => sum + item.roi, 0) / entries.length : 0,
    averageSummer: entries.length ? entries.reduce((sum, item) => sum + item.revenuEte, 0) / entries.length : 0,
    bestItem: entries[0] || null
  };

  return { entries, summary };
}

function readContactRequests() {
  ensureContactFile();
  const raw = fs.readFileSync(CONTACT_FILE, 'utf8') || '[]';
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseTagList(raw) {
  return String(raw || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFormArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return String(value || '').trim() ? [String(value).trim()] : [];
}

function normalizeListingType(rawType) {
  const lower = String(rawType || '').toLowerCase();
  return lower === 'rent' ? 'rent' : 'sale';
}

function toSlug(rawValue) {
  const base = String(rawValue || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'property';
}

function detectMapCoordinates(urlValue = '') {
  const value = String(urlValue);
  const fromQuery = value.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (fromQuery) {
    return { lat: fromQuery[1], lng: fromQuery[2] };
  }

  const fromAt = value.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (fromAt) {
    return { lat: fromAt[1], lng: fromAt[2] };
  }

  return { lat: '', lng: '' };
}

const DEFAULT_RESIDENCE_PRICE_PER_M2 = 1600;

function guessResidencePricePerM2(property) {
  if (Number(property?.pricePerSquareMeter) > 0) {
    return Number(property.pricePerSquareMeter);
  }

  const sampleUnit = property?.units?.['S+1']?.[0]
    || property?.units?.['S+2']?.[0]
    || property?.units?.['S+3']?.[0];

  if (sampleUnit && Number(sampleUnit.surface) > 0 && Number(sampleUnit.price) > 0) {
    return Math.round(Number(sampleUnit.price) / Number(sampleUnit.surface));
  }

  return DEFAULT_RESIDENCE_PRICE_PER_M2;
}

function getResidenceSeed(property) {
  const idMatch = String(property?.id || '').match(/residence-(\d+)/i);
  if (idMatch) {
    return Number(idMatch[1]) - 1;
  }

  const titleMatch = String(property?.title || '').match(/(\d+)/);
  if (titleMatch) {
    return Number(titleMatch[1]) - 1;
  }

  const raw = String(property?.title || property?.id || '');
  return raw.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 20;
}

function generateResidenceInventory(apartmentCount, pricePerSquareMeter, seed = 0) {
  const safeApartmentCount = Math.max(4, Math.round(Number(apartmentCount) || 0));
  const safePricePerSquareMeter = Math.max(1, Math.round(Number(pricePerSquareMeter) || 0)) || DEFAULT_RESIDENCE_PRICE_PER_M2;
  const safeSeed = Math.max(0, Number(seed) || 0);
  const s3Count = 2;
  const remaining = Math.max(2, safeApartmentCount - s3Count);
  const s1Count = Math.max(2, Math.round(remaining * 0.55));
  const s2Count = Math.max(1, remaining - s1Count);

  const s1Units = buildUnits(
    'S+1',
    s1Count,
    80,
    120,
    4 + safeSeed * 3,
    7,
    (surface) => surface * safePricePerSquareMeter
  );

  const s2Units = buildUnits(
    'S+2',
    s2Count,
    121,
    149,
    3 + safeSeed * 2,
    5,
    (surface) => surface * safePricePerSquareMeter
  );

  const s3Units = buildUnits(
    'S+3',
    s3Count,
    170,
    190,
    5 + safeSeed,
    9,
    (surface) => surface * safePricePerSquareMeter
  );

  const units = {
    'S+1': s1Units,
    'S+2': s2Units,
    'S+3': s3Units
  };
  const summary = summarizeResidenceUnits(units);

  return {
    apartmentCount: safeApartmentCount,
    pricePerSquareMeter: safePricePerSquareMeter,
    availableTypes: ['S+1', 'S+2', 'S+3'],
    distribution: {
      'S+1': s1Units.length,
      'S+2': s2Units.length,
      'S+3': s3Units.length
    },
    units,
    unitPrices: {
      'S+1': s1Units[0]?.price || 0,
      'S+2': s2Units[0]?.price || 0,
      'S+3': s3Units[0]?.price || 0
    },
    startingPrice: summary.startingPrice,
    surfaceRange: `${summary.minSurface}-${summary.maxSurface} m2`
  };
}

function normalizePropertyPayload(body, files, existingProperty) {
  const listType = normalizeListingType(body.listingType);
  const uploadedThumbnail = files?.thumbnailFile?.[0]
    ? `/uploads/${files.thumbnailFile[0].filename}`
    : '';
  const uploadedGallery = (files?.galleryFiles || []).map((file) => `/uploads/${file.filename}`);
  const existingImages = Array.isArray(existingProperty?.images) ? existingProperty.images : [];
  const uploadedImages = [uploadedThumbnail, ...uploadedGallery].filter(Boolean);
  const mergedImages = existingProperty
    ? [...new Set([...existingImages, ...uploadedImages])]
    : uploadedImages;
  const mapCoords = detectMapCoordinates(body.googleMapsUrl || existingProperty?.googleMapsUrl || '');

  const propertyType = String(body.type || existingProperty?.type || '').trim();
  const hasApartmentCountInput = String(body.apartmentCount || '').trim() !== '';
  const hasPricePerSquareMeterInput = String(body.pricePerSquareMeter || '').trim() !== '';
  const normalized = {
    id: existingProperty?.id || `${toSlug(body.title || body.type)}-${Date.now()}`,
    ref: String(body.ref || existingProperty?.ref || '').trim(),
    title: String(body.title || existingProperty?.title || '').trim(),
    headline: String(body.headline || existingProperty?.headline || '').trim(),
    listingType: listType,
    status: parseTagList(body.status || existingProperty?.status?.join(',')),
    price: toNumber(body.price, toNumber(existingProperty?.price, 0)),
    paymentTerm: String(body.paymentTerm || existingProperty?.paymentTerm || '').trim(),
    type: propertyType,
    address: String(body.address || existingProperty?.address || '').trim(),
    city: String(body.city || existingProperty?.city || '').trim(),
    bedrooms: toNumber(body.bedrooms, toNumber(existingProperty?.bedrooms, 0)),
    bathrooms: toNumber(body.bathrooms, toNumber(existingProperty?.bathrooms, 0)),
    area: toNumber(body.area, toNumber(existingProperty?.area, 0)),
    yearBuilt: toNumber(body.yearBuilt, toNumber(existingProperty?.yearBuilt, 0)),
    lotSize: toNumber(body.lotSize, toNumber(existingProperty?.lotSize, 0)),
    zone: String(body.zone || existingProperty?.zone || '').trim(),
    thumbnail: uploadedThumbnail || existingProperty?.thumbnail || '',
    images: mergedImages,
    googleMapsUrl: String(body.googleMapsUrl || existingProperty?.googleMapsUrl || '').trim(),
    mapLat: String(body.mapLat || mapCoords.lat || existingProperty?.mapLat || '').trim(),
    mapLng: String(body.mapLng || mapCoords.lng || existingProperty?.mapLng || '').trim(),
    amenities: parseTagList(body.amenities || existingProperty?.amenities?.join(',')),
    agent: existingProperty?.agent || {
      name: 'Rylion Team',
      phone: '+216 50 366 111',
      email: 'contact@rylion-immo.tn',
      avatar: '/assets/img/real-estate/agent-2.webp',
      company: 'Rylion Immobilière'
    },
    priceNote: String(body.priceNote || existingProperty?.priceNote || '').trim(),
    createdAt: existingProperty?.createdAt || new Date().toISOString()
  };

  if (propertyType.toLowerCase() === 'residence') {
    const existingResidencePricePerM2 = guessResidencePricePerM2(existingProperty);
    const residenceSeed = getResidenceSeed(existingProperty || { id: normalized.id, title: normalized.title });
    const apartmentCountChanged = hasApartmentCountInput
      && Number(body.apartmentCount) !== Number(existingProperty?.apartmentCount || 0);
    const pricePerSquareMeterChanged = hasPricePerSquareMeterInput
      && Number(body.pricePerSquareMeter) !== Number(existingResidencePricePerM2 || 0);
    const nextApartmentCount = hasApartmentCountInput
      ? body.apartmentCount
      : existingProperty?.apartmentCount;
    const nextPricePerSquareMeter = hasPricePerSquareMeterInput
      ? body.pricePerSquareMeter
      : existingResidencePricePerM2;
    const shouldRegenerateResidence = !existingProperty
      || apartmentCountChanged
      || pricePerSquareMeterChanged
      || !existingProperty?.units
      || !existingProperty?.distribution;

    const generatedResidence = shouldRegenerateResidence
      ? generateResidenceInventory(nextApartmentCount || 0, nextPricePerSquareMeter || existingResidencePricePerM2, residenceSeed)
      : {
        apartmentCount: existingProperty.apartmentCount,
        pricePerSquareMeter: existingResidencePricePerM2,
        availableTypes: existingProperty.availableTypes,
        distribution: existingProperty.distribution,
        units: existingProperty.units,
        unitPrices: existingProperty.unitPrices,
        startingPrice: existingProperty.startingPrice || existingProperty.price || 0,
        surfaceRange: existingProperty.surfaceRange
      };

    normalized.price = generatedResidence.startingPrice || normalized.price;
    normalized.paymentTerm = '';
    normalized.bedrooms = toNumber(existingProperty?.bedrooms, toNumber(body.bedrooms, 0));
    normalized.bathrooms = toNumber(existingProperty?.bathrooms, toNumber(body.bathrooms, 0));
    normalized.area = toNumber(existingProperty?.area, toNumber(body.area, 0));
    normalized.apartmentCount = generatedResidence.apartmentCount;
    normalized.pricePerSquareMeter = generatedResidence.pricePerSquareMeter;
    normalized.availableTypes = generatedResidence.availableTypes;
    normalized.distribution = generatedResidence.distribution;
    normalized.units = generatedResidence.units;
    normalized.unitPrices = generatedResidence.unitPrices;
    normalized.startingPrice = generatedResidence.startingPrice;
    normalized.surfaceRange = generatedResidence.surfaceRange;
  } else {
    delete normalized.apartmentCount;
    delete normalized.pricePerSquareMeter;
    delete normalized.availableTypes;
    delete normalized.distribution;
    delete normalized.units;
    delete normalized.unitPrices;
    delete normalized.startingPrice;
    delete normalized.surfaceRange;
  }

  if (!normalized.images.length && normalized.thumbnail) {
    normalized.images = [normalized.thumbnail];
  }

  return normalized;
}

function applyMediaUpdate(property, body, files) {
  const uploadedThumbnail = files?.thumbnailFile?.[0]
    ? `/uploads/${files.thumbnailFile[0].filename}`
    : '';
  const uploadedGallery = (files?.galleryFiles || []).map((file) => `/uploads/${file.filename}`);
  const removeImages = new Set(parseFormArray(body.removeImages));
  const existingImages = Array.isArray(property.images) ? property.images : [];
  const keptImages = existingImages.filter((image) => !removeImages.has(image));
  const nextImages = [...new Set([...keptImages, ...uploadedGallery])];
  const requestedCover = String(body.coverImage || '').trim();
  const coverFromRequest = requestedCover && nextImages.includes(requestedCover) ? requestedCover : '';
  const nextThumbnail = uploadedThumbnail || coverFromRequest || (removeImages.has(property.thumbnail) ? '' : property.thumbnail) || nextImages[0] || '';

  return {
    ...property,
    thumbnail: nextThumbnail,
    images: nextImages.length ? nextImages : (nextThumbnail ? [nextThumbnail] : [])
  };
}

function formatAdminPrice(property) {
  const amount = `${formatNumber(property.price || property.startingPrice || 0)} TND`;
  if (property.listingType === 'rent' && property.paymentTerm) {
    return `${amount}/${property.paymentTerm}`;
  }
  return amount;
}

const adminStatusMeta = {
  featured: { className: 'featured', label: 'En vedette' },
  'for-sale': { className: 'sale', label: 'A vendre' },
  'for-rent': { className: 'rent', label: 'A louer' },
  new: { className: 'new', label: 'Nouvelle annonce' },
  hot: { className: 'hot', label: 'Coup de coeur' },
  'price-drop': { className: 'sale', label: 'Baisse de prix' }
};

function paginate(list, page) {
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  return {
    currentPage,
    totalPages,
    items: list.slice(start, start + PAGE_SIZE)
  };
}

app.set('view engine', 'ejs');
app.set('views', path.join(ROOT_DIR, 'views'));

app.locals.assetVersion = Date.now();
app.locals.formatCurrency = formatCurrency;
app.locals.formatNumber = formatNumber;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/assets', express.static(path.join(PUBLIC_DIR, 'assets')));
app.use('/uploads', express.static(path.join(PUBLIC_DIR, 'uploads')));
app.use(express.static(PUBLIC_DIR));

const uploadStorage = multer.diskStorage({
  destination: (_, __, cb) => {
    const uploadDir = path.join(PUBLIC_DIR, 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeBase = toSlug(path.basename(file.originalname || 'image', ext));
    cb(null, `${Date.now()}-${Math.floor(Math.random() * 1000000)}-${safeBase}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const adminUpload = upload.fields([
  { name: 'thumbnailFile', maxCount: 1 },
  { name: 'galleryFiles', maxCount: 10 }
]);

function requireAdmin(req, res, next) {
  const expectedUser = process.env.ADMIN_EMAIL || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin';
  const authHeader = String(req.headers.authorization || '');

  if (!authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentification requise.');
  }

  let decoded = '';
  try {
    decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
  } catch (error) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentification invalide.');
  }

  const separator = decoded.indexOf(':');
  const user = separator >= 0 ? decoded.slice(0, separator) : decoded;
  const password = separator >= 0 ? decoded.slice(separator + 1) : '';

  if (user !== expectedUser || password !== expectedPassword) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Identifiants admin invalides.');
  }

  return next();
}

app.get('/', (req, res) => {
  const residences = properties.filter((property) => property.type === 'Residence');
  const villas = properties.filter((property) => property.type === 'Villa');
  const siteSettings = readSiteSettings();

  res.render('index', {
    page: 'home',
    heroImage: siteSettings.heroImage || images.hero,
    homeSettings: siteSettings,
    residences,
    villas,
    featuredResidences: residences.slice(0, 4),
    featuredVillas: villas.slice(0, 3),
    startPrice: Math.min(...residences.map((property) => property.startingPrice))
  });
});

app.get('/properties', (req, res) => {
  const sourceProperties = getPublicProperties();
  const searchQuery = String(req.query.search || '').trim();
  const normalizedQuery = searchQuery.toLowerCase();
  const filteredProperties = normalizedQuery
    ? sourceProperties.filter((property) => {
      const haystack = [
        property.title,
        property.address,
        property.city,
        property.ref,
        property.zone,
        property.location,
        property.locationShort
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    })
    : sourceProperties;
  const pagination = paginate(filteredProperties, req.query.page);

  res.render('properties', {
    page: 'properties',
    properties: pagination.items,
    allProperties: filteredProperties,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalProperties: filteredProperties.length,
    pageSize: PAGE_SIZE,
    searchQuery
  });
});

app.get('/property/:id', (req, res) => {
  const fileProperties = readPropertiesFile();
  const property = fileProperties.find((item) => item.id === req.params.id)
    || properties.find((item) => item.id === req.params.id);

  if (!property) {
    return res.status(404).render('property-details', {
      page: 'properties',
      property: null
    });
  }

  return res.render('property-details', {
    page: 'properties',
    property
  });
});

app.get('/contact', (req, res) => {
  res.render('contact', {
    page: 'contact',
    submitted: req.query.sent === '1'
  });
});

app.get('/investir-kelibia', (req, res) => {
  const investmentAnalysis = buildInvestmentAnalysis(getPublicProperties());
  res.render('investir-kelibia', {
    page: 'invest',
    analysisEntries: investmentAnalysis.entries,
    analysisSummary: investmentAnalysis.summary,
    formatCurrency,
    formatNumber
  });
});

app.get('/statistiques', (req, res) => {
  res.render('statistiques', {
    page: 'statistics'
  });
});

app.get('/estimation', (req, res) => {
  res.render('estimation', {
    page: 'estimation',
    modelSummary: pricePredictor.summary()
  });
});

app.get('/api/properties', (_, res) => {
  return res.json({
    data: getPublicProperties()
  });
});

app.post('/api/ml/predict-price', (req, res) => {
  try {
    const input = {
      type: String(req.body.type || '').trim(),
      zone: String(req.body.zone || '').trim(),
      area: Number(req.body.area || 0),
      bedrooms: Number(req.body.bedrooms || 0),
      bathrooms: Number(req.body.bathrooms || 0),
      yearBuilt: Number(req.body.yearBuilt || 0),
      lotSize: Number(req.body.lotSize || 0),
      apartmentCount: Number(req.body.apartmentCount || 0)
    };

    if (!input.type) {
      return res.status(400).json({ error: 'Le type du bien est obligatoire.' });
    }

    if (!input.zone) {
      return res.status(400).json({ error: 'La zone est obligatoire.' });
    }

    if (input.type.toLowerCase() === 'villa' && !input.area) {
      return res.status(400).json({ error: 'La surface est obligatoire pour une villa.' });
    }

    if (input.type.toLowerCase() === 'residence' && !input.apartmentCount) {
      return res.status(400).json({
        error: "Le nombre d'appartements est obligatoire pour une residence."
      });
    }

    const prediction = pricePredictor.predict(input);
    return res.json({
      data: prediction
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Impossible d'estimer le prix."
    });
  }
});

app.post('/contact-request', (req, res) => {
  const entry = {
    id: `contact-${Date.now()}`,
    name: String(req.body.name || '').trim(),
    phone: String(req.body.phone || '').trim(),
    message: String(req.body.message || '').trim(),
    createdAt: new Date().toISOString()
  };

  saveContactRequest(entry);
  res.redirect('/contact?sent=1');
});

app.get('/admin', requireAdmin, (_, res) => {
  res.redirect('/admin/sale');
});

app.get('/admin/:mode', requireAdmin, (req, res) => {
  const mode = String(req.params.mode || '').toLowerCase();
  if (!['sale', 'rent', 'requests'].includes(mode)) {
    return res.redirect('/admin/sale');
  }

  const adminProperties = readPropertiesFile();
  const saleProperties = adminProperties.filter((property) => property.listingType === 'sale');
  const rentProperties = adminProperties.filter((property) => property.listingType === 'rent');
  const requests = readContactRequests();
  const siteSettings = readSiteSettings();

  return res.render('admin', {
    title: 'Admin',
    description: 'Espace administrateur Rylion Immobilière',
    page: 'admin',
    viewMode: mode,
    properties: adminProperties,
    saleProperties,
    rentProperties,
    requests,
    ownerRequests: [],
    statusMeta: adminStatusMeta,
    formatPrice: formatAdminPrice,
    homeSettings: siteSettings,
    homeHeroImage: siteSettings.heroImage || DEFAULT_HERO_IMAGE,
    heroUpdated: String(req.query.heroUpdated || '') === '1',
    heroError: String(req.query.heroError || '') === '1',
    homeContentUpdated: String(req.query.homeContentUpdated || '') === '1'
  });
});

app.post('/admin', requireAdmin, adminUpload, (req, res) => {
  const propertiesList = readPropertiesFile();
  const created = normalizePropertyPayload(req.body, req.files);
  propertiesList.unshift(created);
  writePropertiesFile(propertiesList);
  res.redirect(`/admin/${created.listingType}`);
});

app.post('/admin/settings/home-hero', requireAdmin, upload.single('homeHeroFile'), (req, res) => {
  const requestedMode = String(req.body.redirectMode || '').toLowerCase();
  const nextMode = ['sale', 'rent', 'requests'].includes(requestedMode) ? requestedMode : 'sale';

  if (!req.file) {
    return res.redirect(`/admin/${nextMode}?heroError=1`);
  }

  writeSiteSettings({
    heroImage: `/uploads/${req.file.filename}`
  });

  return res.redirect(`/admin/${nextMode}?heroUpdated=1`);
});

app.post('/admin/settings/home-content', requireAdmin, (req, res) => {
  const requestedMode = String(req.body.redirectMode || '').toLowerCase();
  const nextMode = ['sale', 'rent', 'requests'].includes(requestedMode) ? requestedMode : 'sale';

  writeSiteSettings({
    heroEyebrow: req.body.heroEyebrow,
    heroTitle: req.body.heroTitle,
    heroSubtitle: req.body.heroSubtitle,
    heroMicrocopy: req.body.heroMicrocopy,
    heroCtaLabel: req.body.heroCtaLabel,
    heroCtaHref: req.body.heroCtaHref,
    sceneCaptionTitle: req.body.sceneCaptionTitle,
    sceneCaptionSubtitle: req.body.sceneCaptionSubtitle,
    sceneImageSmallA: req.body.sceneImageSmallA,
    sceneImageSmallB: req.body.sceneImageSmallB
  });

  return res.redirect(`/admin/${nextMode}?homeContentUpdated=1`);
});

app.get('/admin/edit/:id', requireAdmin, (req, res) => {
  const propertiesList = readPropertiesFile();
  const property = propertiesList.find((item) => item.id === req.params.id);
  if (!property) {
    return res.status(404).send('Annonce introuvable.');
  }

  const saleProperties = propertiesList.filter((item) => item.listingType === 'sale');
  const rentProperties = propertiesList.filter((item) => item.listingType === 'rent');

  return res.render('admin-edit', {
    title: 'Admin - Edition',
    description: 'Edition d une annonce immobiliere',
    page: 'admin',
    property,
    saleProperties,
    rentProperties
  });
});

app.post('/admin/update/:id', requireAdmin, adminUpload, (req, res) => {
  const propertiesList = readPropertiesFile();
  const propertyIndex = propertiesList.findIndex((item) => item.id === req.params.id);
  if (propertyIndex < 0) {
    return res.status(404).send('Annonce introuvable.');
  }

  const existing = propertiesList[propertyIndex];
  const mediaAdjusted = applyMediaUpdate(existing, req.body, req.files);
  const updated = normalizePropertyPayload(req.body, {}, mediaAdjusted);
  updated.id = existing.id;
  propertiesList[propertyIndex] = updated;
  writePropertiesFile(propertiesList);

  return res.redirect(`/admin/${updated.listingType}`);
});

app.post('/admin/media/:id', requireAdmin, adminUpload, (req, res) => {
  const propertiesList = readPropertiesFile();
  const propertyIndex = propertiesList.findIndex((item) => item.id === req.params.id);
  if (propertyIndex < 0) {
    return res.status(404).send('Annonce introuvable.');
  }

  const updated = applyMediaUpdate(propertiesList[propertyIndex], req.body, req.files);
  propertiesList[propertyIndex] = updated;
  writePropertiesFile(propertiesList);

  return res.redirect(`/admin/edit/${updated.id}#media-files`);
});

app.post('/admin/delete', requireAdmin, (req, res) => {
  const id = String(req.body.id || '');
  const propertiesList = readPropertiesFile();
  const target = propertiesList.find((item) => item.id === id);
  const nextList = propertiesList.filter((item) => item.id !== id);
  writePropertiesFile(nextList);

  const nextMode = target?.listingType === 'rent' ? 'rent' : 'sale';
  res.redirect(`/admin/${nextMode}`);
});

app.get('/residences', (_, res) => res.redirect('/properties?page=1'));
app.get('/villas', (_, res) => res.redirect('/properties?page=3'));

const requestedPort = Number(PORT) || 3000;
const fallbackPort = requestedPort === 3000 ? 3001 : requestedPort + 1;

function startServer(port, allowFallback) {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error && error.code === 'EADDRINUSE' && allowFallback) {
      console.warn(`Port ${port} is already in use. Retrying on http://localhost:${fallbackPort}`);
      startServer(fallbackPort, false);
      return;
    }

    throw error;
  });
}

startServer(requestedPort, true);
