/** @format */

//#region headers
const { STATUSCODES, STAFFLEAVE, LOG } = require("../Model/enums");
const common_service = require("../Routes/commonRoutes.js");
// const desg_service = require("../Routes/DesignationRoute.js");
// const dep_service = require("../Routes/DepartmentRoutes.js");
const emp_service = require("../Routes/EmployeeRoutes.js"); //added on 02--03--22
const conn = require("../../userDbConn");
//#endregion

//#region methods

//edited on 21-06-23
module.exports.addHoliday = async (req) => {
  const { holidayModel } = conn.leave(req.decode.db);
  try {
    let holidayExist = await holidayModel.findOne({
      holidayName: req.body.holidayName,
    });
    if (common_service.isEmpty(holidayExist)) {
      let newholiday = new holidayModel({
        holidayName: req.body.holidayName,
        fromDate: new Date(req.body.fromDate).getTime(),
        toDate: new Date(req.body.toDate).getTime(),
        numberOfDays: req.body.numberOfDays,
      });
      let data = await newholiday.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES, UNPROCESSED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.CONFLICT };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 21-06-23
module.exports.viewHolidays = async (req) => {
  const { holidayModel } = conn.leave(req.decode.db);
  try {
    let holidayExist = await holidayModel.find({});
    if (Array.isArray(holidayExist) && holidayExist.length > 0) {
      for (let i = 0; i < holidayExist.length; i++) {
        const element = holidayExist[i];
        element._doc["fromDate"] = common_service
          .prescisedateconvert(element.fromDate)
          .split(" ")[0];
        element._doc["toDate"] = common_service
          .prescisedateconvert(element.toDate)
          .split(" ")[0];
      }
      res = { data: holidayExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 21-06-23
module.exports.viewSingleHoliday = async (req) => {
  const { holidayModel } = conn.leave(req.decode.db);
  try {
    let res = {};
    const holidaySingle = await holidayModel.findOne({
      _id: req.body.id,
    });
    if (holidaySingle) {
      holidaySingle._doc["fromDate"] = common_service.prescisedateconvert(
        holidaySingle.fromDate
      );
      holidaySingle._doc["toDate"] = common_service.prescisedateconvert(
        holidaySingle.toDate
      );
      res = { data: holidaySingle, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 21-06-23
module.exports.editHolidays = async (req) => {
  const { holidayModel } = conn.leave(req.decode.db);
  try {
    let holidayExist = await holidayModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(holidayExist)) {
      holidayExist.holidayName = !req.body.holidayName
        ? holidayExist.holidayName
        : req.body.holidayName;
      holidayExist.fromDate = !req.body.fromDate
        ? holidayExist.fromDate
        : new Date(req.body.fromDate).getTime();
      holidayExist.toDate = !req.body.toDate
        ? holidayExist.toDate
        : new Date(req.body.toDate).getTime();
      holidayExist.numberOfDays = !req.body.numberOfDays
        ? holidayExist.numberOfDays
        : req.body.numberOfDays;
      let data = await holidayExist.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 21-06-23
module.exports.deleteHolidays = async (req) => {
  const { holidayModel } = conn.leave(req.decode.db);
  try {
    let res = {};
    let holidaySingle = await holidayModel.findOne({
      _id: req.body._id,
    });
    if (holidaySingle) {
      let data = await holidayModel.deleteOne({
        _id: req.body._id,
      });
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// edited on 20-06-23
module.exports.addLeaveType = async (req) => {
  const { leaveModel } = conn.leave(req.decode.db);
  try {
    if (!common_service.isEmpty(req.body)) {
      let leaveExist = await leaveModel.findOne({
        leaveType: req.body.leaveType.toLowerCase(),
      });
      if (common_service.isEmpty(leaveExist)) {
        let newleave = new leaveModel({
          leaveType: req.body.leaveType.toLowerCase(),
          numberOfDays: req.body.numberOfDays,
          status: true,
        });
        let data = await newleave.save();
        if (data) {
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = { data: { msg: "not found" }, status: STATUSCODES.CONFLICT };
      }
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 02-03-22
// edited on 20-06-23
module.exports.viewLeavetype = async (req) => {
  const { leaveModel } = conn.leave(req.decode.db);
  try {
    let leaveExist = await leaveModel.find({ status: true });
    if (Array.isArray(leaveExist) && leaveExist.length > 0) {
      res = { data: leaveExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [{ msg: "not found" }], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 20-06-23
module.exports.editLeaveType = async (req) => {
  const { leaveModel } = conn.leave(req.decode.db);
  try {
    let leaveExist = await leaveModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(leaveExist)) {
      leaveExist.leaveType = !req.body.leaveType
        ? leaveExist.leaveType
        : req.body.leaveType;
      leaveExist.numberOfDays = !req.body.numberOfDays
        ? leaveExist.numberOfDays
        : req.body.numberOfDays;
      let data = await leaveExist.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: { msg: "not found" }, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 20-06-23
module.exports.deleteLeaveType = async (req) => {
  const { leaveModel } = conn.leave(req.decode.db);
  try {
    let leaveExist = await leaveModel.findOne({ _id: req.body.id });
    if (!common_service.isEmpty(leaveExist)) {
      leaveExist.status = false;
      let data = await leaveExist.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: { msg: "not found" }, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 20-06-23
module.exports.staffLeave = async (req) => {
  const { staffLeaveModel } = conn.leave(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    if (!common_service.isEmpty(req.body)) {
      let newstaff = new staffLeaveModel({
        leaveType: req.body.leaveType,
        leaveFromeDate: new Date(req.body.leaveFromeDate).getTime(),
        leaveToDate: new Date(req.body.leaveToDate).getTime(),
        reason: req.body.reason,
        status: STAFFLEAVE.PEN,
        branchId: req.body.branchId,
        emp_id: req.body.emp_id,
        appliedDate: new Date(req.body.appliedDate).getTime(),
      });

      let IMAGEURL = "";
      if (req.files) {
        let fp = await common_service.createDirectory(
          `./public/${req.decode.db}/Employee/Leave`
        );
        req.files.file.mv(
          `./public/${req.decode.db}/Employee/Leave/${req.body.leaveFromeDate}-` +
            req.files.file.name.replace(/\s+/g, "")
        );
        IMAGEURL =
          /* process.env.FILEURL + */
          `Images/${req.decode.db}/Employee/Leave/${req.body.leaveFromeDate}-` +
          req.files.file.name.replace(/\s+/g, "");
      }
      newstaff.imageUrl = IMAGEURL;
      let data = await newstaff.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.LEAVE_ADD.type,
          description: LOG.LEAVE_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: { msg: "not found" }, status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: { msg: "badrequest" }, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 20/06/23
module.exports.viewStaffLeave = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  const { staffLeaveModel } = conn.leave(req.decode.db);
  try {
    // req.body.index=parseInt(req.body.index)*20
    let leaveExist = await staffLeaveModel.find({
      branchId: req.body.branchId,
    });
    rslist = [];
    if (Array.isArray(leaveExist) && leaveExist.length > 0) {
      for (let i = 0; i < leaveExist.length; i++) {
        const element = leaveExist[i];
        let resobj = {};
        let employeeExist = await employeeModel.findOne({
          _id: element.emp_id,
        });

        resobj._id = element._id;
        resobj.empObjid = "no id";
        resobj.employeeName = "no name";
        resobj.employeeId = "no emp id";
        resobj.imageUrl = "no file";
        if (employeeExist) {
          resobj.empObjid = !employeeExist._id;
          resobj.employeeName = !common_service.isEmpty(employeeExist)
            ? employeeExist.staff_name
            : " NO employeeName";
          resobj.employeeId = "EMP" + employeeExist.emp_id;
          resobj.imageUrl = process.env.FILEURL + employeeExist.imageUrl;
        }
        resobj.leaveType = element.leaveType;
        resobj.days = Math.round(
          (element.leaveToDate - element.leaveFromeDate) / (1000 * 60 * 60 * 24)
        );
        resobj.DateFrom = common_service
          .prescisedateconvert(element.leaveFromeDate)
          .split(" ")[0];
        resobj.DateTo = common_service
          .prescisedateconvert(element.leaveToDate)
          .split(" ")[0];
        resobj.reason = element.reason;
        resobj.appliedDate = common_service
          .prescisedateconvert(element.appliedDate)
          .split(" ")[0];
        resobj.status = element.status;
        rslist.push(resobj);
      }
      res = { data: rslist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [{ msg: "not found" }], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.log(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 02-03-2022
module.exports.viewLeaveTypeSingle = async (req) => {
  const { leaveTypeModel } = conn.leave(process.env.db);
  try {
    let res = {};
    let leaveTypeExist = await leaveTypeModel.findOne({
      _id: req,
    });
    if (leaveTypeExist) {
      res = { data: leaveTypeExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 30-05-22
//edited on 20-06-23
module.exports.approveLeave = async (req) => {
  const { staffLeaveModel } = conn.leave(req.decode.db);
  try {
    let leaveExist = await staffLeaveModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(leaveExist)) {
      if (req.body.type == 0) {
        leaveExist.status = STAFFLEAVE.APRV;
      } else {
        leaveExist.status = STAFFLEAVE.REJ;
      }
      let data = await leaveExist.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 20-06-23
module.exports.deleteStaffLeave = async (req) => {
  const { staffLeaveModel } = conn.leave(req.decode.db);
  try {
    let staffExist = await staffLeaveModel.findOne({
      _id: req.body._id,
      status: STAFFLEAVE.APRV,
      // status: { $ne: STAFFLEAVE.APRV },
    });
    if (!common_service.isEmpty(staffExist)) {
      let data = await staffLeaveModel.deleteOne({
        _id: req.body._id,
      });
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: { msg: "not found" }, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//added on 08/08/23
module.exports.totalLeaveofanEmployee = async (req) => {
  const { staffLeaveModel } = conn.leave(req.decode.db);
  try {
    let resObj = {};
    let leaveExist = await staffLeaveModel.find({
      emp_id: req.body.id,
      branchId: req.body.branchId,
      status: STAFFLEAVE.APRV,
    });
    if (Array.isArray(leaveExist) & (leaveExist.length > 0)) {
      resObj.empId = leaveExist[0].emp_id;
      resObj.totalLeave = 0;
      for (let i = 0; i < leaveExist.length; i++) {
        let daysDiffs =
          (leaveExist[i].leaveToDate - leaveExist[i].leaveFromeDate) /
          (1000 * 3600 * 24);
        resObj.totalLeave = resObj.totalLeave + daysDiffs;
      }
      return (res = { data: resObj, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// ADDED ON 08/08/23
module.exports.leaveDetails = async (req) => {
  const { staffLeaveModel, leaveModel } = conn.leave(req.decode.db);
  try {
    let rsList = [];

    let leaveType = await leaveModel.find({ status: true });
    if (Array.isArray(leaveType) & (leaveType.length > 0)) {
      for (let i = 0; i < leaveType.length; i++) {
        let resObj = {};
        let element = leaveType[i];
        resObj._id = element._id;
        resObj.name = element.leaveType;
        resObj.total = element.numberOfDays * 12;
        resObj.usedLeave = 0;
        let leaveExist = await staffLeaveModel.find({
          leaveType: element._id,
          emp_id: req.body.empId,
          status: STAFFLEAVE.APRV,
        });
        for (let j = 0; j < leaveExist.length; j++) {
          let daysDiffs =
            (leaveExist[j].leaveToDate - leaveExist[j].leaveFromeDate) /
            (1000 * 3600 * 24);
          resObj.usedLeave = resObj.usedLeave + daysDiffs;
        }
        resObj.balance = resObj.total - resObj.usedLeave;
        rsList.push(resObj);
      }
      return (res = { data: rsList, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    console.log(e);
  }
};

// added on 02-09-23
module.exports.viewAllleaves = async (req) => {
  const { leaveModel } = conn.leave(req.decode.db);
  try {
    let leaveExist = await leaveModel.find({});
    if (Array.isArray(leaveExist) && leaveExist.length > 0) {
      res = { data: leaveExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {} };
    }
  } catch (e) {
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

//#endregion
