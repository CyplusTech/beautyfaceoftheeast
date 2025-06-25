const axios = require("axios");
const nodemailer = require("nodemailer");

const { getUsers, findOneById, userModel } = require("../model/userDB");
const voteModel = require("../model/voteDB");
const Transaction = require("../model/admin/transactions");
const getPaystackKeys = require("../services/paystackservice");
const Contact = require("../model/admin/message");

// Pages
exports.homePage = async (req, res) => {
  try {
    const user = req.user || null;

    // Only fetch a limited number of users for homepage display (e.g., top 6)
    const userDB = await userModel.find({ role: "user" }).limit(6);
    
    res.render("home", {
      title: "home",
      url: req.url,
      user,
      userDB,
      isHomePage: true,
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};


exports.galleryPage = (req, res) => {
  res.render("gallery", {
    title: "gallery",
    url: req.url,
    user: req.user || null,
  });
};

exports.aboutPage = (req, res) => {
  res.render("about", {
    title: "about",
    bannerTitle: "About",
    url: req.url,
    user: req.user || null,
  });
};

exports.contactPage = (req, res) => {
  res.render("contact", {
    title: "contact us",
    bannerTitle: "Contact Us",
    url: req.url,
    user: req.user || null,
  });
};

exports.contestantPage = async (req, res) => {
  try {
    const user = req.user || null;

    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 12; // Number of contestants per page
    const skip = (page - 1) * limit;

    const totalUsers = await userModel.countDocuments({ role: "user" });
    const totalPages = Math.ceil(totalUsers / limit);

    const paginatedUsers = await userModel
      .find({ role: "user" })
      .skip(skip)
      .limit(limit);

    res.render("contestant", {
      title: "contestant",
      bannerTitle: "Contestant",
      url: req.url,
      user,
      userDB: paginatedUsers,
      currentPage: page,
      totalPages,
      isHomePage: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};


exports.singlePage = async (req, res) => {
  const id = req.params.id;
  const userDB = await userModel.find({ role: "user" });

  findOneById(id, (user) => {
    if (user) {
      res.render("singlePage", {
        title: "Contestants | single",
        url: req.url,
        user: req.user,
        contestant: user,
        userDB,
        votingEndDateISO: new Date("2025-05-31T23:59:59").toISOString(), // 👈 Corrected name and converted to ISO
      });
    }
  });
};



// Payment Initialization
exports.payPage = async (req, res) => {
  try {
    const { secretKey } = await getPaystackKeys();
    const { contestantId, votes, amount, voterEmail, voterName } = req.body;

    if (!contestantId || !votes || !amount || !voterEmail || !voterName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const contestant = await userModel.findById(contestantId);
    if (!contestant)
      return res.status(404).json({ message: "Contestant not found" });

    const paystackData = {
      email: voterEmail,
      amount: amount,
      callback_url: `${process.env.BASE_URL}/verify`,
      metadata: {
        contestantId,
        voterEmail,
        voterName,
        votes,
      },
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
      return res.json({
        authorization_url: response.data.data.authorization_url,
      });
    } else {
      return res.status(400).json({ error: "Payment initialization failed" });
    }
    
  } catch (error) {
    console.error(
      "🔴 Payment initialization error:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({
        error: "Payment initialization failed",
        details: error.response?.data,
      });
  }
};

// Payment Verification
exports.verifyVote = async (req, res) => {
  try {
    const { secretKey } = await getPaystackKeys();
    const { reference } = req.query;

    if (!reference) return res.redirect("/payment-failed?reason=no-reference");

    const existing = await Transaction.findOne({ reference });
    if (existing) return res.redirect(`/payment-success?ref=${reference}`);

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );

    if (response.data.data.status === "success") {
      const transaction = response.data.data;
      const { contestantId, voterEmail, voterName } = transaction.metadata;

      const amountInNaira = transaction.amount / 100;
      const votes = amountInNaira / 100;

      const contestant = await userModel.findById(contestantId);
      if (!contestant) return res.redirect(`/payment-failed?ref=${reference}`);

      contestant.votes += votes;
      await contestant.save();

      await voteModel.create({
        contestantId,
        voterEmail,
        name: voterName,
        votes,
        paymentStatus: "success",
      });

      await Transaction.create({
        reference,
        voterEmail,
        contestantId,
        amount: amountInNaira,
        status: "success",
        votes,
        paidAt: transaction.paid_at,
      });

      return res.redirect(`/payment-success?ref=${reference}`);
    } else {
      return res.redirect(`/payment-failed?ref=${reference}`);
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.redirect(`/payment-failed?ref=${req.query.reference}`);
  }
};

// Show Success Page
exports.successfulPage = async (req, res) => {
  try {
    const reference = req.query.ref || req.query.reference;
    if (!reference) return res.redirect("/contestant");

    const transaction = await Transaction.findOne({ reference }).populate(
      "contestantId",
      "fullName"
    );
    if (!transaction) {
      console.log("🔴 Transaction not found!");
      return res.render("failed", { title: "Payment Failed", user: req.user });
    }

    return res.render("success", {
      title: "Payment Successful",
      user: req.user,
      transaction,
    });
  } catch (error) {
    console.error("🔴 Error loading success page:", error.message);
    return res.render("failed", { title: "Payment Error", user: req.user });
  }
};

// Contact Form
exports.createMessage = async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const contact = new Contact({ name, email, message });
    await contact.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <h2 style="color: #333;">New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f0f0f0; padding: 15px; border-left: 4px solid #007BFF; border-radius: 4px; white-space: pre-line;">
            ${message}
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Pageant Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFY_EMAIL,
      subject: "New Contact Message",
      html: emailHTML,
    });

    res.send(`
      <script>
        alert("Thank you! Your message has been sent.");
        window.location.href = "/";
      </script>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
};
