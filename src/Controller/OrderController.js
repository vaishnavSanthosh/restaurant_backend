//created on 28-01-22
//code on 31-01-22
//#region header
const orderService = require("../Routes/OrderRoute.js");
const express = require("express");
const { STATUSCODES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes.js");
const paymentService = require("../Routes/PaymentRoutes.js");
//#endregion

//#region variable
var order_router = express.Router();
//#endregion

//#region methods
//major change added on 28-02-22 to all methods : autentication middleware

//edited on 23-05-22 -> type changed from get to post
order_router.post("/status", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewOrdersByStatus(req); //added on 23-05-22->changed input from paramater to request.paramater based
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 21-03-22
order_router.post("/billOrder/", checkToken, async (req, res) => {
  try {
    let result = await orderService.billOrder(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 30-04-22
order_router.post("/table/view", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewOrderByTableNumber(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 30-04-22
order_router.post("/addcredit", checkToken, async (req, res) => {
  try {
    let result = await paymentService.addCredit(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 05-05-22
order_router.post("/ordersList", checkToken, async (req, res) => {
  try {
    let result = await orderService.ordersList(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 05-05-22
order_router.get("/payments", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewpayments();
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 06-05-22
order_router.post("/viewcredit", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewCredits(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

order_router.post("/viewwallet", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewwallet(req);
    res.status(result.status).send(result.data);
  } catch {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 10-05-22
order_router.post("/searchinvoice", checkToken, async (req, res) => {
  try {
    let result = await orderService.searchInvoice(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 10-05-22
order_router.post("/addsalesreturn", checkToken, async (req, res) => {
  try {
    let result = await orderService.addSalesReturn(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 11-05-22
order_router.post("/holdorder", checkToken, async (req, res) => {
  try {
    let result = await orderService.holdOrder(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 11-05-22
order_router.put("/payorder", checkToken, async (req, res) => {
  try {
    let result = await orderService.payorder(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

order_router.post("/salesReport", checkToken, async (req, res) => {
  try {
    let result = await orderService.salesReport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

order_router.post("/viewOrderInvoiceNo", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewOrderInvoiceNo(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//Edited on 14-07-23
order_router.post("/paymentReport", checkToken, async (req, res) => {
  try {
    let result = await orderService.paymentReport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

order_router.get("/paymentFilter", checkToken, async (req, res) => {
  try {
      let result = await orderService.paymentFilter(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 16-05-2022
order_router.post("/getSalesReturn", checkToken, async (req, res) => {
  try {
      let result = await orderService.getSalesReturn(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

order_router.post("/getPaymentInvoices", checkToken, async (req, res) => {
  try {
      let result = await orderService.getPaymentInvoices(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

order_router.post("/getReturnInvoices", checkToken, async (req, res) => {
  try {
      let result = await orderService.getReturnInvoices(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 18-05-22
order_router.post("/addmesspackage", checkToken, async (req, res) => {
  try {
    let result = await orderService.addMessPackage(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 18-05-22
order_router.post("/getmesspackage", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewMessPackage(req);
    res.status(result.status).send(result.data);
  } catch {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 18-05-22
order_router.post("/getmesspackagesingle", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewMessPackageSingle(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 18-05-22
order_router.put("/editmesspackage", checkToken, async (req, res) => {
  try {
    let result = await orderService.editMessPackage(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 19-05-22
order_router.post("/generatemessid", checkToken, async (req, res) => {
  try {
    let result = await orderService.generateMessId();
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 19-05-22
order_router.post("/addmess", checkToken, async (req, res) => {
  try {
    let result = await orderService.addMess1(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 19-05-22
order_router.get("/getmess", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewMess(req);
    res.status(result.status).send(result.data);
  } catch {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 19-05-22
order_router.get("/getmesssingle", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewMessSingle(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    req.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-05-22
order_router.post("/ordersingle", checkToken, async (req, res) => {
  try {
    let result = await orderService.vieworderSingle(req.body._id);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-05-22
order_router.put("/editmess", checkToken, async (req, res) => {
  try {
    let result = await orderService.editMess(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 07-06-22
order_router.post("/viewsaleslist", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewSalesOrderList();
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 10-06-22
order_router.post("/filterorder", checkToken, async (req, res) => {
  try {
    let result = await orderService.findOrderReturn(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 10-06-22
order_router.post("/billview", checkToken, async (req, res) => {
  try {
    let result = await orderService.billView(req.body._id);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//added on 09-07-22
order_router.post("/viewallcustomercredits", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewCreditOfCustomer(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 09-07-22
order_router.post("/viewsalesreturnbyid", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewSalesReturnSingle(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.send(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 09-07-22
order_router.post("/vieworderbyid", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewOrderSingle(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 12-07-22
order_router.post("/dailyreport", checkToken, async (req, res) => {
  try {
    let result = await orderService.dailyReport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 14-07-22
order_router.post("/addholdOrder", checkToken, async (req, res) => {
  try {
    let result = await orderService.addholdOrder(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 16-07-22
order_router.post("/viewheldOrder", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewHeldOrder(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 16-07-22
order_router.delete("/deleteheldorder", checkToken, async (req, res) => {
  try {
    let result = await orderService.deleteHeldOrder(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

order_router.post("/printinvoice", checkToken, async (req, res) => {
  try {
    let result = await orderService.printInvoice(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-07-22
order_router.post("/dailycashcardreport", checkToken, async (req, res) => {
  try {
    let result = await orderService.dailyCashCardReport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 29-06-2023
order_router.post("/getcreditsofacustomer", checkToken, async (req, res) => {
  try {
    let result = await orderService.getCreditsOfACustomer(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 27-06-2023
order_router.get("/viewCatogeries", checkToken, async (req, res) => {
try {
  let result = await orderService.viewCategories(req);
  res.status(result.status).send(result.data);
} catch (e) {
  res.status(STATUSCODES.ERROR).send({ data: e.message });
}
});

//added on 27-06-2023
order_router.get("/viewAvailableItems", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewAvailableItems(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 02-07-23
order_router.post("/viewsalespayments", checkToken, async (req, res) => {
  try {
    let result = await orderService.viewsalespayments(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 06-07-2023
order_router.post("/getOrderNosSalesReturn", checkToken, async (req, res) => {
  try {
    let result = await orderService.getOrderNoSalesReturn(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 06-07-2023
order_router.post("/orderDetailsSalesReturn", checkToken, async (req, res) => {
  try {
    let result = await orderService.orderDetailsSalesReturn(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 13-07-23
order_router.delete("/deleteSalesReturn", checkToken, async (req, res) => {
  try {
    let result = await orderService.deleteSalesReturn(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 14-07-23
order_router.post("/stockReport", checkToken, async (req, res) => {
  try {
    let result = await orderService.stockReport(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

order_router.put("/editSalesReturn", checkToken, async (req, res) => {
  try {
    let result = await orderService.editSalesReturn(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 25-07-23
order_router.post("/updateCredit", checkToken, async (req, res) => {
  try {
    result = await orderService.updateCredit(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send(result.data);
  }
});
//added on 25-07-23 
order_router.post("/invoiceview", checkToken, async (req, res) => {
  try {
    let result = await orderService.invoiceView(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});

//added on 17-08-23
order_router.post("/searchproducts", checkToken, async (req, res) => {
  try {
    let result = await orderService.searchProduct(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});

//#region exports
module.exports = order_router;
//#endregion
