//created on 16-02-2022
//#region  header
const db = require("mongoose");
//#endregion

//#region schema
//edited on 22-02-22
//edited on 21-04-22
// edited on 26/06/23
const offerSchema = db.Schema({
  category: String,
  subcategory: String,
  food_id: String,
  offer: [],
  startDate: Number,
  endDate: Number,
  conditions: [],
  festivalName: String,
  imageUrl: String, //assign from backend
  branchId: String,
  dataStatus: Boolean, //assign from backend
  expireAt: Number,
});

//#endregion

//#region exports
module.exports = { offerSchema };
//#endregion
