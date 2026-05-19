const fs = require('fs');
const path = require('path');
const LinearRegression = require('../lib/linear-regression');

const PROPERTY_FILE = path.join(__dirname, '..', 'data', 'properties.json');
const ZONES = ['Beachfront', 'City Center', 'Quiet Areas'];

function readProperties() {
  const raw = fs.readFileSync(PROPERTY_FILE, 'utf8') || '[]';
  return JSON.parse(raw);
}

function normalizeZone(zone) {
  const value = String(zone || '').trim().toLowerCase();
  if (value.includes('beach')) return 'Beachfront';
  if (value.includes('city') || value.includes('center') || value.includes('centre')) {
    return 'City Center';
  }
  if (value.includes('quiet') || value.includes('calm') || value.includes('sidi')) {
    return 'Quiet Areas';
  }
  return 'Quiet Areas';
}

function encodeZone(zone) {
  const normalizedZone = normalizeZone(zone);
  return ZONES.map((item) => (item === normalizedZone ? 1 : 0));
}

function createVillaFeatures(property) {
  return [
    Number(property.area || 0),
    Number(property.bedrooms || 0),
    Number(property.bathrooms || 0),
    Number(property.yearBuilt || 0),
    Number(property.lotSize || 0),
    ...encodeZone(property.zone)
  ];
}

function createResidenceFeatures(property) {
  return [
    Number(property.apartmentCount || 0),
    Number(property.yearBuilt || 0),
    ...encodeZone(property.zone)
  ];
}

function calculateMetrics(actual, predicted) {
  if (!actual.length || actual.length !== predicted.length) {
    return { mae: 0, rmse: 0, r2: 0 };
  }

  const mean = actual.reduce((sum, value) => sum + value, 0) / actual.length;
  let absoluteError = 0;
  let squaredError = 0;
  let totalVariance = 0;

  for (let index = 0; index < actual.length; index += 1) {
    const error = predicted[index] - actual[index];
    absoluteError += Math.abs(error);
    squaredError += error ** 2;
    totalVariance += (actual[index] - mean) ** 2;
  }

  return {
    mae: absoluteError / actual.length,
    rmse: Math.sqrt(squaredError / actual.length),
    r2: totalVariance ? 1 - squaredError / totalVariance : 1
  };
}

function stableHash(value) {
  const source = String(value || '');
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function splitDataset(list) {
  const shuffled = [...list].sort((a, b) => {
    const left = stableHash(a.seed);
    const right = stableHash(b.seed);
    return left - right;
  });
  const pivot = Math.max(1, Math.floor(list.length * 0.8));
  const train = shuffled.slice(0, pivot);
  const test = shuffled.slice(pivot);
  return { train, test: test.length ? test : train };
}

function trainModel(items, featureBuilder, options) {
  const prepared = items
    .filter((item) => item.listingType === 'sale' && Number(item.price || 0) > 0)
    .map((item) => ({
      seed: item.id,
      features: featureBuilder(item),
      target: Number(item.price)
    }));

  if (prepared.length < 3) {
    throw new Error('Not enough data to train the model.');
  }

  const { train, test } = splitDataset(prepared);
  const model = new LinearRegression(options);

  model.fit(
    train.map((item) => item.features),
    train.map((item) => item.target)
  );

  const predictions = test.map((item) => model.predict(item.features));
  const metrics = calculateMetrics(
    test.map((item) => item.target),
    predictions
  );

  return {
    model,
    sampleSize: prepared.length,
    metrics
  };
}

function buildPredictor() {
  const properties = readProperties();
  const villas = properties.filter((property) => property.type === 'Villa');
  const residences = properties.filter((property) => property.type === 'Residence');

  const villaTraining = trainModel(villas, createVillaFeatures, {
    learningRate: 0.06,
    iterations: 5000
  });
  const residenceTraining = trainModel(residences, createResidenceFeatures, {
    learningRate: 0.05,
    iterations: 4500
  });

  function predict(input) {
    const propertyType = String(input.type || '').trim().toLowerCase();

    if (propertyType === 'villa') {
      const features = createVillaFeatures(input);
      return {
        propertyType: 'Villa',
        estimatedPrice: Math.max(0, Math.round(villaTraining.model.predict(features))),
        metrics: villaTraining.metrics,
        sampleSize: villaTraining.sampleSize,
        featuresUsed: ['area', 'bedrooms', 'bathrooms', 'yearBuilt', 'lotSize', 'zone']
      };
    }

    if (propertyType === 'residence') {
      const features = createResidenceFeatures(input);
      return {
        propertyType: 'Residence',
        estimatedPrice: Math.max(0, Math.round(residenceTraining.model.predict(features))),
        metrics: residenceTraining.metrics,
        sampleSize: residenceTraining.sampleSize,
        featuresUsed: ['apartmentCount', 'yearBuilt', 'zone']
      };
    }

    throw new Error('Unsupported property type. Use "Villa" or "Residence".');
  }

  return {
    predict,
    summary() {
      return {
        villa: {
          sampleSize: villaTraining.sampleSize,
          metrics: villaTraining.metrics,
          featuresUsed: ['area', 'bedrooms', 'bathrooms', 'yearBuilt', 'lotSize', 'zone']
        },
        residence: {
          sampleSize: residenceTraining.sampleSize,
          metrics: residenceTraining.metrics,
          featuresUsed: ['apartmentCount', 'yearBuilt', 'zone']
        }
      };
    }
  };
}

module.exports = buildPredictor;
