const client = require("../config/mqtt");
const pool = require("../config/db").pool;

var sensorData = ["asdfasdf", "asdfasdf", "asdfasdf", "asdfasdf"];
let clock = 10;

const registerSensor = (req, res) => {};

const sensorHealth = async (req, res, next) => {
  try {
    const asset_id = req.query.assetId;
    const sensor_type = req.query.sensorType;

    if (!asset_id) return res.error(400, "missing parameters in the request");
    try {
      const quary = `SELECT health_status FROM asset_data_${sensor_type}_${asset_id} ORDER BY id DESC LIMIT 1 ;`;
      const [assetListResponse] = await pool.execute(quary);
      if (assetListResponse.length) {
        const responseData = {
          asset_id: asset_id,
          sensor_type: sensor_type,
          ...assetListResponse[0],
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
          [{ health_status: "unkhown" }]
        );
    } catch (error) {
      return res.error(500, "internal error");
    }
  } catch (error) {
    next(error);
  }
};

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
            [{ health_status: "unkhown" }]
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

module.exports = {
  sensorReadings,
  registerSensor,
  sensorHealth,
  sensorThresholdValues,
};
