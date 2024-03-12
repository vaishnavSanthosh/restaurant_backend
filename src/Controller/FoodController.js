/** @format */

//#region headers
const fd_service = require("../Routes/FoodRoutes.js");
const express = require("express");
const { STATUSCODES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes.js");
//#endregion

//#region variable
const food_router = express.Router();
//#endregionf

//#region methods
//major change added on 28-02-22 to all methods : autentication middleware
food_router.post("/", checkToken, async (req, res) => {
  try {
    let result = await fd_service.addFoodItem(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

food_router.post("/view", checkToken, async (req, res) => {
  try {
    let result = await fd_service.viewFoodItems(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 10-03-22
food_router.post("/viewfoodsingle", checkToken, async (req, res) => {
  try {
    let result = await fd_service.foodSingleView(req); //edited on 10-03-22 previous method replicated to act as helper function to solve iteration
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

food_router.delete("/deletefooditem", checkToken, async (req, res) => {
  try {
    let result = await fd_service.deleteFoodItem(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 03-02-22
food_router.post("/coupon", checkToken, async (req, res) => {
  try {
    let result = await fd_service.addCoupon(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 03-02-22
food_router.post("/viewcoupon", checkToken, async (req, res) => {
  try {
    let result = await fd_service.viewCoupons(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 14-02-22
food_router.post("/recipie/add", checkToken, async (req, res) => {
  try {
    let result = await fd_service.addrecipie(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 14-02-22
food_router.post("/recipie/view", checkToken, async (req, res) => {
  try {
    let result = await fd_service.viewRecipies(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 22-03-22
food_router.post("/addqrcode", checkToken, async (req, res) => {
  try {
    let url = {};
    url.barcode = await fd_service.addBarcode(req);
    url.qrcode = await fd_service.addQrcode(req);
    if (url.barcode && url.qrcode) {
      res.status(200).send({ data: url });
    } else {
      res.status(422).send({ data: {} });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 20-04-22
food_router.post("/recipiesingle", checkToken, async (req, res) => {
  try {
    let result = await fd_service.viewrecipieSingle(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 04-05-22
food_router.post("/catandsubcatfilter", checkToken, async (req, res) => {
  try {
    let result = await fd_service.viewfooditembycatandsubcategory(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 13-05-22
food_router.post("/redeemcoupon", checkToken, async (req, res) => {
  try {
    let result = await fd_service.applycoupon(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

food_router.post("/getFoodId", checkToken, async (req, res) => {
  try {
    let result = await fd_service.getFoodId(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 13-06-22
food_router.post("/gettaxedvalue", (req, res) => {
  try {
    let result = fd_service.taxableRate(req.body.price);
    res.status(result.status).send({ data: result.data });
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 13-06-22 - actual delete method
food_router.delete("/removefooditem/:id", checkToken, async (req, res) => {
  try {
    let result = await fd_service.deleteFoodItem(req.params.id);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

food_router.put("/addfoodqrcodeandbarcode", checkToken, async (req, res) => {
  try {
    let result = await fd_service.updateQRcodeAndBarcode(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 01/07/23
food_router.post("/viewproductsforbilling", checkToken, async (req, res) => {
  try {
    let result = await fd_service.viewProductsforBilling(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
});

//added on 24-07-23
food_router.delete("/recipie/delete", checkToken, async (req, res) => {
  try {
    let result = await fd_service.deleteRecipie(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 04-08-23
food_router.post("/addFoodDimension", checkToken, async (req, res) => {
  try {
    let result = await fd_service.addFoodDimension(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 04-08-23
food_router.get("/viewFoodDimension", checkToken, async (req, res) => {
  try {
    let result = await fd_service.viewFoodDimension(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 08-08-23
food_router.post("/viewfoodlist", checkToken, async (req, res) => {
  try {
    let result = await fd_service.viewFoodList(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

food_router.put("/addfoodbarcode", checkToken, async (req, res) => {
  try {
    let result = await fd_service.updateBarcode(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 16-08-23
food_router.post("/addBillofMaterial", checkToken, async (req, res) => {
  try {
    let result = await fd_service.addBillofMaterial(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 16-08-23
food_router.post("/viewBillOfMaterials", checkToken, async (req, res) => {
  try {
    let result = await fd_service.viewBillOfMaterials(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 17-08-23
food_router.post("/editBillofMaterials", checkToken, async (req,res) => {
  try {
    let result = await fd_service.editBillofMaterials(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 17-08-23
food_router.delete("/deletebillofProduct", checkToken, async (req,res) => {
  try {
    let result = await fd_service.deletebillofProduct(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = food_router;
//#endregion
