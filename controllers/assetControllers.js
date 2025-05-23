const pool = require("../config/db").pool;
const client = require("../config/mqtt");
const {
  generateDummySignal,
  generateSpectrum,
  calculatePeak,
  analyseSpectrum,
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
      (Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000)
    }`;

    const workshop_id = `WP-${workshop_code}`;

    try {
      const connection = await pool.getConnection();
      try {
        // create the tables for the asset data
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
            \`temperature_one\` FLOAT  NOT NULL,
            \`temperature_two\` FLOAT  NOT NULL,
            \`vibration_x\` FLOAT  NOT NULL,
            \`vibration_y\` FLOAT  NOT NULL,
            \`vibration_z\` FLOAT  NOT NULL,
            \`vibration_peak\` FLOAT  NOT NULL,
            \`magnetic_flux_x\` FLOAT  NOT NULL,
            \`magnetic_flux_y\` FLOAT  NOT NULL,
            \`magnetic_flux_z\` FLOAT  NOT NULL,
            \`magnetic_flux_peak\` FLOAT  NOT NULL,
            \`ultra_sound\` FLOAT  NOT NULL,
            \`audible_sound\` FLOAT  NOT NULL,
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

        // subscribe to the new topics
        try {
          const topics = sensors_connected.map(
            (sensorDetails) => `IEMA/AHM/${sensorDetails.sensor_id}`
          );
          client.subscribe(topics, { qos: 0, retain: false }, () => {
            console.log(`Subscribed to topic '${topics}'`);
          });
        } catch (error) {
          return res.error(
            500,
            "internal error subscribing to the topics",
            error
          );
        }

        res.success(200, "Asset registered successfully");
      } catch (error) {
        await connection.rollback();
        res.error(500, "internal error resgistering the form data", error);
      } finally {
        return connection.release();
      }
    } catch (error) {
      return res.error(500, "internal error connecting the database", error);
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

const diagnoseAsset = async (req, res, next) => {
  // const asset_id = req.params.asset_id;
  // const user_id = req.params.user_id;

  // run query to get the asset data from the database 
  // const sensorsInUse = []; // array to store the sensor ids


  // request sample data from the sensors

  // const sampleData = {};

  // LOOP START(sensorsInUse) 
    // request diagnosys data from the sensors --> newSampleData
    // const sampleId = store the newSampleData in sample table
    // sampleData = { ...sampleData, sample{i} :{id : sampleId , newSampleData} }
  // LOOP END() 


  // run the diagnosys algorithm on each sensor sample data

  // const processedSample = {};

  // LOOP START(sampleData)
    // const FFTResult = runFFT(sampleData[i]);
    // store the FFTResult in the processed_samples table
    // processedSampleData = { ...processedSampleData, processedSample{i}:{sampleId : sampleId , FFTResult} }
  // LOOP END() 

  // Run the final model on the processed sensor data

  // const finalResult = runFinalModel(processedSampleData);

  // store report in the diagnosys_report table 

  // store report and sample link in diagnosys_samples_meta table

  // send the success response 



  
  // const asset_id = req.params.asset_id;
  // // ** // generate dummy signal -->> this will be replaced by the vibration data from the database or direct from device in the future
  // const sampleRate = 5000;
  // const XVB_Signal = generateDummySignal(sampleRate, 1); // Radial vibration in X axis
  // const YVB_Signal = generateDummySignal(sampleRate, 1); // Axial Vibration in Y axis
  // const ZVB_Signal = generateDummySignal(sampleRate, 1); // Tangential Vibration in Z axis
  // const XMF_Signal = generateDummySignal(sampleRate, 1);
  // const YMF_Signal = generateDummySignal(sampleRate, 1);
  // const ZMF_Signal = generateDummySignal(sampleRate, 1);
  // const UU_Signal = generateDummySignal(sampleRate, 1);

  // // ** // Generate the spectrum from complex signal
  // const fftSampleCount = 4096; // must ge greater than the 1 and a power of 2
  // const XVB_Spectrum = generateSpectrum(XVB_Signal, sampleRate, fftSampleCount); // takes complex signal, sample rate and fft sample count as argument
  // const YVB_Spectrum = generateSpectrum(YVB_Signal, sampleRate, fftSampleCount);
  // const ZVB_Spectrum = generateSpectrum(ZVB_Signal, sampleRate, fftSampleCount);
  // const XMF_Spectrum = generateSpectrum(XMF_Signal, sampleRate, fftSampleCount);
  // const YMF_Spectrum = generateSpectrum(YMF_Signal, sampleRate, fftSampleCount);
  // const ZMF_Spectrum = generateSpectrum(ZMF_Signal, sampleRate, fftSampleCount);
  // const US_Spectrum = generateSpectrum(UU_Signal, sampleRate, fftSampleCount);

  // // ** // Find pB_om the spectrum data
  // const peakThreshold = 500;
  // const peakDistance = 10;
  // const XVB_peaks = calculatePeak(XVB_Spectrum, peakThreshold, peakDistance); // takes spectrum data, peak threshold and peak distance as argument
  // const YVB_peaks = calculatePeak(YVB_Spectrum, peakThreshold, peakDistance);
  // const ZVB_peaks = calculatePeak(ZVB_Spectrum, peakThreshold, peakDistance);
  // const XMF_peaks = calculatePeak(XMF_Spectrum, peakThreshold, peakDistance);
  // const YMF_peaks = calculatePeak(YMF_Spectrum, peakThreshold, peakDistance);
  // const ZMF_peaks = calculatePeak(ZMF_Spectrum, peakThreshold, peakDistance);
  // const US_peaks = calculatePeak(US_Spectrum, peakThreshold, peakDistance);

  // // ** // generate the report
  // const assetSpecifications = {
  //   ratedRPM: 3000,
  //   ratedPower: 1000,
  //   ratedVoltage: 1000,
  //   ratedCurrent: 1000,
  //   ratedFrequency: 1000,
  //   ratedEfficiency: 1000,
  //   ratedPowerFactor: 1000,
  //   ratedTorque: 1000,
  //   ratedSpeed: 1000,
  // };

  // const all_freequency_peaks = {
  //   XVB_peaks: XVB_peaks,
  //   YVB_peaks: YVB_peaks,
  //   ZVB_peaks: ZVB_peaks,
  //   XMF_peaks: XMF_peaks,
  //   YMF_peaks: YMF_peaks,
  //   ZMF_peaks: ZMF_peaks,
  //   US_peaks: US_peaks,
  // };

  // const analysisReport = analyseSpectrum(
  //   all_freequency_peaks,
  //   assetSpecifications
  // ); // takes peaks and spectrum data as argument

  // const DiagnosysReport = {
  //   XVibration: {
  //     signal: XVB_Signal,
  //     spectrum: XVB_Spectrum,
  //     peaks: XVB_peaks,
  //   },
  //   YVibration: {
  //     signal: YVB_Signal,
  //     spectrum: YVB_Spectrum,
  //     peaks: YVB_peaks,
  //   },
  //   ZVibration: {
  //     signal: ZVB_Signal,
  //     spectrum: ZVB_Spectrum,
  //     peaks: ZVB_peaks,
  //   },
  //   XMagneticFlux: {
  //     signal: XMF_Signal,
  //     spectrum: XMF_Spectrum,
  //     peaks: XMF_peaks,
  //   },
  //   YMagneticFlux: {
  //     signal: YMF_Signal,
  //     spectrum: YMF_Spectrum,
  //     peaks: YMF_peaks,
  //   },
  //   ZMagneticFlux: {
  //     signal: ZMF_Signal,
  //     spectrum: ZMF_Spectrum,
  //     peaks: ZMF_peaks,
  //   },
  //   Ultrasound: {
  //     signal: UU_Signal,
  //     spectrum: US_Spectrum,
  //     peaks: US_peaks,
  //   },
  //   analisysReport: analysisReport,
  // };

  // // ** // send response to the client along with the data
  // // res.render("page", {
  // //   spectrumData: XVB_Spectrum,
  // //   peakFrequencies: XVB_peaks,
  // //   dyagnoseReport: DiagnosysReport,
  // // });
  res.success(200, "Diagnosys done successfully", DiagnosysReport);
};

const assetHistory = async (req, res, next) => {
  const asset_id = req.query.assetId;
  if (!asset_id) return res.error(400, "missing parameters in the request");
  try {
    const quary = `SELECT sensor_type FROM sensors WHERE asset_id_fk=? ;`;
    const [response] = await pool.execute(quary, [asset_id]);
    if (response.length) {
      const assetDataTables = response.map(
        (sensor) => `asset_data_${sensor.sensor_type}_${asset_id}`
      );
      const fetchDataPromises = assetDataTables.map(async (tableName) => {
        const fetchDataQuery = `SELECT * FROM ${tableName};`;
        const [tableData] = await pool.execute(fetchDataQuery);
        return { tableName, tableData };
      });

      const assetTablesData = await Promise.all(fetchDataPromises);
      return res.success(200, `History of asset: ${asset_id}`, assetTablesData);
    } else return res.error(400, "invalid asset id");
  } catch (error) {
    return res.error(500, "internal error");
  }
};

module.exports = { registerAsset, getAssetList, diagnoseAsset, assetHistory };
