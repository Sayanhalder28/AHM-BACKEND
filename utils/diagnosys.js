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
  // const frequencies = [22, 50, 100, 150, 200];
  const frequencies = [50,100];

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

const calculatePeak = (spectrumData, peakThreshold, peakDistance) => {
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

const analyseSpectrum = (all_freequency_peaks, assetSpecifications) => {
  // const report = ["imbalance", "misalignment", "bearing", "eccentricity"];

  const XVB_peaks = all_freequency_peaks.XVB_peaks; //radial vibration
  const YVB_peaks = all_freequency_peaks.YVB_peaks; //axial vibration
  const ZVB_peaks = all_freequency_peaks.ZVB_peaks; //vertical vibration
  const XMF_peaks = all_freequency_peaks.XMF_peaks;
  const YMF_peaks = all_freequency_peaks.YMF_peaks;
  const ZMF_peaks = all_freequency_peaks.ZMF_peaks;
  const US_peaks = all_freequency_peaks.US_peaks;

  const report = [];
  const ratedFrequency = assetSpecifications.ratedRPM / 60; //1x frequency
  const tolerance = 5; //in percentage
  // check for imbalance
  const harmonics = new Array(10)
    .fill()
    .map((_, index) => ratedFrequency * (index + 1));

  const halfHarmonics = new Array(10)
    .fill()
    .map((_, index) => ratedFrequency * (index + 1) * 0.5);

  // Diagnosing using all harmonic,subharmonic and half harmonic values
  const completeHarmonics = harmonics.concat(halfHarmonics);

  // const XVB_peaks_faults = XVB_peaks.filter((frequency) => {
  //   return completeHarmonics.some((fundFreqValue) => {
  //     return (
  //       frequency > fundFreqValue * ((100 - tolerance) / 100) &&
  //       frequency < fundFreqValue * ((100 + tolerance) / 100)
  //     );
  //   });
  // });

  //check for Imbalance
  if (XVB_peaks.length) {
    //check is ther any 1x frequency in XVB_peaks array elements
    const is1xFrequency = XVB_peaks.some((frequency) => {
      return (
        frequency > ratedFrequency * ((100 - tolerance) / 100) &&
        frequency < ratedFrequency * ((100 + tolerance) / 100)
      );
    });
    if (is1xFrequency) report.push("Plane imbalance");
  }

  //check for Overhung rotor
  if (XVB_peaks.length && YVB_peaks.length) {
    //check is ther any 1x frequency in XVB_peaks array elements
    const is1xInXVB = XVB_peaks.some((frequency) => {
      return (
        frequency > ratedFrequency * ((100 - tolerance) / 100) &&
        frequency < ratedFrequency * ((100 + tolerance) / 100)
      );
    });

    const is1xInYVB = YVB_peaks.some((frequency) => {
      return (
        frequency > ratedFrequency * ((100 - tolerance) / 100) &&
        frequency < ratedFrequency * ((100 + tolerance) / 100)
      );
    });

    if (is1xInXVB && is1xInYVB) report.push("Overhung rotor");
  }

  // if (XVB_peaks_faults.length) {
  //   if (XVB_peaks_faults.length >= 2) {
  //     if (
  //       XVB_peaks_faults[0] > ratedFrequency * ((100 - tolerance) / 100) &&
  //       XVB_peaks_faults[0] < ratedFrequency * ((100 + tolerance) / 100) &&
  //       XVB_peaks_faults[1] > ratedFrequency * 2 * ((100 - tolerance) / 100) &&
  //       XVB_peaks_faults[1] < ratedFrequency * 2 * ((100 + tolerance) / 100)
  //     )
  //       report.push("Bent Shaft");
  //   }
  //   if (XVB_peaks_faults.length >= 3) {
  //     if (
  //       XVB_peaks_faults[0] > ratedFrequency * ((100 - tolerance) / 100) &&
  //       XVB_peaks_faults[0] < ratedFrequency * ((100 + tolerance) / 100) &&
  //       XVB_peaks_faults[1] > ratedFrequency * 2 * ((100 - tolerance) / 100) &&
  //       XVB_peaks_faults[1] < ratedFrequency * 2 * ((100 + tolerance) / 100) &&
  //       XVB_peaks_faults[2] > ratedFrequency * 3 * ((100 - tolerance) / 100) &&
  //       XVB_peaks_faults[2] < ratedFrequency * 3 * ((100 + tolerance) / 100)
  //     )
  //       report.push("Miss Alignment");
  //   }
  //   if (true) {
  //     report.push("looseness");
  //   }
  //   if (true) {
  //     report.push("Oil whirl");
  //   }
  //   if (true) {
  //     report.push("Lubrication issues");
  //   }
  //   if (true) {
  //     report.push("Bearing outer race issues");
  //   }
  //   if (true) {
  //     report.push("Bearing rolling element issues");
  //   } else report.push("Machine Imbalance");
  // }

  // check for oil whirl
  // const bearingCageDefect = peakFrequencies.filter((frequency) => {
  //   return (
  //     frequency > ratedFrequency * 0.42 * ((100 - tolerance) / 100) &&
  //     frequency < ratedFrequency * 0.48 * ((100 + tolerance) / 100)
  //   );
  // });
  // if (bearingCageDefect.length) report.push("Bearing cage defect");
  report.push("Rated Frequency :" + ratedFrequency);
  return report;
};

module.exports = {
  generateDummySignal,
  generateSpectrum,
  calculatePeak,
  analyseSpectrum,
};
