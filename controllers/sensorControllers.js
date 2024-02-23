const pool = require("../config/db").pool;
const moment = require("moment-timezone");

var sensorData = ["asdfasdf", "asdfasdf", "asdfasdf", "asdfasdf"];
let clock = 10;

const registerSensor = (req, res) => {};

const sensorThresholdValues = async (req, res, next) => {
  try {
    const sensor_id = req.query.sensorId;
    if (!sensor_id) return res.error(400, "missing parameters in the request");
    try {
      const quary = `SELECT * FROM sensors WHERE sensor_id = ? ;`;
      const [thresholdListResponse] = await pool.execute(quary, [sensor_id]);
      if (!thresholdListResponse.length)
        return res.error(400, "invalid sensor id");
      return res.success(
        200,
        `threshold values of sensorID: ${sensor_id}`,
        thresholdListResponse
      );
    } catch (error) {
      return res.error(500, "internal error");
    }
  } catch (error) {
    next(error);
  }
};

const sensorReadings = async (req, res, next) => {
  try {
    const asset_id = req.query.assetId;
    const sensor_type = req.query.sensorType;
    if (asset_id) {
      try {
        const quary = `SELECT * FROM asset_data_${sensor_type}_${asset_id} ORDER BY id DESC LIMIT 1 ;`;
        const [response] = await pool.execute(quary);
        if (response.length) {
          const responseData = {
            asset_id: asset_id,
            sensor_type: sensor_type,
            ...response[0],
          };
          return res.success(
            200,
            `lastest readings of ${sensor_type} seonsor of ${asset_id}`,
            responseData
          );
        } else
          return res.success(
            200,
            `health status of ${sensor_type} seonsor of ${asset_id}`,
            [{ senor_data: "not found" }]
          );
      } catch (error) {
        // console.log(error);
        return res.error(500, "internal error");
      }
    } else {
      return res.error(400, "missing parameters in the request");
    }
  } catch (error) {
    next(error);
  }
};

const sensorHealth = async (req, res, next) => {
  try {
    const asset_id = req.query.assetId;
    const sensor_type = req.query.sensorType;

    if (!asset_id) return res.error(400, "missing parameters in the request");
    try {
      const quary = `SELECT health_status,time_stamp,vibration_x,vibration_y,vibration_z FROM asset_data_${sensor_type}_${asset_id} ORDER BY id DESC LIMIT 1 ;`;
      const [assetListResponse] = await pool.execute(quary);
      if (assetListResponse.length) {
        // for AWS use this
        const time_stamp = moment(assetListResponse[0].time_stamp).tz(
          "asia/kolkata"
        );

        // for local use this
        // const time_stamp = moment(assetListResponse[0].time_stamp)
        //   .tz("asia/kolkata")
        //   .add(5, "hours")
        //   .add(30, "minutes");

        const current_time = moment().tz("asia/kolkata");

        //calculate asset active status
        const deviceActiveStatus = (() => {
          var device_status = "online";
          var asset_status = "active";
          var health_status = assetListResponse[0].health_status;
          const diff = current_time.diff(time_stamp, "seconds");

          if (diff > 300) {
            device_status = "offline";
            asset_status = "unknown";
            health_status = "unknown";
          } else if (assetListResponse[0].vibration_x <= 0) {
            asset_status = "inactive";
          }
          return {
            device_status,
            asset_status,
            health_status,
          };
        })();

        const responseData = {
          asset_id: asset_id,
          sensor_type: sensor_type,
          ...deviceActiveStatus,
        };
        return res.success(
          200,
          `health status of ${sensor_type} seonsor of ${asset_id}`,
          responseData
        );
      } else
        return res.success(
          200,
          `health status of ${sensor_type} seonsor of ${asset_id}`,
          {
            asset_id: asset_id,
            sensor_type: sensor_type,
            health_status: "unknown",
            device_status: "unknown",
            asset_status: "unknown",
          }
        );
    } catch (error) {
      return res.error(500, "internal error");
    }
  } catch (error) {
    next(error);
  }
};

const sensorHealthTimeline = async (req, res, next) => {
  try {
    const asset_id = req.query.assetId;
    const sensor_type = req.query.sensorType;

    if (!asset_id) return res.error(400, "missing parameters in the request");
    try {
      const quary = `SELECT health_status, time_stamp 
                     FROM asset_data_DE_BOF_92340 
                      WHERE 
                      (DATE(time_stamp) = DATE(NOW() - INTERVAL '18:30' HOUR_MINUTE) AND TIME(time_stamp) >= '18:30:00') -- Yesterday's records from 18:30 onwards
                      OR 
                      (DATE(time_stamp) = DATE(NOW() + INTERVAL '5:30' HOUR_MINUTE) AND TIME(time_stamp) < '18:30:00') -- Today's records before 18:30
                     ORDER BY id;`;
      const [assetListResponse] = await pool.execute(quary);
      if (assetListResponse.length) {
        const senoerHealthAndTime = assetListResponse.map((item) => {
          // for AWS use this
          const date = moment(item.time_stamp).tz("asia/kolkata");

          // for local use this
          // const date = moment(item.time_stamp)
          //   .tz("asia/kolkata")
          //   .add(5, "hours")
          //   .add(30, "minutes");

          const hour = date.get("hour");
          const minute = date.get("minute");

          return {
            health_status: item.health_status,
            hour: hour,
            minute: minute,
          };
        });

        // console.log(senoerHealthAndTime);

        const healthCalculator = (HealthTime) => {
          const response = [];
          for (let i = 0; i <= 23; i++) {
            const firsthalf = HealthTime.filter(
              (item) => item.hour === i && item.minute >= 0 && item.minute < 30
            )
              .map((item) => item.health_status)
              .reduce(
                (acc, current) => {
                  acc[current] = (acc[current] || 0) + 1;

                  if (acc[current] > acc.maxCount) {
                    acc.maxCount = acc[current];
                    acc.maxElement = current;
                  }

                  return acc;
                },
                { maxCount: 0, maxElement: "" }
              ).maxElement;

            const secondhalf = HealthTime.filter(
              (item) => item.hour === i && item.minute >= 30 && item.minute < 60
            )
              .map((item) => item.health_status)
              .reduce(
                (acc, current) => {
                  acc[current] = (acc[current] || 0) + 1;

                  if (acc[current] > acc.maxCount) {
                    acc.maxCount = acc[current];
                    acc.maxElement = current;
                  }

                  return acc;
                },
                { maxCount: 0, maxElement: "" }
              ).maxElement;

            response.push({
              hour: i,
              first_half: firsthalf,
              second_half: secondhalf,
            });
          }

          return response;
        };

        const healthTimeline = healthCalculator(senoerHealthAndTime);

        const responseData = {
          asset_id: asset_id,
          sensor_type: sensor_type,
          health_status: healthTimeline,
        };
        return res.success(
          200,
          `health status of ${sensor_type} seonsor of ${asset_id}`,
          responseData
        );
      } else
        return res.success(
          200,
          `health status of ${sensor_type} seonsor of ${asset_id}`,
          { asset_id: asset_id, sensor_type: sensor_type, health_status: [] }
        );
    } catch (error) {
      return res.error(500, "internal error", error);
    }
  } catch (error) {
    next(error);
  }
};

const updateSensorThreshold = async (req, res, next) => {
  let inputData = req.body;
  //Ensuring all fields should be present in the input

  requiredFields = [
    "sensor_id",
    "temperature_min",
    "temperature_healthy",
    "temperature_warning",
    "temperature_max",
    "vibration_min",
    "vibration_healthy",
    "vibration_warning",
    "vibration_max",
    "magnetic_flux_min",
    "magnetic_flux_healthy",
    "magnetic_flux_warning",
    "magnetic_flux_max",
    "ultrasound_min",
    "ultrasound_healthy",
    "ultrasound_warning",
    "ultrasound_max",
    "allSensor",
    "allAsset",
  ];

  const missingFields = requiredFields.filter((field) => !(field in inputData));
  //checking missing fileds
  if (missingFields.length > 0) {
    const errorMessage = `Missing data for fields: ${missingFields.join(", ")}`;
    console.error(errorMessage);
    return res.status(400).json({ error: errorMessage });
  }

  // Check each field value to ensure it meets the constraints
  const constraints = [
    { min: "temperature_min", max: "temperature_healthy" },
    { min: "temperature_healthy", max: "temperature_warning" },
    { min: "temperature_warning", max: "temperature_max" },
    { min: "vibration_min", max: "vibration_healthy" },
    { min: "vibration_healthy", max: "vibration_warning" },
    { min: "vibration_warning", max: "vibration_max" },
    { min: "magnetic_flux_min", max: "magnetic_flux_healthy" },
    { min: "magnetic_flux_healthy", max: "magnetic_flux_warning" },
    { min: "magnetic_flux_warning", max: "magnetic_flux_max" },
    { min: "ultrasound_min", max: "ultrasound_healthy" },
    { min: "ultrasound_healthy", max: "ultrasound_warning" },
    { min: "ultrasound_warning", max: "ultrasound_max" },
  ];

  for (const constraint of constraints) {
    const minValue = inputData[constraint.min];
    const maxValue = inputData[constraint.max];
    if (minValue >= maxValue) {
      const errorMessage = `${constraint.min} must be less than ${constraint.max}`;
      console.error(errorMessage);
      return res.status(400).json({ error: errorMessage });
    }
  }

  // Update your database query based on your requirements
  const updateQuery = `UPDATE sensors SET temperature_min = ?, temperature_healthy = ?, temperature_warning = ?,
   temperature_max = ?, vibration_min = ?, vibration_healthy = ?, vibration_warning = ?, vibration_max = ?, magnetic_flux_min = ?,
    magnetic_flux_healthy = ?, magnetic_flux_warning = ?, magnetic_flux_max = ?, ultrasound_min = ?, ultrasound_healthy = ?, ultrasound_warning = ?,
     ultrasound_max= ? WHERE sensor_id = ?;`;

  // Extract values from the inputData object
  const values = [
    inputData.temperature_min,
    inputData.temperature_healthy,
    inputData.temperature_warning,
    inputData.temperature_max,
    inputData.vibration_min,
    inputData.vibration_healthy,
    inputData.vibration_warning,
    inputData.vibration_max,
    inputData.magnetic_flux_min,
    inputData.magnetic_flux_healthy,
    inputData.magnetic_flux_warning,
    inputData.magnetic_flux_max,
    inputData.ultrasound_min,
    inputData.ultrasound_healthy,
    inputData.ultrasound_warning,
    inputData.ultrasound_max,
    inputData.sensor_id,
  ];

  //query execution and callback error tracking
  try {
    const response = await pool.execute(updateQuery, values);
    return res.success(200, `Data Updated Successfully..!!`, response);
    // , (err, result) => {
    //   if (!err) {
    //     return res.success(
    //       200,
    //       `Data Updated Successfully..!!`,
    //       result
    //     );
    //   } else {
    //     return res.error(400, "missing parameters in the request");
    //   }
    // });
  } catch (error) {
    return res.error(500, "Error featching data", error);
  }
}; // incomplete

const getServiceStatus = async (req, res, next) => {}; // incomplete

const updateServiceStatus = async (req, res, next) => {}; // incomplete

module.exports = {
  registerSensor,
  sensorThresholdValues,
  sensorReadings,
  sensorHealth,
  sensorHealthTimeline,
  updateSensorThreshold,
  getServiceStatus,
  updateServiceStatus,
};
