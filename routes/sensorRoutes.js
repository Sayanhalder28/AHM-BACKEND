const express = require("express");
const router = express.Router();

const sensorControllers = require("../controllers/sensorControllers");

router.post("/register-sensor", sensorControllers.registerSensor);

router.get("/sesor-health", sensorControllers.sensorHealth);

router.get("/sensor-data", sensorControllers.sensorReadings);



module.exports = { router };
