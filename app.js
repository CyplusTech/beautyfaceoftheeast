if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const flash = require("connect-flash");
const router = require("./routes/user");
const routerAuth = require("./routes/admin/auth");
const adminRoute = require("./routes/admin/admin");

const AdminSettings = require("./model/admin/adminsettings");

const routerRegister = require("./routes/register/register&pay");

const restrictionGateway = require("./middleware/gatekeeper");

// Initialize Express
const app = express();

// MongoDB Connection with Error Handling
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 30, // 30 minutes
    },
  })
);

// Passport Middleware
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

// Middlewares
app.set("view engine", "ejs");
app.set("view cache", false);
app.use(express.urlencoded({ extended: false }));
// app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(flash());
app.use(cors({ origin: "http://yourfrontend.com", credentials: true }));

app.use(restrictionGateway);

// Middleware to expose flash messages to views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// Middleware for fetching settings and storing in locals
// app.use(async (req, res, next) => {
//   try {
//     const settings = await AdminSettings.findOne();
//     app.locals.settings = settings || {}; // Store in locals
//     next();
//   } catch (error) {
//     console.error("Error fetching settings:", error);
//     next();
//   }
// });

// Routes
app.use("/", router);
app.use("/register", routerRegister)
app.use("/", routerAuth);
app.use("/admin", adminRoute);

// Server Listening
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
