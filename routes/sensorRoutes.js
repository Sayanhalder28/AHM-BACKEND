const express = require("express");
const router = express.Router();

const sensorControllers = require("../controllers/sensorControllers");

router.post("/register-sensor", sensorControllers.registerSensor);

router.get("/sesor-health", sensorControllers.sensorHealth);

router.get("/sesor-health-timeline", sensorControllers.sensorHealthTimeline);

router.get("/sensor-threshold", sensorControllers.sensorThresholdValues);

router.get("/sensor-data", sensorControllers.sensorReadings);
//new update routes added
router.post('/update-sensor-threshold', sensorControllers.updateSensorThreshold);

router.post('/service-status', sensorControllers.getServiceStatus);

router.post('/update-sensor-status', sensorControllers.updateServiceStatus);

module.exports = { router };
