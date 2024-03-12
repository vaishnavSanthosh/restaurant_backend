//#region headers
const db = require("mongoose");
//#endregion

//#region schema
const fd_availableSchema = new db.Schema({
  fd_name: String,
  available_day: [String],
  frm_time: Number,
  to_time: Number,
  active: Boolean,
  branchId: String, //edited  on 07-04-22
});

//#endregion

//#region exports
module.exports = fd_availableSchema;
//#endregion
