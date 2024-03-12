//#region header
const db = require("mongoose");
//#endregion

//#region schema
//edited on 04-03-22
const departmentSchema = new db.Schema({
  departmentName: String,
  // branchId: String, //edited  on 07-04-22
  dataStatus: Boolean, //added on 04-03-22
});
//const departmentModel = new db.model("department", departmentSchema);
// #endregion

//#region exports
module.exports = departmentSchema;
//#endregion
