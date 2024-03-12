/** @format */

//#region headers
const leave_service = require("../Routes/LeaveRoute.js");
const express = require("express");
const { STATUSCODES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes.js");
//#endregion

//#region variables
const leave_router = express.Router();
//#endregion

//#region methods
//major change added on 28-02-22 to all methods : autentication middleware
//added on 26-01-22
leave_router.post("/holiday", checkToken, async (req, res) => {
  try {
    let result = await leave_service.addHoliday(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// edited on 21/06/23
leave_router.get("/viewholiday", checkToken, async (req, res) => {
  try {
    let result = await leave_service.viewHolidays(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// edited on 21/06/23
leave_router.get("/viewSingleholiday", checkToken, async (req, res) => {
  try {
    let result = await leave_service.viewSingleHoliday(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// edited on 21/06/23
leave_router.put("/editHoliday", checkToken, async (req, res) => {
  try {
    let result = await leave_service.editHolidays(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

leave_router.delete("/deleteHoliday", checkToken, async (req, res) => {
  try {
    let result = await leave_service.deleteHolidays(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 20-06-23
leave_router.post("/leaveType", checkToken, async (req, res) => {
  try {
    let result = await leave_service.addLeaveType(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 20-06-23
leave_router.get("/leaveType", checkToken, async (req, res) => {
  try {
    let result = await leave_service.viewLeavetype(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 20-06-23
leave_router.put("/editLeaveType", checkToken, async (req, res) => {
  try {
    result = await leave_service.editLeaveType(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
leave_router.delete("/deleteLeaveType", checkToken, async (req, res) => {
  try {
    result = await leave_service.deleteLeaveType(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
leave_router.post("/staffLeave", checkToken, async (req, res) => {
  try {
    result = await leave_service.staffLeave(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 08-02-23
leave_router.post("/viewStaffLeave", checkToken, async (req, res) => {
  try {
    result = await leave_service.viewStaffLeave(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
leave_router.put("/approveLeave", checkToken, async (req, res) => {
  try {
    result = await leave_service.approveLeave(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 20-06-23
leave_router.delete("/deleteStaffLeave", checkToken, async (req, res) => {
  try {
      result = await leave_service.deleteStaffLeave(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
// added on 08-08-23
leave_router.post("/totalLeaveofanEmployee", checkToken, async (req, res) => {
  try {
    result = await leave_service.totalLeaveofanEmployee(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
// added on 08-08-23
leave_router.post("/leaveDetails", checkToken, async (req, res) => {
  try {
    result = await leave_service.leaveDetails(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = leave_router;
//#endregion
