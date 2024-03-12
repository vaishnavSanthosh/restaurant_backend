//created on 28-01-21
//#region headers
const db = require("mongoose");
//#endregion

//#region schema
//edited on 02-03-22
//edited on 08-03-22
//edited on 21-03-22 -> removed orderTotal from orderSchema,added customerid
//edited on 22-03-22 -> deprecated discount field,item field name changed
const orderSchema = db.Schema({
  orderId: Number,
  orderType: Number,
  orderDate: Number,
  orderInfo: [{}],
  paymentMethod: [{}],
  totalAmount: Number,
  payableAmount: { type: Number, required: true },
  coupon: String,
  rewardPoints: [],
  discount: Number,
  shipmentCharge: Number,
  branchId: String,
  cus_id: String,
  emp_id: String,
  usedPoints: Number,
  shiftId: Number,
  usedWallet: Number,
  creditCleared: [{}],
  barcode: String,
  qrcode: String,
  status: String,
  returnStatus: String,
  tableNumber: { _id: String, seatings: [] },
});

//added on 06-05-22
const orderReturnSchema = db.Schema({
  transNo: { type: Number, required: true },
  returnType: { type: Number, required: true },
  customerId: { type: String, required: true },
  invoiceNo: { type: String, required: true },
  returnDate: { type: Number, required: true },
  purchasePk: { type: String, required: true },
  returnInfo: [{}],
  branchId: { type: String, required: true },
  shiftId: { type: Number, required: true },
  paymentMethod: {}, //added on 13-06-2022
});
orderReturnSchema.index({ transNo: 1, branchId: 1 }, { unique: true });

//added on 17-05-22
const messSchema = db.Schema({
  transNo: Number,
  customer: String,
  mobileNo: String,
  email: String,
  date: Number,
  packageDetails: {},
  packageTotal: Number, //renamed  on 09-06-22 type field renamed to packageTotal
  paidAmount: Number,
  balanceAmount: Number,
  branchId: String,
});

//added on 18-05-22
const messPackageSchema = db.Schema({
  type: { type: Boolean, required: true },
  package: [{}],
  branchId: { type: String, required: true },
});

//added on 14-07-22
//edited on 16-07-22
const holdOrderSchema = new db.Schema({
  orderId: Number,
  cus_id: String,
  order: [{}],
  branchId: String, //added on  16-07-22-> brid reference added
});

//added on 07-07-2023
const damagedGoodsSchema = new db.Schema({
  transNo: { type: Number, required: true },
  branchId: { type: String, required: true },
  customerId: { type: String, required: true },
  invoiceNo: { type: String, required: true },
  paidAmount: { type: Number, required: true },
  refundAmount: { type: Number, required: true },
  itemid: { type: String, required: true },
  returnId: { type: String, required: true },
  itemInfo: [{}],
});

damagedGoodsSchema.index({ transNo: 1, branchId: 1 }, { unique: true });
//#endregion

//#region exports
module.exports = {
  orderSchema,
  orderReturnSchema,
  messSchema,
  messPackageSchema,
  holdOrderSchema,
  damagedGoodsSchema,
};
//#endregion
