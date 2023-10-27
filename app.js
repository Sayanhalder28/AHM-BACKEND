/**
 * @desc    This file contains the main server file for the application
 * @author  sayan halder
 * @since   13/10/2023
 */

const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { pool, DbConnection } = require("./config/db");

app.set("view engine", "ejs");
// Import the responseApi.js

app.use(cors());
app.use(express.json());

// add extension methods to the response object. Manual in the responseApi.js file
app.use(require("./utils/responseApi"));

//import Routes
const userRoutes = require("./routes/userRouts").router;
const workshopRoutes = require("./routes/workshopRoutes").router;
const assetRoutes = require("./routes/assetRoutes").router;
const sensorRoutes = require("./routes/sensorRoutes").router;

//use Routes
app.use("/v1", userRoutes);
app.use("/data/workshop", workshopRoutes);
app.use("/data/asset", assetRoutes);
app.use("/data/sensor", sensorRoutes);

app.get("/", async (req, res) => {
  const [rows] = await pool.execute("SELECT * FROM users ;");
  res.send(rows);
});

//Handling Unknown Requests
app.use((req, res) => {
  res.status(404).json({ error: "Invalide Request" });
});

//Error Handling
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || "Something went wrong";
  return res.status(statusCode).json({ message: errorMessage });
});

//Starting Server
const Port = process.env.PORT;
const startServer = async () => {
  const DbConnectionStatus = await DbConnection();
  if (DbConnectionStatus) {
    app.listen(Port, () => {
      console.log(`Server is up at ${Port}`);
    });
  } else {
    console.log("Server is not up");
    // setTimeout(startServer, 5000);
  }
};
startServer();

// app.listen(Port, () => {
//   console.log(`Server is up at ${Port}`);
// });
