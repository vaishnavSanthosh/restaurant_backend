//created on 17-02-2022
//#region header
const express = require("express");
const { STATUSCODES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes");
const offerService = require("../Routes/OfferRoutes.js");
//#endregion

//#region variables
const offerRouter = express.Router();
//#endregion

//#region methods
//added on 17-02-2022
//major change added on 28-02-22 to all methods : autentication middleware
offerRouter.post("/", checkToken, async (req, res) => {
  try {
    let result = await offerService.addOffer(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 17-02-2022
offerRouter.post("/viewOffers", checkToken, async (req, res) => {
  try {
    let result = await offerService.viewOffers(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 21-02-2022
offerRouter.post("/viewOfferSingle", checkToken, async (req, res) => {
  try {
    let result = await offerService.viewOfferSingle(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 22-02-22
offerRouter.put("/offerImage", checkToken, async (req, res) => {
  try {
    let result = await offerService.addFestivalImage(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 20-06-22
offerRouter.put("/editoffer", checkToken, async (req, res) => {
  try {
    let result = await offerService.editOffer(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 20-06-22
offerRouter.delete("/deleteOffer", checkToken, async (req, res) => {
  try {
    let result = await offerService.deleteOffer(req.body._id);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = offerRouter;
//#endregion
