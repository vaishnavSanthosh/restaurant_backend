//created on 18-02-22
//#region headers
const db = require("mongoose");
//#endregion

//#region schema
const rewardSchema = new db.Schema({
  productName: { type: String, required: true },
  productId: { type: String, required: true },
  itemType: { type: Number, required: true },
  point: { type: Number, required: true },
  amount: { type: Number, required: true },
  isCategory: { type: Boolean, required: true },
  status: { type: Boolean, required: true },
  branchId: { type: String, required: true },
});

const pointSchema = new db.Schema({
  cus_id: { type: String, required: true },
  food_id: { type: String, required: true },
  points: { type: Number, required: true },
  date: { type: Number, required: true },
  purchasePk: { type: String, required: true },
  orderId: { type: String, required: true },
  branchId: { type: String, required: true },
});

//#endregion

//#region exports
module.exports = { rewardSchema, pointSchema };
//#endregion
