/** @format */

//added on 15-06-2022 to implement dynamic db connection to diifferent databases
const mongoose = require("mongoose");
const {
  customerSchema,
  relationshipSchema,
} = require("./src/Model/CustomerModel");
const {
  categorySchema,
  subcategorySchema,
  quickSchema,
} = require("./src/Model/CategoryModel");
const {
  employeeSchema,
  payrollItemSchema,
  payrollSchema,
  loanSchema,
  attendanceSchema,
  documentTypeSchema,
} = require("./src/Model/EmployeeModel");
const {
  expenseSchema,
  expenseTypeSchema,
  outletExpenseSchema,
  pettyCashSchema,
} = require("./src/Model/ExpenseModel");
const {
  foodSchema,
  couponSchema,
  recipeSchema,
  foodDimensionSchema,
  billofMaterialSchema,
} = require("./src/Model/FoodModel");
const {
  leaveSchema,
  holidaySchema,
  leaveTypeSchema,
  staffLeaveSchema,
} = require("./src/Model/LeaveModel");
const { locationSchema, branchSchema } = require("./src/Model/LocationModel");
const {
  orderSchema,
  orderReturnSchema,
  messSchema,
  messPackageSchema,
  orderParallelSchema,
  holdOrderSchema,
  damagedGoodsSchema,
} = require("./src/Model/OrderModel");
const {
  creditSchema,
  walletSchema,
  paymentSchema,
  walletLogSchema,
  returnPaymentSchema,
} = require("./src/Model/PaymentModel");
const { productSchema, unitSchema } = require("./src/Model/ProductModel");
const {
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
} = require("./src/Model/PurchaseModel");
const {
  res_settingsSchema,
  reservationSchema,
  floorPlanSchema,
  seatingSchema,
} = require("./src/Model/ReservationModel");
const { rewardSchema, pointSchema } = require("./src/Model/RewardModel");
const {
  settingsSchema,
  shiftSchema,
  logSchema,
  cardSchema,
  upiSchema,
  currencySchema,
  smsHeaderSchema,
  smsSchema,
  shiftLogSchema,
  pointRatioSchema,
  chequeSchema,
  discountSchema,
  shiftTransferLogSchema,
  denominationSchema,
} = require("./src/Model/SettingsModel");
const {
  stockLogSchema,
  stockSchema,
  oldstockLogSchema,
} = require("./src/Model/StockTransferModel");
const { offerSchema } = require("./src/Model/OfferModel");
const {
  bankInvoiceSchema,
  ledgergroupSchema,
  aPinvoiceSchema,
  aRinvoiceSchema,
  purchaseAccountnginvoiceSchema,
  purchaseIteminvoiceSchema,
  purchaseReturninvoiceSchema,
  salesReturninvoiceSchema,
  salesInvoiceSchema,
} = require("./src/Model/AccountModel");

module.exports.auth = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,  
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    const adminModel = userDB.model("admin", require("./src/Model/AuthModel"));

    return adminModel;
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.customer = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );
    const customerModel = userDB.model("customer", customerSchema);
    const relationModel = userDB.model("relationship", relationshipSchema);
    return { customerModel, relationModel };
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.category = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const categoryModel = userDB.model("category", categorySchema);
    const subcategoryModel = userDB.model("subcategory", subcategorySchema);
    const quickAccessModel = userDB.model("quickAccess", quickSchema);
    return { categoryModel, subcategoryModel, quickAccessModel };
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.department = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const departmentModel = userDB.model(
      "department",
      require("./src/Model/DepartmentModel")
    );
    return departmentModel;
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.designation = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const designationModel = userDB.model(
      "designation",
      require("./src/Model/DesignationModel")
    );
    return designationModel;
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.employee = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const employeeModel = userDB.model("employee", employeeSchema);
    const payrollModel = userDB.model("salary", payrollSchema);
    const payrollItemModel = userDB.model("payrollItems", payrollItemSchema);
    const loanModel = userDB.model("employeeLoans", loanSchema);
    const attendanceModel = userDB.model("staffattendance", attendanceSchema);
    const documentTypeModel = userDB.model("documentType", documentTypeSchema);
    return {
      employeeModel,
      payrollItemModel,
      payrollModel,
      loanModel,
      attendanceModel,
      documentTypeModel,
    };
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.expense = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const expenseModel = userDB.model("expense", expenseSchema);
    const expenseTypeModel = userDB.model("expensetype", expenseTypeSchema);
    const outletExpenseModel = userDB.model(
      "outletExpense",
      outletExpenseSchema
    );
    const pettycashModel = userDB.model("pettycash", pettyCashSchema);
    return {
      expenseModel,
      expenseTypeModel,
      outletExpenseModel,
      pettycashModel,
    };
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.food = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const foodModel = userDB.model("foodItem", foodSchema);
    const couponModel = userDB.model("coupon", couponSchema);
    const recipeModel = userDB.model("recipe", recipeSchema);
    const billofMaterialModel = userDB.model("material", billofMaterialSchema);
    const foodDimensionModel = userDB.model(
      "foodDimension",
      foodDimensionSchema
    );
    return {
      foodModel,
      couponModel,
      recipeModel,
      billofMaterialModel,
      foodDimensionModel,
    };
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.foodavailable = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const foodAvailableModel = userDB.model(
      "foodAvailable",
      require("./src/Model/FoodAvailableModel")
    );
    return foodAvailableModel;
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.leave = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const leaveModel = userDB.model("leaveApplication", leaveSchema);
    const holidayModel = userDB.model("holiday", holidaySchema);
    const leaveTypeModel = userDB.model("leaveType", leaveTypeSchema);
    const staffLeaveModel = userDB.model("staffLeave", staffLeaveSchema);
    return {
      leaveModel,
      holidayModel,
      leaveTypeModel,
      staffLeaveModel,
    };
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.location = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const locationModel = userDB.model("location", locationSchema);
    const branchModel = userDB.model("branch", branchSchema);
    return {
      locationModel,
      branchModel,
    };
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.menu = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const menuModel = userDB.model("menu", require("./src/Model/MenuModel"));
    return menuModel;
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.offer = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const offerModel = userDB.model("offers", offerSchema);
    return offerModel;
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.order = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const orderModel = userDB.model("orders", orderSchema);
    const orderreturnModel = userDB.model("salesReturns", orderReturnSchema);
    const messModel = userDB.model("mess", messSchema);
    const messPackageModel = userDB.model("messPackage", messPackageSchema);
    const holdOrderModel = userDB.model("holdorder", holdOrderSchema);
    const damagedGoodsModel = userDB.model("damagedGoods", damagedGoodsSchema);
    return {
      orderModel,
      orderreturnModel,
      messModel,
      messPackageModel,
      holdOrderModel,
      damagedGoodsModel,
    };
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.payment = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );
    const creditModel = userDB.model("credit", creditSchema);
    const walletModel = userDB.model("wallet", walletSchema);
    const walletLogModel = userDB.model("walletLog", walletLogSchema);
    const paymentModel = userDB.model("payment", paymentSchema);
    const returnPaymentModel = userDB.model(
      "returnPayments",
      returnPaymentSchema
    );
    return {
      creditModel,
      walletModel,
      paymentModel,
      walletLogModel,
      returnPaymentModel,
    };
  } catch (error) {
    console.error(error.message);
  }
};

//edited on 08-08-22
module.exports.product = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const productModel = userDB.model("productItems", productSchema);
    const unitModel = userDB.model("units", unitSchema);
    return {
      productModel,
      unitModel,
    };
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.purchase = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );
    const purchaseModel = userDB.model("purchases", purchaseSchema);
    const purchasewopoModel = userDB.model("purchasewopo", purchasewopoSchema);
    const grnModel = userDB.model("grns", grnSchema);
    const transferModel = userDB.model("stocktransfer", transferSchema);
    const stockAdjustmentModel = userDB.model(
      "stockAdjustment",
      stockAdjustmentSchema
    );
    const stockAdjustmentTempModel = userDB.model(
      "stockadjustmentTemp",
      stockAdjustmentTempSchema
    );
    const paymentVoucherModel = userDB.model(
      "paymentVoucher",
      paymentVoucherSchema
    );
    const creditLimitModel = userDB.model("suppliercredit", creditLimitSchema); //added on 21-06-23
    const purchaseReturnModel = userDB.model(
      "purchaseReturns",
      purchaseReturnSchema
    );
    const stockOutModel = userDB.model("stockOut", stockoutSchema);
    return {
      purchaseModel,
      purchasewopoModel,
      grnModel,
      transferModel,
      stockAdjustmentModel,
      stockAdjustmentTempModel,
      paymentVoucherModel,
      creditLimitModel /* added on 21-06-23 */,
      purchaseReturnModel,
      stockOutModel,
    };
  } catch (error) {
    console.error(error.message.message);
  }
};

module.exports.reservation = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );
    const reservationModel = userDB.model("reservation", reservationSchema);
    const res_settingsModel = userDB.model(
      "reservationSettings",
      res_settingsSchema
    );
    const seatingModel = userDB.model("seatings", seatingSchema);
    const floorPlanModel = userDB.model("floorPlan", floorPlanSchema);
    return {
      reservationModel,
      res_settingsModel,
      seatingModel,
      floorPlanModel,
    };
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.reward = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );
    const rewardModel = userDB.model("reward", rewardSchema);
    const pointModel = userDB.model("pointsTransfer", pointSchema);
    return {
      rewardModel,
      pointModel,
    };
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.sales = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );
    const salesModel = userDB.model(
      "salesQuotation",
      require("./src/Model/SalesModel")
    );
    return salesModel;
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.settings = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );
    const settingsModel = userDB.model("settings", settingsSchema);
    const shiftModel = userDB.model("branchShifts", shiftSchema);
    const logModel = userDB.model("log", logSchema);
    const cardModel = userDB.model("card", cardSchema);
    const upiModel = userDB.model("upi", upiSchema); //added on 23-07-22
    const currencyModel = userDB.model("currency", currencySchema);
    const smsHeaderModel = userDB.model("smsHeader", smsHeaderSchema);
    const smsTemplateModel = userDB.model("smsTemplates", smsSchema);
    const shiftLogModel = userDB.model("shiftLogs", shiftLogSchema);
    const pointratioModel = userDB.model("pointRatio", pointRatioSchema);
    const chequeModel = userDB.model("cheques", chequeSchema);
    const shiftTransferLogModel = userDB.model(
      "shiftTransferLog",
      shiftTransferLogSchema
    );
    const discountModel = userDB.model("discounts", discountSchema);
    const denominationModel = userDB.model("denomination", denominationSchema);
    return {
      settingsModel,
      shiftModel,
      logModel,
      cardModel,
      upiModel, //added on 23-07-22
      currencyModel, //added on 24-07-22
      smsHeaderModel, //added on 03-08-22
      smsTemplateModel, //added on 03-08-22
      shiftLogModel /* added on 06-06-23 */,
      pointratioModel /* added on 30-06-23 */,
      chequeModel /* added on 07-07-2023 */,
      shiftTransferLogModel, // Added on 11-07-23
      discountModel,
      denominationModel,
    };
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.sms = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );
    const smsModel = userDB.model("sms", require("./src/Model/SmsModel"));
    return smsModel;
  } catch (error) {
    console.error(error.message);
  }
};

module.exports.supplier = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const supplierModel = userDB.model(
      "supplier",
      require("./src/Model/SupplierModel")
    );
    return supplierModel;
  } catch (error) {
    console.error(error.message);
  }
};

//added on 22-07-22
module.exports.stock = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );

    const stockModel = userDB.model("productstocks", stockSchema);
    const stockLogModel = userDB.model("productstocklogs", stockLogSchema);
    const oldStockLogModel = userDB.model("oldStockLogs", oldstockLogSchema);
    return { stockLogModel, stockModel, oldStockLogModel };
  } catch (error) {
    console.error(error.message);
  }
};
//added on 11-08-23
module.exports.account = (dbName) => {
  try {
    const userDB = mongoose.createConnection(
      `${process.env.MONGO_URL}${dbName}`,
      { UseNewUrlParser: true, UseunifiedTopology: true }
    );
    // const userDB = mongoose.createConnection(
    //   `${process.env.MONGO_URL}${dbName}?authSource=admin`
    //   /* { UseNewUrlParser: true, UseunifiedTopology: true } */
    // );
    const bankInvoiceModel = userDB.model("bankInvoice", bankInvoiceSchema);
    const ledgergroupModel = userDB.model("ledgerGroup", ledgergroupSchema);
    const aPinvoiceModel = userDB.model("apinvoice", aPinvoiceSchema);
    const aRinvoiceModel = userDB.model("arinvoice", aRinvoiceSchema);
    const purchaseAccountnginvoiceModel = userDB.model(
      "purchaseAccountnginvoice",
      purchaseAccountnginvoiceSchema
    );
    const purchaseIteminvoiceModel = userDB.model(
      "purchaseIteminvoice",
      purchaseIteminvoiceSchema
    );
    const purchaseReturninvoiceModel = userDB.model(
      "purchaseReturninvoice",
      purchaseReturninvoiceSchema
    );
    const salesReturninvoiceModel = userDB.model(
      "salesReturninvoice",
      salesReturninvoiceSchema
    );
    const salesInvoiceModel = userDB.model("salesInvoice", salesInvoiceSchema);
    return {
      bankInvoiceModel,
      ledgergroupModel,
      aPinvoiceModel,
      aRinvoiceModel,
      purchaseAccountnginvoiceModel,
      purchaseIteminvoiceModel,
      purchaseReturninvoiceModel,
      salesReturninvoiceModel,
      salesInvoiceModel,
    };
  } catch (error) {
    console.error(error.message);
  }
};
