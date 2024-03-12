//#region headers
const db = require("mongoose");
//#endregion

//#region schema
const supplierSchema = new db.Schema({
  supplierName: { type: String, required: true },
  emailAddress: { type: String, required: true },
  creditLimit: { type: String, required: true },
  country: { type: String, required: true },
  stateCode: { type: String, required: true },
  address: { type: String, required: true },
  mobile: { type: String, required: true },
  currency: { type: String, required: true },
  gstIn: { type: String, required: true },
  state: { type: String, required: true },
  openingBalance: { type: Number, required: true },
  bankName: { type: String, required: true },
  accountNo: { type: String, required: true },
  ifscCode: { type: String, required: true },
  status: { type: Boolean, required: true },
  spId: { type: Number, required: true },
});

//#endregion

//#region exports
module.exports = supplierSchema;
//#endregion
