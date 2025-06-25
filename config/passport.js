const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const Admin = require("../model/admin/adminDB");

module.exports = function (passport) {
  // Define the Local Strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email" }, // Use "email" instead of "username"
      async (email, password, done) => {
        try {
          // Find user by email
          const user = await Admin.findOne({ email });
          
          if (!user) {
            return done(null, false, {
              message: "No user found with that email",
            });
          }

          // Match password
          const isMatched = await bcrypt.compare(password, user.password);
          if (!isMatched) {
            return done(null, false, { message: "Incorrect password" });
          }

          return done(null, user);
        } catch (err) {
          console.error(err);
          return done(err);
        }
      }
    )
  );

  // Serialize User
  passport.serializeUser((user, done) => {
    done(null, user.id); // Store the user ID in the session
  });

  // Deserialize User
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await Admin.findById(id);
      done(null, user); // Attach user to `req.user`
    } catch (err) {
      done(err);
    }
  });
};











// const passport = require("passport");
// const bcrypt = require("bcryptjs");
// const LocalStrategy = require("passport-local").Strategy;
// const userModel = require("../model/userDB");

// module.exports = (passport) =>{
//   passport.use(
//     new LocalStrategy ({usernameField: "email"},(email, password, done) =>{

//       userModel.findOne({ email}, function (err, user) {
//         if (err) {
//           return done(err);
//         }
//         if (!user) {
//           return done(null, false);
//         }
//         if (!bcrypt.compare(password, user.password)) {
//           return done(null, false);
//         }
//         return done(null, user);
//       });
//     })
//   );

//    // Serialize User
//     passport.serializeUser((user, done) => {
//       done(null, user.id); // Store the user ID in the session
//     });

//     // Deserialize User
//     passport.deserializeUser(async (id, done) => {
//       try {
//         const user = await userModel.findById(id);
//         done(null, user); // Attach user to `req.user`
//       } catch (err) {
//         done(err);
//       }
//     });

// }
