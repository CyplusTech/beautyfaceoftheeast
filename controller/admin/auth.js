const passport = require("passport");

//////////login page////////////
exports.loginPage = (req, res) => {
  res.render("authenticate/login", { title: "registeration", url: req.url, user: req.user });
};

exports.postToLogin = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.log("Passport error:", err);
      return next(err);
    }

    if (!user) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/admin/login");
    }

    req.logIn(user, (err) => {
      if (err) {
        console.log("Login error:", err);
        return next(err);
      }

      let redirectTo = req.session.returnTo || "/";
      delete req.session.returnTo;

      if (user.role === "admin" || user.role === "superadmin") {
        redirectTo = "/admin";
      }

      req.flash("success_msg", "Login successful!");
      return res.redirect(redirectTo);
    });
  })(req, res, next);
};


//////////logout////////////
exports.logout = (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
     req.session.destroy(() => {
       res.redirect("/admin/login");
     });
  });
};














// //////////profile page////////////
// exports.profile = (req, res) => {
//   res.render("user/profile", { title: "registeration", url: req.url, user: req.user });
// };


// exports.contestantPage = (req, res) => {
//  getUsers(data => {
//    res.render("user/contestant", { 
//     title: "contestant", 
//     url: req.url,  
//     user: req.user, 
//     userEjs: data || null });
//  })
// }

// exports.singlePage = (req, res) => {
//   const id = req.params.id;
//   findOneById(id, (user) => {
//     if(user) {
//         res.render("user/singlePage", {
//           title: "Contestants | single",
//           url: req.url,
//           user: req.user,
//           userEjs: user || null,
//         });
//     }
//   }) 
// }

// exports.votePage = (req, res) => {
//   const id = req.params.id;
//     findOneById(id, (user) => {
//       if (user) {
//         res.render("user/payment", {
//           title: "Contestants | payment",
//           url: req.url,
//           user: req.user,
//           userEjs: user || null,
//           contestantId: user._id,
//         });
//       }
//     }); 
// }


// exports.payPage = async (req, res) => {
//   try {
//     const { contestantId, voterEmail, name } = req.body;

//     if (!contestantId || !voterEmail || !name) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     ////////validate contestant//////
//     const constenst = await userModel.findById(contestantId);
//     if (!constenst)
//       return res.status(404).json({ message: "Contestant not found" });

//     /////////////set up payment details///////

//     const votePrice = 100; // NGN per vote
//     const minVotes = 5;
//     const totalAmount = votePrice * minVotes * 100;

//     ////////initialize payment///////

//     const response = await axios.post(
//       "https://api.paystack.co/transaction/initialize",
//       {
//         email: voterEmail,
//         amount: totalAmount,
//         callback_url: `${process.env.BASE_URL}/vote/verify`,
//         metadata: { contestantId, voterEmail, name, votes: minVotes },
//       },
//       {
//         headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
//       }
//     );

//     ////////Redirect to paystack payment page /////
//     res.json({ url: response.data.data.authorization_url });
//   } catch (error) {
//     console.error("Paystack Initialization Error:", error.response?.data || error);
//     res.status(500).json({error: "payment initialization failed"})
//   }
// }

// ////////payment verification route//////
// exports.verifyVote = async (req, res) => {
//   try {
//   const {reference} = req.query;

//   console.log("Verifying transaction for reference:", String(reference));

//    if (!reference) return res.status(400).json({ error: "Invalid reference" });

//   ////////////verify payment with paystack////////

//     const response = await axios.get(
//       `https://api.paystack.co/transaction/verify/${reference}`,
//       {
//         headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
//       }
//     );

//     const { status, metadata, customer } = response.data.data;
//     if(status !== "success") return res.status(400).json({error: "payment failed"});

//     ////////Record vote and // Save Vote to Databa///////
//     const vote = new voteModel({
//       contestantId: metadata.contestantId, 
//       voterEmail: customer.email
//     });

//     await vote.save("/vote/verify/success");

//     //////increment contestant vote count/////

//     await userModel.findByIdAndUpdate(metadata.contestantId, { $inc: { votes: Number(metadata.votes) }  });

//     //  res.json({ message: "Payment successful and vote recorded" });
//      res.redirect("");

//   } catch (error) {
//     console.error("Paystack Verification Error:", error.response?.data || error);
//     res.status(500).json({error: "Verification failed"})
//   }
// }

// //////////sucessful page////////////
// exports.successfulPage = (req, res) => {
//   res.render("user/profile", { title: "registeration", url: req.url, user: req.user });
// };

