const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/login-middleware");
const HisaabModel = require("../models/hisaab-model");
const UserModel = require("../models/users-model");

router.get("/", function (req, res) {
  res.send("hisaab index route");
});

router.get("/create", function (req, res) {
  res.render("create");
});

router.post("/create", isLoggedIn, async function (req, res) {
  let { title, description, encrypted, shareable, passcode, editpermissions } =
    req.body;

  encrypted = encrypted === "on" ? true : false;
  editpermissions = editpermissions === "on" ? true : false;
  shareable = shareable === "on" ? true : false;

  let hisaab = await HisaabModel.create({
    title: title,
    description: description,
    user: req.user.id,
    encrypted: encrypted,
    shareable: shareable,
    passcode: passcode,
    editpermissions: editpermissions,
  });

  let user = await UserModel.findOne({ email: req.user.email });
  user.hisaab.push(hisaab._id);

  await user.save();

  // res.send(hisaab);
  res.redirect("/profile")
});

router.get("/view/:id", async function (req, res) {
  let hisaab = await HisaabModel.findOne({ _id: req.params.id });
  if (hisaab.encrypted) {
    res.render("passcode", { hisaabid: req.params.id });
  } else {
    res.render("hisaab", { hisaab });
  }
});

router.post("/:id/verify", async function (req, res) {
  let hisaab = await HisaabModel.findOne({ _id: req.params.id });
  if (hisaab.passcode === req.body.passcode) {
    req.session.hisaabaccess = req.params.id;
    res.redirect(`/hisaab/${req.params.id}`);
  } else {
    res.send("wrong passcode");
  }
});

router.get("/:id", isLoggedIn, checkHisaabAccess, async function (req, res) {
  let hisaab = await HisaabModel.findOne({ _id: req.params.id });
  res.render("hisaab", { hisaab });
});

router.get("/delete/:id", isLoggedIn, async function (req, res) {
  let hisaab = await HisaabModel.findOne({ _id: req.params.id });
  if (hisaab.user.toString() === req.user.id) {
    res.send("access hai");
  } else {
    res.send("access denied");
  }
});

function checkHisaabAccess(req, res, next) {
  if (req.session.hisaabaccess === req.params.id) {
    next();
  } else {
    res.redirect(`/hisaab/view/${req.params.id}`);
  }
}

module.exports = router;
