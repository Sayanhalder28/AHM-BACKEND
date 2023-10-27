const express = require("express");
const router = express.Router();

const assetControllers = require("../controllers/assetControllers");

router.post("/register-asset", assetControllers.registerAsset);

router.get("/asset-list", assetControllers.getAssetList);

router.get("/Diagnose", assetControllers.diagnoseAsset);



module.exports = { router };
