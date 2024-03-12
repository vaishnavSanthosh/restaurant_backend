/** @format */

//#region header

const { ZKError } = require("node-zklib/zkerror");

//#region headers
const {
  STATUSCODES,
  LOG,
  URL,
  API,
  ROLES,
  SHIFTSTATUS,
  PREFIXES,
} = require("../Model/enums.js");
const common_Service = require("../Routes/commonRoutes.js");
const settings_service = require("./settingsRoutes");

const conn = require("../../userDbConn");

var res;

//#endregion

//#region methods
// added on 31-08-22
module.exports.addExpense = async (req) => {
  const { expenseModel } = conn.expense(req.decode.db);
  const { shiftLogModel, logModel, shiftModel } = conn.settings(req.decode.db);
  try {
    let shiftExist = {};
    let shiftSettings = await shiftModel.findOne({
      branchId: req.body.branchId,
    });
    if (common_Service.checkObject(shiftSettings)) {
      if (typeof shiftSettings.shiftType == "number") {
        if (shiftSettings.shiftType == 2) {
          shiftExist.shiftId = 0;
        } else {
          shiftExist = await shiftLogModel.findOne({
            status: SHIFTSTATUS.ACT,
            branchId: req.body.branchId,
          });
        }
      } else {
        return (res = {
          data: {
            msg: `no shift Settings Defined For branch ${req.body.branchId}`,
          },
          status: STATUSCODES.NOTFOUND,
        });
      }
    } else {
      return (res = {
        data: {
          msg: `no shift Settings Defined For branch ${req.body.branchId}`,
        },
        status: STATUSCODES.NOTFOUND,
      });
    }
    if (common_Service.checkObject(shiftExist)) {
      let expense = new expenseModel({
        expense: req.body.expense,
        expenseDate: new Date(req.body.expenseDate).getTime(),
        paymentType: req.body.paymentType,
        amount: req.body.amount,
        empId: req.body.empId,
        branchId: req.body.branchId ? req.body.branchId : process.env.branchId,
        dataStatus: true,
        shiftId: shiftExist.shiftId,
      });
      let data = await expense.save();
      if (data) {
        let newlog = new logModel({
          date: data.expenseDate,
          emp_id: req.decode._id,
          type: LOG.EXPENSES_STAFFEXPADD.type,
          shiftId: data.shiftId,
          description: LOG.EXPENSES_STAFFEXPADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (common_Service.isEmpty(logresponse)) {
          console.log("log save failed");
        }
        //   await settings_service.addLog(lg);
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      return (res = {
        data: { msg: `No Active Shifts For ${process.env.branchId}` },
        status: STATUSCODES.NOTFOUND,
      });
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 31-08-22
//edited on 21-10-22
module.exports.viewExpenses = async (req) => {
  const { expenseModel, expenseTypeModel } = conn.expense(req.decode.db);
  const { employeeModel } = conn.employee(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let new_list = [];
    var expenseList = [];
    if (!common_Service.isEmpty(req.decode)) {
      if (req.decode.role == ROLES.ADMIN) {
        expenseList = await expenseModel
          .find({})
          .skip(req.body.index)
          .limit(30);
      } else {
        expenseList = await expenseModel
          .find({
            branchId: process.env.branchId,
          })
          .skip(req.body.index)
          .limit(30);
      }

      if (req.body.branchId) {
        expenseList = expenseList.filter(
          (x) => x.branchId == req.body.branchId
        );
      }
      if (
        common_Service.checkIfNullOrUndefined(
          req.body.fromDate,
          req.body.endDate
        )
      ) {
        expenseList.some((item) => {
          if (
            new Date(item.expenseDate).getTime() >=
              new Date(req.body.fromDate).getTime() &&
            new Date(item.expenseDate).getTime() <=
              new Date(req.body.endDate).getTime()
          ) {
            new_list.push(item);
          }
        });
        expenseList = new_list;
      }

      if (Array.isArray(expenseList) && expenseList.length > 0) {
        for (let i = 0; i < expenseList.length; i++) {
          const element = expenseList[i];
          element._doc["expenseDate"] = common_Service
            .prescisedateconvert(element.expenseDate)
            .split(" ")[0];
          if (element.expense.length == 24) {
            let typeexpenseExist = await expenseTypeModel.findOne({
              _id: element.expense,
            });
            if (!common_Service.isEmpty(typeexpenseExist)) {
              element._doc["expenseName"] = typeexpenseExist.expenseType;
            } else {
              element._doc["expenseName"] = "No expense";
            }
          } else {
            element._doc["expenseName"] = "No expense";
          }
          // let branch = await returnStoreName(element.branchId);
          let branch = await branchModel.findOne({
            storeCode: element.branchId,
          });

          element._doc["locationName"] = branch
            ? branch.branchName
            : "no branch";
          if (common_Service.isObjectId(element.empId)) {
            let employeeExist = await employeeModel.findOne({
              _id: element.empId,
            });
            if (!common_Service.isEmpty(employeeExist)) {
              element._doc["employeeName"] = employeeExist.staff_name;
              element._doc["EMPID"] = `EMP` + employeeExist.emp_id;
            } else {
              element._doc["employeeName"] = "No Employee";
              element._doc["EMPID"] = `No Id`;
            }
          } else {
            element._doc["employeeName"] = "No Employee";
            element._doc["EMPID"] = `No Id`;
          }
        }
        res = { data: expenseList, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: [], status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.viewExpenseById = async (req) => {
  const { expenseModel, expenseTypeModel } = conn.expense(req.decode.db);
  try {
    if (!common_Service.isEmpty(req.decode)) {
      let expenseList = await expenseModel.findOne({
        _id: req.body._id,
      });

      if (!common_Service.isEmpty(expenseList)) {
        {
          const element = expenseList;

          element._doc["expenseDate"] = common_Service
            .prescisedateconvert(element.expenseDate)
            .split(" ")[0];
          if (element.expense.length == 24) {
            let typeexpenseExist = await expenseTypeModel.findOne({
              _id: element.expense,
            });
            if (!common_Service.isEmpty(typeexpenseExist)) {
              element._doc["expenseName"] = typeexpenseExist.expenseType;
            } else {
              element._doc["expenseName"] = "No expense";
            }
          } else {
            element._doc["expenseName"] = "No expense";
          }
        }
        res = { data: expenseList, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 01-08-22
module.exports.editExpense = async (req) => {
  const { expenseModel } = conn.expense(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  let db = req.decode.db;
  try {
    let expense_single = await expenseModel.findOne({
      _id: req.body.id,
    });
    if (expense_single) {
      expense_single.expense = !req.body.expense
        ? expense_single.expense
        : req.body.expense;
      expense_single.expenseDate = !req.body.expenseDate
        ? expense_single.expenseDate
        : new Date(req.body.expenseDate).getTime();
      expense_single.paymentType = !req.body.paymentType
        ? expense_single.paymentType
        : req.body.paymentType;
      expense_single.amount = !req.body.amount
        ? expense_single.amount
        : req.body.amount;
      expense_single.empId = req.body.empId
        ? req.body.empId
        : expense_single.empId;
      let data = await expense_single.save();
      if (data) {
        let newlog = new logModel({
          date: data.expenseDate,
          emp_id: req.decode._id,
          type: LOG.EXPENSES_STAFFEXPADD.type,
          shiftId: data.shiftId,
          description: LOG.EXPENSES_STAFFEXPADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (common_Service.isEmpty(logresponse)) {
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

// added on 1-09-22
module.exports.addExpenseType = async (req) => {
  const { expenseTypeModel } = conn.expense(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    if (req.body.expenseType) {
      let expType = await expenseTypeModel.findOne({
        expenseType: req.body.expenseType.toLowerCase(),
      });
      if (common_Service.isEmpty(expType)) {
        let expenseType = expenseTypeModel({
          expenseType: req.body.expenseType.toLowerCase(),
          branchId: process.env.branchId,
          dataStatus: true,
        });
        let expenseList = await expenseTypeModel.find({
          branchId: process.env.branchId,
        });
        if (Array.isArray(expenseList) && expenseList.length > 0) {
          expenseType.transNo = expenseList[expenseList.length - 1].transNo + 1;
        } else {
          expenseType.transNo = 1;
        }
        let data = await expenseType.save();
        if (data) {
          let newlog = new logModel({
            date: new Date().getTime(),
            emp_id: req.decode._id,
            type: LOG.EXPENSESTYPE_STAFFEXPADD.type,
            description: LOG.EXPENSESTYPE_STAFFEXPADD.description,
            branchId: data.branchId,
            link: {},
            payload: { token: req.headers.authorization, body: req.body },
          });
          let logresponse = await newlog.save();
          if (common_Service.isEmpty(logresponse)) {
            console.log("log save failed");
          }
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        if (expType.dataStatus === false) {
          expType.dataStatus = true;
          let exp = await expType.save();
          res = { status: STATUSCODES.SUCCESS, data: exp };
        } else res = { status: STATUSCODES.EXIST, data: "Record Exist" };
      }
    } else {
      res = { data: {}, status: STATUSCODES.ERROR };
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

// added on 01-09-22
/* added on 15-10-22 */
module.exports.viewExpenseType = async (req) => {
  const { expenseTypeModel } = conn.expense(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let expenseTypeList = await expenseTypeModel.find({ dataStatus: true });
    if (Array.isArray(expenseTypeList) && expenseTypeList.length > 0) {
      /* added on 15-10-22 branch Name added to response*/
      for (let i = 0; i < expenseTypeList.length; i++) {
        const element = expenseTypeList[i];
        let branchExist = await branchModel.findOne({
          storeCode: element.branchId,
        });
        element._doc["branchName"] = !common_Service.isEmpty(branchExist)
          ? branchExist.branchName
          : "no LocationName";
      }
      /* ends here */
      res = { data: expenseTypeList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 01-09-22
module.exports.editExpenseType = async (req) => {
  const { expenseTypeModel } = conn.expense(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let expenseTypeExist = await expenseTypeModel.findOne({
      _id: req.body._id,
    });
    if (!common_Service.isEmpty(expenseTypeExist)) {
      expenseTypeExist.expenseType = !req.body.expenseType
        ? expenseTypeExist.expenseType
        : req.body.expenseType;
      let data = await expenseTypeExist.save();
      let newlog = new logModel({
        date: data.expenseDate,
        emp_id: req.decode._id,
        type: LOG.EXPENSESTYPE_STAFFEXPADD.type,
        description: LOG.EXPENSESTYPE_STAFFEXPADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newlog.save();
      if (common_Service.isEmpty(logresponse)) {
        console.log("log save failed");
      }
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.SUCCESS };
      }
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 01-09-22
module.exports.deleteexpenseType = async (req) => {
  const { expenseTypeModel } = conn.expense(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let expenseTypeExist = await expenseTypeModel.findOne({
      _id: req.body._id,
    });
    if (!common_Service.isEmpty(expenseTypeExist)) {
      expenseTypeExist.dataStatus = false; //always assign fields that are in model
      let data = await expenseTypeExist.save();
      if (data) {
        let newlog = new logModel({
          date: data.expenseDate,
          emp_id: req.decode._id,
          type: LOG.EXPENSESTYPE_STAFFEXPADD.type,
          description: LOG.EXPENSESTYPE_STAFFEXPADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (common_Service.isEmpty(logresponse)) {
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

//edited on 21/06/23
module.exports.addOutletExpense = async (req) => {
  const { outletExpenseModel } = conn.expense(req.decode.db);
  const { paymentModel } = conn.payment(req.decode.db);
  const { shiftLogModel, logModel, shiftModel } = conn.settings(req.decode.db);
  try {
    let shiftExist = {};
    let shiftSettings = await shiftModel.findOne({
      branchId: req.body.branchId,
    });
    if (common_Service.checkObject(shiftSettings)) {
      if (typeof shiftSettings.shiftType == "number") {
        if (shiftSettings.shiftType == 2) {
          shiftExist.shiftId = 0;
        } else {
          shiftExist = await shiftLogModel.findOne({
            status: SHIFTSTATUS.ACT,
            branchId: req.body.branchId,
          });
        }
      } else {
        return (res = {
          data: {
            msg: `no shift Settings Defined For branch ${req.body.branchId}`,
          },
          status: STATUSCODES.NOTFOUND,
        });
      }
    } else {
      return (res = {
        data: {
          msg: `no shift Settings Defined For branch ${req.body.branchId}`,
        },
        status: STATUSCODES.NOTFOUND,
      });
    }
    if (!common_Service.isEmpty(shiftExist)) {
      let newoutletexpense = new outletExpenseModel({
        branchId: req.body.branchId ? req.body.branchId : process.env.branchId,
        expenseType: req.body.expenseType,
        date: new Date(req.body.date).getTime(),
        amount: req.body.amount,
        paidBy: req.body.paidBy,
        dataStatus: true,
        creditAmount: req.body.creditAmount,
        lastPaidAmount: req.body.lastPaidAmount,
        lastPaidDate: new Date().getTime(),
        shiftId: shiftExist.shiftId,
      });

      let outletExpenseList = await outletExpenseModel.find({
        branchId: newoutletexpense.branchId,
      });

      if (Array.isArray(outletExpenseList) && outletExpenseList.length > 0) {
        newoutletexpense.transNo =
          outletExpenseList[outletExpenseList.length - 1].transNo + 1;
      } else {
        newoutletexpense.transNo = 1;
      }

      let data = await newoutletexpense.save();

      if (data) {
        let newlog = new logModel({
          date: data.date,
          emp_id: req.decode._id,
          type: LOG.EXPENSES_OUTLETEXPADD.type,
          shiftId: data.shiftId,
          description: LOG.EXPENSES_OUTLETEXPADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (common_Service.isEmpty(logresponse)) {
          console.log("log save failed");
        }
        if (
          Array.isArray(req.body.paymentMethod) &&
          req.body.paymentMethod.length > 0
        ) {
          let paymentData = {
            invoiceNo:
              data.branchId.substr(3) +
              PREFIXES.EXPENSES +
              req.decode.prefix.substring(0, 2) +
              data.transNo,
            cus_id: null,
            date: data.lastPaidDate,
            paymentMethod: req.body.paymentMethod,
            totalAmount: req.body.totalAmount,
            branchId: req.body.branchId,
            purchasePk: data._id.toString(),
          }; //edited on 08-11-22

          let newpayment = new paymentModel(paymentData);
          let paymentResponse = await newpayment.save();
          if (common_Service.isEmpty(paymentResponse)) {
            return (res = {
              data: { msg: "cannot save payment for this outlet expense" },
              status: STATUSCODES.UNPROCESSED,
            });
          }
        }
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      return (res = {
        data: { msg: `No Active Shifts For ${process.env.branchId}` },
        status: STATUSCODES.NOTFOUND,
      });
    }

    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 02-09-22
module.exports.viewoutletExpense = async (req) => {
  const { outletExpenseModel, expenseTypeModel } = conn.expense(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let new_List = [];
    var outletExpenseList = [];
    if (req.decode.role == ROLES.ADMIN) {
      outletExpenseList = await outletExpenseModel.find({});
    } else {
      outletExpenseList = await outletExpenseModel.find({
        branchId: process.env.branchId,
      });
    }
    if (req.body.branchId) {
      outletExpenseList = outletExpenseList.filter(
        (x) => x.branchId == req.body.branchId
      );
    }
    if (
      common_Service.checkIfNullOrUndefined(req.body.fromDate, req.body.endDate)
    ) {
      outletExpenseList.some((item) => {
        if (
          new Date(item.date).getTime() >=
            new Date(req.body.fromDate).getTime() &&
          new Date(item.date).getTime() <= new Date(req.body.endDate).getTime()
        ) {
          new_List.push(item);
        }
      });

      outletExpenseList = new_List;
    }

    if (Array.isArray(outletExpenseList) && outletExpenseList.length > 0) {
      for (let i = 0; i < outletExpenseList.length; i++) {
        const element = outletExpenseList[i];
        element._doc["date"] = common_Service
          .prescisedateconvert(element.date)
          .split(" ")[0];
        element._doc["lastPaidDate"] = common_Service
          .prescisedateconvert(element.lastPaidDate)
          .split(" ")[0];
        if (common_Service.isObjectId(element.expenseType)) {
          let typeexpenseExist = await expenseTypeModel.findOne({
            _id: element.expenseType,
          });
          if (!common_Service.isEmpty(typeexpenseExist)) {
            element._doc["expenseName"] = typeexpenseExist.expenseType;
          } else {
            element._doc["expenseName"] = "No expense";
          }
        } else {
          element._doc["expenseName"] = "No expense";
        }
        // element._doc["locationName"] = await returnStoreName(element.branchId);
        let branchExist = await branchModel.findOne({
          storeCode: element.branchId,
        });
        element._doc["locationName"] = !common_Service.isEmpty(branchExist)
          ? branchExist.branchName
          : "no locationName";
        element._doc["transNo"] = `${
          req.decode.prefix +
          element.branchId.substr(3) +
          PREFIXES.EXPENSES +
          element.transNo
        }`;
      }
      res = { data: outletExpenseList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 22/06/23
module.exports.editOutletExpense = async (req) => {
  const { outletExpenseModel } = conn.expense(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let outletExist = await outletExpenseModel.findOne({ _id: req.body._id });
    if (!common_Service.isEmpty(outletExist)) {
      outletExist.expenseType = req.body.expenseType
        ? req.body.expenseType
        : outletExist.expenseType;
      outletExist.amount = req.body.amount
        ? req.body.amount
        : outletExist.amount;
      outletExist.paidBy = req.body.paidBy
        ? req.body.paidBy
        : outletExist.paidBy;
      let data = await outletExist.save();
      let newlog = new logModel({
        date: data.date,
        emp_id: req.decode._id,
        type: LOG.EXPENSES_OUTLETEXPADD.type,
        shiftId: data.shiftId,
        description: LOG.EXPENSES_OUTLETEXPADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newlog.save();
      if (common_Service.isEmpty(logresponse)) {
        console.log("log save failed");
      }
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

//edited on 07-06-2022 to add log
module.exports.deleteOutletExpense = async (req) => {
  const { outletExpenseModel } = conn.expense(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  let db = process.env.db;
  let res = {};
  try {
    let exp = await outletExpenseModel.findOne({ _id: req.params.id });
    if (exp) {
      exp.dataStatus = false;
      let data = await exp.save();
      if (data) {
        let newlog = new logModel({
          date: data.date,
          emp_id: req.decode._id,
          type: LOG.EXPENSES_OUTLETEXPADD.type,
          shiftId: data.shiftId,
          description: LOG.EXPENSES_OUTLETEXPADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (common_Service.isEmpty(logresponse)) {
          console.log("log save failed");
        }
        let lg = {
          type: LOG.EXP_DELETEOUTLETEXPENSE,
          emp_id: req.decode._id,
          description: "delete outlet expense",
          link: {
            url: URL.null,
            api: API.null,
          },
        };
        await settings_service.addLog(lg, db);
        res = { status: STATUSCODES.SUCCESS, data: data };
      } else res = { status: STATUSCODES.UNPROCESSED, data: {} };
    } else {
      res = { status: STATUSCODES.NOTFOUND, data: "Record Exist" };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.getAllActiveOutletExpense = async (req) => {
  const { outletExpenseModel, expenseTypeModel } = conn.expense(process.env.db);
  let res = {};
  try {
    let data = await outletExpenseModel.find({
      dataStatus: true,
    });
    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        let expType = await expenseTypeModel.findOne({
          _id: data[i].expenseType,
        });
        data[i]._doc["date"] = common_Service.prescisedateconvert(data[i].date);
        data[i]._doc["expenseName"] = expType.expenseType;
      }
      res = { status: STATUSCODES.SUCCESS, data };
    } else res = { status: STATUSCODES.NOTFOUND, data: {} };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.getAllOutletExpense = async (req) => {
  const { outletExpenseModel } = conn.expense(process.env.db);
  let res = {};
  try {
    let data = await outletExpenseModel.find({});
    if (data) {
      for (let i = 0; i < data.length; i++) {
        data[i]._doc["date"] = common_Service.prescisedateconvert(data[i].date);
      }
      res = { status: STATUSCODES.SUCCESS, data };
    } else res = { status: STATUSCODES.NOTFOUND, data: {} };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 07-06-2022 to add log
// module.exports.addPettyCash = async (req) => {
//   const { pettycashModel } = conn.expense(process.env.db);
//   let db = process.env.db;
//   let res = {};
//   try {
//     let docNo = 0;
//     let pettyCount = await pettycashModel.aggregate([
//       {
//         $sort: { docNo: -1 },
//       },
//     ]);
//     if (pettyCount.length > 0) {
//       docNo = pettyCount[0].docNo + 1;
//     } else {
//       docNo = 1;
//     }

//     if (req.body.expenseType && req.body.amount && req.body.date) {
//       let pettyCash = pettycashModel({
//         docNo,
//         expenseType: req.body.expenseType,
//         branchId: req.body.branchId ? req.body.branchId : process.env.branchId,
//         amount: req.body.amount,
//         date: new Date(req.body.date).getTime(),
//         dataStatus: true,
//       });
//       let data = await pettyCash.save();
//       if (data) {
//         let lg = {
//           type: LOG.EXP_ADDPETTYCASHRECEIPT,
//           emp_id: null,
//           description: "add pettycash receipt",
//           link: {
//             url: URL.null,
//             api: API.null,
//           },
//         };
//         await settings_service.addLog(lg, db);
//         res = { status: STATUSCODES.SUCCESS, data: data };
//       } else res = { status: STATUSCODES.UNPROCESSED, data: {} };
//     } else {
//       res = { status: STATUSCODES.NOTACCEPTABLE, data: {} };
//     }
//     return res;
//   } catch (error) {
//     console.log(error);
//     return (res = { status: STATUSCODES.ERROR, data: "Internel server error" });
//   }
// };

// added on 07-09-22
module.exports.addPettycash = async (req) => {
  const { pettycashModel } = conn.expense(req.decode.db);
  const { shiftLogModel, logModel } = conn.settings(req.decode.db);
  try {
    /* let shiftExist = await shiftLogModel.findOne({
      status: SHIFTSTATUS.ACT,
      branchId: process.env.branchId,
    }); */
    // if (!common_Service.isEmpty(shiftExist)) {
    let newpettycash = new pettycashModel({
      branchId: req.body.branchId ? req.body.branchId : process.env.branchId,
      expenseType: req.body.expenseType,
      date: new Date(req.body.date).getTime(),
      amount: req.body.amount,
      dataStatus: true,
      // shiftId: shiftExist.shiftId,
    });
    let pettyCashList = await pettycashModel.find({
      branchId: newpettycash.branchId,
    });
    if (Array.isArray(pettyCashList) && pettyCashList.length > 0) {
      newpettycash.transNo =
        pettyCashList[pettyCashList.length - 1].transNo + 1;
    } else {
      newpettycash.transNo = 1;
    }
    let data = await newpettycash.save();
    if (data) {
      let newlog = new logModel({
        date: data.date,
        emp_id: req.decode._id,
        type: LOG.EXPENSES_PETTYCASHADD.type,
        shift_id: data.shift_id,
        description: LOG.EXPENSES_PETTYCASHADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newlog.save();
      if (common_Service.isEmpty(logresponse)) {
      }
      res = { data: data, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.UNPROCESSED };
    }
    /* } else {
      return (res = {
        data: { msg: `No Active Shifts For ${process.env.branchId}` },
        status: STATUSCODES.NOTFOUND,
      });
    } */
    return res;
  } catch (error) {
    if (error.code == 11000)
      return (res = {
        data: "orderNo duplication",
        status: STATUSCODES.UNPROCESSED,
      });
    else
      return (res = {
        data: error.message,
        status: STATUSCODES.ERROR,
      });
  }
};

// added on 07-09-22
module.exports.viewPettyCash = async (req) => {
  const { pettycashModel, expenseTypeModel, outletExpenseModel } = conn.expense(
    req.decode.db
  );
  const { branchModel } = conn.location(req.decode.db);

  try {
    req.body.index = parseInt(req.body.index) * 20;
    let new_List = [];
    var pettyCashList = [];
    if (req.decode.role == ROLES.ADMIN) {
      pettyCashList = await pettycashModel
        .find({})
        .skip(req.body.index)
        .limit(30);
    } else {
      pettyCashList = await pettycashModel
        .find({
          branchId: req.body.branchId,
        })
        .skip(req.body.index)
        .limit(30);
    }

    if (req.body.branchId != "null") {
      pettyCashList = pettyCashList.filter(
        (x) => x.branchId == req.body.branchId
      );
    }

    if (
      common_Service.checkIfNullOrUndefined(req.body.fromDate, req.body.endDate)
    ) {
      pettyCashList.some((item) => {
        if (
          new Date(item.date).getTime() >=
            new Date(req.body.fromDate).getTime() &&
          new Date(item.date).getTime() <= new Date(req.body.endDate).getTime()
        ) {
          new_List.push(item);
        }
      });
      pettyCashList = new_List;
    }
    if (Array.isArray(pettyCashList) && pettyCashList.length > 0) {
      for (let i = 0; i < pettyCashList.length; i++) {
        const element = pettyCashList[i];
        let outletExpenseList = await outletExpenseModel.find({
          branchId: element.branchId,
          date: { $gt: new Date(element.date).getTime() },
        });
        element._doc["date"] = common_Service
          .prescisedateconvert(element.date)
          .split(" ")[0];

        if (element.expenseType.length == 24) {
          let pettycashExist = await expenseTypeModel.findOne({
            _id: element.expenseType,
          });
          element._doc["expenseTypename"] = !common_Service.isEmpty(
            pettycashExist
          )
            ? pettycashExist.expenseType
            : "no Expense";
        } else {
          element._doc["expenseName"] = "No expense";
        }
        // let locationExist = await returnStoreName(element.branchId);
        let branchExist = await branchModel.findOne({
          storeCode: element.branchId,
        });
        element._doc["locationName"] = !common_Service.isEmpty(branchExist)
          ? branchExist.branchName
          : "no locationName";
        element._doc["transNo"] = `${
          PREFIXES.EXPENSES + element.branchId.substring(3, 5) + element.transNo
        }`;
        element._doc["isEditable"] =
          Array.isArray(outletExpenseList) && outletExpenseList.length > 0
            ? false
            : true;
      }
      res = { data: pettyCashList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 07-09-22
//edited on 25-10-22 -> code validated with admin only privilages
module.exports.editPettyCash = async (req) => {
  //   const { pettycashModel } = conn.expense(process.env.db);
  //   let db = process.env.db;
  //   let res = {};
  //   try {
  //     let cash = {
  //       branchId: req.body.branchId,
  //       amount: req.body.amount,
  //       date: new Date(req.body.date).getTime(),
  //       expenseType: req.body.expenseType,
  //     };
  //     let pettyCash = await pettycashModel.findOneAndUpdate(
  //       { _id: req.params.id },
  //       { $set: cash },
  //       { returnDocument: "after" }
  //     );
  //     if (pettyCash) {
  //       let lg = {
  //         type: LOG.EXP_EDITPETTYCASHRECEIPT,
  //         emp_id: req.decode._id,
  //         description: "edit petty cash expense",
  //         link: {
  //           url: URL.null,
  //           api: API.null,
  //         },
  //       };
  //       await settings_service.addLog(lg, db);
  //       res = { status: STATUSCODES.SUCCESS, data: pettyCash };
  //     } else {
  //       res = { status: STATUSCODES.NOTFOUND, data: {} };
  //     }
  //     return res;
  //   } catch (error) {
  //     return (res = { status: STATUSCODES.ERROR, data: error.message });
  //   }
  // };
  const { pettycashModel, outletExpenseModel } = conn.expense(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let pettycashExist = await pettycashModel.findOne({
      _id: req.body._id,
    });
    if (!common_Service.isEmpty(pettycashExist)) {
      let outletExpenseList = await outletExpenseModel.find({
        branchId: pettycashExist.branchId,
        date: { $gt: new Date(pettycashExist.date).getTime() },
      });
      if (Array.isArray(outletExpenseList) && outletExpenseList.length > 0) {
        res = { data: "Expense used", status: STATUSCODES.FORBIDDEN };
      } else {
        pettycashExist.branchId = !req.body.branchId
          ? pettycashExist.branchId
          : req.body.branchId;
        pettycashExist.expenseType = !req.body.expenseType
          ? pettycashExist.expenseType
          : req.body.expenseType;
        pettycashExist.amount = !req.body.amount
          ? pettycashExist.amount
          : req.body.amount;
        let data = await pettycashExist.save();
        if (data) {
          let newlog = new logModel({
            date: data.date,
            emp_id: req.decode._id,
            type: LOG.EXPENSES_PETTYCASHADD.type,
            shift_id: data.shift_id,
            description: LOG.EXPENSES_PETTYCASHADD.description,
            branchId: data.branchId,
            link: {},
            payload: { token: req.headers.authorization, body: req.body },
          });
          let logresponse = await newlog.save();
          if (isEmpty(logresponse)) {
          }
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      }
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 04-01-23
// module.exports.viewExpenseReport = async (req) => {
//   const { pettycashModel, expenseModel, expenseTypeModel, outletExpenseModel } =
//     conn.expense(req.decode.db);
//   const { employeeModel } = conn.employee(req.decode.db);
//   const { branchModel } = conn.location(req.decode.db);
//   let res = {},
//     arr = [];
//   try {
//     if (req.body.category.replace(/\s+/g, "").toLowerCase() == "staffexpense") {
//       let expense = await expenseModel.find({ empId: req.body.empId });
//       if (expense.length > 0) {
//         let fromDate, toDate;
//         if (req.body.fromDate != null)
//           fromDate = new Date(req.body.fromDate).getTime();
//         if (req.body.toDate != null)
//           toDate = new Date(req.body.toDate).getTime();

//         if (req.body.fromDate != null && req.body.toDate != null) {
//           for (let i = 0; i < expense.length; i++) {
//             let expenseType = {};
//             if (common_Service.isObjectId(expense[i].expense)) {
//               expenseType = await expenseTypeModel.findOne({
//                 _id: expense[i].expense,
//               });
//             }

//             if (
//               fromDate <= expense[i].expenseDate &&
//               expense[i].expenseDate <= toDate
//             ) {
//               let br = await branchModel.findOne({
//                 storeCode: expense[i].branchId,
//               });
//               let exp = {
//                 _id: expense[i]._id,
//                 expense: expenseType.expenseType,
//                 branchName: br?.branchName,
//                 branchCode: expense[i].branchId,
//                 date: common_Service
//                   .prescisedateconvert(expense[i].expenseDate)
//                   .split(" ")[0],
//                 amount: expense[i].amount,
//                 paymentMethod: expense[i].paymentType,
//               };
//               arr.push(exp);
//             }
//           }
//           if (arr.length > 0)
//             return (res = { data: arr, status: STATUSCODES.SUCCESS });
//           else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
//         } else if (req.body.fromDate == null && req.body.toDate != null) {
//           for (let i = 0; i < expense.length; i++) {
//             let expenseType = {};
//             if (common_Service.isObjectId(expense[i].expense)) {
//               expenseType = await expenseTypeModel.findOne({
//                 _id: expense[i].expense,
//               });
//             }
//             if (expense[i].expenseDate <= toDate) {
//               let br = await branchModel.findOne({
//                 storeCode: expense[i].branchId,
//               });
//               let exp = {
//                 _id: expense[i]._id,
//                 expense: expenseType.expenseType,
//                 branchName: br?.branchName,
//                 branchCode: expense[i].branchId,
//                 date: common_Service
//                   .prescisedateconvert(expense[i].expenseDate)
//                   .split(" ")[0],
//                 amount: expense[i].amount,
//                 paymentMethod: expense[i].paymentType,
//               };
//               arr.push(exp);
//             }
//           }
//           if (arr.length > 0)
//             return (res = { data: arr, status: STATUSCODES.SUCCESS });
//           else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
//         } else if (req.body.fromDate != null && req.body.toDate == null) {
//           for (let i = 0; i < expense.length; i++) {
//             let expenseType = {};
//             if (common_Service.isObjectId(expense[i].expense)) {
//               expenseType = await expenseTypeModel.findOne({
//                 _id: expense[i].expense,
//               });
//             }
//             if (fromDate <= expense[i].expenseDate) {
//               let br = await branchModel.findOne({
//                 storeCode: expense[i].branchId,
//               });
//               let exp = {
//                 _id: expense[i]._id,
//                 expense: expenseType.expenseType,
//                 branchName: br?.branchName,
//                 branchCode: expense[i].branchId,
//                 date: common_Service
//                   .prescisedateconvert(expense[i].expenseDate)
//                   .split(" ")[0],
//                 amount: expense[i].amount,
//                 paymentMethod: expense[i].paymentType,
//               };
//               arr.push(exp);
//             }
//           }
//           if (arr.length > 0)
//             return (res = { data: arr, status: STATUSCODES.SUCCESS });
//           else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
//         } else {
//           for (let i = 0; i < expense.length; i++) {
//             let expenseType = {};
//             if (common_Service.isObjectId(expense[i].expense)) {
//               expenseType = await expenseTypeModel.findOne({
//                 _id: expense[i].expense,
//               });
//             }
//             let br = await branchModel.findOne({
//               storeCode: expense[i].branchId,
//             });
//             let exp = {
//               _id: expense[i]._id,
//               expense: expenseType.expenseType,
//               branchName: br?.branchName,
//               branchCode: expense[i].branchId,
//               date: common_Service
//                 .prescisedateconvert(expense[i].expenseDate)
//                 .split(" ")[0],
//               amount: expense[i].amount,
//               paymentMethod: expense[i].paymentType,
//             };
//             arr.push(exp);
//           }
//           return (res = { data: arr, status: STATUSCODES.SUCCESS });
//         }
//       } else {
//         return (res = { data: {}, status: STATUSCODES.NOTFOUND });
//       }
//     } else if (
//       req.body.category.replace(/\s+/g, "").toLowerCase() == "outletexpense"
//     ) {
//       let fromDate, toDate;
//       let expense = await outletExpenseModel.find({});
//       if (req.body.fromDate != null)
//         fromDate = new Date(req.body.fromDate).getTime();
//       if (req.body.toDate != null) toDate = new Date(req.body.toDate).getTime();
//       if (expense.length > 0) {
//         if (req.body.fromDate != null && req.body.toDate != null) {
//           for (let i = 0; i < expense.length; i++) {
//             let expenseType = {};
//             if (common_Service.isObjectId(expense[i].expense)) {
//               expenseType = await expenseTypeModel.findOne({
//                 _id: expense[i].expense,
//               });
//             }
//             if (fromDate <= expense[i].date && expense[i].date <= toDate) {
//               let br = await branchModel.findOne({
//                 storeCode: expense[i].branchId,
//               });
//               let exp = {
//                 _id: expense[i]._id,
//                 transNo:
//                   PREFIXES.EXPENSES +
//                   req.decode.prefix.substring(0, 2) +
//                   expense[i].transNo,
//                 expenseType: expenseType.expenseType,
//                 date: common_Service
//                   .prescisedateconvert(expense[i].date)
//                   .split(" ")[0],
//                 amount: expense[i].amount,
//                 paymentMethod: expense[i].paymentType,
//                 branchId: expense[i].branchId,
//                 branchName: br?.branchName,
//                 creditAmount: expense[i].creditAmount,
//                 lastPaidAmount: expense[i].lastPaidAmount,
//                 lastPaidDate: common_Service
//                   .prescisedateconvert(expense[i].lastPaidDate)
//                   .split(" ")[0],
//                 paidBy: expense[i].paidBy,
//               };
//               arr.push(exp);
//             }
//           }
//           if (arr.length > 0)
//             return (res = { data: arr, status: STATUSCODES.SUCCESS });
//           else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
//         } else if (req.body.fromDate != null && req.body.toDate == null) {
//           for (let i = 0; i < expense.length; i++) {
//             let expenseType = {};
//             if (isObjectId(expense[i].expense)) {
//               expenseType = await expenseTypeModel.findOne({
//                 _id: expense[i].expense,
//               });
//             }
//             if (fromDate <= expense[i].date) {
//               let br = await branchModel.findOne({
//                 storeCode: expense[i].branchId,
//               });
//               let exp = {
//                 _id: expense[i]._id,
//                 transNo:
//                   PREFIXES.EXPENSES +
//                   req.decode.prefix.substring(0, 2) +
//                   expense[i].transNo,
//                 expenseType: expenseType.expenseType,
//                 date: common_Service
//                   .prescisedateconvert(expense[i].date)
//                   .split(" ")[0],
//                 amount: expense[i].amount,
//                 paymentMethod: expense[i].paymentType,
//                 branchId: expense[i].branchId,
//                 branchName: br?.branchName,
//                 creditAmount: expense[i].creditAmount,
//                 lastPaidAmount: expense[i].lastPaidAmount,
//                 lastPaidDate: common_Service
//                   .prescisedateconvert(expense[i].lastPaidDate)
//                   .split(" ")[0],
//                 paidBy: expense[i].paidBy,
//               };
//               arr.push(exp);
//             }
//           }
//           if (arr.length > 0)
//             return (res = { data: arr, status: STATUSCODES.SUCCESS });
//           else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
//         } else if (req.body.fromDate == null && req.body.toDate != null) {
//           for (let i = 0; i < expense.length; i++) {
//             let expenseType = {};
//             if (common_Service.isObjectId(expense[i].expense)) {
//               expenseType = await expenseTypeModel.findOne({
//                 _id: expense[i].expense,
//               });
//             }
//             if (expense[i].date <= toDate) {
//               let br = await branchModel.findOne({
//                 storeCode: expense[i].branchId,
//               });
//               let exp = {
//                 _id: expense[i]._id,
//                 transNo:
//                   PREFIXES.EXPENSES +
//                   req.decode.prefix.substring(0, 2) +
//                   expense[i].transNo,
//                 expenseType: expenseType.expenseType,
//                 date: common_Service
//                   .prescisedateconvert(expense[i].date)
//                   .split(" ")[0],
//                 amount: expense[i].amount,
//                 paymentMethod: expense[i].paymentType,
//                 branchId: expense[i].branchId,
//                 branchName: br?.branchName,
//                 creditAmount: expense[i].creditAmount,
//                 lastPaidAmount: expense[i].lastPaidAmount,
//                 lastPaidDate: common_Service
//                   .prescisedateconvert(expense[i].lastPaidDate)
//                   .split(" ")[0],
//                 paidBy: expense[i].paidBy,
//               };
//               arr.push(exp);
//             }
//           }
//           if (arr.length > 0)
//             return (res = { data: arr, status: STATUSCODES.SUCCESS });
//           else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
//         } else {
//           for (let i = 0; i < expense.length; i++) {
//             let expenseType = {};
//             if (common_Service.isObjectId(expense[i].expense)) {
//               expenseType = await expenseTypeModel.findOne({
//                 _id: expense[i].expense,
//               });
//             }
//             let br = await branchModel.findOne({
//               storeCode: expense[i].branchId,
//             });
//             let exp = {
//               _id: expense[i]._id,
//               transNo:
//                 PREFIXES.EXPENSES +
//                 req.decode.prefix.substring(0, 2) +
//                 expense[i].transNo,
//               expenseType: expenseType.expenseType,
//               date: common_Service
//                 .prescisedateconvert(expense[i].date)
//                 .split(" ")[0],
//               amount: expense[i].amount,
//               paymentMethod: expense[i].paymentType,
//               branchId: expense[i].branchId,
//               branchName: br?.branchName,
//               creditAmount: expense[i].creditAmount,
//               lastPaidAmount: expense[i].lastPaidAmount,
//               lastPaidDate: common_Service
//                 .prescisedateconvert(expense[i].lastPaidDate)
//                 .split(" ")[0],
//               paidBy: expense[i].paidBy,
//             };
//             arr.push(exp);
//           }
//           return (res = { data: arr, status: STATUSCODES.SUCCESS });
//         }
//       } else {
//         return (res = { data: {}, status: STATUSCODES.NOTFOUND });
//       }
//     } else if (
//       req.body.category.replace(/\s+/g, "").toLowerCase() == "pettycashreceipt"
//     ) {
//       let str = {};
//       if (req.body.branchId != null) str.branchId = req.body.branchId;
//       let expense = await pettycashModel.find(str);
//       if (expense.length > 0) {
//         let fromDate, toDate;
//         if (req.body.fromDate != null)
//           fromDate = new Date(req.body.fromDate).getTime();
//         if (req.body.toDate != null)
//           toDate = new Date(req.body.toDate).getTime();
//         if (req.body.fromDate != null && req.body.toDate != null) {
//           for (let i = 0; i < expense.length; i++) {
//             let expenseType = {};
//             if (common_Service.isObjectId(expense[i].expense)) {
//               expenseType = await expenseTypeModel.findOne({
//                 _id: expense[i].expense,
//               });
//             }
//             if (fromDate <= expense[i].date && expense[i].date <= toDate) {
//               let br = await branchModel.findOne({
//                 storeCode: expense[i].branchId,
//               });
//               let exp = {
//                 _id: expense[i]._id,
//                 transNo:
//                   PREFIXES.PETTYCASH +
//                   req.decode.prefix.substring(0, 2) +
//                   expense[i].transNo,
//                 expense: expenseType.expenseType,
//                 date: common_Service
//                   .prescisedateconvert(expense[i].date)
//                   .split(" ")[0],
//                 amount: expense[i].amount,
//                 branchId: expense[i].branchId,
//                 branchName: br?.branchName,
//               };
//               arr.push(exp);
//             }
//           }
//           if (arr.length > 0)
//             return (res = { data: arr, status: STATUSCODES.SUCCESS });
//           else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
//         } else if (req.body.fromDate == null && req.body.toDate != null) {
//           for (let i = 0; i < expense.length; i++) {
//             let expenseType = {};
//             if (common_Service.isObjectId(expense[i].expense)) {
//               expenseType = await expenseTypeModel.findOne({
//                 _id: expense[i].expense,
//               });
//             }
//             if (expense[i].date <= toDate) {
//               let br = await branchModel.findOne({
//                 storeCode: expense[i].branchId,
//               });
//               let exp = {
//                 _id: expense[i]._id,
//                 transNo:
//                   PREFIXES.PETTYCASH +
//                   req.decode.prefix.substring(0, 2) +
//                   expense[i].transNo,
//                 expense: expenseType.expenseType,
//                 date: common_Service
//                   .prescisedateconvert(expense[i].date)
//                   .split(" ")[0],
//                 amount: expense[i].amount,
//                 branchId: expense[i].branchId,
//                 branchName: br?.branchName,
//               };
//               arr.push(exp);
//             }
//           }
//           if (arr.length > 0)
//             return (res = { data: arr, status: STATUSCODES.SUCCESS });
//           else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
//         } else if (req.body.fromDate != null && req.body.toDate == null) {
//           for (let i = 0; i < expense.length; i++) {
//             let expenseType = {};
//             if (common_Service.isObjectId(expense[i].expense)) {
//               expenseType = await expenseTypeModel.findOne({
//                 _id: expense[i].expense,
//               });
//             }
//             if (fromDate <= expense[i].date) {
//               let br = await branchModel.findOne({
//                 storeCode: expense[i].branchId,
//               });
//               let exp = {
//                 _id: expense[i]._id,
//                 transNo:
//                   PREFIXES.PETTYCASH +
//                   req.decode.prefix.substring(0, 2) +
//                   expense[i].transNo,
//                 expense: expenseType.expenseType,
//                 date: common_Service
//                   .prescisedateconvert(expense[i].date)
//                   .split(" ")[0],
//                 amount: expense[i].amount,
//                 branchId: expense[i].branchId,
//                 branchName: br?.branchName,
//               };
//               arr.push(exp);
//             }
//           }
//           if (arr.length > 0)
//             return (res = { data: arr, status: STATUSCODES.SUCCESS });
//           else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
//         } else {
//           for (let i = 0; i < expense.length; i++) {
//             let expenseType = {};
//             if (common_Service.isObjectId(expense[i].expense)) {
//               expenseType = await expenseTypeModel.findOne({
//                 _id: expense[i].expense,
//               });
//             }
//             let br = await branchModel.findOne({
//               storeCode: expense[i].branchId,
//             });
//             let exp = {
//               _id: expense[i]._id,
//               transNo:
//                 PREFIXES.PETTYCASH +
//                 req.decode.prefix.substring(0, 2) +
//                 expense[i].transNo,
//               expense: expenseType.expenseType,
//               date: common_Service
//                 .prescisedateconvert(expense[i].date)
//                 .split(" ")[0],
//               amount: expense[i].amount,
//               branchId: expense[i].branchId,
//               branchName: br?.branchName,
//             };
//             arr.push(exp);
//           }
//           return (res = { data: arr, status: STATUSCODES.SUCCESS });
//         }
//       } else {
//         return (res = { data: {}, status: STATUSCODES.NOTFOUND });
//       }
//     } else {
//       return (res = {
//         status: STATUSCODES.NOTACCEPTABLE,
//         data: "check expense category",
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     return (res = { status: STATUSCODES.ERROR, data: "Internel server error" });
//   }
// };

//added on 27-09-22 #subfunction
//edited on 04-11-22
module.exports.expenseTable = async (req) => {
  const { outletExpenseModel, pettycashModel, expenseTypeModel } = conn.expense(
    req.decode.db
  );
  try {
    // let outletexpenseList = await outletExpenseModel.find({
    //   branchId: req.branchId,
    //   date: { $gte: req.fromDate },
    //   date: { $lte: req.endDate },
    // });
    // let pettycashlist = await pettycashModel.find({
    //   branchId: req.branchId,
    //   date: { $gte: req.fromDate },
    //   date: { $lte: req.endDate },
    // });
    let outletexpenseList = await outletExpenseModel.find({
      branchId: req.branchId,
    });
    let pettycashlist = await pettycashModel.find({
      branchId: req.branchId,
    });
    let expenseTable = {
      openingBalance: 0,
      expenseList: [],
      balance: 0,
      crTot: 0,
      debTot: 0,
    };
    if (req.endDate != null) {
      pettycashlist.map((x) => {
        if (x.date >= req.fromDate && x.date <= req.endDate) {
          expenseTable.openingBalance = expenseTable.openingBalance + x.amount;
        } else {
        }
      });
      await Promise.all(
        outletexpenseList.map(async (x) => {
          if (x.date >= req.fromDate && x.date <= req.endDate) {
            let typeexpenseExist = await expenseTypeModel.findOne({
              _id: x.expenseType,
            });

            if (!common_Service.isEmpty(typeexpenseExist)) {
              x._doc["expenseName"] = typeexpenseExist.expenseType;
            } else {
              x._doc["expenseName"] = "No expense";
            }
            expenseTable.crTot =
              expenseTable.crTot + !x.creditAmount ? 0 : x.creditAmount;
            expenseTable.debTot = expenseTable.debTot + x.amount;
            expenseTable.expenseList.push({
              expenseName: x._doc["expenseName"],
              date: common_Service.prescisedateconvert(x.date).split(" ")[0],
              debit: x.amount,
              credit: !x.creditAmount ? 0 : x.creditAmount,
            });
          } else {
          }
        })
      );
    } else {
      pettycashlist.map((x) => {
        if (x.date >= req.fromDate) {
          expenseTable.openingBalance = expenseTable.openingBalance + x.amount;
        }
      });
      await Promise.all(
        outletexpenseList.map(async (x) => {
          if (x.date >= req.fromDate) {
            let typeexpenseExist = await expenseTypeModel.findOne({
              _id: x.expenseType,
            });

            if (!common_Service.isEmpty(typeexpenseExist)) {
              x._doc["expenseName"] = typeexpenseExist.expenseType;
            } else {
              x._doc["expenseName"] = "No expense";
            }
            expenseTable.crTot =
              expenseTable.crTot + !x.creditAmount ? 0 : x.creditAmount;
            expenseTable.debTot = expenseTable.debTot + x.amount;
            expenseTable.expenseList.push({
              expenseName: x._doc["expenseName"],
              date: common_Service.prescisedateconvert(x.date).split(" ")[0],
              debit: x.amount,
              credit: !x.creditAmount ? 0 : x.creditAmount,
            });
          }
        })
      );
    }
    var o = 0;
    await Promise.all(
      expenseTable.expenseList.map((x) => {
        o = o + x.debit;
        expenseTable.balance = expenseTable.openingBalance - o;
      })
    );
    return expenseTable;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 01-10-22 #subfunction
module.exports.viewPettyBalanceOfAnOutlet = async (req) => {
  const { outletExpenseModel, pettycashModel } = conn.expense(req.decode.db);
  try {
    let pettyCashList = await pettycashModel.find({ branchId: req.branchId });
    var outletexpenseList = await outletExpenseModel.find({
      branchId: req.branchId,
    });
    var newPettylist = [];
    var newoutLetList = [];
    var pettyAmountTotal = 0;
    var outletAmountTotal = 0;
    if (req.endDate == null) {
      let startDateMilli = common_Service
        .prescisedateconvert(req.fromDate)
        .split("-");
      let endDay = new Date(startDateMilli[0], startDateMilli[1], 0).getDate();
      req.endDate = new Date(
        `${startDateMilli[0]}-${startDateMilli[1]}-${endDay} 23:59:59`
      ).getTime();
    }
    pettyCashList.some((item) => {
      if (
        item.date >= new Date(req.fromDate).getTime() &&
        item.date <= new Date(req.endDate).getTime()
      ) {
        newPettylist.push(item);
      }
    });
    outletexpenseList.some((item) => {
      if (
        item.date >= new Date(req.fromDate).getTime() &&
        item.date <= new Date(req.endDate).getTime()
      ) {
        newoutLetList.push(item);
      }
    });
    if (Array.isArray(newPettylist) && newPettylist.length > 0) {
      await Promise.all(
        newPettylist.map((x) => {
          pettyAmountTotal = pettyAmountTotal + x.amount;
        })
      );
    }
    if (Array.isArray(newoutLetList) && newoutLetList.length > 0) {
      await Promise.all(
        newoutLetList.map((x) => {
          outletAmountTotal = outletAmountTotal + x.amount;
        })
      );
    }
    let substract = 0;
    if (pettyAmountTotal > outletAmountTotal) {
      substract = pettyAmountTotal - outletAmountTotal;
    } else {
      substract = outletAmountTotal - pettyAmountTotal;
    }
    return substract;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 15-10-22
// edited on 03/08/23
module.exports.generateExpenseTypeNumber = async (req) => {
  const { expenseTypeModel } = conn.expense(req.decode.db);
  try {
    let expenseTypeList = await expenseTypeModel.find({
      branchId: req.body.branchId,
    });
    let transNo = 0;
    transNo =
      Array.isArray(expenseTypeList) && expenseTypeList.length > 0
        ? expenseTypeList[expenseTypeList.length - 1].transNo + 1
        : 1;
    return (res = { transNo, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 22-10-22
module.exports.generateOutletExpenseNumber = async (req) => {
  const { outletExpenseModel } = conn.expense(req.decode.db);
  try {
    let expenseTypeList = await outletExpenseModel.find({
      branchId: req.body.branchId,
    });
    let transNo = 0;
    transNo =
      Array.isArray(expenseTypeList) && expenseTypeList.length > 0
        ? expenseTypeList[expenseTypeList.length - 1].transNo + 1
        : 1;

    return (res = { transNo, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 22-10-22
module.exports.generatePettyCashExpenseNumber = async (req) => {
  const { pettycashModel } = conn.expense(req.decode.db);
  try {
    let expenseTypeList = await pettycashModel.find({
      branchId: req.body.branchId,
    });
    let transNo = 0;
    transNo =
      Array.isArray(expenseTypeList) && expenseTypeList.length > 0
        ? expenseTypeList[expenseTypeList.length - 1].transNo + 1
        : 1;
    return (res = { transNo, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 24-10-22
module.exports.fetchBalance = async (req) => {
  const { pettycashModel, outletExpenseModel } = conn.expense(req.decode.db);
  try {
    let pettyCashList = await pettycashModel.find({
      branchId: process.env.branchId,
    });
    let lastPettyAmount = await pettycashModel
      .find({
        branchId: process.env.branchId,
      })
      .sort({ transNo: -1 })
      .limit(1);
    let data = { creditAmount: 0, lastPaidAmount: 0, lastPaidDate: "" };
    let outletExpenseList = await outletExpenseModel.find({
      branchId: process.env.branchId,
    });
    pettyCashList.map((x) => {
      data.creditAmount = data.creditAmount + x.amount;
      data.lastPaidAmount = lastPettyAmount[0].amount;
      data.lastPaidDate = common_Service
        .prescisedateconvert(lastPettyAmount[0].date)
        .split(" ")[0];
    });
    outletExpenseList.map((x) => {
      data.creditAmount = data.creditAmount - x.amount;
    });

    res = { data, status: STATUSCODES.SUCCESS };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 25-10-22
module.exports.editOutletExpense = async (req) => {
  const { outletExpenseModel } = conn.expense(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let outletExist = await outletExpenseModel.findOne({ _id: req.body._id });
    if (!common_Service.isEmpty(outletExist)) {
      outletExist.expenseType = req.body.expenseType
        ? req.body.expenseType
        : outletExist.expenseType;
      outletExist.amount = req.body.amount
        ? req.body.amount
        : outletExist.amount;
      outletExist.paidBy = req.body.paidBy
        ? req.body.paidBy
        : outletExist.paidBy;
      let data = await outletExist.save();
      if (data) {
        let newlog = new logModel({
          date: data.date,
          emp_id: req.decode._id,
          type: LOG.EXPENSES_OUTLETEXPADD.type,
          shift_id: data.shift_id,
          description: LOG.EXPENSES_OUTLETEXPADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (isEmpty(logresponse)) {
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

//added on 07-11-22
module.exports.viewexpensebydate = async (req) => {
  const { outletExpenseModel, expenseTypeModel } = conn.expense(req.decode.db);
  try {
    let rslist = [];
    let outletexpenseList = await outletExpenseModel.find({
      branchId: req.body.branchId,
    });
    if (
      common_Service.checkIfNullOrUndefined(req.body.fromDate, req.body.endDate)
    ) {
      await Promise.all(
        outletexpenseList.map(async (x) => {
          if (x.date >= req.body.fromDate && x.date <= req.body.endDate) {
            let typeexpenseExist = await expenseTypeModel.findOne({
              _id: x.expenseType,
            });

            if (!common_Service.isEmpty(typeexpenseExist)) {
              x._doc["expenseName"] = typeexpenseExist.expenseType;
            } else {
              x._doc["expenseName"] = "No expense";
            }

            rslist.push({
              expenseName: x._doc["expenseName"],
              amount: x.amount,
              commission: 0,
              balance: 0,
            });
          }
        })
      );
    } else {
      let startDateMilli = common_Service
        .prescisedateconvert(req.fromDate)
        .split("-");
      let endDay = new Date(startDateMilli[0], startDateMilli[1], 0).getDate();
      let endDate = common_Service.prescisedateconvert(
        new Date(`${startDateMilli[0]}-${startDateMilli[1]}-${endDay} 23:59:59`)
      );
      await Promise.all(
        outletexpenseList.map(async (x) => {
          if (
            x.date >= req.body.fromDate &&
            x.date <= new Date(endDate).getTime()
          ) {
            let typeexpenseExist = await expenseTypeModel.findOne({
              _id: x.expenseType,
            });

            if (!common_Service.isEmpty(typeexpenseExist)) {
              x._doc["expenseName"] = typeexpenseExist.expenseType;
            } else {
              x._doc["expenseName"] = "No expense";
            }
            // expenseTable.crTot =
            //   expenseTable.crTot + !x.creditAmount ? 0 : x.creditAmount;
            // expenseTable.debTot = expenseTable.debTot + x.amount;
            rslist.push({
              expenseName: x._doc["expenseName"],
              amount: 0,
              commission: 0,
              balance: 0,
            });
          } else {
          }
        })
      );
    }
    res = {
      data: rslist,
      status: STATUSCODES.SUCCESS,
    };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 26-04-2022
module.exports.generateExpenseTypeDocNo = async (req) => {
  const { expenseTypeModel } = conn.expense(process.env.db);
  try {
    let docNo = 0;
    let expenseCount = await expenseTypeModel.aggregate([
      {
        $sort: { docNo: -1 },
      },
    ]);
    if (expenseCount.length > 0) {
      docNo = expenseCount[0].docNo + 1;
    } else {
      docNo = 1;
    }
    return (res = { status: STATUSCODES.SUCCESS, data: docNo });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.generatePettyCashDocNo = async (req) => {
  const { pettycashModel } = conn.expense(process.env.db);
  try {
    let docNo = 0;
    let pettyCount = await pettycashModel.aggregate([
      {
        $sort: { docNo: -1 },
      },
    ]);
    if (pettyCount.length > 0) {
      docNo = pettyCount[0].docNo + 1;
    } else {
      docNo = 1;
    }
    return (res = { status: STATUSCODES.SUCCESS, data: docNo });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.generateOutletExpenseDocNo = async (req) => {
  const { outletExpenseModel } = conn.expense(process.env.db);
  try {
    let docNo = 0;
    let expenseCount = await outletExpenseModel.aggregate([
      {
        $sort: { docNo: -1 },
      },
    ]);
    if (expenseCount.length > 0) {
      docNo = expenseCount[0].docNo + 1;
    } else {
      docNo = 1;
    }
    return (res = { status: STATUSCODES.SUCCESS, data: docNo });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 27-04-2022,edited on 28-04-2022,edited on 29-04-2022
//edited on 07/07/23
module.exports.viewExpenseReport = async (req) => {
  const { pettycashModel, expenseModel, expenseTypeModel, outletExpenseModel } =
    conn.expense(req.decode.db);
  const { employeeModel } = conn.employee(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  let res = {},
    arr = [];
  try {
    if (req.body.category.replace(/\s+/g, "").toLowerCase() == "staffexpense") {
      let expense = await expenseModel.find({ empId: req.body.empId });
      if (expense.length > 0) {
        let fromDate, toDate;
        if (req.body.fromDate != null)
          fromDate = new Date(req.body.fromDate).getTime();
        if (req.body.toDate != null)
          toDate = new Date(req.body.toDate).getTime();

        if (req.body.fromDate != null && req.body.toDate != null) {
          for (let i = 0; i < expense.length; i++) {
            let expenseType = {};
            if (common_Service.isObjectId(expense[i].expense)) {
              expenseType = await expenseTypeModel.findOne({
                _id: expense[i].expense,
              });
            }

            if (
              fromDate <= expense[i].expenseDate &&
              expense[i].expenseDate <= toDate
            ) {
              let br = await branchModel.findOne({
                storeCode: expense[i].branchId,
              });
              let exp = {
                _id: expense[i]._id,
                expense: expenseType.expenseType,
                branchName: br?.branchName,
                branchCode: expense[i].branchId,
                date: common_Service
                  .prescisedateconvert(expense[i].expenseDate)
                  .split(" ")[0],
                amount: expense[i].amount,
                paymentMethod: expense[i].paymentType,
              };
              arr.push(exp);
            }
          }
          if (arr.length > 0)
            return (res = { data: arr, status: STATUSCODES.SUCCESS });
          else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        } else if (req.body.fromDate == null && req.body.toDate != null) {
          for (let i = 0; i < expense.length; i++) {
            let expenseType = {};
            if (common_Service.isObjectId(expense[i].expense)) {
              expenseType = await expenseTypeModel.findOne({
                _id: expense[i].expense,
              });
            }
            if (expense[i].expenseDate <= toDate) {
              let br = await branchModel.findOne({
                storeCode: expense[i].branchId,
              });
              let exp = {
                _id: expense[i]._id,
                expense: expenseType.expenseType,
                branchName: br?.branchName,
                branchCode: expense[i].branchId,
                date: common_Service
                  .prescisedateconvert(expense[i].expenseDate)
                  .split(" ")[0],
                amount: expense[i].amount,
                paymentMethod: expense[i].paymentType,
              };
              arr.push(exp);
            }
          }
          if (arr.length > 0)
            return (res = { data: arr, status: STATUSCODES.SUCCESS });
          else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        } else if (req.body.fromDate != null && req.body.toDate == null) {
          for (let i = 0; i < expense.length; i++) {
            let expenseType = {};
            if (common_Service.isObjectId(expense[i].expense)) {
              expenseType = await expenseTypeModel.findOne({
                _id: expense[i].expense,
              });
            }
            if (fromDate <= expense[i].expenseDate) {
              let br = await branchModel.findOne({
                storeCode: expense[i].branchId,
              });
              let exp = {
                _id: expense[i]._id,
                expense: expenseType.expenseType,
                branchName: br?.branchName,
                branchCode: expense[i].branchId,
                date: common_Service
                  .prescisedateconvert(expense[i].expenseDate)
                  .split(" ")[0],
                amount: expense[i].amount,
                paymentMethod: expense[i].paymentType,
              };
              arr.push(exp);
            }
          }
          if (arr.length > 0)
            return (res = { data: arr, status: STATUSCODES.SUCCESS });
          else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        } else {
          for (let i = 0; i < expense.length; i++) {
            let expenseType = {};
            if (common_Service.isObjectId(expense[i].expense)) {
              expenseType = await expenseTypeModel.findOne({
                _id: expense[i].expense,
              });
            }
            let br = await branchModel.findOne({
              storeCode: expense[i].branchId,
            });
            let exp = {
              _id: expense[i]._id,
              expense: expenseType.expenseType,
              branchName: br?.branchName,
              branchCode: expense[i].branchId,
              date: common_Service
                .prescisedateconvert(expense[i].expenseDate)
                .split(" ")[0],
              amount: expense[i].amount,
              paymentMethod: expense[i].paymentType,
            };
            arr.push(exp);
          }
          return (res = { data: arr, status: STATUSCODES.SUCCESS });
        }
      } else {
        return (res = { data: {}, status: STATUSCODES.NOTFOUND });
      }

      //staff expense ends here
    } else if (
      req.body.category.replace(/\s+/g, "").toLowerCase() == "outletexpense"
    ) {
      let fromDate, toDate;
      let expense = await outletExpenseModel.find({});
      if (req.body.fromDate != null)
        fromDate = new Date(req.body.fromDate).getTime();
      if (req.body.toDate != null) toDate = new Date(req.body.toDate).getTime();
      if (expense.length > 0) {
        if (req.body.fromDate != null && req.body.toDate != null) {
          for (let i = 0; i < expense.length; i++) {
            let expenseType = {};
            if (common_Service.isObjectId(expense[i].expenseType)) {
              expenseType = await expenseTypeModel.findOne({
                _id: expense[i].expenseType,
              });
            }
            if (fromDate <= expense[i].date && expense[i].date <= toDate) {
              let br = await branchModel.findOne({
                storeCode: expense[i].branchId,
              });
              let exp = {
                _id: expense[i]._id,
                transNo:
                  PREFIXES.EXPENSES +
                  req.decode.prefix.substring(0, 2) +
                  expense[i].transNo,
                expenseType: expenseType.expenseType,
                date: common_Service
                  .prescisedateconvert(expense[i].date)
                  .split(" ")[0],
                amount: expense[i].amount,
                paymentMethod: expense[i].paymentType,
                branchId: expense[i].branchId,
                branchName: br?.branchName,
                creditAmount: expense[i].creditAmount,
                lastPaidAmount: expense[i].lastPaidAmount,
                lastPaidDate: common_Service
                  .prescisedateconvert(expense[i].lastPaidDate)
                  .split(" ")[0],
                paidBy: expense[i].paidBy,
              };
              arr.push(exp);
            }
          }
          if (arr.length > 0)
            return (res = { data: arr, status: STATUSCODES.SUCCESS });
          else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        } else if (req.body.fromDate != null && req.body.toDate == null) {
          for (let i = 0; i < expense.length; i++) {
            let expenseType = {};
            if (common_Service.isObjectId(expense[i].expense)) {
              expenseType = await expenseTypeModel.findOne({
                _id: expense[i].expense,
              });
            }
            if (fromDate <= expense[i].date) {
              let br = await branchModel.findOne({
                storeCode: expense[i].branchId,
              });
              let exp = {
                _id: expense[i]._id,
                transNo:
                  PREFIXES.EXPENSES +
                  req.decode.prefix.substring(0, 2) +
                  expense[i].transNo,
                expenseType: expenseType.expenseType,
                date: common_Service
                  .prescisedateconvert(expense[i].date)
                  .split(" ")[0],
                amount: expense[i].amount,
                paymentMethod: expense[i].paymentType,
                branchId: expense[i].branchId,
                branchName: br?.branchName,
                creditAmount: expense[i].creditAmount,
                lastPaidAmount: expense[i].lastPaidAmount,
                lastPaidDate: common_Service
                  .prescisedateconvert(expense[i].lastPaidDate)
                  .split(" ")[0],
                paidBy: expense[i].paidBy,
              };
              arr.push(exp);
            }
          }
          if (arr.length > 0)
            return (res = { data: arr, status: STATUSCODES.SUCCESS });
          else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        } else if (req.body.fromDate == null && req.body.toDate != null) {
          for (let i = 0; i < expense.length; i++) {
            let expenseType = {};
            if (common_Service.isObjectId(expense[i].expense)) {
              expenseType = await expenseTypeModel.findOne({
                _id: expense[i].expense,
              });
            }
            if (expense[i].date <= toDate) {
              let br = await branchModel.findOne({
                storeCode: expense[i].branchId,
              });
              let exp = {
                _id: expense[i]._id,
                transNo:
                  PREFIXES.EXPENSES +
                  req.decode.prefix.substring(0, 2) +
                  expense[i].transNo,
                expenseType: expenseType.expenseType,
                date: common_Service
                  .prescisedateconvert(expense[i].date)
                  .split(" ")[0],
                amount: expense[i].amount,
                paymentMethod: expense[i].paymentType,
                branchId: expense[i].branchId,
                branchName: br?.branchName,
                creditAmount: expense[i].creditAmount,
                lastPaidAmount: expense[i].lastPaidAmount,
                lastPaidDate: common_Service
                  .prescisedateconvert(expense[i].lastPaidDate)
                  .split(" ")[0],
                paidBy: expense[i].paidBy,
              };
              arr.push(exp);
            }
          }
          if (arr.length > 0)
            return (res = { data: arr, status: STATUSCODES.SUCCESS });
          else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        } else {
          for (let i = 0; i < expense.length; i++) {
            let expenseType = {};
            if (common_Service.isObjectId(expense[i].expenseType)) {
              expenseType = await expenseTypeModel.findOne({
                _id: expense[i].expenseType,
              });
            }
            let br = await branchModel.findOne({
              storeCode: expense[i].branchId,
            });
            let exp = {
              _id: expense[i]._id,
              transNo:
                PREFIXES.EXPENSES +
                req.decode.prefix.substring(0, 2) +
                expense[i].transNo,
              expenseType: expenseType.expenseType,
              date: common_Service
                .prescisedateconvert(expense[i].date)
                .split(" ")[0],
              amount: expense[i].amount,
              paymentMethod: expense[i].paymentType,
              branchId: expense[i].branchId,
              branchName: br?.branchName,
              creditAmount: expense[i].creditAmount,
              lastPaidAmount: expense[i].lastPaidAmount,
              lastPaidDate: common_Service
                .prescisedateconvert(expense[i].lastPaidDate)
                .split(" ")[0],
              paidBy: expense[i].paidBy,
            };
            arr.push(exp);
          }
          return (res = { data: arr, status: STATUSCODES.SUCCESS });
        }
      } else {
        return (res = { data: {}, status: STATUSCODES.NOTFOUND });
      }

      //outlet expense ends here
    } else if (
      req.body.category.replace(/\s+/g, "").toLowerCase() == "pettycashreceipt"
    ) {
      let str = {};

      if (req.body.branchId != null) str.branchId = req.body.branchId;
      let expense = await pettycashModel.find(str);
      if (expense.length > 0) {
        let fromDate, toDate;
        if (req.body.fromDate != null)
          fromDate = new Date(req.body.fromDate).getTime();
        if (req.body.toDate != null)
          toDate = new Date(req.body.toDate).getTime();
        if (req.body.fromDate != null && req.body.toDate != null) {
          for (let i = 0; i < expense.length; i++) {
            let expenseType = {};
            if (common_Service.isObjectId(expense[i].expense)) {
              expenseType = await expenseTypeModel.findOne({
                _id: expense[i].expense,
              });
            }
            if (fromDate <= expense[i].date && expense[i].date <= toDate) {
              let br = await branchModel.findOne({
                storeCode: expense[i].branchId,
              });
              let exp = {
                _id: expense[i]._id,
                transNo:
                  PREFIXES.PETTYCASH +
                  req.decode.prefix.substring(0, 2) +
                  expense[i].transNo,
                expense: expenseType.expenseType,
                date: common_Service
                  .prescisedateconvert(expense[i].date)
                  .split(" ")[0],
                amount: expense[i].amount,
                branchId: expense[i].branchId,
                branchName: br?.branchName,
              };
              arr.push(exp);
            }
          }
          if (arr.length > 0)
            return (res = { data: arr, status: STATUSCODES.SUCCESS });
          else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        } else if (req.body.fromDate == null && req.body.toDate != null) {
          for (let i = 0; i < expense.length; i++) {
            let expenseType = {};
            if (common_Service.isObjectId(expense[i].expense)) {
              expenseType = await expenseTypeModel.findOne({
                _id: expense[i].expense,
              });
            }
            if (expense[i].date <= toDate) {
              let br = await branchModel.findOne({
                storeCode: expense[i].branchId,
              });
              let exp = {
                _id: expense[i]._id,
                transNo:
                  PREFIXES.PETTYCASH +
                  req.decode.prefix.substring(0, 2) +
                  expense[i].transNo,
                expense: expenseType.expenseType,
                date: common_Service
                  .prescisedateconvert(expense[i].date)
                  .split(" ")[0],
                amount: expense[i].amount,
                branchId: expense[i].branchId,
                branchName: br?.branchName,
              };
              arr.push(exp);
            }
          }
          if (arr.length > 0)
            return (res = { data: arr, status: STATUSCODES.SUCCESS });
          else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        } else if (req.body.fromDate != null && req.body.toDate == null) {
          for (let i = 0; i < expense.length; i++) {
            let expenseType = {};
            if (common_Service.isObjectId(expense[i].expense)) {
              expenseType = await expenseTypeModel.findOne({
                _id: expense[i].expense,
              });
            }
            if (fromDate <= expense[i].date) {
              let br = await branchModel.findOne({
                storeCode: expense[i].branchId,
              });
              let exp = {
                _id: expense[i]._id,
                transNo:
                  PREFIXES.PETTYCASH +
                  req.decode.prefix.substring(0, 2) +
                  expense[i].transNo,
                expense: expenseType.expenseType,
                date: common_Service
                  .prescisedateconvert(expense[i].date)
                  .split(" ")[0],
                amount: expense[i].amount,
                branchId: expense[i].branchId,
                branchName: br?.branchName,
              };
              arr.push(exp);
            }
          }
          if (arr.length > 0)
            return (res = { data: arr, status: STATUSCODES.SUCCESS });
          else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        } else {
          for (let i = 0; i < expense.length; i++) {
            let expenseType = {};
            if (common_Service.isObjectId(expense[i].expense)) {
              expenseType = await expenseTypeModel.findOne({
                _id: expense[i].expense,
              });
            }
            let br = await branchModel.findOne({
              storeCode: expense[i].branchId,
            });
            let exp = {
              _id: expense[i]._id,
              transNo:
                PREFIXES.PETTYCASH +
                req.decode.prefix.substring(0, 2) +
                expense[i].transNo,
              expense: expenseType.expenseType,
              date: common_Service
                .prescisedateconvert(expense[i].date)
                .split(" ")[0],
              amount: expense[i].amount,
              branchId: expense[i].branchId,
              branchName: br?.branchName,
            };
            arr.push(exp);
          }
          return (res = { data: arr, status: STATUSCODES.SUCCESS });
        }
      } else {
        return (res = { data: {}, status: STATUSCODES.NOTFOUND });
      }
    } else {
      return (res = {
        status: STATUSCODES.NOTACCEPTABLE,
        data: "check expense category",
      });
    }
  } catch (e) {
    return (res = { status: STATUSCODES.ERROR, data: e.message });
  }
};

//added on 18-07-22
module.exports.getTotalExpenseOfOutLet = async (req) => {
  const { pettycashModel, outletExpenseModel, expenseModel } = conn.expense(
    process.env.db
  );
  try {
    let PETTYCASHTOTAL = (OUTLETTOTAL = EXPENSETOTAL = 0);
    let pettyList = await pettycashModel.find({
      branchId: req,
    });
    let outletList = await outletExpenseModel.find({
      branchId: req,
    });
    let expenseList = await expenseModel.find({
      branchId: req,
    });
    if (Array.isArray(pettyList) && pettyList.length > 0) {
      pettyList.map((x) => {
        PETTYCASHTOTAL = PETTYCASHTOTAL + x.amount;
      });
    }
    if (Array.isArray(outletList) && outletList.length > 0) {
      outletList.map((x) => (OUTLETTOTAL = OUTLETTOTAL + x.amount));
    }
    if (Array.isArray(expenseList) && expenseList.length > 0) {
      expenseList.map((x) => (EXPENSETOTAL = EXPENSETOTAL + x.amount));
    }
    return (res = {
      data: {
        pettycashTotal: PETTYCASHTOTAL,
        outlettotal: OUTLETTOTAL,
        expenseTotal: EXPENSETOTAL,
      },
      status: STATUSCODES.SUCCESS,
    });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 23-07-22
module.exports.getTotalExpenseOfOutLetByBranchId = async () => {
  const { pettycashModel, outletExpenseModel, expenseModel } = conn.expense(
    process.env.db
  );
  try {
    let PETTYCASHTOTAL = (OUTLETTOTAL = EXPENSETOTAL = 0);
    let pettyList = await pettycashModel.find({
      branchId: process.env.branchId,
    });
    let outletList = await outletExpenseModel.find({
      branchId: process.env.branchId,
    });
    let expenseList = await expenseModel.find({
      branchId: process.env.branchId,
    });
    if (Array.isArray(pettyList) && pettyList.length > 0) {
      pettyList.map((x) => {
        PETTYCASHTOTAL = PETTYCASHTOTAL + x.amount;
      });
    }
    if (Array.isArray(outletList) && outletList.length > 0) {
      outletList.map((x) => (OUTLETTOTAL = OUTLETTOTAL + x.amount));
    }
    if (Array.isArray(expenseList) && expenseList.length > 0) {
      expenseList.map((x) => (EXPENSETOTAL = EXPENSETOTAL + x.amount));
    }
    return (res = {
      data: {
        pettycashTotal: PETTYCASHTOTAL,
        outlettotal: OUTLETTOTAL,
        expenseTotal: EXPENSETOTAL,
      },
      status: STATUSCODES.SUCCESS,
    });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 23-07-22
//dummy method actual method to be added later
module.exports.viewExpenseTable = async (req) => {
  const { outletExpenseModel, expenseTypeModel } = conn.expense(process.env.db);
  try {
    let res = {};
    let expenseTotal = this.getTotalExpenseOfOutLetByBranchId();
    let outletExpenseList = await outletExpenseModel.find({});
    let resobj = {};
    resobj.openingBalance = 1000;
    resobj.outletExpenseList = [];
    if (Array.isArray(outletExpenseList) && outletExpenseList.length > 0) {
      let creditTot = 0;
      let debitTot = 0;
      let balance = 0;
      await Promise.all(
        outletExpenseList.map(async (x) => {
          let type = await expenseTypeModel.findOne(
            {
              _id: x.expenseType,
            },
            { expenseType: 1 }
          );
          resobj.outletExpenseList.push({
            date: common_Service.prescisedateconvert(x.date).split(" ")[0],
            note: !common_Service.isEmpty(type) ? type.expenseType : "no value",
            debit: x.amount > 0 ? x.amount : 0,
          });
          resobj.creditTot = resobj.openingBalance;
          resobj.debitTot = debitTot + x.amount; //to be changed later
          resobj.balance = resobj.creditTot - resobj.debitTot;
        })
      );
    }
    return (res = { data: resobj, status: 200 });
    // resobj.openingBalance =
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//#endregion
