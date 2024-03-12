//created on 15-03-22
//#region headers
const db = require("mongoose");
//#endregion

//#region schemas
const quotationSchema = new db.Schema({
  quotNo: Number,
  doAdd: Number,
  customerId: String,
  contact: String,
  email: String,
  estDate: Number,
  expDate: Number,
  custAdd: String,
  billAdd: String,
  status: String,
  items: [{}],
  branchId: String,
  dataStatus: Boolean,
  total: Number,
  tax: Number,
  discount: Number,
  grandTotal: Number,
});

//#endregion

//#region exports
module.exports = quotationSchema;
//#endregion
