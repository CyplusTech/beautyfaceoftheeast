const AdminSettings = require("../model/admin/adminsettings");

// middleware/restrictUntilVotingStarts.js
module.exports = async (req, res, next) => {
  try {
    // Always allow /register route
    if (req.path.startsWith("/register")) return next();
    if (req.path.startsWith("/admin")) return next();

    const settings = await AdminSettings.findOne();

    if (!settings) {
      // If no settings found, block access except /register
      return res.status(404).render("404", {
        message: "Site is currently unavailable. Please check back later.",
      });
    }

    // Block if website not enabled
    if (!settings.enableWebsite) {
      return res.status(404).render("404", {
        message: "Site is currently offline. Please check back later.",
      });
    }

    // Optionally, block if voting is not enabled (you can choose to add or remove this)
    if (!settings.enableVoting) {
      return res.status(404).render("404", {
        message: "Voting has not started yet. Please check back later.",
      });
    }

    // If all is good, continue to next middleware / route
    next();
  } catch (error) {
    console.error("Error in site access middleware:", error);
    res.status(500).render("404", {
      message: "Unexpected error. Please try again later.",
    });
  }
};
