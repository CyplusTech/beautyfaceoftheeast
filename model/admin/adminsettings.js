const mongoose = require("mongoose");

const AdminSettingsSchema = new mongoose.Schema({
  siteLogo: String,
  siteName: { type: String, required: true },
  siteDescription: String,
  minVotesPerPerson: { type: Number, default: 1 },
  maxVotesPerPerson: { type: Number, required: true },
  pricePerVote: { type: Number, required: true },
  enableVoting: { type: Boolean, default: false },
  enableTestMode: { type: Boolean, default: false }, // add this to store test mode status
  enableWebsite: { type: Boolean, default: false },

  // Live Keys (from .env, but can store for fallback)
  paystackLivePublicKey: { type: String },
  paystackLiveSecretKey: { type: String },

  // Test Keys (to be saved in DB)
  paystackTestPublicKey: { type: String },
  paystackTestSecretKey: { type: String },
});

const AdminSettings = mongoose.model("AdminSettings", AdminSettingsSchema);

module.exports = AdminSettings;
