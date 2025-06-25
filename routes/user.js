const controller = require("../controller/user");

// const { isAuthenticated } = require("../controller/authenticate/auth");

const express = require("express");
const router = express.Router();

router.get("/", controller.homePage);

router.get("/gallery", controller.galleryPage);

router.get("/about", controller.aboutPage);

router.get("/contact", controller.contactPage);

router.post("/submit-contact", controller.createMessage);

router.get("/contestants", controller.contestantPage);

router.get("/contestant/single/:id", controller.singlePage);

router.post("/pay", controller.payPage);

router.get("/verify", controller.verifyVote);

router.get("/payment-success", controller.successfulPage);

module.exports = router;
