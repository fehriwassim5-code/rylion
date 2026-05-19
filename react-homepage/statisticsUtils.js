const APARTMENT_BASE = {
  'S+1': 150,
  'S+2': 200,
  'S+3': 250
};

const TYPE_ORDER = ['S+1', 'S+2', 'S+3', 'Villa'];
const PRICE_GROWTH_RATE = 0.05;

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

export function formatInteger(value) {
  return new Intl.NumberFormat('fr-TN').format(Number(value || 0));
}

function average(items, accessor) {
  if (!items.length) {
    return 0;
  }

  const total = items.reduce((sum, item) => sum + accessor(item), 0);
  return total / items.length;
}

function sum(items, accessor) {
  return items.reduce((total, item) => total + accessor(item), 0);
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(item);
    return groups;
  }, {});
}

function normalizeMeterDistance(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return null;
  }

  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return rawValue > 50 ? rawValue / 1000 : rawValue;
  }

  const text = String(rawValue).toLowerCase().trim();
  if (!text) {
    return null;
  }

  if (text === 'proche') {
    return 0.4;
  }

  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) {
    return null;
  }

  const numeric = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (text.includes('km')) {
    return numeric;
  }

  if (text.includes('m')) {
    return numeric / 1000;
  }

  return numeric > 50 ? numeric / 1000 : numeric;
}

function isNearBeach(rawValue, property) {
  if (String(rawValue || '').toLowerCase() === 'proche') {
    return true;
  }

  const explicitDistance = property.distance_plage ?? property.distancePlage;
  const normalizedDistance = normalizeMeterDistance(explicitDistance);
  if (normalizedDistance !== null) {
    return normalizedDistance <= 1;
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

function normalizeResidenceProperty(property) {
  const residence = buildResidenceLabel(property);
  const nearBeach = isNearBeach(property.distance_plage, property);
  const rawDistance = property.distance_plage ?? property.distancePlage;

  if (property.units && typeof property.units === 'object') {
    return Object.entries(property.units).flatMap(([category, units]) =>
      (Array.isArray(units) ? units : []).map((unit, index) => ({
        id: `${property.id}-${category}-${index}`,
        sourceId: property.id,
        name: `${residence} ${category}`,
        residence,
        title: `${residence} ${category}`,
        type: 'Appartement',
        investmentType: category,
        category,
        prix: toNumber(unit.price ?? property.price ?? property.prix),
        surface: toNumber(unit.surface),
        bedrooms: 0,
        piscine: false,
        prochePlage: nearBeach,
        distanceKm: normalizeMeterDistance(rawDistance) ?? (nearBeach ? 0.4 : null),
        rawDistance,
        address: property.address || '',
        city: property.city || '',
        zone: property.zone || '',
        thumbnail: property.thumbnail || ''
      }))
    );
  }

  return [{
    id: property.id,
    sourceId: property.id,
    name: property.title || property.headline || residence,
    residence,
    title: property.title || property.headline || residence,
    type: 'Appartement',
    investmentType: property.categorie || property.category || 'S+2',
    category: property.categorie || property.category || 'S+2',
    prix: toNumber(property.prix ?? property.price),
    surface: toNumber(property.surface ?? property.area),
    bedrooms: 0,
    piscine: false,
    prochePlage: nearBeach,
    distanceKm: normalizeMeterDistance(rawDistance) ?? (nearBeach ? 0.4 : null),
    rawDistance,
    address: property.address || '',
    city: property.city || '',
    zone: property.zone || '',
    thumbnail: property.thumbnail || ''
  }];
}

function normalizeVillaProperty(property) {
  const rawDistance = property.distance_plage ?? property.distancePlage;

  return [{
    id: property.id,
    sourceId: property.id,
    name: property.title || property.headline || 'Villa',
    residence: buildResidenceLabel(property),
    title: property.title || property.headline || 'Villa',
    type: 'Villa',
    investmentType: 'Villa',
    category: 'Villa',
    prix: toNumber(property.prix ?? property.price),
    surface: toNumber(property.surface ?? property.area),
    bedrooms: toNumber(property.chambres ?? property.bedrooms),
    piscine: hasPool(property),
    prochePlage: isNearBeach(rawDistance, property),
    distanceKm: normalizeMeterDistance(rawDistance) ?? (isNearBeach(rawDistance, property) ? 0.4 : null),
    rawDistance,
    address: property.address || '',
    city: property.city || '',
    zone: property.zone || '',
    thumbnail: property.thumbnail || ''
  }];
}

export function normalizeProperties(rawProperties) {
  return (Array.isArray(rawProperties) ? rawProperties : []).flatMap((property) => {
    const rawType = String(property.type || '').toLowerCase();
    return rawType === 'villa'
      ? normalizeVillaProperty(property)
      : normalizeResidenceProperty(property);
  });
}

function getDistanceBucket(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) {
    return 'Non renseigne';
  }

  if (distanceKm <= 0.5) {
    return '0-500m';
  }

  if (distanceKm <= 1) {
    return '500m-1km';
  }

  if (distanceKm <= 3) {
    return '1-3km';
  }

  return '3km+';
}

function enrichProperty(property) {
  if (property.type === 'Villa') {
    const pricePerNight = 250 + (property.bedrooms * 50) + (property.piscine ? 150 : 0);
    const summerRevenue = pricePerNight * 90 * 0.75;
    const annualRevenue = (pricePerNight * 10) * 12;
    const roi = property.prix > 0 ? annualRevenue / property.prix : 0;

    return {
      ...property,
      annualRevenue,
      summerRevenue,
      roi,
      pricePerNight,
      broadType: 'Villas',
      distanceBucket: getDistanceBucket(property.distanceKm)
    };
  }

  const apartmentCategory = APARTMENT_BASE[property.investmentType] ? property.investmentType : 'S+2';
  let basePrice = APARTMENT_BASE[apartmentCategory];

  if (property.prochePlage) {
    basePrice *= 1.25;
  }

  const summerRevenue = basePrice * 90 * 0.6;
  const annualRevenue = (basePrice * 8) * 12;
  const roi = property.prix > 0 ? annualRevenue / property.prix : 0;

  return {
    ...property,
    investmentType: apartmentCategory,
    annualRevenue,
    summerRevenue,
    roi,
    pricePerNight: basePrice,
    broadType: 'Apartments',
    distanceBucket: getDistanceBucket(property.distanceKm)
  };
}

function aggregateMetrics(items, label) {
  return {
    label,
    count: items.length,
    averageROI: average(items, (item) => item.roi),
    averageAnnualRevenue: average(items, (item) => item.annualRevenue),
    averageSummerRevenue: average(items, (item) => item.summerRevenue),
    averagePrice: average(items, (item) => item.prix)
  };
}

function buildOrderedAggregates(groups, order) {
  return order
    .filter((label) => groups[label]?.length)
    .map((label) => aggregateMetrics(groups[label], label));
}

function buildInsights(properties) {
  if (!properties.length) {
    return ['No properties are available for portfolio analysis.'];
  }

  const insights = [];
  const byPool = groupBy(properties, (item) => (item.piscine ? 'with-pool' : 'without-pool'));
  const withPool = byPool['with-pool'] || [];
  const withoutPool = byPool['without-pool'] || [];

  if (withPool.length && withoutPool.length) {
    const poolROI = average(withPool, (item) => item.roi);
    const noPoolROI = average(withoutPool, (item) => item.roi);
    if (poolROI > noPoolROI) {
      insights.push('Villas with pools generate higher ROI on average than properties without pools.');
    } else {
      insights.push('Properties without pools currently keep a slightly better ROI, usually because acquisition prices stay lower.');
    }
  }

  const apartmentOnly = properties.filter((item) => item.type === 'Appartement');
  const apartmentsByType = groupBy(apartmentOnly, (item) => item.investmentType);
  const apartmentRanking = buildOrderedAggregates(apartmentsByType, TYPE_ORDER.filter((item) => item !== 'Villa'));
  if (apartmentRanking.length) {
    const bestApartment = [...apartmentRanking].sort((left, right) => right.averageROI - left.averageROI)[0];
    insights.push(`${bestApartment.label} apartments offer the best balance between ticket size and rental income.`);
  }

  const byType = buildOrderedAggregates(groupBy(properties, (item) => item.investmentType), TYPE_ORDER);
  if (byType.length) {
    const bestType = [...byType].sort((left, right) => right.averageROI - left.averageROI)[0];
    insights.push(`${bestType.label} is the strongest investment type right now based on average ROI.`);
  }

  return insights.slice(0, 4);
}

function createRecommendation(properties, byInvestmentType, byPool) {
  const bestType = byInvestmentType.length
    ? [...byInvestmentType].sort((left, right) => right.averageROI - left.averageROI)[0]
    : null;
  const bestPool = byPool.length
    ? [...byPool].sort((left, right) => right.averageROI - left.averageROI)[0]
    : null;

  if (!bestType) {
    return {
      title: 'No clear winner yet',
      summary: 'There is not enough data to recommend an investment type.',
      bullets: []
    };
  }

  return {
    title: `${bestType.label} is the best property type to prioritize`,
    summary: `${bestType.label} currently gives the strongest balance between property price and yearly rental revenue across the full portfolio.`,
    bullets: [
      `${bestType.label} averages ${formatPercent(bestType.averageROI)} ROI.`,
      `${bestType.label} averages ${formatCurrency(bestType.averageAnnualRevenue)} annual revenue.`,
      bestPool ? `${bestPool.label} is the stronger pool profile in the current dataset.` : null
    ].filter(Boolean)
  };
}

export function buildStatisticsDashboard(rawProperties) {
  const properties = normalizeProperties(rawProperties)
    .map(enrichProperty)
    .sort((left, right) => right.roi - left.roi);

  const bestProperty = properties[0] || null;
  const averageROI = average(properties, (item) => item.roi);
  const averageRevenue = average(properties, (item) => item.annualRevenue);
  const byInvestmentType = buildOrderedAggregates(
    groupBy(properties, (item) => item.investmentType),
    TYPE_ORDER
  );
  const byBroadType = buildOrderedAggregates(
    groupBy(properties, (item) => item.broadType),
    ['Villas', 'Apartments']
  );
  const byPool = buildOrderedAggregates(
    groupBy(properties, (item) => (item.piscine ? 'With pool' : 'Without pool')),
    ['With pool', 'Without pool']
  );

  const bestInvestmentType = byInvestmentType[0]
    ? [...byInvestmentType].sort((left, right) => right.averageROI - left.averageROI)[0]
    : null;

  const averagePrice = average(properties, (item) => item.prix);
  const priceProjection = Array.from({ length: 5 }, (_, index) => {
    const year = index + 1;
    return {
      year: `Year ${year}`,
      value: averagePrice * Math.pow(1 + PRICE_GROWTH_RATE, year)
    };
  });

  const typeDistribution = byInvestmentType.map((item) => ({
    label: item.label,
    value: item.count
  }));

  return {
    properties,
    topInvestments: properties.slice(0, 5),
    recommendation: createRecommendation(properties, byInvestmentType, byPool),
    kpis: {
      totalProperties: properties.length,
      averageROI,
      averageRevenue,
      bestInvestmentType,
      bestPropertyROI: bestProperty
    },
    charts: {
      villasVsApartments: byBroadType,
      investmentTypes: byInvestmentType,
      poolImpact: byPool,
      priceProjection,
      typeDistribution
    },
    insights: buildInsights(properties),
    totals: {
      annualRevenue: sum(properties, (item) => item.annualRevenue),
      summerRevenue: sum(properties, (item) => item.summerRevenue)
    }
  };
}
