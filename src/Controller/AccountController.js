//#region headers
const express = require("express");
const { STATUSCODES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes");
const accountService = require("../Routes/AccountRoute.js");

//#endregion

//#region variables
const account_router = express.Router();
//#endregion

// ADDED ON 11/08/23
account_router.post("/", checkToken, async (req, res) => {
    try {
      let result = await accountService.createLedger(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  });

 
account_router.post("/generateLedgergroupCode", checkToken, async (req, res) => {
    try {
      let result = await accountService.generateLedgergroupCode(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  });
 // ADDED ON 16/08/23
 account_router.post("/createBankinvoice", checkToken, async (req, res) => {
    try {
      result = await accountService.createBankinvoice(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      console.error(e);
      res.status(STATUSCODES.ERROR).send({ data: e });
    }
  });
   // ADDED ON 16/08/23
 account_router.post("/chartOfaccounts", checkToken, async (req, res) => {
  try {
    result = await accountService.chartOfaccounts(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});
  // ADDED ON 16/08/23
  account_router.post("/generateBankInvoiceNo", checkToken, async (req, res) => {
    try {
      result = await accountService.generateBankInvoiceNo(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      console.error(e);
      res.status(STATUSCODES.ERROR).send({ data: e });
    }
  });
  // ADDED ON 17/08/23
  account_router.post("/createApinvoice", checkToken, async (req, res) => {
    try {
      result = await accountService.createApinvoice(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      console.error(e);
      res.status(STATUSCODES.ERROR).send({ data: e });
    }
  });
 // ADDED ON 17/08/23
 account_router.post("/createArinvoice", checkToken, async (req, res) => {
  try {
    result = await accountService.createArinvoice(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});
 // ADDED ON 18/08/23
 account_router.post("/createAccouninginvoice", checkToken, async (req, res) => {
  try {
    result = await accountService.createAccouninginvoice(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});
 // ADDED ON 18/08/23
 account_router.post("/createIteminvoice", checkToken, async (req, res) => {
  try {
    result = await accountService.createIteminvoice(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});
// ADDED ON 21/08/23
account_router.post("/purchaseReturninvoice", checkToken, async (req, res) => {
  try {
    result = await accountService.purchaseReturninvoice(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});
// ADDED ON 21/08/23
account_router.post("/salesReturninvoice", checkToken, async (req, res) => {
  try {
    result = await accountService.salesReturninvoice(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});
// ADDED ON 22/08/23
account_router.post("/salesInvoice", checkToken, async (req, res) => {
  try {
    result = await accountService.salesInvoice(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});
// ADDED ON 23/08/23
account_router.post("/ledgerReport", checkToken, async (req, res) => {
  try {
    result = await accountService.ledgerReport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});
  //#region exports
module.exports = account_router;
//#endregion