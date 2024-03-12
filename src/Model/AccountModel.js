/** @format */

//#region headers
const db = require("mongoose");
const { toString } = require("qrcode");
//#endregion

//added on 12/08/23
const ledgergroupSchema = new db.Schema({
  ledgerCode: { type: Number, required: true },
  ledgerName: { type: String, required: true },
  groupType: { type: Number, required: true },
  subCatogory: { type: Number, required: true },
  subSubcatogory: { type: Number, required: true },
  fixed_asset_cat: Number,
  ledgerDetails: {},
  branchId: { type: String, required: true },
});

const bankInvoiceSchema = new db.Schema({
  invoiceNo: { type: String, required: true },
  postingDate: { type: Number, required: true },
  dueDate: Number,
  currency: { type: String, required: true },
  refNo: String,
  remark: String,
  debit_credit_details: [
    {
      glAccountCode: { type: Number, required: true },
      glAccountId: { type: String, required: true },
      glAccountName: { type: String, required: true },
      debit: Number,
      credit: Number,
      debitBalance: Number,
      creditBalance: Number,
    },
  ],
  branchId: { type: String, required: true },
  isDraft: { type: Boolean, required: true },
});

const aPinvoiceSchema = new db.Schema({
  invoiceNo: { type: String, required: true },
  postingDate: { type: Number, required: true },
  dueDate: Number,
  documentDate: Number,
  documentName: String,
  currency: { type: String, required: true },
  refNo: String,
  remark: String,
  debit_credit_details: [
    {
      glAccountCode: { type: Number, required: true },
      glAccountId: { type: String, required: true },
      glAccountName: { type: String, required: true },
      debit: Number,
      credit: Number,
      debitBalance: Number,
      creditBalance: Number,
    },
  ],
  branchId: { type: String, required: true },
  isDraft: { type: Boolean, required: true },
});

const aRinvoiceSchema = new db.Schema({
  invoiceNo: { type: String, required: true },
  postingDate: { type: Number, required: true },
  dueDate: Number,
  documentDate: Number,
  documentName: String,
  currency: { type: String, required: true },
  refNo: String,
  remark: String,
  debit_credit_details: [
    {
      glAccountCode: { type: Number, required: true },
      glAccountId: { type: String, required: true },
      glAccountName: { type: String, required: true },
      debit: Number,
      credit: Number,
      debitBalance: Number,
      creditBalance: Number,
    },
  ],
  branchId: { type: String, required: true },
  isDraft: { type: Boolean, required: true },
});

const purchaseAccountnginvoiceSchema = new db.Schema({
  invoiceNo: { type: String, required: true },
  postingDate: { type: Number, required: true },
  supplierInvoiceno: String,
  supplierInvoicedate: Number,
  debit_credit_details: [
    {
      glAccountCode: { type: Number, required: true },
      glAccountId: { type: String, required: true },
      glAccountName: { type: String, required: true },
      rate: Number,
      quantity: Number,
      debit: Number,
      credit: Number,
    },
  ],
  totalBalance: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  branchId: { type: String, required: true },
  isDraft: { type: Boolean, required: true },
});

const purchaseIteminvoiceSchema = new db.Schema({
  invoiceNo: { type: String, required: true },
  purchaseNo: { type: Number, required: true },
  supplierId: { type: String, required: true },
  postingDate: { type: Number, required: true },
  expiryDate: { type: Number, required: true },
  location: { type: String, required: true },
  paymentType: { type: String, required: true },
  supplierInvoiceno: { type: String, required: true },
  details: String,
  debit_credit_details: [
    {
      glAccountCode: { type: Number, required: true },
      glAccountId: { type: String, required: true },
      glAccountName: { type: String, required: true },
      debit: Number,
      credit: Number,
      itemId: { type: String, required: true },
      hsnOrsacCode: String,
      // stockOrquantity: { type: Number, required: true },
      quantity: String,
      rate: Number,
      cgst: { type: Number, required: true },
      sgst: { type: Number, required: true },
      igst: { type: Number, required: true },
    },
  ],
  totalIgst: { type: Number, required: true },
  totalSgst: { type: Number, required: true },
  totalCgst: { type: Number, required: true },
  discount: Number,
  totalBalance: { type: Number, required: true },
  frightOrotherExpense: { type: Number, required: true },
  custOradvTax: { type: Number, required: true },
  cess: { type: Number, required: true },
  educationAndcompountCess: { type: Number, required: true },
  roundOff: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  branchId: { type: String, required: true },
  isDraft: { type: Boolean, required: true },
});

const purchaseReturninvoiceSchema = new db.Schema({
  invoiceNo: { type: String, required: true },
  purchaseinvoiceNo: { type: String, required: true },
  date: { type: Number, required: true },
  supplierId: { type: String, required: true },
  ledgerAccount: { type: String, required: true },
  totalIgst: { type: Number, required: true },
  totalSgst: { type: Number, required: true },
  totalCgst: { type: Number, required: true },
  discount: Number,
  totalBalance: { type: Number, required: true },
  frightOrotherExpense: { type: Number, required: true },
  custOradvTax: { type: Number, required: true },
  cess: { type: Number, required: true },
  educationAndcompountCess: { type: Number, required: true },
  roundOff: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  branchId: { type: String, required: true },
  isDraft: { type: Boolean, required: true },
});

const salesReturninvoiceSchema = new db.Schema({
  invoiceNo: { type: String, required: true },
  salesinvoiceNo: { type: String, required: true },
  date: { type: Number, required: true },
  customerId: { type: String, required: true },
  ledgerAccount: { type: String, required: true },
  debit_credit_details: [
    {
      itemId: { type: String, required: true },
      hsnOrsacCode: { type: String, required: true },
      stockOrquantity: { type: Number, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      rate: { type: Number, required: true },
      cgst: { type: Number, required: true },
      sgst: { type: Number, required: true },
      igst: { type: Number, required: true },
    },
  ],
  totalIgst: { type: Number, required: true },
  totalSgst: { type: Number, required: true },
  totalCgst: { type: Number, required: true },
  discount: Number,
  totalBalance: { type: Number, required: true },
  cess: { type: Number, required: true },
  roundOff: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  receivedAmount: { type: Number, required: true },
  branchId: { type: String, required: true },
  isDraft: { type: Boolean, required: true },
});

const salesInvoiceSchema = new db.Schema({
  invoiceNo: { type: String, required: true },
  date: { type: Number, required: true },
  customerId: { type: String, required: true },
  debit_credit_details: [
    {
      itemId: { type: String, required: true },
      hsnOrsacCode: { type: String, required: true },
      stockOrquantity: { type: Number, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      rate: { type: Number, required: true },
      cgst: { type: Number, required: true },
      sgst: { type: Number, required: true },
      igst: { type: Number, required: true },
    },
  ],
  total: { type: Number, required: true },
  totalIgst: { type: Number, required: true },
  totalSgst: { type: Number, required: true },
  totalCgst: { type: Number, required: true },
  discount: Number,
  totalBalance: { type: Number, required: true },
  cess: { type: Number, required: true },
  roundOff: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  receivedAmount: { type: Number, required: true },
  branchId: { type: String, required: true },
  isDraft: { type: Boolean, required: true },
});
module.exports = {
  ledgergroupSchema,
  bankInvoiceSchema,
  aPinvoiceSchema,
  aRinvoiceSchema,
  purchaseAccountnginvoiceSchema,
  purchaseIteminvoiceSchema,
  purchaseReturninvoiceSchema,
  salesReturninvoiceSchema,
  salesInvoiceSchema,
};
