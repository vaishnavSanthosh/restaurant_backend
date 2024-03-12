/** @format */

//#region headers
const { STATUSCODES, PREFIXES } = require("../Model/enums.js");
const emp_service = require("../Routes/EmployeeRoutes.js");
const express = require("express");
const { checkToken } = require("../Routes/commonRoutes.js");
//#endregion

//#region variables
const emp_router = express.Router();
//#endregion

//#region methods
//major change added on 28-02-22 to all methods : autentication middleware
emp_router.post("/", checkToken, async (req, res) => {
  try {
    let result = await emp_service.addEmployee(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
// changed from get to post on 24/06/23

emp_router.post("/viewAllEmployees", checkToken, async (req, res) => {
  try {
    let result = await emp_service.viewAllEmployees(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 14-06-23
emp_router.put("/addcompanyinfo/", checkToken, async (req, res) => {
  try {
    let result = await emp_service.addEmployeeInfo(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 15/06/23
emp_router.post("/viewSingleemployeeByid", checkToken, async (req, res) => {
  try {
    let result = await emp_service.viewSingleEmployee(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// edited on 15/06/23
emp_router.delete("/deleteEmployee", checkToken, async (req, res) => {
  try {
    let result = await emp_service.deleteEmployee(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 17-03-22
emp_router.put("/editEmployee", checkToken, async (req, res) => {
  try {
    let result = await emp_service.editEmployeeDetails(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 07-03-22
emp_router.post("/clickqrcode", checkToken, async (req, res) => {
  try {
    let result = await emp_service.addEmpQrcode(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 19-04-22
emp_router.post("/designationfilter", checkToken, async (req, res) => {
  try {
    let result = await emp_service.getEmployeeByDesignation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// edited on 15/06/23
emp_router.post("/docs", checkToken, async (req, res) => {
  try {
    let result = await emp_service.addDocument(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 14/06/23
emp_router.post("/docs/", checkToken, async (req, res) => {
  try {
    let result = await emp_service.viewDocuments(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

emp_router.put("/editdocs", checkToken, async (req, res) => {
  try {
    let result = await emp_service.editDocuments(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// edited on 14/06/23
emp_router.delete("/deletedocs", checkToken, async (req, res) => {
  try {
    let result = await emp_service.deleteDocuments(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 20-06-23
emp_router.post("/payroll", checkToken, async (req, res) => {
  try {
    let result = await emp_service.addPayroll(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
emp_router.get("/viewPayroll", checkToken, async (req, res) => {
  try {
    let result = await emp_service.viewPayroll(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
emp_router.post("/payrollViewById", checkToken, async (req, res) => {
  try {
    let result = await emp_service.payrollViewById(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
emp_router.post("/payrollNotranseGen", checkToken, async (req, res) => {
  try {
    let result = await emp_service.payrollNotranseGen(req);
    res
      .status(result.status)
      .send({ transeNo: result.data, prefix: PREFIXES.PAYROLL });
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
emp_router.put("/editPayroll", checkToken, async (req, res) => {
  try {
    result = await emp_service.editPayroll(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
emp_router.delete("/deletePayroll", checkToken, async (req, res) => {
  try {
    result = await emp_service.deletePayroll(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 14-03-22
emp_router.post("/loans", checkToken, async (req, res) => {
  try {
    let result = await emp_service.addLoan(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 14-03-22
emp_router.get("/loans/view", checkToken, async (req, res) => {
  try {
    let result = await emp_service.viewLoans(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 14-03-22
//edited on 11/07/23
emp_router.get("/loans/generateloanid", checkToken, async (req, res) => {
  try {
    let result = await emp_service.generateLoanId(req);
    res.status(result.status).send({ data: result.data });
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-03-22
//edited on 15/06/23
emp_router.get("/documents/list", checkToken, async (req, res) => {
  try {
    let result = await emp_service.viewdocuments(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 24-05-22
emp_router.post("/addattendance", checkToken, async (req, res) => {
  try {
    let result = await emp_service.addAttendance(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 25-05-22
emp_router.put("/addbreakout", checkToken, async (req, res) => {
  try {
    let result = await emp_service.addBreakOut(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 25-05-22
emp_router.put("/addbreakin", checkToken, async (req, res) => {
  try {
    let result = await emp_service.addBreakIn(req);
    res.status(result.status).send(result.data);
  } catch {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 26-05-22
emp_router.put("/endschedule", checkToken, async (req, res) => {
  try {
    let result = await emp_service.endSchedule(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 27-05-22
emp_router.post("/viewattendance", checkToken, async (req, res) => {
  try {
    let result = await emp_service.viewAttendanceList(req);
    res
      .status(result.status)
      .send({ data: result.data, total_Staff: result.total_Staff });
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 28-05-22
//edited on 16/06/23
emp_router.post("/loans/employeeView", checkToken, async (req, res) => {
  try {
    let result = await emp_service.viewLoansOfAnEmployee(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 31-05-22
//edited on 16/06/23
emp_router.post("/loans/single", checkToken, async (req, res) => {
  try {
    let result = await emp_service.viewLoanSingle(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 25-06-22
//added and assembled on 14-07-22
//edited on 16/06/23
emp_router.post("/viewallemployeesinbranch", checkToken, async (req, res) => {
  try {
    let result = await emp_service.viewAllEmployeesInABranch(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 19-06-23
emp_router.put("/removeemployeefromdb", checkToken, async (req, res) => {
  try {
    result = await emp_service.removeEmployeeFromDB(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 20-06-23
emp_router.put("/updateemployeecredentials", checkToken, async (req, res) => {
  try {
    result = await emp_service.updateEmpLogin(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 26-01-23
emp_router.post("/addDocumentsType", checkToken, async (req, res) => {
  try {
    result = await emp_service.addDocumentType(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
emp_router.post("/viewDocumentType", checkToken, async (req, res) => {
  try {
    result = await emp_service.viewDocumentType(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
emp_router.put("/editDocumentsTypes", checkToken, async (req, res) => {
  try {
    result = await emp_service.editDocumentsType(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
emp_router.delete("/deletedocumentTypes", checkToken, async (req, res) => {
  try {
    result = await emp_service.deleteDocumentType(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 16-06-23
emp_router.post("/addNewLoan", checkToken, async (req, res) => {
  try {
    result = await emp_service.addNewLoan(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 16-06-23
emp_router.get("/viewNewLoan", checkToken, async (req, res) => {
  try {
    result = await emp_service.viewNewLoan(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
// addedon 20-06-23
emp_router.post("/addDocumentationUrl", checkToken, async (req, res) => {
  try {
    result = await emp_service.addDocumentationUrl(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 22-06-23
emp_router.put("/approveLoan", checkToken, async (req, res) => {
  try {
    result = await emp_service.approveLoan(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
emp_router.post("/addLeaveType", checkToken, async (req, res) => {
  try {
    result = await emp_service.addLeaveType(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
// added on 08-08-23
emp_router.post("/totalSalarypaid", checkToken, async (req, res) => {
  try {
    result = await emp_service.totalSalarypaid(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

emp_router.post("/editloanApprovel", checkToken, async (req, res) => {
  try {
    result = await emp_service.editloanApprovel(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = emp_router;
//#endregion
