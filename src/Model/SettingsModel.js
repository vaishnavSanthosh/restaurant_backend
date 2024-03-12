/** @format */

//created on 15-03-22
//#region headers
const db = require("mongoose");
//#endregion

//#region schema
//edited on 11-04-22 -> couple of changes including new permission introduction and
const settingsSchema = new db.Schema({
  empId: String,
  type: Boolean,
  dashboard: Boolean,
  order: {
    all: Boolean,
    orderLst: Boolean,
    newOrder: Boolean,
    pendingOrder: Boolean,
    completeOrder: Boolean,
    cancelOrder: Boolean,
    credit: Boolean,
    mess: Boolean,
  },
  reservation: {
    all: Boolean,
    reservation: Boolean,
    addreservation: Boolean,
    settings: Boolean,
    addseat: Boolean,
  },
  purchaseManage: {
    all: Boolean,
    productMaster: Boolean,
    purchaseProduct: Boolean,
    addpurchase: Boolean,
    purchaseReturn: Boolean,
    returnInvoice: Boolean,
    supplierManage: Boolean,
    supplierLedger: Boolean,
    stockOutProducts: Boolean,
    /* */ grn: Boolean, //added on 11-04-22
    stockAdjustment: Boolean,
    transfer: Boolean /* */,
  },
  report: {
    all: Boolean,
    purchaseReport: Boolean,
    stockReport: Boolean,
    salesReport: Boolean,
    dailyReport: Boolean,
    /* added on 11-04-22*/
    cashSummary: Boolean,
    profitnSale: Boolean,
    transfer: Boolean,
    stockAdjustment: Boolean,
    expense: Boolean,
    payment: Boolean /* */,
  },
  foodManagement: {
    all: Boolean,
    manageCategory: Boolean,
    addrecipients: Boolean,
    foodList: Boolean,
    addFood: Boolean,
    foodAvailable: Boolean,
    menuType: Boolean,
    coupon: Boolean,
    manageSubCategory: Boolean, //added on 11-04-22
  },
  sales: {
    all: Boolean,
    billing: Boolean,
    salesInvoice: Boolean,
    salesOrder: Boolean,
    payments: Boolean,
    quotation: Boolean,
    salesReturn: Boolean,
  },
  rewardPoint: {
    all: Boolean,
    rewardsView: Boolean,
    addRewards: Boolean,
  },
  offers: {
    all: Boolean,
    offerListed: Boolean,
    addOffer: Boolean,
  },
  wallet: Boolean,
  accounts: {
    all: Boolean,
    chartOfAccount: Boolean,
    supplierPayment: Boolean,
    cashAdjustment: Boolean,
    creditVoucher: Boolean,
    debitVoucher: Boolean,
    contraVoucher: Boolean,
    journalVoucher: Boolean,
    voucherApproval: Boolean,
    accountReport: Boolean,
  },
  staff: {
    all: Boolean,
    dashboard: Boolean,
    position: Boolean,
    manageEmployee: Boolean,
    addEmployee: Boolean,
    addDocument: Boolean,
    department: Boolean,
    attendance: Boolean,
    // manageExpense: Boolean,//removed on 11-04-22 from here because its a new section now
    leaveApplication: Boolean,
    holiday: Boolean,
    addleaveType: Boolean,
    employeeSalary: Boolean,
    addPayroll: Boolean,
    payrollItem: Boolean,
    loan: Boolean,
  },
  /*added on 11-04-22 */
  expense: {
    all: Boolean,
    manageExpense: Boolean,
    outletExpense: Boolean,
    pettyCashReciept: Boolean,
    addExpenseType: Boolean,
  },
  /*added on 11-04-22 */
  customer: {
    all: Boolean,
    viewCustomer: Boolean,
    addCustomer: Boolean,
  },
});

const shiftSchema = new db.Schema({
  branchId: String,
  duration: Number,
  startTime: String,
  endTime: String,
  workingDays: [],
  employee: [] /* added on 02-11-22  -> new field */,
  shiftType: Number,
  isDenomination: Boolean /* added on 21-03-23 */,
});

// edited on 24/06/23
const logSchema = new db.Schema({
  date: { type: Number, required: true },
  emp_id: { type: String, required: true },
  type: { type: String, required: true },
  shift_id: Number,
  description: { type: String, required: true },
  branchId: { type: String, required: true },
  link: {},
  payload: {} /* added on 21-06-23 */,
});

//added on 22-06-22
const cardSchema = new db.Schema({
  cardName: String,
  commission: Number,
  imageUrl: String,
  status: Boolean, //added on 26-07-22
});

//added on 21-07-22
const branchShiftSchema = new db.Schema({
  shiftId: Number,
  shiftType: Number,
  startDate: Number,
  startTime: Number,
  endDate: Number,
  endTime: Number,
  branchId: String,
  status: Boolean,
});

//added on 21-07-22
const branchShiftTimeSchema = new db.Schema({
  startTime: String,
  startDate: String,
  endTime: String,
  branchId: String,
  status: Boolean,
  days: [],
  duration: Number,
  shiftType: Number,
});

//added on 23-07-22
const upiSchema = new db.Schema({
  upiName: String,
  commission: Number,
  status: Boolean, //added on 05-08-22
  imageUrl: String,
  upiId: String,
});

//added on 24-07-22
const currencySchema = new db.Schema({
  localCurrency: String,
  foreignCurrency: String,
  exchangeRate: Number,
});

//added on 03-08-22
const smsHeaderSchema = new db.Schema({
  headerName: String,
  status: String,
  adminId: String,
  dataStatus: Boolean,
  db: String, //added new field on 04-08-22
});

//added on 03-08-22
const smsSchema = new db.Schema({
  templateName: String,
  templateType: String,
  status: String,
  adminId: String,
  dataStatus: Boolean,
  db: String, //added on 04-08-22
  content: String, //added on 04-08-22
});

const shiftLogSchema = new db.Schema({
  shiftId: Number,
  startDate: Number,
  endDate: Number,
  startTime: Number,
  endTime: Number,
  branchId: String,
  status: String,
});

//Added on 11-07-23
const shiftTransferLogSchema = new db.Schema({
  branchId: { type: String, require: true },
  orderType: { type: Number, require: true },
  orderId: [], //pk
  transferedShift: { type: Number, require: true },
  date: { type: Number, require: true },
});

//added on 30-06-23
const pointRatioSchema = new db.Schema({
  point: { type: Number, required: true },
  amount: { type: Number, required: true },
});

//added on 07-07-2023
const chequeSchema = new db.Schema({
  bankName: String,
  commission: Number,
  imageUrl: String,
  status: Boolean,
});

// added on 11-07-23
const discountSchema = new db.Schema({
  discountAmount: { type: Number, required: true },
});
// added on 20-07-23
const denominationSchema = new db.Schema({
  denomination: [
    {
      currency: { type: String, required: true },
      amount: { type: Number, required: true },
      count: { type: Number, required: true },
    },
  ],
  branchId: { type: String, required: true },
  date: { type: Number, required: true },
  shiftId: { type: Number, required: true },
});

// added on 08-09-23
const paymentDeviceSchema = new db.Schema({
  branchName:String,
  pos: String,
  appKey: String,
  userName: String,
  passWord: String,
  hash: String,
  salt: String,
});
//#endregion

//#region exports
module.exports = {
  settingsSchema,
  shiftSchema,
  logSchema,
  cardSchema,
  branchShiftSchema,
  branchShiftTimeSchema,
  upiSchema,
  currencySchema,
  smsHeaderSchema,
  smsSchema,
  shiftLogSchema,
  pointRatioSchema,
  chequeSchema,
  shiftTransferLogSchema,
  discountSchema,
  denominationSchema,
  paymentDeviceSchema,
}; //edited on 31-05-22-> exporting modified from single to multiple
//#endregion
