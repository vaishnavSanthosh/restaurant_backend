//#region headers
const express = require("express");
const { STATUSCODES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes");
const fd_availableService = require("../Routes/FoodAvailableRoutes.js");

//#endregion

//#region variables
const food_router = express.Router();
//#endregion

//#region methods //major change added to all methods on 28-02-22 middleware for authentication , token decode ,
food_router.post("/", checkToken, async (req, res) => {
  try {
    let result = await fd_availableService.addFoodAvailable(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

food_router.post("/viewFoodAvailable", checkToken, async (req, res) => {
  try {
    let result = await fd_availableService.viewFoodAvailable(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

food_router.post("/singleFoodAvailable", checkToken, async (req, res) => {
  try {
    let result = await fd_availableService.viewFoodSingle(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

food_router.delete("/deleteFoodAvailable", checkToken, async (req, res) => {
  try {
    let result = await fd_availableService.deleteFoodAvailable(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

food_router.put("/editFoodAvailable", checkToken, async (req, res) => {
  try {
    let result = await fd_availableService.editFoodAvailable(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = food_router;
//#endregion
