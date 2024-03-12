//#region header
const db = require("mongoose");
//#endregion

//#region schema
//edited on 19/06/23
const designationSchema = new db.Schema({
  position: String,
  details: String,
  dataStatus: Boolean,
  departmentId: String,
});

//const designationModel = new db.model("designation", designationSchema);
//#endregion

//#region exports
module.exports = designationSchema;
//#endregion
