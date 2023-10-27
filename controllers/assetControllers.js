const pool = require("../config/db").pool;
const {
  generateDummySignal,
  generateSpectrum,
  calculatePeakValues,
  generateReport,
} = require("../utils/diagnosys");

const registerAsset = async (req, res, next) => {
  try {
    const {
      workshop_code,
      asset_type,
      site,
      application,
      sensors_connected,
      asset_image,
      asset_description,
    } = req.body;
    if (
      !workshop_code ||
      !asset_type ||
      !site ||
      !application ||
      !sensors_connected ||
      !asset_description
    )
      return res.status(400).json({ massage: "missing data" });

    const asset_id = `${
      workshop_code +
      "_" +
      site +
      "_" +
      (Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000)
    }`;

    const workshop_id = `WP-${workshop_code}`;

    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [assetInsertResponse] = await connection.execute(
          "INSERT INTO assets (asset_id, workshop_id_fk, asset_type, site, application, sensors_connected, asset_image, asset_description) VALUES (?,?,?,?,?,?,?,?);",
          [
            asset_id,
            workshop_id,
            asset_type,
            site,
            application,
            sensors_connected,
            asset_image,
            asset_description,
          ]
        );

        const sensorQueryValues = [];
        sensors_connected.forEach((sensor) => {
          sensorQueryValues.push(
            sensor.sensor_id,
            sensor.sensor_type,
            asset_id
          );
        });

        const sensorInsertQuery = `INSERT INTO sensors (sensor_id, sensor_type, asset_id_fk) VALUES ${sensors_connected
          .map(() => "(?,?,?)")
          .join(",")};`;

        const [sensorInsertResponse] = await connection.execute(
          sensorInsertQuery,
          sensorQueryValues
        );

        const createAssetTableQuary = await sensors_connected
          .map(
            (sensor) => `
        CREATE TABLE IF NOT EXISTS asset_data_${sensor.sensor_type}_${asset_id} (
          \`id\` INT NOT NULL AUTO_INCREMENT,
          \`time_stamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`temperature\` INT NOT NULL,
          \`vibration_x\` INT NOT NULL,
          \`vibration_y\` INT NOT NULL,
          \`vibration_z\` INT NOT NULL,
          \`vibration_peak\` INT NOT NULL,
          \`magnetic_flux_x\` INT NOT NULL,
          \`magnetic_flux_y\` INT NOT NULL,
          \`magnetic_flux_z\` INT NOT NULL,
          \`magnetic_flux_peak\` INT NOT NULL,
          \`ultrasound\` INT NOT NULL,
          \`ultrasound_delta\` INT NOT NULL,
          \`health_status\` VARCHAR(10) NOT NULL DEFAULT 'healthy',
          PRIMARY KEY (\`id\`)
        ) ENGINE = InnoDB;
      `
          )
          .join(" ");

        const [createAssetTableResponse] = await connection.query(
          createAssetTableQuary
        );

        await connection.commit();

        res.status(200).json({ status: "success" });
      } catch (error) {
        await connection.rollback();
        res.status(500).json({
          massage: "internal error resgistering the form data",
          error: error,
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      res
        .status(500)
        .json({ massage: "internal error connecting the database" });
    }
  } catch (error) {
    next(error);
  }
};

const getAssetList = async (req, res, next) => {
  try {
    const workshop_id = req.query.workshop;
    if (workshop_id) {
      try {
        const [assetListResponse] = await pool.execute(
          "SELECT * FROM assets WHERE workshop_id_fk = ? ;",
          [workshop_id]
        );
        return res.success(
          200,
          `All assets of workshop ${workshop_id}`,
          assetListResponse
        );
      } catch (error) {
        return res.error(500, "Internal error", error);
      }
    } else {
      try {
        const [assetListResponse] = await pool.execute("SELECT * FROM assets;");
        return res.success(200, "All assets listed", assetListResponse);
      } catch (error) {
        return res.error(500, "Internal error", error);
      }
    }
  } catch (error) {
    next(error);
  }
};

// run fft on vibration data
const diagnoseAsset = async (req, res, next) => {
  // ** // generate dummy signal -->> this will be replaced by the vibration data from the database or direct from device in the future
  const sampleRate = 5000;
  const Signal = generateDummySignal(sampleRate, 1); // takes sample rate and duration as argument

  // ** // Generate the spectrum from complex signal
  const fftSampleCount = 4096; // must ge greater than the 1 and a power of 2
  const spectrumData = generateSpectrum(Signal, sampleRate, fftSampleCount); // takes complex signal, sample rate and fft sample count as argument

  // ** // Find the peakes from the spectrum data
  const peakThreshold = 0.3;
  const peakDistance = 10;
  const peaks = calculatePeakValues(spectrumData, peakThreshold, peakDistance); // takes spectrum data, peak threshold and peak distance as argument

  // ** // generate the report
  const assetSpecifications = {
    ratedRPM: 3000,
    ratedPower: 1000,
    ratedVoltage: 1000,
    ratedCurrent: 1000,
    ratedFrequency: 1000,
    ratedEfficiency: 1000,
    ratedPowerFactor: 1000,
    ratedTorque: 1000,
    ratedSpeed: 1000,
  };
  const report = generateReport(peaks, assetSpecifications); // takes peaks and spectrum data as argument

  // ** // send response to the client along with the data
  res.render("page", {
    spectrumData: spectrumData,
    peakFrequencies: peaks,
    dyagnoseReport: report,
  });
  // res.success(200, "Spectrum generated", spectrumData);
};

module.exports = { registerAsset, getAssetList, diagnoseAsset };
