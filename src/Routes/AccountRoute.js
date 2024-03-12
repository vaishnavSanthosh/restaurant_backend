/** @format */

//#region headers
const { STATUSCODES, LOG, API, URL, ROLES } = require("../Model/enums");
const fs = require("fs");
require("dotenv").config({ path: "./.env" });
const conn = require("../../userDbConn");
const {
  isEmpty,
  createDirectory,
  checkObject,
  prescisedateconvert,
} = require("../Routes/commonRoutes");
//#endregion

//added on 11/08/23
module.exports.createLedger = async (req) => {
  const { ledgergroupModel } = conn.account(req.decode.db);
  try {
    let str = {};
    str.groupType = req.body.groupType;
    str.subCatogory = req.body.subCatogory;
    str.subSubcatogory = req.body.subSubcatogory;
    str.branchId = req.body.branchId;
    if (
      typeof req.body.fixed_asset_cat == "number" &&
      req.body.fixed_asset_cat > 0
    ) {
      str.fixed_asset_cat = req.body.fixed_asset_cat;
    }
    let ledgergroupExist = await ledgergroupModel.find(str);

    let newledgerCode;
    if (ledgergroupExist.length > 0) {
      newledgerCode =
        ledgergroupExist[ledgergroupExist.length - 1].ledgerCode + 1;
    } else {
      if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 100001;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 100101;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 3
      ) {
        newledgerCode = 100201;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 4
      ) {
        newledgerCode = 100301;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 5
      ) {
        newledgerCode = 100401; //input not used
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 6
      ) {
        newledgerCode = 110001;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 7
      ) {
        newledgerCode = 169001;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 8
      ) {
        newledgerCode = 190001;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 9
      ) {
        newledgerCode = 199001;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 1
      ) {
        if (req.body.fixed_asset_cat == 1) {
          newledgerCode = 170001;
        } else if (req.body.fixed_asset_cat == 2) {
          newledgerCode = 171001;
        } else if (req.body.fixed_asset_cat == 3) {
          newledgerCode = 172001;
        } else if (req.body.fixed_asset_cat == 4) {
          newledgerCode = 173001;
        } else if (req.body.fixed_asset_cat == 5) {
          newledgerCode = 174001;
        } else if (req.body.fixed_asset_cat == 6) {
          newledgerCode = 175001;
        } else if (req.body.fixed_asset_cat == 7) {
          newledgerCode = 176001;
        }
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 180001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 200001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 211001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 3
      ) {
        newledgerCode = 212001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 220001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 221001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 3
      ) {
        newledgerCode = 222001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 4
      ) {
        newledgerCode = 223001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 3 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 250001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 3 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 251001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 3 &&
        req.body.subSubcatogory == 3
      ) {
        newledgerCode = 252001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 3 &&
        req.body.subSubcatogory == 4
      ) {
        newledgerCode = 253001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 3 &&
        req.body.subSubcatogory == 5
      ) {
        newledgerCode = 257001; //input not used
      } else if (
        req.body.groupType == 3 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 300001;
      } else if (
        req.body.groupType == 3 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 390001;
      } else if (
        req.body.groupType == 3 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 350001;
      } else if (
        req.body.groupType == 4 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 400001;
      } else if (
        req.body.groupType == 4 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 430001;
      } else if (
        req.body.groupType == 4 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 450001;
      }
    }

    if (req.body.branchId != null || req.body.branchId != undefined) {
      let ledgerGroup = new ledgergroupModel({
        ledgerCode: newledgerCode,
        ledgerName: req.body.ledgerName,
        groupType: req.body.groupType,
        subCatogory: req.body.subCatogory,
        subSubcatogory: req.body.subSubcatogory,
        fixed_asset_cat: req.body.fixed_asset_cat,
        ledgerDetails: req.body.ledgerDetails,
        branchId: req.body.branchId,
      });
      let data = await ledgerGroup.save();
      if (data) {
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = {
          data: "not processed",
          status: STATUSCODES.UNPROCESSED,
        });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.BADREQUEST });
    }
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//added on 16/08/23
module.exports.generateLedgergroupCode = async (req) => {
  const { ledgergroupModel } = conn.account(req.decode.db);
  try {
    let str = {};
    str.groupType = req.body.groupType;
    str.subCatogory = req.body.subCatogory;
    str.subSubcatogory = req.body.subSubcatogory;
    str.branchId = req.body.branchId;
    if (
      typeof req.body.fixed_asset_cat == "number" &&
      req.body.fixed_asset_cat > 0
    ) {
      str.fixed_asset_cat = req.body.fixed_asset_cat;
    }
    let ledgergroupExist = await ledgergroupModel.find(str);

    let newledgerCode;
    if (ledgergroupExist.length > 0) {
      newledgerCode =
        ledgergroupExist[ledgergroupExist.length - 1].ledgerCode + 1;
    } else {
      if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 100001;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 100101;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 3
      ) {
        newledgerCode = 100201;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 4
      ) {
        newledgerCode = 100301;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 5
      ) {
        newledgerCode = 100401; //input not used
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 6
      ) {
        newledgerCode = 110001;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 7
      ) {
        newledgerCode = 169001;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 8
      ) {
        newledgerCode = 190001;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 9
      ) {
        newledgerCode = 199001;
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 1
      ) {
        if (req.body.fixed_asset_cat == 1) {
          newledgerCode = 170001;
        } else if (req.body.fixed_asset_cat == 2) {
          newledgerCode = 171001;
        } else if (req.body.fixed_asset_cat == 3) {
          newledgerCode = 172001;
        } else if (req.body.fixed_asset_cat == 4) {
          newledgerCode = 173001;
        } else if (req.body.fixed_asset_cat == 5) {
          newledgerCode = 174001;
        } else if (req.body.fixed_asset_cat == 6) {
          newledgerCode = 175001;
        } else if (req.body.fixed_asset_cat == 7) {
          newledgerCode = 176001;
        }
      } else if (
        req.body.groupType == 1 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 180001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 200001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 211001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 3
      ) {
        newledgerCode = 212001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 220001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 221001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 3
      ) {
        newledgerCode = 222001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 4
      ) {
        newledgerCode = 223001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 3 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 250001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 3 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 251001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 3 &&
        req.body.subSubcatogory == 3
      ) {
        newledgerCode = 252001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 3 &&
        req.body.subSubcatogory == 4
      ) {
        newledgerCode = 253001;
      } else if (
        req.body.groupType == 2 &&
        req.body.subCatogory == 3 &&
        req.body.subSubcatogory == 5
      ) {
        newledgerCode = 257001; //input not used
      } else if (
        req.body.groupType == 3 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 300001;
      } else if (
        req.body.groupType == 3 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 390001;
      } else if (
        req.body.groupType == 3 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 350001;
      } else if (
        req.body.groupType == 4 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 400001;
      } else if (
        req.body.groupType == 4 &&
        req.body.subCatogory == 1 &&
        req.body.subSubcatogory == 2
      ) {
        newledgerCode = 430001;
      } else if (
        req.body.groupType == 4 &&
        req.body.subCatogory == 2 &&
        req.body.subSubcatogory == 1
      ) {
        newledgerCode = 450001;
      }
    }
    return (res = { data: { newledgerCode }, status: STATUSCODES.SUCCESS });
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//added on 16/08/23
module.exports.chartOfaccounts = async (req) => {
  const { ledgergroupModel } = conn.account(req.decode.db);
  try {
    let resObj = [
      {
        accountName: "bank account",
        code: 100000,
        bankAccount: [],
      },
      {
        accountName: "cash in hand",
        code: 100100,
        cashInHand: [],
      },
      {
        accountName: "deposit asset",
        code: 100200,
        depositAsset: [],
      },
      {
        accountName: "loan And advance",
        code: 100300,
        loanAndAdvance: [],
      },
      {
        accountName: "stock In hand",
        code: 100400,
        stockInHand: [],
      },
      {
        accountName: "customers",
        code: 110000,
        customers: [],
      },
      {
        accountName: "current Asset",
        code: 169000,
        currentAsset: [],
      },
      {
        accountName: "misc expense Asset",
        code: 190000,
        miscExpenseAsset: [],
      },
      {
        accountName: "branch or division",
        code: 199000,
        branchDivision: [],
      },
      {
        accountName: "building",
        code: 170000,
        building: [],
      },
      {
        accountName: "computer And assosories",
        code: 171000,
        computerAndAssosories: [],
      },
      {
        accountName: "audio and Visual",
        code: 172000,
        audioVisual: [],
      },
      {
        accountName: "office Equipment",
        code: 173000,
        officeEquipment: [],
      },
      {
        accountName: "furniture And fixtures",
        code: 174000,
        furnitureAndFixtures: [],
      },
      {
        accountName: "vehicles",
        code: 175000,
        vehicles: [],
      },
      {
        accountName: "other Fixed asset",
        code: 176000,
        otherFixedAsset: [],
      },
      {
        accountName: "long Term investment",
        code: 180000,
        longTermInvest: [],
      },
      {
        accountName: "capital account",
        code: 200000,
        capitalAccount: [],
      },
      {
        accountName: "reserve And surplus",
        code: 211000,
        reserveAndSurplus: [],
      },
      {
        accountName: "retained Earnings",
        code: 212000,
        retainedEarnings: [],
      },
      {
        accountName: "current Liability",
        code: 220000,
        currentLiability: [],
      },
      {
        accountName: "duties And taxes",
        code: 221000,
        dutiesAndTaxes: [],
      },
      {
        accountName: "provision",
        code: 222000,
        provision: [],
      },
      {
        accountName: "suppliers",
        code: 223000,
        suppliers: [],
      },
      {
        accountName: "long term liability",
        code: 250000,
        longtermLiability: [],
      },
      {
        accountName: "bank OD",
        code: 251000,
        bankod: [],
      },
      {
        accountName: "secured Loans",
        code: 252000,
        securedLoans: [],
      },
      {
        accountName: "unsecured Loans",
        code: 253000,
        unsecuredLoans: [],
      },
      {
        accountName: "suspense Account",
        code: 257000,
        suspenseAccount: [],
      },
      {
        accountName: "direct Income",
        code: 300000,
        directIncome: [],
      },
      {
        accountName: "sales",
        code: 390000,
        sales: [],
      },
      {
        accountName: "indirect Income",
        code: 350000,
        indirectIncome: [],
      },
      {
        accountName: "direct Expense",
        code: 400000,
        directExpense: [],
      },
      {
        accountName: "cost Of goods Sold",
        code: 430000,
        costOfGoodsSold: [],
      },
      {
        accountName: "indirect Expense",
        code: 450000,
        indirectExpense: [],
      },
    ];

    let ledgerExist = await ledgergroupModel.find({
      branchId: req.body.branchId,
    });
    if (Array.isArray(ledgerExist) && ledgerExist.length > 0) {
      for (let i = 0; i < ledgerExist.length; i++) {
        let element = ledgerExist[i];

        if (element.groupType == 1) {
          element._doc["mainGroup"] = "Asset";
          if (element.subCatogory == 1) {
            element._doc["natureOfGroup"] = "current asset";
          } else if (element.subCatogory == 2) {
            element._doc["natureOfGroup"] = "fixed asset";
          }
        } else if (element.groupType == 2) {
          element._doc["mainGroup"] = "Equity & Liability";
          if (element.subCatogory == 1) {
            element._doc["natureOfGroup"] = "capital account";
          } else if (element.subCatogory == 2) {
            element._doc["natureOfGroup"] = "current liability";
          } else if (element.subCatogory == 3) {
            element._doc["natureOfGroup"] = "long term liability";
          }
        } else if (element.groupType == 3) {
          element._doc["mainGroup"] = "Income";
          if (element.subCatogory == 1) {
            element._doc["natureOfGroup"] = "direct income";
          } else if (element.subCatogory == 2) {
            element._doc["natureOfGroup"] = "indirect income";
          }
        } else if (element.groupType == 4) {
          element._doc["mainGroup"] = "Expense";
          if (element.subCatogory == 1) {
            element._doc["natureOfGroup"] = "direct expense";
          } else if (element.subCatogory == 2) {
            element._doc["natureOfGroup"] = "indirect expense";
          }
        }
        if (
          element.groupType == 1 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 1
        ) {
          resObj[0].bankAccount.push(element);
        } else if (
          element.groupType == 1 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 2
        ) {
          resObj[1].cashInHand.push(element);
        } else if (
          element.groupType == 1 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 3
        ) {
          resObj[2].depositAsset.push(element);
        } else if (
          element.groupType == 1 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 4
        ) {
          resObj[3].loanAndAdvance.push(element);
        } else if (
          element.groupType == 1 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 5
        ) {
          resObj[4].stockInHand.push(element);
        } else if (
          element.groupType == 1 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 6
        ) {
          resObj[5].customers.push(element);
        } else if (
          element.groupType == 1 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 7
        ) {
          resObj[6].currentAsset.push(element);
        } else if (
          element.groupType == 1 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 8
        ) {
          resObj[7].miscExpenseAsset.push(element);
        } else if (
          element.groupType == 1 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 9
        ) {
          resObj[8].branchDivision.push(element);
        } else if (
          element.groupType == 1 &&
          element.subCatogory == 2 &&
          element.subSubcatogory == 1
        ) {
          if (element.fixed_asset_cat == 1) {
            resObj[9].building.push(element);
          } else if (element.fixed_asset_cat == 2) {
            resObj[10].computerAndAssosories.push(element);
          } else if (element.fixed_asset_cat == 3) {
            resObj[11].audioVisual.push(element);
          } else if (element.fixed_asset_cat == 4) {
            resObj[12].officeEquipment.push(element);
          } else if (element.fixed_asset_cat == 5) {
            resObj[13].furnitureAndFixtures.push(element);
          } else if (element.fixed_asset_cat == 6) {
            resObj[14].vehicles.push(element);
          } else if (element.fixed_asset_cat == 7) {
            resObj[15].otherFixedAsset.push(element);
          }
        } else if (
          element.groupType == 1 &&
          element.subCatogory == 2 &&
          element.subSubcatogory == 2
        ) {
          resObj[16].longTermInvest.push(element);
        } else if (
          element.groupType == 2 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 1
        ) {
          resObj[17].capitalAccount.push(element);
        } else if (
          element.groupType == 2 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 2
        ) {
          resObj[18].reserveAndSurplus.push(element);
        } else if (
          element.groupType == 2 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 3
        ) {
          resObj[19].retainedEarnings.push(element);
        } else if (
          element.groupType == 2 &&
          element.subCatogory == 2 &&
          element.subSubcatogory == 1
        ) {
          resObj[20].currentLiability.push(element);
        } else if (
          element.groupType == 2 &&
          element.subCatogory == 2 &&
          element.subSubcatogory == 2
        ) {
          resObj[21].dutiesAndTaxes.push(element);
        } else if (
          element.groupType == 2 &&
          element.subCatogory == 2 &&
          element.subSubcatogory == 3
        ) {
          resObj[22].provision.push(element);
        } else if (
          element.groupType == 2 &&
          element.subCatogory == 2 &&
          element.subSubcatogory == 4
        ) {
          resObj[23].suppliers.push(element);
        } else if (
          element.groupType == 2 &&
          element.subCatogory == 3 &&
          element.subSubcatogory == 1
        ) {
          resObj[24].longtermLiability.push(element);
        } else if (
          element.groupType == 2 &&
          element.subCatogory == 3 &&
          element.subSubcatogory == 2
        ) {
          resObj[25].bankod.push(element);
        } else if (
          element.groupType == 2 &&
          element.subCatogory == 3 &&
          element.subSubcatogory == 3
        ) {
          resObj[26].securedLoans.push(element);
        } else if (
          element.groupType == 2 &&
          element.subCatogory == 3 &&
          element.subSubcatogory == 4
        ) {
          resObj[27].unsecuredLoans.push(element);
        } else if (
          element.groupType == 2 &&
          element.subCatogory == 3 &&
          element.subSubcatogory == 5
        ) {
          resObj[28].suspenseAccount.push(element);
        } else if (
          element.groupType == 3 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 1
        ) {
          resObj[29].directIncome.push(element);
        } else if (
          element.groupType == 3 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 2
        ) {
          resObj[30].sales.push(element);
        } else if (
          element.groupType == 3 &&
          element.subCatogory == 2 &&
          element.subSubcatogory == 1
        ) {
          resObj[31].indirectIncome.push(element);
        } else if (
          element.groupType == 4 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 1
        ) {
          resObj[32].directExpense.push(element);
        } else if (
          element.groupType == 4 &&
          element.subCatogory == 1 &&
          element.subSubcatogory == 2
        ) {
          resObj[33].costOfGoodsSold.push(element);
        } else if (
          element.groupType == 4 &&
          element.subCatogory == 2 &&
          element.subSubcatogory == 1
        ) {
          resObj[34].indirectExpense.push(element);
        }
      }
      return (res = { data: resObj, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//added on 16/08/23
module.exports.generateBankInvoiceNo = async (req) => {
  const { bankInvoiceModel } = conn.account(req.decode.db);
  try {
    if (req.body.branchId) {
      let foundInvoice = await bankInvoiceModel.find({
        branchId: req.body.branchId,
      });
      let newInvoiceNo;
      if (Array.isArray(foundInvoice) && foundInvoice.length > 0) {
        const lastInvoiceNumber =
          foundInvoice[foundInvoice.length - 1].invoiceNo;
        const numericPart = lastInvoiceNumber.match(/\d+/);
        const letterPrefix = lastInvoiceNumber.match(/[A-Za-z]+/);
        if (numericPart && letterPrefix) {
          const numericValue = parseInt(numericPart[0]);
          const prefixValue = letterPrefix[0];
          newInvoiceNo = prefixValue + (numericValue + 1);
        }
        return (res = { data: { newInvoiceNo }, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.SUCCESS });
      }
    } else {
      return (res = {
        data: "enter branch id",
        status: STATUSCODES.BADREQUEST,
      });
    }
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//added on 16/08/23
module.exports.createBankinvoice = async (req) => {
  const { bankInvoiceModel } = conn.account(req.decode.db);
  try {
    if (req.body) {
      let foundInvoice = await bankInvoiceModel.find({
        branchId: req.body.branchId,
      });
      let newInvoiceNo;
      if (Array.isArray(foundInvoice) && foundInvoice.length > 0) {
        const lastInvoiceNumber =
          foundInvoice[foundInvoice.length - 1].invoiceNo;
        const numericPart = lastInvoiceNumber.match(/\d+/);
        const letterPrefix = lastInvoiceNumber.match(/[A-Za-z]+/);
        if (numericPart && letterPrefix) {
          const numericValue = parseInt(numericPart[0]);
          const prefixValue = letterPrefix[0];
          newInvoiceNo = prefixValue + (numericValue + 1);
        }
      } else {
        if (req.body.invoiceNo != null || req.body.invoiceNo != undefined) {
          newInvoiceNo = req.body.invoiceNo;
        } else {
          return (res = {
            data: "invoice number is required for first invoice creation",
            status: STATUSCODES.BADREQUEST,
          });
        }
      }

      let newbankInvoice = new bankInvoiceModel({
        invoiceNo: newInvoiceNo,
        postingDate: new Date(req.body.postingDate).getTime(),
        currency: req.body.currency,
        refNo: req.body.refNo,
        remark: req.body.remark,
        debit_credit_details: req.body.debit_credit_details,
        branchId: req.body.branchId,
        isDraft: req.body.isDraft,
      });
      let data = await newbankInvoice.save();
      if (data) {
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.BADREQUEST });
    }
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//added on 17/08/23
module.exports.createApinvoice = async (req) => {
  const { aPinvoiceModel } = conn.account(req.decode.db);
  try {
    if (req.body) {
      let foundInvoice = await aPinvoiceModel.find({
        branchId: req.body.branchId,
      });
      let newInvoiceNo;
      if (Array.isArray(foundInvoice) && foundInvoice.length > 0) {
        const lastInvoiceNumber =
          foundInvoice[foundInvoice.length - 1].invoiceNo;
        const numericPart = lastInvoiceNumber.match(/\d+/);
        const letterPrefix = lastInvoiceNumber.match(/[A-Za-z]+/);
        if (numericPart && letterPrefix) {
          const numericValue = parseInt(numericPart[0]);
          const prefixValue = letterPrefix[0];
          newInvoiceNo = prefixValue + (numericValue + 1);
        }
      } else {
        if (req.body.invoiceNo != null || req.body.invoiceNo != undefined) {
          newInvoiceNo = req.body.invoiceNo;
        } else {
          return (res = {
            data: "invoice number is required for first invoice creation",
            status: STATUSCODES.BADREQUEST,
          });
        }
      }

      let newApInvoice = new aPinvoiceModel({
        invoiceNo: newInvoiceNo,
        postingDate: new Date(req.body.postingDate).getTime(),
        currency: req.body.currency,
        refNo: req.body.refNo,
        documentDate: req.body.documentDate,
        documentName: req.body.documentName,
        remark: req.body.remark,
        debit_credit_details: req.body.debit_credit_details,
        branchId: req.body.branchId,
        isDraft: req.body.isDraft,
      });
      let data = await newApInvoice.save();
      if (data) {
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.BADREQUEST });
    }
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//added on 17/08/23
module.exports.createArinvoice = async (req) => {
  const { aRinvoiceModel } = conn.account(req.decode.db);
  try {
    if (req.body) {
      let foundInvoice = await aRinvoiceModel.find({
        branchId: req.body.branchId,
      });
      let newInvoiceNo;
      if (Array.isArray(foundInvoice) && foundInvoice.length > 0) {
        const lastInvoiceNumber =
          foundInvoice[foundInvoice.length - 1].invoiceNo;
        const numericPart = lastInvoiceNumber.match(/\d+/);
        const letterPrefix = lastInvoiceNumber.match(/[A-Za-z]+/);
        if (numericPart && letterPrefix) {
          const numericValue = parseInt(numericPart[0]);
          const prefixValue = letterPrefix[0];
          newInvoiceNo = prefixValue + (numericValue + 1);
        }
      } else {
        if (req.body.invoiceNo != null || req.body.invoiceNo != undefined) {
          newInvoiceNo = req.body.invoiceNo;
        } else {
          return (res = {
            data: "invoice number is required for first invoice creation",
            status: STATUSCODES.BADREQUEST,
          });
        }
      }

      let newArInvoice = new aRinvoiceModel({
        invoiceNo: newInvoiceNo,
        postingDate: new Date(req.body.postingDate).getTime(),
        currency: req.body.currency,
        refNo: req.body.refNo,
        documentDate: req.body.documentDate,
        documentName: req.body.documentName,
        remark: req.body.remark,
        debit_credit_details: req.body.debit_credit_details,
        branchId: req.body.branchId,
        isDraft: req.body.isDraft,
      });
      let data = await newArInvoice.save();
      if (data) {
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.BADREQUEST });
    }
    return (res = { data: {}, status: STATUSCODES.SUCCESS });
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//added on 18/08/23
module.exports.createAccouninginvoice = async (req) => {
  const { purchaseAccountnginvoiceModel, ledgergroupModel } = conn.account(
    req.decode.db
  );
  try {
    let debitOrcreditData = req.body.debit_credit_details;
    // console.log(debitOrcreditData)
    if (req.body) {
      let foundInvoice = await purchaseAccountnginvoiceModel.find({
        branchId: req.body.branchId,
      });
      let newInvoiceNo;
      if (Array.isArray(foundInvoice) && foundInvoice.length > 0) {
        const lastInvoiceNumber =
          foundInvoice[foundInvoice.length - 1].invoiceNo;
        const numericPart = lastInvoiceNumber.match(/\d+/);
        const letterPrefix = lastInvoiceNumber.match(/[A-Za-z]+/);
        if (numericPart && letterPrefix) {
          const numericValue = parseInt(numericPart[0]);
          const prefixValue = letterPrefix[0];
          newInvoiceNo = prefixValue + (numericValue + 1);
        }
      } else {
        if (req.body.invoiceNo != null || req.body.invoiceNo != undefined) {
          newInvoiceNo = req.body.invoiceNo;
        } else {
          return (res = {
            data: "invoice number with prefix is required for first invoice creation",
            status: STATUSCODES.BADREQUEST,
          });
        }
      }
      // igst section start
      if (
        req.body.totalIgst !== null &&
        req.body.totalIgst !== undefined &&
        req.body.totalIgst > 0
      ) {
        let igstLedgerExist = await ledgergroupModel.findOne({
          groupType: 2,
          subCatogory: 2,
          subSubcatogory: 2,
          ledgerName: "IGST",
        });
        let igstTopush;
        if (igstLedgerExist != null || igstLedgerExist != undefined) {
          console.log("igst found");
          igstTopush = igstLedgerExist;
        } else {
          console.log("creating igst");
          let ledgergroupExist = await ledgergroupModel.find({
            groupType: 2,
            subCatogory: 2,
            subSubcatogory: 2,
          });

          let newledgerCode;
          if (Array.isArray(ledgergroupExist) && ledgergroupExist.length > 0) {
            newledgerCode =
              ledgergroupExist[ledgergroupExist.length - 1].ledgerCode + 1;
          } else {
            newledgerCode = 221001;
          }
          let createdIgstLedger = new ledgergroupModel({
            ledgerCode: newledgerCode,
            ledgerName: "IGST",
            groupType: 2,
            subCatogory: 2,
            subSubcatogory: 2,
            fixed_asset_cat: null,
            ledgerDetails: {
              typeOfdutyOrtax: "gst",
              taxType: "central",
              roundingMethod: false,
              opening_balance: 0,
            },
            branchId: req.body.branchId,
          });
          let createdigstdata = await createdIgstLedger.save();
          if (createdigstdata) {
            igstTopush = createdigstdata;
          }
        }
        if (igstTopush != null || igstTopush != undefined) {
          let igstCreditOrdebit = {
            glAccountCode: igstTopush.ledgerCode,
            glAccountId: igstTopush._id,
            glAccountName: igstTopush.ledgerName,
            debit: req.body.totalIgst,
            credit: null,
          };
          debitOrcreditData.push(igstCreditOrdebit);
        }
      }
      // igst section end
      // sgst section start
      if (
        req.body.totalSgst !== null &&
        req.body.totalSgst !== undefined &&
        req.body.totalSgst > 0
      ) {
        let sgstLedgerExist = await ledgergroupModel.findOne({
          groupType: 2,
          subCatogory: 2,
          subSubcatogory: 2,
          ledgerName: "SGST",
        });
        let sgstTopush;
        if (sgstLedgerExist != null || sgstLedgerExist != undefined) {
          console.log("sgst found");
          sgstTopush = sgstLedgerExist;
        } else {
          console.log("creating sgst");
          let ledgergroupExist = await ledgergroupModel.find({
            groupType: 2,
            subCatogory: 2,
            subSubcatogory: 2,
          });

          let newledgerCode;
          if (Array.isArray(ledgergroupExist) && ledgergroupExist.length > 0) {
            newledgerCode =
              ledgergroupExist[ledgergroupExist.length - 1].ledgerCode + 1;
          } else {
            newledgerCode = 221001;
          }
          let createdSgstLedger = new ledgergroupModel({
            ledgerCode: newledgerCode,
            ledgerName: "SGST",
            groupType: 2,
            subCatogory: 2,
            subSubcatogory: 2,
            fixed_asset_cat: null,
            ledgerDetails: {
              typeOfdutyOrtax: "gst",
              taxType: "central",
              roundingMethod: false,
              opening_balance: 0,
            },
            branchId: req.body.branchId,
          });
          let createdsgstdata = await createdSgstLedger.save();
          if (createdsgstdata) {
            sgstTopush = createdsgstdata;
          }
        }
        if (sgstTopush != null || sgstTopush != undefined) {
          let sgstCreditOrdebit = {
            glAccountCode: sgstTopush.ledgerCode,
            glAccountId: sgstTopush._id,
            glAccountName: sgstTopush.ledgerName,
            debit: req.body.totalSgst,
            credit: null,
          };
          debitOrcreditData.push(sgstCreditOrdebit);
        }
      }
      // sgst section end
      // cgst section start
      if (
        req.body.totalCgst !== null &&
        req.body.totalCgst !== undefined &&
        req.body.totalCgst > 0
      ) {
        let cgstLedgerExist = await ledgergroupModel.findOne({
          groupType: 2,
          subCatogory: 2,
          subSubcatogory: 2,
          ledgerName: "CGST",
        });
        let cgstTopush;
        if (cgstLedgerExist != null || cgstLedgerExist != undefined) {
          console.log("cgst found");
          cgstTopush = cgstLedgerExist;
        } else {
          console.log("creating cgst");
          let ledgergroupExist = await ledgergroupModel.find({
            groupType: 2,
            subCatogory: 2,
            subSubcatogory: 2,
          });

          let newledgerCode;
          if (Array.isArray(ledgergroupExist) && ledgergroupExist.length > 0) {
            newledgerCode =
              ledgergroupExist[ledgergroupExist.length - 1].ledgerCode + 1;
          } else {
            newledgerCode = 221001;
          }
          let createdCgstLedger = new ledgergroupModel({
            ledgerCode: newledgerCode,
            ledgerName: "CGST",
            groupType: 2,
            subCatogory: 2,
            subSubcatogory: 2,
            fixed_asset_cat: null,
            ledgerDetails: {
              typeOfdutyOrtax: "gst",
              taxType: "central",
              roundingMethod: false,
              opening_balance: 0,
            },
            branchId: req.body.branchId,
          });
          let createdcgstdata = await createdCgstLedger.save();
          if (createdcgstdata) {
            cgstTopush = createdcgstdata;
          }
        }
        if (cgstTopush != null || cgstTopush != undefined) {
          let cgstCreditOrdebit = {
            glAccountCode: cgstTopush.ledgerCode,
            glAccountId: cgstTopush._id,
            glAccountName: cgstTopush.ledgerName,
            debit: req.body.totalCgst,
            credit: null,
          };
          debitOrcreditData.push(cgstCreditOrdebit);
        }
      }
      // cgst section end
      // cust section start
      if (
        req.body.custOradvTax !== null &&
        req.body.custOradvTax !== undefined &&
        req.body.custOradvTax > 0
      ) {
        let custLedgerExist = await ledgergroupModel.findOne({
          groupType: 2,
          subCatogory: 2,
          subSubcatogory: 2,
          ledgerName: "CUST OR ADVANCE TAX",
        });
        let custTopush;
        if (custLedgerExist != null || custLedgerExist != undefined) {
          console.log("cust found");
          custTopush = custLedgerExist;
        } else {
          console.log("creating cust");
          let ledgergroupExist = await ledgergroupModel.find({
            groupType: 2,
            subCatogory: 2,
            subSubcatogory: 2,
          });

          let newledgerCode;
          if (Array.isArray(ledgergroupExist) && ledgergroupExist.length > 0) {
            newledgerCode =
              ledgergroupExist[ledgergroupExist.length - 1].ledgerCode + 1;
          } else {
            newledgerCode = 221001;
          }
          let createdCustLedger = new ledgergroupModel({
            ledgerCode: newledgerCode,
            ledgerName: "CUSTORADVTAX",
            groupType: 2,
            subCatogory: 2,
            subSubcatogory: 2,
            fixed_asset_cat: null,
            ledgerDetails: {
              typeOfdutyOrtax: "gst",
              taxType: "central",
              roundingMethod: false,
              opening_balance: 0,
            },
            branchId: req.body.branchId,
          });
          let createdcgstdata = await createdCustLedger.save();
          if (createdcgstdata) {
            custTopush = createdcgstdata;
          }
        }
        if (custTopush != null || custTopush != undefined) {
          let custCreditOrdebit = {
            glAccountCode: custTopush.ledgerCode,
            glAccountId: custTopush._id,
            glAccountName: custTopush.ledgerName,
            debit: req.body.custOradvTax,
            credit: null,
          };
          debitOrcreditData.push(custCreditOrdebit);
        }
      }
      // cust section end
      // cess section start
      if (
        req.body.cess !== null &&
        req.body.cess !== undefined &&
        req.body.cess > 0
      ) {
        let cessLedgerExist = await ledgergroupModel.findOne({
          groupType: 2,
          subCatogory: 2,
          subSubcatogory: 2,
          ledgerName: "CESS",
        });
        let cessTopush;
        if (cessLedgerExist != null || cessLedgerExist != undefined) {
          console.log("cess found");
          cessTopush = cessLedgerExist;
        } else {
          console.log("creating cess");
          let ledgergroupExist = await ledgergroupModel.find({
            groupType: 2,
            subCatogory: 2,
            subSubcatogory: 2,
          });

          let newledgerCode;
          if (Array.isArray(ledgergroupExist) && ledgergroupExist.length > 0) {
            newledgerCode =
              ledgergroupExist[ledgergroupExist.length - 1].ledgerCode + 1;
          } else {
            newledgerCode = 221001;
          }
          let createdCessLedger = new ledgergroupModel({
            ledgerCode: newledgerCode,
            ledgerName: "CESS",
            groupType: 2,
            subCatogory: 2,
            subSubcatogory: 2,
            fixed_asset_cat: null,
            ledgerDetails: {
              typeOfdutyOrtax: "gst",
              taxType: "central",
              roundingMethod: false,
              opening_balance: 0,
            },
            branchId: req.body.branchId,
          });
          let createdcessdata = await createdCessLedger.save();
          if (createdcessdata) {
            cessTopush = createdcessdata;
          }
        }
        if (cessTopush != null || cessTopush != undefined) {
          let custCreditOrdebit = {
            glAccountCode: cessTopush.ledgerCode,
            glAccountId: cessTopush._id,
            glAccountName: cessTopush.ledgerName,
            debit: req.body.cess,
            credit: null,
          };
          debitOrcreditData.push(custCreditOrdebit);
        }
      }
      // cess section end
      // education cess section start
      if (
        req.body.educationAndcompountCess !== null &&
        req.body.educationAndcompountCess !== undefined &&
        req.body.educationAndcompountCess > 0
      ) {
        let educationCessLedgerExist = await ledgergroupModel.findOne({
          groupType: 2,
          subCatogory: 2,
          subSubcatogory: 2,
          ledgerName: "EDUCATION AND COMPONENT CESS",
        });
        let educationCessTopush;
        if (
          educationCessLedgerExist != null ||
          educationCessLedgerExist != undefined
        ) {
          console.log("cess found");
          educationCessTopush = educationCessLedgerExist;
        } else {
          console.log("creating cess");
          let ledgergroupExist = await ledgergroupModel.find({
            groupType: 2,
            subCatogory: 2,
            subSubcatogory: 2,
          });

          let newledgerCode;
          if (Array.isArray(ledgergroupExist) && ledgergroupExist.length > 0) {
            newledgerCode =
              ledgergroupExist[ledgergroupExist.length - 1].ledgerCode + 1;
          } else {
            newledgerCode = 221001;
          }
          let createdEducationcessLedger = new ledgergroupModel({
            ledgerCode: newledgerCode,
            ledgerName: "EDUCATION AND COMPONENT CESS",
            groupType: 2,
            subCatogory: 2,
            subSubcatogory: 2,
            fixed_asset_cat: null,
            ledgerDetails: {
              typeOfdutyOrtax: "gst",
              taxType: "central",
              roundingMethod: false,
              opening_balance: 0,
            },
            branchId: req.body.branchId,
          });
          let creatededucationCessdata =
            await createdEducationcessLedger.save();
          if (creatededucationCessdata) {
            educationCessTopush = creatededucationCessdata;
          }
        }
        if (educationCessTopush != null || educationCessTopush != undefined) {
          let custCreditOrdebit = {
            glAccountCode: educationCessTopush.ledgerCode,
            glAccountId: educationCessTopush._id,
            glAccountName: educationCessTopush.ledgerName,
            debit: req.body.educationAndcompountCess,
            credit: null,
          };
          debitOrcreditData.push(custCreditOrdebit);
        }
      }
      // education cess section end
      // fright or other expense section start
      if (
        req.body.frightOrotherExpense !== null &&
        req.body.frightOrotherExpense !== undefined &&
        req.body.frightOrotherExpense > 0
      ) {
        let frightLedgerExist = await ledgergroupModel.findOne({
          groupType: 4,
          subCatogory: 1,
          subSubcatogory: 1,
          ledgerName: "FRIGHT OR OTHEREXPENSE",
        });
        let frightTopush;
        if (frightLedgerExist != null || frightLedgerExist != undefined) {
          console.log("FRIGHT OR OTHEREXPENSE found");
          frightTopush = frightLedgerExist;
        } else {
          console.log("creating FRIGHT OR OTHEREXPENSE");
          let ledgergroupExist = await ledgergroupModel.find({
            groupType: 4,
            subCatogory: 1,
            subSubcatogory: 1,
          });

          let newledgerCode;
          if (Array.isArray(ledgergroupExist) && ledgergroupExist.length > 0) {
            newledgerCode =
              ledgergroupExist[ledgergroupExist.length - 1].ledgerCode + 1;
          } else {
            newledgerCode = 400001;
          }
          let createdFrightLedger = new ledgergroupModel({
            ledgerCode: newledgerCode,
            ledgerName: "FRIGHT OR OTHER EXPENSE",
            groupType: 4,
            subCatogory: 1,
            subSubcatogory: 1,
            fixed_asset_cat: null,
            ledgerDetails: {
              opening_balance: 0,
            },
            branchId: req.body.branchId,
          });
          let createdfrightdata = await createdFrightLedger.save();
          if (createdfrightdata) {
            frightTopush = createdfrightdata;
          }
        }
        if (frightTopush != null || frightTopush != undefined) {
          let frightCreditOrdebit = {
            glAccountCode: frightTopush.ledgerCode,
            glAccountId: frightTopush._id,
            glAccountName: frightTopush.ledgerName,
            debit: req.body.frightOrotherExpense,
            credit: null,
          };
          debitOrcreditData.push(frightCreditOrdebit);
        }
      }
      // fright or other expense section end
      let newAccountingInvoice = new purchaseAccountnginvoiceModel({
        invoiceNo: newInvoiceNo,
        postingDate: new Date(req.body.postingDate).getTime(),
        supplierInvoiceno: req.body.supplierInvoiceno,
        supplierInvoicedate: new Date(req.body.supplierInvoicedate).getTime(),
        debit_credit_details: debitOrcreditData,
        totalBalance: req.body.totalBalance,
        paidAmount: req.body.paidAmount,
        branchId: req.body.branchId,
        isDraft: req.body.isDraft,
      });
      // let data = 1;
      let data = await newAccountingInvoice.save();
      if (data) {
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.BADREQUEST });
    }
    return (res = { data: {}, status: STATUSCODES.SUCCESS });
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//added on 18/08/23
module.exports.createIteminvoice = async (req) => {
  const { purchaseIteminvoiceModel } = conn.account(req.decode.db);
  try {
    if (req.body) {
      let foundInvoice = await purchaseIteminvoiceModel.find({
        branchId: req.body.branchId,
      });
      let newInvoiceNo;
      if (Array.isArray(foundInvoice) && foundInvoice.length > 0) {
        const lastInvoiceNumber =
          foundInvoice[foundInvoice.length - 1].invoiceNo;
        const numericPart = lastInvoiceNumber.match(/\d+/);
        const letterPrefix = lastInvoiceNumber.match(/[A-Za-z]+/);
        if (numericPart && letterPrefix) {
          const numericValue = parseInt(numericPart[0]);
          const prefixValue = letterPrefix[0];
          newInvoiceNo = prefixValue + (numericValue + 1);
        }
      } else {
        if (req.body.invoiceNo != null || req.body.invoiceNo != undefined) {
          newInvoiceNo = req.body.invoiceNo;
        } else {
          return (res = {
            data: "invoice number with prefix is required for first invoice creation",
            status: STATUSCODES.BADREQUEST,
          });
        }
      }
      let newitemInvoice = new purchaseIteminvoiceModel({
        invoiceNo: newInvoiceNo,
        purchaseNo: req.body.purchaseNo,
        supplierId: req.body.supplierId,
        postingDate: new Date(req.body.postingDate).getTime(),
        expiryDate: new Date(req.body.expiryDate).getTime(),
        location: req.body.location,
        paymentType: req.body.paymentType,
        supplierInvoiceno: req.body.supplierInvoiceno,
        details: req.body.details,
        debit_credit_details: req.body.debit_credit_details,
        total: req.body.total,
        totalIgst: req.body.totalIgst,
        totalSgst: req.body.totalSgst,
        totalCgst: req.body.totalCgst,
        discount: req.body.discount,
        totalBalance: req.body.totalBalance,
        frightOrotherExpense: req.body.frightOrotherExpense,
        custOradvTax: req.body.custOradvTax,
        cess: req.body.cess,
        educationAndcompountCess: req.body.educationAndcompountCess,
        roundOff: req.body.roundOff,
        grandTotal: req.body.grandTotal,
        paidAmount: req.body.paidAmount,
        branchId: req.body.branchId,
        isDraft: req.body.isDraft,
      });
      let data = await newitemInvoice.save();
      if (data) {
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.BADREQUEST });
    }
    return (res = { data: {}, status: STATUSCODES.SUCCESS });
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//added on 21/08/23
module.exports.purchaseReturninvoice = async (req) => {
  const { purchaseReturninvoiceModel } = conn.account(req.decode.db);
  try {
    if (req.body) {
      let foundInvoice = await purchaseReturninvoiceModel.find({
        branchId: req.body.branchId,
      });
      let newInvoiceNo;
      if (Array.isArray(foundInvoice) && foundInvoice.length > 0) {
        const lastInvoiceNumber =
          foundInvoice[foundInvoice.length - 1].invoiceNo;
        const numericPart = lastInvoiceNumber.match(/\d+/);
        const letterPrefix = lastInvoiceNumber.match(/[A-Za-z]+/);
        if (numericPart && letterPrefix) {
          const numericValue = parseInt(numericPart[0]);
          const prefixValue = letterPrefix[0];
          newInvoiceNo = prefixValue + (numericValue + 1);
        }
      } else {
        if (req.body.invoiceNo != null || req.body.invoiceNo != undefined) {
          newInvoiceNo = req.body.invoiceNo;
        } else {
          return (res = {
            data: "invoice number with prefix is required for first invoice creation",
            status: STATUSCODES.BADREQUEST,
          });
        }
      }
      let newpurchaseReturnInvoice = new purchaseReturninvoiceModel({
        invoiceNo: newInvoiceNo,
        purchaseinvoiceNo: req.body.purchaseinvoiceNo,
        date: new Date(req.body.date).getTime(),
        supplierId: req.body.supplierId,
        ledgerAccount: req.body.ledgerAccount,
        totalIgst: req.body.totalIgst,
        totalSgst: req.body.totalSgst,
        totalCgst: req.body.totalCgst,
        discount: req.body.discount,
        totalBalance: req.body.totalBalance,
        frightOrotherExpense: req.body.frightOrotherExpense,
        custOradvTax: req.body.custOradvTax,
        cess: req.body.cess,
        educationAndcompountCess: req.body.educationAndcompountCess,
        roundOff: req.body.roundOff,
        grandTotal: req.body.grandTotal,
        paidAmount: req.body.paidAmount,
        branchId: req.body.branchId,
        isDraft: req.body.isDraft,
      });
      let data = await newpurchaseReturnInvoice.save();
      if (data) {
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.BADREQUEST });
    }
    return (res = { data: {}, status: STATUSCODES.SUCCESS });
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//added on 21/08/23
module.exports.salesReturninvoice = async (req) => {
  const { salesReturninvoiceModel } = conn.account(req.decode.db);
  try {
    if (req.body) {
      let foundInvoice = await salesReturninvoiceModel.find({
        branchId: req.body.branchId,
      });
      let newInvoiceNo;
      if (Array.isArray(foundInvoice) && foundInvoice.length > 0) {
        const lastInvoiceNumber =
          foundInvoice[foundInvoice.length - 1].invoiceNo;
        const numericPart = lastInvoiceNumber.match(/\d+/);
        const letterPrefix = lastInvoiceNumber.match(/[A-Za-z]+/);
        if (numericPart && letterPrefix) {
          const numericValue = parseInt(numericPart[0]);
          const prefixValue = letterPrefix[0];
          newInvoiceNo = prefixValue + (numericValue + 1);
        }
      } else {
        if (req.body.invoiceNo != null || req.body.invoiceNo != undefined) {
          newInvoiceNo = req.body.invoiceNo;
        } else {
          return (res = {
            data: "invoice number with prefix is required for first invoice creation",
            status: STATUSCODES.BADREQUEST,
          });
        }
      }
      let newsalesReturnInvoice = new purchaseReturninvoiceModel({
        invoiceNo: newInvoiceNo,
        salesinvoiceNo: req.body.salesinvoiceNo,
        date: new Date(req.body.date).getTime(),
        customerId: req.body.customerId,
        ledgerAccount: req.body.ledgerAccount,
        totalIgst: req.body.totalIgst,
        totalSgst: req.body.totalSgst,
        totalCgst: req.body.totalCgst,
        discount: req.body.discount,
        totalBalance: req.body.totalBalance,
        cess: req.body.cess,
        roundOff: req.body.roundOff,
        grandTotal: req.body.grandTotal,
        receivedAmount: req.body.receivedAmount,
        branchId: req.body.branchId,
        isDraft: req.body.isDraft,
      });
      let data = await newsalesReturnInvoice.save();
      if (data) {
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.BADREQUEST });
    }
    return (res = { data: {}, status: STATUSCODES.SUCCESS });
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//added on 22/08/23
module.exports.salesInvoice = async (req) => {
  const { salesInvoiceModel } = conn.account(req.decode.db);
  try {
    if (req.body) {
      let foundInvoice = await salesInvoiceModel.find({
        branchId: req.body.branchId,
      });
      let newInvoiceNo;
      if (Array.isArray(foundInvoice) && foundInvoice.length > 0) {
        const lastInvoiceNumber =
          foundInvoice[foundInvoice.length - 1].invoiceNo;
        const numericPart = lastInvoiceNumber.match(/\d+/);
        const letterPrefix = lastInvoiceNumber.match(/[A-Za-z]+/);
        if (numericPart && letterPrefix) {
          const numericValue = parseInt(numericPart[0]);
          const prefixValue = letterPrefix[0];
          newInvoiceNo = prefixValue + (numericValue + 1);
        }
      } else {
        if (req.body.invoiceNo != null || req.body.invoiceNo != undefined) {
          newInvoiceNo = req.body.invoiceNo;
        } else {
          return (res = {
            data: "invoice number with prefix is required for first invoice creation",
            status: STATUSCODES.BADREQUEST,
          });
        }
      }
      let newsalesInvoice = new salesInvoiceModel({
        invoiceNo: newInvoiceNo,
        date: new Date(req.body.date).getTime(),
        customerId: req.body.customerId,
        debit_credit_details: req.body.debit_credit_details,
        total: req.body.total,
        totalIgst: req.body.totalIgst,
        totalSgst: req.body.totalSgst,
        totalCgst: req.body.totalCgst,
        discount: req.body.discount,
        totalBalance: req.body.totalBalance,
        cess: req.body.cess,
        roundOff: req.body.roundOff,
        grandTotal: req.body.grandTotal,
        receivedAmount: req.body.receivedAmount,
        branchId: req.body.branchId,
        isDraft: req.body.isDraft,
      });
      let data = await newsalesInvoice.save();
      if (data) {
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.BADREQUEST });
    }
    return (res = { data: {}, status: STATUSCODES.SUCCESS });
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//added on 23/08/23
module.exports.ledgerReport = async (req) => {
  const {
    bankInvoiceModel,
    ledgergroupModel,
    aPinvoiceModel,
    aRinvoiceModel,
    purchaseAccountnginvoiceModel,
    purchaseIteminvoiceModel,
    purchaseReturninvoiceModel,
    salesReturninvoiceModel,
    salesInvoiceModel,
  } = conn.account(req.decode.db);
  try {
    let filteredBankinv = [];

    let ledgergroupExist = await ledgergroupModel.findOne({
      _id: req.body.glAccountId,
      isDraft: false,
    });
    console.log(ledgergroupExist);
    let bankInvoiceExist = await bankInvoiceModel.find({
      "debit_credit_details.glAccountId": req.body.glAccountId,
      isDraft: false,
    });

    if (bankInvoiceExist.length > 0) {
      bankInvoiceExist.forEach((invoice) => {
        invoice.debit_credit_details.forEach((entry) => {
          if (entry.glAccountId !== req.body.glAccountId) {
            filteredBankinv.push({
              invoiceDate: prescisedateconvert(invoice.postingDate),
              invoiceNo: invoice.invoiceNo,
              invoiceType: "Bank invoice",
              debit_credit_details: entry,
            });
          }
        });
      });
    }
    let aPinvoiceExist = await aPinvoiceModel.find({
      "debit_credit_details.glAccountId": req.body.glAccountId,
      isDraft: false,
    });
    if (aPinvoiceExist.length > 0) {
      aPinvoiceExist.forEach((invoice) => {
        invoice.debit_credit_details.forEach((entry) => {
          if (entry.glAccountId !== req.body.glAccountId) {
            filteredBankinv.push({
              invoiceDate: prescisedateconvert(invoice.postingDate),
              invoiceNo: invoice.invoiceNo,
              invoiceType: "A/P invoice",
              debit_credit_details: entry,
            });
          }
        });
      });
    }
    let aRinvoiceExist = await aRinvoiceModel.find({
      "debit_credit_details.glAccountId": req.body.glAccountId,
      isDraft: false,
    });
    if (aRinvoiceExist.length > 0) {
      aRinvoiceExist.forEach((invoice) => {
        invoice.debit_credit_details.forEach((entry) => {
          if (entry.glAccountId !== req.body.glAccountId) {
            filteredBankinv.push({
              invoiceDate: prescisedateconvert(invoice.postingDate),
              invoiceNo: invoice.invoiceNo,
              invoiceType: "A/R invoice",
              debit_credit_details: entry,
            });
          }
        });
      });
    }
    let purchaseAccountnginvoiceExist =
      await purchaseAccountnginvoiceModel.find({
        "debit_credit_details.glAccountId": req.body.glAccountId,
        isDraft: false,
      });
    if (purchaseAccountnginvoiceExist.length > 0) {
      purchaseAccountnginvoiceExist.forEach((invoice) => {
        invoice.debit_credit_details.forEach((entry) => {
          if (entry.glAccountId !== req.body.glAccountId) {
            filteredBankinv.push({
              invoiceDate: prescisedateconvert(invoice.date),
              invoiceNo: invoice.invoiceNo,
              invoiceType: "Purchase Accounting invoice",
              debit_credit_details: entry,
            });
          }
        });
      });
    }
    let purchaseIteminvoiceExist = await purchaseIteminvoiceModel.find({
      "debit_credit_details.glAccountId": req.body.glAccountId,
      isDraft: false,
    });
    if (purchaseIteminvoiceExist.length > 0) {
      purchaseIteminvoiceExist.forEach((invoice) => {
        invoice.debit_credit_details.forEach((entry) => {
          if (entry.glAccountId !== req.body.glAccountId) {
            filteredBankinv.push({
              invoiceNo: invoice.invoiceNo,
              debit_credit_details: entry,
            });
          }
        });
      });
    }
    let purchaseReturninvoiceExist = await purchaseReturninvoiceModel.find({
      "debit_credit_details.glAccountId": req.body.glAccountId,
      isDraft: false,
    });
    // if (purchaseReturninvoiceExist.length > 0) {
    //   purchaseReturninvoiceExist.forEach((invoice) => {
    //     invoice.debit_credit_details.forEach((entry) => {
    //       if (entry.glAccountId !== req.body.glAccountId) {
    //         filteredBankinv.push({
    //           invoiceNo: invoice.invoiceNo,
    //           debit_credit_details: entry,
    //         });
    //       }
    //     });
    //   });
    // }
    let salesReturninvoiceExist = await salesReturninvoiceModel.find({
      "debit_credit_details.glAccountId": req.body.glAccountId,
      isDraft: false,
    });
    if (salesReturninvoiceExist.length > 0) {
      salesReturninvoiceExist.forEach((invoice) => {
        invoice.debit_credit_details.forEach((entry) => {
          if (entry.glAccountId !== req.body.glAccountId) {
            filteredBankinv.push({
              invoiceNo: invoice.invoiceNo,
              debit_credit_details: entry,
            });
          }
        });
      });
    }
    let salesInvoiceExist = await salesInvoiceModel.find({
      "debit_credit_details.glAccountId": req.body.glAccountId,
      isDraft: false,
    });
    if (salesInvoiceExist.length > 0) {
      salesInvoiceExist.forEach((invoice) => {
        invoice.debit_credit_details.forEach((entry) => {
          if (entry.glAccountId !== req.body.glAccountId) {
            filteredBankinv.push({
              invoiceNo: invoice.invoiceNo,
              debit_credit_details: entry,
            });
          }
        });
      });
    }
    // console.log(
    //   bankInvoiceExist,
    //   aPinvoiceExist,
    //   ledgergroupExist,
    //   aRinvoiceExist
    // );
    console.log(filteredBankinv);
    return (res = { data: bankInvoiceExist, status: STATUSCODES.SUCCESS });
  } catch (e) {
    console.log(e);
  }
};
