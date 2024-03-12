//#region header
const db = require("mongoose");
//#endregion

//#region schema
//edited on 17-02-22
//edited on 21-03-22 -> removed stock field
//edited on 22-03-22 -> added new field calculatedprice
//edited on 17-05-22 -> added new field stock
const foodSchema = new db.Schema({
  prod_id: { type: Number, required: true },
  prod_name: { type: String, required: true },
  release_date: { type: Number, required: true },
  food_type: { type: Boolean, required: true },
  category: { type: String, required: true },
  subcategoryId: { type: String, required: true },
  unit: { type: String, required: true },
  dimensions: [{}],
  tags: [],
  description: { type: String, required: true },
  imageUrl: [],
  status: { type: Boolean, required: true },
  branchId: { type: String, required: true },
  dataStatus: { type: Boolean, required: true },
  nativeprod_name: String, //added on 21-06-23,
  isStockBased: { type: Boolean, required: true },
  isUnitBased: { type: Boolean, required: true },
  isPreparable: { type: Boolean, required: true },
});

foodSchema.index({ prod_id: 1, branchId: 1 }, { unique: true });
//added on 03-02-22
const couponSchema = new db.Schema({
  food_type: Boolean,
  category: String,
  foodItem: String,
  dimension: String, //added on 23-06-22-> added new field today
  couponCode: [
    {
      couponCode: String,
      redeemed: Boolean,
    },
  ],
  couponType: {
    offertype: String,
    offer: {
      percentage: Number,
    },
  },
  expiryDate: Number,
  conditions: [],
  branchId: String, //edited  on 07-04-22
  shiftId: Number, //added on 06-06-22 -> shift id f.k reference
  redeemed: Boolean, //added on 21-06-22
});

//added on 11-02-22
//edited on 14-02-22
const recipeSchema = new db.Schema({
  emp_id: String,
  foodId: String,
  recipient: [{}],
  date: Number,
  branchId: String,
  quantity: Number,
  transNo: Number,
  dimension: String,
  productCost: Number,
  expense: {
    totalAmount: Number,
    list: [],
  },
  profit: Number,
  totalSellingPrice: Number,
});

//added on 20-07-2023
const foodDimensionSchema = new db.Schema({
  dimensionName: { type: String, required: true },
  dataStatus: Boolean,
});

// added on 16-08-23
const billofMaterialSchema = new db.Schema({
  productId: String,
  productName: String,
  quantity: Number,
  uom: String,
  materials: [
    {
      productName: String,
      quantity: Number,
      uom: String,
      unitPrice: String,
      usedQty: Number,
      wastage: String,
      productCost: Number,
      itemId: String,
    },
  ],
  totalCost: Number,
});
//#endregion

//#region exports
module.exports = {
  foodSchema,
  couponSchema,
  recipeSchema,
  foodDimensionSchema,
  billofMaterialSchema,
}; //edited on 11-02-22
//#endregion
