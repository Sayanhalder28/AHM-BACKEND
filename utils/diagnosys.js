/**
 * @desc    This file contain all necesssary functions for asset diagnosys
 * @author  sayan halder
 * @since   13/10/2023
 */

const FFT = require("fft.js");

const generateDummySignal = (sampleRate, duration) => {
  const minFrequency = 100;
  const maxFrequency = sampleRate / 2;

  const frequencyCounts = 10;

  // Generate random frequencies
  const frequencies = [22, 50, 100, 150];
  // for (let i = 0; i < frequencyCounts; i++) {
  //   const frequency =
  //     Math.floor(Math.random() * (maxFrequency - minFrequency + 1)) +
  //     minFrequency;
  //   frequencies.push(frequency);
  // }

  // Generate the complex signal by summing multiple sine waves
  const signal = new Array(sampleRate * duration).fill(0);

  for (let i = 0; i < signal.length; i++) {
    for (let j = 0; j < frequencies.length; j++) {
      signal[i] += Math.sin(2 * Math.PI * frequencies[j] * (i / sampleRate));
    }
  }
  return signal;
};

const generateSpectrum = (complexSignal, sampleRate, fftSampleCount) => {
  const fft = new FFT(fftSampleCount);

  const complexData = fft.createComplexArray();
  const realData = complexSignal.slice(0, fftSampleCount); // complexSignal sample count must be equal or greater than the fftSampleCount

  fft.realTransform(complexData, realData); // real data is being converted to complex data by FFT

  const spectrum = [];

  // Calculate the magnitude of complex data using the Pythagorean theorem

  for (let i = 0; i < complexData.length; i += 2) {
    const realPart = complexData[i];
    const imaginaryPart = complexData[i + 1];

    const magnitude = Math.sqrt(realPart ** 2 + imaginaryPart ** 2);

    spectrum.push(magnitude);
  }

  // Calculate the frequency for each point in the spectrum array
  const allFrequency = spectrum.map(
    (magnitude, index) => (sampleRate / fftSampleCount) * index
  );

  return {
    frequency: allFrequency.slice(0, allFrequency.length / 2), // only half of the spectrum is needed as per the Nyquist theorem as after nyquist frequency the spectrum is mot acc
    magnitude: spectrum.slice(0, spectrum.length / 2),
  };
};

const calculatePeakValues = (spectrumData, peakThreshold, peakDistance) => {
  const peaks = [];
  //compare every conjusent points and find the peaks
  for (let i = 0; i < spectrumData.magnitude.length; i++) {
    if (spectrumData.magnitude[i] > peakThreshold) {
      let isPeak = true;
      for (let j = i - peakDistance; j < i; j++) {
        if (spectrumData.magnitude[i] < spectrumData.magnitude[j]) {
          isPeak = false;
          break;
        }
      }
      for (let j = i + 1; j < i + peakDistance; j++) {
        if (spectrumData.magnitude[i] < spectrumData.magnitude[j]) {
          isPeak = false;
          break;
        }
      }
      if (isPeak) {
        peaks.push(spectrumData.frequency[i]);
      }
    }
  }
  return peaks;
};

const generateReport = (peakFrequencies, assetSpecifications) => {
  // const report = ["imbalance", "misalignment", "bearing", "eccentricity"];
  const report = [];
  const ratedFrequency = assetSpecifications.ratedRPM / 60;
  const tolerance = 5; //in percentage
  // check for imbalance
  const harmonics = new Array(10)
    .fill()
    .map((_, index) => ratedFrequency * (index + 1));

  const halfHarmonics = new Array(10)
    .fill()
    .map((_, index) => ratedFrequency * (index + 1) * 0.5);

  // Diagnosing using all harmonic,subharmonic and half harmonic values
  const allHarmonics = harmonics.concat(halfHarmonics);
  const faultyFrequecies = peakFrequencies.filter((frequency) => {
    return allHarmonics.some((fundFreqValue) => {
      return (
        frequency > fundFreqValue * ((100 - tolerance) / 100) &&
        frequency < fundFreqValue * ((100 + tolerance) / 100)
      );
    });
  });
  console.log(faultyFrequecies);
  if (faultyFrequecies.length) {
    if (faultyFrequecies.length >= 2) {
      if (
        faultyFrequecies[0] > ratedFrequency * ((100 - tolerance) / 100) &&
        faultyFrequecies[0] < ratedFrequency * ((100 + tolerance) / 100) &&
        faultyFrequecies[1] > ratedFrequency * 2 * ((100 - tolerance) / 100) &&
        faultyFrequecies[1] < ratedFrequency * 2 * ((100 + tolerance) / 100)
      )
        report.push("Bent Shaft");
    }
    if (faultyFrequecies.length >= 3) {
      if (
        faultyFrequecies[0] > ratedFrequency * ((100 - tolerance) / 100) &&
        faultyFrequecies[0] < ratedFrequency * ((100 + tolerance) / 100) &&
        faultyFrequecies[1] > ratedFrequency * 2 * ((100 - tolerance) / 100) &&
        faultyFrequecies[1] < ratedFrequency * 2 * ((100 + tolerance) / 100) &&
        faultyFrequecies[2] > ratedFrequency * 3 * ((100 - tolerance) / 100) &&
        faultyFrequecies[2] < ratedFrequency * 3 * ((100 + tolerance) / 100)
      )
        report.push("Miss Alignment");
    }
    if (true) {
      report.push("looseness");
    }
    if (true) {
      report.push("Oil whirl");
    }
    if (true) {
      report.push("Lubrication issues");
    }
    if (true) {
      report.push("Bearing outer race issues");
    }
    if (true) {
      report.push("Bearing rolling element issues");
    } else report.push("Machine Imbalance");
  }

  // check for oil whirl
  // const bearingCageDefect = peakFrequencies.filter((frequency) => {
  //   return (
  //     frequency > ratedFrequency * 0.42 * ((100 - tolerance) / 100) &&
  //     frequency < ratedFrequency * 0.48 * ((100 + tolerance) / 100)
  //   );
  // });
  // if (bearingCageDefect.length) report.push("Bearing cage defect");

  return report;
};

module.exports = {
  generateDummySignal,
  generateSpectrum,
  calculatePeakValues,
  generateReport,
};
