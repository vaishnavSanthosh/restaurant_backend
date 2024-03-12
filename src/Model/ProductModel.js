//added on 04-02-22
//#region  header
const db = require("mongoose");
//#endregion

//#region schema

const productSchema = new db.Schema({
  code: { type: Number, required: true },
  category: { type: String, required: true },
  productName: { type: String, required: true },
  unit: { type: String, required: true },
  imageUrl: { type: String, required: true },
  status: { type: Boolean, required: true },
  sellingRate: { type: Number, required: true },
  branchId: { type: String, required: true },
});

const unitSchema = new db.Schema({
  unitName: { type: String, required: true },
  status: { type: Boolean, required: true },
});
//#endregion

//#region exports
module.exports = { productSchema, unitSchema };
//#endregion
