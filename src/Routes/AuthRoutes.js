//created on 08-02-2022
//#region headers
const crypto = require("crypto");
const { STATUSCODES, ROLES } = require("../Model/enums");
const jwt = require("jsonwebtoken");
const common_service = require("./commonRoutes.js");
require("dotenv").config({ path: "./.env" });
const fs = require("fs");
const conn = require("../../userDbConn");
const axios = require("axios");
// const { viewLoanSingle } = require("./EmployeeRoutes");
const { viewBranchbyStorecode } = require("./LocationRoute");
const { viewUserSettings } = require("./settingsRoutes");
//#endregion

//#region methods
//added on 08-02-2022
//edited on 28-05-22 -> added 2 new fields code and firstlogin,method to generate admincode
//edited on 22-06-22
//edited on 28-06-22
//edited on 4-07-2022 to connect with leeyet admin
//edited on 05-07-22 to accomodate multiple db creation for single client
//assebled on 14-07-22
module.exports.signUp = async (req) => {
  let arr = [],
    res = {};
  try {
    const adminModel = conn.auth(req.body.db);
    let adminExist = await adminModel.findOne({
      userName: req.body.userName,
    });
    let ADMINCODE = 0;
    let adminList = await adminModel.aggregate([
      {
        $sort: { code: -1 },
      },
    ]);
    if (adminList.length > 0) {
      ADMINCODE = adminList[0].code + 1;
    } else {
      ADMINCODE = 1;
    }
    if (!adminExist) {
      // let password = this.hashpassword(req.body.password);
      let adminData = new adminModel({
        userName: req.body.userName,
        password: req.body.password,
        salt: req.body.salt,
        profile: {
          companyName: req.body.companyName,
          companyemail: null,
          contactNumber: req.body.contact, //added on 20-07-22
          companyAddress: null,
          contactPerson: null,
          website: null,
          logo: null,
          country: null,
          currency: null,
          language: null,
          prefix: req.body.companyName.substring(0, 3).toUpperCase(),
        },
        bank: {
          accountHolderName: null,
          accountType: null,
          accountNumber: null,
          ifscCode: null,
        },
        gst: {
          sellerRegisteredNumber: null,
          gstNumber: null,
          panNumber: null,
          productTaxCode: null,
          isTax: false,
        },
        code: ADMINCODE,
        firstLogin: true,
        discount: null, //added on 22-06-22 -> initialised new discount field today
        upi: null, //added on 23-06-22 -> initialised new upi field today
        terms: null, //added 28-06-22 -> added new field initialisation
        rewardCriteria: null,
        db: req.body.db,
        packtoDate: req.body.packtoDate,
        enableBackup: req.body.enablebackup,
      });
      let data = await adminData.save();
      if (data) {
        var token = jwt.sign(
          {
            _id: data._id.toString(),
            role: ROLES.ADMIN,
          },
          process.env.TOKEN_SECRET,
          { algorithm: "HS256", expiresIn: 31536000 }
        );
        let temp = { data, token };
        arr.push(temp);
      }
    }
    if (arr.length > 0) {
      const path = `./public/${req.body.db}`;

      fs.access(path, (error) => {
        // To check if the given directory
        // already exists or not
        if (error) {
          // If current directory does not exist
          // then create it
          fs.mkdir(path, (error) => {
            if (error) {
              console.error(error);
            } else {
              console.log("New Directory created successfully !!");
            }
          });
        } else {
          console.log("Given Directory already exists !!");
        }
      });
      res = { data: arr, status: STATUSCODES.SUCCESS, token: token };
    } else {
      res = { data: { msg: arr }, status: STATUSCODES.UNPROCESSED, token: "" };
    }

    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 08-02-2022
module.exports.hashpassword = (req) => {
  try {
    let res = {};
    let salt = crypto.randomBytes(16).toString("hex");
    let hash = crypto.pbkdf2Sync(req, salt, 1000, 64, `sha512`).toString(`hex`);
    res = { hash: hash, salt: salt };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 05-04-22
//edited on 09-04-22
//edited on 10-08-22
module.exports.searchUserName = async (req) => {
  let customer = await axios({
    method: "POST",
    url: `${process.env.ADMINURL}customer/getcustomerbyusername`,
    data: {
      username: req.body.userName,
      companyCode: req.body.companyCode,
    },
  });
  if (!common_service.isEmpty(customer.data)) {
    process.env.uname = customer.data.username;
    if (Array.isArray(customer.data.db) && customer.data.db.length > 0) {
      customer.data.db.forEach((x) => {
        if (x.includes(req.body.prefix)) {
          process.env.db = x;
        }
      });
    }
  } else {
    let cstData = await axios({
      method: "POST",
      url: `${process.env.ADMINURL}customer/getSingleCustomer`,
      data: {
        companyCode: req.body.companyCode,
      },
    });
    if (!common_service.isEmpty(cstData)) {
      process.env.uname = cstData.data.username;
      if (Array.isArray(cstData.data.db) && cstData.data.db.length > 0) {
        cstData.data.db.forEach((x) => {
          if (x.includes(req.body.prefix)) {
            process.env.db = x;
          }
        });
      }
    }
  }
  const adminModel = conn.auth(process.env.db);
  const { employeeModel } = conn.employee(process.env.db);
  try {
    let res = {};
    let adminExist = await adminModel.findOne({ userName: req.body.userName });
    if (adminExist) {
      res = {
        data: {
          role: ROLES.ADMIN,
          logo: process.env.FILEURL + adminExist.profile.logo,
          companyName: adminExist.profile.companyName,
        }, //edited on 10-08-22 -> added 2 new fields to response logo and companyname
        status: STATUSCODES.SUCCESS,
      };
    } else {
      req.body.contactnumber = req.body.userName;
      let emp_exist = await employeeModel.findOne({
        contactnumber: req.body.userName,
      });
      if (emp_exist) {
        /*edited on 11-08-22 */
        let adminExist = await adminModel.findOne({ _id: emp_exist.admin_id });
        if (common_service.checkObject(adminExist)) {
          res = {
            data: {
              role: ROLES.USER,
              logo: common_service.checkObject(adminExist.profile)
                ? process.env.FILEURL + adminExist.profile.logo
                : null,
              companyName: common_service.checkObject(adminExist.profile)
                ? adminExist.profile.companyName
                : null,
            },
            status: STATUSCODES.SUCCESS,
          };
        } else {
          res = {
            data: {
              role: ROLES.USER,
              logo: null,
              companyName: null,
            },
            status: STATUSCODES.SUCCESS,
          };
        }
      } else {
        res = { data: null, status: STATUSCODES.NOTFOUND };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 05-04-22
//edited on 07-04-22 prefix field implementationn,file saving
module.exports.editProfile = async (req) => {
  const adminModel = conn.auth(req.decode.db);
  try {
    let res = {};
    let adminExist = await adminModel.findOne({
      _id: req.decode._id,
    });
    if (adminExist) {
      if (Object.keys(adminExist.profile).length > 0) {
        if (req.body.companyName)
          (adminExist.profile.companyName = req.body.companyName),
            (adminExist.profile.companyEmail = req.body.companyEmail),
            (adminExist.profile.contactNumber = req.body.contactNumber),
            (adminExist.profile.companyAddress = req.body.companyAddress),
            (adminExist.profile.contactPerson = req.body.contactPerson),
            (adminExist.profile.website = req.body.website),
            (adminExist.profile.country = req.body.country),
            (adminExist.profile.currency = req.body.currency),
            (adminExist.profile.language = req.body.language);
        adminExist.profile.prefix = adminExist.profile.companyName
          .substring(0, 3)
          .toUpperCase();
        if (req.files) {
          await common_service.createDirectory(
            `./public/${req.decode.db}/admin`
          );
          if (adminExist.profile.logo != null) {
            //added if condition on 07-04-22
            let remvArr = adminExist.profile.logo.split(process.env.FILEURL);
            fs.unlink(`public/` + adminExist.profile.logo, (err) => {
              if (err) console.log(err);
            });
            req.files.file.mv(
              `./public/${req.decode.db}/Admin/${adminExist.userName}-${req.files.file.name}`
            );
            adminExist.profile.logo = `Images/${req.decode.db}/Admin/${adminExist.userName}-${req.files.file.name}`;
          } else {
            await common_service.createDirectory(
              `./public/${req.decode.db}/admin`
            );
            req.files.file.mv(
              `./public/${req.decode.db}/Admin/${adminExist.userName}-${req.files.file.name}`
            );
            adminExist.profile.logo = `Images/${req.decode.db}/Admin/${adminExist.userName}-${req.files.file.name}`;
          }
        }
      } else {
        adminExist.profile = {
          companyName: req.body.companyName,
          companyEmail: req.body.companyEmail,
          contactNumber: req.body.contactNumber,
          companyAddress: req.body.companyAddress,
          contactPerson: req.body.contactPerson,
          website: req.body.website,
          country: req.body.country,
          currency: req.body.currency,
          language: req.body.language,
          prefix: req.body.companyName.substring(0, 3).toUpperCase(), //added on 07-04-22
        };
        if (req.files) {
          await common_service.createDirectory(
            `./public/${req.decode.db}/admin`
          );
          req.files.file.mv(
            `./public/${req.decode.db}/Admin/${adminExist.userName}-${req.files.file.name}`
          );
          adminExist.profile.logo = `Images/${req.decode.db}/Admin/${adminExist.userName}-${req.files.file.name}`;
        } else {
          adminExist.profile.logo = null;
        }
      }
      if (adminExist.bank != null) {
        adminExist.bank.accountHolderName = req.body.accountHolderName;
        adminExist.bank.accountType = req.body.accountType;
        adminExist.bank.accountNumber = req.body.accountNumber;
        adminExist.bank.ifscCode = req.body.ifscCode;
      } else {
        adminExist.bank = {
          accountHolderName: req.body.accountHolderName,
          accountType: req.body.accountType,
          accountNumber: req.body.accountNumber,
          ifscCode: req.body.ifscCode,
        };
      }
      if (adminExist.gst != null) {
        (adminExist.gst.sellerRegisteredNumber =
          req.body.sellerRegisteredNumber),
          (adminExist.gst.gstNumber = req.body.gstNumber),
          (adminExist.gst.panNumber = req.body.panNumber),
          (adminExist.gst.productTaxCode = req.body.productTaxCode);
        adminExist.gst.isTax = req.body.isTax;
      } else {
        adminExist.gst = {
          sellerRegisteredNumber: req.body.sellerRegisteredNumber,
          gstNumber: req.body.gstNumber,
          panNumber: req.body.panNumber,
          productTaxCode: req.body.productTaxCode,
          isTax: req.body.isTax,
        };
      }
      //   discount: {}, //added on 22-06-22
      // upi: [{}], //added on 23-06-22
      // terms: String, //added on 28-06-22
      // rewardCriteria: {}
      adminExist.discount = req.body.discount
        ? JSON.parse(req.body.discount)
        : adminExist.discount;
      adminExist.upi = req.body.upi ? JSON.parse(req.body.upi) : adminExist.upi;
      adminExist.terms = req.body.terms ? req.body.terms : adminExist.terms;
      adminExist.rewardCriteria = req.body.rewardCriteria
        ? JSON.parse(req.body.rewardCriteria)
        : adminExist.rewardCriteria;
      let data = await adminExist.save();
      if (data) {
        data.password = "*********";
        data.hash = "*********";
        data.salt = "*********";
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 10-04-22
module.exports.sendOtp = async (req) => {
  const adminModel = conn.auth(process.env.db);
  const smsModel = conn.sms(process.env.db);
  try {
    let res = {};
    let adminExist = await adminModel.findOne({
      "profile.contactNumber": req.body.contactNumber,
    });
    if (adminExist) {
      let otpExist = await smsModel.findOne({
        contactNumber: req.body.contactNumber,
      });
      if (otpExist) {
        otpExist.otp = common_service.generateOtp(4).toString();
        let data = await otpExist.save();
        if (data) {
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        let smsData = new smsModel({});
        let otp = common_service.generateOtp(4).toString();
        if (otp > 0) {
          smsData.otp = otp;
          smsData.contactNumber = req.body.contactNumber;
        }
        let data = await smsData.save();
        if (data) {
          res = { data: smsData, status: STATUSCODES.SUCCESS };
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

//added on 10-04-22
//edited on 11-04-22
//edited on 28-05-22
//assembled on 14-07-22
module.exports.verifyotp = async (req) => {
  const smsModel = conn.sms(process.env.db);
  const adminModel = conn.auth(process.env.db);
  try {
    let res = {};
    let otpExist = await smsModel.findOne({
      otp: req.body.otp,
      contactNumber: req.body.contactNumber,
    });
    if (otpExist) {
      let adminExist = await adminModel.findOne({
        "profile.contactNumber": req.body.contactNumber,
      });
      if (adminExist) {
        /*  let hash = crypto
          .pbkdf2Sync(adminExist.password, adminExist.salt, 1000, 64, `sha512`)
          .toString(`hex`);
        if (hash == adminExist.hash) { */
        let token = jwt.sign(
          {
            _id: adminExist._id,
            role: ROLES.ADMIN,
            prefix: adminExist.profile.prefix
              ? adminExist.profile.prefix
              : null,
            branchId: req.body.branchId ? req.body.branchId : null,
            password: adminExist.password, //added on 11-04-22,
            login: adminExist.firstLogin, //added on 28-05-22
          },
          process.env.TOKEN_SECRET,
          { algorithm: "HS256", expiresIn: 31536000 }
        );
        adminExist.password = "*********";
        adminExist.hash = "*********";
        adminExist.salt = "*********";
        res = {
          data: adminExist,
          status: STATUSCODES.SUCCESS,
          token: token,
        };
        /* } else {
          res = { data: {}, status: STATUSCODES.UNAUTHORIZED, token: "" };
        } */
      } else {
        res = { data: {}, status: STATUSCODES.UNAUTHORIZED, token: "" };
      }
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 23-06-22
//added and assembled on 14-07-22
module.exports.addDiscount = async (req) => {
  const adminModel = conn.auth(req.decode.db);
  try {
    let res = {};
    let adminExist = await adminModel.findOne({ _id: req.decode._id });
    if (!common_service.isEmpty(adminExist)) {
      adminExist.discount = req.body.discount;
      let data = await adminExist.save();
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

//added on 23-06-22
//added and assembled on 14-07-22
module.exports.fetchDiscount = async (req) => {
  const adminModel = conn.auth(process.env.db);
  
  try {
    let res = {};
    if (req.decode.role==ROLES.ADMIN) {
      let adminExist = await adminModel.findOne({
        _id: req.decode.admin,
      });
      if (!common_service.isEmpty(adminExist)) {
        res = { data: adminExist.discount, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.NOTFOUND };
      }
      return res;
      
    } else {
      
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 23-06-22
//edited on 12-07-22
//added and assembled on 14-07-22
module.exports.addUpiDetails = async (req) => {
  const adminModel = conn.auth(process.env.db);
  try {
    let res = {};
    let adminExist = await adminModel.findOne({
      _id: req.decode._id,
    });
    if (!common_service.isEmpty(adminExist)) {
      if (adminExist.upi == null) {
        adminExist.upi = [];
      }
      let upiobj = {};
      if (req.files.file) {
        req.files.file.mv(
          `./public/Images/Upi/${req.body.appName.toUpperCase()}-${
            req.files.file.name
          }`
        );
        upiobj.imageUrl = `Images/Upi/${req.body.appName.toUpperCase()}-${
          req.files.file.name
        }`;
        upiobj.imageUrl = upiobj.imageUrl.replace(/ + - /g, "");
      } else {
        upiobj.imageUrl = null;
      }
      upiobj.uuid = common_service.generateUuid(); //added new field on 12-07-22
      upiobj.appName = req.body.appName.toUpperCase();
      upiobj.upiid = req.body.upiid;
      upiobj.uuid = common_service.generateUuid();
      adminExist.upi.push(upiobj);
      let data = await adminExist.save();
      if (data) {
        //added on 12-07-22 -> iteration added to return imageurl with FILEURL appended
        for (let i = 0; i < data.upi.length; i++) {
          const element = data.upi[i];
          element.imageUrl = process.env.FILEURL + element.imageUrl;
        }
        res = { data: data.upi, status: STATUSCODES.SUCCESS };
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

//added on 23-06-22
//added and assembled on 14-07-22
//edited on 21-07-22
module.exports.viewUpiDetails = async (req) => {
  const adminModel = conn.auth(process.env.db);
  try {
    let res = {};
    let adminExist = await adminModel.findOne({
      _id: req.decode._id,
    });
    if (!common_service.isEmpty(adminExist)) {
      /*added on 21-07-22 validation check added from here */
      if (Array.isArray(adminExist.upi) && adminExist.upi.length > 0) {
        adminExist.upi.map((e) => {
          e.imageUrl = process.env.FILEURL + e.imageUrl;
          e.applogo = process.env.FILEURL + e.imageUrl;
        });
        res = { data: adminExist.upi, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: [], status: STATUSCODES.NOTFOUND };
      }
      /*to here */
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 25-06-22
//added and assembled on 14-07-22
module.exports.profile = async (req) => {
  const adminModel = conn.auth(process.env.db);
  try {
    let res = {};
    let adminExist = await adminModel.findOne({ _id: req.decode.admin });
    if (!common_service.isEmpty(adminExist)) {
      adminExist.password = "*****";
      adminExist.salt = "*****";
      adminExist.hash = "*****";
      res = { data: adminExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 12-07-22
//added and assembled on 14-07-22
module.exports.viewMaxDiscount = async (req) => {
  const adminModel = conn.auth(process.env.db);
  try {
    let res = {};
    let adminExist = await adminModel.findOne(
      { _id: process.env.admin },
      { discount: 1 }
    );
    if (!common_service.isEmpty(adminExist)) {
      res = { data: adminExist.discount, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 11-07-22
//edited on 12--07--22
//added and assembled on 14-07-22
module.exports.deleteUpi = async (req) => {
  const adminModel = conn.auth(process.env.db);
  try {
    let res = {};
    let adminExist = await adminModel.findOne({ _id: req.decode._id });
    if (!common_service.isEmpty(adminExist)) {
      if (!common_service.isEmpty(adminExist.upi)) {
        let arr = adminExist.upi.findIndex(
          (element) => element.uuid == req.body.uuid
        );
        //changed on 13-07-22 -> index validation  added
        if (arr != -1) {
          if (!common_service.isEmpty(adminExist.upi[arr])) {
            fs.unlink(`public/` + adminExist.upi[arr]?.imageUrl, (err) => {
              if (err) console.log(err);
            });
          }

          adminExist.upi.splice(arr, 1);
          let data = await adminExist.save();
          if (data) {
            res = { data: adminExist.upi, status: STATUSCODES.SUCCESS };
          } else {
            res = { data: {}, status: STATUSCODES.UNPROCESSED };
          }
        } else {
          res = {
            data: {
              message: "No Upi In This Id",
            },
            status: STATUSCODES.NOTFOUND,
          };
        }
      } else {
        res = {
          data: { message: "No Upis Set By Admin" },
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

//added on 23-07-22
module.exports.updatePassword = async (req) => {
  try {
    const adminModel = conn.auth(process.env.db);
    let adminExist = await adminModel.findOne({ _id: req.decode._id });
    if (!common_service.isEmpty(adminExist)) {
      let hash = crypto
        .pbkdf2Sync(req.body.newpassword, adminExist.salt, 1000, 64, "sha512")
        .toString("hex");
      adminExist.password = hash;
      let data = await adminExist.save();
      if (data) {
        data.password = "*******";
        data._doc["profile"].logo = process.env.FILEURL + data.profile.logo;
        res = { data: adminExist, status: STATUSCODES.SUCCESS };
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

//added on 16-08-22
module.exports.login = async (req) => {
  let database = "no db";
  let customer = await axios({
    method: "POST",
    url: `${process.env.ADMINURL}customer/getcustomerbyusername`,
    data: {
      companyCode: req.body.companyCode,
      username: req.body.userName,
    },
  });
  if (!common_service.isEmpty(customer.data)) {
    process.env.uname = customer.data.username;
    if (Array.isArray(customer.data.db) && customer.data.db.length > 0) {
      customer.data.db.forEach((x) => {
        if (x.includes(req.body.prefix)) {
          database = x;
        }
      });
    }
  } else {
    let cstData = await axios({
      method: "POST",
      url: `${process.env.ADMINURL}customer/getSingleCustomer`,
      data: {
        companyCode: req.body.companyCode,
      },
    });
    if (!common_service.isEmpty(cstData)) {
      process.env.uname = cstData.data.username;
      if (Array.isArray(cstData.data.db) && cstData.data.db.length > 0) {
        cstData.data.db.forEach((x) => {
          if (x.includes(req.body.prefix)) {
            database = x;
          }
        });
      }
    } else {
      console.log("no user");
    }
  }
  // var db = process.env.db;

  const adminModel = conn.auth(database);
  const { employeeModel } = conn.employee(database);
  const { branchModel } = conn.location(database);
  try {
    let res = {};
    let adminExist = await adminModel.findOne({ userName: req.body.userName });
    // let adminExist = await adminModel.findOne({  });

    // let branchExist = await branchModel.findOne(
    //   { storecode: req.body.branchId },
    //   {}
    // );
    if (adminExist) {
      /* let hash = crypto
      .pbkdf2Sync(req.body.password, adminExist.salt, 1000, 64, `sha512`)
      .toString(`hex`); */
      if (req.decode?.password == adminExist.password) {
        let token = jwt.sign(
          {
            _id: adminExist._id,
            companyCode: customer?.data.companyCode,
            role: ROLES.ADMIN,
            prefix: adminExist.profile.prefix
              ? adminExist.profile.prefix
              : null, //added on 07-04-22
            branchId: req.body.branchId ? req.body.branchId : null,
            // branchName:req.body.branchName?req.body.branchName:null,//added branchId on 03-03-22//commented on 05-04-22//re-added on 07-04-22
            /*added on 12-04-22 added country and location_id to token  */
            country: req.body.country ? req.body.country : null,
            location_id: req.body.location_id ? req.body.location_id : null,
            admin: customer.data.companyCode, //added on 19-04-22-> for employee purpose
            firstlogin: adminExist.firstLogin, //added on 28-05-22
            db: db,
            password: adminExist.password.length,
            isTax: common_service.checkObject(adminExist.gst)
              ? adminExist.gst.isTax
              : false,
          },
          process.env.TOKEN_SECRET,
          { algorithm: "HS256", expiresIn: 31536000 }
        );
        // adminExist.firstLogin = true;
        await adminExist.save();
        adminExist.password = "*********";
        adminExist.hash = "*********";
        adminExist.salt = "*********"; /*added on 05-04-22 */
        if (!common_service.isEmpty(branchExist)) {
          adminExist._doc["branchId"] = branchExist.branchName;
        }
        res = {
          data: adminExist,
          status: STATUSCODES.SUCCESS,
          token: token,
          branchId: "noBranch", //added on 03-10-22 -> added to response
          branchPk: "noBranch", //added on 03-10-22 -> added to response
          branchName: "noBranch", //added on 03-10-22 -> added to response
          permission: {
            dashboard: true,
            productList: true,
            produtMaster: true,
            purchaseManage: {
              all: true,
              purchaseOrder: true,
              addPurchaseOrder: true,
              purchaseWpo: true,
              // grn: true,
              grn: {
                draft: true,
                posted: true,
                addGrn: true,
              } /* added on 09-11-22 new grn structure  */,
              supplierManagae: true,
              supplierLedger: true,
              stockOutProduct: true,
              purchaseReturn: true,
              stockAdjustment: {
                stockAdjustmentList: true,
                draft: true,
                addStockAdj: true,
                recievedStock: true,
                confirmedStock: true,
              },
              transfer: {
                transfer: true,
                recievedTransfer: true,
                confirmTransfer: true,
              },
              penPayVoucher: true,
              payVoucher: true,
            },
            order: {
              all: true,
              viewOrders: true,
              workOrder: true,
              printingCuttingSlip: false,
              jbCompletion: false,
              alteration: true,
              delivery: true,
            },
            report: {
              all: true,
              purchaseReport: true,
              stockReport: true,
              salesReport: true,
              dailyReport: true,
              dailyCashCardReport: true,
              profitNsaleReport: true,
              transferReport: true,
              stockAdjustmentReport: true,
              expenseReport: true,
              paymentReport: true,
              purchaseOrderReport: true,
              grn: true,
              purchaseWpo: true,
            },
            sale: {
              billing: false,
              orderList: true,
              payments: true,
              quotation: true,
              salesReturn: true,
              credit: true,
              oldStock: true,
              damagedGoods: true,
              wallet: true,
              quickBill: false /* added on 09-11-22 -> new permission field in sales */,
            },
            customer: {
              all: true,
              allcustomer: true,
              addCustomer: false,
            },
            expense: {
              staffExpense: true,
              outletExpense: true,
              pettyCashReciept: true,
              addExpenseType: false,
            },
            rewards: {
              rewardsView: true,
              addRewards: true,
            },
            offers: {
              offerListed: true,
              addOffer: true,
            },

            settings: true,
            /* added on 12-09-22 -> staff permissions */
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
            /* ends here */
          },
          storeName: adminExist.profile.companyName /* added on 11-11-22 */,
        };
      } else {
        let hash = crypto
          .pbkdf2Sync(req.body.password, adminExist.salt, 1000, 64, `sha512`)
          .toString(`hex`);
        if (hash == adminExist.password) {
          let token = jwt.sign(
            {
              _id: adminExist._id,
              role: ROLES.ADMIN,
              prefix: adminExist.profile.prefix
                ? adminExist.profile.prefix
                : null,
              branchId: req.body.branchId ? req.body.branchId : null,
              country: req.body.country ? req.body.country : null,
              location_id: req.body.location_id ? req.body.location_id : null,
              admin: adminExist._id,
              firstlogin: adminExist.firstLogin,
              db: database,
              password: adminExist.password.length,
            },
            process.env.TOKEN_SECRET,
            { algorithm: "HS256", expiresIn: 31536000 }
          );
          adminExist.firstLogin = false;
          await adminExist.save();
          adminExist.password = "*********";
          adminExist.hash = "*********";
          adminExist.salt = "*********";

          res = {
            data: adminExist,
            status: STATUSCODES.SUCCESS,
            token: token,
            imageUrl: process.env.FILEURL + adminExist.profile.logo,
            userName: adminExist.profile.companyName,
            branchId: "noBranch", //added on 03-10-22 -> added to response
            branchPk: "noBranch", //added on 03-10-22 -> added to response
            branchName: "noBranch", //added on 03-10-22 -> added to response
            permission: {
              dashboard: true,
              productList: true,
              produtMaster: true,
              purchaseManage: {
                all: true,
                purchaseOrder: true,
                addPurchaseOrder: true,
                purchaseWpo: true,
                grn: true,
                supplierManagae: true,
                supplierLedger: true,
                stockOutProduct: true,
                purchaseReturn: true,
                stockAdjustment: {
                  stockAdjustmentList: true,
                  draft: true,
                  addStockAdj: true,
                  recievedStock: true,
                  confirmedStock: true,
                },
                transfer: {
                  transfer: true,
                  recievedTransfer: true,
                  confirmTransfer: true,
                },
                penPayVoucher: true,
                payVoucher: true,
              },
              order: {
                all: true,
                viewOrders: true,
                workOrder: true,
                printingCuttingSlip: false,
                jbCompletion: false,
                alteration: true,
                delivery: true,
              },
              report: {
                all: true,
                purchaseReport: true,
                stockReport: true,
                salesReport: true,
                dailyReport: true,
                dailyCashCardReport: true,
                profitNsaleReport: true,
                transferReport: true,
                stockAdjustmentReport: true,
                expenseReport: true,
                paymentReport: true,
                purchaseOrderReport: true,
                grn: true,
                purchaseWpo: true,
              },
              sale: {
                billing: false,
                orderList: true,
                payments: true,
                quotation: true,
                salesReturn: true,
                credit: true,
                oldStock: true,
                damagedGoods: true,
                wallet: true,
                quickBill: false /* added on 09-11-22 -> new permission field in sales */,
              },
              customer: {
                all: true,
                allcustomer: true,
                addCustomer: false,
              },
              expense: {
                staffExpense: true,
                outletExpense: true,
                pettyCashReciept: true,
                addExpenseType: false,
              },
              rewards: {
                rewardsView: true,
                addRewards: true,
              },
              offers: {
                offerListed: true,
                addOffer: true,
              },

              settings: true,
              /* added on 12-09-22 -> staff permissions */
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
              /* ends here */
            },
            storeName: adminExist.profile.companyName /* added on 11-11-22 */,
          };
        } else {
          res = {
            data: { msg: "Incorrect Password" },
            status: STATUSCODES.UNAUTHORIZED,
            token: "",
          };
        }
      }
    } else {
      req.body.contactnumber = req.body.userName;
      let emp_exist = await employeeModel.findOne({
        username: req.body.userName,
      });

      let branchExist = await branchModel.findOne(
        { storecode: emp_exist?.branchId },
        {}
      );

      if (emp_exist) {
        //changed on 24-03-22
        let hash = crypto
          .pbkdf2Sync(req.body.password, emp_exist.salt, 1000, 64, "sha512")
          .toString("hex");
        let adminExist = await adminModel.findOne({});
        if (hash == emp_exist.hash) {
          let token = jwt.sign(
            {
              _id: emp_exist._id,
              role: ROLES.USER,
              branchId: emp_exist.branchId, //changed on 19-04-22 -> exact value assigned
              admin: emp_exist.admin_id, //added on 19-04-22 -> admin id added
              /*added on 12-04-22 added country and location_id to token  */
              country: !common_service.isEmpty(branchExist)
                ? branchExist.country
                : null,
              location_id: !common_service.isEmpty(branchExist)
                ? branchExist.location_id
                : null,
              db: database,
              prefix: adminExist?.profile.prefix
                ? adminExist.profile.prefix
                : null,
              password: adminExist?.password.length,
            },
            process.env.TOKEN_SECRET,
            { algorithm: "HS256", expiresIn: 31536000 }
          );

          emp_exist._doc["date_of_join"] =
            emp_exist.date_of_join != null
              ? common_service.prescisedateconvert(emp_exist.date_of_join)
              : null;
          emp_exist._doc["dob"] = common_service.prescisedateconvert(
            emp_exist.dob
          );
          emp_exist.password = "*******";
          emp_exist.hash = "*******";
          emp_exist.salt = "*******";
          emp_exist._doc["contractPeriodFrm"] =
            common_service.prescisedateconvert(emp_exist.contractPeriodFrm);
          emp_exist._doc["contractPeriodTo"] =
            common_service.prescisedateconvert(emp_exist.contractPeriodTo);
          emp_exist._doc["imageUrl"] = process.env.FILEURL + emp_exist.imageUrl;
          let branchdetails = await viewBranchbyStorecode(emp_exist.branchId);

          let settings = await viewUserSettings(emp_exist._id);
          res = {
            data: emp_exist,
            status: STATUSCODES.SUCCESS,
            token: token,
            imageUrl: emp_exist.imageUrl,
            userName: emp_exist.staff_name,
            branchId: emp_exist.branchId, //added on 03-10-22 -> added to response
            branchPk: !common_service.isEmpty(branchdetails.data)
              ? branchdetails.data._id
              : "no name", //added on 03-10-22 -> added to response
            branchName: !common_service.isEmpty(branchdetails.data)
              ? branchdetails.data.branchName
              : "no name", //added on 03-10-22 -> added to response
            permission: settings.data,
            storeName: !common_service.isEmpty(branchdetails.data)
              ? branchdetails.data.nameOfStore
              : "No StoreName" /* added on 11-11-22 */,
          };
        } else {
          res = { data: {}, status: STATUSCODES.UNAUTHORIZED, token: "" };
        }
      } else {
        res = { data: {}, status: STATUSCODES.NOTFOUND, token: "" };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 20-07-23
module.exports.verifyPassword = async (req) => {
  const adminModel = conn.auth(req.decode.db);
  const { employeeModel } = conn.employee(req.decode.db);
  try {
    if (!common_service.isEmpty(req.decode)) {
      if (req.decode.role == ROLES.ADMIN) {
        const adminExist = await adminModel.findOne({ _id: req.decode._id });
        if (!common_service.isEmpty(adminExist)) {
          let hash = crypto
            .pbkdf2Sync(req.body.password, adminExist.salt, 1000, 64, `sha512`)
            .toString(`hex`);
          if (hash == adminExist.password) {
            res = { data: adminExist, status: STATUSCODES.SUCCESS };
          } else {
            res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
          }
        } else {
          res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
        }
      } else if (req.decode.role == ROLES.USER) {
        let emp_exist = await employeeModel.findOne({ _id: req.decode._id });
        if (!common_service.isEmpty(emp_exist)) {
          let hash = crypto
            .pbkdf2Sync(req.body.password, emp_exist.salt, 1000, 64, `sha512`)
            .toString(`hex`);
          if (hash == emp_exist.hash) {
            res = { data: emp_exist, status: STATUSCODES.SUCCESS };
          } else {
            res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
          }
        } else {
          res = { data: {}, status: STATUSCODES.NOTFOUND };
        }
      } else {
        res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 05-09-2023
module.exports.setExpiryDate = async (req) => {
  try {
    const adminModel = conn.auth(req.body.db);
    let adminExist = await adminModel.findOne({});
    if (adminExist) {
      let response = await adminModel.findOneAndUpdate(
        { _id: adminExist._id },
        { $set: { packtoDate: new Date().getTime() } },
        { new: true }
      );
      if (response != null) {
        return (res = { data: "success", status: STATUSCODES.SUCCESS });
      } else {
        return (res = {
          data: "date setting failed",
          status: STATUSCODES.UNPROCESSED,
        });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: ERRORMSG.INTSERERR, status: STATUSCODES.ERROR });
  }
};
//#endregion
