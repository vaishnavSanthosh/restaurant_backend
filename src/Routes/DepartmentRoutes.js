/** @format */

//#region header
//edited to add dynamic db
const { STATUSCODES, LOG, API, URL } = require("../Model/enums.js");
// const settings_service = require("./settingsRoutes");
const conn = require("../../userDbConn");
const { parse } = require("dotenv");
//#endregion

//#region method
//edited on 08-06-2022 to add log
//edited on 04-03-22
//edited on 30-03-22 method converted to effective way to prevent redundency
//edited on 12-04-22
module.exports.createDepartment = async (req) => {
  const departmentModel = conn.department(req.decode.db);
  let db = req.decode.db;
  try {
    let res = {};
    let dep_exist = await departmentModel.findOne({
      departmentName: req.body.departmentName.toLowerCase(),
    });
    //edited on 12-04-22
    if (!dep_exist) {
      const new_dep = new departmentModel({
        departmentName: req.body.departmentName.toLowerCase(),
        dataStatus: true, //added on 04-03-22
      });
      let data = await new_dep.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      //added on 31-03-22-> code block to prevent redundency
      if (dep_exist.dataStatus == false) {
        dep_exist.dataStatus = true;
        let data = await dep_exist.save();
        let newLog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.EMPLOYEE_DEPARTMENT_ADD.type,
          description: LOG.EMPLOYEE_DEPARTMENT_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newLog.save();
        if (logresponse == null) {
          console.log("log save failed");
        }
        if (data) {
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = { data: {}, status: STATUSCODES.EXIST };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//EDITED ON 19/06/23
module.exports.getAllDepartments = async (req) => {
  const departmentModel = conn.department(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    // let dep_Exist = await departmentModel
    //   .find({ dataStatus: true })
    //   .skip(req.body.index)
    //   .limit(30);
    let dep_Exist = await departmentModel.find({ dataStatus: true });
    if (Array.isArray(dep_Exist) && dep_Exist.length > 0) {
      res = { data: dep_Exist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [{ msg: "not found" }], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//EDITED ON 19/06/23
module.exports.getSingleDepartment = async (req) => {
  const departmentModel = conn.department(req.decode.db);
  try {
    let res = {};
    let dep_exist = await departmentModel.findOne({
      _id: req.body._id,
    });
    if (dep_exist) {
      return (res = { data: dep_exist, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: [], status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.editDepartment = async (req) => {
  const departmentModel = conn.department(req.decode.db);
  try {
    let res = {};
    let dep_exist = await departmentModel.findOne({
      _id: req.body.id,
    });
    if (dep_exist) {
      dep_exist.departmentName = req.body.departmentName;
      let data = await dep_exist.save();
      let newLog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.EMPLOYEE_DEPARTMENT_ADD.type,
        description: LOG.EMPLOYEE_DEPARTMENT_ADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newLog.save();
      if (logresponse == null) {
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

//edited on 19-06-23
module.exports.deleteDepartment = async (req) => {
  const departmentModel = conn.department(req.decode.db);
  try {
    let dep_exist = await departmentModel.findOne({
      _id: req.body.id,
    });
    if (dep_exist) {
      dep_exist.dataStatus = false;
      let data = await dep_exist.save();
      let newLog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.EMPLOYEE_DEPARTMENT_ADD.type,
        description: LOG.EMPLOYEE_DEPARTMENT_ADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newLog.save();
      if (logresponse == null) {
        console.log("log save failed");
      }
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
//edited on 05-03-22
module.exports.getDepartments = async () => {
  const departmentModel = conn.department(process.env.db);
  try {
    let res = {};
    const dep_Exist = await departmentModel.find({});
    // const dep_Exist = await departmentModel.aggregate([
    //   { $sort: { departmentName: 1 } },
    // ]);
    if (dep_Exist.length > 0) {
      res = { data: dep_Exist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//#endregion
