const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true }, // Paystack reference
    amount: { type: Number, required: true }, // Amount in kobo (Paystack default)
    currency: { type: String, default: "NGN" }, // Currency (default NGN)
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    }, // Payment status
    votes: { type: Number, required: true }, // Number of votes bought
    contestantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming contestants are stored in User model
      required: true,
    }, // ID of the contestant receiving votes
    voterEmail: { type: String, required: true }, // Email of the voter
    transactionDate: { type: Date, default: Date.now }, // Transaction timestamp
    paymentChannel: { type: String }, // Card, bank, USSD, etc.
    authorization: {
      authorization_code: String,
      last4: String,
      exp_month: String,
      exp_year: String,
      card_type: String,
      bank: String,
      country_code: String,
      reusable: Boolean,
    }, // Card details (optional, but useful for fraud prevention)
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt
);

module.exports = mongoose.model("Transaction", transactionSchema);
