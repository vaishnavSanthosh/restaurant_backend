/** @format */

//#region headers
const crypto = require("crypto");
const fs = require("fs");
const util = require("util");
const { STATUSCODES, ROLES } = require("../Model/enums");
const {
  viewUserSettings,
  addCardCommission,
  getActiveBranchShift,
  viewShiftSettings,
  addBranchShift,
} = require("./settingsRoutes");
const atob = require("atob");
require("dotenv").config({ path: "./.env" });
const conn = require("../../userDbConn");
const spawn = require("child_process").spawn;
const ObjectId = require("mongoose").Types.ObjectId;
//#endregion

//#region methods
module.exports.prescisedateconvert = (input) => {
  try {
    let mydate = new Date(input);
    let dateString =
      new Date(mydate).getFullYear() +
      "-" +
      ("0" + (new Date(mydate).getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + new Date(mydate).getDate()).slice(-2) +
      " " +
      ("0" + new Date(mydate).getHours()).slice(-2) +
      ":" +
      ("0" + new Date(mydate).getMinutes()).slice(-2) +
      ":" +
      ("0" + new Date(mydate).getSeconds()).slice(-2);
    return dateString;
  } catch (e) { 
    console.error(e);
    res = { data: e, status: STATUSCODES.ERROR };
    return res;
  }
};

module.exports.generateUuid = () => {
  try {
    return crypto.randomBytes(16).toString("hex");
  } catch (e) {
    console.error(e);
    res = { data: e, status: STATUSCODES.ERROR };
    return res;
  }
};

//added on 31-01-2022
module.exports.msToTime = (duration) => {
  var milliseconds = Math.floor((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
};

//added on 03-02-2022
module.exports.getRandomStr = () => {
  try {
    let length = 5;
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result.toUpperCase();
  } catch (e) {
    console.error(e);
    res = { data: e, status: STATUSCODES.ERROR };
    return res;
  }
};

//added on 26-02-22
//edited on 03-03-22
//edited on 10-03-22
//edited on 17-03-22
//edited on 18-03-22 //settings  middleware recoded
//edited on 22-03-22 //passed decode into request
//edited on 06-04-22 //settings permission block added for case admin
//edited on 11-04-22 //new settings block added
module.exports.checkToken = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      let decode = JSON.parse(atob(req.headers.authorization.split(".")[1]));
      if (decode && decode.role) {
        if (decode.db.substring(0, 3) != "RST") {
          return res
            .status(STATUSCODES.FORBIDDEN)
            .send({ msg: "Not A Restaurant User" });
        }
        req.decode = decode; //added on 22-03-22
        process.env.branchId = decode.branchId; //added on 10-03-22
        process.env.db =
          decode.db != undefined
            ? decode.db
            : await this.fetchDB(process.env.uname, next); //added on 05-07-22

        const { settingsModel } = conn.settings(req.decode.db);
        const { employeeModel } = conn.employee(req.decode.db);
        const adminModel = conn.auth(req.decode.db);
        if (typeof req.decode.password != undefined) {
          let adminExist = await adminModel.findOne({});
          if (this.checkObject(adminExist)) {
            if (req.decode.password != adminExist.password.length) {
              return res.status(STATUSCODES.UNAUTHORIZED).send({
                msg: "For Security Reasons Relogin Again......!!!!!!!",
              });
            }
          } else {
            return res
              .status(STATUSCODES.NOTFOUND)
              .send({ msg: "Admin Not Detected" });
          }
        } else {
          return res
            .status(STATUSCODES.UNAUTHORIZED)
            .send({ msg: "For Security Reasons Relogin Again......!!!!!!!" });
        }
        if (decode.role == ROLES.ADMIN) {
          req.settings = {
            empId: String,
            dashboard: Boolean,
            order: {
              all: false,
              orderLst: Boolean,
              newOrder: Boolean,
              pendingOrder: Boolean,
              completeOrder: Boolean,
              cancelOrder: Boolean,
              credit: Boolean,
              mess: false,
            },
            reservation: {
              all: Boolean,
              reservation: Boolean,
              addreservation: Boolean,
              settings: Boolean,
              addseat: Boolean,
            },
            purchaseManage: {
              all: Boolean,
              productMaster: Boolean,
              purchaseProduct: Boolean,
              addpurchase: Boolean,
              purchaseReturn: Boolean,
              returnInvoice: Boolean,
              supplierManage: Boolean,
              supplierLedger: Boolean,
              stockOutProducts: Boolean,
              /* */ grn: Boolean, //added on 11-04-22
              stockAdjustment: Boolean,
              transfer: Boolean /* */,
            },
            report: {
              all: Boolean,
              purchaseReport: Boolean,
              stockReport: Boolean,
              salesReport: Boolean,
              dailyReport: Boolean,
              /* added on 11-04-22*/
              cashSummary: Boolean,
              profitnSale: Boolean,
              transfer: Boolean,
              stockAdjustment: Boolean,
              expense: Boolean,
              payment: Boolean /* */,
            },
            foodManagement: {
              all: Boolean,
              manageCategory: Boolean,
              addrecipients: Boolean,
              foodList: Boolean,
              addFood: Boolean,
              foodAvailable: Boolean,
              menuType: Boolean,
              coupon: Boolean,
              manageSubCategory: Boolean, //added on 11-04-22
            },
            sales: {
              all: false,
              billing: false,
              salesInvoice: Boolean,
              salesOrder: Boolean,
              payments: Boolean,
              quotation: Boolean,
              salesReturn: Boolean,
            },
            rewardPoint: {
              all: Boolean,
              rewardsView: Boolean,
              addRewards: Boolean,
            },
            offers: {
              all: Boolean,
              offerListed: Boolean,
              addOffer: Boolean,
            },
            wallet: Boolean,
            accounts: {
              all: Boolean,
              chartOfAccount: Boolean,
              supplierPayment: Boolean,
              cashAdjustment: Boolean,
              creditVoucher: Boolean,
              debitVoucher: Boolean,
              contraVoucher: Boolean,
              journalVoucher: Boolean,
              voucherApproval: Boolean,
              accountReport: Boolean,
            },
            staff: {
              all: Boolean,
              dashboard: Boolean,
              position: Boolean,
              manageEmployee: Boolean,
              addEmployee: Boolean,
              addDocument: Boolean,
              department: Boolean,
              attendance: Boolean,
              // manageExpense: Boolean,//removed on 11-04-22 from here because its a new section now
              leaveApplication: Boolean,
              holiday: Boolean,
              addleaveType: Boolean,
              employeeSalary: Boolean,
              addPayroll: Boolean,
              payrollItem: Boolean,
              loan: Boolean,
            },
            /*added on 11-04-22 */
            expense: {
              all: Boolean,
              manageExpense: Boolean,
              outletExpense: Boolean,
              pettyCashReciept: Boolean,
              addExpenseType: Boolean,
            },
            /*added on 11-04-22 */
            customer: {
              all: false,
              viewCustomer: Boolean,
              addCustomer: false,
            },
            settings: true, //added on 06-04-22 settings section added if adminOnly
          };
          next();
        } else {
          let settings = {};
          if (this.isObjectId(decode._id)) {
            settings = await settingsModel.findOne({ empId: decode._id });
          }
          if (!this.isEmpty(settings)) {
            req.settings = settings;
            if (settings.dashboard == true) {
              req.settings.settings = true;
            }
            next();
          } else {
            // let employee = await viewSingleEmployee(decode._id);
            let employee = {};
            if (ObjectId.isValid(decode._id)) {
              employee = await employeeModel.findOne({ _id: decode._id });
            }
            if (!this.isEmpty(employee)) {
              if (ObjectId.isValid(employee.designation)) {
                settings = await settingsModel.findOne({
                  empId: employee.designation,
                });
              }
              if (!this.isEmpty(settings)) {
                req.settings = settings;
                if (settings.dashboard == true) {
                  req.settings.settings = true;
                }
                next();
              } else {
                return res
                  .status(STATUSCODES.FORBIDDEN)
                  .send({ msg: "no user permission for this employee" });
              }
            } else {
              return res
                .status(STATUSCODES.NOTFOUND)
                .send({ msg: "no employee" });
            }
          }
        }

        // await this.startShift();
      } else {
        return res.status(STATUSCODES.FORBIDDEN).send();
      }
    } else {
      return res.status(STATUSCODES.UNAUTHORIZED).send();
    }
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 09-04-22
module.exports.generateOtp = (len) => {
  try {
    let digits = "0123456789";

    let otpLength = len;

    let otp = "";

    for (let i = 1; i <= otpLength; i++) {
      let index = Math.floor(Math.random() * digits.length);

      otp = otp + digits[index];
    }
    return otp;
  } catch (e) {
    console.error(e);
  }
};

//added on 22/04/2022
module.exports.dateConverter = (millsec) => {
  var mydate = new Date(millsec);
  var monthInWords = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][mydate.getMonth()];

  var monthInDigits = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ][mydate.getMonth()];

  var year = mydate.getFullYear();

  var day = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][mydate.getDay()];
  let data = { month: monthInDigits, year: year };
  return data;

  /* console.log('Day: ', day);

console.log('Month In Words: ', monthInWords);

console.log('Month In Digits: ', monthInDigits)

console.log('Year: ', mydate.getFullYear());

console.log("Hours: ", mydate.getHours());

console.log("Mitutes: ", mydate.getMinutes()); */

  //return(`${day} ${month} ${mydate.getFullYear()} ${mydate.getHours()}hrs ${mydate.getMinutes()}min`);
};

//added on 19-05-22
//edited on 28-05-22 -> code changed to check if null and undefined
module.exports.isEmpty = (obj) => {
  try {
    if (obj != null && obj != undefined) {
      for (var prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
          return false;
        }
      }
      return JSON.stringify(obj) === JSON.stringify({});
    } else {
      return true;
    }
  } catch (e) {
    console.error(e);
  }
};

//added on 26-05-22
module.exports.prescisesecondsconvert = (millis) => {
  try {
    // let date = new Date("2022-05-25 00:00").getTime();
    // let date2 = new Date("2022-05-25 15:45").getTime();
    // function timeDistance(date1, date2) {
    //   let distance = Math.abs(date1 - date2);
    //   const hours = Math.floor(distance / 3600000);
    //   distance -= hours * 3600000;

    //   const minutes = Math.floor(distance / 60000);
    //   distance -= minutes * 60000;

    //   const seconds = Math.floor(distance / 1000);
    //   return `${hours}:${("0" + minutes).slice(-2)}:${("0" + seconds).slice(
    //     -2
    //   )}`;
    // }
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  } catch (e) {
    res = { data: e, status: STATUSCODES.ERROR };
  }
};

//added on 26-05-22
//changed return format on 06-06-22
module.exports.msToHMS = (ms) => {
  let seconds = ms / 1000;
  const hours = parseInt(seconds / 3600);
  seconds = seconds % 3600;
  const minutes = parseInt(seconds / 60);
  seconds = seconds % 60;
  // return `${hours} hrs ${minutes} min ${seconds} sec`;
  return `${hours > 9 ? hours : "0" + hours}:${
    minutes > 9 ? minutes : "0" + minutes
  }:${seconds > 9 ? seconds : "0" + seconds}`;
};

//added on 31-05-22
module.exports.checkIfNullOrUndefined = (param1, param2) => {
  try {
    if (param1 && param2) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return e;
  }
};

//added on 06-06-22
module.exports.strToSec = (req) => {
  var a = req.split(":");
  var seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2];
  return seconds * 1000;
};

//added on 20-07-22
module.exports.fetchDB = async (req, next) => {
  try {
    let res = {};
    const adminModel = conn.auth(process.env.db);
    const adminExist = await adminModel.findOne({ userName: req });
    if (!this.isEmpty(adminExist)) {
      process.env.db = adminExist.db;
      next();
    } else {
      res = {
        data: { message: "admin not present" },
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = {
      data: { message: "Problem With Database name" },
      status: STATUSCODES.UNPROCESSED,
    });
  }
};

//added on 21-07-22
module.exports.startShift = async (req) => {
  try {
    let currTime = new Date(Date.now()).getTime();
    let currSec = this.strToSec(
      new Date(currTime).toLocaleTimeString().split(" ")[0]
    );
    let currHr = new Date(Date.now()).getHours();
    // console.log(currHr);
    let settings = await viewShiftSettings();
    if (!this.isEmpty(settings)) {
      let activeShift = await getActiveBranchShift();
      if (this.isEmpty(activeShift.data)) {
        /*"shiftType": 0,
        "startDate": "2022-07-22 09:00",
        "endDate": "2022-07-22 18:30" */
        let appendStartTime = this.msToHMS(settings.data.startTime);
        let appendEndTime = this.msToHMS(settings.data.endTime);
        let startDate = `${
          this.prescisedateconvert(Date.now()).split(" ")[0]
        } ${appendStartTime}`;
        let endDate = `${
          this.prescisedateconvert(Date.now()).split(" ")[0]
        } ${appendEndTime}`;
        let rqst = {
          body: {
            shiftType: 0,
            startDate: startDate,
            endDate: endDate,
          },
        };
        await addBranchShift(rqst);
      } else {
        if (activeShift.data.status) {
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
};

//added on 27-07-12
module.exports.backUpDb = () => {
  try {
    let bkupProcess = spawn("mongodump", [
      `--db=${process.env.db}`,
      "--username=leeyet",
      "--password=Pkpm@4750",
      "--authenticationDatabase=admin",
      "--out=./dump/",
    ]);
    bkupProcess.on("exit", (code, signal) => {
      if (code) console.log("Backup process exited with code ", code);
      else if (signal)
        console.error("Backup process was killed with singal ", signal);
      else console.log("Successfully backedup the database");
    });
  } catch (e) {
    console.error(e);
  }
};

//added on 24-08-22
//edited on 25-08-22 -> method corrected as per requirement with async await
module.exports.createDirectory = async (filepath) => {
  try {
    const makeDir = util.promisify(fs.mkdir);
    await makeDir(filepath, { recursive: true })
      .then(() => {
        console.log(`Directory '${filepath}' is created`);
      })
      .catch((err) => {
        console.log(
          `Error occurs, 
    Error code -> ${err.code} and,
    Error No -> ${err.errno}`,
          err
        );
      });
  } catch (e) {
    console.error(e);
  }
};

// aaded on 09-06-23
//added on 12-12-22
module.exports.isObjectId = (req) => {
  if (ObjectId.isValid(req)) {
    return true;
  } else {
    return false;
  }
};

//added on 17-04-23
module.exports.checkObject = (obj) => {
  try {
    if (obj != null && Object.keys(obj).length > 0) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return e.message;
  }
};

//added on 09-06-23
module.exports.checkIfNullOrUndefined = (param1, param2) => {
  try {
    if (
      (typeof param1 == "string" && typeof param2 == "string") ||
      (typeof param1 == "number" && typeof param2 == "number")
    ) {
      if (param1.length > 0 && param2.length > 0) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (e) {
    return e;
  }
};
//added on 11-07-23
module.exports.startandenddateofaday = (req) => {
  try {
    let startdate = new Date(req).setUTCHours(-5, -30, 0, 0);
    let endDate = new Date(req).setUTCHours(18, 29, 59, 999);
    return (res = { start: startdate, end: endDate });
  } catch (e) {
    console.error(e);
  }
};

module.exports.getEarliestExpiryDate = (req) => {
  try {
    return req.reduce((earliestDate, currentDocument) => {
      const currentExpiryDate = currentDocument.expiryDate;
      return currentExpiryDate < earliestDate
        ? currentExpiryDate
        : earliestDate;
    }, new Date("9999-12-31"));
  } catch (e) {
    console.error(e);
  }
};

//added on 17-07-23
module.exports.newdateconvert = (date) => {
  try {
    let mydate = new Date(date);
    var ampm = mydate.getHours() >= 12 ? "PM" : "AM";
    let dateString =
      new Date(mydate).getFullYear() +
      "-" +
      ("0" + (new Date(mydate).getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + new Date(mydate).getDate()).slice(-2) +
      " " +
      ("0" + new Date(mydate).getHours()).slice(-2) +
      ":" +
      ("0" + new Date(mydate).getMinutes()).slice(-2) +
      ":" +
      ("0" + new Date(mydate).getSeconds()).slice(-2) +
      "-" +
      ampm;

    return dateString;
  } catch (e) {
    console.error(e);
    res = { data: e, status: STATUSCODES.ERROR };
    return res;
  }
};
module.exports.startandendofamonth = (date) => {
  try{
    let inDate = new Date(date);
    let firstDay =new Date(inDate.getFullYear(), inDate.getMonth(), 1).setUTCHours(0,0,0);
    let lastDay =new Date( inDate.getFullYear(), inDate.getMonth() + 1, 0).setUTCHours(23,59,59);
    return (res = { start: firstDay, end: lastDay }); 
  } catch(e){
    console.error(e);
    res = { data: e, status: STATUSCODES.ERROR };
    return res;
  }
}
//#endregion
