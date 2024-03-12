//created on 18-02-22
//#region headers
const express = require("express");
const { STATUSCODES } = require("../Model/enums.js");
const { checkToken } = require("../Routes/commonRoutes.js");
const rewardService = require("../Routes/RewardRoutes.js");
//#endregion

//#region variables
const rewardRouter = express.Router();
//#endregion

//#region methods
//major change added on 28-02-22 to all methods : autentication middleware
rewardRouter.post("/", checkToken, async (req, res) => {
  try {
      let result = await rewardService.addreward(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 21-02-22
rewardRouter.get("/customer/view/:phoneNumber", checkToken, async (req, res) => {
    try {
        let result = await rewardService.getCustomer(req);
        res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

//added on 21-02-22
rewardRouter.post("/addcustomer", checkToken, async (req, res) => {
  try {
    let result = await rewardService.addCustomer(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 21-02-22
//edited on 22-03-22 endpoint corrected
//edited on 28/06/23
rewardRouter.post("/getRewardPointByProdId", checkToken, async (req, res) => {
  try {
    let result = await rewardService.getRewardPointByProdId(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-07-22
//edited on 27/06/23
rewardRouter.post("/customerlist", checkToken, async (req, res) => {
  try {
    let result = await rewardService.viewCustomerWithPoints(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 24-07-22
rewardRouter.post("/rewardlist", checkToken, async (req, res) => {
  try {
    let result = await rewardService.viewRewardList(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 27-07-22
rewardRouter.put("/editreward", checkToken, async (req, res) => {
  try {
    let result = await rewardService.editRewards(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 27-07-22
rewardRouter.delete("/deletereward", checkToken, async (req, res) => {
  try {
    let result = await rewardService.deleteReward(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = rewardRouter;
//#endregion
