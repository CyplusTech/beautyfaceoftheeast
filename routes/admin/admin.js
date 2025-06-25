const { isAdmin, isSuperAdmin } = require("../../middleware/authMware");
// const upload = require("../../middleware/upload");
const admincontroller = require("../../controller/admin/admin");

const express = require("express");
const router = express.Router();

const multer = require("multer");
const upload = multer({ dest: "public/images" });




// Multer config for logo upload
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/uploads/");
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = Date.now() + "-" + file.originalname;
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({ storage });

// Dashboard Route
router.get("/", isAdmin, admincontroller.dashboard);

// User Management Routes
router.get("/users", isAdmin, admincontroller.users);

router.get("/users/edit/:id", isAdmin, admincontroller.editForm);

router.post("/users/edit/:id", isAdmin, upload.single("img"), admincontroller.updateEdit);

router.delete("/users/delete/:id", isAdmin, admincontroller.deleteUser);

// Transaction Routes
router.get("/transactions", isAdmin, admincontroller.getTransactions);

// messages Routes
router.get("/messages", isAdmin, admincontroller.getMessages);

router.delete("/message/delete/:id", isAdmin, admincontroller.deleteMessage);

// // Super Admin Route (if needed)
// router.get("/manage-admins", isSuperAdmin, admincontroller.manageAdmins);

// Contestant Routes
router.get("/create-contestant", isAdmin, admincontroller.createContestant);

// POST form with file
router.post("/register", upload.single("img"), admincontroller.postToRegister);

// Settings Routes
router.get("/settings", isAdmin, admincontroller.settings);

// POST to update settings
// router.post("/settings", upload.single("siteLogo"), admincontroller.updateSettings);

router.post("/settings", isAdmin, upload.single("siteLogo"), admincontroller.updateSettings);

//////Admin Management////
router.get("/manage-admins", isSuperAdmin, admincontroller.listAdmins);

router.get("/add-admin", isSuperAdmin, admincontroller.addAdminForm);

router.post("/add-admin", isSuperAdmin, admincontroller.createAdmin);

router.get("/edit-admin/:id", isSuperAdmin, admincontroller.editAdminForm);

router.post("/edit-admin/:id", isSuperAdmin, admincontroller.updateAdmin);

router.get("/delete-admin/:id", isSuperAdmin, admincontroller.deleteAdmin);



module.exports = router;
