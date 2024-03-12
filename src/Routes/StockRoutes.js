/** @format */

//created on 08-02-2022
//#region headers
const { STATUSCODES, PREFIXES } = require("../Model/enums.js");
const { stockModel } = require("../Model/StockTransferModel.js");
const prodService = require("../Routes/ProductRoutes.js");
const common_service = require("../Routes/commonRoutes.js");
const conn = require("../../userDbConn.js");
//#endregion

//#region methods
module.exports.addStockPurchaseLog = async (req) => {
  const { stockModel } = conn.stock(process.env.db);
  try {
    let res = {};
    let stockLogData = new stockModel({
      prodID: req.prodID ? req.prodID : null,
      stockAdded: req.stockAdded ? req.stockAdded : 0,
      purchaseId: req.purchaseId ? req.purchaseId : null,
      date: new Date(req.date).getTime(),
      branchId: process.env.branchId ? process.env.branchId : null,
      unitPrice: req.unitPrice ? req.unitPrice : 0,
    });
    let data = await stockLogData.save();

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

//edited on 11-02-2022
module.exports.stockReport = async (req) => {
  try {
    let res = {};
    let new_list = [];
    let rslist = [];
    let stockDetails = await stockModel.find({});
    if (stockDetails.length > 0) {
      stockDetails.some((item) => {
        if (
          new Date(item.date).getTime() >=
            new Date(req.query.fromDate).getTime() &&
          new Date(item.date).getTime() <= new Date(req.query.endDate).getTime()
        ) {
          new_list.push(item);
        }
      });

      for (let i = 0; i < new_list.length; i++) {
        const element = new_list[i];
        if (rslist.some((e) => e.prodID == element.prodID)) {
          let index = rslist.findIndex((e) => e.prodID == element.prodID);
          rslist[index].stockAdded =
            rslist[index].stockAdded + element.stockAdded;
          rslist[index].stockTaken =
            rslist[index].stockTaken - element.stockTaken;
        } else {
          rslist.push(element);
        }
      }
      for (let i = 0; i < rslist.length; i++) {
        const element = rslist[i];
        let prodInfo = await prodService.viewProductSingle(element.prodID);
        element._doc["productName"] = prodInfo.data
          ? prodInfo.data.productName
          : null;
        element._doc["date"] = common_service.prescisedateconvert(element.date);
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
// added on 20/07/23
module.exports.viewStockEntryDetails = async (req) => {
  try {
    if (req.body.db) {
      req.decode.db = req.body.db;
    }
    const { stockLogModel } = conn.stock(req.decode.db);
    const { productModel } = conn.product(req.decode.db);
    const { foodModel } = conn.food(req.decode.db);
    let BRID = null;
    let rslist = [];
    let stockList = [];
    let new_list = [];

    if (req.body.all == "true") {
      stockList = await stockLogModel.find({});
    } else {
      stockList = await stockLogModel.find({ branchId: req.body.branchId });
    }
    if (req.body.branchId == "string" && req.body.all != "true") {
      stockList = stockList.filter((x) => x.branchId == req.body.branchId);
    }
    if (req.body.itemType) {
      req.body.itemType = parseInt(req.body.itemType);
      stockList = stockList.filter((x) => x.itemType == req.body.itemType);
    }
    if (req.body.itemId) {
      stockList = stockList.filter((x) => x.itemId == req.body.itemId);
    }
    if (
      common_service.checkIfNullOrUndefined(req.body.fromDate, req.body.endDate)
    ) {
      stockList.some((item) => {
        if (
          new Date(item.date).getTime() >=
            new Date(req.body.fromDate).getTime() &&
          new Date(item.date).getTime() <= new Date(req.body.endDate).getTime()
        ) {
          new_list.push(item);
        }
      });
      stockList = new_list;
    }
    if (stockList.length > 0) {
      for (let i = 0; i < stockList.length; i++) {
        const element = stockList[i];
        let resobj = {};
        resobj._id = element._id;
        resobj.itemType = element.itemType;
        resobj.itemId = element.itemId;
        resobj.dimension = element.stock[0].dimension;
        resobj.stock = element.stock[0].dimensionStock;
        resobj.branchId = element.branchId;
        resobj.productName = "no product name";
        resobj.orderNo =
          typeof element.orderNo == "number"
            ? element.orderNo
            : "No Order Number";
        resobj.type = element.type;
        resobj.rate = typeof element.rate == "number" ? element.rate : 0;
        let product = {};
        if (element.itemType == 0) {
          product = await productModel.findOne({
            _id: element.itemId,
          });
        } else if (element.itemType == 1) {
          product = await foodModel.findOne({
            _id: element.itemId,
          });
        }
        if (!common_service.isEmpty(product)) {
          resobj.productName = product.productName;
        }
        resobj.transDate = common_service.prescisedateconvert(element.date);
        rslist.push(resobj);
      }
    }
    if (req.body.productName) {
      rslist = rslist.filter((x) => x.productName == req.body.productName);
    }
    if (req.body.isNeg) {
      if (req.body.isNeg == "true") {
        rslist = rslist.filter((x) => x.stock < 0);
      } else {
        rslist = rslist.filter((x) => x.stock > 0);
      }
    }
    if (req.body.dimension) {
      rslist = rslist.filter((x) => x.dimension == req.body.dimension);
    }
    let incstk = 0,
      outstk = 0;
    rslist.map((y) => {
      if (y.stock > 0) {
        incstk = incstk + y.stock;
      } else {
        outstk = outstk + y.stock;
      }
    });
    let balance = incstk + outstk;
    let resp = { rslist, incstk, outstk, balance };
    return (res = { data: resp, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.SUCCESS });
  }
};

//added on 20-07-23
module.exports.findItemsInOrder = async (req) => {
  try {
    if (req.body.db) {
      req.decode.db = req.body.db;
    }
    const { orderModel } = conn.order(req.decode.db);
    const { branchModel } = conn.location(req.decode.db);
    let branchExist = await branchModel.findOne({
      storeCode: req.body.branchId,
    });
    let rslist = [];
    if (!common_service.isEmpty(branchExist)) {
      req.body.orderType = parseInt(req.body.orderType);

      let orderList = await orderModel.find({
        branchId: branchExist.storeCode,
      });
      let neworderList = [];
      if (
        common_service.checkIfNullOrUndefined(
          req.body.fromDate,
          req.body.endDate
        )
      ) {
        orderList.some((x) => {
          if (
            x.orderDate >= new Date(req.body.fromDate).getTime() &&
            x.orderDate <= new Date(req.body.endDate).getTime()
          ) {
            neworderList.push(x);
          }
        });
        orderList = neworderList;
      }
      for (let i = 0; i < orderList.length; i++) {
        const element = orderList[i];
        if (Array.isArray(element.orderInfo) && element.orderInfo.length > 0) {
          for (let j = 0; j < element.orderInfo.length; j++) {
            if (element.orderInfo[j].itemInfo == req.body.itemId) {
              let resobj = {};
              resobj.productId = element.orderInfo[j].itemInfo;
              resobj.qty = parseInt(element.orderInfo[j].quantity);
              resobj.invoiceNo = element.orderId;
              resobj.date = common_service.prescisedateconvert(
                element.orderDate
              );
              resobj.dimension = element.orderInfo[j].dimension;
              resobj.datemilli = element.orderDate;
              rslist.push(resobj);
            }
          }
        }
      }

      let qty = 0;
      rslist.map((x) => (qty = qty + x.qty));
      let suborder = [];
      if (
        common_service.checkIfNullOrUndefined(
          req.body.fromDate,
          req.body.endDate
        )
      ) {
        rslist.some((x) => {
          if (
            x.datemilli >= new Date(req.body.fromDate).getTime() &&
            x.datemilli <= new Date(req.body.endDate).getTime()
          ) {
            suborder.push(x);
          }
        });
        orderList = suborder;
      }
      res = { data: { qty, rslist }, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: { msg: "invalid branch" }, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 29/07/23
module.exports.stockSummaryReport = async (req) => {
  try {
    const { stockModel, stockLogModel } = conn.stock(req.decode.db);
    const { branchModel } = conn.location(req.decode.db);
    const { foodModel } = conn.food(req.decode.db);
    const { productModel } = conn.product(req.decode.db);
    let stockloglist = await stockLogModel.find({});
    let newstockloglist = [];
    let rsList = [];
    req.body.itemType = parseInt(req.body.itemType);
    if (req.body.branchId == null) {
      req.body.branchId = req.body.branchId;
    }
    if (req.body.branchId) {
      stockloglist = stockloglist.filter(
        (x) => x.branchId == req.body.branchId
      );
    }

    if (typeof req.body.itemType == "number") {
      stockloglist = stockloglist.filter(
        (x) => x.itemType == req.body.itemType
      );
    }

    if (req.body.categoryId) {
      stockloglist = stockloglist.filter(
        (x) => x.categoryId == req.body.categoryId
      );
    }
    if (req.body.subCategoryId) {
      stockloglist = stockloglist.filter(
        (x) => x.subCategoryId == req.body.subCategoryId
      );
    }
    if (req.body.itemId) {
      stockloglist = stockloglist.filter((x) => x.itemId == req.body.itemId);
    }

    if (req.body.fromDate == "" && req.body.endDate == "") {
      req.body.fromDate = null;
      req.body.endDate = null;
    }

    if (
      common_service.checkIfNullOrUndefined(req.body.fromDate, req.body.endDate)
    ) {
      stockloglist.some((x) => {
        if (
          x.date >= new Date(req.body.fromDate).getTime() &&
          x.date <= new Date(req.body.endDate).getTime()
        ) {
          newstockloglist.push(x);
        }
      });
      stockloglist = newstockloglist;
    }
    if (Array.isArray(stockloglist) && stockloglist.length > 0) {
      for (let i = 0; i < stockloglist.length; i++) {
        const element = stockloglist[i];
        let prevstockList = [];
        prevstockList = await stockLogModel.find({
          itemId: element.itemId.toString(),
          "stock.dimension": element.stock[0].dimension,
          date: { $lt: new Date(req.body.fromDate).getTime() },
        });

        if (req.body.branchId) {
          prevstockList = prevstockList.filter(
            (x) => x.branchId == req.body.branchId
          );
        }
        if (rsList.length == 0) {
          let resobj = {
            branchId: "no branchId",
            locationName: "no branchid",
            productId: "no productid",
            productName: "no product name",
            opbalance: 0,
            closingstock: 0,
            dimension: "No data",
            purchases: 0,
            purchasereturn: 0,
            transin: 0,
            transout: 0,
            sales: 0,
            negreceipie: 0,
            posreceipie:0,
            postadj: 0,
            isNegative: 0,
            salesReturn: 0,
            _id: "No Pk",
            date: 0,
            filterdim: "empty string",
          };
          if (Array.isArray(prevstockList)) {
            prevstockList.map((x) => {
              if (Array.isArray(x.stock)) {
                resobj.opbalance = resobj.opbalance + x.stock[0].dimensionStock;
              }
            });
          }
          resobj.branchId = element.branchId;
          let branch = await branchModel.findOne({
            storeCode: element.branchId,
          });
          if (!common_service.isEmpty(branch)) {
            resobj.locationName = branch.branchName;
          }
          if (element.itemType == 1) {
            if (common_service.isObjectId(element.itemId)) {
              product = await foodModel.findOne({
                _id: element.itemId,
              });
            }
            resobj.productId = !common_service.isEmpty(product)
              ? "FOOD" + product.prod_id
              : "No Id";
            resobj.productName = !common_service.isEmpty(product)
              ? product.prod_name
              : "no product name";
            resobj.dimension = element.stock[0].dimension;
          } else if (element.itemType == 0) {
            if (common_service.isObjectId(element.itemId)) {
              product = await productModel.findOne({
                _id: element.itemId,
              });
            }
            resobj.productId = !common_service.isEmpty(product)
              ? PREFIXES.PRODUCT + product.code
              : "no product name";
            resobj.productName = !common_service.isEmpty(product)
              ? product.productName
              : "no product name";
            resobj.dimension = element.stock[0].dimension;
          }
          resobj.date = new Date(element.date).setUTCHours(-5, -30, 0, 0);
          resobj._id = element.itemId;
          resobj.filterdim = element.stock[0].dimension;

          if (element.type != undefined) {
            if (element.type == PREFIXES.GRN) {
              resobj.purchases =
                resobj.purchases + element.stock[0].dimensionStock;
            }
            if (element.type == PREFIXES.PURCHASEWPO) {
              resobj.purchases =
                resobj.purchases + element.stock[0].dimensionStock;
            }
            if (element.type == PREFIXES.STOCKADJUSTMENT) {
              if (element.stock[0].dimensionStock < 0) {
                resobj.isNegative =
                  resobj.isNegative + element.stock[0].dimensionStock;
              } else {
                resobj.postadj =
                  resobj.postadj + element.stock[0].dimensionStock;
              }
            }
            if (element.type == PREFIXES.WORKORDER) {
              resobj.sales = resobj.sales + element.stock[0].dimensionStock;
            }
            if (element.type == PREFIXES.RECEIPIENT) {
              if(element.stock[0].dimensionStock < 0){
                resobj.negreceipie =resobj.negreceipie + element.stock[0].dimensionStock
              } else {
                resobj.posreceipie = resobj.posreceipie + element.stock[0].dimensionStock
              }
            }
            if (element.type == PREFIXES.SALESINV) {
              resobj.sales = resobj.sales + element.stock[0].dimensionStock;
            }
            if (element.type == PREFIXES.STOCKTRANSFER) {
              if (element.stock[0].dimensionStock < 0) {
                resobj.transout =
                  resobj.transout + element.stock[0].dimensionStock;
              } else {
                resobj.transin =
                  resobj.transin + element.stock[0].dimensionStock;
              }
            }
            if (element.type == PREFIXES.SALESRETURN) {
              resobj.salesReturn =
                resobj.salesReturn + element.stock[0].dimensionStock;
            }
            if (element.type == PREFIXES.PURCHASERETURN) {
              resobj.purchasereturn =
                resobj.purchasereturn + element.stock[0].dimensionStock;
            }
          }
          let adStock =
            resobj.opbalance +
            resobj.purchases +
            resobj.transin +
            resobj.postadj +
            resobj.salesReturn+
            resobj.posreceipie;
          let minStock =
            resobj.purchasereturn +
            resobj.transout +
            resobj.sales +
            resobj.isNegative +
            resobj.negreceipie;
          resobj.closingstock = adStock + minStock;
          rsList.push(resobj);
        } else {
          let rsfind = rsList.find(
            (x) =>
              x._id == element.itemId &&
              x.filterdim == element.stock[0].dimension &&
              x.date == common_service.startandenddateofaday(element.date).start
          );
          if (!common_service.isEmpty(rsfind)) {
            if (element.type != undefined) {
              if (element.type == PREFIXES.GRN) {
                rsfind.purchases =
                  rsfind.purchases + element.stock[0].dimensionStock;
              }
              if (element.type == PREFIXES.PURCHASEWPO) {
                rsfind.purchases =
                  rsfind.purchases + element.stock[0].dimensionStock;
              }
              if (element.type == PREFIXES.STOCKADJUSTMENT) {
                if (element.stock[0].dimensionStock < 0) {
                  rsfind.isNegative =
                    rsfind.isNegative + element.stock[0].dimensionStock;
                } else {
                  rsfind.postadj =
                    rsfind.postadj + element.stock[0].dimensionStock;
                }
              }

              if (element.type == PREFIXES.WORKORDER) {
                rsfind.sales = rsfind.sales + element.stock[0].dimensionStock;
              }
              if (element.type == PREFIXES.SALESINV) {
                rsfind.sales = rsfind.sales + element.stock[0].dimensionStock;
              }
              if (element.type == PREFIXES.RECEIPIENT) {
                if(element.stock[0].dimensionStock < 0){
                  rsfind.negreceipie =
                  rsfind.negreceipie + element.stock[0].dimensionStock;
                } else {
                  rsfind.posreceipie =
                  rsfind.posreceipie + element.stock[0].dimensionStock;
                }  
              }
              if (element.type == PREFIXES.STOCKTRANSFER) {
                if (element.stock[0].dimensionStock > 0) {
                  rsfind.transin =
                    rsfind.transin + element.stock[0].dimensionStock;
                } else {
                  rsfind.transout =
                    rsfind.transout + element.stock[0].dimensionStock;
                }
              }
              if (element.type == PREFIXES.SALESRETURN) {
                rsfind.salesReturn =
                  rsfind.salesReturn + element.stock[0].dimensionStock;
              }
              if (element.type == PREFIXES.PURCHASERETURN) {
                rsfind.purchasereturn =
                  rsfind.purchasereturn + element.stock[0].dimensionStock;
              }
            }
            let adStock =
              rsfind.opbalance +
              rsfind.purchases +
              rsfind.transin +
              rsfind.postadj +
              rsfind.salesReturn+
              rsfind.posreceipie;
            let minStock =
              rsfind.purchasereturn +
              rsfind.transout +
              rsfind.sales +
              rsfind.isNegative +
              rsfind.negreceipie;
            rsfind.closingstock = adStock + minStock;
            if (rsfind.closingstock < 0) {
              rsfind.closingstock = 0;
            }
          } else {
            let rsfind = rsList.filter(
              (x) =>
                x._id == element.itemId &&
                x.filterdim == element.stock[0].dimension
            );
            let resobj = {
              branchId: "no branchId",
              locationName: "no branchid",
              productId: "no productid",
              productName: "no product name",
              opbalance: 0,
              closingstock: 0,
              dimension: "No data",
              purchases: 0,
              purchasereturn: 0,
              transin: 0,
              transout: 0,
              posreceipie:0,
              negreceipie:0,
              sales: 0,
              receipie: 0,
              postadj: 0,
              isNegative: 0,
              salesReturn: 0,
              _id: "No Pk",
              date: 0,
              filterdim: "empty string",
            };
            resobj.branchId = element.branchId;
            let prevstockList = [];
            prevstockList = await stockLogModel.find({
              itemId: element.itemId.toString(),
              "stock.dimension": element.stock[0].dimension,
              date: { $lt: new Date(req.body.fromDate).getTime() },
            });

            if (req.body.branchId) {
              prevstockList = prevstockList.filter(
                (x) => x.branchId == req.body.branchId
              );
            }
            if (Array.isArray(prevstockList)) {
              prevstockList.map((x) => {
                if (Array.isArray(x.stock)) {
                  resobj.opbalance =
                    resobj.opbalance + x.stock[0].dimensionStock;
                }
              });
            }
            if (rsfind.length > 0) {
              resobj.opbalance = rsfind[rsfind.length - 1].closingstock;
            }

            let branch = await branchModel.findOne({
              storeCode: element.branchId,
            });
            if (!common_service.isEmpty(branch)) {
              resobj.locationName = branch.branchName;
            }
            if (element.itemType == 0) {
              if (common_service.isObjectId(element.itemId)) {
                product = await productModel.findOne({
                  _id: element.itemId,
                });
              }
              resobj.productId = !common_service.isEmpty(product)
                ? PREFIXES.PRODUCT + product.code
                : "No Id";
              resobj.productName = !common_service.isEmpty(product)
                ? product.productName
                : "no product name";
              resobj.dimension = element.stock[0].dimension;
            } else if (element.itemType == 1) {
              if (common_service.isObjectId(element.itemId)) {
                product = await foodModel.findOne({
                  _id: element.itemId,
                });
              }
              resobj.productId = !common_service.isEmpty(product)
                ? "FOOD" + product.prod_id
                : "no product name";
              resobj.productName = !common_service.isEmpty(product)
                ? product.prod_name
                : "no product name";
              resobj.dimension = element.stock[0].dimension;
            }
            resobj.date = new Date(element.date).setUTCHours(-5, -30, 0, 0);
            resobj._id = element.itemId;
            resobj.filterdim = element.stock[0].dimension;
            if (element.type != undefined) {
              if (element.type == PREFIXES.GRN) {
                resobj.purchases =
                  resobj.purchases + element.stock[0].dimensionStock;
              }
              if (element.type == PREFIXES.PURCHASEWPO) {
                resobj.purchases =
                  resobj.purchases + element.stock[0].dimensionStock;
              }
              if (element.type == PREFIXES.RECEIPIENT) {
                if (element.stock[0].dimensionStock < 0){
                  resobj.negreceipie = resobj.negreceipie + element.stock[0].dimensionStock;
                } else{
                  resobj.posreceipie =
                  resobj.posreceipie + element.stock[0].dimensionStock;
                } 
              }
              if (element.type == PREFIXES.STOCKADJUSTMENT) {
                if (element.stock[0].dimensionStock < 0) {
                  resobj.isNegative =
                    resobj.isNegative + element.stock[0].dimensionStock;
                } else {
                  resobj.postadj =
                    resobj.postadj + element.stock[0].dimensionStock;
                }
              }
              if (element.type == PREFIXES.WORKORDER) {
                resobj.sales = resobj.sales + element.stock[0].dimensionStock;
              }
              if (element.type == PREFIXES.SALESINV) {
                resobj.sales = resobj.sales + element.stock[0].dimensionStock;
              }
              if (element.type == PREFIXES.STOCKTRANSFER) {
                if (element.stock[0].dimensionStock < 0) {
                  resobj.transout =
                    resobj.transout + element.stock[0].dimensionStock;
                } else {
                  resobj.transin =
                    resobj.transin + element.stock[0].dimensionStock;
                }
              }
              if (element.type == PREFIXES.SALESRETURN) {
                resobj.salesReturn =
                  resobj.salesReturn + element.stock[0].dimensionStock;
              }
              if (element.type == PREFIXES.PURCHASERETURN) {
                resobj.purchasereturn =
                  resobj.purchasereturn + element.stock[0].dimensionStock;
              }
            }
            let adStock =
              resobj.opbalance +
              resobj.purchases +
              resobj.transin +
              resobj.postadj +
              resobj.salesReturn+
              resobj.posreceipie;
            let minStock =
              resobj.purchasereturn +
              resobj.transout +
              resobj.sales +
              resobj.isNegative +
              resobj.receipie+
              resobj.negreceipie;
            resobj.closingstock = adStock + minStock;
            rsList.push(resobj);
          }
        }
      }
    }
    if (req.body.dimension) {
      rsList = rsList.filter((x) => x.filterdim == req.body.dimension);
    }
    rsList.map((x) => {
      x.date = common_service.prescisedateconvert(x.date).split(" ")[0];
    });
    return (res = { data: rsList, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//#endregion
