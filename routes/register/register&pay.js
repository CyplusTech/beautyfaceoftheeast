const express = require("express");
const router = express.Router();
const controller = require("../../controller/register/register&pay");

router.get("/", controller.registerAndPay);
router.post("/pay", controller.initRegistration);
router.get("/verify", controller.verifyRegistration);

module.exports = router;
