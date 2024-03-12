//created on 08-02-2022
//#region headers
const db = require("mongoose");
//#endregion

//#region Schema
//edited on 17-05-22 -> model restructured
const stockSchema = new db.Schema({
  itemType: { type: Number, required: true },
  itemId: { type: String, required: true },
  stock: [
    {
      dimension: { type: String, required: true },
      dimensionStock: { type: Number, required: true },
    },
  ],
  branchId: { type: String, required: true },
  oldStock: [
    {
      dimension: { type: String, required: true },
      dimensionStock: { type: Number, required: true },
    },
  ],
});

//added on 20-05-22
const stockLogSchema = new db.Schema({
  itemType: { type: Number, required: true },
  itemId: { type: String, required: true },
  stock: [
    {
      dimension: { type: String, required: true },
      dimensionStock: { type: Number, required: true },
    },
  ],
  branchId: { type: String, required: true },
  date: { type: Number, required: true },
  orderNo: { type: Number, required: true },
  type: { type: String, required: true },
  categoryId: { type: String, required: true },
  subCategoryId: String,
  rate: { type: Number, required: true },
});

//added on 11-07-23
const oldstockLogSchema = new db.Schema({
  itemType: { type: Number, required: true },
  itemId: { type: String, required: true },
  stock: [
    {
      dimension: String,
      dimensionStock: Number,
    },
  ],
  branchId: { type: String, required: true },
  date: { type: Number, required: true },
});

//#endregion

//#region exports
module.exports = { stockSchema, stockLogSchema, oldstockLogSchema }; //edited on 20-05-22->return type converted to multiple from single
//#endregion
