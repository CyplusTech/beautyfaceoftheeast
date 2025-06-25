const mongoose = require("mongoose");

const registerTransactionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  reference: { type: String, unique: true, required: true },
  amount: Number,
  status: String,
  paidAt: String,
});

module.exports = mongoose.model("RegisterTransaction", registerTransactionSchema);
