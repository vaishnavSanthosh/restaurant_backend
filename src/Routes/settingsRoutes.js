//created on 15-03-22
//#region headers
const {
  STATUSCODES,
  SMSSTATUS,
  SHIFTSTATUS,
  PREFIXES,
  ROLES,
} = require("../Model/enums");
const common_service = require("../Routes/commonRoutes.js");
const fs = require("fs");
const conn = require("../../userDbConn");
const axios = require("axios");
const { log } = require("console");
const bcrypt = require("bcrypt");
//#endregion
var res;
//added on 20-09-22
module.exports.viewUserSettings = async (req) => {
  const { settingsModel } = conn.settings(process.env.db);
  try {
    if (req.toString().length == 24) {
      let settingsExist = await settingsModel.findOne({
        empId: req,
      });

      if (settingsExist) {
        res = { data: settingsExist, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: { msg: e.message }, status: STATUSCODES.ERROR });
  }
};

//16-03-22
module.exports.addSettings = async (req) => {
  const { settingsModel } = conn.settings(req.decode.db);
  const { employeeModel } = conn.employee(req.decode.db);
  try {
    let res = {};
    for (let i = 0; i < req.body.empId.length; i++) {
      const element = req.body.empId[i];
      let settingsExist = await settingsModel.findOne({
        empId: element,
      });
      if (common_service.isEmpty(settingsExist)) {
        let settings = new settingsModel({
          empId: element,
          dashboard: req.body.dashboard,
          order: req.body.order,
          reservation: req.body.reservation,
          purchaseManage: req.body.purchaseManage,
          report: req.body.report,
          foodManagement: req.body.foodManagement,
          sales: req.body.sales,
          rewardPoint: req.body.rewardPoint,
          offers: req.body.offers,
          wallet: req.body.wallet,
          accounts: req.body.accounts,
          staff: req.body.staff,
          /*added on 11-04-22 */
          expense: req.body.expense,
          /*added on 11-04-22 */
          customer: req.body.customer,
        });
        var data = await settings.save();
        if (data) {
          // res = { data: req.body, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        await settingsExist.deleteOne({ _id: settingsExist._id });
        let settings = new settingsModel(req.body);
        let data = await settings.save();
        if (data) {
          // res = { data: settings, status: STATUSCODES.UPDATED };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      }
      res = { data: req.body, status: STATUSCODES.SUCCESS };
    }
    return res;
  } catch (e) {
    res = { data: e.message, status: STATUSCODES.ERROR };
    return res;
  }
};

//added on 30-04-2022
//method recoded on 24-06-22
module.exports.designationFiltering = async (req) => {
  const { employeeModel } = conn.employee(process.env.db);
  try {
    let res = {};
    let emplist = await employeeModel.find(
      { designation: req.body.designation },
      { staff_name: 1 }
    );
    if (Array.isArray(emplist) && emplist.length > 0) {
      res = { data: emplist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    res = { data: e.message, status: STATUSCODES.ERROR };
  }
};

//added on 09-05-2022
module.exports.getDesignations = async (req) => {
  const designationModel = conn.designation(req.decode.db);
  try {
    let designation = await designationModel.find(
      { branchId: process.env.branchId },
      { position: 1 }
    );
    if (designation) {
      return (res = { data: designation, status: STATUSCODES.SUCCESS });
    } else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on
module.exports.getCurrentShift = async (req) => {
  const { shiftLogModel, shiftModel } = conn.settings(req.decode.db);
  try {
    let shiftExist = await shiftLogModel.findOne({
      branchId: req.body.branchId,
      status: SHIFTSTATUS.ACT,
    });
    let shift = await shiftModel.findOne({ branchId: req.body.branchId });
    if (!common_service.checkObject(shift)) {
      return (res = {
        data: `no shift settings added for branch ${req.body.branchId}`,
        status: STATUSCODES.FORBIDDEN,
      });
    }
    if (!common_service.isEmpty(shiftExist)) {
      const element = shiftExist;
      element._doc["startDate"] = common_service.prescisedateconvert(
        element.startDate
      );
      element._doc["endDate"] =
        element.endDate != null
          ? common_service.prescisedateconvert(element.endDate)
          : element.status;
      element._doc["STARTTIME"] = common_service.msToHMS(element.startTime);
      let curDate = new Date(req.body.curTime).getTime();
      element._doc["timer"] = Math.round(
        (curDate - new Date(element.startDate).getTime()) / 1000
      );

      element._doc["isDenomination"] = shift.isDenomination;
      res = { data: shiftExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }

    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 02-06-2022
module.exports.addLog = async (req, db) => {
  const { logModel } = conn.settings(db);
  try {
    let log = logModel({
      date: new Date(Date.now()).getTime(),
      emp_id: req.emp_id,
      type: req.type,
      description: req.description,
      shift_id: 1,
      branchId: process.env.branchId,
      link: req.link,
    });
    await log.save();
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 08-06-2022 to add log
module.exports.getLog = async (req) => {
  const { logModel } = conn.settings(req.decode.db);
  try {
    let data = await logModel.find({});
    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        data[i]._doc["date"] = common_service.prescisedateconvert(data[i].date);
      }
      return (res = { data, status: STATUSCODES.SUCCESS });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 02-06-2022
module.exports.addLog = async (req, db) => {
  const { logModel } = conn.settings(db);
  try {
    let log = logModel({
      date: new Date(Date.now()).getTime(),
      emp_id: req.emp_id,
      type: req.type,
      description: req.description,
      shift_id: 1,
      branchId: process.env.branchId,
      link: req.link,
    });
    await log.save();
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 08-06-2022 to add log
//edited on 25-06-22
module.exports.getLog = async () => {
  const { logModel } = conn.settings(process.env.db);
  const adminModel = conn.auth(process.env.db);
  const { employeeModel } = conn.employee(process.env.db);
  try {
    let data = await logModel.find({});
    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        /*added on 25-06-22 -> added employee/admin name field initialisation for front end */
        let element = data[i];
        let adminExist = await adminModel.findOne(
          { _id: element.emp_id },
          { userName: 1 }
        );
        if (!common_service.isEmpty(adminExist)) {
          element._doc["user"] = adminExist.userName
            ? adminExist.userName
            : null;
        } else {
          let emp_exist = await employeeModel.findOne({ _id: element.emp_id });
          element._doc["user"] = !common_service.isEmpty(emp_exist)
            ? emp_exist.staff_name
            : null;
        }
        /*ends here */
        data[i]._doc["date"] = common_service.prescisedateconvert(data[i].date);
      }
      return (res = { data, status: STATUSCODES.SUCCESS });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 22-06-22
//edited on 26-07-22
module.exports.addCardCommission = async (req) => {
  const { cardModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let cardExist = await cardModel.findOne({
      cardName: req.body.cardName,
    });
    if (!common_service.isEmpty(cardExist)) {
      res = { data: cardExist, status: STATUSCODES.EXIST };
    } else {
      let newCard = new cardModel({
        cardName: req.body.cardName.toLowerCase(),
        commission: req.body.commission,
        status: true, //added on 26-07-22-> added new status field initialisation
      });
      if (req.files.file) {
        let fp = await common_service.createDirectory(
          `./public/${req.decode.db}/CardDetails`
        );
        req.files.file.mv(
          `./public/${req.decode.db}/CardDetails/${newCard.cardName.replace(
            /\s+/g,
            ""
          )}_${req.files.file.name.replace(/\s+/g, "")}`
        );
        newCard.imageUrl = `Images/${
          req.decode.db
        }/CardDetails/${newCard.cardName.replace(
          /\s+/g,
          ""
        )}_${req.files.file.name.replace(/\s+/g, "")}`;
      } else {
        newCard.imageUrl = null;
      }
      let data = await newCard.save();
      if (data) {
        data.imageUrl = process.env.FILEURL + data.imageUrl;
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 22-06-22
module.exports.viewCardCommission = async (req) => {
  const { cardModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let cardExist = await cardModel.find({ status: true }); //edited on 26-07-22-> search parameter added
    if (Array.isArray(cardExist) && cardExist.length > 0) {
      for (let i = 0; i < cardExist.length; i++) {
        const element = cardExist[i];
        element.imageUrl = process.env.FILEURL + element.imageUrl;
      }
      res = { data: cardExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 22-06-22
module.exports.editCardCommission = async (req) => {
  const { cardModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let cardExist = await cardModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(cardExist)) {
      if (req.files.file) {
        let fp = await common_service.createDirectory(
          `./public/${req.decode.db}/CardDetails`
        );
        fs.unlink(`public/` + cardExist.imageUrl.split("Images/"), (err) => {
          if (err) console.log(err);
        });
        req.files.file.mv(
          `./public/${req.decode.db}/CardDetails/${cardExist.cardName.replace(
            /\s+/g,
            ""
          )}_${req.files.file.name.replace(/\s+/g, "")}`
        );
        cardExist.imageUrl = `Images/${
          req.decode.db
        }/CardDetails/${cardExist.cardName.replace(
          /\s+/g,
          ""
        )}_${req.files.file.name.replace(/\s+/g, "")}`;
      }
      cardExist.cardName = req.body.cardName
        ? req.body.cardName
        : cardExist.cardName;
      cardExist.commission = req.body.commission
        ? req.body.commission
        : cardExist.commission;
      let data = await cardExist.save();
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

//added on 12-07-22
module.exports.viewShiftByShiftId = async (req) => {
  const { shiftModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let shiftExist = await shiftModel.findOne({
      shiftNumber: !common_service.isEmpty(req.body)
        ? req.body.shiftNumber
        : req,
      branchId: process.env.branchId,
    });
    if (!common_service.isEmpty(shiftExist)) {
      shiftExist._doc["SHIFTYPE"] =
        shiftExist.shiftType == 0
          ? "Automatic"
          : shiftExist.shiftType == 1
          ? "Manual"
          : shiftExist.shiftType == 2
          ? "None"
          : null;
      shiftExist._doc["SHIFTNUMBER"] = `SHIFT-${shiftExist.shiftNumber}`;
      shiftExist._doc["startDate"] = common_service
        .prescisedateconvert(shiftExist.startDate)
        .split(" ")[0];
      shiftExist._doc["startTime"] = common_service.msToHMS(
        shiftExist.startTime
      );
      shiftExist._doc["endDate"] = common_service
        .prescisedateconvert(shiftExist.endDate)
        .split(" ")[0];
      shiftExist._doc["endTime"] = common_service.msToHMS(shiftExist.endTime);
      for (let i = 0; i < shiftExist.log.length; i++) {
        const element = shiftExist.log[i];
        element.startDate = common_service.prescisedateconvert(
          element.startDate
        );
      }
      res = { data: shiftExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 12-07-22
module.exports.endShift = async (req) => {
  const { shiftModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let shiftExist = await shiftModel.findOne({
      shiftNumber: await this.getCurrentShift(),
    });
    if (!common_service.isEmpty(shiftExist)) {
      shiftExist.endDate = new Date(req.body.endDate).getTime();
      shiftExist.endTime = common_service.strToSec(
        new Date(req.body.endDate).toLocaleTimeString().split(" ")[0]
      );
      shiftExist.status = "ended";
      let data = await shiftExist.save();
      if (data) {
        data._doc["SHIFT NUMBER"] = `SHIFT${data.shiftNumber}`;
        data._doc["SHIFT TYPE"] =
          data.shiftType == 0
            ? "Automatic"
            : data.shiftType == 1
            ? "Manual"
            : data.shiftType == 2
            ? "None"
            : null;
        data._doc["startDate"] = common_service
          .prescisedateconvert(data.startDate)
          .split(" ")[0];
        data._doc["endDate"] = common_service
          .prescisedateconvert(data.endDate)
          .split(" ")[0];
        data._doc["startTime"] = common_service.msToHMS(data.startTime);
        data._doc["endTime"] = common_service.msToHMS(data.endTime);
        for (let i = 0; i < shiftExist.log.length; i++) {
          const element = shiftExist.log[i];
          element.startDate = common_service.prescisedateconvert(
            element.startDate
          );
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

//added on 21-07-22
module.exports.addBranchShift = async (req) => {
  const { branchShiftModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let shiftExist = await branchShiftModel.findOne({
      shiftType: 0,
      status: true,
      branchId: process.env.branchId,
    });
    if (common_service.isEmpty(shiftExist)) {
      let SHIFTNUMBER = 0;
      let shiftList = await branchShiftModel.find({
        branchId: process.env.branchId,
      });
      SHIFTNUMBER =
        shiftList.length > 0 ? shiftList[shiftList.length - 1].shiftId + 1 : 1;
      if (!common_service.isEmpty(req.body)) {
        let newbranchShift = new branchShiftModel({
          shiftId: SHIFTNUMBER,
          shiftType: req.body.shiftType,
          startDate: new Date(req.body.startDate).getTime(),
          startTime: common_service.strToSec(
            new Date(req.body.startDate).toLocaleTimeString().split(" ")[0]
          ),
          endDate: req.body.endDate
            ? new Date(req.body.endDate).getTime()
            : null,
          endTime: req.body.endDate
            ? common_service.strToSec(
                new Date(req.body.endDate).toLocaleTimeString().split(" ")[0]
              )
            : null,
          branchId: process.env.branchId,
          status: true,
        });
        let data = await newbranchShift.save();
        if (data) {
          if (data.shiftType == 0) {
            let settings = this.viewShiftSettings();
            if (!common_service.isEmpty(settings)) {
              let REQ = { startTime: data.startTime, endTime: data.endTime };
              await this.addShiftTimingSettings(REQ);
            }
          }
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = { data: {}, status: STATUSCODES.BADREQUEST };
      }
    } else {
      res = { data: shiftExist, status: STATUSCODES.EXIST };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 21-07-22
module.exports.getActiveBranchShift = async () => {
  const { branchShiftModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let shiftObj = await branchShiftModel.findOne({
      branchId: process.env.branchId,
      status: true,
    });
    if (!common_service.isEmpty(shiftObj)) {
      shiftObj._doc["shiftNumber"] = `SHIFT${shiftObj.shiftId}`;
      shiftObj._doc["SHIFTTYPE"] =
        shiftObj.shiftType == 0 ? "Active" : "Manual";
      shiftObj._doc["STARTDATE"] = common_service
        .prescisedateconvert(shiftObj.startDate)
        .split(" ")[0];
      shiftObj._doc["ENDDATE"] = common_service
        .prescisedateconvert(shiftObj.endDate)
        .split(" ")[0];
      shiftObj._doc["STARTTIME"] = common_service.msToHMS(shiftObj.startTime);
      shiftObj._doc["ENDTIME"] = common_service.msToHMS(shiftObj.endTime);
      res = { data: shiftObj, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 21-07-22
module.exports.addShiftTimingSettings = async (req) => {
  const { branchShiftTimeModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let shiftTimeSettings = new branchShiftTimeModel({
      startTime: req.startTime,
      endTime: req.endTime,
      startDate: req.startDate,
      days: req.days,
      branchId: process.env.branchId ? process.env.branchId : "Null",
      status: true,
      duration: req.duration,
      shiftType: req.shiftType,
    });
    let data = await shiftTimeSettings.save();
    if (data) {
      res = { data: data, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.UNPROCESSED };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 21-07-22
module.exports.viewShiftSettings = async () => {
  const { branchShiftTimeModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let settings = await branchShiftTimeModel.findOne({
      branchId: process.env.branchId,
      status: true,
    });
    if (!common_service.isEmpty(settings)) {
      res = { data: settings, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 23-07-22
module.exports.addUpiCommission = async (req) => {
  const { upiModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let cardExist = await upiModel.findOne({
      upiName: req.body.upiName.toLowerCase(), //edited on 05-08-22-> search parameter name fixed
    });
    if (!common_service.isEmpty(cardExist)) {
      res = { data: cardExist, status: STATUSCODES.EXIST };
    } else {
      let newCard = new upiModel({
        upiName: req.body.upiName.toLowerCase(),
        commission: req.body.commission,
        status: true, //added on 05-08-22
      });
      // if (req.files.file) {
      //   req.files.file.mv(
      //     `./public/Images/CardDetails/${newCard.upiName}_${req.files.file.name}`
      //   );
      //   newCard.imageUrl = `Images/CardDetails/${newCard.upiName}_${req.files.file.name}`;
      // } else {
      //   newCard.imageUrl = null;
      // }
      let data = await newCard.save();
      if (data) {
        // data.imageUrl = process.env.FILEURL + data.imageUrl;
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

//added on 23-07-22
module.exports.viewUpiCommission = async (req) => {
  const { upiModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let cardExist = await upiModel.find({});
    if (Array.isArray(cardExist) && cardExist.length > 0) {
      // for (let i = 0; i < cardExist.length; i++) {
      //   const element = cardExist[i];
      //   element.imageUrl = process.env.FILEURL + element.imageUrl;
      // }
      res = { data: cardExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 23-07-22
module.exports.editUpiCommission = async (req) => {
  const { upiModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let cardExist = await upiModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(cardExist)) {
      cardExist.upiName = req.body.upiName
        ? req.body.upiName
        : cardExist.upiName;
      cardExist.commission = req.body.commission
        ? req.body.commission
        : cardExist.commission;
      let data = await cardExist.save();
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

//added on 24-07-22
module.exports.addCurrencyExchange = async (req) => {
  const { currencyModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let currencyExist = await currencyModel.findOne({
      localCurrency: req.body.localCurrency,
      foreignCurrency: req.body.foreignCurrency,
    });
    if (!common_service.isEmpty(currencyExist)) {
      res = { data: currencyExist, status: STATUSCODES.EXIST };
    } else {
      let newCurrency = await currencyModel({
        localCurrency: req.body.localCurrency,
        foreignCurrency: req.body.foreignCurrency,
        exchangeRate: req.body.exchangeRate,
      });
      let data = await newCurrency.save();
      if (data) {
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

//addedo on 24-07-22
module.exports.viewExchangeRate = async (req) => {
  const { currencyModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let currencyExist = await currencyModel.findOne({
      localCurrency: req.body.localCurrency,
      foreignCurrency: req.body.foreignCurrency,
    });
    if (!common_service.isEmpty(currencyExist)) {
      res = { data: currencyExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    res = { data: e.message, status: STATUSCODES.ERROR };
  }
};

//added on 24-07-22
module.exports.getCurrentBranchShift = async () => {
  const { branchShiftModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let shiftObj = await branchShiftModel.findOne({
      branchId: process.env.branchId,
      status: true,
    });
    if (!common_service.isEmpty(shiftObj)) {
      res = shiftObj.shiftId;
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 26-07-22
module.exports.deleteCardCommission = async (req) => {
  const { cardModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let cardExist = await cardModel.findOne({
      _id: req.body._id,
    });
    if (!common_service.isEmpty(cardExist)) {
      cardExist.status = false;
      let data = await cardExist.save();
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

//added on 03-08-22
module.exports.addSmsHeader = async (req) => {
  const { smsHeaderModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let smsHeaderExist = await smsHeaderModel.findOne({
      headerName: req.body.headerName,
    });
    if (common_service.isEmpty(smsHeaderExist)) {
      if (req.body.headerName.length == 5) {
        let newHeader = new smsHeaderModel({
          headerName: req.body.headerName,
          adminId: req.decode._id,
          status: SMSSTATUS.PEN,
          dataStatus: true,
          db: process.env.db,
        });
        let result = await axios({
          method: "POST",
          url: `${process.env.ADMINURL}admin/addsmsheader`,
          data: newHeader,
          headers: { Authorization: `Bearer ${req.headers.authorization}` },
        });
        let data = await newHeader.save();
        if (data) {
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = {
          data: {
            message: "Header Name is Invalid",
          },
          status: STATUSCODES.FORBIDDEN,
        };
      }
    } else {
      smsHeaderExist._doc["message"] = "";
      if (smsHeaderExist.status == SMSSTATUS.PEN) {
        smsHeaderExist._doc["message"] = "Template is Waiting Approval";
        res = { data: smsHeaderExist, status: STATUSCODES.FORBIDDEN };
      } else if (smsHeaderExist.status == SMSSTATUS.APP) {
        smsHeaderExist._doc["message"] = "Template is Already Approved";
        res = { data: smsHeaderExist, status: STATUSCODES.EXIST };
      } /* else if (smsHeaderExist.dataStatus == false) {
        smsHeaderExist._doc["message"] = "Template was Deleted Once";
        res = { data: smsHeaderExist, status: STATUSCODES.FORBIDDEN };
      } */
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 04-08-22
module.exports.viewAllExchangeRates = async (req) => {
  const { currencyModel } = conn.settings(rq.decode.db);
  try {
    let res = {};
    let currencyList = await currencyModel.find({});
    if (Array.isArray(currencyList) && currencyList.length > 0) {
      res = { data: currencyList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    res = { data: { message: e.message }, status: STATUSCODES.ERROR };
  }
};

//added on 04-08-22
module.exports.viewAddedHeaders = async () => {
  const { smsHeaderModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let smsHeaderList = await smsHeaderModel.find({});
    if (Array.isArray(smsHeaderList) && smsHeaderList.length > 0) {
      res = { data: smsHeaderList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 04-08-22
module.exports.updateHeaderStatus = async (req) => {
  const { smsHeaderModel } = conn.settings(req.body.db);
  try {
    let res = {};
    let headerExist = await smsHeaderModel.findOne({
      headerName: req.body.headerName,
    });
    if (!common_service.isEmpty(headerExist)) {
      headerExist.status = req.body.status;
      let data = await headerExist.save();
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

//added on 04-08-22
module.exports.addSmsTemplate = async (req) => {
  const { smsTemplateModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let smsTemplateExist = await smsTemplateModel.findOne({
      templateName: req.body.templateName,
      templateType: req.body.templateType,
      adminId: req.body.adminId,
    });
    if (common_service.isEmpty(smsTemplateExist)) {
      let newTemplate = new smsTemplateModel({
        templateName: req.body.templateName,
        templateType: req.body.templateType,
        status: SMSSTATUS.PEN,
        adminId: req.decode._id,
        db: process.env.db,
      });
      let result = await axios({
        method: "POST",
        url: `${process.env.ADMINURL}admin/addsmstemplate`,
        data: newTemplate,
        headers: { Authorization: `Bearer ${req.headers.authorization}` },
      });
      let data = await newTemplate.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: smsTemplateExist, status: STATUSCODES.CONFLICT };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 04-08-22
module.exports.viewAddedTemplates = async () => {
  const { smsTemplateModel } = conn.settings(process.env.db);
  try {
    let res = {};
    let smsHeaderList = await smsTemplateModel.find({});
    if (Array.isArray(smsHeaderList) && smsHeaderList.length > 0) {
      res = { data: smsHeaderList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 04-08-22
module.exports.updatetemplateStatus = async (req) => {
  const { smsTemplateModel } = conn.settings(req.body.db);
  try {
    let res = {};
    let TemplateExist = await smsTemplateModel.findOne({
      templateName: req.body.templateName,
      templateType: req.body.templateType,
    });
    if (!common_service.isEmpty(TemplateExist)) {
      TemplateExist.status = req.body.status;
      let data = await TemplateExist.save();
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

//added on 16-05-23
module.exports.startManualShift = async (req) => {
  const { shiftLogModel, shiftModel } = conn.settings(req.decode.db);
  try {
    let shiftExist = await shiftLogModel.findOne({
      branchId: req.body.branchId,
      status: SHIFTSTATUS.ACT,
    });
    if (!common_service.isEmpty(shiftExist)) {
      res = {
        data: `Active Shift : SHIFT${shiftExist.shiftId} is active`,
        status: STATUSCODES.FORBIDDEN,
      };
    } else {
      let shiftSettings = await shiftModel.findOne({
        branchId: req.body.branchId,
      });

      if (!common_service.isEmpty(shiftSettings)) {
        if (shiftSettings.shiftType < 2) {
          let newShift = new shiftLogModel({});
          newShift.startDate = new Date(req.body.startDate).getTime();
          newShift.startTime = common_service.strToSec(
            common_service.prescisedateconvert(newShift.startDate).split(" ")[1]
          );
          newShift.branchId = req.body.branchId;
          newShift.status = SHIFTSTATUS.ACT;
          let shiftLogList = await shiftLogModel.find({
            branchId: req.body.branchId,
          });
          newShift.endDate = null;
          newShift.endTime = null;
          newShift.shiftId =
            Array.isArray(shiftLogList) && shiftLogList.length > 0
              ? shiftLogList[shiftLogList.length - 1].shiftId + 1
              : 1;
          let data = await newShift.save();
          if (data) {
            res = { data: data, status: STATUSCODES.SUCCESS };
          } else {
            res = { data: {}, status: STATUSCODES.UNPROCESSED };
          }
        } else {
          res = {
            data: { msg: `Shift Selection Not Enabled` },
            status: STATUSCODES.FORBIDDEN,
          };
        }
      } else {
        res = {
          data: {
            msg: `no settings defined for Branch : ${req.body.branchId}`,
          },
          status: STATUSCODES.NOTFOUND,
        };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 16-05-23
module.exports.endManualShift = async (req) => {
  const { shiftLogModel, shiftModel } = conn.settings(req.decode.db);
  try {
    let shiftExist = await shiftLogModel.findOne({
      branchId: req.body.branchId,
      status: SHIFTSTATUS.ACT,
    });
    if (!common_service.isEmpty(shiftExist)) {
      let shiftSettings = await shiftModel.findOne({
        branchId: req.body.branchId,
      });
      if (!common_service.isEmpty(shiftSettings)) {
        let findPermission = shiftSettings.employee.find(
          (x) => x == req.decode._id
        );
        if (!common_service.isEmpty(findPermission)) {
          shiftExist.status = SHIFTSTATUS.END;
          shiftExist.endDate = new Date(
            req.body.endDate
          ).getTime(); /* edited on 22-11-22 -> value should come from front end now */
          shiftExist.endTime = common_service.strToSec(
            common_service.prescisedateconvert(shiftExist.endDate).split(" ")[1]
          );
          let data = await shiftExist.save();
          if (data) {
            res = { data: data, status: STATUSCODES.SUCCESS };
          } else {
            res = { data: {}, status: STATUSCODES.UNPROCESSED };
          }
        } else {
          res = { data: "not permitted", status: STATUSCODES.FORBIDDEN };
        }
      } else {
        res = {
          data: {
            msg: `no settings defined for Branch : ${req.body.branchId}`,
          },
          status: STATUSCODES.NOTFOUND,
        };
      }
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 06-06-23
module.exports.addShift = async (req) => {
  const { shiftModel } = conn.settings(req.decode.db);
  try {
    const adminModel = conn.auth(req.decode.db);
    if (!common_service.isEmpty(req.body)) {
      let shiftExist = await shiftModel.findOne({
        branchId: req.body.branchId,
      });
      if (common_service.checkObject(shiftExist)) {
        if (
          Array.isArray(shiftExist.employee) &&
          shiftExist.employee.length > 0
        ) {
          if (
            JSON.stringify(shiftExist.employee) ==
            JSON.stringify(req.body.employee)
          ) {
            if (shiftExist.shiftType != req.body.shiftType) {
              shiftExist.shiftType = req.body.shiftType;
              let data = await shiftExist.save();
              if (data) {
                await adminModel.findOneAndUpdate(
                  {},
                  { $set: { shiftType: data.shiftType } },
                  { new: true }
                );
                return (res = {
                  data: shiftExist,
                  status: STATUSCODES.SUCCESS,
                });
              } else {
                return (res = {
                  data: shiftExist,
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            } else {
              return (res = { data: shiftExist, status: STATUSCODES.CONFLICT });
            }
          } else {
            shiftExist.employee = req.body.employee;
            shiftExist.shiftType = req.body.shiftType;
            shiftExist.isDenomination = req.body.isDenomination;
            let data = await shiftExist.save();
            if (data) {
              await adminModel.findOneAndUpdate(
                {},
                { $set: { shiftType: data.shiftType } },
                { new: true }
              );
              return (res = { data: shiftExist, status: STATUSCODES.SUCCESS });
            } else {
              return (res = {
                data: shiftExist,
                status: STATUSCODES.UNPROCESSED,
              });
            }
          }
        } else {
          shiftExist.employee = req.body.employee;
          shiftExist.shiftType = req.body.shiftType;
          shiftExist.isDenomination = req.body.isDenomination;
          let data = await shiftExist.save();
          if (data) {
            await adminModel.findOneAndUpdate(
              {},
              { $set: { shiftType: data.shiftType } },
              { new: true }
            );
            return (res = { data: shiftExist, status: STATUSCODES.SUCCESS });
          } else {
            return (res = {
              data: shiftExist,
              status: STATUSCODES.UNPROCESSED,
            });
          }
        }
      } else {
        let newShift = new shiftModel({});
        newShift.branchId = req.body.branchId;
        newShift.duration = req.body.duration;
        newShift.startTime = req.body.startTime;
        newShift.endTime = req.body.endTime;
        newShift.workingDays = req.body.workingDays ? req.body.workingDays : [];
        newShift.shiftType = req.body.shiftType;
        newShift.employee = req.body.employee
          ? req.body.employee
          : []; /* added on 02-11-22 -> new field added */
        newShift.isDenomination = req.body.isDenomination;
        let data = await newShift.save();
        if (common_service.checkObject(data)) {
          await adminModel.findOneAndUpdate(
            {},
            { $set: { shiftType: data.shiftType } },
            { new: true }
          );
          return (res = { data: data, status: STATUSCODES.SUCCESS });
        } else {
          return (res = {
            data: {
              msg: `Shift Adding Failed For Branch ${req.body.branchId}`,
            },
            status: STATUSCODES.UNPROCESSED,
          });
        }
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.BADREQUEST });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 01-02-23
module.exports.addpointRatio = async (req) => {
  const { pointratioModel } = conn.settings(req.decode.db);
  try {
    let ratioExist = await pointratioModel.findOne({});
    if (common_service.isEmpty(ratioExist)) {
      let newRatio = new pointratioModel({
        point: req.body.point,
        amount: req.body.amount,
      });
      let data = await newRatio.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = {
          data: { msg: "cannot update to DB" },
          status: STATUSCODES.UNPROCESSED,
        };
      }
    } else {
      (ratioExist.point = req.body.point),
        (ratioExist.amount = req.body.amount);
      let data = await ratioExist.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = {
          data: { msg: "cannot update to DB" },
          status: STATUSCODES.UNPROCESSED,
        };
      }
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 30-06-23
module.exports.viewpointRatio = async (req) => {
  const { pointratioModel } = conn.settings(req.decode.db);
  try {
    let ratio = await pointratioModel.findOne({});
    if (!common_service.isEmpty(ratio)) {
      ratio._doc["ratio"] = ratio.amount / ratio.point;
      res = { data: ratio, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//Added on 10-07-23
module.exports.shiftTransferOrderInvoices = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { paymentModel } = conn.payment(req.decode.db);
  try {
    if (req.body.type) {
      req.body.type = parseInt(req.body.type);
    }
    let branch = await branchModel.findOne({
      storeCode: req.body.storeCode,
    });
    if (common_service.isEmpty(branch)) {
      return (res = {
        data: { msg: "invalid branch" },
        status: STATUSCODES.NOTFOUND,
      });
    }
    let responseList = [];
    let rslist = [];
    if (req.body.type == 0) {
      responseList = await orderModel.find({ branchId: branch.storeCode });
    } else if (req.body.type == 1) {
      responseList = await paymentModel.find({
        $or: [{ branchId: branch._id }, { branchId: branch.storeCode }],
      });
    }

    for (let i = 0; i < responseList.length; i++) {
      const element = responseList[i];
      let resobj =
        req.body.type == 0
          ? branch.storeCode.substr(3) +
            req.decode.prefix.substring(0, 2) +
            PREFIXES.SALESINV +
            element.orderId
          : req.body.type == 1
          ? element.invoiceNo
          : "no number";
      rslist.push(resobj);
    }
    return (res = { data: rslist, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//Added on 10-07-23
module.exports.shiftTransferOrderView = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { paymentModel } = conn.payment(req.decode.db);
  try {
    if (req.body.type) {
      req.body.type = parseInt(req.body.type);
    }
    let branch = await branchModel.findOne({
      storeCode: req.body.storeCode,
    });
    if (common_service.isEmpty(branch)) {
      return (res = {
        data: { msg: "invalid branch" },
        status: STATUSCODES.NOTFOUND,
      });
    }
    let responseList = [];
    let rslist = [];
    if (req.body.type == 0) {
      responseList = await orderModel.find({ branchId: branch.storeCode });
    } else if (req.body.type == 1) {
      let paymentList = [];
      paymentList = await paymentModel.find({});
      for (let i = 0; i < paymentList.length; i++) {
        const element = paymentList[i];
        if (
          element.branchId == branch._id ||
          element.branchId == branch.storeCode
        ) {
          responseList.push(element);
        }
      }
    }
    for (let i = 0; i < responseList.length; i++) {
      const element = responseList[i];
      let resobj = {
        invoiceNo: "No InvoiceNo",
        date: "No Date",
        customer: "No Customer",
        mobileNo: "No Mobile",
        _id: "No ID",
        uuid: "No UUID",
        paidAmount: 0,
      };
      if (req.body.type != 1) {
        resobj._id = element._id;
        resobj.invoiceNo =
          req.body.type == 0
            ? branch.storeCode.substr(3) +
              req.decode.prefix.substring(0, 2) +
              PREFIXES.SALESINV +
              element.orderId
            : "no number";
        let customerExist = {};
        if (req.body.type != 0) {
          if (common_service.isObjectId(element.cusId)) {
            customerExist = await customerModel.findOne({ _id: element.cusId });
          }
        } else if (common_service.isObjectId(element.cus_id)) {
          // if (common_service.isObjectId(element.cus_id)) {
          customerExist = await customerModel.findOne({
            _id: element.cus_id,
          });
          // }
        } else {
          if (element.cus_id != null)
            resobj.customer =
              element.cus_id.toLowerCase() == "cash"
                ? "Cash Customer"
                : "Cash Customer";
          resobj.mobileNo =
            element.cus_id.toLowerCase() == "cash"
              ? "Cash Customer"
              : "Cash Customer";
        }

        if (!common_service.isEmpty(customerExist)) {
          resobj.customer = customerExist.name;
          resobj.mobileNo = customerExist.mobileNo;
        }
        resobj.date =
          req.body.type == 0
            ? common_service
                .prescisedateconvert(element.orderDate)
                .split(" ")[0]
            : "no number";
        rslist.push(resobj);
      } else {
        if (
          Array.isArray(element.paymentMethod) &&
          element.paymentMethod.length > 0
        ) {
          for (let i = 0; i < element.paymentMethod.length; i++) {
            let resobj = {
              invoiceNo: "No InvoiceNo",
              date: "No Date",
              customer: "No Customer",
              mobileNo: "No Customer",
              _id: "No ID",
              uuid: "No UUID",
              paidAmount: 0,
            };
            resobj.invoiceNo = element.invoiceNo;
            let customerExist = {};
            if (common_service.isObjectId(element.cus_id)) {
              customerExist = await customerModel.findOne({
                _id: element.cus_id,
              });
              if (!common_service.isEmpty(customerExist)) {
                resobj.customer = customerExist.name;
                resobj.mobileNo = customerExist.mobileNo;
              }
            } else {
              if (element.cus_id != null)
                resobj.customer =
                  element.cus_id.toLowerCase() == "cash"
                    ? "Cash Customer"
                    : "Cash Customer";
              resobj.mobileNo =
                element.cus_id.toLowerCase() == "cash"
                  ? "Cash Customer"
                  : "Cash Customer";
            }

            resobj._id = element._id;
            resobj.uuid = element.paymentMethod[i].uuid;
            resobj.paidAmount = element.paymentMethod[i].paidAmount;
            resobj.date = common_service
              .prescisedateconvert(element.paymentMethod[i].date)
              .split(" ")[0];
            rslist.push(resobj);
          }
        }
      }
    }
    if (req.body.invoiceNo) {
      rslist = rslist.filter((x) => x.invoiceNo == req.body.invoiceNo);
    }
    if (req.body.date) {
      rslist = rslist.filter((x) => x.date.includes(req.body.date));
    }
    if (req.body.customer) {
      rslist = rslist.filter((x) => x.customer == req.body.customer);
    }
    if (req.body.mobileNo) {
      rslist = rslist.filter((x) => x.mobileNo == req.body.mobileNo);
    }
    return (res = { data: rslist, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// Added on 11-07-23
module.exports.shiftTransfer = async (req) => {
  const { shiftTransferLogModel } = conn.settings(req.decode.db);
  const { paymentModel } = conn.payment(req.decode.db);
  const { orderModel } = conn.order(req.decode.db);
  let workorderResponse = {};
  let oldShiftNumber = 0;
  let resp = {};
  try {
    let newShift = new shiftTransferLogModel({
      branchId: req.body.branchId,
      orderType: req.body.orderType,
      orderId: req.body.orderId,
      transferedShift: req.body.transferedShift,
      date: new Date(req.body.date).getTime(),
    });
    let data = newShift;
    for (let j = 0; j < req.body.orderId.length; j++) {
      const orderId = req.body.orderId[j];
      if (data) {
        if (data.orderType == 0) {
          let paymentExist = await orderModel.findOne({ _id: orderId });
          if (!common_service.isEmpty(paymentExist)) {
            oldShiftNumber = paymentExist.shiftId;
            workorderResponse = await orderModel.findOneAndUpdate(
              { _id: paymentExist._id },
              { $set: { shiftId: data.transferedShift } },
              { returnDocument: "after" }
            );
          }
        }
        if (!common_service.isEmpty(workorderResponse)) {
          let paymentExist = await paymentModel.findOne({
            purchasePk: workorderResponse._id,
          });
          if (!common_service.isEmpty(paymentExist)) {
            let shiftNumber = workorderResponse.shiftId;

            for (let i = 0; i < paymentExist.paymentMethod.length; i++) {
              const element = paymentExist.paymentMethod[i];
              if (element.shiftId == oldShiftNumber) {
                element.shiftId = shiftNumber;
              }
            }
            let paymentResponse = await paymentModel.findOneAndUpdate(
              { _id: paymentExist._id },
              { $set: { paymentMethod: paymentExist.paymentMethod } },
              { returnDocument: "after" }
            );
            if (common_service.isEmpty(paymentResponse)) {
              res = { data: {}, status: STATUSCODES.UNPROCESSED };
            }
          }
          resp = await newShift.save();
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
        res = { data: resp, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//Added on 10-07-23
module.exports.viewShifts = async (req) => {
  const { shiftLogModel } = conn.settings(req.decode.db);
  try {
    let shiftList = await shiftLogModel.find({});
    if (req.decode.role == ROLES.USER) {
      shiftList = shiftList.filter((x) => x.branchId == req.body.branchId);
    }
    if (req.body.branchId) {
      shiftList = shiftList.filter((x) => x.branchId == req.body.branchId);
    }
    if (Array.isArray(shiftList) && shiftList.length > 0) {
      for (let i = 0; i < shiftList.length; i++) {
        const element = shiftList[i];
        element._doc["startDate"] = common_service
          .prescisedateconvert(element.startDate)
          .split(" ")[0];
        element._doc["endDate"] = common_service
          .prescisedateconvert(element.endDate)
          .split(" ")[0];
        element._doc["SHIFID"] = `SHIFT${element.shiftId}`;
        element._doc["startTime"] = common_service.msToHMS(element.startTime);
        element._doc["endTime"] = common_service.msToHMS(element.endTime);
      }
      res = { data: shiftList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 08-07-23
module.exports.addCheque = async (req) => {
  const { chequeModel } = conn.settings(req.decode.db);
  try {
    let chequeExist = await chequeModel.findOne({
      bankName: req.body.bankName,
    });
    if (chequeExist) {
      res = { data: chequeExist, status: STATUSCODES.CONFLICT };
    } else {
      let newCheque = new chequeModel({
        bankName: req.body.bankName,
        commission: req.body.commission,
        imageUrl: req.body.imageUrl,
        status: true,
      });
      if (req.files && req.files.file) {
        await common_service.createDirectory(
          `./public/${req.decode.db}/checkDetails`
        );
        req.files.file.mv(
          `./public/${req.decode.db}/checkDetails/${newCheque.bankName.replace(
            /\s+/g,
            ""
          )}_${req.files.file.name.replace(/ +/g, "")}`
        );

        newCheque.imageUrl = `Images/${
          req.decode.db
        }/checkDetails/${newCheque.bankName.replace(
          /\s+/g,
          ""
        )}_${req.files.file.name.replace(/ +/g, " ")}`;
      } else {
        newCheque.imageUrl = null;
      }
      let data = await newCheque.save();
      if (data) {
        res = { data: data, status: STATUSCODES.NOTFOUND };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 08-07-23
module.exports.viewCheque = async (req) => {
  const { chequeModel } = conn.settings(req.decode.db);
  try {
    let checkExist = await chequeModel.find({});
    if (Array.isArray(checkExist) && checkExist.length > 0) {
      for (let i = 0; i < checkExist.length; i++) {
        const element = checkExist[i];
        element.imageUrl = process.env.FILEURL + element.imageUrl;
      }
      res = { data: checkExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    res = { data: e.message, status: STATUSCODES.ERROR };
  }
};

// aaded on 10-07-23
module.exports.addUpi = async (req) => {
  const { upiModel } = conn.settings(req.decode.db);
  try {
    let upiExist = await upiModel.findOne({
      upiId: req.body.upiId,
      upiName: req.body.upiName,
    });
    if (upiExist) {
      res = { data: {}, status: STATUSCODES.CONFLICT };
    } else {
      let newUpi = new upiModel({
        upiName: req.body.upiName,
        commission: req.body.commission,
        imageUrl: null,
        upiId: req.body.upiId,
        status: true,
      });
      if (req.files && req.files.file) {
        await common_service.createDirectory(
          `./public/${req.decode.db}/UPIdetails`
        );
        req.files.file.mv(
          `./public/${req.decode.db}/UPIdetails/${
            newUpi.upiName
          }_${req.files.file.name.replace(/ +/g, "")}`
        );
        newUpi.imageUrl = `Images/${req.decode.db}/UPIdetails/${
          newUpi.upiName
        }_${req.files.file.name.replace(/ +/g, "")}`;
      } else {
        newUpi.imageUrl = null;
      }
      let data = await newUpi.save();
      if (data) {
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

// added on 10-07-23
module.exports.viewUpi = async (req) => {
  const { upiModel } = conn.settings(req.decode.db);
  try {
    let upiExist = await upiModel.find({});
    if (Array.isArray(upiExist) && upiExist.length > 0) {
      for (let i = 0; i < upiExist.length; i++) {
        const element = upiExist[i];
        element.imageUrl = process.env.FILEURL + element.imageUrl;
      }
      res = { data: upiExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 10-07-23
module.exports.editUpi = async (req) => {
  const { upiModel } = conn.settings(req.decode.db);
  try {
    let upiExist = await upiModel.findOne({ _id: req.body._id });
    if (upiExist) {
      upiExist.upiName = req.body.upiName ? req.body.upiName : upiExist.upiName;
      upiExist.commission = req.body.commission
        ? req.body.commission
        : upiExist.commission;
      if (req.files && req.files.file) {
        if (upiExist.imageUrl != null && upiExist.imageUrl != undefined) {
          fs.unlink(`public/` + upiExist.imageUrl.split("Image")[1], (err) => {
            if (err) console.log(err);
          });
        }
        await common_service.createDirectory(
          `./public/${req.decode.db}/upiDetails`
        );
        req.files.file.mv(
          `./public/${process.env.db}/UpiDetails/${upiExist.upiName.replace(
            / +/g,
            ""
          )}_${req.files.file.name.replace(/ +/g, "")}`
        );
        upiExist.imageUrl = `Images/${
          process.env.db
        }/UpiDetails/${upiExist.upiName.replace(
          / +/g,
          ""
        )}_${req.files.file.name.replace(/ +/g, "")}`;
      }
      let data = await upiExist.save();
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
    return (res = { data: e.message, status: STATUSCODES });
  }
};

// added on 11-07-23
module.exports.addDiscount = async (req) => {
  const { discountModel } = conn.settings(req.decode.db);
  try {
    let discountExist = await discountModel.findOne({});
    if (discountExist) {
      discountExist.discountAmount = req.body.discountAmount;
      let data = await discountExist.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = {
          data: { msg: "cannot update to DB" },
          status: STATUSCODES.UNPROCESSED,
        };
      }
    } else {
      let newDiscount = new discountModel({
        discountAmount: req.body.discountAmount,
      });
      let data = await newDiscount.save();
      if (data) {
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

// added on 11-07-23
module.exports.viewDiscount = async (req) => {
  const { discountModel } = conn.settings(req.decode.db);
  try {
    let discountExist = await discountModel.find({});
    if (Array.isArray(discountExist) && discountExist.length > 0) {
      res = { data: discountExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.deleteBranch = async (req) => {
  try {
    if (req.decode.role == ROLES.ADMIN) {
      const { customerModel, relationModel } = conn.customer(req.decode.db);
      const { categoryModel, subcategoryModel } = conn.category(req.decode.db);
      // const departmentModel = conn.department(req.decode.db);
      const {
        employeeModel,
        loanModel,
        attendanceModel,
        payrollModel,
        payrollItemModel,
      } = conn.employee(req.decode.db);
      const {
        expenseModel,
        expenseTypeModel,
        outletExpenseModel,
        pettycashModel,
      } = conn.expense(req.decode.db);
      const { foodModel, couponModel, recipeModel } = conn.food(req.decode.db);
      const foodAvailableModel = conn.foodavailable(req.decode.db);
      const { leaveTypeModel, staffLeaveModel } = conn.leave(req.decode.db);
      const menuModel = conn.menu(req.decode.db);
      const offerModel = conn.offer(req.decode.db);
      const {
        orderModel,
        orderreturnModel,
        messModel,
        messPackageModel,
        holdOrderModel,
        damagedGoodsModel,
      } = conn.order(req.decode.db);
      const { creditModel, paymentModel, walletLogModel, returnPaymentModel } =
        conn.payment(req.decode.db);
      const { productModel } = conn.product(req.decode.db);
      const {
        purchaseModel,
        purchasewopoModel,
        grnModel,
        stockAdjustmentModel,
        stockAdjustmentTempModel,
        paymentVoucherModel,
        purchaseReturnModel,
      } = conn.purchase(req.decode.db);
      const {
        reservationModel,
        res_settingsModel,
        seatingModel,
        floorPlanModel,
      } = conn.reservation(req.decode.db);
      const { rewardModel, pointModel } = conn.reward(req.decode.db);
      const salesModel = conn.sales(req.decode.db);
      const { shiftModel, shiftLogModel, logModel, denominationModel } =
        conn.settings(req.decode.db);
      const { stockModel, stockLogModel, oldStockLogModel } = conn.stock(
        req.decode.db
      );

      const supplierModel = conn.supplier(req.decode.db);
      const branchInfo = req.body.branchId;
      if (branchInfo != null) {
        let employeeList = await employeeModel.find({ branchId: branchInfo });
        for (let i = 0; i < employeeList.length; i++) {
          let element = employeeList[i];
          fs.unlink(`public/` + element.imageUrl.split("Images/")[1], (err) => {
            if (err) console.log(err);
          });
        }

        let categoryList = await categoryModel.find({ branchId: branchInfo });
        for (let i = 0; i < categoryList.length; i++) {
          let element = categoryList[i];
          fs.unlink(`public/` + element.imageUrl.split("Images/")[1], (err) => {
            if (err) console.log(err);
          });
        }

        let subCategoriesList = await subcategoryModel.find({
          branchId: branchInfo,
        });
        for (let i = 0; i < subCategoriesList.length; i++) {
          let element = subCategoriesList[i];
          fs.unlink(`public/` + element.imageUrl.split("Images/")[1], (err) => {
            if (err) console.log(err);
          });
        }

        let staffLeaveList = await staffLeaveModel.find({
          branchId: branchInfo,
        });
        for (let i = 0; i < staffLeaveList.length; i++) {
          let element = staffLeaveList[i];
          fs.unlink(`public/` + element.imageUrl.split("Images/")[1], (err) => {
            if (err) console.log(err);
          });
        }

        let menuList = await menuModel.find({ branchId: branchInfo });
        for (let i = 0; i < menuList.length; i++) {
          let element = menuList[i];
          fs.unlink(`public/` + element.imageUrl.split("Images/")[1], (err) => {
            if (err) console.log(err);
          });
        }

        let offerList = await offerModel.find({ branchId: branchInfo });
        for (let i = 0; i < offerList.length; i++) {
          let element = offerList[i];
          fs.unlink(`public/` + element.imageUrl.split("Images/")[1], (err) => {
            if (err) console.log(err);
          });
        }

        // let subCategoriesList = await subcategoryModel.find({
        //   branchId: branchInfo,
        // });
        for (let i = 0; i < subCategoriesList.length; i++) {
          let element = subCategoriesList[i];
          fs.unlink(`public/` + element.imageUrl.split("Images/")[1], (err) => {
            if (err) console.log(err);
          });
        }
        if (req.body.branchId) {
          let productList = await productModel.find({ branchId: branchInfo });
          for (let i = 0; i < productList.length; i++) {
            let element = productList[i];
            fs.unlink(
              `public/` + element.imageUrl.split("Images/")[1],
              (err) => {
                if (err) console.log(err);
              }
            );
          }

          let foodItemList = await foodModel.find({ branchId: branchInfo });
          for (let i = 0; i < foodItemList.length; i++) {
            let element = foodItemList[i];
            for (let k = 0; k < element.imageUrl.length; k++) {
              let deleteItem = element.imageUrl[k];
              fs.unlink(`public/` + deleteItem.split("Images/")[1], (err) => {
                if (err) console.log(err);
              });
            }
          }

          let creditList = await creditModel.find({
            branchId: branchInfo,
            isPurchase: true,
          });
          if (Array.isArray(creditList) && creditList.length > 0) {
            for (let i = 0; i < creditList.length; i++) {
              let element = creditList[i];
              if (element.returnAmount > 0) {
                let supplier = await supplierModel.findOne({
                  _id: element.supplierId,
                });
                let updatedAmount =
                  supplier.openingBalance + element.returnAmount;
                let credit = await supplierModel.findOneAndUpdate(
                  { _id: element.supplierId },
                  { $set: { openingBalance: updatedAmount } },
                  { new: true }
                );
              }
            }
          }

          await purchaseReturnModel.deleteMany({ branchId: branchInfo });
          await creditModel.deleteMany({ branchId: branchInfo });
          await customerModel.deleteMany({ branchId: branchInfo });
          await relationModel.deleteMany({ branchId: branchInfo });
          await categoryModel.deleteMany({ branchId: branchInfo });
          await subcategoryModel.deleteMany({ branchId: branchInfo });
          // await departmentModel.deleteMany({ branchId: branchInfo })
          await employeeModel.deleteMany({ branchId: branchInfo });
          await loanModel.deleteMany({ branchId: branchInfo });
          await attendanceModel.deleteMany({ branchId: branchInfo });
          await payrollModel.deleteMany({ branchId: branchInfo });
          await payrollItemModel.deleteMany({ branchId: branchInfo });
          await expenseModel.deleteMany({ branchId: branchInfo });
          await expenseTypeModel.deleteMany({ branchId: branchInfo });
          await outletExpenseModel.deleteMany({ branchId: branchInfo });
          await pettycashModel.deleteMany({ branchId: branchInfo });
          await foodModel.deleteMany({ branchId: branchInfo });
          await couponModel.deleteMany({ branchId: branchInfo });
          await recipeModel.deleteMany({ branchId: branchInfo });
          await foodAvailableModel.deleteMany({ branchId: branchInfo });
          await leaveTypeModel.deleteMany({ branchId: branchInfo });
          await staffLeaveModel.deleteMany({ branchId: branchInfo });
          await menuModel.deleteMany({ branchId: branchInfo });
          await offerModel.deleteMany({ branchId: branchInfo });
          await orderModel.deleteMany({ branchId: branchInfo });
          await orderreturnModel.deleteMany({ branchId: branchInfo });
          await messModel.deleteMany({ branchId: branchInfo });
          await messPackageModel.deleteMany({ branchId: branchInfo });
          await holdOrderModel.deleteMany({ branchId: branchInfo });
          await damagedGoodsModel.deleteMany({ branchId: branchInfo });
          await paymentModel.deleteMany({ branchId: branchInfo });
          await walletLogModel.deleteMany({ branchId: branchInfo });
          await returnPaymentModel.deleteMany({ branchId: branchInfo });
          await productModel.deleteMany({ branchId: branchInfo });
          await purchaseModel.deleteMany({ branchId: branchInfo });
          await purchasewopoModel.deleteMany({ branchId: branchInfo });
          await grnModel.deleteMany({ branchId: branchInfo });
          await stockAdjustmentModel.deleteMany({ branchId: branchInfo });
          await stockAdjustmentTempModel.deleteMany({ branchId: branchInfo });
          await paymentVoucherModel.deleteMany({ branchId: branchInfo });
          await reservationModel.deleteMany({ branchId: branchInfo });
          await res_settingsModel.deleteMany({ branchId: branchInfo });
          await seatingModel.deleteMany({ branchId: branchInfo });
          await floorPlanModel.deleteMany({ branchId: branchInfo });
          await rewardModel.deleteMany({ branchId: branchInfo });
          await pointModel.deleteMany({ branchId: branchInfo });
          await salesModel.deleteMany({ branchId: branchInfo });
          await shiftModel.deleteMany({ branchId: branchInfo });
          await shiftLogModel.deleteMany({ branchId: branchInfo });
          await logModel.deleteMany({ branchId: branchInfo });
          await stockModel.deleteMany({ branchId: branchInfo });
          await stockLogModel.deleteMany({ branchId: branchInfo });
          await oldStockLogModel.deleteMany({ branchId: branchInfo });
          await denominationModel.deleteMany({ branchId: branchInfo });

          return {
            data: `${req.body.branchId} data has been deleted`,
            status: STATUSCODES.SUCCESS,
          };
        }
      } else {
        return { data: "Access declined", status: STATUSCODES.ERROR };
      }
    }
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// Added on 21-07-23
module.exports.getcreditAndpaymentdetails = async (req) => {
  const { paymentModel, creditModel } = conn.payment(req.decode.db);
  const { orderModel } = conn.order(req.decode.db);
  let resobj = { payment: {}, credit: {} };
  try {
    let orderExist = {};
    orderExist = await orderModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(orderExist)) {
      let paymentExist = await paymentModel.findOne({
        purchasePk: orderExist._id,
      });
      let creditExist = await creditModel.findOne({
        purchasePk: orderExist._id,
      });
      if (!common_service.isEmpty(paymentExist)) {
        resobj.payment = paymentExist;
      }
      if (!common_service.isEmpty(creditExist)) {
        resobj.credit = creditExist;
      }
    }
    return (res = { data: resobj, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.getPaymentAndCreditDetails = async (req) => {
  try {
    const { orderModel } = conn.order(req.decode.db);
    const { paymentModel, creditModel } = conn.payment(req.decode.db);
    const orderId = await orderModel.findOne({ _id: req.body.id });
    if (!orderId) {
      return { data: "Order not found", status: STATUSCODES.NOTFOUND };
    }
    const [payment, credit] = await Promise.all([
      paymentModel.findOne({ purchasePk: orderId._id }),
      creditModel.findOne({ purchasePk: orderId._id }),
    ]);
    const paymentList = payment || {};
    const creditList = credit || {};
    const res = { payment: paymentList, credit: creditList };

    return {
      data: res,
      status: STATUSCODES.SUCCESS,
    };
  } catch (e) {
    console.log(e);
    return (res = { data: "Internal Server Error", status: STATUSCODES.ERROR });
  }
};

// Added on 03-08-2023
module.exports.correctCredits = async (req) => {
  try {
    const { orderModel } = conn.order(req.decode.db);
    const { paymentModel, creditModel } = conn.payment(req.decode.db);
    let total = 0;
    let discount = 0;
    if (req.body) {
      let order = await orderModel.findOne({ _id: req.body.id });
      if (common_service.checkObject(order)) {
        if (typeof order.shipmentCharge == "number") {
          total += order.shipmentCharge;
        }
        if (typeof order.shipmentCharge == "number") {
          discount += order.discount;
        }
        if (Array.isArray(order.orderInfo)) {
          order.orderInfo.map((y) => {
            if (!typeof y.quantity == "number") {
              y.quantity = parseFloat(y.quantity);
            }
            if (!typeof y.rate == "number") {
              y.rate = parseFloat(y.rate);
            }
            total = total + y.quantity * y.rate;
          });
        }
        let paymentExist = await paymentModel.findOne({
          purchasePk: order._id,
        });
        if (common_service.checkObject(paymentExist)) {
          paymentExist.totalAmount = total - discount;
          let paymentresponse = await paymentExist.save();
          let paidAmount = 0;
          if (common_service.checkObject(paymentresponse)) {
            paymentresponse.paymentMethod.map((x) => {
              if (typeof x.paidAmount == "number") {
                paidAmount += x.paidAmount;
              }
            });
          }
          let creditExist = await creditModel.findOne({
            purchasePk: order._id,
          });
          if (common_service.checkObject(creditExist)) {
            creditExist.netAmount = total;
            creditExist.discount = discount;
            creditExist.balance =
              creditExist.netAmount - creditExist.discount - paidAmount;
            if (creditExist.balance < 0) {
              creditExist.balance = 0;
            }
            creditExist.status =
              creditExist.balance == 0 ? "Completed" : "Pending";
            creditExist.discount = paidAmount;
            await creditModel.findOneAndUpdate(
              { _id: creditExist._id },
              { $set: creditExist },
              { new: true }
            );
          }
        } else {
          let creditExist = await creditModel.findOne({
            purchasePk: order._id,
          });
          if (common_service.checkObject(creditExist)) {
            creditExist.netAmount = total;
            creditExist.discount = discount;
            creditExist.balance =
              creditExist.netAmount - creditExist.discount - paidAmount;
            await creditModel.findOneAndUpdate(
              { _id: creditExist.purchasePk },
              { $set: creditExist },
              { new: true }
            );
          }
        }
      } else {
        return (res = {
          data: { msg: "no order with this id" },
          status: STATUSCODES.NOTFOUND,
        });
      }
    }
    return (res = { data: { msg: "updated" }, status: STATUSCODES.SUCCESS });
  } catch (e) {
    console.log(e);
    return (res = { data: "Internal Server Error", status: STATUSCODES.ERROR });
  }
};

// Added on 03-08-2023
module.exports.updateCategoryAndSubCategory = async (req) => {
  try {
    const { stockLogModel } = conn.stock(req.decode.db);
    const { foodModel } = conn.food(req.decode.db);
    const { productModel } = conn.product(req.decode.db);
    let item = {};
    let categoryExist = await stockLogModel.find({
      categoryId: { $eq: null },
      subCategoryId: { $eq: null },
    });
    if (Array.isArray(categoryExist) && categoryExist.length > 0) {
      for (let i = 0; i < categoryExist.length; i++) {
        let element = categoryExist[i];
        if (element.itemType == 0) {
          item = await productModel.findOne({ _id: element.itemId });
        }
        if (element.itemType == 1) {
          item = await foodModel.findOne({ _id: element.itemId });
        }
        let stockLog = await stockLogModel.findOneAndUpdate(
          { _id: element._id },
          {
            $set: {
              categoryId: !common_service.isEmpty(item) ? item.category : null,
              subCategoryId:
                !common_service.isEmpty(item) && element.itemType == 1
                  ? item.subcategoryId
                  : null,
            },
          },
          { returnDocument: "after" }
        );
        if (common_service.isEmpty(stockLog)) {
          return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
        }
      }
    }
    return (res = { data: { msg: "updated" }, status: STATUSCODES.UPDATED });
  } catch (e) {
    console.log(e);
    return (res = { data: "Internal server error", status: STATUSCODES.ERROR });
  }
};

module.exports.addpaymentDevice = async (req) => {
  const { paymentDeviceModel } = conn.settings(req.decode.db);
  try {
    if (req.decode.role == ROLES.ADMIN) {
      let salt = await bcrypt.genSalt(Number(10));
      let hash = await bcrypt.hash(req.body.passWord, salt);
      let paymentDeviceExist = new paymentDeviceModel({
        branchName: req.body.branchName,
        pos: req.body.pos,
        appKey: req.body.appKey,
        userName: req.body.userName,
        passWord: hash,
        hash: null,
        salt: null,
      });
      let data = await paymentDeviceExist.save();
      if (data) {
        data.password = "*******";
        data.hash = "*******";
        data.salt = "*******";
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.NOTFOUND };
      }
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

module.exports.viewPaymentDevice = async (req) => {
  const { paymentDeviceModel } = conn.settings(req.decode.db);
  try {
    let paymentExist = await paymentDeviceModel.find({});
    if (Array.isArray(paymentExist) && paymentExist.length > 0) {
      res = { data: paymentExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//#endregion
