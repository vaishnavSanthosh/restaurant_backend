/** @format */

//file created on 25-01-22
//#region headers
const {
  STATUSCODES,
  LOG,
  API,
  URL,
  SHIFTSTATUS,
  PREFIXES,
  CREDITSTATUS,
  STOCKADJUSTMENTSTATUS,
  ROLES,
  GRNSTATUS,
  ORDERSTATUS,
  STOCKSTATUS,
} = require("../Model/enums");
const common_service = require("../Routes/commonRoutes.js");
const supplierService = require("./SupplierRoutes.js");
const foodService = require("../Routes/FoodRoutes.js");
const prodService = require("../Routes/ProductRoutes.js"); //added on 08-02-2022
const settings_service = require("./settingsRoutes");
const conn = require("../../userDbConn");
const { isEmpty } = require("./commonRoutes");
const { paymentVoucherSchema } = require("../Model/PurchaseModel");
const e = require("express");
//#endregion

//#region methods
//edited on 19-04-22 -> method modified with major changes mainly this function returns invoice base on both purchase sectionss
module.exports.purchaseSearch = async (req) => {
  const { purchaseModel, purchasewopoModel } = conn.purchase(process.env.db);
  try {
    let res = {};
    let purchaseInfo = [];
    let INVOICENO = req.query.invoiceNo.split("INV")[1];
    if (Number.isInteger(parseInt(INVOICENO))) {
      let purchaseSingle = await purchaseModel.findOne({
        suppId: req.query.suppId,
        invoiceNo: INVOICENO, //edited on 19-04-22
      });
      if (purchaseSingle) {
        let supplierDetails = await supplierService.viewSupplierSingle(
          purchaseSingle.suppId
        );
        purchaseSingle._doc["suppName"] = supplierDetails
          ? supplierDetails.data.supp_name
          : "";
        purchaseSingle._doc["invoiceNo"] = `INV` + purchaseSingle.invoiceNo; //edited on 19-04-22 -> prefix corrected from TEST to INV
        purchaseSingle._doc["purchaseDate"] =
          common_service.prescisedateconvert(purchaseSingle.purchaseDate);
        purchaseSingle._doc["expiryDate"] = common_service.prescisedateconvert(
          purchaseSingle.expiryDate
        );
        for (let j = 0; j < purchaseSingle.purchaseInfo.length; j++) {
          const item = purchaseSingle.purchaseInfo[j];
          let foodItem = await foodService.viewFoodItemsSingle(item.itemInfo);
          if (foodItem) {
            let items = {
              itemInfo: item.itemInfo,
              itemName: foodItem.data.prod_name,
              quantity: item.quantity,
              price: item.price,
            };
            purchaseInfo.push(items);
          }
        }
        purchaseSingle._doc["purchaseInfo"] = purchaseInfo;
        res = { data: purchaseSingle, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.NOTFOUND };
      }
    } else {
      //edited on 19-04-22 -> else section added with purchasewopo section
      let purchasewoposingle = await purchasewopoModel.findOne({
        supplierId: req.query.suppId,
        saleInvNo: req.query.invoiceNo,
      });
      if (purchasewoposingle) {
        let supplierDetails = await supplierService.viewSupplierSingle(
          purchasewoposingle.supplierId
        );
        purchasewoposingle._doc["suppName"] =
          supplierDetails.status == STATUSCODES.SUCCESS
            ? supplierDetails.data.supp_name
            : null;
        purchasewoposingle._doc["invoiceDate"] =
          common_service.prescisedateconvert(purchasewoposingle.invoiceDate);
        res = { data: purchasewoposingle, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.NOTFOUND };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 06-04-22
//edited on 11-04-22
//edited on 17-05-22
module.exports.generateInvoiceNo = async (req) => {
  const { purchaseModel } = conn.purchase(req.decode.db);
  try {
    let res = {};
    let INVOICENO = 0;
    let PONO = 0; //added on 11-04-22 -> introduced pono (transNo) to this method
    /*added on 17-06-22 */
    // let purchaseList = await purchaseModel.aggregate([
    //   {
    //     $sort: { invoiceNo: -1 },
    //   },
    // ]);
    let purchaseList = await purchaseModel.find({
      branchId: req.body.branchId,
    });
    if (purchaseList.length > 0) {
      PONO = purchaseList[purchaseList.length - 1].purchaseID + 1;
    } else {
      PONO = 1;
    }
    res = {
      data: {
        pono: PONO,
        ponoprefix: PREFIXES.PURCHASE,
      },
      status: STATUSCODES.SUCCESS,
    };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 07-04-22
//edited on 08-04-22
//edited on 17-06-22
module.exports.generateInvoiceNoWoPo = async (req) => {
  const { purchasewopoModel } = conn.purchase(req.decode.db);
  try {
    let res = {};
    let INVOICENO = 0;
    // let purchaseList = await purchasewopoModel.aggregate([
    //   //edited on 08-04-22 -> wrong model assignation removed
    //   {
    //     $sort: { transNo: -1 },
    //   },
    // ]);
    /*edited on 17-06-22 */
    let purchaseList = await purchasewopoModel.find({
      branchId: req.body.branchId,
    });
    if (purchaseList.length > 0) {
      INVOICENO = purchaseList[purchaseList.length - 1].transNo + 1;
    } else {
      INVOICENO = 1;
    }
    /*ends here */
    return (res = { data: INVOICENO, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.viewSinglePurchaseReport = async (req) => {
  const { purchaseModel, purchasewopoModel } = conn.purchase(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);

  let res = {},
    supplierData = {},
    invoiceNo,
    invoiceDate,
    arr = [];
  try {
    let purchase = await purchaseModel.findOne({ _id: req.body.id });
    let purchasewpo = await purchasewopoModel.findOne({ _id: req.body.id });
    if (purchase) {
      // let supp = await supplierService.viewSupplierSingle(purchase.suppId);

      let supp = await supplierModel.findOne({ _id: purchase.supplierId });
      supplierData.name = supp ? supp.supplierName : "";

      supplierData.address = supp ? supp.address : "";
      supplierData.mobile = supp ? supp.mobile : "";
      invoiceNo = purchase.invoiceNo;
      invoiceDate = common_service
        .prescisedateconvert(purchase.purchaseDate)
        .split(" ")[0];
      for (let i = 0; i < purchase.purchaseInfo.length; i++) {
        let prodItem = {
          itemName: purchase.purchaseInfo[i].itemName,
          uom: purchase.purchaseInfo[i].unit,
          quantity: purchase.purchaseInfo[i].quantity,
          price: purchase.purchaseInfo[i].rate,
          amount:
            parseInt(purchase.purchaseInfo[i].quantity) *
            parseInt(purchase.purchaseInfo[i].rate),
        };
        arr.push(prodItem);
      }
      return (res = {
        status: STATUSCODES.SUCCESS,
        data: {
          supplier: supplierData,
          invoiceNo,
          invoiceDate,
          purchaseInfo: arr,
          grandTotal: purchase.grandTotal,
        },
      });
    }
    if (purchasewpo) {
      // let supp = await supplierService.viewSupplierSingle(
      //   purchasewpo.supplierId
      // );

      let supp = {};
      if (common_service.isObjectId(purchasewpo.supplierId)) {
        supp = await supplierModel.findOne({ _id: purchasewpo.supplierId });
      }

      supplierData.name = supp ? supp.supp_name : "";
      supplierData.address = supp ? supp.address : "";
      supplierData.mobile = supp ? supp.mobile : "";
      invoiceNo = purchasewpo.saleInvNo;
      invoiceDate = common_service
        .prescisedateconvert(purchasewpo.invoiceDate)
        .split(" ")[0];
      for (let i = 0; i < purchasewpo.purchaseInfo.length; i++) {
        // let product = await prodService.viewProductSingle(
        //   purchasewpo.purchaseInfo[i].itemInfo
        // );

        let prodItem = {
          itemName: purchasewpo.purchaseInfo[i].itemName,
          uom: purchasewpo.purchaseInfo[i].unit,
          quantity: purchasewpo.purchaseInfo[i].quantity,
          price: purchasewpo.purchaseInfo[i].rate,
          amount:
            parseInt(purchasewpo.purchaseInfo[i].quantity) *
            parseInt(purchasewpo.purchaseInfo[i].rate),
        };
        arr.push(prodItem);
      }
      return (res = {
        status: STATUSCODES.SUCCESS,
        data: {
          supplier: supplierData,
          invoiceNo,
          invoiceDate,
          purchaseInfo: arr,
          grandTotal: purchasewpo.amount,
        },
      });
    }
    if (!purchase && !purchasewpo)
      return (res = { status: STATUSCODES.NOTFOUND, data: {} });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 11-04-22
//edited on 03-08-22
module.exports.searchInvoice = async (req) => {
  const { purchaseModel, purchasewopoModel } = conn.purchase(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  try {
    let res = {};
    let resobj = {};
    if (req.body.invoiceNo) {
      purhcaseExist = await purchaseModel.findOne({
        purchaseID: req.body.invoiceNo,
        branchId: req.body.branchId, //added on 03-08-22 -> branchid initialisation added for this method to fix duplication
      });
    } else {
      purhcaseExist = await purchaseModel.findOne({
        supplierId: req.body.suppId,
      });
    }
    if (purhcaseExist != null) {
      resobj.transNo = PREFIXES.PURCHASE + purhcaseExist.purchaseID;
      resobj.saleInvNo = resobj.transNo;
      resobj.date = common_service.prescisedateconvert(
        purhcaseExist.purchaseDate
      );
      resobj.location = purhcaseExist.branchId;
      let supplier = await supplierModel.findOne({
        _id: purhcaseExist.supplierId,
      });
      resobj.creditor = supplier != null ? supplier.supplierName : null;
      resobj.purchaseInfo = purhcaseExist.purchaseInfo;
      let productDetails = [];
      for (let i = 0; i < purhcaseExist.purchaseInfo.length; i++) {
        const element = purhcaseExist.purchaseInfo[i];
        let product = await productModel.findOne({ _id: element.itemInfo });
        if (product != null) {
          productDetails.push({
            code: `PROD` + product.code,
            productName: product.productName,
            unit: product.unit,
            orderQuantity: element.quantity,
            _id: product._id,
            rate: element.rate,
            type: element.type,
            uuid: element.uuid,
          });
        }
      }
      resobj.purchaseInfo = productDetails;
      resobj.purchaseId = purhcaseExist._id;
      resobj.suppId = purhcaseExist.supplierId;
      resobj.locationId = purhcaseExist.location;
      res = { data: resobj, status: STATUSCODES.SUCCESS };
    } else {
      let purhcaseExist = await purchasewopoModel.findOne({
        saleInvNo: req.body.invoiceNo,
      });
      if (purhcaseExist) {
        resobj.transNo = purhcaseExist.transNo;
        res = { data: resobj, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.NOTFOUND };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 14-04-22
//edited on 17-06-22
module.exports.generatetransferNo = async (req) => {
  const { transferModel } = conn.purchase(req.decode.db);
  try {
    let res = {};
    let TRANSNO = 0;
    // let TRANSLIST = await transferModel.aggregate([
    //   {
    //     $sort: { transNo: -1 },
    //   },
    // ]); //added orderId creation based on latest order on 02-02-22
    //edited on 17-06-22
    let TRANSLIST = await transferModel.find({
      branchId: req.decode.branchId,
    });
    if (TRANSLIST.length > 0) {
      TRANSNO = TRANSLIST[TRANSLIST.length - 1].transNo + 1;
    } else {
      TRANSNO = 1;
    } /*ends here */
    return (res = {
      data: { transNo: TRANSNO, prefix: "DOC" },
      status: STATUSCODES.SUCCESS,
    });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 19-04-22
//edited on 03-08-22
module.exports.invoiceList = async (req) => {
  const { purchaseModel, purchasewopoModel } = conn.purchase(req.decode.db);
  try {
    let res = {};
    let new_list = [];
    let purchaseList = await purchaseModel.find({
      branchId: req.body.branchId, //added on 03-08-22 -> branchid initialisation added
    });
    let purchasewpoList = await purchasewopoModel.find({
      branchId: req.body.branchId, //added on 03-08-22 -> branchid initialisation added
    });
    if (req.body.supplierId) {
      purchaseList.some((item) => {
        if (item.supplierId == req.body.supplierId) {
          new_list.push({
            invoiceNo: `${PREFIXES.PURCHASE + element.purchaseID}`,
            transNo: element.purchaseID,
          });
        }
      });
      purchasewpoList.some((item) => {
        if (item.supplierId == req.body.supplierId) {
          new_list.push({
            invoiceNo: PREFIXES.PURCHASEWPO + item.transNo,
            transNo: element.transNo,
          });
        }
      });
    } else {
      purchaseList.forEach((element) => {
        new_list.push({
          invoiceNo: `${PREFIXES.PURCHASE + element.purchaseID}`,
          transNo: element.purchaseID,
        });
      });
      purchasewpoList.forEach((element) => {
        new_list.push({
          invoiceNo: PREFIXES.PURCHASEWPO + element.transNo,
          transNo: element.transNo,
        });
      });
    }
    return (res = { data: new_list, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.viewtransfers = async (req) => {
  try {
    const { transferModel } = conn.purchase(req.decode.db);
    const { branchModel } = conn.location(req.decode.db);
    let arr = [],
      branchId;
    if (req.decode.role == ROLES.ADMIN) {
      let transfers = await transferModel.find({
        toLoc: branchId,
        status: STOCKADJUSTMENTSTATUS.PEN,
      });
      if (transfers.length > 0) {
        for (let i = 0; i < transfers.length; i++) {
          let fromLoc = await branchModel.findOne({
            storeCode: transfers[i].fromLoc,
          });
          let toLoc = await branchModel.findOne({
            storeCode: transfers[i].toLoc,
          });
          let transfer = {
            _id: transfers[i]._id,
            transNo:
              PREFIXES.STOCKTRANSFER +
              req.decode.prefix.substring(0, 2) +
              transfers[i].transNo,
            fromLoc: fromLoc?.branchName,
            toLoc: toLoc?.branchName,
            transferDate: common_service
              .prescisedateconvert(transfers[i].transferDate)
              .split(" ")[0],
            margin: transfers[i].margin,
            status: transfers[i].status,
          };
          arr.push(transfer);
        }
        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.NOTFOUND });
      }
    } else {
    }
  } catch (error) {
    console.error(error);
    return (res = { data: "Internel server error", status: STATUSCODES.ERROR });
  }
};

// Edited om 01-08-23
module.exports.viewSingleTransferReport = async (req) => {
  try {
    const { transferModel } = conn.purchase(req.decode.db);
    const { branchModel } = conn.location(req.decode.db);
    const { stockModel, stockLogModel } = conn.stock(req.decode.db);
    let transfer = await transferModel.findOne({ _id: req.body.id });
    let arr = [];
    let branchId = await req.body.branchId;

    if (transfer) {
      let fromLoc = await branchModel.findOne({ storeCode: transfer.fromLoc });
      let toLoc = await branchModel.findOne({ storeCode: transfer.toLoc });
      for (let i = 0; i < transfer.transferItems.length; i++) {
        let req = {
          itemId: transfer.transferItems[i].itemId,
          dimension: transfer.transferItems[i].dimension,
        };
        let stock = await stockModel.findOne(
          {
            itemId: req.itemId,
            branchId: branchId,
          },
          {
            "stock.dimension": 1,
            "stock.dimensionStock": 1,
          }
        );

        let item = {
          itemId: transfer.transferItems[i].itemId,
          itemName: transfer.transferItems[i].itemName,
          stockQty:
            stock?.stock?.length > 0 ? stock?.stock[0].dimensionStock : 0,
          transferQty: transfer.transferItems[i].transferQty,
          unit: transfer.transferItems[i].unit,
          unitCost: transfer.transferItems[i].unitCost,
          totalCost:
            transfer.transferItems[i].transferQty *
            transfer.transferItems[i].unitCost,
          spMargin: transfer.transferItems[i].spMargin,
          outletCost:
            transfer.transferItems[i].transferQty *
              transfer.transferItems[i].unitCost +
            transfer.transferItems[i].spMargin,
          unit:
            transfer.transferItems[i].unit != undefined
              ? transfer.transferItems[i].unit
              : "no unit",
        };
        arr.push(item);
      }
      let trans = {
        _id: transfer._id,
        transNo:
          PREFIXES.STOCKTRANSFER +
          req.decode.prefix.substring(0, 2) +
          transfer.transNo,
        fromLoc: fromLoc?.branchName,
        toLoc: toLoc?.branchName,
        transferDate: common_service
          .prescisedateconvert(transfer.transferDate)
          .split(" ")[0],
        margin: transfer.margin,
        remarks: transfer.remarks,
        transferItems: arr,
      };
      return (res = { data: trans, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (error) {
    console.error(error);
    return (res = { data: "Internel server error", status: STATUSCODES.ERROR });
  }
};

//added on 28-04-2022
module.exports.getTransNo = async (req) => {
  const { transferModel } = conn.purchase(req.decode.db);
  let arr = [];
  try {
    let trans = await transferModel.find({ branchId: req.body.branchId });
    if (trans) {
      for (let i = 0; i < trans.length; i++) {
        arr.push(trans[i].transNo);
      }
      return (res = { status: 200, data: arr });
    } else return (res = { status: STATUSCODES.NOTFOUND, data: "not found" });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 07-04-2022
//edited on 17-06-2022
module.exports.generateStockAdjustmentTransNo = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  let res = {};
  try {
    let TRANSNO = 0;
    // let TRANSLIST = await stockAdjustmentModel.aggregate([
    //   {
    //     $sort: { transNo: -1 },
    //   },
    // ]); //added orderId creation based on latest order on 02-02-22
    /*edited on 17-06-22 */
    let TRANSLIST = await stockAdjustmentModel.find({
      branchId: req.body.branchId,
    });
    if (TRANSLIST.length > 0) {
      TRANSNO = TRANSLIST[TRANSLIST.length - 1].transNo + 1;
    } else {
      TRANSNO = 1;
    }
    /*ends here */
    return (res = {
      data: { transNo: TRANSNO, prefix: "STA" },
      status: STATUSCODES.SUCCESS,
    });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 12-05-2022
//edited on 17-06-22
// module.exports.addStockAdjustment = async (req) => {
//   const { stockAdjustmentModel, stockAdjustmentTempModel } = conn.purchase(
//     process.env.db
//   );
//   let db = process.env.db;
//   let res = {};
//   try {
//     let TRANSNO = 0;
//     // let TRANSLIST = await stockAdjustmentModel.aggregate([
//     //   {
//     //     $sort: { transNo: -1 },
//     //   },
//     // ]); //added orderId creation based on latest order on 02-02-22
//     /*added on 17-06-22 */
//     let TRANSLIST = await stockAdjustmentModel.find({
//       branchId: process.env.branchId,
//     });
//     if (TRANSLIST.length > 0) {
//       TRANSNO = TRANSLIST[TRANSLIST.length - 1].transNo + 1;
//     } else {
//       TRANSNO = 1;
//     }
//     /*ends here */
//     if (req.body.items) {
//       let data = stockAdjustmentModel({
//         transNo: TRANSNO,
//         fromLoc: req.body.fromLoc,
//         toLoc: req.body.toLoc,
//         date: new Date(req.body.date).getTime(),
//         remarks: req.body.remarks,
//         glLinkCode: req.body.glLinkCode,
//         glCode: req.body.glCode,
//         slCode: req.body.slCode,
//         glLinkCodeDesc: req.body.glLinkCodeDesc ? req.body.glLinkCodeDesc : "",
//         glCodeDesc: req.body.glCodeDesc ? req.body.glCodeDesc : "",
//         slCodeDesc: req.body.slCodeDesc ? req.body.slCodeDesc : "",
//         items: req.body.items,
//         dataStatus: true,
//         status: "pending",
//         type: req.body.type, //added on 17-05-22 ->
//         branchId: process.env.branchId, //added on 05-08-22 -> added branchid
//       });
//       let result = await data.save();
//       let t = 0;
//       for (let i = 0; i < result.items.length; i++) {
//         t = t + parseInt(result.items[i].totalCost);
//       }
//       let sto = await stockAdjustmentModel.findOneAndUpdate(
//         { _id: result._id },
//         { $set: { totalCost: t } },
//         { returnDocument: "after" }
//       );
//       await result.save();
//       let lg = {
//         type: LOG.PUR_ADDSTOCKADJUSTMENT,
//         emp_id: req.decode ? req.decode._id : null, //changed on 15-06-22 -> line changed to avoid errors when _id is missing,
//         description: "add stock adjustment",
//         link: {
//           url: URL.null,
//           api: API.null,
//         },
//       };
//       await settings_service.addLog(lg, db);
//       let stkTemp = stockAdjustmentTempModel({
//         stAdjId: result._id,
//         fromLoc: result.fromLoc,
//         toLoc: result.toLoc,
//         items: result.items,
//         date: result.date,
//         remarks: result.remarks,
//         status: "pending",
//         branchId: process.env.branchId, //added on 05-08-22 -> added branchid
//       });
//       await stkTemp.save();
//       return (res = { data: sto, status: STATUSCODES.SUCCESS });
//     } else {
//       return (res = { data: "not acceptable", status: 406 });
//     }
//   } catch (e) {
//     console.error(e);
//     return (res = { data: e, status: STATUSCODES.ERROR });
//   }
// };

module.exports.getGlLinkCode = async (req) => {
  let res = {};
  try {
    let data = ["GLLC1", "GLLC2", "GLLC3", "GLLC4", "GLLC5", "GLLC6", "GLLC7"];
    return (res = { data, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.getGlCode = async (req) => {
  let res = {};
  try {
    let data = ["GLC1", "GLC2", "GLC3", "GLC4", "GLC5", "GLC6", "GLC7"];
    return (res = { data, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.getSlCode = async (req) => {
  let res = {};
  try {
    let data = ["SLC1", "SLC2", "SLC3", "SLC4", "SLC5", "SLC6", "SLC7"];
    return (res = { data, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.generateStockAdjTransNo = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  let res = {},
    arr = [];
  try {
    let data = await stockAdjustmentModel.find({}, { transNo: 1, _id: 0 });
    if (data) {
      for (let i = 0; i < data.length; i++) arr[i] = "STA" + data[i].transNo;
      return (res = { data: arr, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// Edited on 28-07-2023
module.exports.stockAdjustmentReport = async (req) => {
  try {
    const { stockAdjustmentModel } = conn.purchase(req.decode.db);
    const { branchModel } = conn.location(req.decode.db);
    let arr = [];
    let str = {};
    if (req.body.transNo) str.transNo = req.body.transNo;
    if (req.body.fromLoc) str.fromLoc = req.body.fromLoc;
    if (req.body.toLoc) str.toLoc = req.body.toLoc;
    let stkAdj = await stockAdjustmentModel.find(str);
    if (stkAdj.length > 0) {
      for (let i = 0; i < stkAdj.length; i++) {
        let fromLoc = {};
        if (common_service.isObjectId(stkAdj[i].fromLoc)) {
          fromLoc = await branchModel.findOne({ _id: stkAdj[i].fromLoc });
        }
        let toLoc = {};
        if (common_service.isObjectId(stkAdj[i].toLoc)) {
          toLoc = await branchModel.findOne({ _id: stkAdj[i].toLoc });
        }
        let item = {
          _id: stkAdj[i]._id,
          transNo:
            PREFIXES.STOCKADJUSTMENT +
            req.decode.prefix.substring(0, 2) +
            stkAdj[i].transNo,
          fromLoc: !isEmpty(fromLoc) ? fromLoc?.branchName : "no from location",
          fromLocStoreCode: !isEmpty(fromLoc)
            ? fromLoc?.storeCode
            : "no from location storecode",
          toLoc: !isEmpty(toLoc) ? toLoc?.branchName : "No to location",
          transferDate: common_service
            .prescisedateconvert(stkAdj[i].date)
            .split(" ")[0],
          status: stkAdj[i].status,
        };
        arr.push(item);
      }
      return (res = { data: arr, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (error) {
    console.error(error);
    return (res = { data: "Internel server error", status: STATUSCODES.ERROR });
  }
};

//Edited on 28-07-2023
module.exports.stockAdjustmentReportSingle = async (req) => {
  try {
    const { stockAdjustmentModel } = conn.purchase(req.decode.db);
    const { branchModel } = conn.location(req.decode.db);
    const { stockModel } = conn.stock(req.decode.db);
    let stkAdj = await stockAdjustmentModel.findOne({ _id: req.body.id });
    let arr = [];

    if (stkAdj) {
      let fromLoc = await branchModel.findOne({ _id: stkAdj.fromLoc });
      let toLoc = await branchModel.findOne({ _id: stkAdj.toLoc });
      for (let i = 0; i < stkAdj.purchaseInfo.length; i++) {
        let req = {
          itemId: stkAdj.purchaseInfo[i].itemId,
          branchId: process.env.branchId,
          dimension: stkAdj.purchaseInfo[i].dimension,
          type: stkAdj.purchaseInfo[i].itemType,
        };
        let stock = await stockModel.findOne(
          {
            itemId: stkAdj.purchaseInfo[i].itemId,
            branchId: process.env.branchId,
          },
          {
            "stock.dimension": 1, //added on 12-10-22
            "stock.dimensionStock": 1, //added on 30-08-22
          }
        );
        let item = {
          itemId: stkAdj.purchaseInfo[i].itemId,
          itemName: stkAdj.purchaseInfo[i].itemName,
          adjQty: stkAdj.purchaseInfo[i].adjQty,
          unit: stkAdj.purchaseInfo[i].unit,
          unitCost: stkAdj.purchaseInfo[i].unitCost,
          totalCost: stkAdj.purchaseInfo[i].totalCost,
          dimension: !isEmpty(stock)
            ? Array.isArray(stock.stock) && stock.stock.length > 0
              ? stock.stock[0].dimension
              : "no dimension"
            : "no dimension",
          dimensionstock: !isEmpty(stock)
            ? Array.isArray(stock.stock) && stock.stock.length > 0
              ? stock.stock[0].dimensionStock
              : 0
            : 0,
        };
        arr.push(item);
      }
      let branchData = {};
      if (common_service.isObjectId(branchData)) {
        branchData = await branchModel.findOne({ _id: stkAdj.ccCode?.code });
      }
      let adj = {
        _id: stkAdj._id,
        transNo:
          PREFIXES.STOCKADJUSTMENT +
          req.decode.prefix.substring(0, 2) +
          stkAdj.transNo,
        fromLoc: fromLoc?.branchName,
        fromLocStoreCode: fromLoc?.storeCode,
        toLoc: toLoc?.branchName,
        date: common_service.prescisedateconvert(stkAdj.date).split(" ")[0],
        remarks: stkAdj.remarks,
        glLinkCode: stkAdj.glLinkCode.code,
        glLinkCodeDescription: stkAdj.glLinkCode.description,
        glCode: stkAdj.glCode.code,
        glCodeDescription: stkAdj.glLinkCode.description,
        slCode: stkAdj.slCode?.code,
        slCodeDescription: stkAdj.slCode?.description,
        ccCode: !isEmpty(branchData.data)
          ? branchData.data.storeCode
          : "no code",
        ccCodeDescription: !isEmpty(branchData.data)
          ? branchData.data.branchName
          : "no code",
        status: stkAdj.status,
        purchaseInfo: arr,
      };
      return (res = { data: adj, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    console.error(e);
    return (res = { data: "Internel server error", status: STATUSCODES.ERROR });
  }
};

//added on 11-05-2022
module.exports.editStockAdjustmentTemp = async (req) => {
  const { stockAdjustmentTempModel } = conn.purchase(process.env.db);
  try {
    if (req.body.items && req.body.adjId) {
      let stAdj = await stockAdjustmentTempModel.findOne({
        _id: req.body.adjId,
      });
      if (stAdj) {
        stAdj.items = req.body.items;
        stAdj.status = "edited";
        req.body.remarks ? (stAdj.remarks = req.body.remarks) : stAdj.remarks;

        let result = await stAdj.save();
        return (res = { data: result, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.NOTFOUND });
      }
    } else {
      return (res = { data: "not acceptable", status: 406 });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 12-05-22
module.exports.confirmStockAdjustmentTemp = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  let res = {},
    indication = [],
    count = 0;
  try {
    let tot = 0;
    if (stAdj) {
      let st = await stockAdjustmentModel.findOne({ _id: stAdj.stAdjId });
      stAdj.items = req.body.items;
      stAdj.status = "completed";
      req.body.remarks ? (stAdj.remarks = req.body.remarks) : stAdj.remarks;
      let result = await stAdj.save();
      for (let i = 0; i < result.items.length; i++) {
        if (st.type == "isProduct") {
          let toProduct;
          let loc = await branchModel.findOne({ _id: result.fromLoc });
          let product = await productModel.findOne({
            _id: result.items[i].productId,
            branchId: loc.storecode,
          });

          if (!common_service.isEmpty(product)) {
            let productName = product.productName.toLowerCase();
            let allProducts = await productModel.find({});
            for (let i = 0; i < allProducts.length; i++) {
              if (
                productName == allProducts[i].productName.toLowerCase() &&
                allProducts[i].branchId == result.toLoc
              ) {
                toProduct = allProducts[i];
              }
            }
            if (product?.stock >= result.items[i].adjQty) {
              product.stock = product.stock - result.items[i].adjQty;
              await product.save();
              if (toProduct) {
                toProduct.stock =
                  toProduct.stock + parseInt(result.items[i].adjQty);
                await toProduct.save();
              } else {
                let PRODNO = 0;
                let PRODLIST = await productModel.aggregate([
                  {
                    $sort: { code: -1 },
                  },
                ]);
                if (PRODLIST.length > 0) {
                  PRODNO = PRODLIST[0].code + 1;
                } else {
                  PRODNO = 1;
                }
                let toLoc = await branchModel.findOne({ _id: result.toLoc });
                let newProduct = productModel({
                  code: PRODNO,
                  category: product.category,
                  productName: product.productName,
                  unit: product.unit,
                  imageUrl: product.imageUrl,
                  status: true,
                  stock: parseInt(result.items[i].adjQty),
                  branchId: toLoc.storecode,
                });
                let result = await newProduct.save();
              }
            } else {
              count = 1;
              let ind = {
                reason: "stock mismatch",
                productId: product._id,
                productName: product.productName,
                stock: product.stock,
                AdjustStock: result.items[i].adjQty,
              };
              indication.push(ind);
            }
          } else {
            return (res = {
              data: { message: "Material Deleted Or Missing" },
              status: STATUSCODES.UNPROCESSED,
            });
          }
        } else {
          let toProduct;
          let loc = await branchModel.findOne({ _id: result.fromLoc });
          let product = await foodModel.findOne({
            _id: result.items[i].productId,
            branchId: loc.storecode,
          });

          if (!common_service.isEmpty(product)) {
            let productName = product?.prod_name.toLowerCase();
            let allProducts = await foodModel.find({});
            for (let i = 0; i < allProducts.length; i++) {
              if (
                productName == allProducts[i].prod_name.toLowerCase() &&
                allProducts[i].branchId == result.toLoc
              ) {
                toProduct = allProducts[i];
              }
            }

            if (product?.stock >= result.items[i].adjQty) {
              product.stock = product.stock - result.items[i].adjQty;
              await product.save();
              if (toProduct) {
                toProduct.stock =
                  toProduct.stock + parseInt(result.items[i].adjQty);
                await toProduct.save();
              } else {
                let PRODNO = 0;
                let PRODLIST = await foodModel.aggregate([
                  {
                    $sort: { prod_id: -1 },
                  },
                ]);
                if (PRODLIST.length > 0) {
                  PRODNO = PRODLIST[0].prod_id + 1;
                } else {
                  PRODNO = 1;
                }
                let toLoc = await branchModel.findOne({ _id: result.toLoc });
                let newProduct = foodModel({
                  prod_id: PRODNO,
                  prod_name: product.prod_name,
                  release_date: product.release_date,
                  food_type: product.food_type,
                  category: product.category,
                  subcategoryId: product.subcategoryId,
                  unit: product.unit,
                  dimensions: product.dimensions,
                  gen_info: product.gen_info,
                  tags: product.tags,
                  description: product.description,
                  imageUrl: product.imageUrl,
                  status: true,
                  barcode: product.barcode,
                  qrcode: product.qrcode,
                  branchId: result.toLoc,
                  stock: parseInt(result.items[i].adjQty),
                  branchId: toLoc.storecode,
                });
                await newProduct.save();
              }
            } else {
              count = 1;
              let ind = {
                reason: "stock mismatch",
                productId: product?._id,
                productName: product?.prod_name,
                stock: product?.stock,
                AdjustStock: result.items[i].adjQty,
              };
              indication.push(ind);
            }
          } else {
            return (res = {
              data: { message: "Material Deleted Or Missing" },
              status: STATUSCODES.UNPROCESSED,
            });
          }
        }
      }
      if (count == 0) {
        for (let i = 0; i < req.body.items.length; i++) {
          tot = tot + parseInt(req.body.items[i].totalCost);
        }
        let stockAdj = await stockAdjustmentModel.findOneAndUpdate(
          { _id: result.stAdjId, status: "pending" },
          {
            $set: {
              status: "completed",
              items: result.items,
              totalCost: tot,
            },
          },
          { returnDocument: "after" }
        );
        await stockAdjustmentTempModel.findOneAndDelete({
          _id: result._id,
          status: "completed",
        });
        let lg = {
          type: LOG.PUR_CONFIRMSTOCKADJUSTMENT,
          emp_id: req.decode._id,
          description: "confirm stock adjustment",
          link: {
            url: URL.null,
            api: API.null,
          },
        };
        await settings_service.addLog(lg);
        return (res = { data: stockAdj, status: STATUSCODES.SUCCESS });
      } else return (res = { data: indication, status: STATUSCODES.FORBIDDEN });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 23-05-2022
//assembled on 09-06-2022
//added and assembled on 15-07-22

//added on 06-07-22
//added and assembled on 14-07-22
//need to be integrate with dynamic db
module.exports.addVoucher = async (req) => {
  try {
    let res = {};
    let newVoucher = new voucherModel({
      transNo: req.transNo,
      secId: req.secId,
      secType: req.secType,
      voucherType: this.getVoucherType(req.voucherType),
      supplier: req.supplier,
      transDate: new Date(req.transDate).getTime(),
      creditAmount: req.creditAmount,
      lastPaidAmount: req.lastPaidAmount,
      lastPaidDate: new Date(req.lastPaidDate).getTime(),
      branchId: process.env.branchId,
    });
    let data = await newVoucher.save();
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

//added on 06-07-22
//added and assembled on 14-07-22
//need to be integrate with dynamic db
module.exports.generateVoucherId = async (req) => {
  try {
    const { paymentVoucherModel } = conn.purchase(req.decode.db);
    let TRANSNO = 0;
    let TRANSLIST = await paymentVoucherModel.find({
      branchId: req.body.branchId,
    });
    TRANSNO =
      TRANSLIST.length > 0 ? TRANSLIST[TRANSLIST.length - 1].transNo + 1 : 1;
    return (res = {
      data: {
        voucherNo: TRANSNO,
        vouprefix: `VOU`,
      },
      status: 200,
    });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 06-07-22
//added and assembled on 14-07-22
//need to be integrate with dynamic db
module.exports.getVoucherType = async (req) => {
  try {
    let resp =
      req == 10
        ? VOUCHERTYPES.ACCOUNTS.PAY
        : req == 11
        ? VOUCHERTYPES.ACCOUNTS.REC
        : req == 12
        ? VOUCHERTYPES.ACCOUNTS.PUR
        : req == 13
        ? VOUCHERTYPES.ACCOUNTS.PUR_RET
        : req == 14
        ? VOUCHERTYPES.ACCOUNTS.SLS
        : req == 15
        ? VOUCHERTYPES.ACCOUNTS.SLS_RET
        : req == 16
        ? VOUCHERTYPES.ACCOUNTS.CON
        : req == 20
        ? VOUCHERTYPES.INVENTORY.PHY_STK_VER
        : req == 21
        ? VOUCHERTYPES.INVENTORY.STK_TRA_VOU
        : req == 30
        ? VOUCHERTYPES.PAYROLL.ATT_REG
        : req == 31
        ? VOUCHERTYPES.PAYROLL.PAY_VOU
        : null;
    return resp;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 08-07-22
//edited on 11-07-22
//added and assembled on 14-07-22
//need to be integrate with dynamic db
//edited on 22-07-22
module.exports.viewPurchaseSingle = async (req) => {
  try {
    const { purchaseModel } = conn.purchase(process.env.db); //added on 22-07-22
    const { productModel } = conn.product(process.env.db); //added on 22-07-22
    let res = {};
    let itemArr = [];
    let purhcaseExist = await purchaseModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(purhcaseExist)) {
      for (let i = 0; i < purhcaseExist.purchaseInfo.length; i++) {
        const element = purhcaseExist.purchaseInfo[i];
        let productExist = await productModel.findOne({
          _id: element.itemInfo,
        });
        let itemobj = {};
        itemobj.itemInfo = element.itemInfo;
        itemobj.quantity = element.quantity;
        itemobj.price = element.price;
        itemobj.itemName = !common_service.isEmpty(productExist)
          ? productExist.productName
          : null;
        itemobj.stock = !common_service.isEmpty(productExist)
          ? productExist.stock
          : 0; //added new field on 11-07-22
        itemobj.unit = !common_service.isEmpty(productExist)
          ? productExist.unit
          : 0; //added new field on 11-07-22
        itemArr.push(itemobj);
      }
      purhcaseExist._doc["purchaseInfo"] = itemArr;
      purhcaseExist._doc["purchaseDate"] = common_service
        .prescisedateconvert(purhcaseExist.purchaseDate)
        .split(" ")[0];
      purhcaseExist._doc["expiryDate"] = common_service
        .prescisedateconvert(purhcaseExist.expiryDate)
        .split(" ")[0];
      purhcaseExist._doc["invoiceNo"] = `PUR-INV${purhcaseExist.invoiceNo}`;
      let supplierExist = await supplierService.viewSupplierSingle(
        purhcaseExist.suppId
      );
      purhcaseExist._doc["supplierName"] = !common_service.isEmpty(
        supplierExist.data
      )
        ? supplierExist.data.supp_name
        : null;
      res = { data: purhcaseExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 22-07-22
module.exports.getStockAdjOfFromLoc = async (req) => {
  let res = {},
    arr = [];
  const { stockAdjustmentModel, stockAdjustmentTempModel } = conn.purchase(
    process.env.db
  );
  const { branchModel } = conn.location(process.env.db);
  try {
    let t = await branchModel.findOne({ storecode: process.env.branchId });
    let toLoc = t?._id;
    let stockAdj = await stockAdjustmentTempModel.find({
      fromLoc: toLoc,
      status: "edited",
    });
    if (stockAdj) {
      for (let i = 0; i < stockAdj.length; i++) {
        let st = await stockAdjustmentModel.findOne({
          _id: stockAdj[i].stAdjId,
        });
        let loc = await branchModel.findOne({ _id: stockAdj[i].fromLoc });
        if (st) {
          let temp = {
            _id: stockAdj[i]._id,
            transactionId: st.transNo,
            location: loc?.branchName,
            date: common_service.prescisedateconvert(st.date).split(" ")[0],
            remarks: st.remarks,
            totalCost: st.totalCost,
            items: stockAdj[i].items,
          };
          arr.push(temp);
        }
      }
      return (res = { data: arr, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 06-06-23
module.exports.addPurchase = async (req) => {
  try {
    const { purchaseModel } = conn.purchase(req.decode.db);
    const { shiftLogModel, logModel, shiftModel } = conn.settings(
      req.decode.db
    );
    let shiftExist = {};
    let shiftSettings = await shiftModel.findOne({
      branchId: req.body.branchId,
    });
    if (common_service.checkObject(shiftSettings)) {
      if (shiftSettings.shiftType == 2) {
        shiftExist.shiftId = 0;
      } else {
        shiftExist = await shiftLogModel.findOne({
          branchId: req.body.branchId,
          status: SHIFTSTATUS.ACT,
        });
      }
    } else {
      return (res = {
        data: { msg: `No Settings Defined For Branch ${req.body.branchId}` },
        status: STATUSCODES.NOTFOUND,
      });
    }
    if (common_service.checkObject(shiftExist)) {
      if (req.body.purchaseInfo.length > 0) {
        req.body.purchaseInfo.map(
          (x) => (x.uuid = common_service.generateUuid())
        );
      }
      let newpurchase = await purchaseModel({
        invoiceNo: req.body.invoiceNo,
        supplierId: req.body.supplierId,
        payTerms: req.body.payTerms,
        purchaseDate: new Date(req.body.purchaseDate).getTime(),
        expiryDate: new Date(req.body.purchaseDate).getTime(),
        location: req.body.location,
        remarks: req.body.remarks,
        purchaseInfo: req.body.purchaseInfo,
        grandTotal: req.body.grandTotal,
        branchId: req.body.branchId,
        shiftId: shiftExist.shiftId,
      });
      let purchaseList = await purchaseModel
        .find({
          branchId: req.body.branchId,
        })
        .sort({ purchaseID: -1 });
      if (Array.isArray(purchaseList) && purchaseList.length > 0) {
        newpurchase.purchaseID = purchaseList[0].purchaseID + 1;
      } else {
        newpurchase.purchaseID = 1;
      }
      let purdata = await newpurchase.save();
      if (purdata) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.PURCHASEMANAGE_PO_ADD.type,
          description: LOG.PURCHASEMANAGE_PO_ADD.description,
          branchId: purdata.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        return (res = { data: purdata, status: STATUSCODES.SUCCESS });
      } else {
        return (res = {
          data: { msg: `Purchase Failed Due to db issue` },
          status: STATUSCODES.UNPROCESSED,
        });
      }
    } else {
      return (res = {
        data: { msg: `No Active Shift For Branch ${req.body.branchId}` },
        status: STATUSCODES.NOTFOUND,
      });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 09-06-23
module.exports.viewInvoiceNumbers = async (req) => {
  try {
    const { purchaseModel, purchasewopoModel } = conn.purchase(req.decode.db);
    let rslist = [];
    let newList = [];
    let purchaseList = await purchaseModel.find({
      branchId: req.body.branchId,
    });
    let purchaseWpoList = [];
    req.body.type = parseInt(req.body.type);
    if (req.body.type == 1) {
      purchaseWpoList = await purchasewopoModel.find({
        branchId: req.body.branchId,
      });
    }
    if (Array.isArray(purchaseList) && purchaseList.length > 0) {
      for (let i = 0; i < purchaseList.length; i++) {
        const element = purchaseList[i];
        rslist.push({
          _id: element._id,
          purchaseId:
            element.branchId.substr(3) + PREFIXES.PURCHASE + element.purchaseID,
          purchaseDate: element.purchaseDate,
          convPurchaseDate: common_service.prescisedateconvert(
            element.purchaseDate
          ),
          type: 0,
        });
      }
    }
    if (Array.isArray(purchaseWpoList) && purchaseWpoList.length > 0) {
      for (let i = 0; i < purchaseWpoList.length; i++) {
        const element = purchaseWpoList[i];
        rslist.push({
          _id: element._id,
          purchaseId:
            element.branchId.substr(3) + PREFIXES.PURCHASEWPO + element.transNo,
          type: 1,
        });
      }
    }
    if (
      common_service.checkIfNullOrUndefined(req.body.fromDate, req.body.toDate)
    ) {
      rslist.some((x) => {
        if (
          x.purchaseDate >= new Date(req.body.fromDate).getTime() &&
          x.purchaseDate <= new Date(req.body.toDate).getTime()
        ) {
          newList.push(x);
        }
      });
      rslist = newList;
    }
    return (res = { data: rslist, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 06-06-23
module.exports.addPurchaseWopo = async (req) => {
  const { purchasewopoModel, paymentVoucherModel } = conn.purchase(
    req.decode.db
  );
  const { productModel } = conn.product(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { creditModel, paymentModel } = conn.payment(req.decode.db);
  const { stockModel, stockLogModel } = conn.stock(req.decode.db);
  const { shiftLogModel, logModel, shiftModel } = conn.settings(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  try {
    for (let i = 0; i < req.body.purchaseInfo.length; i++) {
      const element = req.body.purchaseInfo[i];
      element.uuid = common_service.generateUuid();
    }
    if (req.body.branchId == null) {
      return (res = {
        data: {
          msg: `Invalid Storecode ${req.body.branchId}`,
        },
        status: STATUSCODES.BADREQUEST,
      });
    }
    let newPurchaseWoPo = new purchasewopoModel({
      transNo: req.body.transNo,
      saleInvNo: null,
      branchId: req.body.branchId,
      invoiceDate: new Date(req.body.invoiceDate).getTime(),
      supplierId: req.body.supplierId,
      recievedBy: req.body.recievedBy,
      remarks: req.body.remarks,
      purchaseInfo: req.body.purchaseInfo,
      percentage: req.body.percentage,
      amount: req.body.amount,
      netAmount: req.body.netAmount,
    });
    let shiftExist = {};
    let shiftSettings = await shiftModel.findOne({
      branchId: newPurchaseWoPo.branchId,
    });
    if (common_service.checkObject(shiftSettings)) {
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
          msg: `no shift Settings Defined For branch ${newPurchaseWoPo.branchId}`,
        },
        status: STATUSCODES.NOTFOUND,
      });
    }
    if (!common_service.isEmpty(shiftExist)) {
      newPurchaseWoPo.shiftId = shiftExist.shiftId;
      if (!common_service.isEmpty(req.body.paymentMethod)) {
        req.body.paymentMethod.shiftId = shiftExist.shiftId;
      }
    } else {
      return (res = {
        data: { msg: `No Active Shift For ${newPurchaseWoPo.branchId}` },
        status: STATUSCODES.NOTFOUND,
      });
    }
    let purchaseList = await purchasewopoModel.find({
      branchId: newPurchaseWoPo.branchId,
    });
    if (Array.isArray(purchaseList) && purchaseList.length > 0) {
      newPurchaseWoPo.transNo =
        purchaseList[purchaseList.length - 1].transNo + 1;
    } else {
      newPurchaseWoPo.transNo = 1;
    }
    let data = await newPurchaseWoPo.save();
    let paidAmount = 0;
    if (common_service.checkObject(req.body.paymentMethod)) {
      paidAmount = parseInt(req.body.paymentMethod.paidAmount);
    }
    let newVoucher = new paymentVoucherModel({
      wpoId: `${PREFIXES.PURCHASEWPO}${newPurchaseWoPo.transNo}`,
      branchId: newPurchaseWoPo.branchId,
      supplierId: newPurchaseWoPo.supplierId,
      lastPaidAmount: common_service.checkObject(req.body.paymentMethod)
        ? req.body.paymentMethod.paidAmount
        : 0,
      lastPaidDate: new Date(newPurchaseWoPo.invoiceDate).getTime(),
      paymentMethod: common_service.checkObject(req.body.paymentMethod)
        ? req.body.paymentMethod
        : null,
      status:
        newPurchaseWoPo.amount == paidAmount
          ? CREDITSTATUS.COM
          : CREDITSTATUS.PEN,
      date: new Date(newPurchaseWoPo.invoiceDate).getTime(),
      purchasePk: data._id,
    });

    if (Array.isArray(purchaseList) && purchaseList.length > 0) {
      newVoucher.transNo = purchaseList[purchaseList.length - 1].transNo + 1;
    } else {
      newVoucher.transNo = 1;
    }
    let voucherSavedata = await newVoucher.save();
    if (voucherSavedata) {
      if (paidAmount < req.body.netAmount) {
        let creditData = new creditModel({
          purchaseId: `${PREFIXES.PURCHASEWPO}${newPurchaseWoPo.transNo}`,
          supplierId: newPurchaseWoPo.supplierId,
          purchaseDate: new Date(req.body.invoiceDate).getTime(),
          netAmount: newPurchaseWoPo.amount,
          discount: newPurchaseWoPo.amount - newPurchaseWoPo.netAmount,
          lastPaidDate: new Date(req.body.invoiceDate).getTime(),
          balance: newPurchaseWoPo.netAmount - paidAmount,
          status: CREDITSTATUS.PEN,
          isPurchase: true,
          branchId: newPurchaseWoPo.branchId,
          paidAmount: paidAmount,
          returnAmount: 0,
          purchasePk: data._id,
        });
        let creditDataResponse = await creditData.save();
        if (creditDataResponse == null) {
          return (res = {
            data: {
              msg: `cannot update credit of purchasewpo ${newPurchaseWoPo.transNo}`,
            },
            status: STATUSCODES.UNPROCESSED,
          });
        } else {
          let supplierExist = await supplierModel.findOne({
            _id: creditData.supplierId,
          });
          if (supplierExist) {
            supplierExist.openingBalance =
              supplierExist.openingBalance + creditData.balance;
            let supplierData = await supplierExist.save();
            if (common_service.isEmpty(supplierData)) {
              return (res = {
                data: {
                  msg: `cannot update credit of supplier for purchasewpo ${newPurchaseWoPo.transNo}`,
                },
                status: STATUSCODES.UNPROCESSED,
              });
            }
          } else {
            res = { data: supplierExist, status: STATUSCODES.NOTFOUND };
          }
        }
      }
      if (!common_service.isEmpty(req.body.paymentMethod)) {
        let paymentData = new paymentModel({
          invoiceNo: `${PREFIXES.PURCHASEWPO}${newPurchaseWoPo.transNo}`,
          cus_id: newPurchaseWoPo.recievedBy,
          date: new Date(req.body.invoiceDate).getTime(),
          paymentMethod: req.body.paymentMethod,
          totalAmount: newPurchaseWoPo.netAmount,
          branchId: newPurchaseWoPo.branchId,
          purchasePk: data._id,
        });
        let paymentResponse = await paymentData.save();
        if (common_service.isEmpty(paymentResponse)) {
          return (res = {
            data: {
              msg: `cannot add payment to log for purchasewopo ${newPurchaseWoPo.transNo}`,
            },
            status: STATUSCODES.UNPROCESSED,
          });
        }
      }
      if (data) {
        await Promise.all(
          data.purchaseInfo.map(async (x) => {
            let itemExist = await productModel.findOne({ _id: x.itemInfo });
            if (common_service.checkObject(itemExist)) {
              await productModel.findOneAndUpdate(
                { _id: itemExist._id },
                { $set: { sellingRate: x.rate } },
                { new: true }
              );
            }
            let stockdata = {
              itemType: x.type,
              itemId: x.itemInfo,
              stock: x.quantity,
              branchId: data.branchId,
              dimension: x.dimension,
              rate: x.rate,
            };
            let stockExist = await stockModel.findOne({
              itemId: stockdata.itemId,
              branchId: stockdata.branchId,
            });
            if (!common_service.isEmpty(stockExist)) {
              let stockFind = stockExist.stock.find(
                (x) => x.dimension == stockdata.dimension
              );

              if (!common_service.isEmpty(stockFind)) {
                if (stockFind.dimensionStock == 0 && stockdata.stock < 0) {
                  return (res = {
                    data: {
                      msg: `Item Stock is ${stockFind.dimensionStock}`,
                    },
                    status: STATUSCODES.FORBIDDEN,
                  });
                } else {
                  stockFind.dimensionStock =
                    stockFind.dimensionStock + stockdata.stock;
                }
              } else {
                stockExist.stock.push({
                  dimension: stockdata.dimension,
                  dimensionStock: stockdata.stock,
                });
              }
              let stockdataresponse = await stockExist.save();
              if (stockdataresponse) {
                let product = {};
                if (stockdata.itemType == 0) {
                  product = await productModel.findOne({
                    _id: stockdata.itemId,
                  });
                }
                if (stockdata.itemType == 1) {
                  product = await foodModel.findOne({
                    _id: stockdata.itemId,
                  });
                }
                let stockLogData = new stockLogModel({
                  itemType: stockdata.itemType,
                  itemId: stockdata.itemId,
                  stock: [
                    {
                      dimension: stockdata.dimension,
                      dimensionStock: stockdata.stock,
                    },
                  ],
                  branchId: stockdata.branchId,
                  date: new Date(newPurchaseWoPo.invoiceDate).getTime(),
                  orderNo: newPurchaseWoPo.transNo,
                  type: PREFIXES.PURCHASEWPO,
                  categoryId: !common_service.isEmpty(product)
                    ? product.category
                    : null,
                  subCategoryId:
                    !common_service.isEmpty(product) && stockdata.itemType != 0
                      ? product.subcategoryId
                      : null,
                  rate: stockdata.rate,
                });

                let stocklogdataresponse = await stockLogData.save();
                if (common_service.isEmpty(stocklogdataresponse)) {
                  return (res = {
                    data: { msg: "Error Saving Stock Updation To Log" },
                    status: STATUSCODES.UNPROCESSED,
                  });
                }
              } else {
                res = {
                  data: { msg: "Error Saving Stock" },
                  status: STATUSCODES.UNPROCESSED,
                };
              }
            } else {
              let newStock = new stockModel({
                itemType: stockdata.itemType,
                itemId: stockdata.itemId,
                stock: [
                  {
                    dimension: stockdata.dimension,
                    dimensionStock: stockdata.stock,
                  },
                ],
                branchId: stockdata.branchId,
              });

              let stockdataresponse = await newStock.save();
              if (stockdataresponse) {
                console.log(stockdataresponse);
                let product = {};
                if (stockdata.itemType == 0) {
                  product = await productModel.findOne({
                    _id: stockdata.itemId,
                  });
                }
                if (stockdata.itemType == 1) {
                  product = await foodModel.findOne({
                    _id: stockdata.itemId,
                  });
                }
                let stockLogData = new stockLogModel({
                  itemType: stockdata.itemType,
                  itemId: stockdata.itemId,
                  stock: newStock.stock,
                  branchId: stockdata.branchId,
                  date: new Date(newPurchaseWoPo.invoiceDate).getTime(),
                  orderNo: newPurchaseWoPo.transNo,
                  type: PREFIXES.PURCHASEWPO,
                  categoryId: !common_service.isEmpty(product)
                    ? product.category
                    : null, // added on 06-03-24
                  subCategoryId:
                    !common_service.isEmpty(product) && stockdata.itemType != 0
                      ? product.subcategoryId
                      : null,
                  rate: stockdata.rate,
                });
                let stocklogdataresponse = await stockLogData.save();
                if (common_service.isEmpty(stocklogdataresponse)) {
                  let newlog = new logModel({
                    date: new Date().getTime(),
                    emp_id: req.decode._id,
                    type: LOG.PURCHASEMANAGE_PWPO_ADD.type,
                    description: LOG.PURCHASEMANAGE_PWPO_ADD.description,
                    branchId: stocklogdataresponse.branchId,
                    link: {},
                    payload: {
                      token: req.headers.authorization,
                      body: req.body,
                    },
                  });
                  let logresponse = await newlog.save();
                  if (logresponse == null) {
                    console.log("log save faild");
                  }
                  return (res = {
                    data: { msg: "Error Saving Stock Updation To Log" },
                    status: STATUSCODES.UNPROCESSED,
                  });
                }
              } else {
                res = {
                  data: { msg: "Error Saving Stock" },
                  status: STATUSCODES.UNPROCESSED,
                };
              }
            }
          })
        );
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.UNPROCESSED };
    }
    return res;
  } catch (error) {
    console.error(error);
    if (error.code == 11000)
      return (res = {
        data: "transNo duplication" + error.message,
        status: STATUSCODES.UNPROCESSED,
      });
    else return (res = { data: error.message, status: STATUSCODES.ERROR });
  }
};
//added on 12/06/23

module.exports.viewpurchaseById = async (req) => {
  try {
    const { purchaseModel } = conn.purchase(req.decode.db);
    const supplierModel = conn.supplier(req.decode.db);
    const { stockModel } = conn.stock(req.decode.db);
    let purchaseExist = await purchaseModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(purchaseExist)) {
      purchaseExist._doc["purchaseDate"] = common_service
        .prescisedateconvert(purchaseExist.purchaseDate)
        .split(" ")[0];
      purchaseExist._doc["expiryDate"] = common_service
        .prescisedateconvert(purchaseExist.expiryDate)
        .split(" ")[0];
      let supplierExist = await supplierModel.findOne({
        _id: purchaseExist.supplierId,
      });
      purchaseExist._doc["supplierName"] = !common_service.isEmpty(
        supplierExist
      )
        ? supplierExist.supplierName
        : null;
      await Promise.all(
        purchaseExist.purchaseInfo.map(async (x) => {
          let stockExist = await stockModel.findOne(
            {
              itemId: x.itemInfo,
              branchId: purchaseExist.branchId,
              // "stock.dimension": req.dimension, //added on 30-08-22//not needed removed on 12-10-22
            },
            {
              "stock.dimension": 1, //added on 12-10-22
              "stock.dimensionStock": 1, //added on 30-08-22
            }
          );

          if (stockExist != null) {
            /* added on 12-10-22 */
            x.dimension = x.type == 2 ? "no dimension" : x.dimension;
            stockExist.stock = stockExist.stock.filter(
              (x) => x.dimension == x.dimension
            );
          }
          let stock = stockExist;
          x.stock = 0;
          if (!isEmpty(stock)) {
            x.stock = stock.stock[0].dimensionStock;
          }
        })
      );
      purchaseExist._doc["purchaseID"] =
        PREFIXES.PURCHASE + purchaseExist.purchaseID;
      res = { data: purchaseExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.addStockAdjustment = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { stockModel, stockLogModel } = conn.stock(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    if (!common_service.isEmpty(req.body)) {
      let newstkAdj = new stockAdjustmentModel({
        fromLoc: req.body.fromLoc,
        toLoc: req.body.toLoc,
        date: new Date(req.body.date).getTime(),
        remarks: req.body.remarks,
        isSameLoc: req.body.isSameLoc,
        glLinkCode: req.body.glLinkCode,
        glCode: req.body.glCode,
        slCode: req.body.slCode,
        ccCode: req.body.ccCode,
        isNegative: req.body.isNegative,
        purchaseInfo: req.body.purchaseInfo,
      });

      let branchExist = await branchModel.findOne({ _id: req.body.fromLoc });
      if (!common_service.isEmpty(branchExist)) {
        newstkAdj.branchId = branchExist.storecode;
      }
      let stockAdjList = await stockAdjustmentModel.find({
        branchId: newstkAdj.branchId,
      });
      if (Array.isArray(stockAdjList) && stockAdjList.length > 0) {
        newstkAdj.transNo = stockAdjList[stockAdjList.length - 1].transNo + 1;
      } else {
        newstkAdj.transNo = 1;
      }
      let data = await newstkAdj.save();
      if (data) {
        if (newstkAdj.isSameLoc == true) {
          for (let i = 0; i < newstkAdj.purchaseInfo.length; i++) {
            const element = newstkAdj.purchaseInfo[i];
            if (element.shareQty == element.adjQty) {
              element.status = STOCKADJUSTMENTSTATUS.COM;
            }
            let stockdataFrm = {
              itemType: element.itemType,
              itemId: element.itemId,
              branchId: branchExist.storeCode,
              dimension: element.dimension,
              stock: element.adjQty,
              rate: element.unitCost,
            };
            stockdataFrm.stock =
              element.isNegative == true ? -element.adjQty : element.adjQty;
            let stockExist = await stockModel.findOne({
              itemId: stockdataFrm.itemId,
              branchId: stockdataFrm.branchId,
            });

            if (!common_service.isEmpty(stockExist)) {
              let stockFind = stockExist.stock.find(
                (x) => x.dimension == stockdataFrm.dimension
              );
              if (stockFind) {
                if (stockFind.dimensionStock == 0 && stockdataFrm.stock < 0) {
                  return (res = {
                    data: { msg: `Item Stock is ${stockFind.dimensionStock}` },
                    status: STATUSCODES.FORBIDDEN,
                  });
                } else {
                  stockFind.dimensionStock =
                    stockFind.dimensionStock + stockdataFrm.stock;
                }
              } else {
                stockExist.stock.push({
                  dimension: stockdataFrm.dimension,
                  dimensionStock: stockdataFrm.stock,
                });
              }
              let data = await stockExist.save();
              if (!common_service.isEmpty(data)) {
                let product = {};
                if (stockdataFrm.itemType == 0) {
                  product = await productModel.findOne({
                    _id: stockdataFrm.itemId,
                  });
                }
                if (stockdataFrm.itemType == 1) {
                  product = await foodModel.findOne({
                    _id: stockdataFrm.itemId,
                  });
                }
                let stockLogData = new stockLogModel({
                  itemType: stockdataFrm.itemType,
                  itemId: stockdataFrm.itemId,
                  stock: [
                    {
                      dimension: stockdataFrm.dimension,
                      dimensionStock: stockdataFrm.stock,
                    },
                  ],
                  branchId: stockdataFrm.branchId,
                  date: new Date(newstkAdj.date).getTime(),
                  orderNo: newstkAdj.transNo,
                  type: PREFIXES.STOCKADJUSTMENT,
                  categoryId: !common_service.isEmpty(product)
                    ? product.category
                    : null /* added on 06-03-24 */,
                  subCategoryId:
                    !common_service.isEmpty(product) &&
                    stockdataFrm.itemType != 0
                      ? product.subcategoryId
                      : null /* added on 06-03-24 */,
                  rate: stockdataFrm.rate /* added on 28-03-23 */,
                });
                /* ends here */
                let data1 = await stockLogData.save();
                if (common_service.isEmpty(data1)) {
                  return (res = {
                    data: { msg: "Error Saving Stock Updation To Log" },
                    status: STATUSCODES.UNPROCESSED,
                  });
                }
              } else {
                return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
              }
            } else {
              let newStock = new stockModel({
                itemType: stockdataFrm.itemType,
                itemId: stockdataFrm.itemId,
                stock: [
                  {
                    dimension: stockdataFrm.dimension,
                    dimensionStock: stockdataFrm.stock,
                  },
                ],
                branchId: stockdataFrm.branchId,
              });
              let data = await newStock.save();
              if (!common_service.isEmpty(data)) {
                let product = {};
                if (stockdataFrm.itemType == 0) {
                  product = await productModel.findOne({
                    _id: stockdataFrm.itemId,
                  });
                }
                if (stockdataFrm.itemType == 1) {
                  product = await foodModel.findOne({
                    _id: stockdataFrm.itemId,
                  });
                }

                let stockLogData = new stockLogModel({
                  itemType: stockdataFrm.itemType,
                  itemId: stockdataFrm.itemId,
                  stock: newStock.stock,
                  branchId: stockdataFrm.branchId,
                  date: new Date(newstkAdj.date).getTime(),
                  orderNo: newstkAdj.transNo,
                  type: PREFIXES.STOCKADJUSTMENT,
                  categoryId: !common_service.isEmpty(product)
                    ? product.category
                    : null /* added on 06-03-24 */,
                  subCategoryId:
                    !common_service.isEmpty(product) &&
                    stockdataFrm.itemType != 0
                      ? product.subcategoryId
                      : null /* added on 06-03-24 */,
                  rate: stockdataFrm.rate /* added on 28-03-23 */,
                });
                let data1 = await stockLogData.save();
                if (common_service.isEmpty(data1)) {
                  return (res = {
                    data: { msg: "Error Saving Stock Updation To Log" },
                    status: STATUSCODES.UNPROCESSED,
                  });
                }
              } else {
                return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
              }
            }
          }
          let completedList = newstkAdj.purchaseInfo.filter(
            (x) => x.status == STOCKADJUSTMENTSTATUS.COM
          );
          if (newstkAdj.purchaseInfo.length == completedList.length) {
            newstkAdj.status = STOCKADJUSTMENTSTATUS.COM;
          } else {
            newstkAdj.status = STOCKADJUSTMENTSTATUS.PEN;
          }
        } else {
          newstkAdj.status = STOCKADJUSTMENTSTATUS.PEN;
        }
        await newstkAdj.save();
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.PURCHASEMANAGE_STOCKADJADD.type,
          description: LOG.PURCHASEMANAGE_STOCKADJADD.description,
          branchId: req.body.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: data, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.viewPurchases = async (req) => {
  try {
    req.body.index = parseInt(req.body.index) * 20;
    const { purchaseModel } = conn.purchase(req.decode.db);
    const supplierModel = conn.supplier(req.decode.db);
    const { branchModel } = conn.location(req.decode.db);
    const { stockModel } = conn.stock(req.decode.db);
    var purchaseList = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        purchaseList = await purchaseModel
          .find({
            branchId: req.body.branchId,
          })
          .skip(req.body.index)
          .limit(30);
      } else {
        purchaseList = await purchaseModel
          .find({})
          .skip(req.body.index)
          .limit(30);
      }
    } else {
      purchaseList = await purchaseModel
        .find({ branchId: req.body.branchId })
        .skip(req.body.index)
        .limit(30);
    }
    for (let i = 0; i < purchaseList.length; i++) {
      const element = purchaseList[i];
      element._doc["purchaseDate"] = common_service
        .prescisedateconvert(element.purchaseDate)
        .split(" ")[0];
      element._doc["expiryDate"] = common_service
        .prescisedateconvert(element.expiryDate)
        .split(" ")[0];
      element._doc["locationName"] = "no location";
      element._doc["supplierName"] = "no name";
      if (Array.isArray(element.purchaseInfo)) {
        for (let j = 0; j < element.purchaseInfo.length; j++) {
          const prdelement = element.purchaseInfo[j];
          let stock = await stockModel.findOne({ itemId: prdelement.itemInfo });
          prdelement.stock = [];
          if (common_service.checkObject(stock)) {
            prdelement.stock = stock;
          }
        }
      }
      let branchExist = await branchModel.findOne({ _id: element.location });
      element._doc["PURCHASEID"] =
        PREFIXES.PURCHASE +
        element.branchId.substring(3, 5) +
        element.purchaseID;
      if (common_service.checkObject(branchExist)) {
        element._doc["locationName"] = branchExist.branchName;
      }
      let supplierExist = await supplierModel.findOne({
        _id: element.supplierId,
      });
      if (common_service.checkObject(supplierExist)) {
        element._doc["supplierName"] = supplierExist.supplierName;
      }
    }
    return (res = { data: purchaseList, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 14/06/23
module.exports.recieveStock = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  const { stockModel, stockLogModel } = conn.stock(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let stkAdjExist = await stockAdjustmentModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(stkAdjExist)) {
      stkAdjExist.purchaseInfo = req.body.purchaseInfo;
      if (Array.isArray(stkAdjExist.purchaseInfo)) {
        for (let i = 0; i < stkAdjExist.purchaseInfo.length; i++) {
          const element = stkAdjExist.purchaseInfo[i];
          if (element.shareQty == element.adjQty) {
            element.status = STOCKADJUSTMENTSTATUS.COM;
            let toBranch = await branchModel.findOne({
              _id: stkAdjExist.toLoc,
            });
            if (toBranch && toBranch.storecode.length > 0) {
              if (element.isNegative == true) {
                let stockdataFrm = {
                  itemType: element.itemType,
                  itemId: element.itemId,
                  stock: -element.adjQty,
                  branchId: stkAdjExist.branchId,
                  dimension: element.dimension,
                  rate: element.unitCost,
                };

                // if (stockdataFrm.itemType == 2) {
                //   stockdataFrm.dimension = "no dimension";
                // }
                let stockExist = await stockModel.findOne({
                  itemId: stockdataFrm.itemId,
                  branchId: stockdataFrm.branchId,
                });
                if (!common_service.isEmpty(stockExist)) {
                  let stockFind = stockExist.stock.find(
                    (x) => x.dimension == stockdataFrm.dimension
                  );
                  if (!common_service.isEmpty(stockFind)) {
                    if (
                      stockFind.dimensionStock == 0 &&
                      stockdataFrm.stock < 0
                    ) {
                      return (res = {
                        data: {
                          msg: `Item Stock is ${stockFind.dimensionStock}`,
                        },
                        status: STATUSCODES.FORBIDDEN,
                      });
                    } else {
                      stockFind.dimensionStock =
                        stockFind.dimensionStock + stockdataFrm.stock;
                    }
                  } else {
                    stockExist.stock.push({
                      dimension: stockdataFrm.dimension,
                      dimensionStock: stockdataFrm.stock,
                    });
                  }
                  let stockdataresponse = await stockExist.save();
                  if (stockdataresponse) {
                    let product = {};
                    if (stockdataFrm.itemType == 0) {
                      product = await productModel.findOne({
                        _id: stockdataFrm.itemId,
                      });
                    }
                    if (stockdataFrm.itemType == 1) {
                      product = await foodModel.findOne({
                        _id: stockdataFrm.itemId,
                      });
                    }

                    let stockLogData = new stockLogModel({
                      itemType: stockdataFrm.itemType,
                      itemId: stockdataFrm.itemId,
                      stock: [
                        {
                          dimension: stockdataFrm.dimension,
                          dimensionStock: stockdataFrm.stock,
                        },
                      ],
                      branchId: stockdataFrm.branchId,
                      date: new Date(req.body.date).getTime(),
                      orderNo: stkAdjExist.transNo,
                      type: PREFIXES.STOCKADJUSTMENT,
                      categoryId: !common_service.isEmpty(product)
                        ? product.category
                        : null,
                      subCategoryId:
                        !common_service.isEmpty(product) &&
                        stockdataFrm.itemType != 2
                          ? product.subcategoryId
                          : null,
                      rate: stockdataFrm.rate,
                    });
                    / ends here /;
                    let stocklogdataresponse = await stockLogData.save();
                    if (common_service.isEmpty(stocklogdataresponse)) {
                      return (res = {
                        data: { msg: "Error Saving Stock Updation To Log" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  } else {
                    res = {
                      data: { msg: "Error Saving Stock" },
                      status: STATUSCODES.UNPROCESSED,
                    };
                  }
                } else {
                  let newStock = new stockModel({
                    itemType: stockdataFrm.itemType,
                    itemId: stockdataFrm.itemId,
                    stock: [
                      {
                        dimension: stockdataFrm.dimension,
                        dimensionStock: stockdataFrm.stock,
                      },
                    ],
                    branchId: stockdataFrm.branchId,
                  });
                  let stockdataresponse = await newStock.save();
                  if (stockdataresponse) {
                    let product = {};
                    if (stockdataFrm.itemType == 0) {
                      product = await productModel.findOne({
                        _id: stockdataFrm.itemId,
                      });
                    }
                    if (stockdataFrm.itemType == 1) {
                      product = await foodModel.findOne({
                        _id: stockdataFrm.itemId,
                      });
                    }

                    let stockLogData = new stockLogModel({
                      itemType: stockdataFrm.itemType,
                      itemId: stockdataFrm.itemId,
                      stock: newStock.stock,
                      branchId: stockdataFrm.branchId,
                      date: new Date(req.body.date).getTime(),
                      orderNo: stkAdjExist.transNo,
                      type: PREFIXES.STOCKADJUSTMENT,
                      categoryId: !common_service.isEmpty(product)
                        ? product.category
                        : null,
                      subCategoryId:
                        !common_service.isEmpty(product) &&
                        stockdataFrm.itemType != 2
                          ? product.subcategoryId
                          : null,
                      rate: stockdataFrm.rate,
                    });
                    let stocklogdataresponse = await stockLogData.save();
                    if (common_service.isEmpty(stocklogdataresponse)) {
                      return (res = {
                        data: { msg: "Error Saving Stock Updation To Log" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  } else {
                    res = {
                      data: { msg: "Error Saving Stock" },
                      status: STATUSCODES.UNPROCESSED,
                    };
                  }
                }
              } else {
                let stockdata = {
                  itemType: element.itemType,
                  itemId: element.itemId,
                  stock: element.adjQty,
                  branchId: toBranch.storecode,
                  dimension: element.dimension,
                  rate: element.unitCost,
                };
                let stockdataFrm = {
                  itemType: element.itemType,
                  itemId: element.itemId,
                  stock: -element.adjQty,
                  branchId: stkAdjExist.branchId,
                  dimension: element.dimension,
                  rate: element.unitCost,
                };
                let stockExist = await stockModel.findOne({
                  itemId: stockdata.itemId,
                  branchId: stockdata.branchId,
                });
                if (!common_service.isEmpty(stockExist)) {
                  let stockFind = stockExist.stock.find(
                    (x) => x.dimension == stockdata.dimension
                  );
                  if (!common_service.isEmpty(stockFind)) {
                    if (stockFind.dimensionStock == 0 && stockdata.stock < 0) {
                      return (res = {
                        data: {
                          msg: `Item Stock is ${stockFind.dimensionStock}`,
                        },
                        status: STATUSCODES.FORBIDDEN,
                      });
                    } else {
                      stockFind.dimensionStock =
                        stockFind.dimensionStock + stockdata.stock;
                    }
                  } else {
                    stockExist.stock.push({
                      dimension: stockdata.dimension,
                      dimensionStock: stockdata.stock,
                    });
                  }
                  let stockdataresponse = await stockExist.save();
                  if (stockdataresponse) {
                    let product = {};
                    if (stockdata.itemType == 0) {
                      product = await productModel.findOne({
                        _id: stockdata.itemId,
                      });
                    }
                    if (stockdata.itemType == 1) {
                      product = await foodModel.findOne({
                        _id: stockdata.itemId,
                      });
                    }

                    let stockLogData = new stockLogModel({
                      itemType: stockdata.itemType,
                      itemId: stockdata.itemId,
                      stock: [
                        {
                          dimension: stockdata.dimension,
                          dimensionStock: stockdata.stock,
                        },
                      ],
                      branchId: stockdata.branchId,
                      date: new Date().getTime(),
                      orderNo: stkAdjExist.transNo,
                      type: PREFIXES.STOCKADJUSTMENT,

                      categoryId: !common_service.isEmpty(product)
                        ? product.category
                        : null /* added on 06-03-23 */,
                      subCategoryId:
                        !common_service.isEmpty(product) &&
                        stockdata.itemType != 2
                          ? product.subcategoryId
                          : null,
                      rate: stockdata.rate,
                    });
                    / ends here /;
                    let stocklogdataresponse = await stockLogData.save();
                    if (common_service.isEmpty(stocklogdataresponse)) {
                      return (res = {
                        data: { msg: "Error Saving Stock Updation To Log" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  } else {
                    res = {
                      data: { msg: "Error Saving Stock" },
                      status: STATUSCODES.UNPROCESSED,
                    };
                  }
                } else {
                  let newStock = new stockModel({
                    itemType: stockdata.itemType,
                    itemId: stockdata.itemId,
                    stock: [
                      {
                        dimension: stockdata.dimension,
                        dimensionStock: stockdata.stock,
                      },
                    ],
                    branchId: stockdata.branchId,
                  });
                  let stockdataresponse = await newStock.save();
                  if (stockdataresponse) {
                    let product = {};
                    if (stockdataFrm.itemType == 0) {
                      product = await productModel.findOne({
                        _id: stockdataFrm.itemId,
                      });
                    }
                    if (stockdataFrm.itemType == 1) {
                      product = await foodModel.findOne({
                        _id: stockdataFrm.itemId,
                      });
                    }

                    let stockLogData = new stockLogModel({
                      itemType: stockdata.itemType,
                      itemId: stockdata.itemId,
                      stock: newStock.stock,
                      branchId: stockdata.branchId,
                      date: new Date().getTime(),
                      orderNo: stkAdjExist.transNo,
                      type: PREFIXES.STOCKADJUSTMENT,

                      categoryId: !common_service.isEmpty(product)
                        ? product.category
                        : null /* added on 06-03-24 */,

                      subCategoryId:
                        !common_service.isEmpty(product) &&
                        stockdata.itemType != 2
                          ? product.subcategoryId
                          : null,
                      rate: stockdata.rate,
                    });
                    let stocklogdataresponse = await stockLogData.save();
                    if (common_service.isEmpty(stocklogdataresponse)) {
                      return (res = {
                        data: { msg: "Error Saving Stock Updation To Log" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  } else {
                    res = {
                      data: { msg: "Error Saving Stock" },
                      status: STATUSCODES.UNPROCESSED,
                    };
                  }
                }
                if (stockdataFrm.itemType == 2) {
                  stockdataFrm.dimension = "no dimension";
                }
                let stockExist1 = await stockModel.findOne({
                  itemId: stockdataFrm.itemId,
                  branchId: stockdataFrm.branchId,
                });
                if (!common_service.isEmpty(stockExist1)) {
                  let stockFind = stockExist1.stock.find(
                    (x) => x.dimension == stockdataFrm.dimension
                  );
                  if (!common_service.isEmpty(stockFind)) {
                    if (
                      stockFind.dimensionStock == 0 &&
                      stockdataFrm.stock < 0
                    ) {
                      return (res = {
                        data: {
                          msg: `Item Stock is ${stockFind.dimensionStock}`,
                        },
                        status: STATUSCODES.FORBIDDEN,
                      });
                    } else {
                      stockFind.dimensionStock =
                        stockFind.dimensionStock + stockdataFrm.stock;
                    }
                  } else {
                    stockExist1.stock.push({
                      dimension: stockdataFrm.dimension,
                      dimensionStock: stockdataFrm.stock,
                    });
                  }
                  let stockdataresponse = await stockExist1.save();
                  if (stockdataresponse) {
                    let product = {};
                    if (stockdataFrm.itemType == 0) {
                      product = await productModel.findOne({
                        _id: stockdataFrm.itemId,
                      });
                    }
                    if (stockdataFrm.itemType == 1) {
                      product = await foodModel.findOne({
                        _id: stockdataFrm.itemId,
                      });
                    }

                    let stockLogData = new stockLogModel({
                      itemType: stockdataFrm.itemType,
                      itemId: stockdataFrm.itemId,
                      stock: [
                        {
                          dimension: stockdataFrm.dimension,
                          dimensionStock: stockdataFrm.stock,
                        },
                      ],
                      branchId: stockdataFrm.branchId,
                      date: new Date(req.body.date).getTime(),
                      orderNo: stkAdjExist.transNo,
                      type: PREFIXES.STOCKADJUSTMENT,
                      categoryId: !common_service.isEmpty(product)
                        ? product.category
                        : null,
                      subCategoryId:
                        !common_service.isEmpty(product) &&
                        stockdataFrm.itemType != 2
                          ? product.subcategoryId
                          : null,
                      rate: stockdataFrm.rate,
                    });

                    let stocklogdataresponse = await stockLogData.save();
                    if (common_service.isEmpty(stocklogdataresponse)) {
                      return (res = {
                        data: { msg: "Error Saving Stock Updation To Log" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  } else {
                    res = {
                      data: { msg: "Error Saving Stock" },
                      status: STATUSCODES.UNPROCESSED,
                    };
                  }
                } else {
                  let newStock = new stockModel({
                    itemType: stockdataFrm.itemType,
                    itemId: stockdataFrm.itemId,
                    stock: [
                      {
                        dimension: stockdataFrm.dimension,
                        dimensionStock: stockdataFrm.stock,
                      },
                    ],
                    branchId: stockdataFrm.branchId,
                  });
                  let stockdataresponse = await newStock.save();
                  if (stockdataresponse) {
                    let product = {};
                    if (stockdataFrm.itemType == 0) {
                      product = await productModel.findOne({
                        _id: stockdataFrm.itemId,
                      });
                    }
                    if (stockdataFrm.itemType == 1) {
                      product = await foodModel.findOne({
                        _id: stockdataFrm.itemId,
                      });
                    }

                    let stockLogData = new stockLogModel({
                      itemType: stockdataFrm.itemType,
                      itemId: stockdataFrm.itemId,
                      stock: newStock.stock,
                      branchId: stockdataFrm.branchId,
                      date: new Date(req.body.date).getTime(),
                      orderNo: stkAdjExist.transNo,
                      type: PREFIXES.STOCKADJUSTMENT,
                      categoryId: !common_service.isEmpty(product)
                        ? product.category
                        : null,
                      subCategoryId:
                        !common_service.isEmpty(product) &&
                        stockdataFrm.itemType != 2
                          ? product.subcategoryId
                          : null,
                      rate: stockdataFrm.rate,
                    });
                    let stocklogdataresponse = await stockLogData.save();
                    if (common_service.isEmpty(stocklogdataresponse)) {
                      return (res = {
                        data: { msg: "Error Saving Stock Updation To Log" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  } else {
                    res = {
                      data: { msg: "Error Saving Stock" },
                      status: STATUSCODES.UNPROCESSED,
                    };
                  }
                }
              }
            } else {
              return (res = {
                data: { msg: "Invalid Or No Existing To Branch" },
                status: STATUSCODES.UNPROCESSED,
              });
            }
          } else {
            element.status = STOCKADJUSTMENTSTATUS.REC;
          }
        }
        let confirmList = stkAdjExist.purchaseInfo.filter(
          (x) => x.status == STOCKADJUSTMENTSTATUS.COM
        );
        if (stkAdjExist.purchaseInfo.length == confirmList.length) {
          stkAdjExist.status = STOCKADJUSTMENTSTATUS.COM;
        } else {
          stkAdjExist.status = STOCKADJUSTMENTSTATUS.CON;
        }
        let data = await stkAdjExist.save();
        if (data) {
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        return (res = {
          data: { msg: "Improper data structure" },
          status: STATUSCODES.UNPROCESSED,
        });
      }
    } else {
      res = { data: { msg: "Not found" }, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 19-06-23
module.exports.confirmStock = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  const { stockModel, stockLogModel } = conn.stock(req.decode.db);
  try {
    let stkAdjExist = await stockAdjustmentModel.findOne({
      _id: req.body._id,
      "purchaseInfo.status": STOCKADJUSTMENTSTATUS.REC,
    });
    if (!isEmpty(stkAdjExist)) {
      if (
        Array.isArray(req.body.purchaseInfo) &&
        req.body.purchaseInfo.length > 0
      ) {
        for (let i = 0; i < req.body.purchaseInfo.length; i++) {
          const element = req.body.purchaseInfo[i];
          if (element._id.length == 24) {
            let index = stkAdjExist.purchaseInfo.findIndex(
              (x) => x._id == element._id
            );
            if (index != -1) {
              stkAdjExist.purchaseInfo[index] = element;
            } else {
              res = {
                data: { msg: `No data found in id:${element._id}` },
                status: STATUSCODES.UNPROCESSED,
              };
            }
          }
        }
        if (
          Array.isArray(stkAdjExist.purchaseInfo) &&
          stkAdjExist.purchaseInfo.length > 0
        ) {
          for (let i = 0; i < stkAdjExist.purchaseInfo.length; i++) {
            const element = stkAdjExist.purchaseInfo[i];
            if (element.shareQty == element.adjQty) {
              element.status = STOCKADJUSTMENTSTATUS.COM;
              let toBranch = {};
              if (common_service.isObjectId(stkAdjExist.toLoc)) {
                toBranch = await branchModel.findOne({
                  _id: stkAdjExist.toLoc,
                });
              }
              if (!common_service.isEmpty(toBranch)) {
                if (element.isNegative == true) {
                  let stockdataFrm = {
                    itemType: element.itemType,
                    itemId: element.itemId,
                    stock: -element.adjQty,
                    branchId: stkAdjExist.branchId,
                    dimension: element.dimension,
                    rate: element.unitCost /* added on 28-03-23 */,
                  };
                  let stockExist = await stockModel.findOne({
                    itemId: stockdataFrm.itemId,
                    branchId: stockdataFrm.branchId,
                  });

                  if (!common_service.isEmpty(stockExist)) {
                    let stockFind = stockExist.stock.find(
                      (x) => x.dimension == stockdataFrm.dimension
                    );
                    if (!common_service.isEmpty(stockFind)) {
                      if (
                        stockFind.dimensionStock == 0 &&
                        stockdataFrm.stock < 0
                      ) {
                        return (res = {
                          data: {
                            msg: `Item Stock is ${stockFind.dimensionStock}`,
                          },
                          status: STATUSCODES.FORBIDDEN,
                        });
                      } else {
                        stockFind.dimensionStock =
                          stockFind.dimensionStock + stockdataFrm.stock;
                      }
                    } else {
                      stockExist.stock.push({
                        dimension: stockdataFrm.dimension,
                        dimensionStock: stockdataFrm.stock,
                      });
                    }
                    let stockdataresponse = await stockExist.save();
                    if (stockdataresponse) {
                      let product = {};
                      if (stockdataFrm.itemType == 0) {
                        product = await productModel.findOne({
                          _id: stockdataFrm.itemId,
                        });
                      }
                      if (stockdataFrm.itemType == 1) {
                        product = await foodModel.findOne({
                          _id: stockdataFrm.itemId,
                        });
                      }

                      let stockLogData = new stockLogModel({
                        itemType: stockdataFrm.itemType,
                        itemId: stockdataFrm.itemId,
                        stock: [
                          {
                            dimension: stockdataFrm.dimension,
                            dimensionStock: stockdataFrm.stock,
                          },
                        ],
                        branchId: stockdataFrm.branchId,
                        date: new Date(req.body.date).getTime(),
                        orderNo: stkAdjExist.transNo,
                        type: PREFIXES.STOCKADJUSTMENT,
                        categoryId: !isEmpty(product)
                          ? product.category
                          : null /* added on 06-03-24 */,
                        subCategoryId:
                          !isEmpty(product) && stockdataFrm.itemType != 2
                            ? product.subcategoryId
                            : null /* added on 06-03-24 */,
                        rate: stockdataFrm.rate /* added on 28-03-23 */,
                      });
                      /* ends here */
                      let stocklogdataresponse = await stockLogData.save();
                      if (common_service.isEmpty(stocklogdataresponse)) {
                        return (res = {
                          data: { msg: "Error Saving Stock Updation To Log" },
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    } else {
                      res = {
                        data: { msg: "Error Saving Stock" },
                        status: STATUSCODES.UNPROCESSED,
                      };
                    }
                  } else {
                    let newStock = new stockModel({
                      itemType: stockdataFrm.itemType,
                      itemId: stockdataFrm.itemId,
                      stock: [
                        {
                          dimension: stockdataFrm.dimension,
                          dimensionStock: stockdataFrm.stock,
                        },
                      ],
                      branchId: stockdataFrm.branchId,
                    });
                    let stockdataresponse = await newStock.save();
                    if (stockdataresponse) {
                      let product = {};
                      if (stockdataFrm.itemType == 0) {
                        product = await productModel.findOne({
                          _id: stockdataFrm.itemId,
                        });
                      }
                      if (stockdataFrm.itemType == 1) {
                        product = await foodModel.findOne({
                          _id: stockdataFrm.itemId,
                        });
                      }

                      let stockLogData = new stockLogModel({
                        itemType: stockdataFrm.itemType,
                        itemId: stockdataFrm.itemId,
                        stock: newStock.stock,
                        branchId: stockdataFrm.branchId,
                        date: new Date(req.body.date).getTime(),
                        orderNo: stkAdjExist.transNo,
                        type: PREFIXES.STOCKADJUSTMENT,
                        categoryId: !common_service.isEmpty(product)
                          ? product.category
                          : null /* added on 06-03-24 */,
                        subCategoryId:
                          !common_service.isEmpty(product) &&
                          stockdataFrm.itemType != 2
                            ? product.subcategoryId
                            : null /* added on 06-03-24 */,
                        rate: stockdataFrm.rate /* added on 28-03-23 */,
                      });
                      let stocklogdataresponse = await stockLogData.save();
                      if (common_service.isEmpty(stocklogdataresponse)) {
                        return (res = {
                          data: { msg: "Error Saving Stock Updation To Log" },
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    } else {
                      res = {
                        data: { msg: "Error Saving Stock" },
                        status: STATUSCODES.UNPROCESSED,
                      };
                    }
                  }
                } else {
                  let stockdata = {
                    itemType: element.itemType,
                    itemId: element.itemId,
                    stock: element.adjQty,
                    branchId: toBranch.storecode,
                    dimension: element.dimension,
                    rate: element.unitCost /* 28-03-23 */,
                  };
                  if (stockdata.itemType == 2) {
                    stockdata.dimension = "no dimension";
                  }
                  let stockExist1 = await stockModel.findOne({
                    itemId: stockdata.itemId,
                    branchId: stockdata.branchId,
                  });
                  if (!common_service.isEmpty(stockExist1)) {
                    let stockFind = stockExist1.stock.find(
                      (x) => x.dimension == stockdata.dimension
                    );
                    if (!common_service.isEmpty(stockFind)) {
                      if (
                        stockFind.dimensionStock == 0 &&
                        stockdata.stock < 0
                      ) {
                        return (res = {
                          data: {
                            msg: `Item Stock is ${stockFind.dimensionStock}`,
                          },
                          status: STATUSCODES.FORBIDDEN,
                        });
                      } else {
                        stockFind.dimensionStock =
                          stockFind.dimensionStock + stockdata.stock;
                      }
                    } else {
                      stockExist1.stock.push({
                        dimension: stockdata.dimension,
                        dimensionStock: stockdata.stock,
                      });
                    }
                    let stockdataresponse = await stockExist1.save();
                    if (stockdataresponse) {
                      if (stockdata.itemType == 0) {
                        product = await productModel.findOne({
                          _id: stockdata.itemId,
                        });
                      }
                      if (stockdata.itemType == 1) {
                        product = await foodModel.findOne({
                          _id: stockdata.itemId,
                        });
                      }

                      let stockLogData = new stockLogModel({
                        itemType: stockdata.itemType,
                        itemId: stockdata.itemId,
                        stock: [
                          {
                            dimension: stockdata.dimension,
                            dimensionStock: stockdata.stock,
                          },
                        ],
                        branchId: stockdata.branchId,
                        date: new Date().getTime(),
                        orderNo: stkAdjExist.transNo,
                        type: PREFIXES.STOCKADJUSTMENT,
                        categoryId: !common_service.isEmpty(product)
                          ? product.category
                          : null /* added on 06-03-24 */,
                        subCategoryId:
                          !common_service.isEmpty(product) &&
                          stockdata.itemType != 2
                            ? product.subcategoryId
                            : null /* added on 06-03-24 */,
                        rate: stockdata.rate /* added on 28-03-23 */,
                      });
                      /* ends here */
                      let stocklogdataresponse = await stockLogData.save();
                      if (common_service.isEmpty(stocklogdataresponse)) {
                        return (res = {
                          data: { msg: "Error Saving Stock Updation To Log" },
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    } else {
                      res = {
                        data: { msg: "Error Saving Stock" },
                        status: STATUSCODES.UNPROCESSED,
                      };
                    }
                  } else {
                    let newStock = new stockModel({
                      itemType: stockdata.itemType,
                      itemId: stockdata.itemId,
                      stock: [
                        {
                          dimension: stockdata.dimension,
                          dimensionStock: stockdata.stock,
                        },
                      ],
                      branchId: stockdata.branchId,
                    });
                    let stockdataresponse = await newStock.save();
                    if (stockdataresponse) {
                      let product = {};
                      if (stockdata.itemType == 0) {
                        product = await productModel.findOne({
                          _id: stockdata.itemId,
                        });
                      }
                      if (stockdata.itemType == 1) {
                        product = await foodModel.findOne({
                          _id: stockdata.itemId,
                        });
                      }

                      let stockLogData = new stockLogModel({
                        itemType: stockdata.itemType,
                        itemId: stockdata.itemId,
                        stock: newStock.stock,
                        branchId: stockdata.branchId,
                        date: new Date().getTime(),
                        orderNo: stkAdjExist.transNo,
                        type: PREFIXES.STOCKADJUSTMENT,
                        categoryId: !common_service.isEmpty(product)
                          ? product.category
                          : null /* added on 06-03-24 */,
                        subCategoryId:
                          !common_service.isEmpty(product) &&
                          stockdata.itemType != 2
                            ? product.subcategoryId
                            : null /* added on 06-03-24 */,
                        rate: stockdata.rate /* added on 28-03-23 */,
                      });
                      let stocklogdataresponse = await stockLogData.save();
                      if (common_service.isEmpty(stocklogdataresponse)) {
                        return (res = {
                          data: { msg: "Error Saving Stock Updation To Log" },
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    } else {
                      res = {
                        data: { msg: "Error Saving Stock" },
                        status: STATUSCODES.UNPROCESSED,
                      };
                    }
                  }
                  let stockdataFrm = {
                    itemType: element.itemType,
                    itemId: element.itemId,
                    stock: -element.adjQty,
                    branchId: stkAdjExist.branchId,
                    dimension: element.dimension,
                    rate: element.unitCost /* 28-03-23 */,
                  };
                  if (stockdataFrm.itemType == 2) {
                    stockdataFrm.dimension = "no dimension";
                  }
                  let stockExist = await stockModel.findOne({
                    itemId: stockdataFrm.itemId,
                    branchId: stockdataFrm.branchId,
                  });
                  if (!common_service.isEmpty(stockExist)) {
                    let stockFind = stockExist.stock.find(
                      (x) => x.dimension == stockdataFrm.dimension
                    );

                    if (!common_service.isEmpty(stockFind)) {
                      if (
                        stockFind.dimensionStock == 0 &&
                        stockdataFrm.stock < 0
                      ) {
                        return (res = {
                          data: {
                            msg: `Item Stock is ${stockFind.dimensionStock}`,
                          },
                          status: STATUSCODES.FORBIDDEN,
                        });
                      } else {
                        stockFind.dimensionStock =
                          stockFind.dimensionStock + stockdataFrm.stock;
                      }
                    } else {
                      stockExist.stock.push({
                        dimension: stockdataFrm.dimension,
                        dimensionStock: stockdataFrm.stock,
                      });
                    }
                    let stockdataresponse = await stockExist.save();
                    if (stockdataresponse) {
                      let product = {};
                      if (stockdataFrm.itemType == 0) {
                        product = await productModel.findOne({
                          _id: stockdataFrm.itemId,
                        });
                      }
                      if (stockdataFrm.itemType == 1) {
                        product = await foodModel.findOne({
                          _id: stockdataFrm.itemId,
                        });
                      }

                      let stockLogData = new stockLogModel({
                        itemType: stockdataFrm.itemType,
                        itemId: stockdataFrm.itemId,
                        stock: [
                          {
                            dimension: stockdataFrm.dimension,
                            dimensionStock: stockdataFrm.stock,
                          },
                        ],
                        branchId: stockdataFrm.branchId,
                        date: new Date().getTime(),
                        orderNo: stkAdjExist.transNo,
                        type: PREFIXES.STOCKADJUSTMENT,
                        categoryId: !common_service.isEmpty(product)
                          ? product.category
                          : null /* added on 06-03-24 */,
                        subCategoryId:
                          !common_service.isEmpty(product) &&
                          stockdataFrm.itemType != 2
                            ? product.subcategoryId
                            : null /* added on 06-03-24 */,
                        rate: stockdataFrm.rate /* added on 28-03-23 */,
                      });
                      /* ends here */
                      let stocklogdataresponse = await stockLogData.save();
                      if (common_service.isEmpty(stocklogdataresponse)) {
                        return (res = {
                          data: { msg: "Error Saving Stock Updation To Log" },
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    } else {
                      res = {
                        data: { msg: "Error Saving Stock" },
                        status: STATUSCODES.UNPROCESSED,
                      };
                    }
                  } else {
                    let newStock = new stockModel({
                      itemType: stockdataFrm.itemType,
                      itemId: stockdataFrm.itemId,
                      stock: [
                        {
                          dimension: stockdataFrm.dimension,
                          dimensionStock: stockdataFrm.stock,
                        },
                      ],
                      branchId: stockdataFrm.branchId,
                    });
                    let stockdataresponse = await newStock.save();
                    if (stockdataresponse) {
                      let product = {};
                      if (stockdataFrm.itemType == 0) {
                        product = await productModel.findOne({
                          _id: stockdataFrm.itemId,
                        });
                      }
                      if (stockdataFrm.itemType == 1) {
                        product = await foodModel.findOne({
                          _id: stockdataFrm.itemId,
                        });
                      }

                      let stockLogData = new stockLogModel({
                        itemType: stockdataFrm.itemType,
                        itemId: stockdataFrm.itemId,
                        stock: newStock.stock,
                        branchId: stockdataFrm.branchId,
                        date: new Date().getTime(),
                        orderNo: stkAdjExist.transNo,
                        type: PREFIXES.STOCKADJUSTMENT,
                        categoryId: !common_service.isEmpty(product)
                          ? product.category
                          : null /* added on 06-03-24 */,
                        subCategoryId:
                          !common_service.isEmpty(product) &&
                          stockdataFrm.itemType != 2
                            ? product.subcategoryId
                            : null /* added on 06-03-24 */,
                        rate: stockdataFrm.rate /* added on 28-03-23 */,
                      });
                      let stocklogdataresponse = await stockLogData.save();
                      if (common_service.isEmpty(stocklogdataresponse)) {
                        return (res = {
                          data: { msg: "Error Saving Stock Updation To Log" },
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    } else {
                      res = {
                        data: { msg: "Error Saving Stock" },
                        status: STATUSCODES.UNPROCESSED,
                      };
                    }
                  }
                }
              } else {
                return (res = {
                  data: { msg: "Invalid Or No Existing To Branch" },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            } else {
              element.status = STOCKADJUSTMENTSTATUS.REC;
            }
          }
          let confirmList = stkAdjExist.purchaseInfo.filter(
            (x) => x.status == STOCKADJUSTMENTSTATUS.COM
          );

          if (stkAdjExist.purchaseInfo.length == confirmList.length) {
            stkAdjExist.status = STOCKADJUSTMENTSTATUS.COM;
          }

          let data = await stkAdjExist.save();
          if (data) {
            res = { data: data, status: STATUSCODES.SUCCESS };
          } else {
            res = { data: {}, status: STATUSCODES.UNPROCESSED };
          }
        } else {
          return (res = {
            data: { msg: "Improper data structure" },
            status: STATUSCODES.UNPROCESSED,
          });
        }
      } else {
        res = { data: {}, status: STATUSCODES.BADREQUEST };
      }
    } else {
      res = {
        data: { msg: "stock adjustment dont exist" },
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 21-06-23
module.exports.draftStkAdj = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    if (!isEmpty(req.body)) {
      let newstkAdj = new stockAdjustmentModel({
        fromLoc: req.body.fromLoc,
        toLoc: req.body.toLoc,
        date: new Date(req.body.date).getTime(),
        remarks: req.body.remarks,
        isSameLoc: req.body.isSameLoc,
        isNegative: req.body.isNegative,
        glLinkCode: req.body.glLinkCode,
        glCode: req.body.glCode,
        slCode: req.body.slCode,
        ccCode: req.body.ccCode,
        purchaseInfo: req.body.purchaseInfo,
        // branchId: req.body.branchId,
        status: STOCKADJUSTMENTSTATUS.DRA,
      });
      /* added on 19-09-22 */
      let branchData = {};
      if (common_service.isObjectId(newstkAdj.fromLoc)) {
        branchData = await branchModel.findOne({ _id: newstkAdj.fromLoc });
      }

      newstkAdj.branchId = !isEmpty(branchData) ? branchData.storecode : null;
      /* ends here */
      let stockAdjList = await stockAdjustmentModel.find({
        branchId: newstkAdj.branchId,
      });
      if (Array.isArray(stockAdjList) && stockAdjList.length > 0) {
        newstkAdj.transNo = stockAdjList[stockAdjList.length - 1].transNo + 1;
      } else {
        newstkAdj.transNo = 1;
      }

      let data = await newstkAdj.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: data, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 21-06-23
module.exports.viewDraftAdj = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let stkAdjList = [];
    if (req.body) {
      if (req.decode.role == ROLES.ADMIN) {
        stkAdjList = !req.body.branchId
          ? await stockAdjustmentModel.find({
              status: STOCKADJUSTMENTSTATUS.DRA,
            })
          : await stockAdjustmentModel.find({
              status: STOCKADJUSTMENTSTATUS.DRA,
              fromLoc: req.body.branchId,
            });
      } else {
        if (req.body.branchId == null) {
          return (res = {
            data: { msg: "Pass BranchId For User Case" },
            status: STATUSCODES.BADREQUEST,
          });
        }
        stkAdjList = await stockAdjustmentModel.find({
          status: STOCKADJUSTMENTSTATUS.DRA,
          fromLoc: req.body.branchId,
        });
      }
      if (Array.isArray(stkAdjList) && stkAdjList.length > 0) {
        for (let i = 0; i < stkAdjList.length; i++) {
          const element = stkAdjList[i];

          let branchExist = await branchModel.findOne({
            _id: element.fromLoc,
          });
          let branchData = await branchModel.findOne({ _id: element.toLoc });
          element._doc["date"] = common_service
            .prescisedateconvert(element.date)
            .split(" ")[0];
          element._doc["fromLocation"] = branchExist
            ? branchExist.branchName
            : "No location";
          element._doc["toLocation"] = branchData
            ? branchData.branchName
            : "No Location";
          element._doc["GlCode"] = element.glCode;
        }
        res = { data: stkAdjList, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: [], status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: [], status: STATUSCODES.UNAUTHORIZED };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 21-06-23
module.exports.viewDraftAdjById = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  try {
    let stockExist = await stockAdjustmentModel.findOne({ _id: req.body._id });
    if (stockExist) {
      stockExist._doc["TRANSACTIONID"] = stockExist
        ? PREFIXES.STOCKADJUSTMENT + stockExist.transNo
        : "No transNo";
      let branchExist = await branchModel.findOne({
        _id: stockExist.fromLoc,
      });
      stockExist._doc["FROMLOCATION"] = stockExist
        ? branchExist.branchName
        : "no location";
      let branchData = await branchModel.findOne({
        _id: stockExist.toLoc,
      });
      stockExist._doc["TOLOCATION"] = stockExist
        ? branchData.branchName
        : "No Location";
      stockExist._doc["DATE"] = stockExist
        ? common_service.prescisedateconvert(stockExist.date).split(" ")[0]
        : "NO date";
      for (let i = 0; i < stockExist.purchaseInfo.length; i++) {
        const element = stockExist.purchaseInfo[i];
        let stockobj = await stockModel.findOne({ itemId: element.itemId });
        element._doc["stock"] = 0;
        if (stockobj != null) {
          if (element.itemType == 0) {
            element._doc["stock"] = stockobj.stock[0].dimensionStock;
          } else {
            let dimension = stockobj.stock.find(
              (x) => x.dimension == element.dimension
            );
            if (dimension != null) {
              element._doc["stock"] = dimension.dimensionStock;
            }
          }
        }
      }
      res = { data: stockExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }

    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.stockAdjustmentList = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    var stockRecievedList = [];
    if (!isEmpty(req.decode)) {
      if (req.body.fromLoc && common_service.isObjectId(req.body.fromLoc)) {
        stockRecievedList = await stockAdjustmentModel.find({
          fromLoc: req.body.fromLoc,
        });
      } else {
        stockRecievedList = await stockAdjustmentModel.find({});
      }

      stockRecievedList = stockRecievedList.filter(
        (x) => x.status != STOCKADJUSTMENTSTATUS.DRA
      );
      if (Array.isArray(stockRecievedList) && stockRecievedList.length > 0) {
        for (let i = 0; i < stockRecievedList.length; i++) {
          const element = stockRecievedList[i];
          element._doc["date"] = common_service
            .prescisedateconvert(element.date)
            .split(" ")[0];

          if (element.branchId) {
            element._doc["transNo"] =
              PREFIXES.STOCKADJUSTMENT +
              element.branchId.substring(3, 5) +
              element.transNo;
          } else {
            element._doc["transNo"] = "No Id";
          }
          let fromLoc = {};
          let toLoc = {};
          if (common_service.isObjectId(element.fromLoc)) {
            fromLoc = await branchModel.findOne({
              _id: element.fromLoc,
            });
          }
          if (common_service.isObjectId(element.toLoc)) {
            toLoc = await branchModel.findOne({
              _id: element.toLoc,
            });
          }
          element._doc["frmBranchName"] = "no fromLoc";
          element._doc["toBranchName"] = "no toloc";
          if (!isEmpty(fromLoc)) {
            element._doc["frmBranchName"] = fromLoc.branchName;
          }
          if (!isEmpty(toLoc)) {
            element._doc["toBranchName"] = toLoc.branchName;
          }
          if (
            Array.isArray(element.purchaseInfo) &&
            element.purchaseInfo.length > 0
          ) {
            for (let j = 0; j < element.purchaseInfo.length; j++) {
              const elem = element.purchaseInfo[j];
              elem._doc["closingstock"] = 0;
              let stockObj = await stockModel.findOne({ itemId: elem.itemId });
              if (!isEmpty(stockObj)) {
                if (elem.itemType == 2) {
                  elem._doc["closingstock"] = stockObj.stock[0].dimensionStock;
                  elem._doc["openingStock"] =
                    elem._doc["closingstock"] - elem.adjQty;
                } else {
                  let dimensionFind = stockObj.stock.find(
                    (y) => y.dimension == elem.dimension
                  );
                  if (!isEmpty(dimensionFind)) {
                    elem._doc["closingstock"] = dimensionFind.dimensionStock;
                    elem._doc["openingStock"] =
                      elem._doc["closingstock"] - elem.adjQty;
                  }
                }
              }
            }
          }
        }
        res = { data: stockRecievedList, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: [], status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: "Internal Server Error", status: STATUSCODES.ERROR });
  }
};

// added on 22-06-23
module.exports.stockAdjustmentListById = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  try {
    let stockobj = await stockAdjustmentModel.findOne({ _id: req.body._id });
    if (stockobj) {
      stockobj._doc["TRANSACTIONID"] = stockobj
        ? PREFIXES.STOCKADJUSTMENT + stockobj.transNo
        : "No transNo";
      let branchExist = await branchModel.findOne({ _id: stockobj.fromLoc });
      stockobj._doc["FROMLOCATION"] = stockobj
        ? branchExist.branchName
        : "NO Location";
      let branchData = await branchModel.findOne({ _id: stockobj.toLoc });
      stockobj._doc["TOLOCATION"] = stockobj
        ? branchData.branchName
        : "No location";
      stockobj._doc["date"] = stockobj
        ? common_service.prescisedateconvert(stockobj.date).split(" ")[0]
        : "No date";
      stockobj._doc["GSTCODE"] = stockobj ? stockobj.slCode : "no Sl code";
      for (let i = 0; i < stockobj.purchaseInfo.length; i++) {
        const element = stockobj.purchaseInfo[i];
        let stockExist = await stockModel.findOne({ itemId: element.itemId });
        element._doc["stock"] = 0;
        if (stockExist != null) {
          if (element.itemType == 0) {
            element._doc["stock"] = stockExist.stock[0].dimensionStock;
          } else {
            let dimension = stockExist.stock.find(
              (x) => x.dimension == element.dimension
            );
            if (dimension != null) {
              element._doc["stock"] = dimension.dimensionStock;
            }
          }
        }
      }
      res = { data: stockobj, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 22-06-23
module.exports.addgrn = async (req) => {
  const { grnModel, purchaseModel, paymentVoucherModel } = conn.purchase(
    req.decode.db
  );
  const { logModel, shiftLogModel, shiftModel } = conn.settings(req.decode.db);
  const { stockModel, stockLogModel } = conn.stock(req.decode.db);
  const { creditModel, paymentModel } = conn.payment(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  try {
    if (!isEmpty(req.body)) {
      let grnExist = await grnModel.findOne({
        purchase_id: req.body.purchase_id,
        status: GRNSTATUS.DRF,
      });
      if (isEmpty(grnExist)) {
        let newgrn = new grnModel({
          purchase_id: req.body.purchase_id,
          supplierId: req.body.supplierId,
          date: new Date(req.body.date).getTime(),
          branchId: req.body.branchId,
          purchaseInfo: req.body.purchaseInfo,
          amount: req.body.amount,
          status: GRNSTATUS.COM, //added on 31-08-22 -> new field initialisation
          invoiceNo: req.body.invoiceNo, // added on 28-10-22
          location: req.body.location, //added on 22-12-22
        });
        let shiftExist = await shiftLogModel.findOne({
          status: SHIFTSTATUS.ACT,
          branchId: newgrn.branchId,
        });
        if (!isEmpty(shiftExist)) {
          newgrn.shiftId = shiftExist.shiftId;
          if (!isEmpty(req.body.paymentMethod)) {
            req.body.paymentMethod.shiftId = shiftExist.shiftId;
          }
        } else {
          return (res = {
            data: { msg: `No Active Shifts For ${newgrn.branchId}` },
            status: STATUSCODES.NOTFOUND,
          });
        }
        let grnlist = await grnModel.find({ branchId: newgrn.branchId });
        if (Array.isArray(grnlist) && grnlist.length > 0) {
          newgrn.transNo = grnlist[grnlist.length - 1].transNo + 1;
        } else {
          newgrn.transNo = 1;
        }
        let paidAmount = 0;
        if (common_service.checkObject(req.body.paymentMethod)) {
          paidAmount = parseInt(req.body.paymentMethod.paidAmount);
          req.body.paymentMethod.paidAmount = parseInt(
            req.body.paymentMethod.paidAmount
          );
        }
        let newVoucher = new paymentVoucherModel({
          wpoId: `${PREFIXES.GRN}${newgrn.transNo}`,
          branchId: newgrn.branchId,
          supplierId: newgrn.supplierId,
          lastPaidAmount:
            typeof req.body.lastPaidAmount == "number"
              ? req.body.lastPaidAmount
              : paidAmount,
          lastPaidDate: new Date(newgrn.date).getTime(),
          paymentMethod: req.body.paymentMethod ? req.body.paymentMethod : null,
          status:
            newgrn.amount == paidAmount ? CREDITSTATUS.COM : CREDITSTATUS.PEN,
          date: new Date().getTime() /* added new field on 16-01-23 */,
        });
        let voucherList = await paymentVoucherModel.find({
          branchId: newgrn.branchId,
        });
        if (Array.isArray(voucherList) && voucherList.length > 0) {
          newVoucher.transNo = voucherList[voucherList.length - 1].transNo + 1;
        } else {
          newVoucher.transNo = 1;
        }
        let data = await newgrn.save();
        newVoucher.purchasePk = data._id;
        let newlog = await logModel({
          date: data.date,
          empId: req.decode._id,
          type: LOG.PURCHASEMANAGE_GRN_ADD.type,
          shiftId: data.shiftId,
          description: LOG.PURCHASEMANAGE_GRN_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (isEmpty(logresponse)) {
          console.log("log save failed");
        }
        let voucherData = await newVoucher.save();
        if (!isEmpty(voucherData)) {
          if (newVoucher.lastPaidAmount < newgrn.amount) {
            let creditData = new creditModel({
              purchaseId: `${PREFIXES.GRN}${newgrn.transNo}`,
              supplierId: newgrn.supplierId,
              purchaseDate: new Date(data.date).getTime(),
              netAmount: newgrn.amount,
              discount: 0,
              lastPaidDate: new Date(data.date).getTime(),
              balance: newgrn.amount - paidAmount,
              status: CREDITSTATUS.PEN,
              isPurchase: true,
              branchId: newgrn.branchId,
              paidAmount: paidAmount,
              purchasePk: data._id,
              returnAmount: 0,
            });
            let creditDataResponse = await creditData.save();

            //  let creditDataResponse = await creditservice.addcredit(creditData);
            if (isEmpty(creditDataResponse)) {
              return (res = {
                data: {
                  msg: `cannot update credit of purchasewpo ${newgrn.transNo}`,
                },
                status: STATUSCODES.UNPROCESSED,
              });
            } else {
              let supplierExist = await supplierModel.findOne({
                _id: newgrn.supplierId,
              });
              if (!common_service.checkObject(supplierExist)) {
                return (res = {
                  data: {
                    msg: `supplier Not found`,
                  },
                  status: STATUSCODES.NOTFOUND,
                });
              }
              supplierExist.openingBalance =
                supplierExist.openingBalance + (newgrn.amount - paidAmount);
              let supplierCreditResponse = await supplierModel.findOneAndUpdate(
                { _id: supplierExist._id },
                { $set: supplierExist },
                { new: true }
              );
              if (isEmpty(supplierCreditResponse)) {
                return (res = {
                  data: {
                    msg: `cannot update credit of supplier for purchasewpo ${newgrn.transNo}`,
                  },

                  status: STATUSCODES.UNPROCESSED,
                });
              }
            }
          }
          /* added on 20-09-22 -> payment method required to create payment data */
          if (!isEmpty(req.body.paymentMethod)) {
            let paymentData = new paymentModel({
              invoiceNo: `${PREFIXES.GRN}${newgrn.transNo}`,
              cus_id: newgrn.supplierId,
              date: new Date(data.date).getTime(),
              paymentMethod: req.body.paymentMethod,
              totalAmount: newgrn.amount,
              branchId: newgrn.branchId,
              purchasePk: data._id,
            });
            let paymentResponse = await paymentData.save();
            // let paymentResponse = await creditservice.addPaymentLog(
            //   paymentData
            // );
            if (isEmpty(paymentResponse)) {
              return (res = {
                data: {
                  msg: `cannot add payment to log for purchasewpo ${newgrn.transNo}`,
                },
                status: STATUSCODES.UNPROCESSED,
              });
            }
          }
          /* ends here */
          // let data = await newgrn.save();
          let purchaseExist = await purchaseModel.findOne({
            _id: newgrn.purchase_id,
          });
          if (data) {
            await Promise.all(
              data.purchaseInfo.map(async (x) => {
                let stockdata = {
                  itemType: x.type,
                  itemId: x.id,
                  stock: x.recievedQuantity,
                  branchId: data.branchId,
                  dimension: x.dimension, //added new field to pass to stock collection
                  rate: x.price /* 28-03-23 */,
                };
                let stockExist = await stockModel.findOne({
                  itemId: stockdata.itemId,
                  branchId: stockdata.branchId,
                });
                if (!isEmpty(stockExist)) {
                  let stockFind = stockExist.stock.find(
                    (x) => x.dimension == stockdata.dimension
                  );
                  if (!isEmpty(stockFind)) {
                    if (stockFind.dimensionStock == 0 && stockdata.stock < 0) {
                      return (res = {
                        data: {
                          msg: `Item Stock is ${stockFind.dimensionStock}`,
                        },
                        status: STATUSCODES.FORBIDDEN,
                      });
                    } else {
                      stockFind.dimensionStock =
                        stockFind.dimensionStock + stockdata.stock;
                    }
                  } else {
                    stockExist.stock.push({
                      dimension: stockdata.dimension,
                      dimensionStock: stockdata.stock,
                    });
                  }
                  let stockdataresponse = await stockExist.save();
                  if (stockdataresponse) {
                    let product = {};
                    if (stockdata.itemType == 0) {
                      product = await productModel.findOne({
                        _id: stockdata.itemId,
                      });
                    }
                    if (stockdata.itemType == 1) {
                      product = await foodModel.findOne({
                        _id: stockdata.itemId,
                      });
                    }

                    let stockLogData = new stockLogModel({
                      itemType: stockdata.itemType,
                      itemId: stockdata.itemId,
                      stock: [
                        {
                          dimension: stockdata.dimension,
                          dimensionStock: stockdata.stock,
                        },
                      ],
                      branchId: stockdata.branchId,
                      date: new Date(req.body.date).getTime(),
                      orderNo: newgrn.transNo,
                      type: PREFIXES.GRN,
                      categoryId: !isEmpty(product)
                        ? product.category
                        : null /* added on 06-03-24 */,
                      subCategoryId:
                        !isEmpty(product) && stockdata.itemType != 0
                          ? product.subcategoryId
                          : null /* added on 06-03-24 */,
                      rate: stockdata.rate /* added on 28-03-23 */,
                    });
                    /* ends here */
                    let stocklogdataresponse = await stockLogData.save();
                    if (isEmpty(stocklogdataresponse)) {
                      return (res = {
                        data: { msg: "Error Saving Stock Updation To Log" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  } else {
                    res = {
                      data: { msg: "Error Saving Stock" },
                      status: STATUSCODES.UNPROCESSED,
                    };
                  }
                } else {
                  let newStock = new stockModel({
                    itemType: stockdata.itemType,
                    itemId: stockdata.itemId,
                    stock: [
                      {
                        dimension: stockdata.dimension,
                        dimensionStock: stockdata.stock,
                      },
                    ],
                    branchId: stockdata.branchId,
                  });
                  let stockdataresponse = await newStock.save();
                  if (stockdataresponse) {
                    let product = {};
                    if (stockdata.itemType == 0) {
                      product = await productModel.findOne({
                        _id: stockdata.itemId,
                      });
                    }
                    if (stockdata.itemType == 1) {
                      product = await foodModel.findOne({
                        _id: stockdata.itemId,
                      });
                    }

                    let stockLogData = new stockLogModel({
                      itemType: stockdata.itemType,
                      itemId: stockdata.itemId,
                      stock: [
                        {
                          dimension: stockdata.dimension,
                          dimensionStock: stockdata.stock,
                        },
                      ],
                      branchId: stockdata.branchId,
                      date: new Date(req.body.date).getTime(),
                      orderNo: newgrn.transNo,
                      type: PREFIXES.GRN,
                      categoryId: !isEmpty(product)
                        ? product.category
                        : null /* added on 06-03-24 */,
                      subCategoryId:
                        !isEmpty(product) && stockdata.itemType != 0
                          ? product.subcategoryId
                          : null /* added on 06-03-24 */,
                      rate: stockdata.rate /* added on 28-03-23 */,
                    });
                    let stocklogdataresponse = await stockLogData.save();
                    if (isEmpty(stocklogdataresponse)) {
                      return (res = {
                        data: { msg: "Error Saving Stock Updation To Log" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  } else {
                    res = {
                      data: { msg: "Error Saving Stock" },
                      status: STATUSCODES.UNPROCESSED,
                    };
                  }
                }
              })
            );
            if (!isEmpty(purchaseExist)) {
              if (
                Array.isArray(purchaseExist.purchaseInfo) &&
                purchaseExist.purchaseInfo.length > 0
              ) {
                for (let i = 0; i < data.purchaseInfo.length; i++) {
                  const element = data.purchaseInfo[i];
                  let pur_find = purchaseExist.purchaseInfo.find(
                    (n) => n.uuid == element.uuid
                  );
                  if (!isEmpty(pur_find)) {
                    pur_find.status = "Completed"; //to be continued
                  }
                }
              }
              let data1 = await purchaseModel.findOneAndUpdate(
                { _id: purchaseExist._id },
                { $set: { purchaseInfo: purchaseExist.purchaseInfo } },
                { returnDocument: "after" }
              );
              if (!data1) {
                return (res = {
                  data: { msg: "purchase updation failed" },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            }
            /*     
        let lg = {
          type: LOG.PUR_ADDGOODSRECEIVEDNOTE,
          emp_id: req.decode ? req.decode._id : null,
          description: "add goods received note",
          link: {
            url: URL.NULL,
            api: API.NULL,
          },
        };
        await settings_service.addlog(lg, db);
      } */
            res = { data: data, status: STATUSCODES.SUCCESS };
          } else {
            res = { data: {}, satus: STATUSCODES.UNPROCESSED };
          }
        } else {
          return (res = {
            msg: "Failed to create Voucher",
            status: STATUSCODES.UNPROCESSED,
          });
        }
      } else {
        grnExist.purchaseInfo = req.body.purchaseInfo
          ? req.body.purchaseInfo
          : grnExist.purchaseInfo;
        grnExist.purchaseDate = new Date().getTime();
        grnExist.discount = req.body.discount;
        grnExist.amount = req.body.amount;
        grnExist.status = GRNSTATUS.COM;
        let newgrn = grnExist;
        let newVoucher = new paymentVoucherModel({
          wpoId: `${PREFIXES.GRN}${newgrn.transNo}`,
          branchId: newgrn.branchId,
          supplierId: newgrn.supplierId,
          lastPaidAmount: req.body.lastPaidAmount,
          lastPaidDate: new Date().getTime(),
          paymentMethod: req.body.paymentMethod ? req.body.paymentMethod : null,
          status: req.body.paymentMethod ? CREDITSTATUS.COM : CREDITSTATUS.PEN,
        });
        let voucherList = await paymentVoucherModel.find({
          branchId: newgrn.branchId,
        });
        if (Array.isArray(voucherList) && voucherList.length > 0) {
          newVoucher.transNo = voucherList[voucherList.length - 1].transNo + 1;
        } else {
          newVoucher.transNo = 1;
        }
        let voucherData = await newVoucher.save();
        if (!isEmpty(voucherData)) {
          if (newVoucher.lastPaidAmount < newgrn.amount) {
            let creditData = new creditModel({
              purchaseId: `${PREFIXES.GRN}${newgrn.transNo}`,
              supplierId: newgrn.supplierId,
              purchaseDate: new Date().getTime(),
              netAmount: newgrn.amount,
              discount: newgrn.amount - newgrn.amount,
              lastPaidDate: new Date().getTime(),
              balance: newgrn.amount - req.body.lastPaidAmount,
              status: CREDITSTATUS.PEN,
              isPurchase: true,
              branchId: newgrn.branchId,
              paidAmount: req.body.lastPaidAmount,
              purchasePk: data._id,
            });
            let creditDataResponse = await creditData.save();
            // let creditDataResponse = await creditservice.addcredit(creditData);
            if (isEmpty(creditDataResponse)) {
              return (res = {
                data: {
                  msg: `cannot update credit of purchasewpo ${newgrn.transNo}`,
                },
                status: STATUSCODES.UNPROCESSED,
              });
            } else {
              let supplierCreditResponse = await this.updateSupplierCredit({
                _id: newgrn.supplierId,
                openingBalance: newgrn.amount - req.body.lastPaidAmount,
                db: req.decode.db,
              });
              if (isEmpty(supplierCreditResponse)) {
                return (res = {
                  data: {
                    msg: `cannot update credit of supplier for purchasewpo ${newgrn.transNo}`,
                  },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            }
          }
          /* added on 20-09-22 -> payment method required to create payment data */
          if (!isEmpty(req.body.paymentMethod)) {
            let paymentData = new paymentModel({
              invoiceNo: `${PREFIXES.GRN}${newgrn.transNo}`,
              cus_id: newgrn.supplierId,
              date: new Date().getTime(),
              paymentMethod: req.body.paymentMethod,
              totalAmount: req.body.lastPaidAmount,
              branchId: newgrn.branchId,
              purchasePk: data._id,
            });
            let paymentResponse = await paymentData.save();
            // let paymentResponse = await creditservice.addPaymentLog(
            //   paymentData
            // );
            if (isEmpty(paymentResponse)) {
              return (res = {
                data: {
                  msg: `cannot add payment to log for purchasewpo ${newgrn.transNo}`,
                },
                status: STATUSCODES.UNPROCESSED,
              });
            }
          }
          /* ends here */
          let purchaseExist = await purchaseModel.findOne({
            _id: newgrn.purchase_id,
          });
          let data = await newgrn.save();

          if (data) {
            await Promise.all(
              data.purchaseInfo.map(async (x) => {
                let stockdata = {
                  itemType: x.type,
                  itemId: x._id,
                  stock: x.recievedQuantity,
                  branchId: data.branchId,
                  dimension: x.dimension, //added new field to pass to stock collection
                  rate: x.price /* 28-03-23 */,
                };

                let stockExist = await stockModel.findOne({
                  itemId: stockdata.itemId,
                  branchId: stockdata.branchId,
                });
                if (!isEmpty(stockExist)) {
                  let stockFind = stockExist.stock.find(
                    (x) => x.dimension == stockdata.dimension
                  );
                  if (!isEmpty(stockFind)) {
                    if (stockFind.dimensionStock == 0 && stockdata.stock < 0) {
                      return (res = {
                        data: {
                          msg: `Item Stock is ${stockFind.dimensionStock}`,
                        },
                        status: STATUSCODES.FORBIDDEN,
                      });
                    } else {
                      stockFind.dimensionStock =
                        stockFind.dimensionStock + stockdata.stock;
                    }
                  } else {
                    stockExist.stock.push({
                      dimension: stockdata.dimension,
                      dimensionStock: stockdata.stock,
                    });
                  }
                  let stockdataresponse = await stockExist.save();
                  if (stockdataresponse) {
                    let product = {};
                    if (stockdata.itemType == 0) {
                      product = await productModel.findOne({
                        _id: stockdata.itemId,
                      });
                    }
                    if (stockdata.itemType == 1) {
                      product = await foodModel.findOne({
                        _id: stockdata.itemId,
                      });
                    }

                    let stockLogData = new stockLogModel({
                      itemType: stockdata.itemType,
                      itemId: stockdata.itemId,
                      stock: [
                        {
                          dimension: stockdata.dimension,
                          dimensionStock: stockdata.stock,
                        },
                      ],
                      branchId: stockdata.branchId,
                      date: new Date().getTime(),
                      orderNo: grnExist.transNo,
                      type: PREFIXES.GRN,
                      categoryId: !isEmpty(product)
                        ? product.category
                        : null /* added on 06-03-24 */,
                      subCategoryId:
                        !isEmpty(product) && stockdata.itemType != 2
                          ? product.subcategoryId
                          : null /* added on 06-03-24 */,
                      rate: stockdata.rate /* added on 28-03-23 */,
                    });
                    /* ends here */
                    let stocklogdataresponse = await stockLogData.save();
                    if (isEmpty(stocklogdataresponse)) {
                      return (res = {
                        data: { msg: "Error Saving Stock Updation To Log" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  } else {
                    res = {
                      data: { msg: "Error Saving Stock" },
                      status: STATUSCODES.UNPROCESSED,
                    };
                  }
                } else {
                  let newStock = new stockModel({
                    itemType: stockdata.itemType,
                    itemId: stockdata.itemId,
                    stock: [
                      {
                        dimension: stockdata.dimension,
                        dimensionStock: stockdata.stock,
                      },
                    ],
                    branchId: stockdata.branchId,
                  });
                  let stockdataresponse = await newStock.save();
                  if (stockdataresponse) {
                    let product = {};
                    if (stockdata.itemType == 0) {
                      product = await productReadyMadeModel.findOne({
                        _id: stockdata.itemId,
                      });
                    }
                    if (stockdata.itemType == 1) {
                      product = await accessoryProductModel.findOne({
                        _id: stockdata.itemId,
                      });
                    }
                    if (stockdata.itemType == 2) {
                      product = await productMaterialModel.findOne({
                        _id: stockdata.itemId,
                      });
                    }
                    let stockLogData = new stockLogModel({
                      itemType: stockdata.itemType,
                      itemId: stockdata.itemId,
                      stock: [
                        {
                          dimension: stockdata.dimension,
                          dimensionStock: stockdata.stock,
                        },
                      ],
                      branchId: stockdata.branchId,
                      date: new Date().getTime(),
                      orderNo: stkAdjExist.transNo,
                      type: PREFIXES.GRN,
                      categoryId: !isEmpty(product)
                        ? product.category
                        : null /* added on 06-03-24 */,
                      subCategoryId:
                        !isEmpty(product) && stockdata.itemType != 2
                          ? product.subcategoryId
                          : null /* added on 06-03-24 */,
                      rate: stockdata.rate /* added on 28-03-23 */,
                    });
                    let stocklogdataresponse = await stockLogData.save();
                    if (isEmpty(stocklogdataresponse)) {
                      return (res = {
                        data: { msg: "Error Saving Stock Updation To Log" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  } else {
                    res = {
                      data: { msg: "Error Saving Stock" },
                      status: STATUSCODES.UNPROCESSED,
                    };
                  }
                }
              })
            );
            if (!isEmpty(purchaseExist)) {
              if (
                Array.isArray(purchaseExist.purchaseInfo) &&
                purchaseExist.purchaseInfo.length > 0
              ) {
                for (let i = 0; i < data.purchaseInfo.length; i++) {
                  const element = data.purchaseInfo[i];
                  let pur_find = purchaseExist.purchaseInfo.find(
                    (n) => n.uuid == element.uuid
                  );
                  if (!isEmpty(pur_find)) {
                    pur_find.status = "Completed"; //to be continued
                  } else {
                    console.log("no uuid", pur_find);
                  }
                }
              }
              let data1 = await purchaseModel.findOneAndUpdate(
                { _id: purchaseExist._id },
                { $set: { purchaseInfo: purchaseExist.purchaseInfo } },
                { returnDocument: "after" }
              );
              if (!data1) {
                return (res = {
                  data: { msg: "purchase updation failed" },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            }
            let newlog = new logModel({
              date: new Date().getTime(),
              emp_id: req.decode._id,
              type: LOG.PURCHASEMANAGE_GRN_ADD.type,
              description: LOG.PURCHASEMANAGE_GRN_ADD.description,
              branchId: req.body.branchId,
              link: {},
              payload: { token: req.headers.authorization, body: req.body },
            });
            let logresponse = await newlog.save();
            if (logresponse == null) {
              console.log("log save faild");
            }
            res = { data: data, status: STATUSCODES.SUCCESS };
          } else {
            res = { data: {}, satus: STATUSCODES.UNPROCESSED };
          }
        } else {
          return (res = {
            msg: "Failed to create Voucher",
            status: STATUSCODES.UNPROCESSED,
          });
        }
      }
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
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

// added on 26-06-23
module.exports.viewGrn = async (req) => {
  const { grnModel } = conn.purchase(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  try {
    var draftGrnList = [];
    let grnList = [];
    if (req.decode) {
      if (req.decode.role == ROLES.ADMIN) {
        draftGrnList = await grnModel.find({
          status: GRNSTATUS.COM,
          branchId: req.body.branchId,
        });
      } else {
        draftGrnList = await grnModel.find({
          branchId: req.body.branchId,
          status: GRNSTATUS.COM,
        });
      }
      if (Array.isArray(draftGrnList) && draftGrnList.length > 0) {
        for (let i = 0; i < draftGrnList.length; i++) {
          const element = draftGrnList[i];
          let list = {};
          list.transNo = element.transNo;
          list.date = common_service
            .prescisedateconvert(element.date)
            .split(" ")[0];
          list.SalesInvoiceNo = element.invoiceNo;
          let branchExist = await branchModel.findOne({
            storecode: element.branchId,
          });
          if (branchExist) {
            list.branchCode = branchExist.storecode;
            list.branchName = branchExist.branchName;
            list.location = branchExist.nameOfStore;
          }
          let supplierExist = await supplierModel.findOne({
            _id: element.supplierId,
          });

          if (supplierExist) {
            list.creditor = supplierExist.supplierName;
          }
          grnList.push(list);
        }
        res = { data: grnList, status: STATUSCODES.SUCCESS };
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

// added on 27-06-23
module.exports.viewGRNbyId = async (req) => {
  const { grnModel } = conn.purchase(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  try {
    let grnExist = await grnModel.findOne({ _id: req.body._id });

    if (grnExist) {
      grnExist._doc["TRANSACTIONID"] = grnExist
        ? grnExist.transNo
        : "NO transNO";
      grnExist._doc["SALES INVOICE NO"] = grnExist
        ? grnExist.invoiceNo
        : "NO sales invoice no";
      grnExist._doc["DATE"] = grnExist
        ? common_service.prescisedateconvert(grnExist.date)
        : "NO Date";
      let branchExist = await branchModel.findOne({ _id: grnExist.location });
      grnExist._doc["LOCATION"] = branchExist
        ? branchExist.nameOfStore
        : "NO Location";
      let supplierExist = await supplierModel.findOne({
        _id: grnExist.supplierId,
      });
      grnExist._doc["CREDITOR"] = supplierExist
        ? supplierExist.supplierName
        : "NO creditor";

      res = { data: grnExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 27-06-23
module.exports.grnDRAFT = async (req) => {
  const { grnModel } = conn.purchase(req.decode.db);
  const { shiftLogModel, logModel } = conn.settings(req.decode.db);
  try {
    let newgrn = new grnModel({
      purchase_id: req.body.purchase_id,
      supplierId: req.body.supplierId,
      branchId: req.body.branchId,
      invoiceNo: req.body.invoiceNo,
      date: new Date(req.body.date).getTime(),
      purchaseInfo: req.body.purchaseInfo,
      discount: req.body.discount,
      amount: req.body.amount,
      netAmount: req.body.netAmount,
      status: GRNSTATUS.DRF,
      location: req.body.location,
    });
    let shiftExist = await shiftLogModel.findOne({
      status: SHIFTSTATUS.ACT,
      branchId: newgrn.branchId,
    });
    if (shiftExist) {
      newgrn.shiftId = shiftExist.shiftId;
      if (req.body.paymentMethod) {
        req.body.paymentMethod.shiftId = shiftExist.shiftId;
      }
    } else {
      return (res = {
        data: { msg: `No Active Shifts For ${newgrn.branchId}` },
        status: STATUSCODES.NOTFOUND,
      });
    }
    let grnList = await grnModel.find({ branchId: newgrn.branchId });
    if (Array.isArray(grnList) && grnList.length > 0) {
      newgrn.transNo = grnList[grnList.length - 1].transNo + 1;
    } else {
      newgrn.transNo = 1;
    }
    let data = await newgrn.save();
    let newlog = new logModel({
      date: new Date().getTime(),
      emp_id: req.decode._id,
      type: LOG.PURCHASEMANAGE_GRN_DRAFT.type,
      description: LOG.PURCHASEMANAGE_GRN_DRAFT.description,
      branchId: req.body.branchId,
      link: {},
      payload: { token: req.headers.authorization, body: req.body },
    });
    let logresponse = await newlog.save();
    if (logresponse == null) {
      console.log("log save faild");
    }
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

// added on 27-06-23
module.exports.viewGrnDraft = async (req) => {
  const { grnModel, purchaseModel } = conn.purchase(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let draftGrnList = [];
    if (req.decode.role == ROLES.ADMIN) {
      draftGrnList = await grnModel
        .find({ status: STATUSCODES.DRF })
        .skip(req.body.index)
        .limit(30);
    } else {
      draftGrnList = await grnModel
        .find({
          draftGrnList: process.env.branchId
            ? process.env.branchId
            : req.body.branchId,
          status: GRNSTATUS.DRF,
        })
        .skip(req.body.index)
        .limit(30);
    }
    if (Array.isArray(draftGrnList) && draftGrnList.length > 0) {
      for (let i = 0; i < draftGrnList.length; i++) {
        const element = draftGrnList[i];
        element.TransactionId = element.transNo;
        element._doc["date"] = common_service
          .prescisedateconvert(element.date)
          .split(" ")[0];
        await Promise.all(
          element.purchaseInfo.map(async (x) => {
            let params = {
              itemId: x.itemInfo,
              branchId: element.branchId,
              dimension: x.dimension,
            };
            let stockExist = await stockModel.findOne(
              {
                itemId: x.itemInfo,
                branchId: element.branchId,
                // "stock.dimension": req.dimension, //added on 30-08-22//not needed removed on 12-10-22
              },
              {
                "stock.dimension": 1, //added on 12-10-22
                "stock.dimensionStock": 1, //added on 30-08-22
              }
            );
            if (stockExist != null) {
              /* added on 12-10-22 */
              req.dimension = req.type == 2 ? "no dimension" : req.dimension;
              stockExist.stock = stockExist.stock.filter(
                (x) => x.dimension == x.dimension
              );
            }
            let stock = stockExist;
            x.stock = stock?.stock;
            var product = {};
            if (common_service.isObjectId(x._id)) {
              if (x.type == 0) {
                product = await productModel.findOne({
                  _id: x._id,
                });
                x.itemName = !isEmpty(product)
                  ? product.productName
                  : "No Product";
              } else if (x.type == 1) {
                product = await foodModel.findOne({
                  _id: x._id,
                });
                x.itemName = !isEmpty(product)
                  ? product.productName
                  : "No Product";
              }
            }
          })
        );
        let supplierId = supplierModel.findOne({ _id: element.supplierId });
        element._doc["supplierName"] = supplierId
          ? supplierId.supplierName
          : "No supplier";
        let locationName = await branchModel.findOne({
          storeCode: element.branchId,
        });
        element._doc["locationName"] = !isEmpty(locationName)
          ? locationName.branchName
          : "no locationName";
        element._doc["loc_id"] = element.location;
        let location = {};
        if (common_service.isObjectId(element.location)) {
          location = await branchModel.findOne({
            _id: element.location,
          });
        }
        element._doc["location"] = !isEmpty(location)
          ? location.branchName
          : "No Location";
        let purchaseExist = {};
        if (common_service.isObjectId(element.purchase_id)) {
          purchaseExist = await purchaseModel.findOne({
            _id: element.purchase_id,
          });
        }
        element._doc["transeNo"] = PREFIXES.GRN + element.transNo;
        // element._doc["salesInvoiceNo"] = `no invoiceno`;
        element._doc["purchaseId"] = "no id";
        if (purchaseExist) {
          element._doc["saleseInvoceNo"] = `${purchaseExist.invoiceNo}`;
          element._doc["purchaseId"] =
            purchaseExist.branchId.substr(3) +
            PREFIXES.PURCHASE +
            purchaseExist.purchaseID;
        }
      }
      res = { data: draftGrnList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.viewGrndraftById = async (req) => {
  const { grnModel, purchaseModel } = conn.purchase(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);

  try {
    let grnExist = await grnModel.findOne({ _id: req.body._id });
    if (grnExist) {
      grnExist._doc["TRANSACTION NO"] = grnExist
        ? grnExist.transNo
        : "NO transNo";
      grnExist._doc["SALESINVOICENO"] = grnExist
        ? grnExist.invoiceNo
        : "NO sales InvoiceNo";
      grnExist._doc["Date"] = grnExist
        ? common_service.prescisedateconvert(grnExist.date)
        : "NO Date";
      let branchExist = await branchModel.findOne({ _id: grnExist.location });
      grnExist._doc["LOCATION"] = branchExist
        ? branchExist.nameOfStore
        : "NO Location";
      let supplierExist = await supplierModel.findOne({
        _id: grnExist.supplierId,
      });
      grnExist._doc["CREDITOR"] = grnExist
        ? supplierExist.supplierName
        : "no CREDITOR";
      for (let id = 0; id < grnExist.purchaseInfo.length; id++) {
        const element = grnExist.purchaseInfo[id];
        element.amount = element.price * element.recievedQuantity;
      }
      res = { data: grnExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.ERROR };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.viewpurchaseReport = async (req) => {
  const { purchaseModel } = conn.purchase(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let new_List = [];
    let purchaseList = [];
    let TOTALAMNT = 0;
    req.body.branchId =
      req.decode.role == ROLES.ADMIN ? req.body.branchId : process.env.branchId;
    purchaseList = await purchaseModel.find({});
    if (req.body.branchId != null) {
      purchaseList = purchaseList.filter(
        (x) => x.branchId == req.body.branchId
      );
    }
    if (req.body.supplierId != null) {
      purchaseList = purchaseList.filter(
        (x) => x.supplierId == req.body.supplierId
      );
    }
    if (
      common_service.checkIfNullOrUndefined(req.body.fromDate, req.body.toDate)
    ) {
      purchaseList.some((item) => {
        if (
          new Date(item.purchaseDate).getTime() >=
            new Date(req.body.fromDate).getTime() &&
          new Date(item.purchaseDate).getTime() <=
            new Date(req.body.toDate).getTime()
        ) {
          new_List.push(item);
        }
      });
    } else {
      purchaseList.map((x) => {
        new_List.push(x);
      });
    }
    let newList = [];
    let supplierData = {};
    let supplierExist = {};
    let grandTotal = 0;
    if (common_service.checkObject(req.body.supplierId)) {
      supplierExist = await supplierModel.findOne({ _id: req.body.supplierId });
    }
    if (supplierExist) {
      supplierData.name = supplierExist
        ? supplierExist.supplierName
        : "NO supplier";
      supplierData.address = supplierExist
        ? supplierExist.address
        : "No Adress";
      supplierData.mobile = supplierExist ? supplierExist.mobile : "no mobile";
    }
    for (let i = 0; i < new_List.length; i++) {
      const item = new_List[i];
      let prodInfo = [];
      for (let j = 0; j < item.purchaseInfo.length; j++) {
        const element = item.purchaseInfo[j];
        prodInfo.push(element.itemName);
        TOTALAMNT = TOTALAMNT + Math.round(element.rate * element.quantity);
      }
      grandTotal = grandTotal + TOTALAMNT;
      let items = {
        _id: item._id,
        invoiceNo: item.invoiceNo
          ? `${
              PREFIXES.PURCHASE +
              item.branchId.substring(3, 5) +
              item.purchaseID
            }`
          : `${PREFIXES.PURCHASE + item.purchaseID}`,
        purchaseDate: item.purchaseDate
          ? common_service.prescisedateconvert(item.purchaseDate).split(" ")[0]
          : common_service.prescisedateconvert(item.invoiceDate).split(" ")[0],
        product: prodInfo,
        total: TOTALAMNT,
        supplierName: supplierData.supplierName,
        branchId: item.branchId,
        branchName: "no location",
      };
      let branchExist = await branchModel.findOne({ storeCode: item.branchId });
      if (branchExist) {
        items.branchName = branchExist.branchName;
      }
      let supplierExist = {};
      if (items.supplierExist) {
        supplierExist = await supplierModel.findOne({ _id: item.supplierId });
      }
      items.supplierName = supplierExist
        ? supplierExist.supplierName
        : "No supplierName";
      newList.push(items);
    }

    res = {
      data: { list: newList, supplier: supplierData, grandTotal: grandTotal },
      status: STATUSCODES.SUCCESS,
    };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 06/07/23
module.exports.purchasewopoReport = async (req) => {
  const { purchasewopoModel } = conn.purchase(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { employeeModel } = conn.employee(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  try {
    var purchaseWopoList,
      newlist,
      rslist = [];
    let str = {},
      fromDate,
      toDate;
    if (req.body.transNo != null) str.transNo = req.body.transNo;
    if (!isEmpty(req.decode)) {
      if (req.decode.role == ROLES.ADMIN) {
        if (req.body.branchId) {
          str.branchId = req.body.branchId;
        }
        purchaseWopoList = await purchasewopoModel.find(str);
      } else {
        str.branchId = req.body.branchId;
        purchaseWopoList = await purchasewopoModel.find(str);
      }
      if (req.body.fromDate != null)
        fromDate = new Date(req.body.fromDate).getTime();
      if (req.body.toDate != null) toDate = new Date(req.body.toDate).getTime();
      newlist = purchaseWopoList;
      if (Array.isArray(newlist) && newlist.length > 0) {
        if (req.body.fromDate != null && req.body.toDate != null) {
          for (let i = 0; i < newlist.length; i++) {
            const element = newlist[i];
            if (
              fromDate <= element.invoiceDate &&
              element.invoiceDate <= toDate
            ) {
              let branch = await branchModel.findOne({
                storeCode: element.branchId,
              });
              let employee = await employeeModel.findOne({
                _id: element.recievedBy,
              });
              var resobj = {};
              resobj._id = element._id;
              resobj.transNo = PREFIXES.PURCHASEWPO + element.transNo;
              resobj.saleInvNo =
                element.saleInvNo != null || undefined
                  ? PREFIXES.SALESINV + element.saleInvNo
                  : null;
              resobj.branch = element.branchId;
              resobj.branchName = branch?.branchName;
              resobj.recievedBy = employee?.staff_name;
              resobj.date = common_service
                .prescisedateconvert(element.invoiceDate)
                .split(" ")[0];

              let supplierId = await supplierModel.findOne({
                _id: element.supplierId,
              });
              resobj.supplierName = !isEmpty(supplierId)
                ? supplierId.supplierName
                : "No supplier";
              for (let j = 0; j < element.purchaseInfo.length; j++) {
                let prod = {};
                if (
                  common_service.isObjectId(element.purchaseInfo[j].itemInfo)
                ) {
                  if (element.purchaseInfo[j].type == 0) {
                    prod = await productModel.findOne({
                      _id: element.purchaseInfo[j].itemInfo,
                    });
                    element.purchaseInfo[j].productCode = "PROD" + prod?.code;
                    element.purchaseInfo[j].productName = prod?.productName;
                  }
                }
              }
              resobj.purchaseInfo = element.purchaseInfo;
              rslist.push(resobj);
            }
          }
          res = { data: rslist, status: STATUSCODES.SUCCESS };
        } else if (req.body.fromDate != null && req.body.toDate == null) {
          for (let i = 0; i < newlist.length; i++) {
            const element = newlist[i];
            if (fromDate <= element.invoiceDate) {
              let branch = await branchModel.findOne({
                storeCode: element.branchId,
              });
              let employee = await employeeModel.findOne({
                _id: element.recievedBy,
              });
              var resobj = {};
              resobj._id = element._id;
              resobj.transNo = PREFIXES.PURCHASEWPO + element.transNo;
              resobj.saleInvNo =
                element.saleInvNo != null || undefined
                  ? PREFIXES.SALESINV + element.saleInvNo
                  : null;
              resobj.branch = element.branchId;
              resobj.branchName = branch?.branchName;
              resobj.recievedBy = employee?.staff_name;
              resobj.date = common_service
                .prescisedateconvert(element.invoiceDate)
                .split(" ")[0];

              let supplierId = await supplierModel.findOne({
                _id: element.supplierId,
              });
              resobj.supplierName = !isEmpty(supplierId)
                ? supplierId.supplierName
                : "No supplier";

              for (let j = 0; j < element.purchaseInfo.length; j++) {
                let prod = {};
                if (
                  common_service.isObjectId(element.purchaseInfo[j].itemInfo)
                ) {
                  if (element.purchaseInfo[j].type == 0) {
                    prod = await productModel.findOne({
                      _id: element.purchaseInfo[j].itemInfo,
                    });
                    element.purchaseInfo[j].productCode = "PROD" + prod?.code;
                    element.purchaseInfo[j].productName = prod?.productName;
                  }
                }
              }
              resobj.purchaseInfo = element.purchaseInfo;
              rslist.push(resobj);
            }
          }
          res = { data: rslist, status: STATUSCODES.SUCCESS };
        } else if (req.body.fromDate == null && req.body.toDate != null) {
          for (let i = 0; i < newlist.length; i++) {
            const element = newlist[i];
            if (element.invoiceDate <= toDate) {
              let branch = await branchModel.findOne({
                storeCode: element.branchId,
              });
              let employee = await employeeModel.findOne({
                _id: element.recievedBy,
              });
              var resobj = {};
              resobj._id = element._id;
              resobj.transNo = PREFIXES.PURCHASEWPO + element.transNo;
              resobj.saleInvNo =
                element.saleInvNo != null || undefined
                  ? PREFIXES.SALESINV + element.saleInvNo
                  : null;
              resobj.branch = element.branchId;
              resobj.branchName = branch?.branchName;
              resobj.recievedBy = employee?.staff_name;
              resobj.date = common_service
                .prescisedateconvert(element.invoiceDate)
                .split(" ")[0];

              let supplierId = await supplierModel.findOne({
                _id: element.supplierId,
              });
              resobj.supplierName = !isEmpty(supplierId)
                ? supplierId.supplierName
                : "No supplier";
              for (let j = 0; j < element.purchaseInfo.length; j++) {
                let prod = {};
                if (
                  common_service.isObjectId(element.purchaseInfo[j].itemInfo)
                ) {
                  if (element.purchaseInfo[j].type == 0) {
                    prod = await productModel.findOne({
                      _id: element.purchaseInfo[j].itemInfo,
                    });
                    element.purchaseInfo[j].productCode = "PROD" + prod?.code;
                    element.purchaseInfo[j].productName = prod?.productName;
                  }
                }
              }
              resobj.purchaseInfo = element.purchaseInfo;
              rslist.push(resobj);
            }
          }
          res = { data: rslist, status: STATUSCODES.SUCCESS };
        } else if (req.body.fromDate == null && req.body.toDate == null) {
          for (let i = 0; i < newlist.length; i++) {
            const element = newlist[i];
            let branch = await branchModel.findOne({
              storeCode: element.branchId,
            });
            let employee = await employeeModel.findOne({
              _id: element.recievedBy,
            });
            var resobj = {};
            resobj._id = element._id;
            resobj.transNo = PREFIXES.PURCHASEWPO + element.transNo;
            resobj.saleInvNo =
              element.saleInvNo != null || undefined
                ? PREFIXES.SALESINV + element.saleInvNo
                : null;
            resobj.branch = element.branchId;
            resobj.branchName = branch?.branchName;
            resobj.recievedBy = employee?.staff_name;
            resobj.date = common_service
              .prescisedateconvert(element.invoiceDate)
              .split(" ")[0];

            let supplierId = await supplierModel.findOne({
              _id: element.supplierId,
            });
            resobj.supplierName = !isEmpty(supplierId)
              ? supplierId.supplierName
              : "No supplier";

            for (let j = 0; j < element.purchaseInfo.length; j++) {
              let prod = {};
              if (common_service.isObjectId(element.purchaseInfo[j].itemInfo)) {
                if (element.purchaseInfo[j].type == 0) {
                  prod = await productModel.findOne({
                    _id: element.purchaseInfo[j].itemInfo,
                  });
                  element.purchaseInfo[j].productCode = "PROD" + prod?.code;
                  element.purchaseInfo[j].productName = prod?.productName;
                }
              }
            }
            resobj.purchaseInfo = element.purchaseInfo;
            rslist.push(resobj);
          }
          res = { data: rslist, status: STATUSCODES.SUCCESS };
        }
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

// added on 11-07-23
module.exports.addStockTransfer = async (req) => {
  const { transferModel } = conn.purchase(req.decode.db);
  const { shiftLogModel, logModel, shiftModel } = conn.settings(req.decode.db);
  try {
    let shiftExist = {};
    let shiftSettings = await shiftModel.findOne({
      branchId: req.body.branchId,
    });
    if (common_service.checkObject(shiftSettings)) {
      if (shiftSettings.shiftType == 2) {
        shiftExist.shiftId = 0;
      } else {
        shiftExist = await shiftLogModel.findOne({
          branchId: req.body.branchId,
          status: SHIFTSTATUS.ACT,
        });
      }
    } else {
      return (res = {
        data: { msg: `No Settings Defined For Branch ${req.body.branchId}` },
        status: STATUSCODES.NOTFOUND,
      });
    }
    let transExist = await transferModel.find({ fromLoc: req.body.fromLoc });
    let transNo = 0;
    if (transExist.length > 0)
      transNo = transExist[transExist.length - 1].transNo + 1;
    else transNo = 1;
    let newtransfer = new transferModel({
      fromLoc: req.body.fromLoc,
      toLoc: req.body.toLoc,
      transferDate: new Date(req.body.transferDate).getTime(),
      remarks: req.body.remarks,
      margin: req.body.margin,
      marginType: req.body.marginType,
      transferItems: req.body.transferItems,
      status: STOCKADJUSTMENTSTATUS.PEN,
      transNo: transNo,
    });
    let data = await newtransfer.save();
    if (data) {
      // let newlog = new logModel({
      //   date: new Date().getTime(),
      //   emp_id: req.decode._id,
      //   type: LOG.FOODMANAGEMENT_FOOD_ADD.type,
      //   description: LOG.FOODMANAGEMENT_FOOD_ADD.description,

      //   link: {},
      //   payload: { token: req.headers.authorization, body: req.body },
      // });
      // let logresponse = await newlog.save();
      // if (logresponse == null) {
      //   console.log("log save faild");
      // }
      res = { data: data, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.UNPROCESSED };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 11-07-23
module.exports.receivedTransfers = async (req) => {
  try {
    const { transferModel } = conn.purchase(req.decode.db);
    const { branchModel } = conn.location(req.decode.db);
    let arr = [],
      branchId;
    if (req.decode.role == ROLES.ADMIN) branchId = req.body.branchId;
    else branchId = req.body.branchId;
    let transfers = await transferModel.find({
      toLoc: branchId,
      status: STOCKADJUSTMENTSTATUS.PEN,
    });

    if (transfers.length > 0) {
      for (let i = 0; i < transfers.length; i++) {
        let fromLoc = await branchModel.findOne({
          storeCode: transfers[i].fromLoc,
        });
        let toLoc = await branchModel.findOne({
          storeCode: transfers[i].toLoc,
        });
        let transfer = {
          _id: transfers[i]._id,
          transNo:
            PREFIXES.STOCKTRANSFER +
            fromLoc.storeCode.substring(3, 5) +
            transfers[i].transNo,
          fromLoc: fromLoc?.branchName,
          toLoc: toLoc?.branchName,
          transferDate: common_service
            .prescisedateconvert(transfers[i].transferDate)
            .split(" ")[0],
          margin: transfers[i].margin,
          status: transfers[i].status,
        };
        arr.push(transfer);
      }
      return (res = { data: arr, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (error) {
    return (res = { data: error.message, status: STATUSCODES.ERROR });
  }
};

// added on 12-07-23
module.exports.transferSingleView = async (req) => {
  try {
    const { transferModel } = conn.purchase(req.decode.db);
    const { stockModel } = conn.stock(req.decode.db);
    const { branchModel } = conn.location(req.decode.db);
    let transferSingle = await transferModel.findOne({ _id: req.body._id });
    let resobj = {};
    if (transferSingle != null) {
      let fromBranch = await branchModel.findOne({
        storeCode: transferSingle.fromLoc,
      });
      let toBranch = await branchModel.findOne({
        storeCode: transferSingle.toLoc,
      });
      if (fromBranch == null) {
        return (res = {
          data: "Invalid From Branch Code",
          status: STATUSCODES.ERROR,
        });
      }
      if (toBranch == null) {
        return (res = {
          data: "Invalid From Branch Code",
          status: STATUSCODES.ERROR,
        });
      }
      resobj._id = transferSingle._id;
      resobj.transNo =
        PREFIXES.STOCKTRANSFER +
        fromBranch.storeCode.substring(3, 5) +
        transferSingle.transNo;
      resobj.fromLoc = fromBranch.branchName;
      resobj.toLoc = toBranch.branchName;
      resobj.date = common_service
        .prescisedateconvert(transferSingle.transferDate)
        .split(" ")[0];
      resobj.list = [];
      for (let i = 0; i < transferSingle.transferItems.length; i++) {
        const element = transferSingle.transferItems[i];
        let obj = {};
        element._doc["totalCost"] = element.transferQty * element.unitCost;
        element._doc["outletCost"] =
          element._doc["totalCost"] + element.spMargin;
        element._doc["stockQty"] = 0;
        resobj.list.push(element);
      }
      return (res = { data: resobj, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (error) {
    console.error(error);
    return (res = { data: "Internel server error", status: STATUSCODES.ERROR });
  }
};

// added on 12-07-23
module.exports.confirmTransfers = async (req) => {
  try {
    const { transferModel } = conn.purchase(req.decode.db);
    const { branchModel } = conn.location(req.decode.db);
    let arr = [],
      branchId;
    if (req.decode.role == ROLES.ADMIN) branchId = req.body.branchId;
    else branchId = req.body.branchId;
    let transfers = await transferModel.find({
      fromLoc: branchId,
      status: STOCKADJUSTMENTSTATUS.CON,
    });
    if (transfers.length > 0) {
      for (let i = 0; i < transfers.length; i++) {
        let fromLoc = await branchModel.findOne({
          storeCode: transfers[i].fromLoc,
        });
        let toLoc = await branchModel.findOne({
          storeCode: transfers[i].toLoc,
        });
        let transfer = {
          _id: transfers[i]._id,
          transNo:
            PREFIXES.STOCKTRANSFER +
            req.decode.prefix.substring(0, 2) +
            transfers[i].transNo,
          fromLoc: fromLoc?.branchName,
          toLoc: toLoc?.branchName,
          transferDate: common_service
            .prescisedateconvert(transfers[i].transferDate)
            .split(" ")[0],
          margin: transfers[i].margin,
          status: transfers[i].status,
        };
        arr.push(transfer);
      }
      return (res = { data: arr, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 12-07-230
module.exports.editTransfer = async (req) => {
  try {
    const { transferModel } = conn.purchase(req.decode.db);
    const { stockModel, stockLogModel } = conn.stock(req.decode.db);
    const { productModel } = conn.product(req.decode.db);
    const { foodModel } = conn.food(req.decode.db);
    const { logModel } = conn.settings(req.decode.db);
    let transf = await transferModel.findOne({ _id: req.body.id });
    if (!isEmpty(transf)) {
      transf.transferItems = req.body.transferItems;
      for (let i = 0; i < transf.transferItems.length; i++) {
        const element = transf.transferItems[i];
        if (element.transferQty == element.receivedQty) {
          element.status = STOCKADJUSTMENTSTATUS.COM;
          let stockdataFrm = {
            itemType: element.itemType,
            itemId: element.itemId,
            stock: -element.receivedQty,
            branchId: transf.fromLoc,
            dimension: element.dimension,
            rate: element.unitCost /* added on 28-03-23 */,
          };
          // let stockresponseFrm = await stockService.addStockToBranch(
          //   stockdataFrm
          // );
          // if (isEmpty(stockresponseFrm.data)) {
          //   return (res = {
          //     data: { msg: "Stock Not Updated" },
          //     status: STATUSCODES.UNPROCESSED,
          //   });
          // }
          if (stockdataFrm.itemType == 2) {
            stockdataFrm.dimension = "no dimension";
          }
          let stockExist = await stockModel.findOne({
            itemId: stockdataFrm.itemId,
            branchId: stockdataFrm.branchId,
          });
          if (!isEmpty(stockExist)) {
            let stockFind = stockExist.stock.find(
              (x) => x.dimension == stockdataFrm.dimension
            );
            if (!isEmpty(stockFind)) {
              if (stockFind.dimensionStock == 0 && stockdataFrm.stock < 0) {
                return (res = {
                  data: { msg: `Item Stock is ${stockFind.dimensionStock}` },
                  status: STATUSCODES.FORBIDDEN,
                });
              } else {
                stockFind.dimensionStock =
                  stockFind.dimensionStock + stockdataFrm.stock;
              }
            } else {
              stockExist.stock.push({
                dimension: stockdataFrm.dimension,
                dimensionStock: stockdataFrm.stock,
              });
            }
            let stockdataresponse = await stockExist.save();
            if (stockdataresponse) {
              let product = {};
              if (stockdataFrm.itemType == 0) {
                product = await productModel.findOne({
                  _id: stockdataFrm.itemId,
                });
              }
              if (stockdataFrm.itemType == 1) {
                product = await foodModel.findOne({
                  _id: stockdataFrm.itemId,
                });
              }

              let stockLogData = new stockLogModel({
                itemType: stockdataFrm.itemType,
                itemId: stockdataFrm.itemId,
                stock: [
                  {
                    dimension: stockdataFrm.dimension,
                    dimensionStock: stockdataFrm.stock,
                  },
                ],
                branchId: stockdataFrm.branchId,
                date: new Date().getTime(),
                orderNo: transf.transNo,
                type: PREFIXES.STOCKTRANSFER,
                categoryId: !isEmpty(product)
                  ? product.category
                  : null /* added on 06-03-24 */,
                subCategoryId:
                  !isEmpty(product) && stockdataFrm.itemType != 2
                    ? product.subcategoryId
                    : null /* added on 06-03-24 */,
                rate: stockdataFrm.rate /* added on 28-03-23 */,
              });
              /* ends here */
              let stocklogdataresponse = await stockLogData.save();
              if (isEmpty(stocklogdataresponse)) {
                return (res = {
                  data: { msg: "Error Saving Stock Updation To Log" },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            } else {
              res = {
                data: { msg: "Error Saving Stock" },
                status: STATUSCODES.UNPROCESSED,
              };
            }
          } else {
            let newStock = new stockModel({
              itemType: stockdataFrm.itemType,
              itemId: stockdataFrm.itemId,
              stock: [
                {
                  dimension: stockdataFrm.dimension,
                  dimensionStock: stockdataFrm.stock,
                },
              ],
              branchId: stockdataFrm.branchId,
            });
            let stockdataresponse = await newStock.save();
            if (stockdataresponse) {
              let product = {};
              if (stockdataFrm.itemType == 0) {
                product = await productModel.findOne({
                  _id: stockdataFrm.itemId,
                });
              }
              if (stockdataFrm.itemType == 1) {
                product = await foodModel.findOne({
                  _id: stockdataFrm.itemId,
                });
              }

              let stockLogData = new stockLogModel({
                itemType: stockdataFrm.itemType,
                itemId: stockdataFrm.itemId,
                stock: [
                  {
                    dimension: stockdataFrm.dimension,
                    dimensionStock: stockdataFrm.stock,
                  },
                ],
                branchId: stockdataFrm.branchId,
                date: new Date().getTime(),
                orderNo: transf.transNo,
                type: PREFIXES.STOCKTRANSFER,
                categoryId: !isEmpty(product)
                  ? product.category
                  : null /* added on 06-03-24 */,
                subCategoryId:
                  !isEmpty(product) && stockdataFrm.itemType != 2
                    ? product.subcategoryId
                    : null /* added on 06-03-24 */,
                rate: stockdataFrm.rate /* added on 28-03-23 */,
              });
              let stocklogdataresponse = await stockLogData.save();
              if (isEmpty(stocklogdataresponse)) {
                return (res = {
                  data: { msg: "Error Saving Stock Updation To Log" },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            } else {
              res = {
                data: { msg: "Error Saving Stock" },
                status: STATUSCODES.UNPROCESSED,
              };
            }
          }
          let stockdataTo = {
            itemType: element.itemType,
            itemId: element.itemId,
            stock: element.receivedQty,
            branchId: transf.toLoc,
            dimension: element.dimension,
            rate: element.unitCost /* added on 28-03-23 */,
          };
          // let stockresponseTo = await stockService.addStockToBranch(
          //   stockdataTo
          // );
          // if (isEmpty(stockresponseTo.data)) {
          //   return (res = {
          //     data: { msg: "Stock Not Updated" },
          //     status: STATUSCODES.UNPROCESSED,
          //   });
          // }
          if (stockdataTo.itemType == 2) {
            stockdataTo.dimension = "no dimension";
          }
          let stockExist1 = await stockModel.findOne({
            itemId: stockdataTo.itemId,
            branchId: stockdataTo.branchId,
          });
          if (!isEmpty(stockExist1)) {
            let stockFind = stockExist1.stock.find(
              (x) => x.dimension == stockdataTo.dimension
            );
            if (!isEmpty(stockFind)) {
              if (stockFind.dimensionStock == 0 && stockdataTo.stock < 0) {
                return (res = {
                  data: { msg: `Item Stock is ${stockFind.dimensionStock}` },
                  status: STATUSCODES.FORBIDDEN,
                });
              } else {
                stockFind.dimensionStock =
                  stockFind.dimensionStock + stockdataTo.stock;
              }
            } else {
              stockExist1.stock.push({
                dimension: stockdataTo.dimension,
                dimensionStock: stockdataTo.stock,
              });
            }
            let stockdataresponse = await stockExist1.save();
            if (stockdataresponse) {
              let product = {};
              if (stockdataTo.itemType == 0) {
                product = await productModel.findOne({
                  _id: stockdataTo.itemId,
                });
              }
              if (stockdataTo.itemType == 1) {
                product = await foodModel.findOne({
                  _id: stockdataTo.itemId,
                });
              }

              let stockLogData = new stockLogModel({
                itemType: stockdataTo.itemType,
                itemId: stockdataTo.itemId,
                stock: [
                  {
                    dimension: stockdataTo.dimension,
                    dimensionStock: stockdataTo.stock,
                  },
                ],
                branchId: stockdataTo.branchId,
                date: new Date().getTime(),
                orderNo: transf.transNo,
                type: PREFIXES.STOCKTRANSFER,
                categoryId: !isEmpty(product)
                  ? product.category
                  : null /* added on 06-03-24 */,
                subCategoryId:
                  !isEmpty(product) && stockdataTo.itemType != 2
                    ? product.subcategoryId
                    : null /* added on 06-03-24 */,
                rate: stockdataTo.rate /* added on 28-03-23 */,
              });
              /* ends here */
              let stocklogdataresponse = await stockLogData.save();
              if (isEmpty(stocklogdataresponse)) {
                return (res = {
                  data: { msg: "Error Saving Stock Updation To Log" },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            } else {
              res = {
                data: { msg: "Error Saving Stock" },
                status: STATUSCODES.UNPROCESSED,
              };
            }
          } else {
            let newStock = new stockModel({
              itemType: stockdataTo.itemType,
              itemId: stockdataTo.itemId,
              stock: [
                {
                  dimension: stockdataTo.dimension,
                  dimensionStock: stockdataTo.stock,
                },
              ],
              branchId: stockdataTo.branchId,
            });
            let stockdataresponse = await newStock.save();
            if (stockdataresponse) {
              let product = {};
              if (stockdataTo.itemType == 0) {
                product = await productModel.findOne({
                  _id: stockdataTo.itemId,
                });
              }
              if (stockdataTo.itemType == 1) {
                product = await foodModel.findOne({
                  _id: stockdataTo.itemId,
                });
              }

              let stockLogData = new stockLogModel({
                itemType: stockdataTo.itemType,
                itemId: stockdataTo.itemId,
                stock: [
                  {
                    dimension: stockdataTo.dimension,
                    dimensionStock: stockdataTo.stock,
                  },
                ],
                branchId: stockdataTo.branchId,
                date: new Date().getTime(),
                orderNo: transf.transNo,
                type: PREFIXES.STOCKTRANSFER,
                categoryId: !isEmpty(product)
                  ? product.category
                  : null /* added on 06-03-24 */,
                subCategoryId:
                  !isEmpty(product) && stockdataTo.itemType != 2
                    ? product.subcategoryId
                    : null /* added on 06-03-24 */,
                rate: stockdataTo.rate /* added on 28-03-23 */,
              });
              let stocklogdataresponse = await stockLogData.save();
              if (isEmpty(stocklogdataresponse)) {
                return (res = {
                  data: { msg: "Error Saving Stock Updation To Log" },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            } else {
              res = {
                data: { msg: "Error Saving Stock" },
                status: STATUSCODES.UNPROCESSED,
              };
            }
          }
        } else {
          element.status =
            element.status == STOCKADJUSTMENTSTATUS.PEN
              ? (element.status = STOCKADJUSTMENTSTATUS.REC)
              : STOCKADJUSTMENTSTATUS.PEN;
        }
      }
      let confirmList = transf.transferItems.filter(
        (x) => x.status == STOCKADJUSTMENTSTATUS.COM
      );
      if (transf.transferItems.length == confirmList.length) {
        transf.status = STOCKADJUSTMENTSTATUS.COM;
      } else {
        let receivedList = transf.transferItems.filter(
          (x) => x.status == STOCKADJUSTMENTSTATUS.PEN
        );
        if (receivedList.length > 0) {
          transf.status = STOCKADJUSTMENTSTATUS.PEN;
        } else {
          transf.status = STOCKADJUSTMENTSTATUS.CON;
        }
      }
      let data = await transf.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.PURCHASEMANAGE_TRANSFER_EDIT.type,
          description: LOG.PURCHASEMANAGE_TRANSFER_EDIT.description,
          branchId:transf.fromLoc,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
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
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 13-07-23
module.exports.transferReport = async (req) => {
  const { transferModel } = conn.purchase(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let rsList = [];
    let str = {};
    if (req.body.transNo) str.transNo = req.body.transNo;
    if (req.body.fromLoc) str.fromLoc = req.body.fromLoc;
    if (req.body.toLoc) str.toLoc = req.body.toLoc;
    let transferExist = await transferModel.find(str);
    if (Array.isArray(transferExist) && transferExist.length > 0) {
      for (let i = 0; i < transferExist.length; i++) {
        const element = transferExist[i];
        let resobj = {
          transNo: "no transeNo",
          branchName: "no branchName",
          branchCode: "no branchCode",
          fromLoc: "no fromLoc",
          toLoc: "No to Loc",
          margin: " no margin",
          transferDate: "No transferDate",
          status: "no complete",
        };
        resobj._id = element._id;
        resobj.transNo =
          "STKTR" + req.decode.prefix.substring(0, 2) + element.transNo;
        let branchExist = await branchModel.findOne({
          storeCode: element.fromLoc,
        });
        if (branchExist) {
          resobj.branchName = branchExist.branchName;
          resobj.branchCode = branchExist.storeCode;
        }

        resobj.fromLoc = element.fromLoc;
        resobj.toLoc = element.toLoc;
        resobj.margin = element.margin;
        resobj.transferDate = common_service
          .prescisedateconvert(element.transferDate)
          .split(" ")[0];
        resobj.status = element.status;
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

// ADDED ON 14/07/23
module.exports.grnReport = async (req) => {
  const { grnModel } = conn.purchase(req.decode.db);
  const { branchModel, locationModel } = conn.location(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  try {
    let str = {};
    str.status = GRNSTATUS.COM;
    let grnlist = [];
    let newGrns = [];
    let grns;
    if (req.body.transNo) {
      str.transNo = req.body.transNo;
    }
    if (req.decode.role == ROLES.ADMIN) {
      grns = await grnModel.find(str);
    } else {
      str.branchId = req.body.branchId;
      grns = await grnModel.find(str);
    }
    if (
      common_service.checkIfNullOrUndefined(req.body.fromDate, req.body.endDate)
    ) {
      grns.some((x) => {
        if (
          x.date >= new Date(req.body.fromDate).getTime() &&
          x.date <= new Date(req.body.endDate).getTime()
        ) {
          newGrns.push(x);
        }
      });
      grns = newGrns;
    }
    if (Array.isArray(grns) && grns.length > 0) {
      for (let i = 0; i < grns.length; i++) {
        const element = grns[i];
        const branchExist = await branchModel.findOne({
          storeCode: element.branchId,
        });
        const locationExist = await locationModel.findOne({
          _id: element.location,
        });
        const supplierExist = await supplierModel.findOne({
          _id: element.supplierId,
        });
        let data = {
          _id: element._id,
          invoiceNo: element.invoiceNo ? element.invoiceNo : null,
          transNo: element.transNo ? `${PREFIXES.GRN + element.transNo}` : null,
          supplier: supplierExist ? supplierExist.supplierName : "no name",
          branchId: element.branchId ? element.branchId : "no branch id",
          branchName: branchExist ? branchExist.branchName : "no branch name",
          location: locationExist ? locationExist.locationName : "no location",
          date: element.date
            ? common_service.prescisedateconvert(element.date)
            : "no date",
        };
        grnlist.push(data);
      }
      return (res = { data: grnlist, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 14/07/23
module.exports.singleGrnreport = async (req) => {
  const { grnModel } = conn.purchase(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  try {
    let grn = await grnModel.findOne({
      _id: req.body.id,
    });
    if (!common_service.isEmpty(grn)) {
      let supplierExist = await supplierModel.findOne({
        _id: grn.supplierId,
      });
      grn._doc["transNo"] = grn.transNo
        ? `${PREFIXES.GRN + grn.transNo}`
        : null;
      grn._doc["supplierName"] = supplierExist?.supplierName
        ? supplierExist.supplierName
        : "no name";
      grn._doc["date"] = common_service.prescisedateconvert(grn.date);
      return (res = { data: grn, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 21-07-23
module.exports.viewProductsForPurchase = async (req) => {
  const { productModel } = conn.product(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  try {
    let responseList = [];
    if (req.body.type == 0) {
      responseList = await productModel.find({ branchId: req.body.branchId });
    } else {
      responseList = await foodModel.find({
        branchId: req.body.branchId,
        isStockBased: true,
        isUnitBased: false,
        isPreparable: false,
      });
    }
    for (let i = 0; i < responseList.length; i++) {
      const element = responseList[i];
      let stockExist = await stockModel.findOne({ itemId: element._id });
      if (req.body.type == 0) {
        element._doc["code"] = `PROD${element.code}`;
        element._doc["stock"] = 0;
        if (stockExist != null) {
          element._doc["stock"] = stockExist.stock[0].dimensionStock;
        }
      } else {
        element._doc["code"] = `FOOD${element.prod_id}`;
        element._doc["productName"] = element.prod_name;
        if (element.dimensions.length > 0) {
          for (let i = 0; i < element.dimensions.length; i++) {
            const stk = element.dimensions[i];
            stk.stock = 0;
            if (stockExist != null) {
              let dimension = stockExist.stock.find(
                (x) => x.dimension == stk.size
              );
              if (dimension != null) {
                stk.stock = dimension.dimensionStock;
              }
            }
          }
        }
      }
    }
    return (res = { data: responseList, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 24-07-23
module.exports.viewpurchasereturninvoicenumbers = async (req) => {
  try {
    const { grnModel, purchasewopoModel } = conn.purchase(req.decode.db);
    let rsList = [];
    if (!req.body.branchId) {
      return (res = { data: { msg: "" }, status: STATUSCODES.BADREQUEST });
    }
    let grnlist = await grnModel.find({ branchId: req.body.branchId });
    let purchaseWpoList = await purchasewopoModel.find({
      branchId: req.body.branchId,
    });
    if (grnlist.length > 0) {
      grnlist.map((element) => {
        rsList.push({
          _id: element._id,
          purchaseId:
            element.branchId.substr(3) + PREFIXES.GRN + element.transNo,
          purchaseDate: element.date,
          convPurchaseDate: common_service.prescisedateconvert(element.date),
          type: 0,
        });
      });
    }
    if (purchaseWpoList.length > 0) {
      purchaseWpoList.map((element) => {
        rsList.push({
          _id: element._id,
          purchaseId:
            element.branchId.substr(3) + PREFIXES.PURCHASEWPO + element.transNo,
          purchaseDate: element.invoiceDate,
          convPurchaseDate: common_service.prescisedateconvert(
            element.invoiceDate
          ),
          type: 1,
        });
      });
    }
    return (res = { data: rsList, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 24-07-23
module.exports.viewReturnObjectInfos = async (req) => {
  try {
    const { grnModel, purchasewopoModel } = conn.purchase(req.decode.db);
    const { productModel } = conn.product(req.decode.db);
    const { foodModel } = conn.food(req.decode.db);
    const { branchModel } = conn.location(req.decode.db);
    const supplierModel = conn.supplier(req.decode.db);
    let purchaseInfo = {};
    let resobj = {
      supplierName: "no supplier",
      invoiceNo: "no invoiceNo",
      purchaseInfo: [],
    };
    if (common_service.isObjectId(req.body._id)) {
      if (req.body.type == 0) {
        purchaseInfo = await grnModel.findOne({ _id: req.body._id });
      } else {
        purchaseInfo = await purchasewopoModel.findOne({ _id: req.body._id });
      }
      if (common_service.checkObject(purchaseInfo)) {
        let supplierExist = await supplierModel.findOne({
          _id: purchaseInfo.supplierId,
        });
        resobj.supplierId = purchaseInfo.supplierId;
        if (!isEmpty(supplierExist)) {
          resobj.supplierName = supplierExist.supplierName;
        }
        let branchExist = await branchModel.findOne({
          storeCode: purchaseInfo.branchId,
        });
        if (isEmpty(branchExist)) {
          return (res = {
            data: { msg: "Invalid Branch" },
            status: STATUSCODES.NOTFOUND,
          });
        }
        resobj.invoiceNo =
          req.body.type == 0
            ? branchExist.storeCode.substr(3) +
              PREFIXES.GRN +
              purchaseInfo.transNo
            : branchExist.storeCode.substr(3) +
              PREFIXES.PURCHASEWPO +
              purchaseInfo.transNo;
        for (let i = 0; i < purchaseInfo.purchaseInfo.length; i++) {
          const x = purchaseInfo.purchaseInfo[i];
          let product = {};
          let itemobj = {
            code: "no code",
            name: "no name",
            unit: "no unit",
            qty: 0,
            rate: 0,
            amount: 0,
            dimension: "no dimension",
            status: "Completed",
          };
          if (common_service.isObjectId(x.itemInfo)) {
            if (parseInt(x.type) == 0) {
              product = await productModel.findOne({
                _id: x.itemInfo,
              });
            } else if (parseInt(x.type) == 1) {
              product = await foodModel.findOne({
                _id: x.itemInfo,
              });
            }

            if (!isEmpty(product)) {
              itemobj.code =
                parseInt(x.type) == 0
                  ? "PROD" + product.code
                  : parseInt(x.type) == 1
                  ? "FOOD" + product.prod_id
                  : "no code";
              itemobj._id = x.itemInfo;
              itemobj.type = parseInt(x.type);
              itemobj.name =
                x.type == 0 ? product.productName : product.prod_name;
              itemobj.unit = x.unit;
              itemobj.qty = parseInt(x.quantity);
              itemobj.rate = parseInt(x.rate);
              itemobj.amount = itemobj.qty * itemobj.rate;
              itemobj.dimension = x.dimension;
              itemobj.itemInfo = x.itemInfo;
              itemobj.uuid = x.uuid;
            }
          } else {
            itemobj.code = x.code;
            itemobj.name = x.productName;
            itemobj.unit = x.unit;
            itemobj.qty = x.orderQuantity;
            itemobj.rate = x.price;
            itemobj.amount = itemobj.qty * itemobj.rate;
            itemobj.type = parseInt(x.type);
            itemobj.itemInfo = x._id;
            itemobj.dimension = x.dimension;
            itemobj.uuid = x.uuid;
          }
          resobj.purchaseInfo.push(itemobj);
        }
        resobj.amountTotal = 0;
        resobj.purchaseInfo.map((x) => {
          resobj.amountTotal = resobj.amountTotal + x.amount;
        });
        resobj._id = purchaseInfo._id;
        resobj.type = req.body.type;
        if (resobj.type == 1) {
          if (typeof purchaseInfo.percentage == "number") {
            resobj.amountTotal =
              resobj.amountTotal -
              resobj.amountTotal * (purchaseInfo.percentage / 100);
          }
        }
        res = { data: resobj, status: STATUSCODES.SUCCESS };
      } else {
        res = {
          data: { msg: `No Grn/PurchaseWpo With this id` },
          status: STATUSCODES.NOTFOUND,
        };
      }
    } else {
      res = { data: { msg: "not objectid" }, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 24-07-23
module.exports.addPurchaseReturn = async (req) => {
  try {
    const {
      grnModel,
      purchasewopoModel,
      purchaseReturnModel,
      paymentVoucherModel,
    } = conn.purchase(req.decode.db);
    const { productModel } = conn.product(req.decode.db);
    const { foodModel } = conn.food(req.decode.db);
    const supplierModel = conn.supplier(req.decode.db);
    const { stockModel, stockLogModel } = conn.stock(req.decode.db);
    const { creditModel } = conn.payment(req.decode.db);
    const { shiftLogModel, logModel, shiftModel } = conn.settings(
      req.decode.db
    );
    let shiftExist = {};
    let shiftSettings = await shiftModel.findOne({
      branchId: req.body.branchId,
    });
    if (common_service.checkObject(shiftSettings)) {
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
          msg: `no shift Settings Defined For branch ${newPurchaseWoPo.branchId}`,
        },
        status: STATUSCODES.NOTFOUND,
      });
    }
    if (shiftExist != null) {
      if (req.body.returnInfo.length == 0) {
        return (res = {
          data: "No Item To retrun",
          status: STATUSCODES.BADREQUEST,
        });
      }
      let newpurchasereturn = new purchaseReturnModel({
        invoiceNo: req.body.invoiceNo,
        supplierId: req.body.supplierId,
        returnInfo: req.body.returnInfo,
        shiftId: shiftExist.shiftId,
        branchId: req.body.branchId,
        returnDate: new Date(req.body.returnDate).getTime(),
        purchasePk: req.body.purchasePk /* added on 11-05-23 */,
        type: req.body.type /* added on 11-05-23 */,
        total: req.body.total /* added on 11-05-23 */,
      });
      let returnList = await purchaseReturnModel.find({
        branchId: newpurchasereturn.branchId,
      });
      if (Array.isArray(returnList) && returnList.length > 0) {
        newpurchasereturn.transNo =
          returnList[returnList.length - 1].transNo + 1;
      } else {
        newpurchasereturn.transNo = 1;
      }
      newpurchasereturn.purchasePk = req.body.purchasePk;
      newpurchasereturn.type = parseInt(req.body.type);
      newpurchasereturn.total = req.body.total;
      let data = await newpurchasereturn.save();
      if (data != null) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.PURCHASEMANAGE_RETURN_ADD.type,
          description: LOG.PURCHASEMANAGE_RETURN_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        await Promise.all(
          data.returnInfo.map(async (x) => {
            let stockdata = {
              itemType: x.itemType,
              itemId: x.itemInfo,
              stock: -x.returnQty,
              branchId: data.branchId,
              dimension: x.dimension,
              rate: x.rate,
            };
            let stockExist = await stockModel.findOne({
              itemId: stockdata.itemId,
              branchId: stockdata.branchId,
            });
            let product = {};
            if (!isEmpty(stockExist)) {
              let stockFind = stockExist.stock.find(
                (x) => x.dimension == stockdata.dimension
              );
              if (!isEmpty(stockFind)) {
                if (stockFind.dimensionStock == 0 && stockdata.stock < 0) {
                  return (res = {
                    data: { msg: `Item Stock is ${stockFind.dimensionStock}` },
                    status: STATUSCODES.FORBIDDEN,
                  });
                } else {
                  stockFind.dimensionStock =
                    stockFind.dimensionStock + stockdata.stock;
                }
              } else {
                stockExist.stock.push({
                  dimension: stockdata.dimension,
                  dimensionStock: stockdata.stock,
                });
              }
              let stockdataresponse = await stockExist.save();
              if (stockdataresponse) {
                if (stockdata.itemType == 0) {
                  product = await productModel.findOne({
                    _id: stockdata.itemId,
                  });
                }
                if (stockdata.itemType == 1) {
                  product = await foodModel.findOne({
                    _id: stockdata.itemId,
                  });
                }
                let stockLogData = new stockLogModel({
                  itemType: stockdata.itemType,
                  itemId: stockdata.itemId,
                  stock: [
                    {
                      dimension: stockdata.dimension,
                      dimensionStock: stockdata.stock,
                    },
                  ],
                  branchId: stockdata.branchId,
                  date: new Date(req.body.returnDate).getTime(),
                  orderNo: newpurchasereturn.transNo,
                  type: PREFIXES.PURCHASERETURN,
                  categoryId: !isEmpty(product)
                    ? product.category
                    : null /* added on 06-03-24 */,
                  subCategoryId:
                    !isEmpty(product) && stockdata.itemType != 0
                      ? product.subcategoryId
                      : null /* added on 06-03-24 */,
                  rate: stockdata.rate /* added on 19-04-23 */,
                });
                /* ends here */
                let stocklogdataresponse = await stockLogData.save();
                if (stocklogdataresponse == null) {
                  return (res = {
                    data: { msg: "Error Saving Stock Updation To Log" },
                    status: STATUSCODES.UNPROCESSED,
                  });
                }
              } else {
                res = {
                  data: { msg: "Error Saving Stock" },
                  status: STATUSCODES.UNPROCESSED,
                };
              }
            } else {
              return (res = {
                data: {
                  msg: "Cannot Update Item Without Stock In This Branch",
                },
                status: STATUSCODES.NOTFOUND,
              });
            }
          })
        );
        let voucherdata = {};
        voucherdata.branchId = data.branchId;
        if (data.type == 0) {
          let grnExist = await grnModel.findOne({ _id: data.purchasePk });
          if (grnExist != null) {
            voucherdata.wpoId = PREFIXES.GRN + grnExist.transNo;
            voucherdata.branchId == data.branchId;
            voucherdata.supplierId == data.supplierId;
            voucherdata.lastPaidAmount = data.total;
            voucherdata.lastPaidDate = data.returnDate;
            voucherdata.paymentMethod = null;
            voucherdata.status = ORDERSTATUS.RET;
            voucherdata.date = voucherdata.lastPaidDate;
            voucherdata.purchasePk = data.purchasePk;
          } else {
            return (res = {
              data: { msg: `No Grn Found In The Current Return` },
              status: STATUSCODES.NOTFOUND,
            });
          }
        } else {
          let purchasewpoexist = await purchasewopoModel.findOne({
            _id: data.purchasePk,
          });
          if (purchasewpoexist != null) {
            voucherdata.wpoId = PREFIXES.PURCHASEWPO + purchasewpoexist.transNo;
            voucherdata.branchId = data.branchId;
            voucherdata.supplierId = data.supplierId;
            voucherdata.lastPaidAmount = data.total;
            voucherdata.lastPaidDate = data.returnDate;
            voucherdata.paymentMethod = null;
            voucherdata.status = ORDERSTATUS.RET;
            voucherdata.date = voucherdata.lastPaidDate;
            voucherdata.purchasePk = data.purchasePk;
          } else {
            return (res = {
              data: { msg: `No Pwpo Found In The Current Return` },
              status: STATUSCODES.NOTFOUND,
            });
          }
        }
        let voucherList = await paymentVoucherModel.find({
          branchId: data.branchId,
        });

        if (Array.isArray(voucherList) && voucherList.length > 0) {
          voucherdata.transNo = voucherList[voucherList.length - 1].transNo + 1;
        } else {
          voucherdata.transNo = 1;
        }
        voucherdata.purchaseReturnId = data._id;
        let newVoucher = new paymentVoucherModel(voucherdata);
        let voucherSaveData = await newVoucher.save();
        if (voucherSaveData == null) {
          return (res = {
            data: { msg: `Saving Voucher Failed In Purchase Return` },
            status: STATUSCODES.UNPROCESSED,
          });
        }
        let creditExist = await creditModel.findOne({
          purchasePk: data.purchasePk,
        });
        if (creditExist != null) {
          let creditAmount = creditExist.balance;
          if (data.total > creditExist.balance) {
            creditAmount = creditExist.balance;
            creditExist.balance = 0;
            creditExist.status =
              creditExist.balance == 0 ? ORDERSTATUS.RET : CREDITSTATUS.PEN;
          } else {
            creditExist.balance = creditExist.balance - data.total;
            creditExist.status =
              creditExist.balance == 0 ? ORDERSTATUS.RET : CREDITSTATUS.PEN;
            creditAmount = data.total;
          }
          creditExist.returnAmount = creditAmount;
          let supplierExist = await supplierModel.findOne({
            _id: data.supplierId,
          });
          if (supplierExist != null) {
            supplierExist.openingBalance =
              supplierExist.openingBalance - creditAmount;
          }
          let creditDataResponse = await creditModel.findOneAndUpdate(
            { purchasePk: data.purchasePk },
            { $set: creditExist },
            { returnDocument: "after" }
          );
          if (creditDataResponse != null) {
            let supplierDataResponse = await supplierModel.findOneAndUpdate(
              { _id: supplierExist._id },
              { $set: supplierExist },
              { returnDocument: "after" }
            );
            if (supplierDataResponse == null) {
              return (res = {
                data: { msg: `cannot save supplier updated credit` },
                status: STATUSCODES.UNPROCESSED,
              });
            }
          } else {
            return (res = {
              data: { msg: `cannot save credit record updated credit` },
              status: STATUSCODES.UNPROCESSED,
            });
          }
        }
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = {
          data: { msg: "Return Save Failed" },
          status: STATUSCODES.UNPROCESSED,
        });
      }
    } else {
      return (res = {
        data: { msg: `No Active Shift For ${req.body.branchId}` },
        status: STATUSCODES.NOTFOUND,
      });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 24-07-23
module.exports.generatePurchaseReturnId = async (req) => {
  try {
    const { purchaseReturnModel } = conn.purchase(req.decode.db);
    let purchaseRetList = await purchaseReturnModel.find({
      branchId: req.body.branchId,
    });
    let transNo = 1;
    if (purchaseRetList.length > 0) {
      transNo = purchaseRetList[purchaseRetList.length - 1].transNo + 1;
    }
    return (res = {
      data: { transNo: transNo, prefix: PREFIXES.PURCHASERETURN },
      status: STATUSCODES.SUCCESS,
    });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 25-07-2023
module.exports.viewPurchaseReturn = async (req) => {
  const { purchaseReturnModel } = conn.purchase(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  try {
    var returnList = [];
    let str = {};

    if (req.body.branchId) str.branchId = req.body.branchId;
    if (req.body.supplierId) str.supplierId = req.body.supplierId;
    returnList = await purchaseReturnModel.find(str);
    if (req.body.fromDate && req.body.toDate) {
      let new_list = [];
      returnList.some((item) => {
        if (
          new Date(item.returnDate).getTime() >=
            new Date(req.body.fromDate).getTime() &&
          new Date(item.returnDate).getTime() <=
            new Date(req.body.toDate).getTime()
        ) {
          new_list.push(item);
        }
      });
      returnList = new_list;
    }
    if (Array.isArray(returnList) && returnList.length > 0) {
      for (let i = 0; i < returnList.length; i++) {
        const element = returnList[i];
        element._doc["returnDate"] = common_service
          .prescisedateconvert(element.returnDate)
          .split(" ")[0];
        element._doc["locationName"] = "no Location";
        let location = await branchModel.findOne({
          storeCode: element.branchId,
        });
        if (location) {
          element._doc["locationName"] = location.branchName;
        }
        element._doc["transNo"] =
          PREFIXES.PURCHASERETURN +
          element.branchId.substring(3, 5) +
          element.transNo;
        let supplierExist = {};
        if (common_service.isObjectId(element.supplierId)) {
          supplierExist = await supplierModel.findOne({
            _id: element.supplierId,
          });
        }
        if (supplierExist) {
          element._doc["supplierName"] = supplierExist.supplierName;
        }
        element._doc["price"] = 0;
        if (
          Array.isArray(element.returnInfo) &&
          element.returnInfo.length > 0
        ) {
          await Promise.all(
            element.returnInfo.map((x) => {
              element._doc["price"] = element._doc["price"] + x.amount;
            })
          );
        }
      }
      res = { data: returnList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

//added on 26-07-2023
module.exports.generateGrnId = async (req) => {
  try {
    const { grnModel } = conn.purchase(req.decode.db);
    let grnList = await grnModel.find({ branchId: req.body.branchId });
    let transNo = 1;
    if (grnList.length > 0) {
      transNo = grnList[grnList.length - 1].transNo + 1;
    }
    return (res = {
      data: {
        prefix: PREFIXES.GRN + req.body.branchId.substring(3, 5),
        transNo: transNo,
      },
      status: STATUSCODES.SUCCESS,
    });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
// added on 26-07-23
module.exports.viewPurchaseReturnById = async (req) => {
  const { purchaseReturnModel, grnModel, purchasewopoModel } = conn.purchase(
    req.decode.db
  );
  const supplierModel = conn.supplier(req.decode.db);
  try {
    let purchaseExist = await purchaseReturnModel.findOne({
      _id: req.body._id,
    });
    let resobj = {};
    if (purchaseExist) {
      resobj.transNo =
        PREFIXES.PURCHASERETURN +
        purchaseExist.branchId.substring(3, 5) +
        purchaseExist.transNo;
      resobj.invoiceNo = purchaseExist.invoiceNo;
      let supplier = await supplierModel.findOne({
        _id: purchaseExist.supplierId,
      });
      resobj.supplierName = supplier.supplierName;
      resobj.returnDate = common_service
        .prescisedateconvert(purchaseExist.returnDate)
        .split(" ")[0];
      resobj.returnInfo = purchaseExist.returnInfo;
      if (purchaseExist.type == 0) {
      } else {
        let pwpo = await purchasewopoModel.findOne({
          _id: purchaseExist.purchasePk,
        });
        if (pwpo != null) {
          for (let i = 0; i < resobj.returnInfo.length; i++) {
            const element = resobj.returnInfo[i];
            let itemfind = pwpo.purchaseInfo.find(
              (x) => x.itemInfo == element.itemInfo
            );
            if (itemfind != null) {
              element.originalQty = itemfind.quantity;
              element.originalRate = itemfind.rate;
              element.originalAmt = itemfind.quantity * itemfind.rate;
            }
          }
        }
      }
      res = { data: resobj, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

// added on 26-07-23
module.exports.deletePurchaseReturn = async (req) => {
  const {
    purchaseReturnModel,
    paymentVoucherModel,
    purchasewopoModel,
    grnModel,
  } = conn.purchase(req.decode.db);
  const { creditModel } = conn.payment(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  const { stockLogModel, stockModel } = conn.stock(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let purchaseReturnExist = await purchaseReturnModel.findOne({
      _id: req.body._id,
    });
    if (common_service.checkObject(purchaseReturnExist)) {
      let branchExist = await branchModel.findOne({
        storeCode: purchaseReturnExist.branchId,
      });
      if (!common_service.checkObject(branchExist)) {
        return (res = {
          data: { msg: `Invalid Branch` },
          status: STATUSCODES.NOTFOUND,
        });
      }
      let voucherexist = await paymentVoucherModel.findOne({
        purchasePk: purchaseReturnExist.purchasePk,
        status: ORDERSTATUS.RET,
        purchaseReturnId: purchaseReturnExist._id,
      });
      let creditExist = await creditModel.findOne({
        purchasePk: purchaseReturnExist.purchasePk,
      });
      let purchasewpoexist = await purchasewopoModel.findOne({
        _id: purchaseReturnExist.purchasePk,
      });
      let grnExist = await grnModel.findOne({
        _id: purchaseReturnExist.purchasePk,
      });
      let voucherfind = await paymentVoucherModel.findOne({
        purchasePk: purchaseReturnExist.purchasePk,
        status: { $ne: ORDERSTATUS.RET },
      });
      let creditAmount = 0;
      if (purchaseReturnExist.type == 0) {
        if (common_service.checkObject(voucherfind)) {
          if (common_service.checkObject(voucherfind.paymentMethod)) {
            if (typeof voucherfind.paymentMethod.paidAmount == "number") {
              if (voucherfind.paymentMethod.paidAmount < grnExist.amount) {
                creditAmount = creditExist.balance = 0
                  ? grnExist.amount - voucherfind.paymentMethod.paidAmount
                  : voucherexist.lastPaidAmount;
                creditExist.balance =
                  grnExist.amount - voucherfind.paymentMethod.paidAmount;
              }
            }
          } else {
            creditAmount = voucherexist.lastPaidAmount;
            creditExist.balance =
              creditExist.balance + voucherexist.lastPaidAmount;
            if (creditExist.balance > 0) {
              creditExist.status = CREDITSTATUS.PEN;
            }
          }
        }
      }
      if (purchaseReturnExist.type == 1) {
        if (common_service.checkObject(voucherfind)) {
          if (common_service.checkObject(voucherfind.paymentMethod)) {
            if (typeof voucherfind.paymentMethod.paidAmount == "number") {
              if (
                voucherfind.paymentMethod.paidAmount < purchasewpoexist.amount
              ) {
                if (creditExist) {
                  creditAmount =
                    creditExist.balance == 0
                      ? purchasewpoexist.netAmount -
                        voucherfind.paymentMethod.paidAmount
                      : voucherexist.lastPaidAmount;
                  creditExist.balance =
                    purchasewpoexist.netAmount -
                    voucherfind.paymentMethod.paidAmount;
                  creditExist.returnAmount = 0;
                  if (creditExist.balance > 0) {
                    creditExist.status = CREDITSTATUS.PEN;
                  }
                }
              }
            }
          } else {
            if (creditExist != null) {
              creditAmount = voucherexist.lastPaidAmount;
              creditExist.balance =
                creditExist.balance + voucherexist.lastPaidAmount;

              creditExist.returnAmount = 0;
              if (creditExist.balance > 0) {
                creditExist.status = CREDITSTATUS.PEN;
              }
            }
          }
        }
      }

      let supplierExist = await supplierModel.findOne({
        _id: purchaseReturnExist.supplierId,
      });
      if (common_service.checkObject(supplierExist)) {
        supplierExist.openingBalance =
          supplierExist.openingBalance + creditAmount;
      }
      let prtdelete = await purchaseReturnModel.deleteOne({
        _id: purchaseReturnExist._id,
      });
      // let prtdelete = {};
      let stkUpdateList = [];
      if (prtdelete != null) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.PURCHASEMANAGE_RETURN_DELETE.type,
          description: LOG.PURCHASEMANAGE_RETURN_DELETE.description,
          branchId: req.body.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        if (purchaseReturnExist.returnInfo.length > 0) {
          for (let m = 0; m < purchaseReturnExist.returnInfo.length; m++) {
            const element = purchaseReturnExist.returnInfo[m];
            let stockLogData = await stockLogModel.findOne({
              orderNo: purchaseReturnExist.transNo,
              type: PREFIXES.PURCHASERETURN,
              "stock.dimensionStock": { $lt: 0 },
              itemId: element.itemInfo,
              branchId: purchaseReturnExist.branchId,
            });
            let stockExist = await stockModel.findOne({
              branchId: stockLogData.branchId,
              "stock.dimension": stockLogData.stock[0].dimension,
              itemId: stockLogData.itemId,
            });
            if (stockExist != null) {
              if (stockLogData != null) {
                stockExist.stock[0].dimensionStock =
                  stockExist.stock[0].dimensionStock -
                  stockLogData.stock[0].dimensionStock;
              }
            }
            await stockLogModel.deleteOne({ _id: stockLogData._id });
            await stockModel.findOneAndUpdate(
              { _id: stockExist._id },
              { $set: stockExist },
              { new: true }
            );
            stkUpdateList.push(stockExist);
          }
        }
        // let voucherDelete={ji:'ji'}
        let voucherDelete = await paymentVoucherModel.deleteOne({
          _id: voucherexist?._id,
        });
        // let voucherDelete = {};
        if (voucherDelete == null) {
          return (res = {
            data: { msg: `voucher delete failed` },
            status: STATUSCODES.UNPROCESSED,
          });
        }
        // let supplierresponse = { ji: "ji" };
        let supplierresponse = await supplierModel.findOneAndUpdate(
          { _id: supplierExist._id },
          { $set: supplierExist },
          { new: true }
        );
        if (supplierresponse == null) {
          return (res = {
            data: { msg: `supplier update failed` },
            status: STATUSCODES.UNPROCESSED,
          });
        }
        if (creditExist) {
          await creditModel.findOneAndUpdate(
            { _id: creditExist._id },
            { $set: creditExist },
            { new: true }
          );
        }
      }
      let obj = { creditExist, supplierExist, stkUpdateList };
      return (res = {
        data: {
          msg: `Purchase Return Deleted With Id ${
            PREFIXES.PURCHASERETURN + purchaseReturnExist.transNo
          }`,
          obj,
        },
        status: STATUSCODES.SUCCESS,
      });
    } else {
      return (res = {
        data: { msg: `No Purchase Return With This Id` },
        status: STATUSCODES.NOTFOUND,
      });
    }
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 28-07-23
module.exports.editPurchasereturn = async (req) => {
  try {
    const {
      grnModel,
      purchasewopoModel,
      purchaseReturnModel,
      paymentVoucherModel,
    } = conn.purchase(req.decode.db);
    const { productModel } = conn.product(req.decode.db);
    const { foodModel } = conn.food(req.decode.db);
    const supplierModel = conn.supplier(req.decode.db);
    const { stockModel, stockLogModel } = conn.stock(req.decode.db);
    const { creditModel, paymentModel } = conn.payment(req.decode.db);
    const { logModel } = conn.settings(req.decode.db);

    let purchaseExist = await purchaseReturnModel.findOne({
      _id: req.body._id,
    });
    let obj = {};
    if (purchaseExist != null) {
      let newlog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.FOODMANAGEMENT_FOOD_ADD.type,
        description: LOG.FOODMANAGEMENT_FOOD_ADD.description,
        branchId: req.body.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newlog.save();
      if (logresponse == null) {
        console.log("log save faild");
      }
      let transNo = purchaseExist.transNo;
      purchaseExist = req.body;
      purchaseExist.transNo = transNo;
      let data = purchaseExist;
      if (purchaseExist != null) {
        for (let i = 0; i < data.returnInfo.length; i++) {
          const x = data.returnInfo[i];
          let stockdata = {
            itemType: x.itemType,
            itemId: x.itemInfo,
            stock: -x.returnQty,
            branchId: data.branchId,
            dimension: x.dimension,
            rate: x.rate,
          };
          let oldStockLogData = await stockLogModel.findOne({
            itemId: stockdata.itemId,
            type: PREFIXES.PURCHASERETURN,
            orderNo: transNo,
            branchId: purchaseExist.branchId,
          });

          if (oldStockLogData != null) {
            // await stockLogModel.deleteOne({ _id: oldStockLogData._id });
          }
          let stockExist = await stockModel.findOne({
            itemId: stockdata.itemId,
            branchId: stockdata.branchId,
          });
          let product = {};

          if (!isEmpty(stockExist)) {
            let stockFind = stockExist.stock.find(
              (x) => x.dimension == stockdata.dimension
            );
            if (!isEmpty(stockFind)) {
              if (stockFind.dimensionStock == 0 && stockdata.stock < 0) {
                return (res = {
                  data: { msg: `Item Stock is ${stockFind.dimensionStock}` },
                  status: STATUSCODES.FORBIDDEN,
                });
              } else {
                stockFind.dimensionStock =
                  stockFind.dimensionStock -
                  oldStockLogData.stock[0].dimensionStock +
                  stockdata.stock;
              }
            } else {
              stockExist.stock.push({
                dimension: stockdata.dimension,
                dimensionStock: stockdata.stock,
              });
            }
            // let stockdataresponse = await stockExist.save();
            let stockdataresponse = stockExist;
            obj.stk = stockdataresponse;
            if (stockdataresponse) {
              if (stockdata.itemType == 0) {
                product = await productModel.findOne({
                  _id: stockdata.itemId,
                });
              }
              if (stockdata.itemType == 1) {
                product = await foodModel.findOne({
                  _id: stockdata.itemId,
                });
              }
              let stockLogData = new stockLogModel({
                itemType: stockdata.itemType,
                itemId: stockdata.itemId,
                stock: [
                  {
                    dimension: stockdata.dimension,
                    dimensionStock: stockdata.stock,
                  },
                ],
                branchId: stockdata.branchId,
                date: new Date(req.body.returnDate).getTime(),
                orderNo: purchaseExist.transNo,
                type: PREFIXES.PURCHASERETURN,
                categoryId: !isEmpty(product)
                  ? product.category
                  : null /* added on 06-03-24 */,
                subCategoryId:
                  !isEmpty(product) && stockdata.itemType != 0
                    ? product.subcategoryId
                    : null /* added on 06-03-24 */,
                rate: stockdata.rate /* added on 19-04-23 */,
              });
              /* ends here */
              // let stocklogdataresponse = await stockLogData.save();
              let stocklogdataresponse = stockLogData;
              obj.stockLogData = stockLogData;
              if (stocklogdataresponse == null) {
                return (res = {
                  data: { msg: "Error Saving Stock Updation To Log" },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            } else {
              res = {
                data: { msg: "Error Saving Stock" },
                status: STATUSCODES.UNPROCESSED,
              };
            }
          } else {
            return (res = {
              data: {
                msg: "Cannot Update Item Without Stock In This Branch",
              },
              status: STATUSCODES.NOTFOUND,
            });
          }
          let voucherdata = await paymentVoucherModel.findOne({
            purchaseReturnId: req.body._id,
          });
          voucherdata.branchId = data.branchId;

          let payableAmount = 0;
          if (data.type == 0) {
            let grnExist = await grnModel.findOne({ _id: data.purchasePk });
            if (grnExist != null) {
              voucherdata.wpoId = PREFIXES.GRN + grnExist.transNo;
              voucherdata.branchId == data.branchId;
              voucherdata.supplierId == data.supplierId;
              voucherdata.lastPaidAmount = data.total;
              voucherdata.lastPaidDate = data.returnDate;
              voucherdata.paymentMethod = null;
              voucherdata.status = ORDERSTATUS.RET;
              voucherdata.date = voucherdata.lastPaidDate;
              voucherdata.purchasePk = data.purchasePk;
            } else {
              return (res = {
                data: { msg: `No Grn Found In The Current Return` },
                status: STATUSCODES.NOTFOUND,
              });
            }
          } else {
            let purchasewpoexist = await purchasewopoModel.findOne({
              _id: data.purchasePk,
            });
            if (purchasewpoexist != null) {
              payableAmount = purchasewpoexist.netAmount;
              voucherdata.wpoId =
                PREFIXES.PURCHASEWPO + purchasewpoexist.transNo;
              voucherdata.branchId = data.branchId;
              voucherdata.supplierId = data.supplierId;
              voucherdata.lastPaidAmount = data.total;
              voucherdata.lastPaidDate = data.returnDate;
              voucherdata.paymentMethod = null;
              voucherdata.status = ORDERSTATUS.RET;
              voucherdata.date = voucherdata.lastPaidDate;
              voucherdata.purchasePk = data.purchasePk;
            } else {
              return (res = {
                data: { msg: `No Pwpo Found In The Current Return` },
                status: STATUSCODES.NOTFOUND,
              });
            }
          }
          let voucherSaveData = voucherdata;
          obj.voucher = voucherSaveData;
          if (voucherSaveData == null) {
            return (res = {
              data: { msg: `Saving Voucher Failed In Purchase Return` },
              status: STATUSCODES.UNPROCESSED,
            });
          }
          let creditExist = await creditModel.findOne({
            purchasePk: data.purchasePk,
          });
          let paidAmount = 0;
          let payments = await paymentModel.findOne({
            purchasePk: data.purchasePk,
          });
          if (payments != null) {
            payments.paymentMethod.map(
              (x) => (paidAmount = paidAmount + x.paidAmount)
            );
          }
          if (creditExist != null) {
            let creditAmount = creditExist.balance;
            if (data.total > payableAmount) {
              creditAmount = creditExist.balance;
              creditExist.balance = 0;
              creditExist.status =
                creditExist.balance == 0 ? ORDERSTATUS.RET : CREDITSTATUS.PEN;
            } else {
              creditExist.balance = payableAmount - paidAmount - data.total;
              creditExist.status =
                creditExist.balance == 0 ? ORDERSTATUS.RET : CREDITSTATUS.PEN;
              creditAmount = creditAmount - creditExist.balance;
            }
            creditExist.returnAmount = data.total;
            let supplierExist = await supplierModel.findOne({
              _id: data.supplierId,
            });
            if (supplierExist != null) {
              supplierExist.openingBalance =
                supplierExist.openingBalance - creditAmount;
              obj.supplier = supplierExist;
            }
            // let creditDataResponse = await creditModel.findOneAndUpdate(
            //   { purchasePk: data.purchasePk },
            //   { $set: creditExist },
            //   { returnDocument: "after" }
            // );
            let creditDataResponse = creditExist;
            if (creditDataResponse != null) {
              obj.credit = creditDataResponse;
              // let supplierDataResponse = await supplierModel.findOneAndUpdate(
              //   { _id: supplierExist._id },
              //   { $set: supplierExist },
              //   { returnDocument: "after" }
              // );
              let supplierDataResponse = supplierExist;
              obj.supplier = supplierDataResponse;
              if (supplierDataResponse == null) {
                return (res = {
                  data: { msg: `cannot save supplier updated credit` },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            } else {
              return (res = {
                data: { msg: `cannot save credit record updated credit` },
                status: STATUSCODES.UNPROCESSED,
              });
            }
          }
          return (res = { data: obj, status: STATUSCODES.SUCCESS });
        }
      } else {
        return (res = {
          data: "Save To Db Failed",
          status: STATUSCODES.UNPROCESSED,
        });
      }
    } else {
      return (res = {
        data: { msg: "no return in this id" },
        status: STATUSCODES.NOTFOUND,
      });
    }
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// adedd on 01-08-23
module.exports.deletePurchaseSectionData = async (req) => {
  const { purchaseModel, purchasewopoModel, grnModel, purchaseReturnModel } =
    conn.purchase(req.decode.db);
  const { stockModel, stockLogModel } = conn.stock(req.decode.db);
  try {
    // let branchExist = req.body.branchId;
    // let purchaseExist = await purchaseModel.find({ branchId: branchExist });
    // for (let j = 0; j < purchaseExist.length; j++) {
    //   const element = purchaseExist[j];
    // }
    // let purchaseWopoExist = await purchasewopoModel.find({
    //   branchId: branchExist,
    // });
    await purchaseReturnModel.deleteMany({ branchId: req.body.branchId });
    await purchaseModel.deleteMany({ branchId: req.body.branchId });
    await purchasewopoModel.deleteMany({ branchId: req.body.branchId });
    await grnModel.deleteMany({ branchId: req.body.branchId });
    let stockLogExist = await stockLogModel.find({
      $or: [
        { type: PREFIXES.PURCHASEWPO },
        { type: PREFIXES.PURCHASERETURN },
        { type: PREFIXES.GRN },
      ],
      // branchId: req.body.branchId,
    });

    // stockLogExist = stockLogExist.filter(
    //   (x) =>
    //     x.type == PREFIXES.PURCHASEWPO ||
    //     x.type == PREFIXES.GRN ||
    //     x.type == PREFIXES.PURCHASERETURN
    // );
    if (stockLogExist) {
      for (let i = 0; i < stockLogExist.length; i++) {
        const element = stockLogExist[i];
        let stockExist = await stockModel.findOne({
          itemId: element.itemId,
          branchId: element.branchId,
        });
        if (stockExist != null) {
          let dimension = stockExist.stock.find(
            (x) => x.dimension == element.stock[0].dimension
          );
          if (dimension != null) {
            dimension.dimensionStock =
              dimension.dimensionStock - element.stock[0].dimensionStock;
          }
          await stockModel.findOneAndUpdate(
            { _id: stockExist._id },
            { $set: stockExist },
            { new: true }
          );
        }
        await stockLogModel.deleteOne({ _id: element._id });
      }
      res = { data: stockLogExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

// added on 03-08-23
module.exports.addstockouts = async (req) => {
  const { stockOutModel } = conn.purchase(req.decode.db);
  try {
    req.body.branchId =
      req.decode.role == ROLES.ADMIN ? req.body.branchId : process.env.branchId;
    let stockOutExist = new stockOutModel({
      productType: req.body.productType,
      productId: req.body.productId,
      dimension: req.body.dimension,
      quantity: req.body.quantity,
      status: true,
      branchId: req.body.branchId,
    });
    let data = await stockOutExist.save();
    if (data) {
      res = { data: data, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

// added on 03-08-23
module.exports.viewStockOuts = async (req) => {
  const { stockOutModel } = conn.purchase(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let rsList = [];
    if (req.decode.role == ROLES.ADMIN) {
      branchId = req.body.branchId;
    } else {
      branchId = req.body.branchId;
    }
    let stockList = await stockOutModel.find({}).skip(req.body.index).limit(30);
    if (Array.isArray(stockList) && stockList.length > 0) {
      for (let i = 0; i < stockList.length; i++) {
        const element = stockList[i];
        if (common_service.isObjectId(element.productId)) {
          if (element.productType == 0) {
            let product = await productModel.findOne({
              _id: element.productId,
            });
            element._doc["itemName"] = product
              ? product.productName
              : "No product";
          } else if (element.productType == 1) {
            let products = await foodModel.findOne({
              _id: element.productId,
            });
            element._doc["itemName"] = products
              ? products.prod_name
              : "No products";
          }
        }
      }
      res = { data: stockList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 04-08-2023
module.exports.viewStkAdjustment = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    var stockRecievedList = [];
    if (!isEmpty(req.decode)) {
      if (req.decode.role == ROLES.ADMIN) {
        if (req.body.toLoc && common_service.isObjectId(req.body.toLoc)) {
          stockRecievedList = await stockAdjustmentModel.find({
            toLoc: req.body.toLoc,
            status: STOCKADJUSTMENTSTATUS.PEN,
          });
        } else {
          stockRecievedList = await stockAdjustmentModel.find({});
        }
      } else {
        if (req.decode.branchId.length > 0) {
          let branchExist = await branchModel.findOne({
            storeCode: req.decode.branchId,
          });
          if (!isEmpty(branchExist)) {
            var storePk = branchExist._id;
          } else {
            return (res = {
              data: { msg: "invalid branch" },
              status: STATUSCODES.UNPROCESSED,
            });
          }
        }
        if (storePk != null) {
          stockRecievedList = await stockAdjustmentModel.find({
            toLoc: storePk.toString(),
          });
        } else {
          return (res = {
            data: { msg: "Invalid StorePk" },
            status: STATUSCODES.UNPROCESSED,
          });
        }
      }
      stockRecievedList = stockRecievedList.filter(
        (x) => x.status != STOCKADJUSTMENTSTATUS.DRA
      );
      if (Array.isArray(stockRecievedList) && stockRecievedList.length > 0) {
        for (let i = 0; i < stockRecievedList.length; i++) {
          const element = stockRecievedList[i];
          element._doc["date"] = common_service
            .prescisedateconvert(element.date)
            .split(" ")[0];

          /* added on 20-09-22 added branch name to response */
          // element._doc["frmBranchName"] = await returnStoreNameByPk(
          //   element.fromLoc
          // );
          // element._doc["toBranchName"] = await returnStoreNameByPk(
          //   element.toLoc
          // );
          let fromLoc = {};
          let toLoc = {};
          if (common_service.isObjectId(element.fromLoc)) {
            fromLoc = await branchModel.findOne({
              _id: element.fromLoc,
            });
          }
          if (common_service.isObjectId(element.toLoc)) {
            toLoc = await branchModel.findOne({
              _id: element.toLoc,
            });
          }
          element._doc["frmBranchName"] = "no fromLoc";
          element._doc["toBranchName"] = "no toloc";
          if (!isEmpty(fromLoc)) {
            element._doc["frmBranchName"] = fromLoc.branchName;
            element._doc["transNo"] =
              PREFIXES.STOCKADJUSTMENT +
              fromLoc.storeCode.substr(3) +
              element.transNo;
          }
          if (!isEmpty(toLoc)) {
            element._doc["toBranchName"] = toLoc.branchName;
          }
          /* ends here */
          /* added on 24-10-22 */
          if (
            Array.isArray(element.purchaseInfo) &&
            element.purchaseInfo.length > 0
          ) {
            for (let j = 0; j < element.purchaseInfo.length; j++) {
              const elem = element.purchaseInfo[j];
              elem._doc["closingstock"] = 0;
              let stockObj = await stockModel.findOne({ itemId: elem.itemId });
              if (!isEmpty(stockObj)) {
                if (elem.itemType == 2) {
                  elem._doc["closingstock"] = stockObj.stock[0].dimensionStock;
                  elem._doc["openingStock"] =
                    elem._doc["closingstock"] - elem.adjQty;
                } else {
                  let dimensionFind = stockObj.stock.find(
                    (y) => y.dimension == elem.dimension
                  );
                  if (!isEmpty(dimensionFind)) {
                    elem._doc["closingstock"] = dimensionFind.dimensionStock;
                    elem._doc["openingStock"] =
                      elem._doc["closingstock"] - elem.adjQty;
                  }
                }
              }
            }
          }
          /* ends here */
        }
        res = { data: stockRecievedList, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: [], status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 03/08/23
module.exports.approveStockOut = async (req) => {
  const { stockOutModel } = conn.purchase(req.decode.db);
  const { stockModel, stockLogModel } = conn.stock(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  try {
    let stockOutExist = await stockOutModel.findOne({ _id: req.body._id });
    if (!isEmpty(stockOutExist)) {
      stockOutExist.status =
        req.body.status == 0 ? STOCKSTATUS.ACC : STOCKSTATUS.REJ;
      let data = await stockOutExist.save();
      if (data) {
        let stockdata = {
          itemType: stockOutExist.productType,
          itemId: stockOutExist.productId,
          stock: stockOutExist.quantity,
          branchId: stockOutExist.branchId,
          dimension: stockOutExist.dimension,
        };

        let stockExist = await stockModel.findOne({
          itemId: stockdata.itemId,
          branchId: stockdata.branchId,
        });
        if (!isEmpty(stockExist)) {
          let stockFind = stockExist.stock.find(
            (x) => x.dimension == stockdata.dimension
          );
          if (!isEmpty(stockFind)) {
            if (stockFind.dimensionStock == 0 && stockdata.stock < 0) {
              return (res = {
                data: { msg: `Item Stock is ${stockFind.dimensionStock}` },
                status: STATUSCODES.FORBIDDEN,
              });
            } else {
              stockFind.dimensionStock =
                stockFind.dimensionStock + stockdata.stock;
            }
          } else {
            stockExist.stock.push({
              dimension: stockdata.dimension,
              dimensionStock: stockdata.stock,
            });
          }
          let stockdataresponse = await stockExist.save();
          if (stockdataresponse) {
            let product = {};
            let rate = 0;
            if (stockdata.itemType == 1) {
              product = await foodModel.findOne({
                _id: stockdata.itemId,
              });
            }
            if (stockdata.itemType == 0) {
              product = await productModel.findOne({
                _id: stockdata.itemId,
              });
            }
            if (stockdata.itemType == 0) {
              rate = product.sellingRate;
            } else {
              if (common_service.checkObject(product)) {
                if (
                  Array.isArray(product.dimensions) &&
                  product.dimensions.length > 0
                ) {
                  let sizefind = product.dimensions.find(
                    (x) => x.size == stockdata.dimension
                  );
                  if (!isEmpty(sizefind)) {
                    rate = sizefind.mrp;
                  }
                }
              } else {
                rate = 0;
              }
            }
            let stockLogData = new stockLogModel({
              itemType: stockdata.itemType,
              itemId: stockdata.itemId,
              stock: [
                {
                  dimension: stockdata.dimension,
                  dimensionStock: stockdata.stock,
                },
              ],
              branchId: stockdata.branchId,
              date: new Date(req.body.date).getTime(),
              orderNo: 1,
              type: "StockOut",
              categoryId: !isEmpty(product) ? product.category : null,
              subCategoryId: !isEmpty(product) ? product.subcategoryId : null,
              rate,
            });

            let stocklogdataresponse = await stockLogData.save();
            if (isEmpty(stocklogdataresponse)) {
              return (res = {
                data: { msg: "Error Saving Stock Updation To Log" },
                status: STATUSCODES.UNPROCESSED,
              });
            }
          } else {
            res = { data: {}, status: STATUSCODES.UNPROCESSED };
          }
        } else {
          await stockOutModel.findOneAndUpdate(
            { _id: req.body._id },
            { $set: { status: STOCKSTATUS.PEN } },
            { new: true }
          );
          return (res = {
            data: { msg: "No Stock For This Product In This Branch" },
            status: STATUSCODES.NOTFOUND,
          });
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
    console.error(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

//added on 17-08-23
module.exports.viewConfirmStockAdjustments = async (req) => {
  const { stockAdjustmentModel } = conn.purchase(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    var stockRecievedList = [];
    if (!isEmpty(req.decode)) {
      if (req.decode.role == ROLES.ADMIN) {
        if (req.body.fromLoc && common_service.isObjectId(req.body.fromLoc)) {
          stockRecievedList = await stockAdjustmentModel.find({
            fromLoc: req.body.fromLoc,
            status: STOCKADJUSTMENTSTATUS.CON,
          });
        } else {
          stockRecievedList = await stockAdjustmentModel.find({
            status: STOCKADJUSTMENTSTATUS.CON,
          });
        }
      } else {
        if (req.decode.branchId.length > 0) {
          // var storePk = await returnStorePk(req.decode.branchId);
          let branchExist = await branchModel.findOne({
            storeCode: req.decode.branchId,
          });
          if (!isEmpty(branchExist)) {
            var storePk = branchExist._id;
          } else {
            return (res = {
              data: { msg: "invalid branch" },
              status: STATUSCODES.UNPROCESSED,
            });
          }
        }
        if (storePk != null) {
          stockRecievedList = await stockAdjustmentModel.find({
            fromLoc: storePk.toString(),
            status: STOCKADJUSTMENTSTATUS.CON,
          });
        } else {
          return (res = {
            data: { msg: "Invalid StorePk" },
            status: STATUSCODES.UNPROCESSED,
          });
        }
      }
      if (Array.isArray(stockRecievedList) && stockRecievedList.length > 0) {
        for (let i = 0; i < stockRecievedList.length; i++) {
          const element = stockRecievedList[i];
          element._doc["date"] = common_service
            .prescisedateconvert(element.date)
            .split(" ")[0];

          /* added on 20-09-22 added branch name to response */
          // element._doc["frmBranchName"] = await returnStoreNameByPk(
          //   element.fromLoc
          // );
          // element._doc["toBranchName"] = await returnStoreNameByPk(
          //   element.toLoc
          // );
          let fromLoc = {};
          let toLoc = {};
          if (common_service.isObjectId(element.fromLoc)) {
            fromLoc = await branchModel.findOne({
              _id: element.fromLoc,
            });
          }
          if (common_service.isObjectId(element.toLoc)) {
            toLoc = await branchModel.findOne({
              _id: element.fromLoc,
            });
          }
          element._doc["frmBranchName"] = "no fromLoc";
          element._doc["toBranchName"] = "no toloc";
          if (!isEmpty(fromLoc)) {
            element._doc["frmBranchName"] = fromLoc.branchName;
            element._doc["transNo"] =
              PREFIXES.STOCKADJUSTMENT +
              fromLoc.storeCode.substring(3, 5) +
              element.transNo;
          }
          if (!isEmpty(toLoc)) {
            element._doc["toBranchName"] = toLoc.branchName;
          }
          /* ends here */
          /* added on 24-10-22 */
          if (
            Array.isArray(element.purchaseInfo) &&
            element.purchaseInfo.length > 0
          ) {
            for (let j = 0; j < element.purchaseInfo.length; j++) {
              const elem = element.purchaseInfo[j];
              elem._doc["closingstock"] = 0;
              let stockObj = await stockModel.findOne({ itemId: elem.itemId });
              if (!isEmpty(stockObj)) {
                if (elem.itemType == 2) {
                  elem._doc["closingstock"] = stockObj.stock[0].dimensionStock;
                  elem._doc["openingStock"] =
                    elem._doc["closingstock"] - elem.adjQty;
                } else {
                  let dimensionFind = stockObj.stock.find(
                    (y) => y.dimension == elem.dimension
                  );
                  if (!isEmpty(dimensionFind)) {
                    elem._doc["closingstock"] = dimensionFind.dimensionStock;
                    elem._doc["openingStock"] =
                      elem._doc["closingstock"] - elem.adjQty;
                  }
                }
              }
            }
          }
          /* ends here */
        }
        res = { data: stockRecievedList, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: [], status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 17-08-2023
module.exports.PaymentVoucher = async (req) => {
  const { paymentVoucherModel } = conn.purchase(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { creditModel } = conn.payment(req.decode.db);
  try {
    var voucherList = [];
    if (!isEmpty(req.decode)) {
      if (req.decode.role == ROLES.ADMIN) {
        voucherList = req.body.branchId
          ? await paymentVoucherModel.find({
              branchId: req.body.branchId,
              status: CREDITSTATUS.COM,
            })
          : await paymentVoucherModel.find({ status: CREDITSTATUS.COM });
      } else {
        voucherList = await paymentVoucherModel.find({
          branchId: req.body.branchId,
          status: CREDITSTATUS.COM,
        });
      }
      if (Array.isArray(voucherList) && voucherList.length > 0) {
        for (let i = 0; i < voucherList.length; i++) {
          const element = voucherList[i];
          let supplier = await supplierModel.findOne({
            _id: element.supplierId,
          });
          let branchExist = await branchModel.findOne({
            storeCode: element.branchId,
          });
          element._doc["supplierName"] = !isEmpty(supplier)
            ? supplier.supplierName
            : "No Name";
          element._doc["lastPaidDate"] = common_service
            .prescisedateconvert(element.lastPaidDate)
            .split(" ")[0];
          element._doc["transNo"] = `${
            PREFIXES.PAYMENTVOUCHER +
            req.decode.prefix.substring(0, 2) +
            element.transNo
          }`;

          element._doc["branchName"] = !isEmpty(branchExist)
            ? branchExist.branchName
            : "No branchName";
          let creditExist = await creditModel.findOne({
            purchaseId: element.wpoId,
            branchId: element.branchId,
          });
          element._doc["creditAmount"] = !isEmpty(creditExist)
            ? creditExist.balance
            : 0;
        }
        res = { data: voucherList, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: [], status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: { msg: e }, status: STATUSCODES.ERROR });
  }
};

// Added on 17-08-2023
module.exports.pendingPaymentVoucher = async (req) => {
  const { paymentVoucherModel } = conn.purchase(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  const { creditModel } = conn.payment(req.decode.db);
  try {
    var voucherList = [];
    if (!isEmpty(req.decode)) {
      if (req.decode.role == ROLES.ADMIN) {
        voucherList = req.body.branchId
          ? await paymentVoucherModel.find({
              branchId: req.body.branchId,
              status: CREDITSTATUS.PEN,
            })
          : await paymentVoucherModel.find({ status: CREDITSTATUS.PEN });
      } else {
        voucherList = await paymentVoucherModel.find({
          branchId: req.decode.branchId,
          status: CREDITSTATUS.PEN,
        });
      }
      if (Array.isArray(voucherList) && voucherList.length > 0) {
        for (let i = 0; i < voucherList.length; i++) {
          const element = voucherList[i];
          let supplierId = {};
          if (common_service.isObjectId(element.supplierId)) {
            supplierId = await supplierModel.findOne({
              _id: element.supplierId,
            });
            // supplierId = await this.viewsupplierById(element.supplierId);
          }
          element._doc["supplierName"] = !isEmpty(supplierId)
            ? supplierId.supplierName
            : "No supplier";
          element._doc["lastPaidDate"] = common_service
            .prescisedateconvert(element.lastPaidDate)
            .split(" ")[0];

          element._doc["date"] =
            element.date != undefined
              ? common_service.prescisedateconvert(element.date).split(" ")[0]
              : "no date";
          element._doc["transNo"] = `${
            PREFIXES.PENDINGPAYMENTVOUCHER +
            req.decode.prefix.substring(0, 2) +
            element.transNo
          }`;
          let branchExist = await branchModel.findOne({
            storecode: element.branchId,
          });
          let creditExist = await creditModel.findOne({
            purchaseId: element.wpoId,
            branchId: element.branchId,
          });
          element._doc["branchName"] = !common_service.isEmpty(branchExist)
            ? branchExist.branchName
            : "no LocationName";
          element._doc["creditAmount"] = !common_service.isEmpty(creditExist)
            ? creditExist.balance
            : 0;
        }
        res = { data: voucherList, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: [], status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: { msg: e }, status: STATUSCODES.ERROR });
  }
};

module.exports.generateTrasactionId = async (req) => {
  const { paymentVoucherModel } = conn.purchase(req.decode.db);
  try {
    let transNo = 0;
    let gen = await paymentVoucherModel.find({
      branchId: req.body.branchId,
    });
    if (gen.length > 0) {
      transNo = gen[gen.length - 1].transNo + 1;
    } else transNo = 1;
    // let prefix = PREFIXES.STOCKTRANSFER + req.decode.prefix.substring(0, 2);
    return (res = {
      data: { transNo },
      status: STATUSCODES.SUCCESS,
    });
  } catch (e) {
    console.error(error);
    return (res = { data: { msg: e }, status: STATUSCODES.ERROR });
  }
};

// Added on 22-08-23
module.exports.ViewSinglePaymentVoucher = async (req) => {
  const { paymentVoucherModel } = conn.purchase(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  const { creditModel } = conn.payment(req.decode.db);
  try {
    let singleVoucher = [];
    if (req.body) {
      singleVoucher = await paymentVoucherModel.findOne({ _id: req.body._id });
      let supplierId = {};
      if (common_service.isObjectId(singleVoucher.supplierId)) {
        supplierId = await supplierModel.findOne({
          _id: singleVoucher.supplierId,
        });
      }
      singleVoucher._doc["supplierName"] = !isEmpty(supplierId)
        ? supplierId.supplierName
        : "No supplier";
      singleVoucher._doc["lastPaidDate"] = common_service
        .prescisedateconvert(singleVoucher.lastPaidDate)
        .split(" ")[0];

      singleVoucher._doc["date"] =
        singleVoucher.date != undefined
          ? common_service.prescisedateconvert(singleVoucher.date).split(" ")[0]
          : "no date";
      singleVoucher._doc["transNo"] = `${
        PREFIXES.PENDINGPAYMENTVOUCHER +
        req.decode.prefix.substring(0, 2) +
        singleVoucher.transNo
      }`;

      let creditExist = await creditModel.findOne({
        purchaseId: singleVoucher.wpoId,
        branchId: singleVoucher.branchId,
      });
      singleVoucher._doc["creditAmount"] = !common_service.isEmpty(creditExist)
        ? creditExist.balance
        : 0;

      return (res = { data: singleVoucher, status: STATUSCODES.SUCCESS });
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
  } catch (e) {
    console.error(e);
    return (res = {
      data: { msg: "Internal Server Error" },
      status: STATUSCODES.ERROR,
    });
  }
};

// added on 08-09-23
module.exports.getAllTransfers = async (req) => {
  try {
    const { transferModel } = conn.purchase(req.decode.db);
    const { branchModel } = conn.location(req.decode.db);
    let arr = [];
    // let branchId =
    //   req.decode.role == ROLES.ADMIN ? req.body.branchId : process.env.branchId;
    // let transfer = await transferModel.find({
    //   $or: [{ fromLoc: branchId }, { toLoc: branchId }],
    // });
    let transfer = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        transfer = await transferModel.find({
          fromLoc: req.body.branchId,
        });
      } else {
        transfer = await transferModel.find({});
      }
    } else {
      transfer = await transferModel.find({
        fromLoc: req.body.branchId,
      });
    }
    if (transfer.length > 0) {
      for (let i = 0; i < transfer.length; i++) {
        let fromLoc = await branchModel.findOne({
          storeCode: transfer[i].fromLoc,
        });
        let toLoc = await branchModel.findOne({ storeCode: transfer[i].toLoc });

        let item = {
          _id: transfer[i]._id,
          transNo:
            PREFIXES.STOCKTRANSFER +
            fromLoc.storeCode.substring(3, 5) +
            transfer[i].transNo,
          fromLoc: !isEmpty(fromLoc) ? fromLoc?.branchName : "no fromloc",
          toLoc: !isEmpty(toLoc) ? toLoc?.branchName : "no toLoc",
          transferDate: common_service
            .prescisedateconvert(transfer[i].transferDate)
            .split(" ")[0],
          margin: transfer[i].margin,
          status: transfer[i].status,
        };
        arr.push(item);
      }
      return (res = { data: arr, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (error) {
    console.error(error);
    return (res = { data: "Internel server error", status: STATUSCODES.ERROR });
  }
};
//#endregion
