// middleware/authMiddleware.js

exports.isAdmin = (req, res, next) => {
  if (
    req.isAuthenticated() &&
    (req.user.role === "admin" || req.user.role === "superadmin")
  ) {
    return next();
  }
  res.redirect("/admin/login");
};

exports.isSuperAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "superadmin") {
    return next();
  }
  res.redirect("/admin/login");
};


// 🔐 Prevent already logged-in users from accessing /admin/login
module.exports.preventLoginAccessIfAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/admin"); // Already logged in
  }
  next(); // Allow access if not logged in
};
