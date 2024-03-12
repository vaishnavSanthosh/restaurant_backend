//file created on 25-01-22
//#region headers
const db = require("mongoose");
//#endregion

//#region schema
//edited on 11-04-22
const purchaseSchema = new db.Schema({
  purchaseID: { type: Number, required: true },
  invoiceNo: String,
  supplierId: { type: String, required: true },
  payTerms: Number,
  purchaseDate: { type: Number, required: true },
  expiryDate: Number,
  location: { type: String, required: true },
  remarks: String,
  purchaseInfo: [{}],
  grandTotal: { type: Number, required: true },
  shiftId: { type: Number, required: true },
  branchId: { type: String, required: true },
});
purchaseSchema.index({ purchaseID: 1, branchId: 1 }, { unique: true });

//added on 07-04-22
//edited on 08-04-22
const purchasewopoSchema = new db.Schema({
  transNo: Number,
  saleInvNo: String,
  branchId: String, //edited  on 08-04-22 number to string
  invoiceDate: Number,
  supplierId: String,
  recievedBy: String,
  remarks: String,
  purchaseInfo: [{}],
  percentage: Number,
  amount: Number,
  netAmount: Number,
  shiftId: Number, //added on 06-06-22 -> shift id f.k reference
  discount: Number,
});
purchasewopoSchema.index({ transNo: 1, branchId: 1 }, { unique: true });

//added on 11-04-22
const grnSchema = new db.Schema({
  transNo: { type: Number, required: true },
  invoiceNo: { type: String, required: true },
  purchase_id: { type: String, required: true },
  supplierId: { type: String, required: true },
  date: { type: Number, required: true },
  branchId: { type: String, required: true },
  purchaseInfo: [{}],
  shiftId: { type: Number, required: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true },
  location: { type: String, required: true },
});

grnSchema.index({ transNo: 1, branchId: 1 }, { unique: true });

//added on 12-04-22
//edited on 17-05-22
const transferSchema = new db.Schema({
  transNo: Number,
  fromLoc: String,
  toLoc: String,
  transferDate: Number,
  remarks: String,
  margin: Number,
  marginType: Number,
  transferItems: [
    {
      itemId: String,
      itemName: String,
      itemType: Number,
      dimension: String,
      transferQty: Number,
      receivedQty: Number,
      unitCost: Number,
      unit: String,
      spMargin: Number,
      status: String,
    },
  ],
  status: String,
  shiftId: Number, //added on 06-06-22 -> shift id f.k reference
});

//added on 06-05-2022
//edited on 17-05-2022-> added new type field
const stockAdjustmentSchema = db.Schema({
  transNo: Number,
  fromLoc: String,
  toLoc: String,
  date: Number,
  remarks: String,
  isSameLoc: Boolean,
  glLinkCode: {},
  glCode: {},
  slCode: {},
  ccCode: {},
  isNegative: Boolean, //added on 12-09-22
  purchaseInfo: [
    {
      itemId: String,
      itemType: Number,
      itemName: String,
      shareQty: Number, //added on 12-09-22
      adjQty: Number,
      unit: String,
      unitCost: Number,
      totalCost: Number,
      status: String, //added on 12-09-22,
      dimension: String, //added on 12-09-22,
      isNegative: Boolean, //added on 12-09-22
    },
  ],
  branchId: String, //added on 12-09-22
  status: String,
});

stockAdjustmentSchema.index({ transNo: 1, branchId: 1 }, { unique: true });

//added on 11-05-2022
const stockAdjustmentTempSchema = new db.Schema({
  stAdjId: String,
  fromLoc: String,
  toLoc: String,
  date: Number,
  items: [{}],
  remarks: String,
  status: String,
  shiftId: Number, //added on 06-06-22 -> shift id f.k reference
  branchId: String, //added on 05-08-22 -> added branchid
});

// 06-06-2023
const paymentVoucherSchema = new db.Schema({
  transNo: Number,
  wpoId: String,
  branchId: String,
  supplierId: String,
  lastPaidAmount: Number,
  lastPaidDate: Number,
  paymentMethod: {},
  status: String,
  date: Number,
  purchasePk: String,
  purchaseReturnId: String,
});

paymentVoucherSchema.index({ transNo: 1, branchId: 1 }, { unique: true });

//added on 21-06-23
const creditLimitSchema = new db.Schema({
  enterAmount: Number,
  enterDays: Number,
});

//added on 24-07-23
const purchaseReturnSchema = db.Schema({
  transNo: Number,
  invoiceNo: String,
  supplierId: String,
  returnInfo: [
    {
      itemInfo: String, //added on 05-09-22-> added new field
      itemCode: String, //renamed field on 05-09-22
      itemName: String, //renamed field on 05-09-22
      itemType: Number, //renamed field on 05-09-22
      returnQty: Number,
      rate: Number,
      amount: Number,
      reason: String,
      dimension: String,
      status: String,
      originalQty: Number, //added on 29-05-23
      originalRate: Number, //added on 29-05-23
      originalAmt: Number, //added on 29-05-23
    },
  ],
  shiftId: Number,
  branchId: String,
  returnDate: Number,
  purchasePk: { type: String, required: true } /* added on 08-05-23 */,
  type: { type: Number, required: true } /* added on 08-05-23 */,
  total: { type: Number, required: true } /* added on 11-05-23 */,
});

purchaseReturnSchema.index({ transNo: 1, branchId: 1 }, { unique: true });

// added on 03-08-23
const stockoutSchema = db.Schema({
  productType: { type: Number, required: true },
  productId: { type: String, required: true },
  dimension: { type: String, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, required: true },
  branchId: { type: String, required: true },
});

//#endregion
//#region exports
module.exports = {
  purchaseSchema,
  purchasewopoSchema,
  grnSchema,
  transferSchema,
  stockAdjustmentSchema,
  stockAdjustmentTempSchema,
  paymentVoucherSchema,
  creditLimitSchema,
  purchaseReturnSchema,
  stockoutSchema,
  
}; //edited on 12-04-22
//#endregion
