//#region header
const db = require("mongoose");
//#endregion

//#region schema
// edited on 24/06/23 added shiftid
const expenseSchema = new db.Schema({
  expense: String,
  expenseDate: Number,
  paymentType: String,
  amount: Number,
  dataStatus: Boolean,
  branchId: String, //edited  on 07-04-22
  empId: String, //edited on 27-04-2022
  shiftId: Number /* added on 21-06-23 */,
});

//added on 19/04/2022
// edited on 24/06/23
const expenseTypeSchema = new db.Schema({
  transNo: {
    type: Number,
    unique: true,
  },
  expenseType: String,
  branchId: String,
  dataStatus: Boolean,
});
//added on 20/04/2022
//edited on 21/06/2023
const outletExpenseSchema = new db.Schema({
  transNo: {
    type: Number,
    required: true,
  },
  branchId: String,
  expenseType: String,
  date: Number,
  amount: Number,
  paidBy: String,
  dataStatus: Boolean,
  creditAmount: Number,
  lastPaidAmount: Number,
  lastPaidDate: Number,
  paymentMethod: {},
  shiftId: Number,
});

outletExpenseSchema.index({ transNo: 1, branchId: 1 }, { unique: true });

const pettyCashSchema = new db.Schema({
  transNo: Number /* edited on 22-06-23-> field changed to normal transNo */,
  branchId: String,
  expenseType: String,
  date: Number,
  amount: Number,
  dataStatus: Boolean,
});
pettyCashSchema.index({ transNo: 1, branchId: 1 }, { unique: true });
//#endregion

//#region exports
module.exports = {
  expenseSchema,
  expenseTypeSchema,
  outletExpenseSchema,
  pettyCashSchema,
};
//#endregion
