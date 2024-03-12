//added on 30-04-2022
//#region headers
const express = require("express");
const dashBoardRouter = express.Router();
const { STATUSCODES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes.js");
const dashboardService = require("../Routes/DashboardRoute.js");
//#endregion

//#region routes
//added on 04-05-2022
dashBoardRouter.post("/totalItem", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.totalItem(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.post("/totalReservations", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.totalReservations(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.post("/totalRevenue", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.totalRevenue(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.post("/orderList", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.orderList(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.post("/totalCredit", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.totalCredit(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.post("/totalStaffExpense", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.totalStaffExpense(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.post("/totalPurchaseExpense", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.totalPurchaseExpense(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.post("/customerRate", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.customerRate(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.post("/totalRevenueGraph", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.totalRevenueGraph(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 09-05-2022 for staff dashboard
dashBoardRouter.get("/getEmployeeCount", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.getEmployeeCount(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.get("/getTotalDepartments", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.getTotalDepartments(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.post("/getTotalExpense", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.getTotalExpense(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.get("/totalExpenseGraph", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.totalExpenseGraph(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.get("/getNotifications", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.getNotifications(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dashBoardRouter.get("/noticeBoard", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.noticeBoard(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 06-07-22
//added and assembled on 14-07-22
dashBoardRouter.post("/quickaccess", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.addQuickAccess(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 07-07-22
//added and assembled on 14-07-22
dashBoardRouter.post("/getquickaccess", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.getQuickAccess();
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// Added on 12-07-23
dashBoardRouter.get("/viewProductList", checkToken, async (req, res) => {
  try {
    let result = await dashboardService.viewProductList(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 11/07/23
dashBoardRouter.post("/viewStaffExpiredDocument", checkToken, async (req, res) => {
    try {
      result = await dashboardService.viewStaffExpiredDocument(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

// added on 12-07-23
dashBoardRouter.post("/fastSelling", checkToken, async (req, res) => {
  try {
      result = await dashboardService.fastSelling(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
// added on 25-07-23
dashBoardRouter.post("/creditdetails", checkToken, async (req, res) => {
  try {
    // if (req.settings.settings) {
      result = await dashboardService.creditDetails(req);
      res.status(result.status).send(result.data);
    // } else {
    //   res.status(STATUSCODES.FORBIDDEN).send({ data: "ACCESS FORBIDEN" });
    // }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports

module.exports = dashBoardRouter;

//#endregion
