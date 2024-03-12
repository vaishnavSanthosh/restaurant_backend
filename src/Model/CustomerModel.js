//#region header
const mongoose = require("mongoose");
//#endregion

//#region schema Model
//added on 14/4/2022
const customerSchema = mongoose.Schema({
  cusId: Number,
  name: String,
  mobileNo: String,
  buildingName: String,
  streetName: String,
  landMark: String,
  email: String,
  refferedBy: String,
  gst: String,
  status: Boolean,
  points: Number, //added on 21-09-22
  branchId: String, //added on 12-09-22
  relId: String, //added on 29-12-22
  alternateNumber: String, //added on 09-01-23
});

//const customerModel = mongoose.model("customerModel", customerSchema);

const relationshipSchema = mongoose.Schema({
  relationId: Number,
  name: String,
  mobileNo: String,
  buildingName: String,
  streetName: String,
  landMark: String,
  email: String,
  reference: String,
  refferedBy: String, //added on 06-10-22 -> new field
  relType: String,
  /* doAdd: Number,*/
  branchId: String, //added on 14-11-22
  dataStatus: Boolean,
});

//const relationshipModel = mongoose.model("relationshipModel", relationshipSchema);

//#endregion

//#region exports
module.exports = { customerSchema, relationshipSchema };
//endregion
