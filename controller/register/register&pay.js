const axios = require("axios");
const RegisterTransaction = require("../../model/register&pay");
const getPaystackKeys = require("../../services/paystackservice");

exports.registerAndPay = (req, res) => {
  res.render("register/register&pay");
};

exports.initRegistration = async (req, res) => {
  try {
    const { secretKey } = await getPaystackKeys();
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const paystackData = {
      email,
      amount: 3000 * 100, // ₦1000 in kobo
      callback_url: `${process.env.BASE_URL}/register/verify`,
      metadata: { email },
    };

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      paystackData,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status) {
      return res.json({ url: response.data.data.authorization_url });
    } else {
      return res.status(400).json({ error: "Payment initialization failed" });
    }
  } catch (error) {
    console.error(
      "🔴 Register payment error:",
      error.response?.data || error.message
    );
    return res.status(500).json({ error: "Failed to initialize payment" });
  }
};

exports.verifyRegistration = async (req, res) => {
  try {
    const { secretKey } = await getPaystackKeys();
    const { reference } = req.query;

    if (!reference) return res.redirect("/register?error=No-reference");

    const exists = await RegisterTransaction.findOne({ reference });
    if (exists) return res.render("register/success");

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );

    const tx = response.data.data;
    if (tx.status !== "success")
      return res.redirect("/register?error=payment-failed");

    await RegisterTransaction.create({
      email: tx.metadata.email,
      reference: tx.reference,
      amount: tx.amount / 100,
      status: "success",
      paidAt: tx.paid_at,
    });

    return res.render("register/success"); // This should trigger WhatsApp popup
  } catch (error) {
    console.error("🔴 Verification failed:", error);
    return res.redirect("/register?error=verify-failed");
  }
};
