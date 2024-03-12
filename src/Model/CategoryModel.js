//#region headers
const db = require("mongoose");
//#endregion

//#region schema
const categorySchema = new db.Schema({
  categoryName: String,
  status: Boolean,
  imageUrl: String,
  branchId: String, //edited on 07-04-22
  type: Boolean, //added on 01-06-22 -> new parent class for food category
  isFoodCat: Boolean, //added on 19-06-23
});

//added on 18-04-22
const subcategorySchema = new db.Schema({
  categoryId: String,
  subcategoryName: String,
  status: Boolean,
  imageUrl: String,
  branchId: String,
  type: Boolean,
});

//added on 06-07-22
const quickSchema = new db.Schema({
  access: [{ shortCutName: String, url: String }],
});
//#endregion

//#region exports
module.exports = { categorySchema, subcategorySchema, quickSchema }; //edited on 18-04-22-> single export changed to multiple export
//#endregion
