///////database ///////

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  img: String,
  fullName: String,
  email: { type: String, unique: false },
  phone: String,
  gender: { type: String, enum: ["Male", "Female"] },
  state: String,
  role: { type: String, default: "user" },
  votes: { type: Number, default: 0 },
  serialId: String, // 👈 add this line
  createdAt: { type: Date, default: Date.now },
});

const userModel = mongoose.model("User", userSchema);

const getUsers = (cb) => {
  userModel.find({ role: "user" }).then((users) => {
    if (users) return cb(users);
    return cb([]);
  });
};

const findOneById = (id, cb) => {
  userModel.findById(id).then((user) => {
    if (user) return cb(user);
    return cb([]);
  });
};

// 👇 Export everything together
module.exports = {
  userModel,
  getUsers,
  findOneById,
};







// db.users.insertOne({
//   firstName: "SuperAdmin",
//   email: "superadmincyplus@gmail.com",
//   password: "$2a$10$UR5dun0s17IiRTlFgMpYHO/2x2QNaqn8MYURN2rRM9xqQMWvPJc0O",
//   role: "user",
//   gender: "Male",
//   state: "Abia"
// });

// const bcrypt = require("bcryptjs");

// bcrypt.hash("superadmincyplus@gmail.com", 10, (err, hash) => {
//   if (err) throw err;
//   console.log("Hashed Password:", hash);
// });
// const bcrypt = require("bcryptjs");

// const hashedPassword =
//   "$2a$10$A1izgAjDYsfxNpMnQN7eoew/QpN1LUyw89s9iMfoCfVmkOXAGikSG";
// const enteredPassword = "superadmincyplus@gmail.com";

// bcrypt.compare(enteredPassword, hashedPassword, (err, result) => {
//   if (err) throw err;
//   console.log("Password Match:", result);
// });






// const bcrypt = require("bcryptjs");
// bcrypt.hashSync("admincyplus@gmail.com", 10);


// db.admins.insertOne({
//   fullName: "Super Admin",
//   email: "superadmincyplus@gmail.com",
//   password: "$2b$10$OYAx2wJgqIMOSPXMSYByauSl/NzumNhRbyUuBZVkuOjDDyk66f3Jq",
//   phone: "08000000000",
//   gender: "Male",
//   state: "Abuja",
//   role: "superadmin",
//   createdAt: new Date(),
// });

// db.admins.insertOne({
//   fullName: "Admin",
//   email: "admincyplus@gmail.com",
//   password: "$2b$10$yh7StImQqoqLl5Xz.OJyCOZ4AbcMcFv0agOvC0ME37yBzGEyKzCWe",
//   phone: "08000000000",
//   gender: "Male",
//   state: "Abuja",
//   role: "admin",
//   createdAt: new Date(),
// });

