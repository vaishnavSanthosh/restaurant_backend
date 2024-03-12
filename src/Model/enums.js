//#region exports
//edited on 16-03-22 added new statuscode
module.exports.STATUSCODES = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOTFOUND: 404,
  UNPROCESSED: 422,
  ERROR: 500,
  EXIST: 409,
  BADREQUEST: 400,
  UPDATED: 201, //added on 16-03-22
  CONFLICT: 409 /* added on 06-06-23 */,
  NOTACCEPTABLE: 406,
};

module.exports.STOCKADJUSTMENTSTATUS = {
  CON: "Confirmed",
  PEN: "Pending",
  REC: "Recieved",
  COM: "Completed",
  DRA: "Drafted",
};
//added on 28-01-22
//Edited on 31-01-22/Changed params names
//edited on 10-05-22 -> added return
//edited on 23-05-22 -> added ALL
module.exports.ORDERSTATUS = {
  PEN: "pending",
  COM: "complete",
  CAN: "cancelled",
  RET: "returned", //added on 10-05-22
  ALL: "all", //added on 23-05-22
};

//added on 08-02-22
module.exports.ROLES = {
  USER: "user",
  ADMIN: "admin",
};

//added on 21-02-22
module.exports.OFFERTYPES = {
  PERCENTAGE: "percentage",
  BUYGET: "buyget",
  QUANTITY: "quantity",
};

//added on 21-03-22
module.exports.ORDERTYPES = {
  DIN: "Dine In",
  TAK: "Take Away",
  DEL: "Delivery",
  MES: "Mess",
};

// added on 07-06-23
module.exports.PREFIXES = {
  PURCHASE: "PO",
  PURCHASEWPO: "PINV",
  STOCKADJUSTMENT: "STKAD",
  GRN: "GRN",
  STOCKTRANSFER: "STKTR",
  WORKORDER: "WO",
  JOBCOMPLETION: "JB",
  DELIVERY: "DV",
  SALESBILLING: "INV",
  ORDERRETURN: "ORT",
  SALESRETURN: "SRT",
  DELIVERY: "DRT",
  PURCHASERETURN: "PRT",
  PETTYCASH: "PTE",
  EXPENSES: "PEX",
  QUOTATION: "QT",
  PRODUCT: "PRD",
  SALESINV: "ORD",
  EMPLOYEE: "EMP",
  PAYROLL: "PRL",
  PENDINGPAYMENTVOUCHER: "PAYP",
  PAYMENTVOUCHER: "PAY",
  CUSTOMER: "CUS",
  STAFFEXPENSE: "STF" /* added on 20-10-22 */,
  ALTERATION: "ALT", //added on 3-11-22,
  RECEIPIENT: "RECEIPIE",
  STOCKOUT: "STKOT",
};
//added on 20-05-22
module.exports.STOCKPROCESS = {
  PUR: "food material adding",
  FTR: "food transfer",
  MTR: "material transfer",
  REC: "food material deduction",
  FRQ: "food stock adding",
  FSR: "food sales deduction",
};

//added on 20-05-22
module.exports.ITEMTYPE = {
  PRD: "food material",
  FUD: "food item",
};

//added on 27-05-2022
module.exports.LOG = {
  PURCHASE_CATEGORY_ADD: {
    description: "Add category Details",
    type: "PURCHASE_CATEGORY_ADD",
  },
  PURCHASE_SUBCATEGORY_ADD: {
    description: "Add subcategory Details",
    type: "PURCHASE_SUBCATEGORY_ADD",
  },
  CUSTOMER_ADD: {
    description: " Add customer Details",
    type: "CUSTOMER_ADD",
  },
  CUSTOMER_RELATIONSHIP_ADD: {
    description: "Add customerRelationship Details ",
    type: "CUSTOMER_RELATIONSHIP_ADD",
  },
  CUSTOMER_REWARD_ADD: {
    description: "Add Reward Details ",
    type: "CUSTOMER_REWARD_ADD",
  },
  EMPLOYEE_DEPARTMENT_ADD: {
    description: "Add Department Details ",
    type: "EMPLOYEE_DEPARTMENT_ADD",
  },
  EMPLOYEE_DESIGNATION_ADD: {
    description: "Add Designation Details ",
    type: "EMPLOYEE_DESIGNATION_ADD",
  },
  EMPLOYEE_ADD: {
    description: "Add Employee Details ",
    type: "EMPLOYEE_ADD",
  },
  EMPLOYEE_DOCUMENT_ADD: {
    description: "Add Employee Details ",
    type: "EMPLOYEE_DOCUMENT_ADD",
  },
  EMPLOYEE_PAYROLL_ADD: {
    description: "Add Payroll Details",
    type: "EMPLOYEE_PAYROLL_ADD",
  },
  EMPLOYEE_PAYROLLEARNING_ADD: {
    description: "Add payroll Details",
    type: "EMPLOYEE_PAYROLLEARNING_ADD",
  },
  EMPLOYEE_INFO_ADD: {
    description: " Add EmployeeInfo details",
    type: "EMPLOYEE_INFO_ADD",
  },
  EMPLOYEE_LOAN_ADD: {
    description: "Add Employee Loan details",
    type: "EMPLOYEE_LOAN_ADD",
  },
  EMPLOYEE_NEWLOAN_ADD: {
    description: "Add Employee Loan details",
    type: "EMPLOYEE_NEWLOAN_ADD",
  },
  EMPLOYEE_DOCUMENTATIONURL_ADD: {
    description: "Add Documentation Url details",
    type: "EMPLOYEE_DOCUMENTATIONURL_ADD",
  },
  EMPLOYEE_ATTENDANCE_ADD: {
    description: "Add Attendance details",
    type: "EMPLOYEE_ATTENDANCE_ADD",
  },
  EMPLOYEE_DOCUMENTTYPE_ADD: {
    description: "Add Documnttype details",
    type: "EMPLOYEE_DOCUMENTTYPE_ADD",
  },
  EMPLOYEE_LEAVETYPE_ADD: {
    description: "Add Documnttype details",
    type: "EMPLOYEE_LEAVETYPE_ADD",
  },
  EXPENSESTYPE_STAFFEXPADD: {
    description: "Add Staff ExpenseType",
    type: "EXPENSESTYPE_STAFFEXPADD",
  },
  FOODMANAGEMENT_FOOD_ADD: {
    description: "Add Food Details",
    type: "FOODMANAGEMENT_FOOD_ADD",
  },
  FOODMANAGEMENT_COUPON_ADD: {
    description: "Add Coupon Details",
    type: "FOODMANAGEMENT_COUPON_ADD",
  },
  FOODMANAGEMENT_RECIPE_ADD: {
    description: "Add Recipe Details",
    type: "FOODMANAGEMENT_RECIPE_ADD",
  },
  FOODMANAGEMENT_FOODDIMENSION_ADD: {
    description: "Add Food Details",
    type: "FOODMANAGEMENT_FOODDIMENSION_ADD",
  },
  FOODMANAGEMENT_UTILITY_EDIT: {
    description: "Add Utility Details",
    type: "FOODMANAGEMENT_UTILITY_EDIT",
  },
  ORDERS_ADDMESS: {
    description: "Add Mess Details",
    type: "ORDERS_ADDMESS",
  },
  RESERVATION_ADD: {
    description: "Adds Reservation Details For Customer",
    type: "RESERVATION_ADD",
  },
  PURCHASEMANAGE_ADDPRODUCT: {
    description: "adds Raw Material to branch",
    type: "PURCHASEMANAGE_ADDPRODUCT",
  },
  PURCHASEMANAGE_PRODUCTTOBRANCH_ADDPRODUCT: {
    description: "adds product to branch",
    type: "PURCHASEMANAGE_PRODUCTTOBRANCH_ADDPRODUCT",
  },
  PURCHASEMANAGE_SUPPLIERADD: {
    description: "add supplier",
    type: "PURCHASEMANAGE_SUPPLIERADD",
  },
  PURCHASEMANAGE_PO_ADD: {
    description: "add purchase",
    type: "PURCHASEMANAGE_PO_ADD",
  },
  PURCHASEMANAGE_PWPO_ADD: {
    description: "add purchasewpo",
    type: "PURCHASEMANAGE_PWPO_ADD",
  },
  PURCHASEMANAGE_GRN_ADD: {
    description: "add grn",
    type: "PURCHASEMANAGE_GRN_ADD",
  },
  PURCHASEMANAGE_GRN_DRAFT: {
    description: "draft grn",
    type: "PURCHASEMANAGE_GRN_DRAFT",
  },
  PURCHASEMANAGE_GRN_EDIT: {
    description: "draft grn",
    type: "PURCHASEMANAGE_GRN_EDIT",
  },
  PURCHASEMANAGE_TRANSFER_EDIT: {
    description: "draft grn",
    type: "PURCHASEMANAGE_TRANSFER_EDIT",
  },
  PURCHASEMANAGE_RETURN_ADD: {
    description: "Add PurchaseReturn",
    type: "PURCHASEMANAGE_RETURN_ADD",
  },
  PURCHASEMANAGE_RETURN_DELETE: {
    description: "Add PurchaseReturn Delete",
    type: "PURCHASEMANAGE_RETURN_DELETE",
  },
  SALES_QUATATION_ADD: {
    description: "Add Quatation",
    type: "SALES_QUATATION_ADD",
  },
  PURCHASEMANAGE_STKOUT_ADD: {
    description: "add stockout",
    type: " PURCHASEMANAGE_STKOUT_ADD",
  },
  PURCHASEMANAGE_STOCKADJADD: {
    description: "add supplier",
    type: "PURCHASEMANAGE_STOCKADJADD",
  },
  PURCHASEMANAGE_STOCKADJRECIEVE: {
    description: "add supplier",
    type: "PURCHASEMANAGE_STOCKADJRECIEVE",
  },
  PURCHASEMANAGE_STOCKADJCONFIRM: {
    description: "add supplier",
    type: "PURCHASEMANAGE_STOCKADJCONFIRM",
  },
  SALES_BILLING_ADD: {
    description: "add sales order",
    type: "SALES_BILLING_ADD",
  },
  EXPENSES_STAFFEXPADD: {
    description: "Add Staff Expense",
    type: "EXPENSES_STAFFEXPADD",
  },
  EXPENSES_OUTLETEXPADD: {
    description: "Add Outlet Expense",
    type: "EXPENSES_OUTLETEXPADD",
  },
  EXPENSES_PETTYCASHADD: {
    description: "Add Petty Cash Expense",
    type: "EXPENSES_PETTYCASHADD",
  },
  PURCHASEMANAGE_PRODUCTMASTER_CAT_ADD: {
    description: "add material category",
    type: "PURCHASEMANAGE_PRODUCTMASTER_CAT_ADD",
  },
  PAYMENT_CASH_CARD_EDIT: {
    description: "payment_change_to_cashcard",
    type: "PAYMENT_CASH_CARD",
  },
  FOODAVAILABLE_ADD: {
    description: "add food available",
    type: "ADD_FOOD_AVAILABLE",
  },
  HOLIDAY_ADD: {
    description: "add holiday",
    type: "ADD_HOLIDAY",
  },
  LEAVE_ADD: {
    description: "add leave",
    type: "ADD_STAFF_LEAVE",
  },
  BRANCH_ADD: {
    description: "add branch",
    type: "ADD_BRANCH",
  },
  OFFER_ADD: {
    description: "add offer",
    type: "ADD_OFFER",
  },
  MESS_PACKAGE_ADD: {
    description: "add mess package",
    type: "ADD_MESS_PACKAGE",
  },
  MESS_PACKAGE_EDIT: {
    description: "edit mess package",
    type: "EDIT_MESS_PACKAGE",
  },
  SALES_RETURN_ADD: {
    description: "add sales return",
    type: "ADD_SALES_RETURN",
  },
  SALES_CREDIT_UPDATE: {
    description: "update credit",
    type: "SALES_CREDIT_UPDATE",
  },
  RESERVATION_ADD: {
    description: "add reservation",
    type: "ADD_RESERVATION",
  },
  RESERVATION_EDIT: {
    description: "edit reservation",
    type: "EDIT_RESERVATION",
  },
  RESERVATION_DELETE: {
    description: "delete reservation",
    type: "DELETE_RESERVATION",
  },
  RESERVATION_ADD_SETTINGS: {
    description: "add reservation settings",
    type: "ADD_RESERVATION_SETTINGS",
  },
  RESERVATION_EDIT_SETTINGS: {
    description: "edit reservation settings",
    type: "EDIT_RESERVATION_SETTINGS",
  },
  REWARD_POINTS_ADD: {
    description: "add reward points",
    type: "ADD_REWARD_POINTS",
  },
  REWARD_POINTS_EDIT: {
    description: "edit reward points",
    type: "EDIT_REWARD_POINTS",
  },
  REWARD_POINTS_DELETE: {
    description: "delete reward points",
    type: "DELETE_REWARD_POINTS",
  },
  REWARD_POINTS_DELETE: {
    description: "delete reward points",
    type: "DELETE_REWARD_POINTS",
  },
  PURCHASEMANAGER_SUPPLIER_ADD: {
    description: "add supplier",
    type: "ADD SUPPLIER",
  },
};

//added on 02-06-2022
module.exports.URL = {
  CUS_CUSTOMERSINGLEVIEW: "/userdashboard/customers/allCustomer/viewCustomer",
  RES_RSERVATIONVIEW: "/userdashboard/reservations",
  RES_SEATVIEW: "/userdashboard/reservation/addSeat",
  PUR_ADDPRODUCT: "/userdashboard/purchaseManage/productMaster",
  PUR_EDITPRODUCT: "/userdashboard/purchaseManage/productMaster",
  //ORD_ORDERLIST:""
};

module.exports.API = {
  CUS_GETSINGLECUSTOMER: "customer/getSingleCustomer/",
  RES_GETSINGLERESERVATION: "reservation/view/",
  RES_SEATVIEW: "reservation/seating",
  PUR_VIEWPRODUCT: "product/",
};

//added on 03-08-22
module.exports.SMSSTATUS = {
  PEN: "Pending",
  APP: "Approved",
  REJ: "Rejected",
};

//added on 16-05-23
module.exports.SHIFTSTATUS = {
  ACT: "Active",
  PAU: "Paused",
  END: "Ended",
};

module.exports.CREDITSTATUS = {
  COM: "Completed",
  PEN: "Pending",
};

//added on 18-06-2023
module.exports.GRNSTATUS = {
  PEN: "Pending",
  DRF: "Drafted",
  COM: "Complete",
  RET: "Returned",
};
//added on 16/06/23
module.exports.LOAN = {
  PEN: "Pending",
  APRVD: "Approved",
  REJ: "Rejected",
};
//added on 20-06-23
module.exports.STAFFLEAVE = {
  APRV: "APPROVED",
  PEN: "PENDING",
  REJ: "REJECTED",
};

//added on 24-09-22
module.exports.PAYMENTTYPES = {
  CARD: "card",
  CASH: "cash",
  UPIS: "upi",
  CHEQ: "cheque" /* added on 29-04-23 */,
};
//added on 03-08-23
module.exports.STOCKSTATUS = {
  PEN: "Pending",
  ACC: "Accepted",
  REJ: "Rejected",
};
//#endregion
