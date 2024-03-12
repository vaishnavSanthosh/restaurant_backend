/** @format */

//created on 09-02-2022
//#region headers
const express = require("express");
const { STATUSCODES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes");
const stockService = require("../Routes/StockRoutes.js");
//#endregion

//#region variables
const stock_router = express.Router();
//#endregion

//#region methods
stock_router.get("/stockreport", checkToken, async (req, res) => {
  try {
    let result = await stockService.stockReport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message })
  }
});

//added on 20-07-23
stock_router.post("/viewstocklogdetails", checkToken, async (req, res) => {
  try {
    result = await stockService.viewStockEntryDetails(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 20-07-23
stock_router.post("/finditemsinorder", checkToken, async (req, res) => {
  try {
    result = await stockService.findItemsInOrder(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//added on 29-07-23
stock_router.post("/stockSummeryReport", checkToken, async (req, res) => {
  try {
    let result = await stockService.stockSummaryReport(req);
    // let result = await stockService.STOCKSUMMARYREPORT(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = stock_router;
//#endregion
