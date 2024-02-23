const express = require("express");
const router = express.Router();

//import controllers
const userControllers = require("../controllers/userControllers");

router.get("/user-data", userControllers.getUsersData);
router.post("/sign-up", userControllers.signUp);
router.post("/sign-in", userControllers.signIn);

module.exports = {router};
