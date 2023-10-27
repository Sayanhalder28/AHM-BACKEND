const client = require("../config/mqtt");
const pool = require("../config/db").pool;

var sensorData = [];
let clock = 10;

const registerSensor = (req, res) => {};

const sensorHealth = async (req, res, next) => {
  try {
    const asset_id = req.query.assetId;
    const sensor_type = req.query.sensorType;
    if (asset_id) {
      try {
        const quary = `SELECT health_status FROM asset_data_${sensor_type}_${asset_id} ORDER BY id DESC LIMIT 1 ;`;
        const [assetListResponse] = await pool.execute(quary);
        if (assetListResponse.length) {
          const responseData = {
            asset_id: asset_id,
            sensor_type: sensor_type,
            ...assetListResponse[0],
          }
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

const sensorReadings = (req, res, next) => {
  try {
    if (sensorData.length && clock) {
      res.json({ data: sensorData });
      clock--;
    } else {
      console.log("no data found . sent null value");
      res.status(200).json({ data: null });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { sensorReadings, registerSensor, sensorHealth };
