/** @format */

//created on 30-04-22
//#region headers

const {
  STATUSCODES,
  ROLES,
  PAYMENTTYPES,
  PREFIXES,
  CREDITSTATUS,
  LOG,
} = require("../Model/enums");
const conn = require("../../userDbConn");
const cusService = require("../Routes/customerRoute.js");
const {
  isEmpty,
  prescisedateconvert,
  isObjectId,
  checkIfNullOrUndefined,
  generateUuid,
} = require("./commonRoutes");
//#endregion

//#region methods

//added on 30-04-22
module.exports.viewCreditByCustomerId = async (req) => {
  const { creditModel } = conn.payment(process.env.db);
  try {
    let res = {};
    let rslist = [];
    let creditList = await creditModel.find({
      cus_id: req.body.cus_id,
    });
    let totalCredit = 0;
    if (Array.isArray(creditList) && creditList.length > 0) {
      for (let creditList = 0; creditList < array.length; creditList++) {
        const element = array[creditList];
        element.totalCredit = totalCredit + element.balance;
        rslist.push(element);
      }
      res = { data: rslist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 30-04-22
module.exports.addwallet = async (req) => {
  const { walletModel } = conn.payment(process.env.db);
  try {
    let res = {};
    let transNo = 0;
    let walletCount = await walletModel.aggregate([
      {
        $sort: { transNo: -1 },
      },
    ]);
    if (walletCount.length > 0) {
      transNo = walletCount[0].transNo + 1;
    } else {
      transNo = 1;
    }
    let wallet = new walletModel({
      transNo: transNo,
      cus_id: req.cus_id,
      date: new Date(Date.now()).getTime(),
      adminId: req.decode.admin,
    });
    if (req.credit) {
      wallet.credit = req.credit;
      wallet.debit = 0;
    } else {
      wallet.debit = req.debit;
      wallet.credit = 0;
    }
    let data = await wallet.save();
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

//added on 05-05-22
module.exports.addPaymentLog = async (req) => {
  const { paymentModel } = conn.payment(process.env.db);
  try {
    let res = {};
    let newpayment = new paymentModel({
      invoiceNo: req.invoiceNo,
      cus_id: req.cus_id,
      paymentMethod: req.paymentMethod,
      date: req.date,
      totalAmount: req.totalAmount,
      branchId: req.branchId,
    });
    let data = await newpayment.save();
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

//added on 23-07-22
//edited on 05/07/23
module.exports.viewWallet = async (req) => {
  const { walletModel, walletLogModel } = conn.payment(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let str = {};
    if (req.body.branchId != null) str.branchId = req.body.branchId;
    if (req.body.cusId != null) str.cus_id = req.body.cusId;
    let wallets = await walletLogModel.find(str);
    if (wallets.length > 0) {
      let fromDate, toDate;
      if (req.body.fromDate != null)
        fromDate = new Date(req.body.fromDate).getTime();
      if (req.body.toDate != null) toDate = new Date(req.body.toDate).getTime();
      if (req.body.fromDate != null && req.body.toDate != null) {
        let arr = [];
        for (let i = 0; i < wallets.length; i++) {
          if (fromDate <= wallets[i].date && wallets[i].date <= toDate) {
            let customer = {};
            if (isObjectId(wallets[i].cus_id)) {
              customer = await customerModel.findOne({
                _id: wallets[i].cus_id,
              });
            } else {
              customer.name = "cash";
            }
            let credit = 0,
              debit = 0;
            if (wallets[i].amount < 0) debit = wallets[i].amount;
            else credit = wallets[i].amount;
            let data = {
              transNo: wallets[i].invoiceNo,
              cusId: "CUS" + customer.cusId,
              name: customer?.name,
              credit,
              debit,
              logDate: prescisedateconvert(wallets[i].date).split(" ")[0],
              branchId: wallets[i].branchId,
            };
            arr.push(data);
          }
        }
        if (arr.length > 0) {
          let branches = [];
          let total = 0,
            creditTotal = 0,
            debitTotal = 0;
          for (let i = 0; i < arr.length; i++) {
            branches.push(arr[i].branchId);
            if (arr[i].credit > 0) creditTotal = creditTotal + arr[i].credit;
            else if (arr[i].debit < 0) {
              debitTotal = debitTotal + arr[i].debit;
            }
          }
          let summary = {
            list: [],
            grandCreditTotal: 0,
            grandDebitTotal: 0,
          };
          if (req.body.isSummary) {
            if (str.branchId == undefined) {
              let branch = new Set(branches);
              let br = [...branch];
              let lis = [],
                grandCreditTotal = 0,
                grandDebitTotal = 0;
              for (let i = 0; i < br.length; i++) {
                let bran = await branchModel.findOne({ storeCode: br[i] });
                let brr = arr.filter((item) => item.branchId == br[i]);
                let cr = [];
                for (let j = 0; j < brr.length; j++) {
                  cr.push(brr[j].cusId);
                }
                let customers = new Set(cr);
                let custom = [...customers];
                let creditTotal = 0,
                  debitTotal = 0;
                let list = [];
                for (let l = 0; l < custom.length; l++) {
                  let cust = brr.filter((item) => item.cusId == custom[l]);
                  let credit = 0,
                    debit = 0,
                    cusData = {};
                  for (let k = 0; k < cust.length; k++) {
                    cusData.name = cust[k].name;
                    if (cust[k].credit > 0) credit = credit + cust[k].credit;
                    else if (cust[k].debit < 0) debit = debit + cust[k].debit;
                  }
                  cusData.cusId = custom[l];
                  cusData.credit = credit;
                  cusData.debit = -debit;
                  list.push(cusData);
                  cusData = {};
                  creditTotal = creditTotal + credit;
                  debitTotal = debitTotal + debit;
                }
                lis.push({
                  branchId: bran?.storeCode,
                  branchName: bran?.branchName,
                  list,
                  creditTotal,
                  debitTotal: -debitTotal,
                });
                grandCreditTotal = grandCreditTotal + creditTotal;
                grandDebitTotal = grandDebitTotal + debitTotal;
                creditTotal = 0;
                debitTotal = 0;
              }
              summary.list = lis;
              summary.grandCreditTotal = grandCreditTotal;
              summary.grandDebitTotal = -grandDebitTotal;
            } else {
              let lis = [],
                cr = [];
              let bran = await branchModel.findOne({
                storeCode: req.body.branchId,
              });
              for (let j = 0; j < arr.length; j++) {
                cr.push(arr[j].cusId);
              }
              let customers = new Set(cr);
              let custom = [...customers];
              let creditTotal = 0,
                debitTotal = 0;
              let list = [];
              for (let l = 0; l < custom.length; l++) {
                let cust = arr.filter((item) => item.cusId == custom[l]);
                let credit = 0,
                  debit = 0,
                  cusData = {};
                for (let k = 0; k < cust.length; k++) {
                  cusData.name = cust[k].name;
                  if (cust[k].credit > 0) credit = credit + cust[k].credit;
                  else if (cust[k].debit < 0) debit = debit + cust[k].debit;
                }

                cusData.cusId = custom[l];
                cusData.credit = credit;
                cusData.debit = -debit;
                list.push(cusData);
                cusData = {};
                creditTotal = creditTotal + credit;
                debitTotal = debitTotal + debit;
              }
              lis.push({
                branchId: bran?.storeCode,
                branchName: bran?.branchName,
                list,
                creditTotal,
                debitTotal: -debitTotal,
              });
              creditTotal = 0;
              debitTotal = 0;
              summary.list = lis;
            }
          }

          total = creditTotal - debitTotal;
          let list = {
            total,
            creditTotal,
            debitTotal: -debitTotal,
            list: arr,
            summary,
          };
          return (res = { data: list, status: STATUSCODES.SUCCESS });
        } else return (res = { data: [], status: STATUSCODES.NOTFOUND });
      } else if (req.body.fromDate != null && req.body.toDate == null) {
        let arr = [];
        for (let i = 0; i < wallets.length; i++) {
          if (fromDate <= wallets[i].date) {
            let customer = {};
            if (isObjectId(wallets[i].cus_id)) {
              customer = await customerModel.findOne({
                _id: wallets[i].cus_id,
              });
            } else {
              customer.name = "cash";
            }
            let credit = 0,
              debit = 0;
            if (wallets[i].amount < 0) debit = wallets[i].amount;
            else credit = wallets[i].amount;
            let data = {
              transNo: wallets[i].invoiceNo,
              cusId: "CUS" + customer.cusId,
              name: customer?.name,
              credit,
              debit,
              logDate: prescisedateconvert(wallets[i].date).split(" ")[0],
              branchId: wallets[i].branchId,
            };
            arr.push(data);
          }
        }

        if (arr.length > 0) {
          let branches = [];
          let total = 0,
            creditTotal = 0,
            debitTotal = 0;
          for (let i = 0; i < arr.length; i++) {
            branches.push(arr[i].branchId);
            if (arr[i].credit > 0) creditTotal = creditTotal + arr[i].credit;
            else if (arr[i].debit < 0) {
              debitTotal = debitTotal + arr[i].debit;
            }
          }
          let summary = {
            list: [],
            grandCreditTotal: 0,
            grandDebitTotal: 0,
          };
          if (req.body.isSummary) {
            if (str.branchId == undefined) {
              let branch = new Set(branches);
              let br = [...branch];
              let lis = [],
                grandCreditTotal = 0,
                grandDebitTotal = 0;
              for (let i = 0; i < br.length; i++) {
                let bran = await branchModel.findOne({ storeCode: br[i] });
                let brr = arr.filter((item) => item.branchId == br[i]);
                let cr = [];
                for (let j = 0; j < brr.length; j++) {
                  cr.push(brr[j].cusId);
                }
                let customers = new Set(cr);
                let custom = [...customers];
                let creditTotal = 0,
                  debitTotal = 0;
                let list = [];
                for (let l = 0; l < custom.length; l++) {
                  let cust = brr.filter((item) => item.cusId == custom[l]);
                  let credit = 0,
                    debit = 0,
                    cusData = {};
                  for (let k = 0; k < cust.length; k++) {
                    cusData.name = cust[k].name;
                    if (cust[k].credit > 0) credit = credit + cust[k].credit;
                    else if (cust[k].debit < 0) debit = debit + cust[k].debit;
                  }

                  cusData.cusId = custom[l];
                  cusData.credit = credit;
                  cusData.debit = -debit;
                  list.push(cusData);
                  cusData = {};
                  creditTotal = creditTotal + credit;
                  debitTotal = debitTotal + debit;
                }
                lis.push({
                  branchId: bran?.storeCode,
                  branchName: bran?.branchName,
                  list,
                  creditTotal,
                  debitTotal: -debitTotal,
                });
                grandCreditTotal = grandCreditTotal + creditTotal;
                grandDebitTotal = grandDebitTotal + debitTotal;
                creditTotal = 0;
                debitTotal = 0;
              }
              summary.list = lis;
              summary.grandCreditTotal = grandCreditTotal;
              summary.grandDebitTotal = -grandDebitTotal;
            } else {
              let lis = [],
                cr = [];
              let bran = await branchModel.findOne({
                storeCode: req.body.branchId,
              });
              for (let j = 0; j < arr.length; j++) {
                cr.push(arr[j].cusId);
              }

              let customers = new Set(cr);
              let custom = [...customers];
              let creditTotal = 0,
                debitTotal = 0;
              let list = [];
              for (let l = 0; l < custom.length; l++) {
                let cust = arr.filter((item) => item.cusId == custom[l]);
                let credit = 0,
                  debit = 0,
                  cusData = {};
                for (let k = 0; k < cust.length; k++) {
                  cusData.name = cust[k].name;
                  if (cust[k].credit > 0) credit = credit + cust[k].credit;
                  else if (cust[k].debit < 0) debit = debit + cust[k].debit;
                }

                cusData.cusId = custom[l];
                cusData.credit = credit;
                cusData.debit = -debit;
                list.push(cusData);
                cusData = {};
                creditTotal = creditTotal + credit;
                debitTotal = debitTotal + debit;
              }
              lis.push({
                branchId: bran?.storeCode,
                branchName: bran?.branchName,
                list,
                creditTotal,
                debitTotal: -debitTotal,
              });
              creditTotal = 0;
              debitTotal = 0;
              summary.list = lis;
            }
          }

          total = creditTotal - debitTotal;
          let list = {
            total,
            creditTotal,
            debitTotal: -debitTotal,
            list: arr,
            summary,
          };
          return (res = { data: list, status: STATUSCODES.SUCCESS });
        } else return (res = { data: [], status: STATUSCODES.NOTFOUND });
      } else if (req.body.fromDate == null && req.body.toDate != null) {
        let arr = [];
        for (let i = 0; i < wallets.length; i++) {
          if (wallets[i].date <= toDate) {
            let customer = {};
            if (isObjectId(wallets[i].cus_id)) {
              customer = await customerModel.findOne({
                _id: wallets[i].cus_id,
              });
            } else {
              customer.name = "cash";
            }
            let credit = 0,
              debit = 0;
            if (wallets[i].amount < 0) debit = wallets[i].amount;
            else credit = wallets[i].amount;
            let data = {
              transNo: wallets[i].invoiceNo,
              cusId: "CUS" + customer.cusId,
              name: customer?.name,
              credit,
              debit,
              logDate: prescisedateconvert(wallets[i].date).split(" ")[0],
              branchId: wallets[i].branchId,
            };
            arr.push(data);
          }
        }

        if (arr.length > 0) {
          let branches = [];
          let total = 0,
            creditTotal = 0,
            debitTotal = 0;
          for (let i = 0; i < arr.length; i++) {
            branches.push(arr[i].branchId);
            if (arr[i].credit > 0) creditTotal = creditTotal + arr[i].credit;
            else if (arr[i].debit < 0) {
              debitTotal = debitTotal + arr[i].debit;
            }
          }
          let summary = {
            list: [],
            grandCreditTotal: 0,
            grandDebitTotal: 0,
          };
          if (req.body.isSummary) {
            if (str.branchId == undefined) {
              let branch = new Set(branches);
              let br = [...branch];
              let lis = [],
                grandCreditTotal = 0,
                grandDebitTotal = 0;
              for (let i = 0; i < br.length; i++) {
                let bran = await branchModel.findOne({ storeCode: br[i] });
                let brr = arr.filter((item) => item.branchId == br[i]);
                let cr = [];
                for (let j = 0; j < brr.length; j++) {
                  cr.push(brr[j].cusId);
                }
                let customers = new Set(cr);
                let custom = [...customers];
                let creditTotal = 0,
                  debitTotal = 0;
                let list = [];
                for (let l = 0; l < custom.length; l++) {
                  let cust = brr.filter((item) => item.cusId == custom[l]);
                  let credit = 0,
                    debit = 0,
                    cusData = {};
                  for (let k = 0; k < cust.length; k++) {
                    cusData.name = cust[k].name;
                    if (cust[k].credit > 0) credit = credit + cust[k].credit;
                    else if (cust[k].debit < 0) debit = debit + cust[k].debit;
                  }

                  cusData.cusId = custom[l];
                  cusData.credit = credit;
                  cusData.debit = -debit;
                  list.push(cusData);
                  cusData = {};
                  creditTotal = creditTotal + credit;
                  debitTotal = debitTotal + debit;
                }
                lis.push({
                  branchId: bran?.storeCode,
                  branchName: bran?.branchName,
                  list,
                  creditTotal,
                  debitTotal: -debitTotal,
                });
                grandCreditTotal = grandCreditTotal + creditTotal;
                grandDebitTotal = grandDebitTotal + debitTotal;
                creditTotal = 0;
                debitTotal = 0;
              }
              summary.list = lis;
              summary.grandCreditTotal = grandCreditTotal;
              summary.grandDebitTotal = -grandDebitTotal;
            } else {
              let lis = [],
                cr = [];
              let bran = await branchModel.findOne({
                storeCode: req.body.branchId,
              });
              for (let j = 0; j < arr.length; j++) {
                cr.push(arr[j].cusId);
              }

              let customers = new Set(cr);
              let custom = [...customers];
              let creditTotal = 0,
                debitTotal = 0;
              let list = [];
              for (let l = 0; l < custom.length; l++) {
                let cust = arr.filter((item) => item.cusId == custom[l]);
                let credit = 0,
                  debit = 0,
                  cusData = {};
                for (let k = 0; k < cust.length; k++) {
                  cusData.name = cust[k].name;
                  if (cust[k].credit > 0) credit = credit + cust[k].credit;
                  else if (cust[k].debit < 0) debit = debit + cust[k].debit;
                }

                cusData.cusId = custom[l];
                cusData.credit = credit;
                cusData.debit = -debit;
                list.push(cusData);
                cusData = {};
                creditTotal = creditTotal + credit;
                debitTotal = debitTotal + debit;
              }
              lis.push({
                branchId: bran?.storeCode,
                branchName: bran?.branchName,
                list,
                creditTotal,
                debitTotal: -debitTotal,
              });
              creditTotal = 0;
              debitTotal = 0;
              summary.list = lis;
            }
          }

          total = creditTotal - debitTotal;
          let list = {
            total,
            creditTotal,
            debitTotal: -debitTotal,
            list: arr,
            summary,
          };
          return (res = { data: list, status: STATUSCODES.SUCCESS });
        } else return (res = { data: [], status: STATUSCODES.NOTFOUND });
      } else if (req.body.fromDate == null && req.body.toDate == null) {
        let arr = [];
        for (let i = 0; i < wallets.length; i++) {
          let customer = {};
          if (isObjectId(wallets[i].cus_id)) {
            customer = await customerModel.findOne({
              _id: wallets[i].cus_id,
            });
          } else {
            customer.name = "cash";
          }
          let credit = 0,
            debit = 0;
          if (wallets[i].amount < 0) debit = wallets[i].amount;
          else credit = wallets[i].amount;
          let data = {
            transNo: wallets[i].invoiceNo,
            cusId: "CUS" + customer?.cusId,
            name: customer?.name,
            credit,
            debit,
            logDate: prescisedateconvert(wallets[i].date).split(" ")[0],
            branchId: wallets[i].branchId,
          };
          arr.push(data);
        }

        if (arr.length > 0) {
          let branches = [];
          let total = 0,
            creditTotal = 0,
            debitTotal = 0;
          for (let i = 0; i < arr.length; i++) {
            branches.push(arr[i].branchId);
            if (arr[i].credit > 0) creditTotal = creditTotal + arr[i].credit;
            else if (arr[i].debit < 0) {
              debitTotal = debitTotal + arr[i].debit;
            }
          }
          let summary = {
            list: [],
            grandCreditTotal: 0,
            grandDebitTotal: 0,
          };
          if (req.body.isSummary) {
            if (str.branchId == undefined) {
              let branch = new Set(branches);
              let br = [...branch];
              let lis = [],
                grandCreditTotal = 0,
                grandDebitTotal = 0;
              for (let i = 0; i < br.length; i++) {
                let bran = await branchModel.findOne({ storeCode: br[i] });
                let brr = arr.filter((item) => item.branchId == br[i]);
                let cr = [];
                for (let j = 0; j < brr.length; j++) {
                  cr.push(brr[j].cusId);
                }
                let customers = new Set(cr);
                let custom = [...customers];
                let creditTotal = 0,
                  debitTotal = 0;
                let list = [];
                for (let l = 0; l < custom.length; l++) {
                  let cust = brr.filter((item) => item.cusId == custom[l]);
                  let credit = 0,
                    debit = 0,
                    cusData = {};
                  for (let k = 0; k < cust.length; k++) {
                    cusData.name = cust[k].name;
                    if (cust[k].credit > 0) credit = credit + cust[k].credit;
                    else if (cust[k].debit < 0) debit = debit + cust[k].debit;
                  }

                  cusData.cusId = custom[l];
                  cusData.credit = credit;
                  cusData.debit = -debit;
                  list.push(cusData);
                  cusData = {};
                  creditTotal = creditTotal + credit;
                  debitTotal = debitTotal + debit;
                }
                lis.push({
                  branchId: bran?.storeCode,
                  branchName: bran?.branchName,
                  list,
                  creditTotal,
                  debitTotal: -debitTotal,
                });
                grandCreditTotal = grandCreditTotal + creditTotal;
                grandDebitTotal = grandDebitTotal + debitTotal;
                creditTotal = 0;
                debitTotal = 0;
              }
              summary.list = lis;
              summary.grandCreditTotal = grandCreditTotal;
              summary.grandDebitTotal = -grandDebitTotal;
            } else {
              let lis = [],
                cr = [];
              let bran = await branchModel.findOne({
                storeCode: req.body.branchId,
              });
              for (let j = 0; j < arr.length; j++) {
                cr.push(arr[j].cusId);
              }

              let customers = new Set(cr);
              let custom = [...customers];
              let creditTotal = 0,
                debitTotal = 0;
              let list = [];
              for (let l = 0; l < custom.length; l++) {
                let cust = arr.filter((item) => item.cusId == custom[l]);
                let credit = 0,
                  debit = 0,
                  cusData = {};
                for (let k = 0; k < cust.length; k++) {
                  cusData.name = cust[k].name;
                  if (cust[k].credit > 0) credit = credit + cust[k].credit;
                  else if (cust[k].debit < 0) debit = debit + cust[k].debit;
                }

                cusData.cusId = custom[l];
                cusData.credit = credit;
                cusData.debit = -debit;
                list.push(cusData);
                cusData = {};
                creditTotal = creditTotal + credit;
                debitTotal = debitTotal + debit;
              }
              lis.push({
                branchId: bran?.storeCode,
                branchName: bran?.branchName,
                list,
                creditTotal,
                debitTotal: -debitTotal,
              });
              creditTotal = 0;
              debitTotal = 0;
              summary.list = lis;
            }
          }

          total = creditTotal - debitTotal;
          let list = {
            total,
            creditTotal,
            debitTotal: -debitTotal,
            list: arr,
            summary,
          };
          return (res = { data: list, status: STATUSCODES.SUCCESS });
        } else return (res = { data: [], status: STATUSCODES.NOTFOUND });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//added on 07-07-23
module.exports.paymentchangetocashcard = async (req) => {
  try {
    const { logModel } = conn.settings(req.decode.db);
    const { paymentModel } = conn.payment(req.decode.db);
    let paymentExist = await paymentModel.findOne({ purchasePk: req.body._id });
    if (!isEmpty(paymentExist)) {
      for (let i = 0; i < req.body.paymentMethod.length; i++) {
        const element = req.body.paymentMethod[i];
        let payobj = paymentExist.paymentMethod.find(
          (x) => x.uuid == element.uuid
        );
        if (!isEmpty(payobj)) {
          payobj.paidAmount = element.paidAmount;
          if (
            element.type.toLowerCase() == PAYMENTTYPES.CARD.toLocaleLowerCase()
          ) {
            payobj.vendor = element.vendor;
            payobj.type = PAYMENTTYPES.CARD;
          }
          if (
            element.type.toLowerCase() == PAYMENTTYPES.CASH.toLocaleLowerCase()
          ) {
            payobj.type = PAYMENTTYPES.CASH;
            payobj.vendor = null;
          }
          if (
            element.type.toLowerCase() == PAYMENTTYPES.UPIS.toLocaleLowerCase()
          ) {
            payobj.vendor = element.vendor;
            payobj.type = PAYMENTTYPES.UPIS;
          }
        }
      }
      let data = await paymentModel.findOneAndUpdate(
        { _id: paymentExist._id },
        { $set: { paymentMethod: paymentExist.paymentMethod } },
        { returnDocument: "after" }
      );
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.PAYMENT_CASH_CARD_EDIT.type,
          description: LOG.PAYMENT_CASH_CARD_EDIT.description,
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
        res = {
          data: { msg: "Cannot update data" },
          status: STATUSCODES.UNPROCESSED,
        };
      }
    } else {
      res = {
        data: { msg: "no payment for this order" },
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 08-07-23
module.exports.fetchPayments = async (req) => {
  const { paymentModel } = conn.payment(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { orderModel } = conn.order(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  try {
    let rslist = [];
    let paymentExist = await paymentModel.find({});
    for (let i = 0; i < paymentExist.length; i++) {
      const element = paymentExist[i];
      element.paymentMethod.map((x) => {
        if (x.uuid == undefined) {
          x.uuid = generateUuid();
        }
        if (x.type.toLowerCase() == PAYMENTTYPES.CASH.toLocaleLowerCase()) {
          x.type = PAYMENTTYPES.CASH;
        }
        if (x.type.toLowerCase() == PAYMENTTYPES.CARD.toLocaleLowerCase()) {
          x.type = PAYMENTTYPES.CARD;
        }
      });
      await paymentModel.findOneAndUpdate(
        { _id: element._id },
        { $set: { paymentMethod: element.paymentMethod } },
        { returnDocument: "after" }
      );
    }
    let branch = await branchModel.findOne({ storeCode: req.body.branchId });
    if (req.body.branchId != null) {
      paymentExist = paymentExist.filter(
        (x) => x.branchId == req.body.branchId || x.branchId == branch?._id
      );
    }
    req.body.type = parseInt(req.body.type);
    if (req.body.type == 0) {
      paymentExist = paymentExist.filter((x) =>
        x.invoiceNo?.includes(PREFIXES.SALESINV)
      );
    }
    // if (req.body.type == 0) {
    //   paymentExist = paymentExist.filter((x) =>
    //     x.invoiceNo?.includes(PREFIXES.WORKORDER)
    //   );
    // }
    //  else if (req.body.type == 1) {
    //   paymentExist = paymentExist.filter((x) =>
    //     x.invoiceNo?.includes(PREFIXES.ALTERATION)
    //   );
    // } else if (req.body.type == 2) {
    //   paymentExist = paymentExist.filter((x) =>
    //     x.invoiceNo?.includes(PREFIXES.SALESINV)
    //   );
    // }
    if (req.body.purchasePk) {
      paymentExist = paymentExist.filter(
        (x) => x.purchasePk == req.body.purchasePk
      );
    }
    if (Array.isArray(paymentExist) && paymentExist.length > 0) {
      for (let i = 0; i < paymentExist.length; i++) {
        const element = paymentExist[i];

        let resobj = {};
        resobj.orderId = element.invoiceNo;
        resobj.date = prescisedateconvert(element.date).split(" ")[0];
        let customerExist = {};
        if (isObjectId(element.cus_id)) {
          customerExist = await customerModel.findOne({ _id: element.cus_id });
        }

        resobj.customerName = !isEmpty(customerExist)
          ? customerExist.name
          : element.cus_id == "cash"
          ? element.cus_id
          : "no customer name";
        let locationExist = {};
        if (!isObjectId(element.branchId)) {
          locationExist = await branchModel.findOne({
            storeCode: element.branchId,
          });
        } else {
          locationExist = await branchModel.findOne({
            _id: element.branchId,
          });
        }
        if (resobj?.orderId?.includes(PREFIXES.SALESINV)) {
          resobj.orderId = locationExist.storeCode.substr(3) + resobj.orderId;
        }
        resobj.location = !isEmpty(locationExist)
          ? locationExist.branchName
          : "No branchName";
        resobj.amount = element.totalAmount;
        resobj.purchasePk = element.purchasePk;
        resobj.paymentMethod = element.paymentMethod;
        resobj.paidAmount = 0;
        element.paymentMethod.map(
          (x) => (resobj.paidAmount = resobj.paidAmount + x.paidAmount)
        );
        let returnAmount = 0;
        if (element.returnLog.length > 0) {
          for (let i = 0; i < element.returnLog.length; i++) {
            returnAmount = returnAmount + element.returnLog[i].returnAmount;
          }
        }
        resobj.paidAmount = resobj.paidAmount - returnAmount;
        resobj.discount = 0;
        resobj.deliveryDiscount = 0;
        resobj.balance = resobj.amount - resobj.paidAmount;
        resobj.list = [];
        resobj.shipmentCharge = 0;
        resobj.orderType = 3;
        if (resobj?.orderId?.includes(PREFIXES.SALESINV)) {
          let orderExist = await orderModel.findOne({
            _id: element.purchasePk,
          });
          if (!isEmpty(orderExist)) {
            resobj.orderType = 1;
            resobj.discount = orderExist.discount;
            resobj.shipmentCharge = orderExist.shipmentCharge;
            if (
              Array.isArray(orderExist.orderInfo) &&
              orderExist.orderInfo.length > 0
            ) {
              for (let n = 0; n < orderExist.orderInfo.length; n++) {
                let qty;
                if (orderExist.orderInfo[n].returnQty != undefined) {
                  qty =
                    orderExist.orderInfo[n].quantity -
                    orderExist.orderInfo[n].returnQty;
                } else {
                  qty = orderExist.orderInfo[n].quantity;
                }
                if (qty != 0) {
                  resobj.list.push({
                    productItemId: orderExist.orderInfo[n].itemInfo,
                    qty,
                    itemRate: orderExist.orderInfo[n].rate,
                    amount:
                      orderExist.orderInfo[n].quantity *
                      orderExist.orderInfo[n].rate,
                    status: orderExist.status,
                    type: orderExist.orderInfo[n].type,
                    _uuid: orderExist.orderInfo[n].uuid,
                  });
                }
              }
            }
          }
        }
        rslist.push(resobj);
      }
      rslist.map((x) => {
        if (x.paymentMethod.length > 0) {
          x.paymentMethod.map((y) => (y.date = new Date(y.date).getTime()));
        }
      });
      if (checkIfNullOrUndefined(req.body.fromDate, req.body.endDate)) {
        for (let i = 0; i < rslist.length; i++) {
          const element = rslist[i];
          let new_list = [];
          element.paymentMethod.some((item) => {
            if (
              new Date(item.date).getTime() >=
                new Date(req.body.fromDate).getTime() &&
              new Date(item.date).getTime() <=
                new Date(req.body.endDate).getTime()
            ) {
              new_list.push(item);
            }
          });

          element.paymentMethod = new_list;
        }
        rslist = rslist.filter((x) => x.paymentMethod.length > 0);
      }
      rslist.map((x) => {
        if (x.paymentMethod.length > 0) {
          x.paymentMethod.map(
            (y) => (y.date = prescisedateconvert(y.date).split(" ")[0])
          );
        }
      });
      await Promise.all(
        rslist.map(async (x) => {
          if (Array.isArray(x.list) && x.list.length > 0) {
            for (let i = 0; i < x.list.length; i++) {
              const element = x.list[i];

              let prod = {};
              if (isObjectId(element.productItemId)) {
                // if (element.type == 0) {
                if (element) {
                  prod = await foodModel.findOne({
                    _id: element.productItemId,
                  });
                }

                //  else if (element.type == 1) {
                //   prod = await accessoryProductModel.findOne({
                //     _id: element.productItemId,
                //   });
                // } else if (element.type == 2) {
                //   prod = await productMaterialModel.findOne({
                //     _id: element.productItemId,
                //   });
                // }
              }
              element.productName = "no name";
              if (!isEmpty(prod)) {
                element.productName = prod.prod_name;
              }
            }
          }
        })
      );
      res = { data: rslist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 10/07/23
module.exports.editUtilityPayment = async (req) => {
  const { paymentModel, creditModel } = conn.payment(req.decode.db);
  const { orderModel } = conn.order(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let payment = null;
    if (req.body.type == 0) {
      let order = await orderModel.findOne({ _id: req.body.orderId });
      payment = await paymentModel.findOne({ purchasePk: req.body.orderId });
      let credit = await creditModel.findOne({ purchasePk: req.body.orderId });
      if (order) {
        if (req.body.productList != null && req.body.productList.length > 0) {
          for (let i = 0; i < req.body.productList.length; i++) {
            let item = order.orderInfo.find(
              (x) => x.uuid == req.body.productList[i].uuid
            );
            let itemIndex = order.orderInfo.findIndex(
              (x) => x.uuid == req.body.productList[i].uuid
            );
            if (item != undefined) {
              item.rate = req.body.productList[i].itemRate;
              order.orderInfo[itemIndex] = item;
            }
          }
          await orderModel.findOneAndUpdate(
            { _id: order._id },
            {
              $set: {
                orderInfo: order.orderInfo,
                totalAmount: req.body.total + req.body.shipmentCharge,
                shipmentCharge: req.body.shipmentCharge,
                discount: req.body.discount,
              },
            },
            { new: true }
          );
        }
        if (payment) {
          if (payment.editPaymentLog) {
            payment.editPaymentLog.push({
              oldPayment: payment.paymentMethod,
              newPayment: req.body.paymentMethod,
              editDate: req.body.editDate,
            });
          } else {
            payment.editPaymentLog = [];
            payment.editPaymentLog.push({
              oldPayment: payment.paymentMethod,
              newPayment: req.body.paymentMethod,
              editDate: req.body.editDate,
            });
          }
          payment.paymentMethod = req.body.paymentMethod;
          payment.totalAmount =
            req.body.total + req.body.shipmentCharge - req.body.discount;
          await payment.save();
        }
        if (credit) {
          credit.balance = req.body.balance;
          credit.discount = req.body.discount;
          credit.netAmount = req.body.total + req.body.shipmentCharge;
          if (req.body.balance == 0) credit.status = CREDITSTATUS.COM;
          await credit.save();
        }
        if (credit == null && req.body.balance > 0) {
          let cred = creditModel({
            purchaseId: "ORD" + order.orderId,
            supplierId: order.cus_id,
            purchaseDate: new Date(req.body.editDate).getTime(),
            netAmount: req.body.total + req.body.shipmentCharge,
            discount: req.body.discount,
            paidAmount: req.body.paidAmount,
            lastPaidDate: new Date(req.body.editDate).getTime(),
            balance: req.body.balance,
            status: CREDITSTATUS.PEN,
            isPurchase: false,
            branchId: order.branchId,
            purchasePk: order._id,
          });
          await cred.save();
          let newlog = new logModel({
            date: new Date().getTime(),
            emp_id: req.decode._id,
            type: LOG.FOODMANAGEMENT_UTILITY_EDIT.type,
            description: LOG.FOODMANAGEMENT_UTILITY_EDIT.description,
            branchId: data.branchId,
            link: {},
            payload: { token: req.headers.authorization, body: req.body },
          });
          let logresponse = await newlog.save();
          if (logresponse == null) {
            console.log("log save faild");
          }
        }
      } else {
        return (res = {
          data: { msg: "not found" },
          status: STATUSCODES.NOTFOUND,
        });
      }
    }
    if (payment) return (res = { data: payment, status: STATUSCODES.SUCCESS });
    else
      return (res = {
        data: { msg: "unprocessed" },
        status: STATUSCODES.UNPROCESSED,
      });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// module.exports.addcommissioninPayment=async(req)=>{
//   const{paymentModel}=conn.payment(req.decode.db)
//   try {
//     let paymentExist=await paymentModel.find({})
//    if (paymentExist) {
//     if (Array.isArray(paymentExist)&&paymentExist.length>0) {
//       for (let i = 0; i < paymentExist.length; i++) {
//         const element = paymentExist[i];
//         if (Array.isArray(element.paymentMethod)&&element.paymentMethod.length>0) {
//             for (let j = 0; j < element.paymentMethod.length; j++) {
//               const element1 = element.paymentMethod[j];
             
//             } 
//         }
//       }
      
//     } else {
      
//     }
//    } else {
    
//    }
//   } catch (e) {
//     return res={data:e,status:STATUSCODES.ERROR}
//   }
// }
//#endregion
