/** @format */

//#region header
const {
  STATUSCODES,
  ROLES,
  LOG,
  URL,
  API,
  LOAN,
  PREFIXES,
} = require("../Model/enums.js");
const fs = require("fs");
require("dotenv").config({ path: "./.env" });
// const desg_service = require("../Routes/DesignationRoute.js");
// const dep_service = require("../Routes/DepartmentRoutes.js");
const common_service = require("../Routes/commonRoutes.js");
const qr = require("qrcode");
const adminService = require("../Routes/AuthRoutes.js");
// const settings_service = require("./settingsRoutes");
const conn = require("../../userDbConn");
const { NOTFOUND } = require("dns");
//#endregion

//#region methods
//edited on 08-06-2022 to add log
//edited on 27-01-22
/*edited on 25-02-22 barcode added */
/*edited on 07-03-22 qrcode added insted of barcode */
/*edited on 11-03-22 method revoked with new model structure*/
//edited on 19-04-22 -> removed date convertion of date of join from here

//edited on 12/06/23
module.exports.addEmployee = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let emp_ID = 0;
    let SALT = "";
    let HASH = "";
    let hashresult = adminService.hashpassword(req.body.password);
    SALT = hashresult.salt;
    HASH = hashresult.hash;
    if (req.files) {
      let emp_exist = await employeeModel.findOne({
        contactnumber: req.body.contactnumber,
      });
      if (!emp_exist) {
        let dec_empList = await employeeModel.aggregate([
          {
            $sort: { emp_id: -1 },
          },
        ]);

        let IMAGEURL = "";
        if (req.files) {
          let fp = await common_service.createDirectory(
            `./public/${req.decode.db}/Employee`
          );
          req.files.file.mv(
            `./public/${req.decode.db}/Employee/${req.body.staff_name.replace(
              /\s+/g,
              ""
            )}-` + req.files.file.name.replace(/\s+/g, "") //edited on 11-03-22 parameter name renamed to staff_name
          );
          IMAGEURL =
            /* process.env.FILEURL + */
            `Images/${req.decode.db}/Employee/${req.body.staff_name.replace(
              /\s+/g,
              ""
            )}-` + req.files.file.name.replace(/\s+/g, ""); //edited on 11-03-22 parameter name renamed to staff_name
        }
        if (dec_empList.length > 0) {
          emp_ID = dec_empList[0].emp_id + 1;
        } else {
          emp_ID = 1;
        }
        let employee = new employeeModel({
          emp_id: emp_ID,
          staff_name: req.body.staff_name, //edited on 11-03-22 parameter name renamed to staff_name
          gender: req.body.gender,
          fathersName: req.body.fathersName,
          maritialStatus: req.body.maritialStatus,
          contactnumber: req.body.contactnumber,
          bloodGroup: req.body.bloodGroup,
          emergencyContactNumber: req.body.emergencyContactNumber,
          address: req.body.address,
          email: req.body.email,
          dob: new Date(req.body.dob).getTime(),
          country: req.body.country,
          state: req.body.state,
          imageUrl: IMAGEURL,
          username: req.body.username,
          password: req.body.password,
          hash: HASH,
          salt: SALT,
          department: null,
          designation: null,
          date_of_join: null,
          workHour: null,
          outletLocation: null,
          salaryType: null,
          monthlySalary: null,
          contractPeriodFrm: null,
          contractPeriodTo: null,
          contractPeriodFrm: null,
          status: false, //edited on 21-07-22 -> status field def value from here should be false,to be enabled by admin
          ac_holder: null,
          ac_no: null,
          bank: null,
          bank_code: null,
          bankLocation: null,
          pan: null,
          documents: null,
          date_of_leaving: null,
          branchId: null,
          qrcode: null,
          admin_id: req.body.admin_id,
          branchName: null,
        });
        let data = await employee.save();
        if (data) {
          data._doc["dob"] = common_service.prescisedateconvert(data.dob);
          data.password = "*******";
          data.hash = "*******";
          data.salt = "*******";
          return (res = { data: data, status: STATUSCODES.SUCCESS });
        } else {
          return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
        }
      } else {
        return (res = { data: {}, status: STATUSCODES.EXIST });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.BADREQUEST });
    }
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 11-03-22 //added hidden values for new fields password salt and hash
//edited on 17-03-22 //added contract period date convertion
//edited on 21-03-22 //added employeeId with temporary employeeId Prefix
//edited on 10-06-23
module.exports.viewAllEmployees = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  const departmentModel = conn.department(req.decode.db);
  const designationModel = conn.designation(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    if (req.decode.role == ROLES.USER) {
      var emp_list = await employeeModel
        .find({
          branchId: req.body.branchId,
          status: true,
        })
        .skip(req.body.index)
        .limit(30);
    } else {
      var emp_list = await employeeModel
        .find({
          status: true,
        })
        .skip(req.body.index)
        .limit(30);
    }
    if (emp_list.length > 0) {
      for (let i = 0; i < emp_list.length; i++) {
        let designation = await designationModel.findOne({
          _id: emp_list[i].designation,
        });
        let department = await departmentModel.findOne({
          _id: emp_list[i].department,
        });

        emp_list[i]._doc["designationName"] = designation
          ? designation.position
          : null;
        emp_list[i]._doc["departmentName"] = department
          ? department.departmentName
          : null;
        emp_list[i]._doc["date_of_join"] = common_service
          .prescisedateconvert(emp_list[i].date_of_join)
          .split(" ")[0];
        emp_list[i]._doc["dob"] = common_service
          .prescisedateconvert(emp_list[i].dob)
          .split(" ")[0];
        emp_list[i]._doc["contractPeriodFrm"] = emp_list[i].contractPeriodFrm
          ? common_service
              .prescisedateconvert(emp_list[i].contractPeriodFrm)
              .split(" ")[0]
          : null;
        emp_list[i]._doc["contractPeriodTo"] = emp_list[i].contractPeriodTo
          ? common_service
              .prescisedateconvert(emp_list[i].contractPeriodTo)
              .split(" ")[0]
          : null;
        emp_list[i].password = "*******";
        emp_list[i].hash = "*******";
        emp_list[i].salt = "*******";
        emp_list[i]._doc["contractPeriodFrm"] = emp_list[i].contractPeriodFrm
          ? common_service
              .prescisedateconvert(emp_list[i].contractPeriodFrm)
              .split(" ")[0]
          : null;
        emp_list[i]._doc["contractPeriodTo"] = emp_list[i].contractPeriodTo
          ? common_service
              .prescisedateconvert(emp_list[i].contractPeriodTo)
              .split(" ")[0]
          : null;
        emp_list[i]._doc["emp_id"] = `EMP${emp_list[i].emp_id}`;
        emp_list[i].imageUrl = process.env.FILEURL + emp_list[i].imageUrl;
        if (
          Array.isArray(emp_list[i].documents) &&
          emp_list[i].documents.length > 0
        ) {
          emp_list[i].documents.map((x) => {
            x.imageUrl = process.env.FILEURL + x.imageUrl;
            x.expiryDate = common_service
              .prescisedateconvert(x.expiryDate)
              .split(" ")[0];
          });
        }
        let branch = await branchModel.findOne({
          storecode: emp_list[i].branchId,
        });
        emp_list[i]._doc["branchName"] = "No Branch";
        if (common_service.checkObject(branch)) {
          emp_list[i]._doc["branchName"] = branch.branchName;
        }
      }
      /* ends */
      res = { data: emp_list, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: { msg: "not found" }, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 17-03-22 //added contract period date convertion
//edited on 21-03-22 //added employee id convertion
//edited on 10-06-22 -> fileurl appended insted of adding while  saving

// edited on 12/06/23
// added on 12/06/23
module.exports.viewSingleEmployee = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  const departmentModel = conn.department(req.decode.db);
  const designationModel = conn.designation(req.decode.db);
  try {
    let emp_list = await employeeModel.findOne({ _id: req.body._id });
    if (emp_list) {
      let designation = await designationModel.findOne({
        _id: emp_list.designation,
      });
      let department = await departmentModel.findOne({
        _id: emp_list.department,
      });

      emp_list._doc["designationName"] = designation
        ? designation.position
        : null;
      emp_list._doc["departmentName"] = department
        ? department.departmentName
        : null;
      emp_list._doc["date_of_join"] = common_service
        .prescisedateconvert(emp_list.date_of_join)
        .split(" ")[0];
      emp_list._doc["dob"] = common_service
        .prescisedateconvert(emp_list.dob)
        .split(" ")[0];
      emp_list._doc["contractPeriodFrm"] = emp_list.contractPeriodFrm
        ? common_service
            .prescisedateconvert(emp_list.contractPeriodFrm)
            .split(" ")[0]
        : null;
      emp_list._doc["contractPeriodTo"] = emp_list.contractPeriodTo
        ? common_service
            .prescisedateconvert(emp_list.contractPeriodTo)
            .split(" ")[0]
        : null;
      // emp_list.password = "*******";
      emp_list.hash = "*******";
      emp_list.salt = "*******";
      emp_list._doc["contractPeriodFrm"] = emp_list.contractPeriodFrm
        ? common_service
            .prescisedateconvert(emp_list.contractPeriodFrm)
            .split(" ")[0]
        : null;
      emp_list._doc["contractPeriodTo"] = emp_list.contractPeriodTo
        ? common_service
            .prescisedateconvert(emp_list.contractPeriodTo)
            .split(" ")[0]
        : null; //added on 17-03-22 contract period date convertion added
      emp_list._doc["emp_id"] = `EMP${emp_list.emp_id}`; //added on 21-03-22
      emp_list.imageUrl = process.env.FILEURL + emp_list.imageUrl; //edited on 10-06-22 -> fileurl appended insted of adding while  saving
      if (Array.isArray(emp_list.documents)) {
        emp_list.documents.map((x) => {
          x.expiryDate = common_service
            .prescisedateconvert(x.expiryDate)
            .split(" ")[0];
        });
      }
      res = { data: emp_list, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: { msg: "not found" }, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 27-01-22
//edited on 12-03-22 method recoded with new changes as per ui
//edited on 10-06-22 -> fileurl appended insted of adding while  saving

//edited on 15/06/23
module.exports.editEmployeeDetails = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let emp_list = await employeeModel.findOne({ _id: req.body.id });
    if (emp_list) {
      if (req.files) {
        let fp = await common_service.createDirectory(
          `./public/${req.decode.db}/Employee`
        );
        fs.unlink(`public/` + emp_list.imageUrl.split("Images/")[1], (err) => {
          if (err) console.log(err);
        });
        req.files.file.mv(
          `./public/${req.decode.db}/Employee/${emp_list.staff_name.replace(
            /\s+/g,
            ""
          )}-` + req.files.file.name.replace(/\s+/g, "") //edited on 11-03-22 parameter name renamed to staff_name
        );
        emp_list.imageUrl =
          /* process.env.FILEURL +*/
          `Images/${req.decode.db}/Employee/${emp_list.staff_name.replace(
            /\s+/g,
            ""
          )}-` + req.files.file.name.replace(/\s+/g, ""); //edited on 11-03-22 parameter name renamed to staff_name
      }
      emp_list.staff_name = req.body.staff_name
        ? req.body.staff_name
        : emp_list.staff_name;
      emp_list.gender = req.body.gender ? req.body.gender : emp_list.gender;
      emp_list.fathersName = req.body.fathersName
        ? req.body.fathersName
        : emp_list.fathersName;
      emp_list.maritialStatus = req.body.maritialStatus
        ? req.body.maritialStatus
        : emp_list.maritialStatus;
      emp_list.contactnumber = req.body.contactnumber
        ? req.body.contactnumber
        : emp_list.contactnumber;
      emp_list.bloodGroup = req.body.bloodGroup
        ? req.body.bloodGroup
        : emp_list.bloodGroup;
      emp_list.emergencyContactNumber = req.body.emergencyContactNumber
        ? req.body.emergencyContactNumber
        : emp_list.emergencyContactNumber;
      emp_list.address = req.body.address ? req.body.address : emp_list.address;
      emp_list.email = req.body.email ? req.body.email : emp_list.email;
      emp_list.dob = req.body.dob
        ? new Date(req.body.dob).getTime()
        : emp_list.dob;
      emp_list.country = req.body.country ? req.body.country : emp_list.country;
      emp_list.state = req.body.state ? req.body.state : emp_list.state;
      let data = await emp_list.save();

      let newLog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.EMPLOYEE_ADD.type,
        description: LOG.EMPLOYEE_ADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newLog.save();
      if (logresponse) {
        console.log("log save failed");
      }

      if (data) {
        data._doc["date_of_join"] = common_service.prescisedateconvert(
          data.date_of_join
        );
        data._doc["dob"] = common_service.prescisedateconvert(data.dob);
        data.password = "*******";
        data.hash = "*******";
        data.salt = "*******";
        data._doc["contractPeriodFrm"] = data.contractPeriodFrm
          ? common_service.prescisedateconvert(data.contractPeriodFrm)
          : null;
        data._doc["contractPeriodTo"] = data.contractPeriodTo
          ? common_service.prescisedateconvert(data.contractPeriodTo)
          : null;
        let newLog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.EMPLOYEE_ADD.type,
          description: LOG.EMPLOYEE_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newLog.save();
        if (logresponse == null) {
          console.log("log save failed");
        }
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
//added on 12/06/23
module.exports.deleteEmployee = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  // const{logModel}=conn.settings(req.decode.db)
  try {
    let res = {};
    let emp_exist = await employeeModel.findOne({
      _id: req.body.id,
    });
    if (emp_exist) {
      emp_exist.status = false;
      let data = await emp_exist.save();
      // let newLog = new logModel({
      //   date: new Date().getTime(),
      //   emp_id: req.decode._id,
      //   type: LOG.EMPLOYEE_ADD.type,
      //   description: LOG.EMPLOYEE_ADD.description,
      //   branchId: data.branchId,
      //   link: {},
      //   payload: { token: req.headers.authorization, body: req.body },
      // });
      // let logresponse = await newLog.save();
      // if (logresponse) {
      //   console.log("log save failed");
      // }

      // let newLog = new logModel({
      //   date: new Date().getTime(),
      //   emp_id: req.decode._id,
      //   type: LOG.EMPLOYEE_ADD.type,
      //   description: LOG.EMPLOYEE_ADD.description,
      //   branchId: data.branchId,
      //   link: {},
      //   payload: { token: req.headers.authorization, body: req.body },
      // });
      // let logresponse = await newLog.save();
      // if (logresponse == null) {
      //   console.log("log save failed");
      // }
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

//edited on 12-03-22 //employeName changed to staffName
//edited on 17-03-22 // contract period date timings convertion added
//edited on 10-06-22 -> fileurl appended insted of adding while  saving

// edited on 14/06/23
module.exports.addDocument = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let emp_exist = await employeeModel.findOne({
      _id: req.body.id,
    });
    if (emp_exist != null) {
      if (emp_exist.documents == null) {
        emp_exist.documents = [];
      }
      let emp_doc = {};
      emp_doc.uuid = common_service.generateUuid();
      //edited on 10-06-22 -> while saving the image to file server uuid is given in naming the file insted of document type
      if (req.files) {
        let fp = await common_service.createDirectory(
          `./public/${req.decode.db}/EmployeeDocs`
        );
        req.files.file.mv(
          `./public/${
            req.decode.db
          }/EmployeeDocs/${emp_exist.staff_name.replace(/\s+/g, "")}-${
            emp_exist.emp_id
          }-${emp_doc.uuid}-` + req.files.file.name.replace(/\s+/g, "")
        );
        emp_doc.imageUrl =
          /* process.env.FILEURL +*/
          `Images/${req.decode.db}/EmployeeDocs/${emp_exist.staff_name.replace(
            /\s+/g,
            ""
          )}-${emp_exist.emp_id}-${emp_doc.uuid}-` + //edited on 10-06-22 -> fileurl appended insted of adding while  saving
          req.files.file.name.replace(/\s+/g, "");
      }
      emp_doc.documentType = req.body.documentType;
      emp_doc.documentNumber = req.body.documentNumber;
      emp_doc.expiryDate = new Date(req.body.expiryDate).getTime();
      if (
        !emp_exist.documents.some(
          (el) => el.documentType == req.body.documentType
        )
      ) {
        emp_exist.documents.push(emp_doc);
        let data = await emp_exist.save();

        let newLog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.EMPLOYEE_DOCUMENT_ADD.type,
          description: LOG.EMPLOYEE_DOCUMENT_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newLog.save();
        if (logresponse) {
          console.log("log save failed");
        }

        if (data) {
          data._doc["date_of_join"] = common_service.prescisedateconvert(
            data.date_of_join
          );
          let newLog = new logModel({
            date: new Date().getTime(),
            emp_id: req.decode._id,
            type: LOG.EMPLOYEE_DOCUMENT_ADD.type,
            description: LOG.EMPLOYEE_DOCUMENT_ADD.description,
            branchId: data.branchId,
            link: {},
            payload: { token: req.headers.authorization, body: req.body },
          });
          let logresponse = await newLog.save();
          if (logresponse == null) {
            console.log("log save failed");
          }
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        emp_exist._doc["date_of_join"] = common_service.prescisedateconvert(
          emp_exist.date_of_join
        );
        emp_exist._doc["dob"] = common_service.prescisedateconvert(
          emp_exist.dob
        );
        emp_exist._doc["contractPeriodFrm"] = emp_exist.contractPeriodFrm
          ? common_service.prescisedateconvert(emp_exist.contractPeriodFrm)
          : null;
        emp_exist._doc["contractPeriodTo"] = emp_exist.contractPeriodTo
          ? common_service.prescisedateconvert(emp_exist.contractPeriodTo)
          : null; //added on 17-03-22 contract period date convertion added
        res = { data: emp_exist, status: STATUSCODES.EXIST };
      }
    } else {
      res = {
        data: { msg: "no employee with this id" },
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//edited on 10-06-22 -> fileurl appended insted of adding while  saving
//edited on 14/06/23
module.exports.viewDocuments = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  try {
    let emp_docList = await employeeModel.findOne({
      _id: req.body.id,
    });
    //edited on 10-06-22 -> array validation added here
    if (
      !common_service.isEmpty(emp_docList) &&
      Array.isArray(emp_docList.documents) &&
      emp_docList.documents.length > 0
    ) {
      for (let i = 0; i < emp_docList.documents.length; i++) {
        const element = emp_docList.documents[i];
        element.imageUrl = process.env.FILEURL + element.imageUrl; //edited on 10-06-22 -> fileurl appended insted of adding while saving
        element.expiryDate = common_service
          .prescisedateconvert(element.expiryDate)
          .split(" ")[0];
      }
      return (res = {
        data: emp_docList.documents,
        status: STATUSCODES.SUCCESS,
      });
    } else {
      return (res = { data: [], status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 17-03-22 added contract period date convertion on
//edited on 10-06-22 -> fileurl appended insted of adding while  saving
// edited on 15/06/23 not working
module.exports.editDocuments = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let emp_exist = await employeeModel.findOne({
      _id: req.body.id,
    });

    if (emp_exist) {
      let emp_doc = emp_exist.documents.findIndex(
        (e) => e.uuid == req.body.uuid
      );
      if (emp_doc != -1) {
        emp_exist.documents[emp_doc].documentType = !req.body.documentType
          ? emp_exist.documents[emp_doc].documentType
          : req.body.documentType;
        emp_exist.documents[emp_doc].documentNumber = !req.body.documentNumber
          ? emp_exist.documents[emp_doc].documentNumber
          : req.body.documentNumber;
        emp_exist.documents[emp_doc].expiryDate = !req.body.expiryDate
          ? emp_exist.documents[emp_doc].expiryDate
          : new Date(req.body.expiryDate).getTime();
        if (req.files) {
          let fp = await common_service.createDirectory(
            `./public/${req.decode.db}/EmployeeDocs`
          );
          if (emp_exist.documents[emp_doc].imageUrl != undefined) {
            fs.unlink(
              `public/` +
                emp_exist.documents[emp_doc].imageUrl.split("Images/")[1],
              (err) => {
                if (err) console.log(err);
              }
            );
          }
          req.files.file.mv(
            `./public/${
              req.decode.db
            }/EmployeeDocs/${emp_exist.staff_name.replace(/\s+/g, "")}-${
              emp_exist.emp_id
            }-${emp_exist.documents[emp_doc].uuid}-` +
              req.files.file.name.replace(/\s+/g, "")
          );
          emp_exist.documents[emp_doc].imageUrl =
            /*process.env.FILEURL + */
            `Images/${
              req.decode.db
            }/EmployeeDocs/${emp_exist.staff_name.replace(/\s+/g, "")}-${
              emp_exist.emp_id
            }-${emp_exist.documents[emp_doc].uuid}-` +
            req.files.file.name.replace(/\s+/g, "");
        }
        let data = await employeeModel.findOneAndUpdate(
          { _id: emp_exist._id },
          { $set: emp_exist },
          { new: true }
        );
        let newLog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.EMPLOYEE_DOCUMENT_ADD.type,
          description: LOG.EMPLOYEE_DOCUMENT_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newLog.save();
        if (logresponse == null) {
          console.log("log save failed");
        }

        if (data) {
          data._doc["date_of_join"] = common_service.prescisedateconvert(
            data.date_of_join
          );
          data._doc["dob"] = common_service.prescisedateconvert(data.dob);
          data._doc["contractPeriodFrm"] = data.contractPeriodFrm
            ? common_service.prescisedateconvert(data.contractPeriodFrm)
            : null;
          data._doc["contractPeriodTo"] = data.contractPeriodTo
            ? common_service.prescisedateconvert(data.contractPeriodTo)
            : null; //added on 17-03-22 contract period date convertion added
          let newLog = new logModel({
            date: new Date().getTime(),
            emp_id: req.decode._id,
            type: LOG.EMPLOYEE_DOCUMENT_ADD.type,
            description: LOG.EMPLOYEE_DOCUMENT_ADD.description,
            branchId: data.branchId,
            link: {},
            payload: { token: req.headers.authorization, body: req.body },
          });
          let logresponse = await newLog.save();
          if (logresponse) {
            console.log("log save failed");
          }
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = { data: emp_exist, status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 10-06-22 -> fileurl appended insted of adding while  saving
// edited on 14/06/23
module.exports.deleteDocuments = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let emp_exist = await employeeModel.findOne({
      _id: req.body.id,
    });
    if (emp_exist) {
      if (emp_exist.documents) {
        let index = emp_exist.documents.findIndex(
          (e) => e.uuid == req.body.uuid
        );
        if (index != -1) {
          // let remvArr = emp_exist.documents[index].imageUrl.split(
          //   process.env.SPLITURL
          // );
          if (emp_exist.documents[index].imageUrl != undefined) {
            fs.unlink(
              `public/` +
                emp_exist.documents[index].imageUrl.split("Images/")[1],
              (err) => {
                if (err) console.log(err);
              }
            );
          }
          emp_exist.documents = emp_exist.documents.filter(
            (e) => e.uuid != req.body.uuid
          );
          emp_exist.documents =
            emp_exist.documents.length == 0 ? null : emp_exist.documents;
        }
      }
      let data = await emp_exist.save();

      let newLog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.EMPLOYEE_DOCUMENT_ADD.type,
        description: LOG.EMPLOYEE_DOCUMENT_ADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newLog.save();
      if (logresponse == null) {
        console.log("log save failed");
      }

      if (data) {
        let newLog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.EMPLOYEE_DOCUMENT_ADD.type,
          description: LOG.EMPLOYEE_DOCUMENT_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newLog.save();
        if (logresponse) {
          console.log("log save failed");
        }
        data._doc["date_of_join"] = common_service.prescisedateconvert(
          data.date_of_join
        );
        data._doc["dob"] = common_service.prescisedateconvert(data.dob);
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

//added on 24-02-22
//edited on 20/06/23
//edited on 07/08/23
module.exports.addPayroll = async (req) => {
  const { payrollModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let str = {};
    console.log("sdvhds");
    if (!common_service.isEmpty(req.body.date)) {
      let datefind = common_service.startandendofamonth(req.body.date);
      str.$gt = datefind.start;
      str.$lt = datefind.end;
    } else {
      return (res = { data: "enter date", status: STATUSCODES.NOTACCEPTABLE });
    }
    let payrollExist = await payrollModel.find({
      emp_id: req.body.emp_id,
      date: str,
    });
    if (Array.isArray(payrollExist) & (payrollExist.length > 0)) {
      res = { data: {}, status: STATUSCODES.CONFLICT };
    } else {
      let payroll = new payrollModel({
        emp_id: req.body.emp_id,
        earnings: req.body.earnings,
        deductions: req.body.deductions,
        payment: req.body.payment,
        branchId: req.body.branchId,
        payableAmount: req.body.payableAmount,
        totalPaid: req.body.totalPaid,
        balancePayment: req.body.balancePayment,
        date: new Date(req.body.date).getTime(),
      });
      let payrollList = await payrollModel.find({
        branchId: req.body.branchId,
      });
      if (payrollList.length > 0)
        payroll.transNo = payrollList[payrollList.length - 1].transNo + 1;
      else payroll.transNo = 1;

      let data = await payroll.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.body.emp_id,
          type: EMPLOYEE_PAYROLL_ADD.type,
          description: EMPLOYEE_PAYROLL_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: {},
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save failed");
        }
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
// added on 20-06-23
module.exports.viewPayroll = async (req) => {
  const { payrollModel, employeeModel } = conn.employee(req.decode.db);
  const designationModel = conn.designation(req.decode.db);
  let rsList = [];
  try {
    let payrollExist = await payrollModel.find({});
    if (Array.isArray(payrollExist) && payrollExist.length > 0) {
      for (let i = 0; i < payrollExist.length; i++) {
        const element = payrollExist[i];
        let resobj = {};
        // resobj._doc["_id"] = element._id;
        let employee = await employeeModel.findOne({ _id: element.emp_id });
        resobj._id = element._id;
        resobj.image = "no image";
        resobj.employeeName = "no name";
        resobj.employeeId = "no employeeId";
        resobj.mobile = "no mobile";
        resobj.joiningdate = "no joining id";
        resobj.designation = "no designation";
        if (!common_service.isEmpty(employee)) {
          let designationExist = await designationModel.findOne({
            _id: employee.designation,
          });
          resobj._id = element._id;
          resobj.image = process.env.FILEURL + employee.imageUrl;
          resobj.employeeName = employee.staff_name;
          resobj.employeeId = `EMP` + employee.emp_id;
          resobj.mobile = employee.contactnumber;
          resobj.joiningdate = common_service.prescisedateconvert(
            employee.date_of_join
          );
          resobj.designation = !common_service.isEmpty(designationExist)
            ? designationExist.position
            : "no designation";
        }
        if (!common_service.isEmpty(element.payment)) {
          resobj.status = "paid";
        } else {
          resobj.status = "UnPaid";
        }
        rsList.push(resobj);
      }
      res = { data: rsList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }

    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 20-06-23
module.exports.payrollViewById = async (req) => {
  const { payrollModel } = conn.employee(req.decode.db);
  try {
    let payrollexist = await payrollModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(payrollexist)) {
      res = { data: payrollexist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 20-06-23
module.exports.payrollNotranseGen = async (req) => {
  const { payrollModel } = conn.employee(req.decode.db);
  try {
    if (!common_service.isEmpty(req.decode)) {
      let TRANSNO = 0;
      let payrollExist = await payrollModel.find({
        branchId: req.body.branchId ? req.body.branchId : process.env.branchId,
      });
      if (payrollExist.length > 0) {
        TRANSNO = payrollExist[payrollExist.length - 1].transNo + 1;
      } else {
        TRANSNO = 1;
      }
      return (res = {
        data: TRANSNO,
        prefix: PREFIXES.WORKORDER + req.decode.prefix,
        status: STATUSCODES.SUCCESS,
      });
    } else {
      return (res = {
        data: null,
        prefix: null,
        status: STATUSCODES.UNAUTHORIZED,
      });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 20-06-23
module.exports.editPayroll = async (req) => {
  const { payrollModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let payrollExist = await payrollModel.findOne({ _id: req.body._id });
    if (payrollExist) {
      let emp_id = req.body.emp_id;
      let earnings = req.body.earnings;
      let deductions = req.body.deductions;
      let payment = req.body.payment;
      let payroll = await payrollModel.findOneAndUpdate(
        { _id: req.body._id },
        { $set: { earnings, deductions, payment, emp_id } },
        { returnDocument: "after" }
      );
      if (payroll) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.body.emp_id,
          type: EMPLOYEE_PAYROLL_ADD.type,
          description: EMPLOYEE_PAYROLL_ADD.description,
          branchId: payroll.branchId,
          link: {},
          payload: {},
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save failed");
        }
        res = { data: payroll, status: STATUSCODES.SUCCESS };
      } else res = { data: {}, status: STATUSCODES.UNPROCESSED };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 03-05-23
module.exports.deletePayroll = async (req) => {
  const { payrollModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let payrollExist = await payrollModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(payrollExist)) {
      let data = await payrollModel.deleteOne({ _id: req.body._id });
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.body.emp_id,
          type: EMPLOYEE_PAYROLL_ADD.type,
          description: EMPLOYEE_PAYROLL_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: {},
        });
        let logresponse = await newlog.save();
        if (logresponse) {
          console.log("log save failed");
        }
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

//added on 25-02-22
module.exports.addPayrollEarning = async (req) => {
  const { payrollItemModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let payrollCalc = new payrollItemModel({
      earnings: {
        normal_ot: req.body.normal_ot ? req.body.normal_ot : 0,
        publicHoliday_ot: req.body.publicHoliday_ot
          ? req.body.publicHoliday_ot
          : 0,
        restDay_ot: req.body.restDay_ot ? req.body.restDay_ot : 0,
      },
      deductions: {
        absentAmount: req.body.absentAmount ? req.body.absentAmount : 0,
        advance: req.body.advance ? req.body.advance : 0,
        unpaidLeave: req.body.unpaidLeave ? req.body.unpaidLeave : 0,
      },
    });
    let data = await payrollCalc.save();
    if (data) {
      let newlog = new logModel({
        date: new Date().getTime(),
        emp_id: req.body.emp_id,
        type: EMPLOYEE_PAYROLLEARNING_ADD.type,
        description: EMPLOYEE_PAYROLLEARNING_ADD.description,
        branchId: data.branchId,
        link: {},
        payload: {},
      });
      let logresponse = await newlog.save();
      if (logresponse == null) {
        console.log("log save failed");
      }
      res = { data: data, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.UNPROCESSED };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 25-02-22
module.exports.addEmpQrcode = async (req) => {
  try {
    let data = {
      empId: req.body.emp_ID,
      name: req.body.staff_name,
    }; /* needed to be edited later */
    let strData = JSON.stringify(data);
    let fp = await common_service.createDirectory(
      `./public/${req.decode.db}/Employee/Qrcode`
    );
    await qr.toFile(
      `./public/${req.decode.db}/Employee/Qrcode/${req.body.emp_ID}.png`,
      strData
    );
    return (res = {
      data:
        process.env.FILEURL +
        `Images/${req.decode.db}/Employee/Qrcode/${req.body.emp_ID}.png`,
      status: STATUSCODES.SUCCESS,
    });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 11-03-22
//edited on 12-03-22 method converted to work as both post and put method
//edited on 15/06/23
module.exports.addEmployeeInfo = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let emp_exist = await employeeModel.findOne({ _id: req.body.id });
    if (emp_exist) {
      emp_exist.department = req.body.department
        ? req.body.department
        : emp_exist.department;
      emp_exist.designation = req.body.designation
        ? req.body.designation
        : emp_exist.designation;
      emp_exist.date_of_join = req.body.date_of_join
        ? new Date(req.body.date_of_join).getTime()
        : emp_exist.date_of_join;
      emp_exist.workHour = req.body.workHour
        ? req.body.workHour
        : emp_exist.workHour;
      emp_exist.outletLocation = req.body.outletLocation;
      emp_exist.salaryType = req.body.salaryType
        ? req.body.salaryType
        : emp_exist.salaryType;
      emp_exist.monthlySalary = req.body.monthlySalary
        ? req.body.monthlySalary
        : emp_exist.monthlySalary;
      emp_exist.contractPeriodFrm = req.body.contractPeriodFrm
        ? new Date(req.body.contractPeriodFrm).getTime()
        : emp_exist.contractPeriodFrm;
      emp_exist.contractPeriodTo = req.body.contractPeriodTo
        ? new Date(req.body.contractPeriodTo).getTime()
        : emp_exist.contractPeriodTo;
      emp_exist.status = req.body.status ? req.body.status : emp_exist.status;
      emp_exist.ac_holder = req.body.ac_holder
        ? req.body.ac_holder
        : emp_exist.ac_holder;
      emp_exist.ac_no = req.body.ac_no ? req.body.ac_no : emp_exist.ac_no;
      emp_exist.bank = req.body.bank ? req.body.bank : emp_exist.bank;
      emp_exist.bank_code = req.body.bank_code
        ? req.body.bank_code
        : emp_exist.bank_code;
      emp_exist.bankLocation = req.body.bankLocation
        ? req.body.bankLocation
        : emp_exist.bankLocation;
      emp_exist.pan = req.body.pan ? req.body.pan : emp_exist.pan;
      emp_exist.qrcode = req.body.qrcode ? req.body.qrcode : emp_exist.qrcode;
      let branchExist = {};
      if (common_service.isObjectId(req.body.outletLocation)) {
        branchExist = await branchModel.findOne({
          _id: req.body.outletLocation,
        });
      }
      if (common_service.isEmpty(branchExist)) {
        return (res = {
          data: { msg: "BranchId Does Not Exist" },
          status: STATUSCODES.ERROR,
        });
      } else {
        emp_exist.branchId = branchExist.storeCode;
        emp_exist.outletLocation = req.body.outletLocation;
      }
      let data = await emp_exist.save();
      if (data) {
        data._doc["dob"] = common_service.prescisedateconvert(data.dob);
        data._doc["date_of_join"] = common_service.prescisedateconvert(
          data.date_of_join
        );
        data._doc["contractPeriodFrm"] = common_service.prescisedateconvert(
          data.contractPeriodFrm
        );
        data._doc["contractPeriodTo"] = common_service.prescisedateconvert(
          data.contractPeriodTo
        );
        data.password = "*******";
        data.hash = "*******";
        data.salt = "*******";
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.body.emp_id,
          type: EMPLOYEE_INFO_ADD.type,
          description: EMPLOYEE_INFO_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: {},
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save failed");
        }
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 14-03-22
// edited 16-06-23
module.exports.addLoan = async (req) => {
  const { loanModel, employeeModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let LOANNO = 0;
    if (common_service.isObjectId(req.body.empId)) {
      let emp_exist = await employeeModel.findOne({ _id: req.body.empId });
      if (!common_service.isEmpty(emp_exist)) {
        let loanList = await loanModel.find({ branchId: emp_exist.branchId });
        if (loanList.length > 0)
          LOANNO = loanList[loanList.length - 1].transNo + 1;
        else LOANNO = 1;
        let loanDetails = new loanModel({
          empId: req.body.empId,
          branchId: req.body.branchId,
          actualLoanAmount: req.body.actualLoanAmount,
          balanceAmount: req.body.balanceAmount,
          loanRequestedDate: new Date(req.body.loanRequestedDate).getTime(),
          transNo: LOANNO,
          tenur: null,
          paymentMethod: null,
          loanType: null,
          interestRate: null,
          interestAmount: null,
          endDate: null,
          extraInterestAmount: null,
          interestType: null,
          documentType: null,
          documentNumber: null,
          imageUrl: null,
          loanStatus: LOAN.PEN,
          reason: req.body.reason ? req.body.reason : null,
        });
        let data = await loanDetails.save();
        if (data) {
          data._doc["loanRequestedDate"] = common_service.prescisedateconvert(
            data.loanRequestedDate
          );
          let newlog = new logModel({
            date: new Date().getTime(),
            emp_id: req.body.empId,
            type: LOG.EMPLOYEE_LOAN_ADD.type,
            description: LOG.EMPLOYEE_LOAN_ADD.description,
            branchId: data.branchId,
            link: {},
            payload: {},
          });
          let logresponse = await newlog.save();
          if (logresponse == null) {
            console.log("log save failed");
          }
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: { msg: "no employee" }, status: STATUSCODES.NOTFOUND };
        }
      } else {
        res = {
          data: { msg: "no employee with this id" },
          status: STATUSCODES.NOTFOUND,
        };
      }
    } else {
      res = { data: { msg: "not objectid" }, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    if (e.code == 11000) {
      return (res = {
        data: "orderNo duplication",
        status: STATUSCODES.UNPROCESSED,
      });
    } else {
      return (res = { data: e.message, status: STATUSCODES.ERROR });
    }
  }
};

//added on 14-03-22
//edited on 21-03-22 //added missing info of employee
// added on 16-06-23
module.exports.addNewLoan = async (req) => {
  const { loanModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    if (req.decode.role == ROLES.ADMIN) {
      let LOANNO = 0;
      let addNewLoan = await loanModel.findOne({ _id: req.body.emp_id });
      if (common_service.isEmpty(addNewLoan)) {
        let newLoan = await loanModel.find({ branchId: req.body.branchId });
        if (newLoan.length > 0)
          LOANNO = newLoan[newLoan.length - 1].transNo + 1;
        else LOANNO = 1;
        let loanList = await loanModel({
          empId: req.body.empId,
          branchId: req.body.branchId,
          actualLoanAmount: req.body.actualLoanAmount,
          tenur: req.body.tenur,
          balanceAmount: req.body.balanceAmount,
          paymentMethod: req.body.paymentMethod,
          loanType: req.body.loanType,
          loanstartDate: new Date(req.body.loanstartDate).getTime(),
          interestRate: req.body.interestRate,
          interestAmount: req.body.interestAmount,
          endDate: new Date(req.body.endDate).getTime(),
          extraInterestAmount: req.body.extraInterestAmount,
          interestType: req.body.interestType,
          documentType: req.body.documentType,
          documentNumber: req.body.documentNumber,
          imageUrl: req.body.imageUrl,
          transNo: LOANNO,
          loanRequestedDate: new Date(req.body.loanRequestedDate).getTime(),
        });
        let data = await loanList.save();
        if (data) {
          data._doc["loanstartDate"] = common_service.prescisedateconvert(
            data.loanstartDate
          );
          let newlog = new logModel({
            date: new Date().getTime(),
            emp_id: req.body.empId,
            type: LOG.EMPLOYEE_NEWLOAN_ADD.type,
            description: LOG.EMPLOYEE_NEWLOAN_ADD.description,
            branchId: data.branchId,
            link: {},
            payload: {},
          });
          let logresponse = await newlog.save();
          if (logresponse == null) {
            console.log("log save failed");
          }
          data._doc["endDate"] = common_service.prescisedateconvert(
            data.endDate
          );
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.FORBIDDEN };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
// added on 16-06-23
module.exports.viewNewLoan = async (req) => {
  const { loanModel, employeeModel } = conn.employee(req.decode.db);
  const departmentModel = conn.department(req.decode.db);
  const designationModel = conn.designation(req.decode.db);
  try {
    if (req.decode.role == ROLES.ADMIN) {
      let loanExist = await loanModel.find({});
      if (!common_service.isEmpty(loanExist)) {
        if (Array.isArray(loanExist) && loanExist.length > 0) {
          for (let i = 0; i < loanExist.length; i++) {
            const element = loanExist[i];
            element._doc["loanstartDate"] = common_service
              .prescisedateconvert(element.loanstartDate)
              .split(" ")[0];
            element._doc["loanRequestedDate"] = common_service
              .prescisedateconvert(element.loanRequestedDate)
              .split(" ")[0];
            element._doc["endDate"] = common_service
              .prescisedateconvert(element.endDate)
              .split(" ")[0];
            let employeeInfo = await employeeModel.findOne({
              _id: element.empId,
            });
            if (!common_service.isEmpty(employeeInfo)) {
              let departmenExist = await departmentModel.findOne({
                _id: employeeInfo.department,
              });
              let designationExist = await designationModel.findOne({
                _id: employeeInfo.designation,
              });
              element._doc["EMPLOYEEID"] = `EMP` + employeeInfo.emp_id;
              element._doc["NAME"] = employeeInfo.staff_name;
              element._doc["IMAGE"] =
                process.env.FILEURL + employeeInfo.imageUrl;
              element._doc["MOBILE"] = employeeInfo.contactnumber;
              element._doc["DEPARTMENT"] = !common_service.isEmpty(
                departmenExist
              )
                ? departmenExist.departmentName
                : "no departmentName";
              element._doc["DESIGNATION"] = !common_service.isEmpty(
                designationExist
              )
                ? designationExist.position
                : "no designation";
              element._doc["ACC_HOLDER_NAME"] = employeeInfo.ac_holder;
              element._doc["ACC_No"] = employeeInfo.ac_no;
              element._doc["IFSC"] = employeeInfo.bank_code;
              element._doc["BANKBRANCH"] = employeeInfo.bankLocation;
            }
          }
          res = { data: loanExist, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.NOTFOUND };
        }
      } else {
        res = { data: { msg: "not found" }, status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.FORBIDDEN };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 20-06-23
module.exports.addDocumentationUrl = async (req) => {
  const { loanModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let loanExist = await loanModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(loanExist)) {
      let imageUrl = "";
      if (req.files) {
        let fp = await common_service.createDirectory(
          `./public/${req.decode.db}/loanDocument`
        );
        req.files.emp.mv(
          `./public/${req.decode.db}/loanDocument/${
            loanExist.transNo
          }-${req.body.documentNumber.replace(/\s+/g, "")}` +
            req.files.emp.name.replace(/\s+/g, "")
        );
        imageUrl =
          `Images/${req.decode.db}/loanDocument/${
            loanExist.transNo
          }-${req.body.documentNumber.replace(/\s+/g, "")}` +
          req.files.emp.name.replace(/\s+/g, "");
      }
      if (!Array.isArray(loanExist.imageUrl)) {
        loanExist.imageUrl = [];
      }
      loanExist.imageUrl.push({
        documentType: req.body.documentType,
        documentNumber: req.body.documentNumber,
        imageUrl,
      });
      let document = await loanModel.findOneAndUpdate(
        { _id: loanExist._id },
        { $set: { imageUrl: loanExist.imageUrl } },
        { returndocument: "after" }
      );
      if (document) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.body.emp_id,
          type: EMPLOYEE_DOCUMENTATIONURL_ADD.type,
          description: EMPLOYEE_DOCUMENTATIONURL_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: {},
        });
        let logresponse = await newlog.save();
        if (logresponse) {
          console.log("log save failed");
        }
        return (res = { data: document, status: STATUSCODES.SUCCESS });
      } else return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
// added on 22/06/23
module.exports.approveLoan = async (req) => {
  const { loanModel } = conn.employee(req.decode.db);
  try {
    let loanStatus, reason;
    let loan = await loanModel.find({ _id: req.body.loanId });
    if (loan) {
      if (req.body.type == 0) loanStatus = LOAN.APRVD;
      else if (req.body.type == 1) loanStatus = LOAN.REJ;
      reason = req.body.reason;
      let loanApp = await loanModel.findOneAndUpdate(
        { _id: req.body.loanId },
        { $set: { loanStatus, reason } },
        { new: true }
      );
      if (loanApp) {
        return (res = { data: loanApp, status: STATUSCODES.SUCCESS });
      } else return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 16-06-23
module.exports.viewLoans = async (req) => {
  const { loanModel, employeeModel } = conn.employee(req.decode.db);
  const departmentModel = conn.department(req.decode.db);
  const designationModel = conn.designation(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let res = {};
    let loanList = await loanModel.find({}).skip(req.body.index).limit(30);
    if (loanList.length > 0) {
      for (let i = 0; i < loanList.length; i++) {
        const element = loanList[i];
        // element._doc["loanstartDate"] = common_service
        //   .prescisedateconvert(element.loanstartDate)
        //   .split(" ")[0];
        element._doc["loanstartDate"] = common_service
          .prescisedateconvert(element.loanstartDate)
          .split(" ")[0];
        element._doc["endDate"] = common_service
          .prescisedateconvert(element.endDate)
          .split(" ")[0];
        element._doc["loanId"] = `LN${element.transNo}`;
        element._doc["branchId"] = `${element.branchId}`;

        element._doc["loanRequestedDate"] = common_service.prescisedateconvert(
          element.loanRequestedDate
        );
        /*added on 21-03-22 -> missing employeeInfo added*/
        let employeeInfo = await employeeModel.findOne({ _id: element.empId });
        element._doc["EMPLOYEEID"] = "no employeeId";
        element._doc["NAME"] = "no name";
        element._doc["IMAGE"] = "no image";
        element._doc["MOBILE"] = "no mobile";
        element._doc["DEPARTMENT"] = "no department";
        element._doc["DESIGNATION"] = "no designation";
        element._doc["ACC_HOLDER_NAME"] = "no accholder name";
        element._doc["ACC_No"] = "no account number";
        element._doc["IFSC"] = "no IFC ";
        element._doc["BANKBRANCH"] = "no bank branch";
        element._doc["BANK"] = "no bank name";
        if (!common_service.isEmpty(employeeInfo)) {
          let departmenExist = await departmentModel.findOne({
            _id: employeeInfo.department,
          });
          let designationExist = await designationModel.findOne({
            _id: employeeInfo.designation,
          });
          element._doc["EMPLOYEEID"] = `EMP` + employeeInfo.emp_id;
          element._doc["NAME"] = employeeInfo.staff_name;
          element._doc["IMAGE"] = process.env.FILEURL + employeeInfo.imageUrl;
          element._doc["MOBILE"] = employeeInfo.contactnumber;
          element._doc["DEPARTMENT"] = !common_service.isEmpty(departmenExist)
            ? departmenExist.departmentName
            : "no departmentName";
          element._doc["DESIGNATION"] = !common_service.isEmpty(
            designationExist
          )
            ? designationExist.position
            : "no designation";
          element._doc["ACC_HOLDER_NAME"] = employeeInfo.ac_holder;
          element._doc["ACC_No"] = employeeInfo.ac_no;
          element._doc["IFSC"] = employeeInfo.bank_code;
          element._doc["BANKBRANCH"] = employeeInfo.bankLocation;
          element._doc["BANK"] = employeeInfo.bank;
        }
      }
      res = { data: loanList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [{ msg: "not found" }], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//added on 14-03-22
// EDITED ON 11/07/23
module.exports.generateLoanId = async (req) => {
  const { loanModel } = conn.employee(req.decode.db);
  try {
    let LOANNO = 0;
    if (req.body.branchId) {
      let newLoan = await loanModel.find({ branchId: req.body.branchId });

      if (newLoan.length > 0) LOANNO = newLoan[newLoan.length - 1].transNo + 1;
      else LOANNO = 1;
      return (res = { data: LOANNO, status: STATUSCODES.SUCCESS });
    }
    res = { data: {}, status: STATUSCODES.BADREQUEST };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//added on 23-03-22
//edited on 15/06/23
module.exports.viewdocuments = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  try {
    let employeeDocsList = await employeeModel.find(
      {},
      { staff_name: 1, documents: 1, emp_id: 1 }
    );
    if (Array.isArray(employeeDocsList) && employeeDocsList.length > 0) {
      await Promise.all(
        employeeDocsList.map(async (x) => {
          x._doc["empId"] = `EMP` + x.emp_id;
          if (Array.isArray(x.documents) && x.documents?.length > 0) {
            await Promise.all(
              x.documents.map((y) => {
                y.imageUrl = process.env.FILEURL + y.imageUrl;
                y.expiryDate = common_service
                  .prescisedateconvert(y.expiryDate)
                  .split(" ")[0];
              })
            );
          }
        })
      );
      res = { data: employeeDocsList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [{ msg: "not found" }], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//added on 19-04-22
module.exports.getEmployeeByDesignation = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  try {
    let res = {};
    let rslist = [];
    let employeeExist = await employeeModel.find({
      designation: req.body.designation,
    });

    if (Array.isArray(employeeExist) && employeeExist.length > 0) {
      for (let i = 0; i < employeeExist.length; i++) {
        const element = employeeExist[i];
        let resobj = {
          employeeName: element.staff_name,
          _id: element._id.toString(),
        };
        rslist.push(resobj);
      }
      res = { data: rslist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//added on 24-05-22
module.exports.staffSingleViewDashboard = async (req) => {
  const { employeeModel } = conn.employee("testDb");
  try {
    let res = {};
    let employeeExist = await employeeModel.findOne({
      _id: req.body._id,
    });
    if (common_service.isEmpty(employeeExist)) {
      let resobj = {};
      let res = {};
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 24-05-22
module.exports.addAttendance = async (req) => {
  const { attendanceModel } = conn.employee(req.decode.db);
  try {
    let res = {};
    if (!common_service.isEmpty(req.body)) {
      let newattendance = new attendanceModel({
        emp_id: req.body.emp_id,
        in: new Date(req.body.in).getTime(),
        out: req.body.out ? req.body.out : null,
        totalWorkHours: null,
        break: null,
        totalBreakHours: null,
        date: new Date(
          common_service.prescisedateconvert(Date.now()).split(" ")[0]
        ).getTime(),
        branchId: process.env.branchId,
      });
      let data = await newattendance.save();
      if (data) {
        data._doc["in"] = common_service
          .prescisedateconvert(data.in)
          .split(" ")[1];
        data._doc["date"] = common_service.prescisedateconvert(data.date);
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode.emp_id,
          type: EMPLOYEE_ATTENDANCE_ADD.type,
          description: EMPLOYEE_ATTENDANCE_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: {},
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save failed ");
        }
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 26-05-22
module.exports.addBreakOut = async (req) => {
  const { attendanceModel } = conn.employee(process.env.db);
  try {
    let res = {};
    let attendanceExist = await attendanceModel.findOne({
      emp_id: req.body.emp_id,
      date: new Date(req.body.date).getTime(),
    });
    if (!common_service.isEmpty(attendanceExist)) {
      if (attendanceExist.break == null) {
        attendanceExist.break = [];
      }
      let breakObj = {
        uuid: common_service.generateUuid(),
        breakout: new Date(req.body.breakout).getTime(),
        breakIn: null,
      };
      attendanceExist.break.push(breakObj);
      let data = await attendanceExist.save();
      if (data) {
        data._doc["in"] = common_service.prescisedateconvert(data.in);
        for (let i = 0; i < data.break.length; i++) {
          const element = data.break[i];
          element.breakout = common_service.prescisedateconvert(
            element.breakout
          );
          element.breakIn = element.breakIn
            ? common_service.prescisedateconvert(element.breakIn)
            : null;
        }
        data._doc["date"] = common_service.prescisedateconvert(data.date);
        res = { data: attendanceExist, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = {
        data: { message: "No Record in this parameter" },
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 26-05-22
module.exports.addBreakIn = async (req) => {
  const { attendanceModel } = conn.employee("testDb");
  try {
    let res = {};
    let attendanceExist = await attendanceModel.findOne({
      emp_id: req.body.emp_id,
      date: new Date(req.body.date).getTime(),
    });
    if (!common_service.isEmpty(attendanceExist)) {
      let index = attendanceExist.break.findIndex(
        (x) => x.uuid == req.body.uuid
      );
      if (index != -1) {
        let breakObj = {
          uuid: attendanceExist.break[index].uuid,
          breakout: attendanceExist.break[index].breakout,
          breakIn: new Date(req.body.breakIn).getTime(),
        };
        attendanceExist.break[index] = breakObj;
      }
      let breakTime = 0;
      for (let i = 0; i < attendanceExist.break.length; i++) {
        const element = attendanceExist.break[i];
        let strTime = new Date(element.breakout).getTime();
        let endTime = new Date(element.breakIn).getTime();
        breakTime = breakTime + (endTime - strTime);
      }
      attendanceExist.totalBreakHours = breakTime;
      let data = await attendanceExist.save();
      if (data) {
        data._doc["in"] = common_service.prescisedateconvert(data.in);
        for (let i = 0; i < data.break.length; i++) {
          const element = data.break[i];
          element.breakout = common_service.prescisedateconvert(
            element.breakout
          );
          element.breakIn = common_service.prescisedateconvert(element.breakIn);
        }
        data._doc["date"] = common_service.prescisedateconvert(data.date);
        data._doc["totalBreakHours"] = common_service.msToHMS(
          data.totalBreakHours
        );
        res = { data: attendanceExist, status: STATUSCODES.SUCCESS };
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
//added on 26-05-22
module.exports.endSchedule = async (req) => {
  const { attendanceModel } = conn.employee(process.env.db);
  try {
    let res = {};
    let attendanceExist = await attendanceModel.findOne({
      emp_id: req.body.emp_id,
      date: new Date(req.body.date).getTime(),
    });
    if (!common_service.isEmpty(attendanceExist)) {
      attendanceExist.out = new Date(req.body.out).getTime();
      attendanceExist.totalWorkHours =
        attendanceExist.out -
        attendanceExist.in -
        attendanceExist.totalBreakHours;
      let data = await attendanceExist.save();
      if (data) {
        data._doc["in"] = common_service.prescisedateconvert(data.in);
        for (let i = 0; i < data.break.length; i++) {
          const element = data.break[i];
          element.breakout = common_service.prescisedateconvert(
            element.breakout
          );
          element.breakIn = common_service.prescisedateconvert(element.breakIn);
        }
        data._doc["date"] = common_service.prescisedateconvert(data.date);
        data._doc["totalBreakHours"] = common_service.msToHMS(
          data.totalBreakHours
        );
        data._doc["out"] = common_service.prescisedateconvert(data.out);
        data._doc["totalWorkHours"] = common_service.msToHMS(
          data.totalWorkHours
        );
        res = { data: attendanceExist, status: STATUSCODES.SUCCESS };
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

//added on 27-05-22
//edited on 01-06-22
module.exports.viewAttendanceList = async (req) => {
  const { attendanceModel } = conn.employee(process.env.db);
  try {
    let res = {};
    let rslist = [];
    let emp_count = 0;
    let attendanceList = await attendanceModel.find({});
    if (req.query.filter == "month") {
      let fil_date = new Date(Date.now()).setDate(1);
      let sort_date = new Date(fil_date).setHours(0, 0, 0, 0);
      attendanceList = attendanceList.filter(
        (element) => element.date > sort_date
      );
      if (Array.isArray(attendanceList) && attendanceList.length > 0) {
        for (let i = 0; i < attendanceList.length; i++) {
          const data = attendanceList[i];
          let resobj = {};
          let emp_exist = await this.viewSingleEmployee(data.emp_id);
          let index = rslist.findIndex(
            (x) => x.employeeId == emp_exist.data.emp_id
          );
          if (index != -1) {
            rslist[index].totalWorkHours =
              rslist[index].totalWorkHours + data.totalWorkHours;
            rslist[index].totalBreakHours =
              rslist[index].totalBreakHours + data.totalBreakHours;
          } else {
            resobj.employeeId =
              emp_exist.status == STATUSCODES.SUCCESS
                ? `${emp_exist.data.emp_id}`
                : null;
            resobj.employeeName =
              emp_exist.status == STATUSCODES.SUCCESS
                ? emp_exist.data.staff_name
                : null;
            resobj.totalWorkHours = data.totalWorkHours;
            resobj.totalBreakHours = data.totalBreakHours;
            resobj.date = common_service
              .prescisedateconvert(data.date)
              .split(" ")[0];
          }
          if (!common_service.isEmpty(resobj)) {
            rslist.push(resobj);
          }
          emp_count = await employeeModel.count();
        }
        for (let i = 0; i < rslist.length; i++) {
          const element = rslist[i];
          element.totalWorkHours = common_service.msToHMS(
            element.totalWorkHours
          );
          element.totalBreakHours = common_service.msToHMS(
            element.totalBreakHours
          );
        }
        res = {
          data: rslist,
          status: STATUSCODES.SUCCESS,
          total_Staff: emp_count,
        };
      } else {
        res = {
          data: { message: "No Record Found On Today" },
          status: STATUSCODES.NOTFOUND,
        };
      }
    } else {
      attendanceList = attendanceList.filter(
        (element) => element.date >= new Date(Date.now()).setHours(0, 0, 0, 0)
      );
      if (Array.isArray(attendanceList) && attendanceList.length > 0) {
        for (let i = 0; i < attendanceList.length; i++) {
          const data = attendanceList[i];
          data._doc["in"] = common_service
            .prescisedateconvert(data.in)
            .split(" ")[1];
          if (data.break != null && data.break != undefined) {
            //added on 01-06-22 -> validation added in case of no break record
            for (let i = 0; i < data.break.length; i++) {
              const element = data.break[i];
              element.breakout = common_service
                .prescisedateconvert(element.breakout)
                .split(" ")[1];
              element.breakIn = common_service
                .prescisedateconvert(element.breakIn)
                .split(" ")[1];
            }
          }
          data._doc["date"] = common_service
            .prescisedateconvert(data.date)
            .split(" ")[0];
          data._doc["totalBreakHours"] = common_service.msToHMS(
            data.totalBreakHours
          );
          data._doc["out"] = data.out
            ? common_service.prescisedateconvert(data.out).split(" ")[1]
            : null;
          data._doc["totalWorkHours"] = common_service.msToHMS(
            data.totalWorkHours
          );
          let emp_exist = await this.viewSingleEmployee(data.emp_id);
          data._doc["empName"] =
            emp_exist.status == STATUSCODES.SUCCESS
              ? emp_exist.data.staff_name
              : null;
          emp_count = await employeeModel.count();
        }
        res = {
          data: attendanceList,
          status: STATUSCODES.SUCCESS,
          total_Staff: emp_count,
        };
      } else {
        res = {
          data: { message: "No Record Found On Today" },
          status: STATUSCODES.NOTFOUND,
        };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 28-05-22
//edited on 16/06/23
module.exports.viewLoansOfAnEmployee = async (req) => {
  const { loanModel } = conn.employee(req.decode.db);
  try {
    let res = {};
    let loanList = await loanModel.find({
      empId: req.body.emp_id,
    });
    if (Array.isArray(loanList) && loanList.length > 0) {
      for (let i = 0; i < loanList.length; i++) {
        const element = loanList[i];
        element._doc["loanId"] = `LOAN${element.transNo}`;
        element._doc["branchId"] = `${element.branchId}`;
        element._doc["loanStartdate"] = common_service.prescisedateconvert(
          element.loanstartDate
        );
        element._doc["loanReqDate"] = common_service.prescisedateconvert(
          element.loanRequestedDate
        );
      }
      res = { data: loanList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 31-05-22
module.exports.viewLoanSingle = async (req) => {
  const { employeeModel, loanModel } = conn.employee(req.decode.db);
  const departmentModel = conn.department(req.decode.db);
  const designationModel = conn.designation(req.decode.db);
  try {
    let res = {};
    let designation = {};
    let department = {};
    let loanSingle = await loanModel.findOne({
      _id: req.body.id,
    });
    if (!common_service.isEmpty(loanSingle)) {
      let resobj = {};
      let empDetails = await employeeModel.findOne({ _id: loanSingle.empId });
      if (!common_service.isEmpty(empDetails)) {
        designation = await designationModel.findOne({
          _Id: empDetails.designation,
        });
        department = await departmentModel.findOne({
          _id: empDetails.department,
        });

        resobj.transNo = loanSingle.transNo;
        resobj.empId = loanSingle.empId;
        resobj.branchId = loanSingle.branchId;

        resobj.actualloanAmount = loanSingle.actualLoanAmount;
        resobj.tenur = loanSingle.tenur;
        resobj.balanceAmount = loanSingle.balanceAmount;
        resobj.paymentMethod = loanSingle.paymentMethod;
        resobj.loanType = loanSingle.loanType;
        // resobj.loanAmount = loanSingle.loanAmount;
        resobj.interestRate = loanSingle.interestRate;
        resobj.interestAmount = loanSingle.interestAmount;
        resobj.endDate = loanSingle.endDate;
        resobj.extraInterestAmount = loanSingle.extraInterestAmount;
        resobj.interestType = loanSingle.interestType;
        resobj.documentType = loanSingle.documentType;
        resobj.documentNumber = loanSingle.documentNumber;
        resobj.imageUrl = loanSingle.imageUrl;

        resobj.loanRequestedDate =
          loanSingle.loanRequestedDate != null
            ? common_service
                .prescisedateconvert(loanSingle.loanRequestedDate)
                .split(" ")[0]
            : null;

        // if (
        //   common_service.checkIfNullOrUndefined(loanSingle.loanRequestedDate)
        // ) {
        //   resobj.totalLoanDuration = 1;
        //   resobj.remainingDuration = 1;
        // } else {
        //   resobj.totalLoanDuration = 0;
        //   resobj.remainingDuration = 0;
        // }
        resobj.loanId = `LN${loanSingle.transNo}`;
        resobj.EMPLOYEEID = !common_service.isEmpty(empDetails)
          ? "EMP" + empDetails.emp_id
          : "";
        resobj.NAME = !common_service.isEmpty(empDetails)
          ? empDetails.staff_name
          : "No staff";

        resobj.IMAGE = !common_service.isEmpty(empDetails)
          ? process.env.FILEURL + empDetails.imageUrl
          : "";
        resobj.MOBILE = !common_service.isEmpty(empDetails)
          ? empDetails.contactnumber
          : "";

        // resobj.emp_name =
        //   empDetails.status == STATUSCODES.SUCCESS ? empDetails.staff_name : "";
        resobj.DEPARTMENT = !common_service.isEmpty(department)
          ? department.departmentName
          : "";
        resobj.DESIGNATION = !common_service.isEmpty(designation)
          ? designation.position
          : "";
        resobj.ACC_HOLDER_NAME = !common_service.isEmpty(empDetails)
          ? empDetails.ac_holder
          : "";
        resobj.ACC_No = !common_service.isEmpty(empDetails)
          ? empDetails.ac_no
          : "";
        resobj.IFSC = !common_service.isEmpty(empDetails)
          ? empDetails.bank_code
          : "";
        resobj.BANKBRANCH = !common_service.isEmpty(empDetails)
          ? empDetails.bankLocation
          : "";
        res = { data: resobj, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: { msg: "not found" }, status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//added on 24-06-22
//added and assembled on 14-07-22
//edited on 19-06-23
module.exports.viewAllEmployeesInABranch = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  try {
    let res = {};
    let emp_list = [];

    if (req.decode.role == ROLES.USER) {
      emp_list = await employeeModel.find({
        branchId: req.body.branchId,
      });
    } else {
      if (req.body.branchId) {
        emp_list = await employeeModel.find({
          branchId: req.body.branchId,
          status: false,
        });
      } else {
        emp_list = await employeeModel.find({ status: false });
      }
    }

    if (emp_list.length > 0) {
      emp_list.map(
        (x) => (
          (x._doc["EMPID"] = `EMP${x.emp_id}`),
          (x.password = "*****"),
          (x.hash = "*****"),
          (x.salt = "*****"),
          (x._doc["imageUrl"] = process.env.FILEURL + x.imageUrl),
          (x._doc["dob"] = common_service
            .prescisedateconvert(x.dob)
            .split(" ")[0])
        )
      );
      res = { data: emp_list, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [{ msg: "not found" }], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 19-06-23
module.exports.removeEmployeeFromDB = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  try {
    if (req.body._id.length == 24) {
      let emp_exist = await employeeModel.findOne({ _id: req.body._id });
      if (!common_service.isEmpty(emp_exist)) {
        // let remvArr = emp_list.imageUrl.split(process.env.SPLITURL);
        if (emp_exist.imageUrl != null || emp_exist.imageUrl != undefined) {
          fs.unlink(
            `public/` + emp_exist.imageUrl.split("Images/")[1],
            (err) => {
              if (err) console.log(err);
            }
          );
        }
        if (emp_exist.qrcode != null || emp_exist.qrcode != undefined) {
          fs.unlink(
            `public/` + emp_exist.qrcode.split(process.env.SPLITURL)[1],
            (err) => {
              if (err) console.log(err);
            }
          );
        }
        let data = await employeeModel.deleteOne({ _id: req.body._id });
        // let data = {};
        if (data) {
          res = { data: emp_exist, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = { data: [{ msg: "not found" }], status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 20-06-23
module.exports.updateEmpLogin = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  try {
    let employeeExist = await employeeModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(employeeExist)) {
      employeeExist.username = req.body.username
        ? req.body.username
        : employeeExist.username;
      if (req.body.password) {
        employeeExist.password = req.body.password;
        let hashresult = adminService.hashpassword(req.body.password);
        employeeExist.salt = hashresult.salt;
        employeeExist.hash = hashresult.hash;
      }
      let data = await employeeExist.save();
      if (data) {
        data._doc["password"] = "*****";
        data._doc["hash"] = "*****";
        data._doc["salt"] = "*****";
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
module.exports.addDocumentType = async (req) => {
  const { documentTypeModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    if (!common_service.isEmpty(req.body)) {
      let documentExist = await documentTypeModel.findOne({
        documentTypeName: req.body.documentTypeName.toLowerCase(),
      });
      if (common_service.isEmpty(documentExist)) {
        let newdoc = new documentTypeModel({
          documentTypeName: req.body.documentTypeName.toLowerCase(),
          status: true,
        });
        let data = await newdoc.save();
        if (data) {
          let newlog = new logModel({
            date: new Date().getTime(),
            emp_id: req.decode.emp_id,
            type: EMPLOYEE_DOCUMENTTYPE_ADD.type,
            description: EMPLOYEE_DOCUMENTTYPE_ADD.description,
            branchId: data.branchId,
            link: {},
            payload: {},
          });
          let logresponse = await newlog.save();
          if (logresponse == null) {
            console.log("log save failed ");
          }
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = { data: documentExist, status: STATUSCODES.CONFLICT };
      }
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
// added on 20-06-23
module.exports.viewDocumentType = async (req) => {
  const { documentTypeModel } = conn.employee(req.decode.db);
  try {
    let docMentExist = await documentTypeModel.find({ status: true });
    if (Array.isArray(docMentExist) && docMentExist.length > 0) {
      res = { data: docMentExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [{ msg: "not found" }], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 20-06-23
module.exports.editDocumentsType = async (req) => {
  const { documentTypeModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let documentExist = await documentTypeModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(documentExist)) {
      documentExist.documentTypeName = !req.body.documentTypeName
        ? documentExist.documentTypeName
        : req.body.documentTypeName;
      let data = await documentExist.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode.emp_id,
          type: EMPLOYEE_DOCUMENTTYPE_ADD.type,
          description: EMPLOYEE_DOCUMENTTYPE_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: {},
        });
        let logresponse = await newlog.save();
        if (logresponse) {
          console.log("log save failed ");
        }
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
module.exports.deleteDocumentType = async (req) => {
  const { documentTypeModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let documentExist = await documentTypeModel.findOne({ _id: req.body._id });
    if (documentExist) {
      documentExist.status = false;
      let data = await documentExist.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode.emp_id,
          type: EMPLOYEE_DOCUMENTTYPE_ADD.type,
          description: EMPLOYEE_DOCUMENTTYPE_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: {},
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save failed ");
        }
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

// added on 28-12-22
module.exports.addLeaveType = async (req) => {
  const { leaveModel } = conn.employee(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
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
          let newlog = new logModel({
            date: new Date().getTime(),
            emp_id: req.decode.emp_id,
            type: EMPLOYEE_DOCUMENTTYPE_ADD.type,
            description: EMPLOYEE_DOCUMENTTYPE_ADD.description,
            branchId: data.branchId,
            link: {},
            payload: {},
          });
          let logresponse = await newlog.save();
          if (logresponse) {
            console.log("log save failed ");
          }
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = { data: { msg: "not found" }, status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
// added on 08-08-23
module.exports.totalSalarypaid = async (req) => {
  const { payrollModel } = conn.employee(req.decode.db);
  try {
    let resObj = {};
    let payrollExist = await payrollModel.find({
      emp_id: req.body.emp_id,
    });
    if (Array.isArray(payrollExist) & (payrollExist.length > 0)) {
      resObj.empId = payrollExist[0]._id;
      resObj.totalSalary = 0;
      for (let i = 0; i < payrollExist.length; i++) {
        resObj.totalSalary = resObj.totalSalary + payrollExist[i].totalPaid;
      }
      return (res = { data: resObj, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 20-09-23
// module.exports.editloanApprovel = async (req) => {
//   const { loanModel } = conn.employee(req.decode.db);
//   try {
//     if (req.decode.role == ROLES.ADMIN) {
//       let loanExist = await loanModel.findOne({
//         _id: req.body._id,
//       });
//       if (loanExist) {
//         if (req.files) {
//           let fp = await common_service.createDirectory(
//             `./public/${req.decode.db}/loanDocument`
//           );
//          // if (loanExist.imageUrl != null) {
//           //   fs.unlink(
//           //     `public/` + loanExist.imageUrl[0].split("Images/")[1],
//           //     (err) => {
//           //       if (err) console.log(err);
//           //     }
//           //   );
//           // }
//           req.files.file.mv(
//             `./public/${
//               req.decode.db
//             }/loanDocument/${loanExist.imageUrl[0].replace(/\s+/g, "")}-` +
//               req.files.file.name.replace(/\s+/g, "")
//           );
//           loanExist.imageUrl[0]=
//             /* process.env.FILEURL +*/
//             `Images/${
//               req.decode.db
//             }/loanDocument/${emp_list.imageUrl[0].replace(/\s+/g, "")}-` +
//             req.files.file.name.replace(/\s+/g, "");
//         }
//         loanExist.tenur = req.body.tenur ? req.body.tenur : loanExist.tenur;
//         loanExist.paymentMethod = req.body.paymentMethod
//           ? req.body.paymentMethod
//           : loanExist.paymentMethod;
//         loanExist.loanType = req.body.loanType
//           ? req.body.loanType
//           : loanExist.loanType;
//         loanExist.interestRate = req.body.interestRate
//           ? req.body.interestRate
//           : loanExist.interestRate;
//         loanExist.interestAmount = req.body.interestAmount
//           ? req.body.interestAmount
//           : loanExist.interestAmount;
//         loanExist.endDate = req.body.endDate
//           ? new Date(req.body.endDate).getTime()
//           : loanExist.endDate;
//         loanExist.extraInterestAmount = req.body.extraInterestAmount
//           ? req.body.extraInterestAmount
//           : loanExist.extraInterestAmount;
//         loanExist.interestType = req.body.interestType
//           ? req.body.interestType
//           : loanExist.interestType;
//         loanExist.loanStartdate = req.body.loanStartdate
//           ? new Date(req.body.loanstartDate).getTime()
//           : loanExist.loanstartDate;
//         loanExist.imageUrl = req.body.imageUrl
//           ? req.body.imageUrl
//           : loanExist.imageUrl;
//         loanExist.loanStatus = req.body.loanStatus
//           ? req.body.loanStatus
//           : loanExist.loanStatus;
//         let data = await loanExist.save();
//         if (data) {
//           res = { data: data, status: STATUSCODES.SUCCESS };
//         } else {
//           res = { data: {}, status: STATUSCODES.NOTFOUND };
//         }
//       } else {
//         res = { data: {}, status: STATUSCODES.NOTFOUND };
//       }
//     } else {
//       res = { data: {}, status: STATUSCODES.FORBIDDEN };
//     }
//     return res;
//   } catch (e) {
//     console.error(e);
//     return (res = { data: e, status: STATUSCODES.ERROR });
//   }
// };

module.exports.editloanApprovel = async (req) => {
  const { loanModel } = conn.employee(req.decode.db);
  try {
    if (req.decode.role == ROLES.ADMIN) {
      let loanExist = await loanModel.findOne({
        _id: req.body._id,
      });
      if (loanExist) {
        if (req.files) {
          let fp = await common_service.createDirectory(
            `./public/${req.decode.db}loanDocument/`
          );
          // fs.unlink(
          //   `public/` + loanExist.imageUrl.split("Images/")[1],
          //   (err) => {
          //     if (err) console.log(err);
          //   }
          // );
          req.files.file.mv(
            `./public/${
              req.decode.db
            }/loanDocument/${loanExist.paymentMethod.replace(/\s+/g, "")}-` +
              req.files.file.name.replace(/\s+/g, "") //edited on 11-03-22 parameter name renamed to paymentMethod
          );
          loanExist.imageUrl =
            /* process.env.FILEURL +*/
            `Images/${
              req.decode.db
            }/loanDocument/${loanExist.paymentMethod.replace(/\s+/g, "")}-` +
            req.files.file.name.replace(/\s+/g, ""); //edited on 11-03-22 parameter name renamed to staff_name
        }
        loanExist.tenur = req.body.tenur ? req.body.tenur : loanExist.tenur;
        loanExist.paymentMethod = req.body.paymentMethod
          ? req.body.paymentMethod
          : loanExist.paymentMethod;
        loanExist.loanType = req.body.loanType
          ? req.body.loanType
          : loanExist.loanType;
        loanExist.interestRate = req.body.interestRate
          ? req.body.interestRate
          : loanExist.interestRate;
        loanExist.interestAmount = req.body.interestAmount
          ? req.body.interestAmount
          : loanExist.interestAmount;
        loanExist.endDate = req.body.endDate
          ? new Date(req.body.endDate).getTime()
          : loanExist.endDate;
        loanExist.extraInterestAmount = req.body.extraInterestAmount
          ? req.body.extraInterestAmount
          : loanExist.extraInterestAmount;
        loanExist.interestType = req.body.interestType
          ? req.body.interestType
          : loanExist.interestType;
        loanExist.loanStartdate = req.body.loanStartdate
          ? new Date(req.body.loanstartDate).getTime()
          : loanExist.loanstartDate;
        loanExist.imageUrl = req.body.imageUrl
          ? req.body.imageUrl
          : loanExist.imageUrl;
        loanExist.loanStatus = req.body.loanStatus
          ? req.body.loanStatus
          : loanExist.loanStatus;
        let data = await loanExist.save();
        if (data) {
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.NOTFOUND };
        }
      } else {
        res = { data: {}, status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.FORBIDDEN };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//#endregion
