/** @format */

//created on 15-03-22
//#region headers
const express = require("express");
const { checkToken } = require("../Routes/commonRoutes");
const quatationService = require("../Routes/SalesRoutes.js");
const { STATUSCODES } = require("../Model/enums");
//#endregion

//#region variables
const sale_router = express.Router();
//#endregion

//#region methods
sale_router.post("/addQuotation", checkToken, async (req, res) => {
  try {
    let result = await quatationService.addQuotation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 06/07/23 removed params
sale_router.put("/editQuotation", checkToken, async (req, res) => {
  try {
    let result = await quatationService.editQuotation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 06/07/23 removed params
sale_router.post("/getSingleQuotation", checkToken, async (req, res) => {
  try {
    let result = await quatationService.getSingleQuotation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

sale_router.post("/getQuotation", checkToken, async (req, res) => {
  try {
    let result = await quatationService.getQuotation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

sale_router.post("/getActiveQuotation", checkToken, async (req, res) => {
  try {
    let result = await quatationService.getActiveQuotation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

sale_router.post("/getQuotationByMonth", checkToken, async (req, res) => {
  try {
    let result = await quatationService.getQuotationByMonth(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 06/07/23 removed params
sale_router.delete("/deleteQuotation", checkToken, async (req, res) => {
  try {
    let result = await quatationService.deleteQuotation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = sale_router;
//#endregion
