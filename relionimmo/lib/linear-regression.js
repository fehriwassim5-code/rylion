class LinearRegression {
  constructor(options = {}) {
    this.learningRate = options.learningRate || 0.05;
    this.iterations = options.iterations || 4000;
    this.weights = [];
    this.means = [];
    this.stds = [];
    this.featureCount = 0;
  }

  fit(samples, targets) {
    if (!Array.isArray(samples) || !samples.length) {
      throw new Error('Training samples are required.');
    }

    if (!Array.isArray(targets) || targets.length !== samples.length) {
      throw new Error('Targets must match the number of samples.');
    }

    this.featureCount = samples[0].length;
    this.means = [];
    this.stds = [];

    for (let featureIndex = 0; featureIndex < this.featureCount; featureIndex += 1) {
      const values = samples.map((sample) => Number(sample[featureIndex] || 0));
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const variance =
        values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
      const std = Math.sqrt(variance) || 1;

      this.means.push(mean);
      this.stds.push(std);
    }

    const normalizedSamples = samples.map((sample) => this.normalizeSample(sample));
    this.weights = Array(this.featureCount + 1).fill(0);
    const sampleCount = normalizedSamples.length;

    for (let iteration = 0; iteration < this.iterations; iteration += 1) {
      const gradients = Array(this.featureCount + 1).fill(0);

      for (let rowIndex = 0; rowIndex < sampleCount; rowIndex += 1) {
        const sample = normalizedSamples[rowIndex];
        const prediction = this.predictNormalized(sample);
        const error = prediction - targets[rowIndex];

        gradients[0] += error;
        for (let featureIndex = 0; featureIndex < this.featureCount; featureIndex += 1) {
          gradients[featureIndex + 1] += error * sample[featureIndex];
        }
      }

      for (let weightIndex = 0; weightIndex < this.weights.length; weightIndex += 1) {
        this.weights[weightIndex] -=
          (this.learningRate * gradients[weightIndex]) / sampleCount;
      }
    }
  }

  normalizeSample(sample) {
    return sample.map((value, index) => {
      const numericValue = Number(value || 0);
      return (numericValue - this.means[index]) / this.stds[index];
    });
  }

  predictNormalized(sample) {
    let result = this.weights[0] || 0;
    for (let featureIndex = 0; featureIndex < sample.length; featureIndex += 1) {
      result += (this.weights[featureIndex + 1] || 0) * sample[featureIndex];
    }
    return result;
  }

  predict(sample) {
    if (!this.weights.length) {
      throw new Error('Model has not been trained yet.');
    }
    return this.predictNormalized(this.normalizeSample(sample));
  }

  predictBatch(samples) {
    return samples.map((sample) => this.predict(sample));
  }
}

module.exports = LinearRegression;
