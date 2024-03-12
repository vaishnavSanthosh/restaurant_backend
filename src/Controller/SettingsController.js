/** @format */

//created on 16-03-22
//#region headers
const express = require("express");
const { checkToken } = require("../Routes/commonRoutes.js");
const settingsService = require("../Routes/settingsRoutes.js");
const { STATUSCODES, ROLES } = require("../Model/enums.js");
const paymentService = require("../Routes/PaymentRoutes.js");
//#endregion

//#region variables
const settings_router = express.Router();
//#endregion

//#region methods
settings_router.post("/", checkToken, async (req, res) => {
  try {
    let result = await settingsService.addSettings(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//added on 30-04-2022
settings_router.post("/designationFiltering", checkToken, async (req, res) => {
  try {
    let result = await settingsService.designationFiltering(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 09-05-2022
settings_router.get("/getDesignations", checkToken, async (req, res) => {
  try {
    let result = await settingsService.getDesignations(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 01-06-22
settings_router.post("/addshift", checkToken, async (req, res) => {
  try {
    let result = await settingsService.addShift(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 06-06-22
settings_router.post("/viewactiveshift", checkToken, async (req, res) => {
  try {
    let result = await settingsService.getCurrentShift(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

settings_router.get("/getLog", checkToken, async (req, res) => {
  try {
    if (req.decode.role == ROLES.ADMIN) {
      let result = await settingsService.getLog(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "Admin Access Only" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 22-06-22
settings_router.post("/addcardcommission", checkToken, async (req, res) => {
  try {
    let result = await settingsService.addCardCommission(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 22-06-22
settings_router.post("/viewcardcommission", checkToken, async (req, res) => {
  try {
    let result = await settingsService.viewCardCommission();
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 22-06-22
settings_router.post("/editcardcommission", checkToken, async (req, res) => {
  try {
    let result = await settingsService.editCardCommission(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 12-07-22
settings_router.post("/viewshiftbyid", checkToken, async (req, res) => {
  try {
    let result = await settingsService.viewShiftByShiftId(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 12-07-22
settings_router.put("/endShift", checkToken, async (req, res) => {
  try {
    let result = await settingsService.endShift(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 21-07-22
settings_router.post("/addBranchShift", checkToken, async (req, res) => {
  try {
    let result = await settingsService.addBranchShift(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 21-07-22
settings_router.post("/viewactiveBranchShift", checkToken, async (req, res) => {
  try {
    let result = await settingsService.getActiveBranchShift();
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-07-22
settings_router.post("/addupicommission", checkToken, async (req, res) => {
  try {
    let result = await settingsService.addUpiCommission(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-07-22
settings_router.post("/viewupicommission", checkToken, async (req, res) => {
  try {
    let result = await settingsService.viewUpiCommission();
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-07-22
settings_router.post("/editupicommission", checkToken, async (req, res) => {
  try {
    let result = await settingsService.editUpiCommission(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 24-07-22
settings_router.post("/addcurrencyexchange", checkToken, async (req, res) => {
  try {
    let result = await settingsService.addCurrencyExchange(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 24-07-22
settings_router.post("/viewcurrencyexchange", checkToken, async (req, res) => {
  try {
    let result = await settingsService.viewExchangeRate(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 26-07-22
settings_router.delete("/deletecardcommision", checkToken, async (req, res) => {
  try {
    let result = await settingsService.deleteCardCommission(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 02-08-22
settings_router.post("/viewusersettings", checkToken, async (req, res) => {
  try {
    let result = await settingsService.viewUserSettings(req.body._id);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 03-08-22
settings_router.post("/addsmsheader", checkToken, async (req, res) => {
  try {
    let result = await settingsService.addSmsHeader(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 04-08-22
settings_router.post(
  "/viewallcurrencyexchanges",
  checkToken,
  async (req, res) => {
    try {
      let result = await settingsService.viewAllExchangeRates(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

//added on 04-08-22
settings_router.post("/viewaddedheaders", checkToken, async (req, res) => {
  try {
    let result = await settingsService.viewAddedHeaders();
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 04-08-22
settings_router.post("/updateHeaderStatus", async (req, res) => {
  try {
    let result = await settingsService.updateHeaderStatus(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 04-08-22
settings_router.post("/addsmstemplate", checkToken, async (req, res) => {
  try {
    let result = await settingsService.addSmsTemplate(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 04-08-22
settings_router.post("/viewaddedtemplates", checkToken, async (req, res) => {
  try {
    let result = await settingsService.viewAddedTemplates();
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 04-08-22
settings_router.post("/updatetemplatestatus", async (req, res) => {
  try {
    let result = await settingsService.updatetemplateStatus(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 10-08-22
settings_router.post(
  "/addShiftTimingSettings",
  checkToken,
  async (req, res) => {
    try {
      let result = await settingsService.addShiftTimingSettings(req.body);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

settings_router.post("/startmanualshift", checkToken, async (req, res) => {
  try {
    if (req.decode.role == ROLES.USER) {
      let result = await settingsService.startManualShift(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "Access Forbidden" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

settings_router.post("/endmanualshift", checkToken, async (req, res) => {
  try {
    if (req.decode.role == ROLES.USER) {
      let result = await settingsService.endManualShift(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "Access Forbidden" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 01-02-23
settings_router.post("/addpointRatio", checkToken, async (req, res) => {
  try {
    let result = await settingsService.addpointRatio(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 30-06-23
settings_router.post("/viewPointRatio", checkToken, async (req, res) => {
  try {
    let result = await settingsService.viewpointRatio(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// Added on 10-07-23
settings_router.post(
  "/shiftTransferOrderInvoices",
  checkToken,
  async (req, res) => {
    try {
      let result = await settingsService.shiftTransferOrderInvoices(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

// Added on 10-07-23
settings_router.post(
  "/shiftTransferOrderView",
  checkToken,
  async (req, res) => {
    try {
      let result = await settingsService.shiftTransferOrderView(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

//Added on 10-07-23
settings_router.post("/viewShifts", checkToken, async (req, res) => {
  try {
    let result = await settingsService.viewShifts(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 11-07-23
settings_router.post("/shiftTransfer", checkToken, async (req, res) => {
  try {
    let result = await settingsService.shiftTransfer(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 07/07/23
settings_router.put(
  "/paymentchangetocashcard",
  checkToken,
  async (req, res) => {
    try {
      result = await paymentService.paymentchangetocashcard(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

// added on 08-07-23
settings_router.post("/fetchPayments", checkToken, async (req, res) => {
  try {
    result = await paymentService.fetchPayments(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 08-07-23
settings_router.post("/addcheque", checkToken, async (req, res) => {
  try {
    let result = await settingsService.addCheque(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 08-07-23
settings_router.get("/viewCheque", checkToken, async (req, res) => {
  try {
    let result = await settingsService.viewCheque(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 10-07-23
settings_router.post("/addUpi", checkToken, async (req, res) => {
  try {
    let result = await settingsService.addUpi(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 10-07-23
settings_router.get("/viewUpi", checkToken, async (req, res) => {
  try {
    let result = await settingsService.viewUpi(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 10-07-23
settings_router.put("/editUpi", checkToken, async (req, res) => {
  try {
    let result = await settingsService.editUpi(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//added on 10/07/23
settings_router.put("/editUtilityPayment", checkToken, async (req, res) => {
  try {
    result = await paymentService.editUtilityPayment(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 11-07-23
settings_router.post("/addDiscount", checkToken, async (req, res) => {
  try {
    let result = await settingsService.addDiscount(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 11-07-23
settings_router.get("/viewDiscount", checkToken, async (req, res) => {
  try {
    let result = await settingsService.viewDiscount(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// Add on 21-07-23
settings_router.get(
  "/getCreditAndPaymentDetails",
  checkToken,
  async (req, res) => {
    try {
      let result = await settingsService.getcreditAndpaymentdetails(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

// Added on 25-07-23
settings_router.delete("/deleteBranch", checkToken, async (req, res) => {
  try {
    let result = await settingsService.deleteBranch(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// Added on 01-08-2023
settings_router.get(
  "/getPaymentAndCreditDetails",
  checkToken,
  async (req, res) => {
    try {
      let result = await settingsService.getPaymentAndCreditDetails(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

// Added on 03-08-2023
settings_router.put("/correctCredits", checkToken, async (req, res) => {
  try {
    let result = await settingsService.correctCredits(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// Added on 03-08-2023
settings_router.put(
  "/updateCategoryAndSubCategory",
  checkToken,
  async (req, res) => {
    try {
      let result = await settingsService.updateCategoryAndSubCategory(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

settings_router.post("/addpaymentDevice", checkToken, async (req, res) => {
  try {
    if (req.settings.settings) {
      let result = await settingsService.addpaymentDevice(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "ACCESS FORBIDDEN" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});

settings_router.get("/viewPaymentDevice", checkToken, async (req, res) => {
  try {
    if (req.settings.settings) {
      let result = await settingsService.viewPaymentDevice(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "ACCESS FORBIDDEN" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});
//#endregion

//#region exports
module.exports = settings_router;
//#endregion
