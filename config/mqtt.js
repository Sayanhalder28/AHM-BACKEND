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


function publishMessage() {
  const dummyData = JSON.stringify({
    temperature: Math.floor(Math.random() * 100) + 1,
    vibration_x: Math.floor(Math.random() * (5 - 3)) + 3,
    vibration_y: Math.floor(Math.random() * (7 - 3)) + 3,
    vibration_z: Math.floor(Math.random() * (5 - 3)) + 3,
    magnetic_flux_x: Math.floor(Math.random() * (5 - 3)) + 3,
    magnetic_flux_y: Math.floor(Math.random() * (5 - 3)) + 3,
    magnetic_flux_z: Math.floor(Math.random() * (5 - 3)) + 3,
    ultrasound: Math.floor(Math.random() * (5 - 3)) + 3,
    ultrasound_delta: Math.floor(Math.random() * (8 - 3)) + 3,
  });


  // const dummyData = JSON.stringify({
  //   temperature: 3,
  //   vibration_x: 3,
  //   vibration_y: 1,
  //   vibration_z: 3,
  //   magnetic_flux_x: 1,
  //   magnetic_flux_y: 3,
  //   magnetic_flux_z: 3,
  //   ultrasound: 3,
  //   ultrasound_delta: 3,
  // });
  client.publish(
    "IEMA/AHM/NODE1",
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
  setInterval(publishMessage, 4000); //publishing the fake massage to the broker
});

client.on("message", async (topic, payload) => {
  console.time("Data_inserted_in");

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
        // console.log(assetTableData[0]);
        let health_status = "healthy";
        if (
          (data.temperature >= assetTableData[0].temperature_healthy &&
            data.temperature < assetTableData[0].temperature_warning) ||
          (data.vibration_x >= assetTableData[0].vibration_healthy &&
            data.vibration_x < assetTableData[0].vibration_warning) ||
          (data.vibration_y >= assetTableData[0].vibration_healthy &&
            data.vibration_y < assetTableData[0].vibration_warning) ||
          (data.vibration_z >= assetTableData[0].vibration_healthy &&
            data.vibration_z < assetTableData[0].vibration_warning) ||
          (data.magnetic_flux_x >= assetTableData[0].magnetic_flux_healthy &&
            data.magnetic_flux_x < assetTableData[0].vibration_warning) ||
          (data.magnetic_flux_y >= assetTableData[0].magnetic_flux_healthy &&
            data.magnetic_flux_y < assetTableData[0].magnetic_flux_warning) ||
          (data.magnetic_flux_z >= assetTableData[0].magnetic_flux_healthy &&
            data.magnetic_flux_z < assetTableData[0].magnetic_flux_warning) ||
          (data.ultrasound >= assetTableData[0].ultrasound_healthy &&
            data.ultrasound < assetTableData[0].ultrasound_warning) ||
          (data.ultrasound_delta >= assetTableData[0].ultrasound_healthy &&
            data.ultrasound_delta < assetTableData[0].ultrasound_warning)
        ) {
          health_status = "warning";
        }
        if (
          data.temperature >= assetTableData[0].temperature_warning ||
          data.vibration_x >= assetTableData[0].vibration_warning ||
          data.vibration_y >= assetTableData[0].vibration_warning ||
          data.vibration_z >= assetTableData[0].vibration_warning ||
          data.magnetic_flux_x >= assetTableData[0].magnetic_flux_warning ||
          data.magnetic_flux_y >= assetTableData[0].magnetic_flux_warning ||
          data.magnetic_flux_z >= assetTableData[0].magnetic_flux_warning ||
          data.ultrasound >= assetTableData[0].ultrasound_warning ||
          data.ultrasound_delta >= assetTableData[0].ultrasound_warning
        ) {
          health_status = "Unhealthy";
        }

        // find the peak values of the vibration and magnetic flux
        // quary the last peak value and then comapre with the current value
        // if current value is greater than the last peak value then update the peak value
        // else keep the last peak value

        // vibration peak
        let vibration_peak = 0;
        let magnetic_flux_peak = 0;

        const clock = new Date();
        const hours = clock.getHours();
        const minutes = clock.getMinutes();
        const seconds = clock.getSeconds();

        if (
          (hours === 23 && minutes === 59 && seconds >= 55) ||
          (hours === 0 && minutes === 0 && seconds == 0) ||
          (hours === 0 && minutes === 0 && seconds <= 5)
        ) {
          console.log("Peak reset");
          vibration_peak = 0;
          magnetic_flux_peak = 0;
        } else
          try {
            const [peakValue] = await pool.execute(
              `SELECT vibration_peak,magnetic_flux_peak FROM ${assetDataTableName} ORDER BY id DESC LIMIT 1;`
            );

            if (peakValue.length) {
              vibration_peak = Math.max(
                data.vibration_x,
                data.vibration_y,
                data.vibration_z,
                peakValue[0].vibration_peak
              );
              magnetic_flux_peak = Math.max(
                data.magnetic_flux_x,
                data.magnetic_flux_y,
                data.magnetic_flux_z,
                peakValue[0].magnetic_flux_peak
              );
            }
          } catch (error) {
            console.log("error quaring the last peak value of the vibration");
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
              vibration_peak,
              data.magnetic_flux_x,
              data.magnetic_flux_y,
              data.magnetic_flux_z,
              magnetic_flux_peak,
              data.ultrasound,
              data.ultrasound_delta,
              health_status,
            ]
          );

          // console.log("data inserted of sensor id: ", sensor_id);
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
  console.timeEnd("Data_inserted_in");
});

client.on("error", function (err) {
  console.log("Error: " + err);
  if (err.code == "ENOTFOUND") {
    console.log(
      "Network error, make sure you have an active internet connection"
    );
  }
});

client.on('close', () => {
  console.log('MQTT connection closed');
  // You can handle connection closure here
});

// client.on("offline", function () {
//   console.log("Client is currently offline!");
// });

module.exports = client;
