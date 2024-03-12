//created on 05-04-22
//#region headers
const db = require("mongoose");
//#endregion

//#region schemas
//edited on 15/06/23
const locationSchema = db.Schema({
  country: String,
  locationName: String,
  status: Boolean,
});

//added on 06-04-22
//edited on 15/06/23
const branchSchema = db.Schema({
  locationId: String,
  status: Boolean,
  contactPerson: String,
  nameOfStore: String,
  transNo: {
    type: Number,
    unique: true,
  },
  storeCode: String,
  branchName: String,
  categories: {},
  address: String,
  nativeAddress: String,
  nativenameOfStore: String,
  contactNumber: String,
  logo: String,
  isCode: Boolean,
  /* ends here */
});

//#endregion

//#region exports
module.exports = { locationSchema, branchSchema }; //edited on 06-04-22 added branchModel export
//#endregion
