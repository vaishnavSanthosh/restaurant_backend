//#region headers
const { STATUSCODES, LOG, API, URL, PREFIXES } = require("../Model/enums");
const {
  prescisedateconvert,
  checkIfNullOrUndefined,
  checkObject,
  isEmpty,
  isObjectId,
} = require("./commonRoutes");
const settings_service = require("./settingsRoutes");
require("dotenv").config({ path: "../../.env" });
const conn = require("../../userDbConn");
//#endregion

//#region methods
//edited on 01-06-22
module.exports.addSupplier = async (req) => {
  const supplierModel = conn.supplier(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let supplierExist = await supplierModel.findOne({
      emailAddress: req.body.emailAddress,
      mobile: req.body.mobile,
    });

    if (!checkObject(supplierExist)) {
      let supplier = new supplierModel({
        supplierName: req.body.supplierName.toLowerCase(),
        emailAddress: req.body.emailAddress,
        creditLimit: req.body.creditLimit,
        country: req.body.country,
        stateCode: req.body.statecode,
        address: req.body.address,
        mobile: req.body.mobile,
        currency: req.body.currency,
        gstIn: req.body.gstIn,
        state: req.body.state,
        openingBalance: req.body.openingBalance, //edited on 15-11-22 -> opening balance field made to request based
        bankName: req.body.bankName,
        accountNo: req.body.accountNo,
        ifscCode: req.body.ifscCode,
        status: true,
      });
      let supplist = await supplierModel.find({});
      if (supplist.length > 0) {
        supplier.spId = supplist[supplist.length - 1].spId + 1;
      } else {
        supplier.spId = 1;
      }
      let data = await supplier.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = {
          data: { msg: "Data base error" },
          status: STATUSCODES.UNPROCESSED,
        };
      }
    } else {
      res = {
        data: { msg: "Supplier Exist With This Mobile And Email" },
        status: STATUSCODES.CONFLICT,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 01-06-22
module.exports.viewSupplier = async (req) => {
  const supplierModel = conn.supplier(req.decode.db);
  try {
    req.body.index=parseInt(req.body.index)*20
    let res = {};                                                                           
    let supp_list = await supplierModel.find({ status: true }).skip(req.body.index).limit(30)
    if (supp_list.length > 0) {
      res = { data: supp_list, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//edited on 12/06/23 added decode
module.exports.viewSupplierSingle = async (req) => {
  const supplierModel = conn.supplier(req.decode.db);
  try {
    let supp_single = await supplierModel.findOne({
      _id: req.body.supplierId,
    });
    if (supp_single) {
      return (res = { data: supp_single, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.editSupplier = async (req) => {
  const supplierModel = conn.supplier(req.decode.db);
  try {
    let supplierExist = await supplierModel.findOne({
      _id: req.body._id,
    });
    if (!isEmpty(supplierExist)) {
      supplierExist.supplierName = !req.body.supplierName
        ? supplierExist.supplierName
        : req.body.supplierName;
      supplierExist.emailAddress = !req.body.emailAddress
        ? supplierExist.emailAddress
        : req.body.emailAddress;
      supplierExist.creditLimit = !req.body.creditLimit
        ? supplierExist.creditLimit
        : req.body.creditLimit;
      supplierExist.country = !req.body.country
        ? supplierExist.country
        : req.body.country;
      supplierExist.stateCode = !req.body.stateCode
        ? supplierExist.stateCode
        : req.body.stateCode;
      supplierExist.address = !req.body.address
        ? supplierExist.address
        : req.body.address;
      supplierExist.mobile = !req.body.mobile
        ? supplierExist.mobile
        : req.body.mobile;
      supplierExist.currency = !req.body.currency
        ? supplierExist.currency
        : req.body.currency;
      supplierExist.gstIn = !req.body.gstIn
        ? supplierExist.gstIn
        : req.body.gstIn;
      supplierExist.state = !req.body.state
        ? supplierExist.state
        : req.body.state;
      supplierExist.bankName = !req.body.bankName
        ? supplierExist.bankName
        : req.body.bankName;
      supplierExist.accountNo = !req.body.accountNo
        ? supplierExist.accountNo
        : req.body.accountNo;
      supplierExist.ifscCode = !req.body.ifscCode
        ? supplierExist.ifscCode
        : req.body.ifscCode;
      let data = await supplierExist.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: { msg: `save failed` }, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = {
        data: { msg: `No Supplier Found With This Id` },
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 01-06-22
module.exports.deleteSupplier = async (req) => {
  const supplierModel = conn.supplier(req.decode.db);
  try {
    let supplierExist = await supplierModel.findOne({
      _id: req.body._id,
    });
    if (supplierExist) {
      supplierExist.status = false;
      let data = await supplierExist.save();
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

//added on 23-03-22
// edited on 24-03-22-> api completed on this date
//edited on 04-06-22
//assembled on 15-07-22
module.exports.supplierLedger = async (req) => {
  const { purchaseModel, purchasewopoModel } = conn.purchase(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  try {
    let res = {};
    let rslist = [];
    if (isObjectId(req.body.suppId)) {
      let purchaseList = await purchaseModel.find({
        supplierId: req.body.suppId,
      });
      let purchasewpoList = await purchasewopoModel.find({
        supplierId: req.body.suppId,
      });
      var newList = [];
      let supplierInfo = await supplierModel.findOne({
        _id: req.body.suppId,
      });

      let supplierName = !isEmpty(supplierInfo)
        ? supplierInfo.supplierName
        : "";
      let supplierAddress = !isEmpty(supplierInfo) ? supplierInfo.address : "";
      let suppliercontact = !isEmpty(supplierInfo) ? supplierInfo.mobile : "";
      let supplierOpeningBalance = !isEmpty(supplierInfo)
        ? supplierInfo.openingBalance
        : 0;
      if (checkIfNullOrUndefined(req.body.frmDate, req.body.toDate)) {
        purchaseList.some((x) => {
          if (
            x.purchaseDate >= new Date(req.body.frmDate).getTime() &&
            x.purchaseDate <= new Date(req.body.toDate).getTime()
          ) {
            newList.push(x);
          }
        });
        purchasewpoList.some((x) => {
          if (
            x.invoiceDate >= new Date(req.body.frmDate).getTime() &&
            x.invoiceDate <= new Date(req.body.toDate).getTime()
          ) {
            newList.push(x);
          }
        });
      }
      if (Array.isArray(newList) && newList.length > 0) {
        for (let i = 0; i < newList.length; i++) {
          const element = newList[i];
          
          let resobj = {};
          resobj.invoiceNo = element.purchaseID
            ? `${PREFIXES.PURCHASE + element.purchaseID}`
            : `${PREFIXES.PURCHASEWPO + element.transNo}`;
          resobj.date = prescisedateconvert(
            element.purchaseDate ? element.purchaseDate : element.invoiceDate
          );
          resobj.description = element.remarks
            ? element.remarks
            : "no description";
          if (resobj.invoiceNo.includes(PREFIXES.PURCHASE)) {
            resobj.paid = 0;
            resobj.balance =
              element.grandTotal 
          } else {
            resobj.paid = element.netAmount;
            resobj.balance =
              element.amount != element.netAmount
                ? element.amount - element.netAmount
                : 0;
          }
          console.log(resobj.balance,element.netAmount)
          resobj.credit = resobj.balance > 0 ? resobj.balance : 0;
          resobj.debit = resobj.balance == 0 ? resobj.balance : 0; //added on 30-06-22 -> new fields added today
          rslist.push(resobj);
        }
      }
      res = {
        data: {
          supplierName,
          supplierAddress,
          suppliercontact,
          supplierOpeningBalance, //added on 30-06-22 -> new field added  today
          rslist,
        },
        status: STATUSCODES.SUCCESS,
      };
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 21-06-23
module.exports.addcreditLimit = async (req) => {
  const { creditLimitModel } = conn.purchase(req.decode.db);
  try {
    let credit = new creditLimitModel({
      enterAmount: req.body.enterAmount,
      enterDays: req.body.enterDays,
    });
    let data = await credit.save();
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

// added on 16-09-22
module.exports.viewcreditLimit = async (req) => {
  const { creditLimitModel } = conn.purchase(req.decode.db);
  try {
    let creditList = await creditLimitModel.find({});

    if (Array.isArray(creditList) && creditList.length > 0) {
      res = { data: creditList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 17-09-22
module.exports.editcreditLimit = async (req) => {
  const { creditLimitModel } = conn.purchase(req.decode.db);
  try {
    let creditList = await creditLimitModel.findOne({ _id: req.body._id });
    if (!isEmpty(creditList)) {
      creditList.enterAmount = !req.body.enterAmount
        ? creditList.enterAmount
        : req.body.enterAmount;
      creditList.enterDays = !req.body.enterDays
        ? creditList.enterDays
        : req.body.enterDays;
      let data = await creditList.save();
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

//#endregion
