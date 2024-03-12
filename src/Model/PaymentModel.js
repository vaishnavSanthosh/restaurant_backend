//created on 30-04-22
//#region headers
const db = require("mongoose");
//#endregion

//#region schema
//created on 30-04-22
const creditSchema = new db.Schema({
  purchaseId: String,
  purchasePk: String,
  supplierId: String,
  purchaseDate: Number,
  netAmount: Number,
  discount: Number,
  lastPaidDate: Number,
  paidAmount: Number,
  returnAmount: Number,
  balance: Number,
  status: String,
  isPurchase: Boolean,
  branchId: String,
});

// added on 29-08-22
const walletSchema = new db.Schema({
  cus_id: String,
  amount: Number,
  purchasePk: String, //added on 15-02-23
});

// added on 29-08-22
const walletLogSchema = new db.Schema({
  cus_id: { type: String, required: true },
  date: { type: Number, required: true },
  amount: { type: Number, required: true },
  invoiceNo: { type: String, required: true }, //added on 21-10-22
  branchId: { type: String, required: true }, //added on 08-12-22
  purchasePk: { type: String, required: true }, //added on 15-02-23
});

//created on 30-04-22
//edited on 21/06/23
const paymentSchema = new db.Schema({
  invoiceNo: String,
  cus_id: String,
  date: Number,
  paymentMethod: [{}],
  totalAmount: Number,
  branchId: String,
  purchasePk: String, //added on 26-11-22
  returnLog: [], //added on 11-03-23
  editPaymentLog: [], //added on 04-04-23
});

//added on 10-10-23
const returnPaymentSchema = new db.Schema({
  invoiceNo: { type: String, required: true },
  cus_id: { type: String, required: true },
  date: { type: Number, required: true },
  paymentMethod: {},
  totalAmount: { type: Number, required: true },
  branchId: { type: String, required: true },
  purchasePk: { type: String, required: true }, //added on 14-02-23
});
//#endregion

//#region exports
module.exports = {
  creditSchema,
  walletSchema,
  paymentSchema,
  walletLogSchema,
  returnPaymentSchema,
};
//#endregion
