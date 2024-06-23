const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
  isLoggedIn,
  redirectIfLogin,
} = require("../middlewares/login-middleware");
const userModel = require("../models/users-model");

router.get("/", redirectIfLogin, function (req, res) {
  let err = req.flash("error");
  res.render("index", { loggedin: false, error: err });
});

router.get("/profile", isLoggedIn, async function (req, res) {
  let byDate = Number(req.query.byDate);
  let { startDate, endDate } = req.query;

  byDate = byDate ? byDate : -1;
  startDate = startDate ? startDate : new Date("1970-01-01");
  endDate = endDate ? endDate : new Date();

  let user = await userModel.findOne({ email: req.user.email }).populate({
    path: "hisaab",
    match: { createdAt: { $gte: startDate, $lte: endDate } },
    options: { sort: { createdAt: byDate } },
  });

  res.render("profile", { user });
});

router.get("/register", redirectIfLogin, function (req, res) {
  let err = req.flash("error");
  res.render("register", { loggedin: false, error: err });
});

router.get("/logout", function (req, res) {
  res.cookie("token", "");
  res.redirect("/");
});


router.post("/register", async function (req, res) {
  try {
    
    let { name, username, email, password } = req.body;

    let user = await userModel.findOne({ email });
    if (user) {
      req.flash("error", "Sorry you already have account, please login.");
      return res.redirect("/register");
    }

    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(password, salt, async function (err, hash) {
        let createduser = await userModel.create({
          email,
          username,
          name,
          password: hash,
        });

        let token = jwt.sign(
          { email, id: createduser._id },
          process.env.JWT_SECRET
        );

        res.cookie("token", token);
        // res.send("user created successfully");
        res.redirect("/profile")
      });
    });
  } catch (err) {
    res.send(err.message);
  }
});

router.post("/login", async function (req, res) {
  try {
    let { email, password } = req.body;

    console.log(email, password);

    let user = await userModel.findOne({ email: email }).select("+password");
    if (!user) {
      req.flash("error", "email or password did not match");
      return res.redirect("/");
    }

    bcrypt.compare(password, user.password, function (err, result) {
      if (result) {
        let token = jwt.sign({ email, id: user._id }, process.env.JWT_SECRET);

        res.cookie("token", token);
        res.redirect("/profile");
      } else {
        req.flash("error", "email or password did not match");
        return res.redirect("/");
      }
    });
  } catch (err) {
    res.send(err.message);
  }
});

module.exports = router;
