const controller = require("../../controller/admin/auth");
const { preventLoginAccessIfAuthenticated } = require("../../middleware/authMware");

const express = require("express");
const router = express.Router();

router.get("/admin/login", preventLoginAccessIfAuthenticated, controller.loginPage);

router.post("/admin/login", controller.postToLogin);

router.get("/logout", controller.logout);


module.exports = router;