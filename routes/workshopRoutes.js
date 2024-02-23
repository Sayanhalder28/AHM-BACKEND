const express = require("express");
const router = express.Router();

const workshopControllers = require("../controllers/workshopControllers");

router.post("/register-workshop", workshopControllers.registerWorkshop);

router.get("/workshop-list", workshopControllers.WorkshopList);

module.exports = { router };