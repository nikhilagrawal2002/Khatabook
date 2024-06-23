const mongoose = require("mongoose");
const dbgr = require("debug")("development:mongoose");

mongoose
  .connect("mongodb://127.0.0.1:27017/khaatabookn18")
  .then(function () {
    dbgr("connected to Mongo");
  })
  .catch(function (err) {
    dbgr(err);
  });

let db = mongoose.connection;

module.exports = db;
