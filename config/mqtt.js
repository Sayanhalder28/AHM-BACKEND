const pool = require("./db").pool;
const mqtt = require("mqtt");
const host = process.env.HOST;
const port = process.env.PORT;
const clientId = process.env.CLIENT_ID;
let counter = 0;

// const connectUrl = `mqtt://${host}:${port}`; // BROKER URI
const connectUrl = `mqtt://test.mosquitto.org:1883`; // BROKER URI
const options = {
  clientId,
  clean: true,
  // connectTimeout: 4000,
  // username: '',
  // password: '',
  // reconnectPeriod: 1000,
};
const client = mqtt.connect(connectUrl, options);

const dummyData = JSON.stringify({
  temperature: 22,
  vibration_x: 25,
  vibration_y: 25,
  vibration_z: 25,
  vibration_peak: 25,
  magnetic_flux_x: 25,
  magnetic_flux_y: 25,
  magnetic_flux_z: 25,
  magnetic_flux_peak: 25,
  ultrasound: 25,
  ultrasound_delta: 25,
  health_status: 25,
});

function publishMessage() {
  client.publish(
    "IEMA/AHM/two",
    dummyData,
    { qos: 0, retain: false },
    (error) => {
      if (error) {
        console.log(
          "Error while publishing the message \n <error message> \n",
          error
        );
      }
    }
  );
}

client.on("connect", async (connack) => {
  pool
    .execute("SELECT `sensor_id` FROM `sensors`;")
    .then(([rows]) => {
      const topics = rows.map((object) => `IEMA/AHM/${object.sensor_id}`);
      client.subscribe(topics, { qos: 0, retain: false }, () => {
        console.log(`Subscribe to topic '${topics}'`);
      });
      // client.subscribe("IEMA/AHM/wrong", { qos: 0, retain: false });
    })
    .catch((error) => {
      console.log(
        "Error while getting the topics from the database | subscribing to the topics \n <error massage> \n",
        error
      );
    });
  // setInterval(publishMessage, 2000); //publishing the fake massage to the broker
});

client.on("message", async (topic, payload) => {
  //seperate sensor_id from the topic
  const sensor_id = topic.split("/")[2];
  const data = JSON.parse(payload.toString());

  if (Object.keys(data).length) {
    //run quarey to find the asset table information and thresshold values
    try {
      const [assetTableData] = await pool.execute(
        "SELECT * FROM sensors WHERE sensor_id = ?;",
        [sensor_id]
      );

      // prepare and insert the data to the asset data table if exist
      if (assetTableData.length) {
        // prepare the asset data table name
        const assetDataTableName = `asset_data_${assetTableData[0].sensor_type}_${assetTableData[0].asset_id_fk}`;
        // calculate the health status
        let health_status = "healthy";
        if (
          data.temperature > assetTableData[0].temperature_healthy ||
          data.vibration_x > assetTableData[0].vibration_healthy ||
          data.vibration_y > assetTableData[0].vibration_healthy ||
          data.vibration_z > assetTableData[0].vibration_healthy ||
          data.magnetic_flux_x > assetTableData[0].vibration_healthy ||
          data.magnetic_flux_y > assetTableData[0].vibration_healthy ||
          data.magnetic_flux_z > assetTableData[0].vibration_healthy
        ) {
          health_status = "warning";
        }
        if (
          data.temperature > assetTableData[0].temperature_warning ||
          data.vibration_x > assetTableData[0].vibration_warning ||
          data.vibration_y > assetTableData[0].vibration_warning ||
          data.vibration_z > assetTableData[0].vibration_warning ||
          data.magnetic_flux_x > assetTableData[0].vibration_warning ||
          data.magnetic_flux_y > assetTableData[0].vibration_warning ||
          data.magnetic_flux_z > assetTableData[0].vibration_warning
        ) {
          health_status = "Unhealthy";
        }

        //run quary to load the data to the specific table

        try {
          const [assetDataTableInsertResponse] = await pool.execute(
            `INSERT INTO ${assetDataTableName}
            (
              temperature,
              vibration_x,
              vibration_y, 
              vibration_z,  
              vibration_peak,    
              magnetic_flux_x,
              magnetic_flux_y,      
              magnetic_flux_z,
              magnetic_flux_peak,
              ultrasound, 
              ultrasound_delta, 
              health_status
            ) 
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`,
            [
              data.temperature,
              data.vibration_x,
              data.vibration_y,
              data.vibration_z,
              data.vibration_peak,
              data.magnetic_flux_x,
              data.magnetic_flux_y,
              data.magnetic_flux_z,
              data.magnetic_flux_peak,
              data.ultrasound,
              data.ultrasound_delta,
              health_status,
            ]
          );

          console.log("data inserted of sensor id: ", sensor_id);
          // counter++;
          // console.log(counter, assetDataTableName);
          // client.emit("newMessage", data);
        } catch (error) {
          console.log(
            "Error while inserting the data to the asset table \n <error message> \n",
            error
          );
        }
      } else console.log("No asset table found for the sensor id: ", sensor_id);
    } catch (error) {
      console.log(
        "Error while getting the asset table information \n <error message> \n",
        error
      );
    }
  } else console.log("No data sent by the sensor id:", sensor_id);
});

client.on("error", function (err) {
  console.log("Error: " + err);
  if (err.code == "ENOTFOUND") {
    console.log(
      "Network error, make sure you have an active internet connection"
    );
  }
});

// client.on("offline", function () {
//   console.log("Client is currently offline!");
// });

module.exports = client;
