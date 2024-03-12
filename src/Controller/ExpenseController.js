//#region header
// added on 31-08-22
const expense_service = require("../Routes/ExpenseRoutes");
const express = require("express");
const { STATUSCODES, ROLES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes");

//#endregion

//#region variables
const expenseController = express.Router();
//#endregion

//#region methods
// added on 31-08-22

expenseController.post("/addExpense", checkToken, async (req, res) => {
  try {
    let result = await expense_service.addExpense(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 31-08-22
expenseController.post("/viewExpense", checkToken, async (req, res) => {
  try {
    let result = await expense_service.viewExpenses(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 31-08-22
expenseController.post("/viewExpenseById", checkToken, async (req, res) => {
  try {
    let result = await expense_service.viewExpenseById(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 31-08-22
expenseController.put("/editExpense", checkToken, async (req, res) => {
  try {
    let result = await expense_service.editExpense(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 31-08-22
// expenseController.put("/deleteExpense", checkToken, async (req, res) => {
//   try {
//     let result = await expense_service.deleteExpense(req);
//     res.status(result.status).send(result.data);
//   } catch (e) {
//     console.error(e);
//     res.status(STATUSCODES.ERROR).send({ data: e });
//   }
// });

// added on 01-09-22
expenseController.post("/addexpenseType", checkToken, async (req, res) => {
  try {
    if (req.decode.role == ROLES.USER) {
      let result = await expense_service.addExpenseType(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "Access Forbidden" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 01-09-22
expenseController.post("/viewexpenseType", checkToken, async (req, res) => {
  try {
    let result = await expense_service.viewExpenseType(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 01-09-22
expenseController.put("/editexpenseType", checkToken, async (req, res) => {
  try {
    let result = await expense_service.editExpenseType(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 01-09-22
expenseController.delete("/deleteexpenseType", checkToken, async (req, res) => {
  try {
    let result = await expense_service.deleteexpenseType(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 01-09-22
expenseController.post("/addoutletExpense", checkToken, async (req, res) => {
  try {
    let result = await expense_service.addOutletExpense(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 01-09-22
expenseController.post("/viewoutletExpense", checkToken, async (req, res) => {
  try {
    let result = await expense_service.viewoutletExpense(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 07-09-22
expenseController.post("/addpettyCash", checkToken, async (req, res) => {
  try {
    let result = await expense_service.addPettycash(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 07-09-22
expenseController.post("/viewPettyCash", checkToken, async (req, res) => {
  try {
    let result = await expense_service.viewPettyCash(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 07-09-22
expenseController.put("/editPettyCash", checkToken, async (req, res) => {
  try {
      let result = await expense_service.editPettyCash(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 15-10-22
expenseController.post("/generateexpensetypeno", checkToken, async (req, res) => {
    try {
      let result = await expense_service.generateExpenseTypeNumber(req);
      res.status(result.status).send(result);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

//added on 15-10-22
expenseController.post("/generateoutletexpenseno", checkToken, async (req, res) => {
    try {
      let result = await expense_service.generateOutletExpenseNumber(req);
      res.status(result.status).send(result);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

//added on 15-10-22
expenseController.post("/generatepettycashno", checkToken, async (req, res) => {
  try {
    let result = await expense_service.generatePettyCashExpenseNumber(req);
    res.status(result.status).send(result);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 24-10-22
expenseController.get("/getpettybalance", checkToken, async (req, res) => {
  try {
    let result = await expense_service.fetchBalance(req);
    res.status(result.status).send(result);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 27-04-2022
expenseController.post("/editOutexpense", checkToken, async (req, res) => {
  try {
      let result = await expense_service.editOutletExpense(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 07-11-22
expenseController.post("/viewexpensebydate", checkToken, async (req, res) => {
  try {
    let result = await expense_service.viewexpensebydate(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

expenseController.post("/viewExpenseReport", checkToken, async (req, res) => {
  try {
      let result = await expense_service.viewExpenseReport(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = expenseController;
//#endregion
