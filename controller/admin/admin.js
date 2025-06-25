const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const {userModel} = require("../../model/userDB");
const Transaction = require("../../model/admin/transactions");
const AdminSettings = require("../../model/admin/adminsettings");

const AdminDB = require("../../model/admin/adminDB");

const upload = require("../../middleware/upload");
const Message = require("../../model/admin/message");
// const voteModel = require("../../model/voteDB");

exports.dashboard = async (req, res) => {
  try {
    // Count total contestants (users with role 'user')
    const totalContestants = await userModel.countDocuments({ role: "user" });

    // Calculate total votes
    const totalVotesAggregation = await userModel.aggregate([
      { $match: { role: "user" } },
      { $group: { _id: null, totalVotes: { $sum: "$votes" } } },
    ]);

    const totalVotesCount =
      totalVotesAggregation.length > 0
        ? totalVotesAggregation[0].totalVotes
        : 0;

    // Calculate total revenue (sum of successful transaction amounts)
    const totalRevenueAggregation = await Transaction.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, revenue: { $sum: "$amount" } } },
    ]);

    const totalRevenue =
      totalRevenueAggregation.length > 0
        ? totalRevenueAggregation[0].revenue
        : 0; // Convert kobo to NGN

    // Fetch all transactions for admin view
    const transactions = await Transaction.find().sort({ paidAt: -1 });
    
    res.render("admin/dashboard", {
      userRole: req.user.role,
      user: req.user,
      totalContestants,
      totalVotesCount,
      totalRevenue,
      transactions,
      page: "dashboard",
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.users = async (req, res) => {
  try {
    const users = await userModel
      .find({
        role: { $nin: ["admin", "superadmin"] },
      })
      .sort({ createdAt: -1 });

    res.render("admin/manage-user", {
      user: req.user,
      users,
      page: "users",
      userRole: req.user.role
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// adding user page
// Show registration form
exports.createContestant = (req, res) => {
  res.render("admin/register", {
    page: "add-constestant",
    url: req.url,
    user: req.user,
    userRole: req.user.role,
  });
};
// Handle form POST

exports.postToRegister = async (req, res) => {
  const { fullName, email, state, phone, gender } = req.body;
  const img = req.file ? "/images/" + req.file.filename : null;

  if (!img || !fullName || !email || !state || !phone || !gender) {
    return res.status(400).send("Please fill in all the fields.");
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    // ✅ Generate serialId as padded count+1 (e.g., "CYPLUS-0010")
    const userCount = await userModel.countDocuments({});
    const serialId = `CYPLUS-${(userCount + 1).toString().padStart(4, "0")}`;

    const newUser = new userModel({
      fullName,
      email,
      phone,
      state,
      gender,
      img,
      serialId, // Store serialId in DB
    });

    await newUser.save();

    res.redirect(`/contestant/${newUser._id}`); // or wherever you want to take them
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).send("Something went wrong. Please try again later.");
  }
};

////manage user
exports.editForm = (req, res) => {
  const { id } = req.params;

  userModel
    .findById(id)
    .then((user) => {
      if (!user) {
        return res.status(404).send("User not found");
      }
      res.render("admin/edit", {
        user,
        url: req.url,
        page: "edit-user",
        userRole: req.user.role,
      }); // Render the edit form
    })
    .catch((err) => {
      console.error("Error fetching user:", err);
      res.status(500).send("Internal Server Error");
    });
};

exports.updateEdit = async (req, res) => {
  try {
    const userId = req.params.id;
    const updatedUserData = req.body;

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).send("User not found");

    if (req.file) {
      const newImagePath = "/images/" + req.file.filename;

      // Delete old image
      if (user.img && user.img.startsWith("/images/")) {
        const oldImagePath = path.join(__dirname, "../../public", user.img);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }

      updatedUserData.img = newImagePath;
    } else {
      updatedUserData.img = user.img;
    }

    await userModel.findByIdAndUpdate(userId, updatedUserData);
    res.redirect("/admin/users");
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userModel.findByIdAndDelete(id);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Failed to delete user.");
  }
};

/////Activities//////
exports.getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Number of transactions per page

    const transactions = await Transaction.find()
      .sort({ paidAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalTransactions = await Transaction.countDocuments();

    res.render("admin/transactions", {
      userRole: req.user.role,
      user: req.user,
      page: "transactions",
      transactions,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Get Admin Settings (API)
exports.settings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();

    if (!settings) {
      settings = await AdminSettings.create({
        siteLogo: process.env.DEFAULT_SITE_LOGO || "/images/model-logo.png",
        siteName: "Default Site Name",
        siteDescription: "This is a default description.",
        minVotesPerPerson: 1,
        maxVotesPerPerson: 1000000000,
        pricePerVote: 100,
        enableVoting: true,
        enableTestMode: true,
        enableWebsite: true,
        paystackLivePublicKey: process.env.PAYSTACK_LIVE_PUBLIC_KEY || "",
        paystackLiveSecretKey: process.env.PAYSTACK_LIVE_SECRET_KEY || "",
        paystackTestPublicKey: process.env.PAYSTACK_TEST_PUBLIC_KEY || "",
        paystackTestSecretKey: process.env.PAYSTACK_TEST_SECRET_KEY || "",
      });
    }

    const paystackPublicKey = settings.enableTestMode
      ? settings.paystackTestPublicKey
      : settings.paystackLivePublicKey;
    const paystackSecretKey = settings.enableTestMode
      ? settings.paystackTestSecretKey
      : settings.paystackLiveSecretKey;

    res.render("admin/settings", {
      user: req.user,
      page: "settings",
      settings,
      userRole: req.user.role,
      paystackPublicKey,
      paystackSecretKey,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    const body = req.body;

    if (!settings) settings = new AdminSettings();

    if (req.file) {
      settings.siteLogo = "/uploads/" + req.file.filename;
    }

    settings.siteName = body.siteName?.trim() || settings.siteName;
    settings.siteDescription =
      body.siteDescription?.trim() || settings.siteDescription;
    settings.pricePerVote =
      parseInt(body.pricePerVote) || settings.pricePerVote;
    settings.maxVotesPerPerson =
      parseInt(body.maxVotesPerPerson) || settings.maxVotesPerPerson;
    settings.minVotesPerPerson =
      parseInt(body.minVotesPerPerson) || settings.minVotesPerPerson;

    settings.enableVoting = body.enableVoting === "on";
    settings.enableWebsite = body.enableWebsite === "on";
    settings.enableTestMode = body.enableTestMode === "on";

    if (settings.enableTestMode) {
      settings.paystackTestPublicKey =
        body.paystackPublicKey?.trim() || settings.paystackTestPublicKey;
      settings.paystackTestSecretKey =
        body.paystackSecretKey?.trim() || settings.paystackTestSecretKey;
    } else {
      settings.paystackLivePublicKey =
        body.paystackPublicKey?.trim() || settings.paystackLivePublicKey;
      settings.paystackLiveSecretKey =
        body.paystackSecretKey?.trim() || settings.paystackLiveSecretKey;
    }

    await settings.save();
    res.status(200).json({ message: "✅ Settings updated successfully!" });
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ message: "❌ Failed to update settings." });
  }
};


// Super Admin Only Route - Only Super Admins can access
exports.manageAdmins = (req, res) => {
  res.render("admin/manageAdmins", { user: req.user });
};


// Fetch all messages for admin
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });

    const user = req.user || null;
    const userRole = user ? user.role : null; // <- Extract role safely

    res.render("admin/messages", {
      messages,
      user,
      userRole, // <- Pass it explicitly
      page: "messages",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching messages" });
  }
};


// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Message deleted!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting message" });
  }
};

/////admin management///////
// List all admins
exports.listAdmins = async (req, res) => {
  const admins = await AdminDB.find().sort({ createdAt: -1 });
  res.render("admin/manage-admins", {
    admins,
    user: req.user,
    page: "admins",
    subPage: "manage",
    userRole: req.user.role,
  });
};

// Show addAdmin form
exports.addAdminForm = (req, res) => {
  res.render("admin/add-admin", {
    user: req.user,
    page: "admins",
    subPage: "add",
    userRole: req.user.role,
  });
};

// Create admin
exports.createAdmin = async (req, res) => {
  const { fullName, email, password, role } = req.body;
  try {
    const existing = await AdminDB.findOne({ email });
    if (existing) {
      req.flash("error_msg", "Admin with this email already exists.");
      return res.redirect("/admin/add-admin");
    }

    const admin = new AdminDB({ fullName, email, password, role });
    await admin.save();
    req.flash("success_msg", "Admin created successfully.");
    res.redirect("/admin/manage-admins");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error creating admin.");
    res.redirect("/admin/add-admin");
  }
};

// Edit form
exports.editAdminForm = async (req, res) => {
  const admin = await AdminDB.findById(req.params.id);
  if (!admin) return res.redirect("/admin/manage-admins");
  res.render("admin/edit-admin", { admin, user: req.user, page: "admins" });
};

// Update admin
exports.updateAdmin = async (req, res) => {
  const { fullName, role } = req.body;
  try {
    await AdminDB.findByIdAndUpdate(req.params.id, { fullName, role });
    req.flash("success_msg", "Admin updated successfully.");
    res.redirect("/admin/manage-admins");
  } catch (err) {
    req.flash("error_msg", "Error updating admin.");
    res.redirect("/admin/edit-admin/" + req.params.id);
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    await AdminDB.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "Admin deleted.");
    res.redirect("/admin/manage-admins");
  } catch (err) {
    req.flash("error_msg", "Failed to delete admin.");
    res.redirect("/admin/admins");
  }
};