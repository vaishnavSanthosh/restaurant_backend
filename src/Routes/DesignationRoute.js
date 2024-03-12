/** @format */

//#region header
//edited to add dynamic db
const { STATUSCODES, LOG, API, URL } = require("../Model/enums.js");
const settings_service = require("./settingsRoutes");
const conn = require("../../userDbConn");
const { isEmpty } = require("./commonRoutes.js");
//#endregion

//#region methods
//edited on 05-03-22
//edited on 10-03-22 added branchid in input

//edited on 19/06/23 added decode, changed schema
module.exports.createDesignation = async (req) => {
  const designationModel = conn.designation(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    const designationExist = await designationModel.findOne({
      position: req.body.position.toLowerCase(),
    });
    if (!designationExist) {
      const designation = new designationModel({
        position: req.body.position.toLowerCase(),
        details: req.body.details,
        dataStatus: true,
        departmentId: req.body.departmentId,
      });
      let data = await designation.save();
      // let newLog = new logModel({
      //   date: new Date().getTime(),
      //   emp_id: req.decode._id,
      //   type: LOG.EMPLOYEE_DESIGNATION_ADD.type,
      //   description: LOG.EMPLOYEE_DESIGNATION_ADD.description,
      //   branchId: data.branchId,
      //   link: {},
      //   payload: { token: req.headers.authorization, body: req.body },
      // });
      // let logresponse = await newLog.save();
      // if (logresponse) {
      //   console.log("log save failed");
      // }
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.CONFLICT };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 05-03-22 added status field in search parameter
//edited on 10-03-22 added branchId in search parameter

//edited on 12/06/23 added decode
module.exports.getAllDesignations = async (req) => {
  const departmentModel = conn.department(req.decode.db);
  const designationModel = conn.designation(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    const designationExist = await designationModel.find({
      dataStatus: true,
    }).skip(req.body.index).limit(30)
    if (designationExist.length > 0) {
      for (let i = 0; i < designationExist.length; i++) {
        const element = designationExist[i];
        let departmentName = await departmentModel.findOne({
          _id: element.departmentId,
        });
        element._doc["departmentName"] = departmentName!=null
          ? departmentName.departmentName
          : "No department";
      }
      res = { data: designationExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [{ msg: "not found" }], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 19/06/23
module.exports.getDesignationById = async (req) => {
  const designationModel = conn.designation(req.decode.db);
  try {
    let res = {};
    const designationSingle = await designationModel.findOne({
      _id: req.body.id,
    });
    if (designationSingle) {
      res = { data: designationSingle, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 19/06/23
module.exports.updateDesignation = async (req) => {
  const designationModel = conn.designation(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);

  try {
    let res = {};
    const designationExist = await designationModel.findOne({
      _id: req.body.id,
    });
    if (designationExist) {
      designationExist.position = req.body.position
        ? req.body.position
        : designationExist.position;
      designationExist.details = req.body.details
        ? req.body.details
        : designationExist.details;
      designationExist.departmentId = req.body.departmentId
        ? req.body.departmentId
        : designationExist.departmentId;
      let data = await designationExist.save();
      let newLog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.EMPLOYEE_DESIGNATION_ADD.type,
        description: LOG.EMPLOYEE_DESIGNATION_ADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newLog.save();
      if (logresponse) {
        console.log("log save failed");
      }
      if (data) {
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
// edited on 12/06/23
module.exports.deleteDesignation = async (req) => {
  const designationModel = conn.designation(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    const designationExist = await designationModel.findOne({
      _id: req.body.id,
      dataStatus: true,
    });
    if (designationExist) {
      designationExist.dataStatus = false;
      await designationExist.save();
      let newLog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.EMPLOYEE_DESIGNATION_ADD.type,
        description: LOG.EMPLOYEE_DESIGNATION_ADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newLog.save();
      if (logresponse) {
        console.log("log save failed");
      }
      return (res = { data: designationExist, status: STATUSCODES.SUCCESS });
    } else {
      return (res = {
        data: { msg: "not found" },
        status: STATUSCODES.NOTFOUND,
      });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 19-06-23
module.exports.getDesignationsByDepartment = async (req) => {
  const designationModel = conn.designation(req.decode.db);
  try {
    if (req.body.departmentId.length == 24) {
      let designationList = await designationModel.find({
        departmentId: req.body.departmentId,
      });
      if (Array.isArray(designationList) && designationList.length > 0) {
        res = { data: designationList, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: [{ msg: "not found" }], status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: [], status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 05-03-22 // finds all designations
module.exports.getDesignations = async () => {
  const designationModel = conn.designation(process.env.db);
  try {
    let res = {};
    const designationExist = await designationModel.find({
      branchId: process.env.branchId,
    });
    if (designationExist.length > 0) {
      res = { data: designationExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//#endregion
