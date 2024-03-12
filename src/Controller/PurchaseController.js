//#region headers
const { STATUSCODES, PREFIXES } = require("../Model/enums");
const purchaseService = require("../Routes/PurchaseRoutes.js");
const express = require("express");
const {
  checkToken,
  checkObject,
  isObjectId,
} = require("../Routes/commonRoutes");
const prodService = require("../Routes/ProductRoutes.js");
const { purchase } = require("../../userDbConn");
//#endregion

//#region variables
const purchaseRouter = express.Router();
//#endregion

//#region methods
//major change added on 28-02-22 to all methods : autentication middleware
purchaseRouter.post("/", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.addPurchase(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//changed routename on 07-04-22 from get->/ to get->/view
purchaseRouter.post("/view", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewPurchases(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

purchaseRouter.get("/search", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.purchaseSearch(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 28-01-22
//edited on 12-04-22
purchaseRouter.put("/stockout/", checkToken, async (req, res) => {
  try {
    let result = await prodService.updateProductStock(req.body); //method re coded on 12-04-22-> re routed to product insted of food
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 31-01-2022
//edited on 01-02-22
purchaseRouter.post("/purchasereport", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewpurchaseReport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 26-04-2022
purchaseRouter.get(
  "/viewSinglePurchaseReport",
  checkToken,
  async (req, res) => {
    try {
      let result = await purchaseService.viewSinglePurchaseReport(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

//added on 06-04-22
purchaseRouter.post("/generateinvoiceno", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.generateInvoiceNo(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 08-04-22
purchaseRouter.post("/generateinvoicenowpo", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.generateInvoiceNoWoPo(req);
    res
      .status(result.status)
      .send({ transNo: result.data, prefix: PREFIXES.PURCHASEWPO });
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 08-04-22
purchaseRouter.post("/addpurchasewpo", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.addPurchaseWopo(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 11-04-22
purchaseRouter.post("/searchinvoice", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.searchInvoice(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 12-04-22
purchaseRouter.get("/stockoutview", checkToken, async (req, res) => {
  try {
    let result = await prodService.viewStockOutProduct(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 14-03-22
purchaseRouter.post("/addtransferno", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.generatetransferNo(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 19-04-22
purchaseRouter.post("/listinvoices", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.invoiceList(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 25-04-2022
purchaseRouter.get("/viewtransfers", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewtransfers(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

purchaseRouter.post(
  "/viewSingleTransferReport",
  checkToken,
  async (req, res) => {
    try {
      let result = await purchaseService.viewSingleTransferReport(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

//added on 28-04-2022
purchaseRouter.post("/getTransNo", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.getTransNo(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 06-05-2022
purchaseRouter.post(
  "/generateStockAdjustmentTransNo",
  checkToken,
  async (req, res) => {
    try {
      let result = await purchaseService.generateStockAdjustmentTransNo(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

purchaseRouter.post("/addStockAdjustment", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.addStockAdjustment(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

purchaseRouter.get("/getGlLinkCode", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.getGlLinkCode(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

purchaseRouter.get("/getGlCode", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.getGlCode(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

purchaseRouter.get("/getSlCode", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.getSlCode(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

purchaseRouter.get("/generateStockAdjTransNo", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.generateStockAdjTransNo(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

purchaseRouter.post("/stockAdjustmentReport", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.stockAdjustmentReport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

purchaseRouter.post(
  "/stockAdjustmentReportSingle",
  checkToken,
  async (req, res) => {
    try {
      let result = await purchaseService.stockAdjustmentReportSingle(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

purchaseRouter.put("/editStockAdjustmentTemp", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.editStockAdjustmentTemp(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

purchaseRouter.post("/viewconfirmstock", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewConfirmStockAdjustments(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 12-06-23
purchaseRouter.post("/viewpurchaseinfobyid", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewpurchaseById(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 22-07-2022
purchaseRouter.get("/getStockAdjOfFromLoc", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.getStockAdjOfFromLoc(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 09-06-2023
purchaseRouter.post("/viewInvoiceNumbers", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewInvoiceNumbers(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 15-06-23
purchaseRouter.put("/reciveStock", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.recieveStock(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
purchaseRouter.put("/confirmStock", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.confirmStock(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

purchaseRouter.post("/draftStkAdj", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.draftStkAdj(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 21-06-23
purchaseRouter.post("/viewDraft", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewDraftAdj(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 21-06-2023
purchaseRouter.post("/viewDraftAdjById", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewDraftAdjById(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 22-06-23
purchaseRouter.post("/stockAdjustmentList", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.stockAdjustmentList(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 22-06-23
purchaseRouter.post(
  "/stockAdjustmentListById",
  checkToken,
  async (req, res) => {
    try {
      let result = await purchaseService.stockAdjustmentListById(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

// added on
purchaseRouter.post("/addGrn", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.addgrn(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 26-06-23
purchaseRouter.post("/viewGrn", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewGrn(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 27-06-23
purchaseRouter.get("/grnById", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewGRNbyId(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 27-06-23
purchaseRouter.post("/addGrnDraft", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.grnDRAFT(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 28-06-23
purchaseRouter.get("/viewgrnDraft", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewGrnDraft(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 28-06-23
purchaseRouter.get("/viewgrndraftById", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewGrndraftById(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 06/07/23
purchaseRouter.post("/purchasewopoReport", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.purchasewopoReport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 11-07-23
purchaseRouter.post("/addStockTransfer", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.addStockTransfer(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// addedon 11-07-23
purchaseRouter.post("/recieveTransfer", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.receivedTransfers(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 12-07-23
purchaseRouter.post("/confirmTransfer", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.confirmTransfers(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 12-07-23
purchaseRouter.post("/transferSingleView", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.transferSingleView(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 12-07-23
purchaseRouter.put("/editTransfer", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.editTransfer(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 13-07-23
purchaseRouter.post("/transferReport", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.transferReport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 14/07/23
purchaseRouter.post("/GrnReport", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.grnReport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 14/07/23
purchaseRouter.post("/singleGrnreport", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.singleGrnreport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// viewProductsForPurchase
purchaseRouter.post(
  "/viewProductsForPurchase",
  checkToken,
  async (req, res) => {
    try {
      let result = await purchaseService.viewProductsForPurchase(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

//added on 24-07-23
purchaseRouter.post(
  "/viewReturnInvoiceNumbers",
  checkToken,
  async (req, res) => {
    try {
      // if (req.decode.role == ROLES.USER) {
      let result = await purchaseService.viewpurchasereturninvoicenumbers(req);
      res.status(result.status).send(result.data);
      // } else {
      //   res.status(STATUSCODES.FORBIDDEN).send({ data: "Access forbidden" });
      // }
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e });
    }
  }
);

//added on 24-07-23
purchaseRouter.post(
  "/viewpurchasereturninfos",
  checkToken,
  async (req, res) => {
    try {
      let result = await purchaseService.viewReturnObjectInfos(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

//added on 24-07-23
purchaseRouter.post(
  "/generatePurchaseReturnId",
  checkToken,
  async (req, res) => {
    try {
      let result = await purchaseService.generatePurchaseReturnId(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

//added on 24-07-23
purchaseRouter.post("/addpurchasereturn", checkToken, async (req, res) => {
  try {
    result = await purchaseService.addPurchaseReturn(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 25-07-23
purchaseRouter.post("/viewPurchaseReturn", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewPurchaseReturn(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 25-07-23
purchaseRouter.post("/generateVoucherId", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.generateVoucherId(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 26-07-23
purchaseRouter.post("/viewPurchaseReturnById", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewPurchaseReturnById(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on  26-07-23
purchaseRouter.post("/generateGrnId", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.generateGrnId(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 26-07-23
purchaseRouter.delete("/deletePurchaseReturn", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.deletePurchaseReturn(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 02-08-23
purchaseRouter.post(
  "/deletePurchaseSectionData",
  checkToken,
  async (req, res) => {
    try {
      let result = await purchaseService.deletePurchaseSectionData(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

//added on 31-07-23
purchaseRouter.put("/editpurchasereturn", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.editPurchasereturn(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 02-08-23
purchaseRouter.post(
  "/deletePurchaseSectionData",
  checkToken,
  async (req, res) => {
    try {
      let result = await purchaseService.deletePurchaseSectionData(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

// added on 03-08-23
purchaseRouter.post("/addstockouts", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.addstockouts(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 03-08-23
purchaseRouter.post("/approveStokeout", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.approveStockOut(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 03-08-23
purchaseRouter.post("/viewStockOuts", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.viewStockOuts(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 4-08-23
purchaseRouter.post("/viewstockadj", checkToken, async (req, res) => {
  try {
    result = await purchaseService.viewStkAdjustment(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 17-08-23
purchaseRouter.post("/paymentvoucher", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.PaymentVoucher(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// Added on 17-08-23
purchaseRouter.post("/pendingPaymentVoucher", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.pendingPaymentVoucher(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// Added on 22-08-23
purchaseRouter.post(
  "/ViewSinglePaymentVoucher",
  checkToken,
  async (req, res) => {
    try {
      let result = await purchaseService.ViewSinglePaymentVoucher(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

// added on 23-08-23
purchaseRouter.post("/generateTrasactionId", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.generateTrasactionId(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 08-09-23
purchaseRouter.post("/getAllTransfers", checkToken, async (req, res) => {
  try {
    let result = await purchaseService.getAllTransfers(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});
//#endregion

//#region exports
module.exports = purchaseRouter;
//#endregion
