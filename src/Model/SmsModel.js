//created on 09-04-22
//#region header
const db = require("mongoose");
//#endregion

//#region schema
const smsSchema = new db.Schema(
  {
    contactNumber: String,
    otp: String,
    expireAt: {
      type: Date,
      default: Date.now,
      index: {
        expires: 120,
      },
    },
  },

);

//#endregion

//#region export
module.exports = smsSchema;
//#endregion
