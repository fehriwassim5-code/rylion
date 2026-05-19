import * as d3 from 'd3';

export const COLORS = {
  summer: '#ff8a3d',
  annual: '#1a5c7a',
  villa: '#0e8a8a',
  apartment: '#d6a73f',
  line: '#17324d',
  grid: 'rgba(23, 50, 77, 0.14)',
  text: '#17324d'
};

const APARTMENT_BASE = {
  'S+1': 150,
  'S+2': 200,
  'S+3': 250
};

export function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

function isNearBeach(rawValue, property) {
  if (String(rawValue || '').toLowerCase() === 'proche') {
    return true;
  }

  const explicitDistance = property.distance_plage ?? property.distancePlage;
  if (explicitDistance !== undefined && explicitDistance !== null && explicitDistance !== '') {
    const lower = String(explicitDistance).toLowerCase().trim();
    if (lower === 'proche') {
      return true;
    }

    const distance = Number(explicitDistance);
    if (Number.isFinite(distance)) {
      return distance <= 1;
    }
  }

  const haystack = [
    property.zone,
    property.address,
    property.city,
    property.location,
    property.locationShort
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return ['plage', 'mer', 'corniche', 'mansoura', 'beachfront'].some((token) => haystack.includes(token));
}

function hasPool(property) {
  if (typeof property.piscine === 'boolean') {
    return property.piscine;
  }

  if (typeof property.pool === 'boolean') {
    return property.pool;
  }

  return Array.isArray(property.amenities)
    ? property.amenities.some((item) => String(item).toLowerCase().includes('piscine'))
    : false;
}

function buildResidenceLabel(property) {
  if (String(property.type || '').toLowerCase() === 'villa') {
    return property.title || property.headline || 'Villa';
  }

  return property.residence
    || property.parentTitle
    || property.title
    || property.headline
    || 'Residence';
}

function buildDetailHref(property) {
  return property.id ? `/property/${property.id}` : '#';
}

function normalizeResidenceProperty(property) {
  const residence = buildResidenceLabel(property);
  const nearBeach = isNearBeach(property.distance_plage, property);

  if (property.units && typeof property.units === 'object') {
    return Object.entries(property.units).flatMap(([categorie, units]) =>
      (Array.isArray(units) ? units : []).map((unit, index) => ({
        id: `${property.id}-${categorie}-${index}`,
        sourceId: property.id,
        residence,
        title: `${residence} ${categorie}`,
        detailTitle: `${residence} ${categorie}`,
        type: 'Appartement',
        chambres: 0,
        piscine: false,
        categorie,
        distance_plage: nearBeach ? 'proche' : 'standard',
        prochePlage: nearBeach,
        prix: toNumber(unit.price ?? property.price ?? property.prix),
        thumbnail: property.thumbnail || '',
        address: property.address || '',
        city: property.city || '',
        zone: property.zone || '',
        surface: toNumber(unit.surface),
        detailHref: buildDetailHref(property)
      }))
    );
  }

  return [{
    id: property.id,
    sourceId: property.id,
    residence,
    title: property.title || property.headline || residence,
    detailTitle: property.title || property.headline || residence,
    type: 'Appartement',
    chambres: 0,
    piscine: false,
    categorie: property.categorie || property.category || 'S+2',
    distance_plage: nearBeach ? 'proche' : 'standard',
    prochePlage: nearBeach,
    prix: toNumber(property.prix ?? property.price),
    thumbnail: property.thumbnail || '',
    address: property.address || '',
    city: property.city || '',
    zone: property.zone || '',
    surface: toNumber(property.surface ?? property.area),
    detailHref: buildDetailHref(property)
  }];
}

function normalizeVillaProperty(property) {
  return [{
    id: property.id,
    sourceId: property.id,
    residence: buildResidenceLabel(property),
    title: property.title || property.headline || 'Villa',
    detailTitle: property.title || property.headline || 'Villa',
    type: 'Villa',
    chambres: toNumber(property.chambres ?? property.bedrooms),
    piscine: hasPool(property),
    categorie: 'Villa',
    distance_plage: property.distance_plage ?? property.distancePlage ?? '',
    prochePlage: isNearBeach(property.distance_plage, property),
    prix: toNumber(property.prix ?? property.price),
    thumbnail: property.thumbnail || '',
    address: property.address || '',
    city: property.city || '',
    zone: property.zone || '',
    detailHref: buildDetailHref(property)
  }];
}

export function normalizeProperties(rawList) {
  return rawList.flatMap((property) => {
    const rawType = String(property.type || '').toLowerCase();
    return rawType === 'villa'
      ? normalizeVillaProperty(property)
      : normalizeResidenceProperty(property);
  });
}

export function enrichProperty(property) {
  if (property.type === 'Villa') {
    const price_per_night = 250 + (property.chambres * 50) + (property.piscine ? 150 : 0);
    const revenu_ete = price_per_night * 90 * 0.75;
    const revenu_annuel = (price_per_night * 10) * 12;
    const ROI = property.prix > 0 ? revenu_annuel / property.prix : 0;
    const category = `${property.chambres || 0} chambres ${property.piscine ? 'piscine' : 'sans piscine'}`;

    return {
      ...property,
      price_per_night,
      revenu_ete,
      revenu_annuel,
      ROI,
      category,
      categoryType: category
    };
  }

  const apartmentCategory = APARTMENT_BASE[property.categorie] ? property.categorie : 'S+2';
  let base_price = APARTMENT_BASE[apartmentCategory];

  if (String(property.distance_plage || '').toLowerCase() === 'proche' || property.prochePlage) {
    base_price *= 1.25;
  }

  const revenu_ete = base_price * 90 * 0.6;
  const revenu_annuel = (base_price * 8) * 12;
  const ROI = property.prix > 0 ? revenu_annuel / property.prix : 0;

  return {
    ...property,
    price_per_night: base_price,
    revenu_ete,
    revenu_annuel,
    ROI,
    category: apartmentCategory,
    categoryType: apartmentCategory
  };
}

function buildProjection(price) {
  return Array.from({ length: 5 }, (_, index) => {
    const year = index + 1;
    return {
      year,
      value: Number(price || 0) * Math.pow(1.05, year)
    };
  });
}

function extractNumericLabelOrder(label) {
  const match = String(label || '').match(/(\d+)/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

export function buildDashboardData(properties) {
  // Normalize heterogeneous API payloads into a single BI-ready dataset.
  const enriched = normalizeProperties(properties)
    .map(enrichProperty)
    .map((property) => ({
      ...property,
      projection5y: buildProjection(property.prix),
      comparisonWithAverage: 0
    }))
    .sort((left, right) => right.ROI - left.ROI);

  if (!enriched.length) {
    return null;
  }

  const averageROI = d3.mean(enriched, (item) => item.ROI) || 0;
  const averagePrice = d3.mean(enriched, (item) => item.prix) || 0;
  const averageSummer = d3.mean(enriched, (item) => item.revenu_ete) || 0;
  const averageAnnual = d3.mean(enriched, (item) => item.revenu_annuel) || 0;

  const enhanced = enriched.map((property) => ({
    ...property,
    comparisonWithAverage: averageROI ? (property.ROI - averageROI) / averageROI : 0
  }));

  const grouped = d3.group(
    enhanced,
    (item) => item.residence,
    (item) => item.type,
    (item) => item.category
  );

  const sections = Array.from(grouped, ([residence, typeGroups]) => ({
    residence,
    typeGroups: Array.from(typeGroups, ([type, categoryGroups]) => ({
      type,
      categories: Array.from(categoryGroups, ([category, items]) => ({
        category,
        items: [...items].sort((left, right) => right.ROI - left.ROI)
      })).sort((left, right) => {
        if (type === 'Appartement') {
          const order = ['S+1', 'S+2', 'S+3'];
          return order.indexOf(left.category) - order.indexOf(right.category);
        }
        return d3.descending(
          d3.mean(left.items, (item) => item.ROI) || 0,
          d3.mean(right.items, (item) => item.ROI) || 0
        );
      })
    })).sort((left, right) => left.type.localeCompare(right.type, 'fr'))
  })).sort((left, right) => {
    const leftValue = extractNumericLabelOrder(left.residence);
    const rightValue = extractNumericLabelOrder(right.residence);

    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }

    return left.residence.localeCompare(right.residence, 'fr', { numeric: true, sensitivity: 'base' });
  });

  const bestProperty = enhanced[0];

  const barData = d3.rollups(
    enhanced,
    (items) => ({
      revenu_ete: d3.sum(items, (item) => item.revenu_ete),
      revenu_annuel: d3.sum(items, (item) => item.revenu_annuel),
      count: items.length
    }),
    (item) => item.category
  )
    .map(([label, values]) => ({
      label,
      ...values
    }))
    .sort((left, right) => {
      const apartmentOrder = ['S+1', 'S+2', 'S+3'];
      const leftIndex = apartmentOrder.indexOf(left.label);
      const rightIndex = apartmentOrder.indexOf(right.label);
      if (leftIndex !== -1 || rightIndex !== -1) {
        return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
      }
      return left.label.localeCompare(right.label, 'fr', { numeric: true, sensitivity: 'base' });
    });

  const pieData = d3.rollups(
    enhanced,
    (items) => items.length,
    (item) => item.type
  ).map(([label, value]) => ({ label, value }));

  const lineData = Array.from({ length: 5 }, (_, index) => {
    const year = index + 1;
    return {
      year: `Annee ${year}`,
      // Portfolio price projection uses the requested 5% yearly growth.
      value: averagePrice * Math.pow(1.05, year)
    };
  });

  return {
    properties: enhanced,
    sections,
    selectedProperty: bestProperty,
    kpis: {
      totalProperties: enhanced.length,
      averageROI,
      bestProperty,
      averagePrice,
      averageSummer,
      averageAnnual
    },
    charts: {
      barData,
      pieData,
      lineData
    },
    averages: {
      roi: averageROI,
      price: averagePrice,
      summer: averageSummer,
      annual: averageAnnual
    }
  };
}
