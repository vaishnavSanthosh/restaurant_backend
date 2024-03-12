/** @format */

//added on 30-04-2022
//#region headers
const { STATUSCODES, ORDERSTATUS, ROLES } = require("../Model/enums");
const common_service = require("../Routes/commonRoutes.js");
const conn = require("../../userDbConn");
//#endregion

//#region export methods
//added on 04-05-2022 for Home dashboard
module.exports.totalItem = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  try {
    let totalCount = [];
    if (req.decode.role == ROLES.ADMIN) {
      totalCount = await foodModel.find({});
    } else {
      totalCount = await foodModel.find({ branchId: req.body.branchId });
    }

    let data = {
      totalItems: totalCount.length,
    };
    return (res = { data, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { status: STATUSCODES.ERROR, data: e.message });
  }
};

module.exports.totalReservations = async (req) => {
  const { reservationModel } = conn.reservation(req.decode.db);
  try {
    let reservation = 0;
    let totalCount = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        totalCount = await reservationModel.find({
          branchId: req.body.branchId,
        });
      } else {
        totalCount = await reservationModel.find({});
      }
    } else {
      totalCount = await reservationModel.find({
        branchId: req.body.branchId,
      });
    }
    for (let i = 0; i < totalCount.length; i++) {
      reservation = reservation + totalCount[i].no_of_guest;
    }
    return (res = {
      data: { totalReservation: reservation },
      status: STATUSCODES.SUCCESS,
    });
  } catch (error) {
    return (res = { status: STATUSCODES.ERROR, data: error.message });
  }
};

module.exports.totalRevenue = async (req) => {
  const salesModel = conn.sales(req.decode.db);
  const { orderModel } = conn.order(req.decode.db);
  let tot = 0;
  try {
    let quot = [],
      order = [];
    if (req.decode.role == ROLES.USER) {
      quot = await salesModel.find({
        branchId: req.body.branchId,
      });
      order = await orderModel.find({
        status: ORDERSTATUS.COM,
        branchId: req.body.branchId,
      });
    } else {
      if (req.body.branchId) {
        quot = await salesModel.find({
          branchId: req.body.branchId,
        });
        order = await orderModel.find({
          status: ORDERSTATUS.COM,
          branchId: req.body.branchId,
        });
      } else {
        quot = await salesModel.find({});
        order = await orderModel.find({
          status: ORDERSTATUS.COM,
        });
      }
    }

    for (let i = 0; i < quot?.length; i++) {
      if (typeof quot[i].grandTotal == "number") {
        tot = tot + quot[i].grandTotal;
      }
    }
    for (let i = 0; i < order?.length; i++) {
      if (typeof order[i].totalAmount == "number") {
        tot = tot + order[i].totalAmount;
      }
    }
    return (res = { data: { totalRevenue: tot }, status: STATUSCODES.SUCCESS });
  } catch (error) {
    return (res = { status: STATUSCODES.ERROR, data: error.message });
  }
};

module.exports.orderList = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let orders = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        orders = await orderModel.find({ branchId: req.body.branchId });
      } else {
        orders = await orderModel.find({});
      }
    } else {
      orders = await orderModel.find({ branchId: req.body.branchId });
    }
    let rslist = [];
    if (orders.length > 0) {
      for (let i = 0; i < orders.length; i++) {
        const element = orders[i];
        let resobj = {
          branchId: "No BranchId",
          date: "Nan",
          customerName: "No Name",
          orderId: "No Id",
          itemQuantity: 0,
          totalAmount: 0,
        };
        let branchExist = await branchModel.findOne({
          storeCode: element.branchId,
        });
        if (common_service.checkObject(branchExist)) {
          resobj.branchId = branchExist.storeCode;
        }
        resobj.date = common_service
          .prescisedateconvert(element.orderDate)
          .split(" ")[0];
        if (common_service.isObjectId(element.cus_id)) {
          let customer = await customerModel.findOne({ _id: element.cus_id });
          if (common_service.checkObject(customer)) {
            resobj.customerName = customer.name;
          }
        }
        resobj.orderId = element._id;
        if (Array.isArray(element.orderInfo)) {
          element.orderInfo.map(
            (x) =>
              (resobj.itemQuantity =
                resobj.itemQuantity + parseFloat(x.quantity))
          );
        }
        resobj.totalAmount = element.payableAmount;
        rslist.push(resobj);
      }
    }
    return (res = { data: rslist, status: STATUSCODES.SUCCESS });
  } catch (error) {
    return (res = { status: STATUSCODES.ERROR, data: error.message });
  }
};

module.exports.totalCredit = async (req) => {
  const { creditModel } = conn.payment(req.decode.db);
  let res = {},
    tot = 0;
  try {
    let credit = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        credit = await creditModel.find({ branchId: req.body.branchId });
      } else {
        credit = await creditModel.find({});
      }
    } else {
      credit = await creditModel.find({ branchId: req.body.branchId });
    }

    if (credit.length > 0) {
      for (let i = 0; i < credit.length; i++) {
        tot = tot + credit[i].balance;
      }
      return (res = {
        data: { totalCredit: tot },
        status: STATUSCODES.SUCCESS,
      });
    } else {
      return (res = { data: "no credit", staatus: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { status: STATUSCODES.ERROR, data: e.message });
  }
};

module.exports.totalStaffExpense = async (req) => {
  const { expenseModel } = conn.expense(req.decode.db);
  let res = {},
    tot = 0;
  try {
    let stexp = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        stexp = await expenseModel.find({ branchId: req.body.branchId });
      } else {
        stexp = await expenseModel.find({});
      }
    } else {
      stexp = await expenseModel.find({ branchId: req.body.branchId });
    }
    if (stexp.length > 0) {
      for (let i = 0; i < stexp.length; i++) {
        tot = tot + stexp[i].amount;
      }
    }
    return (res = {
      data: { totalStaffExpense: tot },
      status: STATUSCODES.SUCCESS,
    });
  } catch (error) {
    return (res = { status: STATUSCODES.ERROR, data: error.message });
  }
};

module.exports.totalPurchaseExpense = async (req) => {
  const { purchaseModel, purchasewopoModel } = conn.purchase(req.decode.db);
  let res = {},
    tot = 0;
  try {
    let pexp = [];
    let pwoexp = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        pexp = await purchaseModel.find({ branchId: req.body.branchId });
        pwoexp = await purchasewopoModel.find({ branchId: req.body.branchId });
      } else {
        pexp = await purchaseModel.find({});
        pwoexp = await purchasewopoModel.find({});
      }
    } else {
      pexp = await purchaseModel.find({ branchId: req.body.branchId });
      pwoexp = await purchasewopoModel.find({ branchId: req.body.branchId });
    }

    if (pexp.length > 0) {
      for (let i = 0; i < pexp.length; i++) {
        if (typeof pexp[i].grandTotal == "number") {
          tot = tot + pexp[i].grandTotal;
        }
      }
    }
    if (pwoexp.length > 0) {
      for (let i = 0; i < pwoexp.length; i++) {
        if (typeof pwoexp[i].netAmount == "number") {
          tot = tot + pwoexp[i].netAmount;
        }
      }
    }
    return (res = {
      data: { totalPurchaseExpense: tot },
      status: STATUSCODES.SUCCESS,
    });
  } catch (error) {
    return (res = { status: STATUSCODES.ERROR, data: error.message });
  }
};

module.exports.customerRate = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  let res = {},
    tot = 0;
  try {
    let order = await orderModel.find({ status: ORDERSTATUS.COM });
    let returnOrder = await orderModel.find({ status: ORDERSTATUS.RET });
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        order = await orderModel.find({
          status: ORDERSTATUS.COM,
          branchId: req.body.branchId,
        });
        returnOrder = await orderModel.find({
          returnStatus: ORDERSTATUS.RET,
          branchId: req.body.branchId,
        });
      } else {
        order = await orderModel.find({ status: ORDERSTATUS.COM });
        returnOrder = await orderModel.find({ returnStatus: ORDERSTATUS.RET });
      }
    } else {
      order = await orderModel.find({
        status: ORDERSTATUS.COM,
        branchId: req.body.branchId,
      });
      returnOrder = await orderModel.find({
        returnStatus: ORDERSTATUS.RET,
        branchId: req.body.branchId,
      });
    }
    if (order.length > 0) {
      let entries = await orderModel.aggregate([
        {
          $sort: { transNo: -1 },
        },
      ]);
      var success = Math.round((order.length / entries.length) * 100);
    }
    if (returnOrder.length > 0) {
      let entries = await orderModel.aggregate([
        {
          $sort: { transNo: -1 },
        },
      ]);
      var retrn = Math.round((returnOrder.length / entries.length) * 100);
    }
    return (res = { data: { success, retrn }, status: STATUSCODES.SUCCESS });
  } catch (error) {
    return (res = { status: STATUSCODES.ERROR, data: error.message });
  }
};

// edited on 12/07/23
module.exports.totalRevenueGraph = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const salesModel = conn.sales(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  let total = [];
  try {
    if (req.body.timeFilter) {
      let orderData = await orderModel.find({});
      let quotationData = await salesModel.find({});
      if (req.body.branchId) {
        let branch = await branchModel.findOne({
          storeCode: req.body.branchId,
        });
        if (!common_service.isEmpty(branch)) {
          orderData = orderData.filter((x) => x.branchId == branch.storeCode);
          quotationData = quotationData.filter(
            (x) => x.branchId == branch.storeCode
          );
        }
      }

      switch (req.body.timeFilter.toLowerCase()) {
        case "month":
          let ord = [
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0,
            ],
            quot = [
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0,
            ];

          if (orderData) {
            let today = new Date(Date.now()),
              tod = today.getMonth();
            for (let i = 0; i < orderData.length; i++) {
              var mydate = new Date(orderData[i].orderDate),
                ordt = mydate.getMonth();
              if (ordt == tod) {
                switch (new Date(orderData[i].orderDate).getDate()) {
                  case 0:
                    ord[0] = ord[0] + orderData[i].totalAmount;
                    break;
                  case 1:
                    ord[1] = ord[1] + orderData[i].totalAmount;
                    break;
                  case 2:
                    ord[2] = ord[2] + orderData[i].totalAmount;
                    break;
                  case 3:
                    ord[3] = ord[3] + orderData[i].totalAmount;
                    break;
                  case 4:
                    ord[4] = ord[4] + orderData[i].totalAmount;
                    break;
                  case 5:
                    ord[5] = ord[5] + orderData[i].totalAmount;
                    break;
                  case 6:
                    ord[6] = ord[6] + orderData[i].totalAmount;
                    break;
                  case 7:
                    ord[7] = ord[7] + orderData[i].totalAmount;
                    break;
                  case 8:
                    ord[8] = ord[8] + orderData[i].totalAmount;
                    break;
                  case 9:
                    ord[9] = ord[9] + orderData[i].totalAmount;
                    break;
                  case 10:
                    ord[10] = ord[10] + orderData[i].totalAmount;
                    break;
                  case 11:
                    ord[11] = ord[11] + orderData[i].totalAmount;
                    break;
                  case 12:
                    ord[12] = ord[12] + orderData[i].totalAmount;
                    break;
                  case 13:
                    ord[13] = ord[13] + orderData[i].totalAmount;
                    break;
                  case 14:
                    ord[14] = ord[14] + orderData[i].totalAmount;
                    break;
                  case 15:
                    ord[15] = ord[15] + orderData[i].totalAmount;
                    break;
                  case 16:
                    ord[16] = ord[16] + orderData[i].totalAmount;
                    break;
                  case 17:
                    ord[17] = ord[17] + orderData[i].totalAmount;
                    break;
                  case 18:
                    ord[18] = ord[18] + orderData[i].totalAmount;
                    break;
                  case 19:
                    ord[19] = ord[19] + orderData[i].totalAmount;
                    break;
                  case 20:
                    ord[20] = ord[20] + orderData[i].totalAmount;
                    break;
                  case 21:
                    ord[21] = ord[21] + orderData[i].totalAmount;
                    break;
                  case 22:
                    ord[22] = ord[22] + orderData[i].totalAmount;
                    break;
                  case 23:
                    ord[23] = ord[23] + orderData[i].totalAmount;
                    break;
                  case 24:
                    ord[24] = ord[24] + orderData[i].totalAmount;
                    break;
                  case 25:
                    ord[25] = ord[25] + orderData[i].totalAmount;
                    break;
                  case 26:
                    ord[26] = ord[26] + orderData[i].totalAmount;
                    break;
                  case 27:
                    ord[27] = ord[27] + orderData[i].totalAmount;
                    break;
                  case 28:
                    ord[28] = ord[28] + orderData[i].totalAmount;
                    break;
                  case 29:
                    ord[29] = ord[29] + orderData[i].totalAmount;
                    break;
                  case 30:
                    ord[30] = ord[30] + orderData[i].totalAmount;
                    break;
                }
              }
            }
          }

          if (quotationData) {
            let today = new Date(Date.now()),
              tod = today.getMonth();
            for (let i = 0; i < quotationData.length; i++) {
              var mydate = new Date(quotationData[i].estDate),
                ordt = mydate.getMonth();
              if (tod == ordt) {
                switch (new Date(quotationData[i].estDate).getDay()) {
                  case 0:
                    quot[0] = quot[0] + quotationData[i].grandTotal;
                    break;
                  case 1:
                    quot[1] = quot[1] + quotationData[i].grandTotal;
                    break;
                  case 2:
                    quot[2] = quot[2] + quotationData[i].grandTotal;
                    break;
                  case 3:
                    quot[3] = quot[3] + quotationData[i].grandTotal;
                    break;
                  case 4:
                    quot[4] = quot[4] + quotationData[i].grandTotal;
                    break;
                  case 5:
                    quot[5] = quot[5] + quotationData[i].grandTotal;
                    break;
                  case 6:
                    quot[6] = quot[6] + quotationData[i].grandTotal;
                    break;
                  case 7:
                    quot[7] = quot[7] + quotationData[i].grandTotal;
                    break;
                  case 8:
                    quot[8] = quot[8] + quotationData[i].grandTotal;
                    break;
                  case 9:
                    quot[9] = quot[9] + quotationData[i].grandTotal;
                    break;
                  case 10:
                    quot[10] = quot[10] + quotationData[i].grandTotal;
                    break;
                  case 11:
                    quot[11] = quot[11] + quotationData[i].grandTotal;
                    break;
                  case 12:
                    quot[12] = quot[12] + quotationData[i].grandTotal;
                    break;
                  case 13:
                    quot[13] = quot[13] + quotationData[i].grandTotal;
                    break;
                  case 14:
                    quot[14] = quot[14] + quotationData[i].grandTotal;
                    break;
                  case 15:
                    quot[15] = quot[15] + quotationData[i].grandTotal;
                    break;
                  case 16:
                    quot[16] = quot[16] + quotationData[i].grandTotal;
                    break;
                  case 17:
                    quot[17] = quot[17] + quotationData[i].grandTotal;
                    break;
                  case 18:
                    quot[18] = quot[18] + quotationData[i].grandTotal;
                    break;
                  case 19:
                    quot[19] = quot[19] + quotationData[i].grandTotal;
                    break;
                  case 20:
                    quot[20] = quot[20] + quotationData[i].grandTotal;
                    break;
                  case 21:
                    quot[21] = quot[21] + quotationData[i].grandTotal;
                    break;
                  case 22:
                    quot[22] = quot[22] + quotationData[i].grandTotal;
                    break;
                  case 23:
                    quot[23] = quot[23] + quotationData[i].grandTotal;
                    break;
                  case 24:
                    quot[24] = quot[24] + quotationData[i].grandTotal;
                    break;
                  case 25:
                    quot[25] = quot[25] + quotationData[i].grandTotal;
                    break;
                  case 26:
                    quot[26] = quot[26] + quotationData[i].grandTotal;
                    break;
                  case 27:
                    quot[27] = quot[27] + quotationData[i].grandTotal;
                    break;
                  case 28:
                    quot[28] = quot[28] + quotationData[i].grandTotal;
                    break;
                  case 29:
                    quot[29] = quot[29] + quotationData[i].grandTotal;
                    break;
                  case 30:
                    quot[30] = quot[30] + quotationData[i].grandTotal;
                    break;
                }
              }
            }
          }

          for (let i = 0; i < 31; i++) total[i] = ord[i] + quot[i];

          break;
        case "week":
          let ordDay = [0, 0, 0, 0, 0, 0, 0],
            quotDay = [0, 0, 0, 0, 0, 0, 0];

          let endDate = new Date().setHours(23, 59, 59);
          let startDate = new Date(
            new Date().setDate(new Date().getDate() - 7)
          ).setHours(0, 0, 0);
          let new_list = [];
          orderData.some((item) => {
            if (
              new Date(item.orderDate).getTime() >=
                new Date(startDate).getTime() &&
              new Date(item.orderDate).getTime() <= new Date(endDate).getTime()
            ) {
              new_list.push(item);
            }
          });
          orderData = new_list;

          if (orderData) {
            for (let i = 0; i < orderData.length; i++) {
              switch (new Date(orderData[i].orderDate).getDay()) {
                case 0:
                  ordDay[0] = ordDay[0] + orderData[i].totalAmount;
                  break;
                case 1:
                  ordDay[1] = ordDay[1] + orderData[i].totalAmount;
                  break;
                case 2:
                  ordDay[2] = ordDay[2] + orderData[i].totalAmount;
                  break;
                case 3:
                  ordDay[3] = ordDay[3] + orderData[i].totalAmount;
                  break;
                case 4:
                  ordDay[4] = ordDay[4] + orderData[i].totalAmount;
                  break;
                case 5:
                  ordDay[5] = ordDay[5] + orderData[i].totalAmount;
                  break;
                case 6:
                  ordDay[6] = ordDay[6] + orderData[i].totalAmount;
                  break;
              }
            }
          }
          let qut_list = [];
          quotationData.some((item) => {
            if (
              new Date(item.estDate).getTime() >=
                new Date(startDate).getTime() &&
              new Date(item.estDate).getTime() <= new Date(endDate).getTime()
            ) {
              qut_list.push(item);
            }
          });
          quotationData = qut_list;

          if (quotationData) {
            for (let i = 0; i < quotationData.length; i++) {
              switch (new Date(quotationData[i].estDate).getDay()) {
                case 0:
                  quotDay[0] = quotDay[0] + quotationData[i].grandTotal;
                  break;
                case 1:
                  quotDay[1] = quotDay[1] + quotationData[i].grandTotal;
                  break;
                case 2:
                  quotDay[2] = quotDay[2] + quotationData[i].grandTotal;
                  break;
                case 3:
                  quotDay[3] = quotDay[3] + quotationData[i].grandTotal;
                  break;
                case 4:
                  quotDay[4] = quotDay[4] + quotationData[i].grandTotal;
                  break;
                case 5:
                  quotDay[5] = quotDay[5] + quotationData[i].grandTotal;
                  break;
                case 6:
                  quotDay[6] = quotDay[6] + quotationData[i].grandTotal;
                  break;
              }
            }
          }
          for (let i = 0; i < 7; i++) total[i] = ordDay[i] + quotDay[i];
          break;
        case "today":
          let ordHour = [
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0,
            ],
            quotHour = [
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0,
            ];

          if (orderData) {
            let today = new Date(Date.now()),
              tod =
                today.getMonth() +
                1 +
                "/" +
                today.getDate() +
                "/" +
                today.getFullYear();

            for (let i = 0; i < orderData.length; i++) {
              var mydate = new Date(orderData[i].orderDate),
                ordt =
                  mydate.getMonth() +
                  1 +
                  "/" +
                  mydate.getDate() +
                  "/" +
                  mydate.getFullYear();

              if (tod == ordt) {
                switch (new Date(orderData[i].orderDate).getHours()) {
                  case 0:
                    ordHour[0] = ordHour[0] + orderData[i].totalAmount;
                    break;
                  case 1:
                    ordHour[1] = ordHour[1] + orderData[i].totalAmount;
                    break;
                  case 2:
                    ordHour[2] = ordHour[2] + orderData[i].totalAmount;
                    break;
                  case 3:
                    ordHour[3] = ordHour[3] + orderData[i].totalAmount;
                    break;
                  case 4:
                    ordHour[4] = ordHour[4] + orderData[i].totalAmount;
                    break;
                  case 5:
                    ordHour[5] = ordHour[5] + orderData[i].totalAmount;
                    break;
                  case 6:
                    ordHour[6] = ordHour[6] + orderData[i].totalAmount;
                    break;
                  case 7:
                    ordHour[7] = ordHour[7] + orderData[i].totalAmount;
                    break;
                  case 8:
                    ordHour[8] = ordHour[8] + orderData[i].totalAmount;
                    break;
                  case 9:
                    ordHour[9] = ordHour[9] + orderData[i].totalAmount;
                    break;
                  case 10:
                    ordHour[10] = ordHour[10] + orderData[i].totalAmount;
                    break;
                  case 11:
                    ordHour[11] = ordHour[11] + orderData[i].totalAmount;
                    break;
                  case 12:
                    ordHour[12] = ordHour[12] + orderData[i].totalAmount;
                    break;
                  case 13:
                    ordHour[13] = ordHour[13] + orderData[i].totalAmount;
                    break;
                  case 14:
                    ordHour[14] = ordHour[14] + orderData[i].totalAmount;
                    break;
                  case 15:
                    ordHour[15] = ordHour[15] + orderData[i].totalAmount;
                    break;
                  case 16:
                    ordHour[16] = ordHour[16] + orderData[i].totalAmount;
                    break;
                  case 17:
                    ordHour[17] = ordHour[17] + orderData[i].totalAmount;
                    break;
                  case 18:
                    ordHour[18] = ordHour[18] + orderData[i].totalAmount;
                    break;
                  case 19:
                    ordHour[19] = ordHour[19] + orderData[i].totalAmount;
                    break;
                  case 20:
                    ordHour[20] = ordHour[20] + orderData[i].totalAmount;
                    break;
                  case 21:
                    ordHour[21] = ordHour[21] + orderData[i].totalAmount;
                    break;
                  case 22:
                    ordHour[22] = ordHour[22] + orderData[i].totalAmount;
                    break;
                  case 23:
                    ordHour[23] = ordHour[23] + orderData[i].totalAmount;
                    break;
                }
              }
            }
          }

          if (quotationData) {
            let today = new Date(Date.now()),
              tod =
                today.getMonth() +
                1 +
                "/" +
                today.getDate() +
                "/" +
                today.getFullYear();
            for (let i = 0; i < quotationData.length; i++) {
              var mydate = new Date(quotationData[i].estDate),
                ordt =
                  mydate.getMonth() +
                  1 +
                  "/" +
                  mydate.getDate() +
                  "/" +
                  mydate.getFullYear();
              if (tod == ordt) {
                switch (new Date(quotationData[i].estDate).getHours()) {
                  case 0:
                    quotHour[0] = quotHour[0] + quotationData[i].grandTotal;
                    break;
                  case 1:
                    quotHour[1] = quotHour[1] + quotationData[i].grandTotal;
                    break;
                  case 2:
                    quotHour[2] = quotHour[2] + quotationData[i].grandTotal;
                    break;
                  case 3:
                    quotHour[3] = quotHour[3] + quotationData[i].grandTotal;
                    break;
                  case 4:
                    quotHour[4] = quotHour[4] + quotationData[i].grandTotal;
                    break;
                  case 5:
                    quotHour[5] = quotHour[5] + quotationData[i].grandTotal;
                    break;
                  case 6:
                    quotHour[6] = quotHour[6] + quotationData[i].grandTotal;
                    break;
                  case 7:
                    quotHour[7] = quotHour[7] + quotationData[i].grandTotal;
                    break;
                  case 8:
                    quotHour[8] = quotHour[8] + quotationData[i].grandTotal;
                    break;
                  case 9:
                    quotHour[9] = quotHour[9] + quotationData[i].grandTotal;
                    break;
                  case 10:
                    quotHour[10] = ordHour[10] + quotationData[i].grandTotal;
                    break;
                  case 11:
                    quotHour[11] = quotHour[11] + quotationData[i].grandTotal;
                    break;
                  case 12:
                    quotHour[12] = quotHour[12] + quotationData[i].grandTotal;
                    break;
                  case 13:
                    quotHour[13] = quotHour[13] + quotationData[i].grandTotal;
                    break;
                  case 14:
                    quotHour[14] = quotHour[14] + quotationData[i].grandTotal;
                    break;
                  case 15:
                    quotHour[15] = quotHour[15] + quotationData[i].grandTotal;
                    break;
                  case 16:
                    quotHour[16] = quotHour[16] + quotationData[i].grandTotal;
                    break;
                  case 17:
                    quotHour[17] = quotHour[17] + quotationData[i].grandTotal;
                    break;
                  case 18:
                    quotHour[18] = quotHour[18] + quotationData[i].grandTotal;
                    break;
                  case 19:
                    quotHour[19] = quotHour[19] + quotationData[i].grandTotal;
                    break;
                  case 20:
                    quotHour[20] = quotHour[20] + quotationData[i].grandTotal;
                    break;
                  case 21:
                    quotHour[21] = quotHour[21] + quotationData[i].grandTotal;
                    break;
                  case 22:
                    quotHour[22] = quotHour[22] + quotationData[i].grandTotal;
                    break;
                  case 23:
                    quotHour[23] = quotHour[23] + quotationData[i].grandTotal;
                    break;
                }
              }
            }
          }

          for (let i = 0; i < 24; i++) total[i] = ordHour[i] + quotHour[i];
          break;
      }
      return (res = { data: total, status: STATUSCODES.SUCCESS });
    } else {
      return (res = {
        data: "not acceptable",
        status: STATUSCODES.NOTACCEPTABLE,
      });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 09-05-2022 for employee dashboard
module.exports.getEmployeeCount = async () => {
  const { employeeModel } = conn.employee(process.env.db);
  try {
    let data = await employeeModel.countDocuments();
    return (res = {
      data: { totalEmployees: data },
      status: STATUSCODES.SUCCESS,
    });
  } catch (error) {
    return (res = { status: STATUSCODES.ERROR, data: error.message });
  }
};

module.exports.getTotalDepartments = async () => {
  const departmentModel = conn.department(process.env.db);
  try {
    let data = await departmentModel.countDocuments();
    return (res = {
      data: { totalDepartments: data },
      status: STATUSCODES.SUCCESS,
    });
  } catch (error) {
    return (res = { status: STATUSCODES.ERROR, data: error.message });
  }
};

module.exports.getTotalExpense = async (req) => {
  const { expenseModel, outletExpenseModel, pettycashModel } = conn.expense(
    process.env.db
  );
  try {
    let totalExpense = 0;

    let staffExp = await expenseModel.aggregate([
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);
    let outletExp = await outletExpenseModel.aggregate([
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);
    let pettyExp = await pettycashModel.aggregate([
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);
    totalExpense = staffExp[0]?.sum + outletExp[0]?.sum + pettyExp[0]?.sum;
    return (res = {
      data: { totalExpense: totalExpense },
      status: STATUSCODES.SUCCESS,
    });
  } catch (error) {
    return (res = { status: STATUSCODES.ERROR, data: error.message });
  }
};

module.exports.totalExpenseGraph = async (req) => {
  const { expenseModel, outletExpenseModel, pettycashModel } = conn.expense(
    process.env.db
  );
  let res = {};
  let total = [];
  try {
    if (req.body.timeFilter) {
      let expenseData = await expenseModel.find({});
      let outletExpenseData = await outletExpenseModel.find({});
      let pettyCashData = await pettycashModel.find({});
      switch (req.body.timeFilter.toLowerCase()) {
        case "month":
          let exp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            outletExp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            pettyExp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          if (expenseData) {
            let today = new Date(Date.now()),
              tod = today.getFullYear();
            for (let i = 0; i < expenseData.length; i++) {
              var mydate = new Date(expenseData[i].expenseDate),
                exdt = mydate.getFullYear();
              if (exdt == tod) {
                switch (new Date(expenseData[i].expenseDate).getMonth()) {
                  case 0:
                    exp[0] = exp[0] + expenseData[i].amount;
                    break;
                  case 1:
                    exp[1] = exp[1] + expenseData[i].amount;
                    break;
                  case 2:
                    exp[2] = exp[2] + expenseData[i].amount;
                    break;
                  case 3:
                    exp[3] = exp[3] + expenseData[i].amount;
                    break;
                  case 4:
                    exp[4] = exp[4] + expenseData[i].amount;
                    break;
                  case 5:
                    exp[5] = exp[5] + expenseData[i].amount;
                    break;
                  case 6:
                    exp[6] = exp[6] + expenseData[i].amount;
                    break;
                  case 7:
                    exp[7] = exp[7] + expenseData[i].amount;
                    break;
                  case 8:
                    exp[8] = exp[8] + expenseData[i].amount;
                    break;
                  case 9:
                    exp[9] = exp[9] + expenseData[i].amount;
                    break;
                  case 10:
                    exp[10] = exp[10] + expenseData[i].amount;
                    break;
                  case 11:
                    exp[11] = exp[11] + expenseData[i].amount;
                    break;
                }
              }
            }
          }
          if (outletExpenseData) {
            let today = new Date(Date.now()),
              tod = today.getFullYear();
            for (let i = 0; i < outletExpenseData.length; i++) {
              var mydate = new Date(outletExpenseData[i].date),
                outdt = mydate.getFullYear();
              if (tod == outdt) {
                switch (new Date(outletExpenseData[i].date).getMonth()) {
                  case 0:
                    outletExp[0] = outletExp[0] + outletExpenseData[i].amount;
                    break;
                  case 1:
                    outletExp[1] = outletExp[1] + outletExpenseData[i].amount;
                    break;
                  case 2:
                    outletExp[2] = outletExp[2] + outletExpenseData[i].amount;
                    break;
                  case 3:
                    outletExp[3] = outletExp[3] + outletExpenseData[i].amount;
                    break;
                  case 4:
                    outletExp[4] = outletExp[4] + outletExpenseData[i].amount;
                    break;
                  case 5:
                    outletExp[5] = outletExp[5] + outletExpenseData[i].amount;
                    break;
                  case 6:
                    outletExp[6] = outletExp[6] + outletExpenseData[i].amount;
                    break;
                  case 7:
                    outletExp[7] = outletExp[7] + outletExpenseData[i].amount;
                    break;
                  case 8:
                    outletExp[8] = outletExp[8] + outletExpenseData[i].amount;
                    break;
                  case 9:
                    outletExp[9] = outletExp[9] + outletExpenseData[i].amount;
                    break;
                  case 10:
                    outletExp[10] = outletExp[10] + outletExpenseData[i].amount;
                    break;
                  case 11:
                    outletExp[11] = outletExp[11] + outletExpenseData[i].amount;
                    break;
                }
              }
            }
          }
          if (pettyCashData) {
            let today = new Date(Date.now()),
              tod = today.getFullYear();
            for (let i = 0; i < pettyCashData.length; i++) {
              var mydate = new Date(pettyCashData[i].date),
                petdt = mydate.getFullYear();
              if (tod == petdt) {
                switch (new Date(pettyCashData[i].date).getMonth()) {
                  case 0:
                    pettyExp[0] = pettyExp[0] + pettyCashData[i].amount;
                    break;
                  case 1:
                    pettyExp[1] = pettyExp[1] + pettyCashData[i].amount;
                    break;
                  case 2:
                    pettyExp[2] = pettyExp[2] + pettyCashData[i].amount;
                    break;
                  case 3:
                    pettyExp[3] = pettyExp[3] + pettyCashData[i].amount;
                    break;
                  case 4:
                    pettyExp[4] = pettyExp[4] + pettyCashData[i].amount;
                    break;
                  case 5:
                    pettyExp[5] = pettyExp[5] + pettyCashData[i].amount;
                    break;
                  case 6:
                    pettyExp[6] = pettyExp[6] + pettyCashData[i].amount;
                    break;
                  case 7:
                    pettyExp[7] = pettyExp[7] + pettyCashData[i].amount;
                    break;
                  case 8:
                    pettyExp[8] = pettyExp[8] + pettyCashData[i].amount;
                    break;
                  case 9:
                    pettyExp[9] = pettyExp[9] + pettyCashData[i].amount;
                    break;
                  case 10:
                    pettyExp[10] = pettyExp[10] + pettyCashData[i].amount;
                    break;
                  case 11:
                    pettyExp[11] = pettyExp[11] + pettyCashData[i].amount;
                    break;
                }
              }
            }
          }
          for (let i = 0; i < 12; i++)
            total[i] = exp[i] + outletExp[i] + pettyExp[i];

          break;
        //week filter
        case "week":
          let expDay = [0, 0, 0, 0, 0, 0, 0],
            outletDay = [0, 0, 0, 0, 0, 0, 0],
            pettyDay = [0, 0, 0, 0, 0, 0, 0];
          if (expenseData) {
            for (let i = 0; i < expenseData.length; i++) {
              var mydate = new Date(expenseData[i].expenseDate),
                exdt = mydate.getFullYear();

              switch (new Date(expenseData[i].expenseDate).getDay()) {
                case 0:
                  expDay[0] = expDay[0] + expenseData[i].amount;
                  break;
                case 1:
                  expDay[1] = expDay[1] + expenseData[i].amount;
                  break;
                case 2:
                  expDay[2] = expDay[2] + expenseData[i].amount;
                  break;
                case 3:
                  expDay[3] = expDay[3] + expenseData[i].amount;
                  break;
                case 4:
                  expDay[4] = expDay[4] + expenseData[i].amount;
                  break;
                case 5:
                  expDay[5] = expDay[5] + expenseData[i].amount;
                  break;
                case 6:
                  exp[6] = exp[6] + expenseData[i].amount;
                  break;
              }
            }
          }
          if (outletExpenseData) {
            for (let i = 0; i < outletExpenseData.length; i++) {
              switch (new Date(outletExpenseData[i].date).getDay()) {
                case 0:
                  outletDay[0] = outletDay[0] + outletExpenseData[i].amount;
                  break;
                case 1:
                  outletDay[1] = outletDay[1] + outletExpenseData[i].amount;
                  break;
                case 2:
                  outletDay[2] = outletDay[2] + outletExpenseData[i].amount;
                  break;
                case 3:
                  outletDay[3] = outletDay[3] + outletExpenseData[i].amount;
                  break;
                case 4:
                  outletDay[4] = outletDay[4] + outletExpenseData[i].amount;
                  break;
                case 5:
                  outletDay[5] = outletDay[5] + outletExpenseData[i].amount;
                  break;
                case 6:
                  outletDay[6] = outletDay[6] + outletExpenseData[i].amount;
                  break;
              }
            }
          }

          if (pettyCashData) {
            for (let i = 0; i < pettyCashData.length; i++) {
              switch (new Date(pettyCashData[i].date).getDay()) {
                case 0:
                  pettyDay[0] = pettyDay[0] + pettyCashData[i].amount;
                  break;
                case 1:
                  pettyDay[1] = pettyDay[1] + pettyCashData[i].amount;
                  break;
                case 2:
                  pettyDay[2] = pettyDay[2] + pettyCashData[i].amount;
                  break;
                case 3:
                  pettyDay[3] = pettyDay[3] + pettyCashData[i].amount;
                  break;
                case 4:
                  pettyDay[4] = pettyDay[4] + pettyCashData[i].amount;
                  break;
                case 5:
                  pettyDay[5] = pettyDay[5] + pettyCashData[i].amount;
                  break;
                case 6:
                  pettyDay[6] = pettyDay[6] + pettyCashData[i].amount;
                  break;
              }
            }
          }
          for (let i = 0; i < 7; i++)
            total[i] = expDay[i] + outletDay[i] + pettyDay[i];
          break;
        case "day":
          let expHour = [
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0,
            ],
            outletHour = [
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0,
            ],
            pettyHour = [
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0,
            ];

          if (expenseData) {
            let today = new Date(Date.now()),
              tod =
                today.getMonth() +
                1 +
                "/" +
                today.getDate() +
                "/" +
                today.getFullYear();
            for (let i = 0; i < expenseData.length; i++) {
              var mydate = new Date(expenseData[i].expenseDate),
                expdt =
                  mydate.getMonth() +
                  1 +
                  "/" +
                  mydate.getDate() +
                  "/" +
                  mydate.getFullYear();

              if (tod == expdt) {
                switch (new Date(expenseData[i].expenseDate).getHours()) {
                  case 0:
                    expHour[0] = expHour[0] + expenseData[i].amount;
                    break;
                  case 1:
                    expHour[1] = expHour[1] + expenseData[i].amount;
                    break;
                  case 2:
                    expHour[2] = expHour[2] + expenseData[i].amount;
                    break;
                  case 3:
                    expHour[3] = expHour[3] + expenseData[i].amount;
                    break;
                  case 4:
                    expHour[4] = expHour[4] + expenseData[i].amount;
                    break;
                  case 5:
                    expHour[5] = expHour[5] + expenseData[i].amount;
                    break;
                  case 6:
                    expHour[6] = expHour[6] + expenseData[i].amount;
                    break;
                  case 7:
                    expHour[7] = expHour[7] + expenseData[i].amount;
                    break;
                  case 8:
                    expHour[8] = expHour[8] + expenseData[i].amount;
                    break;
                  case 9:
                    expHour[9] = expHour[9] + expenseData[i].amount;
                    break;
                  case 10:
                    expHour[10] = expHour[10] + expenseData[i].amount;
                    break;
                  case 11:
                    expHour[11] = expHour[11] + expenseData[i].amount;
                    break;
                  case 12:
                    expHour[12] = expHour[12] + expenseData[i].amount;
                    break;
                  case 13:
                    expHour[13] = expHour[13] + expenseData[i].amount;
                    break;
                  case 14:
                    expHour[14] = expHour[14] + expenseData[i].amount;
                    break;
                  case 15:
                    expHour[15] = expHour[15] + expenseData[i].amount;
                    break;
                  case 16:
                    expHour[16] = expHour[16] + expenseData[i].amount;
                    break;
                  case 17:
                    expHour[17] = expHour[17] + expenseData[i].amount;
                    break;
                  case 18:
                    expHour[18] = expHour[18] + expenseData[i].amount;
                    break;
                  case 19:
                    expHour[19] = expHour[19] + expenseData[i].amount;
                    break;
                  case 20:
                    expHour[20] = expHour[20] + expenseData[i].amount;
                    break;
                  case 21:
                    expHour[21] = expHour[21] + expenseData[i].amount;
                    break;
                  case 22:
                    expHour[22] = expHour[22] + expenseData[i].amount;
                    break;
                  case 23:
                    expHour[23] = expHour[23] + expenseData[i].amount;
                    break;
                }
              }
            }
          }
          if (outletExpenseData) {
            let today = new Date(Date.now()),
              tod =
                today.getMonth() +
                1 +
                "/" +
                today.getDate() +
                "/" +
                today.getFullYear();
            for (let i = 0; i < outletExpenseData.length; i++) {
              var mydate = new Date(outletExpenseData[i].date),
                outdt =
                  mydate.getMonth() +
                  1 +
                  "/" +
                  mydate.getDate() +
                  "/" +
                  mydate.getFullYear();
              if (tod == outdt) {
                switch (new Date(outletExpenseData[i].date).getHours()) {
                  case 0:
                    outletHour[0] = outletHour[0] + outletExpenseData[i].amount;
                    break;
                  case 1:
                    outletHour[1] = outletHour[1] + outletExpenseData[i].amount;
                    break;
                  case 2:
                    outletHour[2] = outletHour[2] + outletExpenseData[i].amount;
                    break;
                  case 3:
                    outletHour[3] = outletHour[3] + outletExpenseData[i].amount;
                    break;
                  case 4:
                    outletHour[4] = outletHour[4] + outletExpenseData[i].amount;
                    break;
                  case 5:
                    outletHour[5] = outletHour[5] + outletExpenseData[i].amount;
                    break;
                  case 6:
                    outletHour[6] = outletHour[6] + outletExpenseData[i].amount;
                    break;
                  case 7:
                    outletHour[7] = outletHour[7] + outletExpenseData[i].amount;
                    break;
                  case 8:
                    outletHour[8] = outletHour[8] + outletExpenseData[i].amount;
                    break;
                  case 9:
                    outletHour[9] = outletHour[9] + outletExpenseData[i].amount;
                    break;
                  case 10:
                    outletHour[10] =
                      outletHour[10] + outletExpenseData[i].amount;
                    break;
                  case 11:
                    outletHour[11] =
                      outletHour[11] + outletExpenseData[i].amount;
                    break;
                  case 12:
                    outletHour[12] =
                      outletHour[12] + outletExpenseData[i].amount;
                    break;
                  case 13:
                    outletHour[13] =
                      outletHour[13] + outletExpenseData[i].amount;
                    break;
                  case 14:
                    outletHour[14] =
                      outletHour[14] + outletExpenseData[i].amount;
                    break;
                  case 15:
                    outletHour[15] =
                      outletHour[15] + outletExpenseData[i].amount;
                    break;
                  case 16:
                    outletHour[16] =
                      outletHour[16] + outletExpenseData[i].amount;
                    break;
                  case 17:
                    outletHour[17] =
                      outletHour[17] + outletExpenseData[i].amount;
                    break;
                  case 18:
                    outletHour[18] =
                      outletHour[18] + outletExpenseData[i].amount;
                    break;
                  case 19:
                    outletHour[19] =
                      outletHour[19] + outletExpenseData[i].amount;
                    break;
                  case 20:
                    outletHour[20] =
                      outletHour[20] + outletExpenseData[i].amount;
                    break;
                  case 21:
                    outletHour[21] =
                      outletHour[21] + outletExpenseData[i].amount;
                    break;
                  case 22:
                    outletHour[22] =
                      outletHour[22] + outletExpenseData[i].amount;
                    break;
                  case 23:
                    outletHour[23] =
                      outletHour[23] + outletExpenseData[i].amount;
                    break;
                }
              }
            }
          }
          if (pettyCashData) {
            let today = new Date(Date.now()),
              tod =
                today.getMonth() +
                1 +
                "/" +
                today.getDate() +
                "/" +
                today.getFullYear();
            for (let i = 0; i < pettyCashData.length; i++) {
              var mydate = new Date(pettyCashData[i].date),
                outdt =
                  mydate.getMonth() +
                  1 +
                  "/" +
                  mydate.getDate() +
                  "/" +
                  mydate.getFullYear();
              if (tod == outdt) {
                switch (new Date(pettyCashData[i].date).getHours()) {
                  case 0:
                    pettyHour[0] = pettyHour[0] + pettyCashData[i].amount;
                    break;
                  case 1:
                    pettyHour[1] = pettyHour[1] + pettyCashData[i].amount;
                    break;
                  case 2:
                    pettyHour[2] = pettyHour[2] + pettyCashData[i].amount;
                    break;
                  case 3:
                    pettyHour[3] = pettyHour[3] + pettyCashData[i].amount;
                    break;
                  case 4:
                    pettyHour[4] = pettyHour[4] + pettyCashData[i].amount;
                    break;
                  case 5:
                    pettyHour[5] = pettyHour[5] + pettyCashData[i].amount;
                    break;
                  case 6:
                    pettyHour[6] = pettyHour[6] + pettyCashData[i].amount;
                    break;
                  case 7:
                    pettyHour[7] = pettyHour[7] + pettyCashData[i].amount;
                    break;
                  case 8:
                    pettyHour[8] = pettyHour[8] + pettyCashData[i].amount;
                    break;
                  case 9:
                    pettyHour[9] = pettyHour[9] + pettyCashData[i].amount;
                    break;
                  case 10:
                    pettyHour[10] = pettyHour[10] + pettyCashData[i].amount;
                    break;
                  case 11:
                    pettyHour[11] = pettyHour[11] + pettyCashData[i].amount;
                    break;
                  case 12:
                    pettyHour[12] = pettyHour[12] + pettyCashData[i].amount;
                    break;
                  case 13:
                    pettyHour[13] = pettyHour[13] + pettyCashData[i].amount;
                    break;
                  case 14:
                    pettyHour[14] = pettyHour[14] + pettyCashData[i].amount;
                    break;
                  case 15:
                    pettyHour[15] = pettyHour[15] + pettyCashData[i].amount;
                    break;
                  case 16:
                    pettyHour[16] = pettyHour[16] + pettyCashData[i].amount;
                    break;
                  case 17:
                    pettyHour[17] = pettyHour[17] + pettyCashData[i].amount;
                    break;
                  case 18:
                    pettyHour[18] = pettyHour[18] + pettyCashData[i].amount;
                    break;
                  case 19:
                    pettyHour[19] = pettyHour[19] + pettyCashData[i].amount;
                    break;
                  case 20:
                    pettyHour[20] = pettyHour[20] + pettyCashData[i].amount;
                    break;
                  case 21:
                    pettyHour[21] = pettyHour[21] + pettyCashData[i].amount;
                    break;
                  case 22:
                    pettyHour[22] = pettyHour[22] + pettyCashData[i].amount;
                    break;
                  case 23:
                    pettyHour[23] = pettyHour[23] + pettyCashData[i].amount;
                    break;
                }
              }
            }
          }
          for (let i = 0; i < 23; i++)
            total[i] = expHour[i] + outletHour[i] + pettyHour[i];
          break;
      }
      return (res = { data: total, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: "not acceptable", status: 406 });
    }
  } catch (error) {
    return (res = { status: STATUSCODES.ERROR, data: error.message });
  }
};

module.exports.getNotifications = async (req) => {
  const { leaveModel } = conn.leave(process.env.db);
  const departmentModel = conn.department(process.env.db);
  const designationModel = conn.designation(process.env.db);
  let res = {},
    arrLeave = [],
    data = {};
  try {
    if (req.body.timeFilter) {
      switch (req.body.timeFilter.toLowerCase()) {
        case "today":
          let date = new Date(new Date(Date.now()).getTime());
          let tod = `${new Date(
            `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
          )}`;
          let today = new Date(tod).getTime();
          let leaveData = await leaveModel.find({
            /* branchId:process.env.branchId */
          });
          if (leaveData) {
            for (let i = 0; i < leaveData.length; i++) {
              if (
                leaveData[i].date_from <= today &&
                today <= leaveData[i].date_to
              ) {
                let dept = await departmentModel.find(
                  { _id: leaveData[i].department },
                  { _id: 0, departmentName: 1 }
                );
                let desg = await designationModel.find(
                  { _id: leaveData[i].designation },
                  { _id: 0, position: 1 }
                );
                let leave = {
                  emp_name: leaveData[i].emp_name,
                  department: dept[0]?.departmentName,
                  designation: desg[0]?.position,
                  fromDate: common_service
                    .prescisedateconvert(leaveData[i].date_from)
                    .split(" ")[0],
                  toDate: common_service
                    .prescisedateconvert(leaveData[i].date_to)
                    .split(" ")[0],
                };
                arrLeave.push(leave);
              }
            }
            data.leavenotifications = arrLeave;
          } else {
            return (res = { data: {}, status: STATUSCODES.NOTFOUND });
          }

          break;
        case "month":
          let dat = new Date(new Date(Date.now()).getTime());
          let month = dat.getMonth() + 1;
          let leaveDat = await leaveModel.find({
            /* branchId:process.env.branchId */
          });
          if (leaveDat) {
            for (let i = 0; i < leaveDat.length; i++) {
              if (new Date(leaveDat[i].date_from).getMonth() + 1 == month) {
                let dept = await departmentModel.find(
                  { _id: leaveDat[i].department },
                  { _id: 0, departmentName: 1 }
                );
                let desg = await designationModel.find(
                  { _id: leaveDat[i].designation },
                  { _id: 0, position: 1 }
                );
                let leav = {
                  emp_name: leaveDat[i].emp_name,
                  department: dept[0]?.departmentName,
                  designation: desg[0]?.position,
                  fromDate: common_service
                    .prescisedateconvert(leaveDat[i].date_from)
                    .split(" ")[0],
                  toDate: common_service
                    .prescisedateconvert(leaveDat[i].date_to)
                    .split(" ")[0],
                };
                arrLeave.push(leav);
              }
            }
            data.leaveNotifications = arrLeave;
          } else {
            return (res = { data: {}, status: STATUSCODES.NOTFOUND });
          }
      }
      return (res = { data: data, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: "not acceptable", status: 406 });
    }
  } catch (error) {
    return (res = { status: STATUSCODES.ERROR, data: error.message });
  }
};

module.exports.noticeBoard = async (req) => {
  const { employeeModel } = conn.employee(process.env.db);
  const { holidayModel } = conn.leave(process.env.db);
  let res = {},
    arrHoliday = [],
    arrBirthday = [],
    data = {};
  try {
    let dat = new Date(new Date(Date.now()).getTime());
    let month = dat.getMonth() + 1;
    let holiday = await holidayModel.find({});
    let birthday = await employeeModel.find({
      /* branchId:process.env.branchId */
    });
    //holiday filter
    if (holiday) {
      for (let i = 0; i < holiday.length; i++) {
        let frm = new Date(holiday[i].fromDate).getMonth() + 1;
        let to = new Date(holiday[i].toDate).getMonth() + 1;
        if (frm == month || to == month) {
          let holi = {
            name: holiday[i].name,
            from: common_service
              .prescisedateconvert(holiday[i].fromDate)
              .split(" ")[0],
            to: common_service
              .prescisedateconvert(holiday[i].toDate)
              .split(" ")[0],
          };
          arrHoliday.push(holi);
        }
      }
      data.holidays = arrHoliday;
    } else {
      data.holidays = [];
    }
    //birthday filter
    if (birthday) {
      for (let i = 0; i < birthday.length; i++) {
        let bi = new Date(birthday[i].dob).getMonth() + 1;
        if (bi == month) {
          let dept = await departmentModel.find(
            { _id: birthday[i].department },
            { _id: 0, departmentName: 1 }
          );
          let bday = {
            emp_id: "EMP" + birthday[i].emp_id,
            staff_name: birthday[i].staff_name,
            birthDate: common_service
              .prescisedateconvert(birthday[i].dob)
              .split(" ")[0],
            department: dept[0]?.departmentName,
          };
          arrBirthday.push(bday);
        }
      }
      data.birthdays = arrBirthday;
    } else {
      data.birthdays = [];
    }

    return (res = { data, status: STATUSCODES.SUCCESS });
  } catch (error) {
    return (res = { status: STATUSCODES.ERROR, data: error.message });
  }
};

//added on 06-07-22
//added and assembled on 14-07-22
module.exports.addQuickAccess = async (req) => {
  const { quickAccessModel } = conn.category(process.env.db);
  try {
    let res = {};
    let accessExist = await quickAccessModel.findOne({});
    if (!common_service.isEmpty(accessExist)) {
      accessExist.access = req.body.access;
      let data = await accessExist.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      let newquickAccess = new quickAccessModel({
        access: req.body.access,
      });
      let data = await newquickAccess.save();
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

//added on 07-07-22
//added and assembled on 14-07-22
module.exports.getQuickAccess = async (req) => {
  const { quickAccessModel } = conn.category(process.env.db);
  try {
    let res = {};
    let accessExist = await quickAccessModel.findOne({});
    if (!common_service.isEmpty(accessExist)) {
      res = { data: accessExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// Added on 12-07-23
module.exports.viewProductList = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  const { categoryModel } = conn.category(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let productList = [];
    let rsList = [];
    let DateFilter = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchCode) {
        let branch = await branchModel.findOne({
          storeCode: req.body.branchCode,
        });
        productList = await foodModel.find({
          branchId: branch.storeCode,
          status: true,
        });
      } else {
        productList = await foodModel.find({ status: true });
      }
    } else {
      productList = await foodModel.find({
        branchId: req.body.branchId,
        status: true,
      });
    }
    if (Array.isArray(productList) && productList.length > 0) {
      for (let i = 0; i < productList.length; i++) {
        const element = productList[i];
        var resobj = {};
        let categoryList = await categoryModel.findOne({
          _id: element.category,
        });
        let stockList = await stockModel.findOne({
          itemId: element._id,
        });
        resobj.productId = "FOOD" + element.prod_id;
        resobj.productName = element.prod_name;
        resobj.category = categoryList.categoryName;
        resobj.unit = element.unit;
        resobj.branchId = element.branchId;
        if (!common_service.isEmpty(stockList)) {
          for (let k = 0; k < stockList.stock.length; k++) {
            const stocklogelement = stockList.stock[k];
            resobj.stock =
              stocklogelement.dimensionStock > 0
                ? (resobj.stock || 0) + stocklogelement.dimensionStock
                : resobj.stock || 0;
          }
        }
        resobj.imageURL = element.imageUrl;
        resobj.releaseDate = element.release_date;
        resobj.stock =
          stocklogelement.dimensionStock > 0
            ? (resobj.stock || 0) + stocklogelement.dimensionStock
            : resobj.stock || 0;
        resobj.category = categoryList.categoryName;
        resobj.productName = branch?.storeCode ? element.productName : null;
        resobj.unit = branch?.storeCode ? element.unit : null;
        resobj.imageURL = branch?.storeCode ? element.imageUrl : null;
        rsList.push(resobj);
      }
    }
    if (
      common_service.checkIfNullOrUndefined(req.body.fromDate, req.body.endDate)
    ) {
      if (
        common_service.checkIfNullOrUndefined(
          req.body.fromDate,
          req.body.endDate
        )
      ) {
        rsList.some((item) => {
          if (
            new Date(item.releaseDate).getTime() >=
              new Date(req.body.fromDate).getTime() &&
            new Date(item.releaseDate).getTime() <=
              new Date(req.body.endDate).getTime()
          ) {
            DateFilter.push(item);
          }
        });
        rsList = DateFilter;
      } else {
        return { data: rsList, status: STATUSCODES.NOTFOUND };
      }
      return { data: rsList, status: STATUSCODES.SUCCESS };
    }
  } catch (error) {
    return { data: error.message, status: STATUSCODES.ERROR };
  }
};

module.exports.viewStaffExpiredDocument = async (req) => {
  const { employeeModel } = conn.employee(req.decode.db);
  try {
    let staffList = await employeeModel.find({
      "documents.expiryDate": {
        $lte: common_service.startandenddateofaday(new Date().getTime()).start,
      },
    });
    if (req.body.branchId) {
      staffList = staffList.filter((x) => x.branchId == req.body.branchId);
    }
    var rsList = [];
    if (Array.isArray(staffList) && staffList.length > 0) {
      for (let i = 0; i < staffList.length; i++) {
        const element = staffList[i];
        var resobj = {};
        resobj.employee = element.staff_name;
        resobj.employeeId = element.emp_id;
        resobj.documents = element.documents;
        rsList.push(resobj);
      }
      rsList.forEach((x) => {
        x.documents.sort((a, b) => {
          const dateA = a.expiryDate;
          const dateB = b.expiryDate;
          return dateA - dateB;
        });
      });
      rsList.sort((a, b) => {
        const earliestExpiryDateA = common_service.getEarliestExpiryDate(
          a.documents
        );
        const earliestExpiryDateB = common_service.getEarliestExpiryDate(
          b.documents
        );
        return earliestExpiryDateA - earliestExpiryDateB;
      });
      rsList.map((x) => {
        x.employeeId = `EMP${x.employeeId}`;
        x.documents.map((a) => {
          a.expiryDate = common_service
            .prescisedateconvert(a.expiryDate)
            .split(" ")[0];
        });
      });
      res = { data: rsList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [{ msg: "not found" }], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 27-02-23
module.exports.fastSelling = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let productList = [];
    if (req.body.type != null && req.body.index != null) {
      let str = {};
      if (req.body.type == 0) {
        let fromDate, toDate;
        if (req.body.fromDate != null)
          fromDate = new Date(req.body.fromDate).getTime();
        if (req.body.toDate != null)
          toDate = new Date(req.body.toDate).getTime();
        if (req.body.branchId != null) {
          var br = await branchModel.findOne({ _id: req.body.branchId });
          str.branchId = req.body.branchId;
        }
        let orders = await orderModel.find(str);
        if (orders.length > 0) {
          for (let i = 0; i < orders.length; i++) {
            for (let j = 0; j < orders[i].orderInfo.length; j++) {
              if (req.body.fromDate != null && req.body.toDate != null) {
                if (
                  fromDate <= orders[i].orderDate &&
                  orders[i].orderDate <= toDate
                ) {
                  let item = productList.find(
                    (x) => x.itemId == orders[i].orderInfo[j].itemInfo
                  );
                  let itemIndex = productList.findIndex(
                    (x) => x.itemId == orders[i].orderInfo[j].itemInfo
                  );
                  if (item != undefined) {
                    let newQty = item.saleQty + orders[i].orderInfo[j].quantity;
                    item.saleQty = newQty;
                    productList[itemIndex] = item;
                  } else {
                    let data = {
                      itemId: orders[i].orderInfo[j].itemInfo,
                      itemType: orders[i].orderInfo[j].type,
                      saleQty: orders[i].orderInfo[j].quantity,
                    };
                    productList.push(data);
                  }
                }
              } else if (req.body.fromDate != null && req.body.toDate == null) {
                if (fromDate <= orders[i].orderDate) {
                  let item = productList.find(
                    (x) => x.itemId == orders[i].orderInfo[j].itemInfo
                  );
                  let itemIndex = productList.findIndex(
                    (x) => x.itemId == orders[i].orderInfo[j].itemInfo
                  );
                  if (item != undefined) {
                    let newQty = item.saleQty + orders[i].orderInfo[j].quantity;
                    item.saleQty = parseFloat(newQty);
                    productList[itemIndex] = item;
                  } else {
                    let data = {
                      itemId: orders[i].orderInfo[j].itemInfo,
                      itemType: orders[i].orderInfo[j].type,
                      saleQty: orders[i].orderInfo[j].quantity,
                    };
                    productList.push(data);
                  }
                }
              } else if (req.body.fromDate == null && req.body.toDate != null) {
                if (orders[i].orderDate <= toDate) {
                  let item = productList.find(
                    (x) => x.itemId == orders[i].orderInfo[j].itemInfo
                  );
                  let itemIndex = productList.findIndex(
                    (x) => x.itemId == orders[i].orderInfo[j].itemInfo
                  );
                  if (item != undefined) {
                    let newQty = item.saleQty + orders[i].orderInfo[j].quantity;
                    item.saleQty = parseFloat(newQty);
                    productList[itemIndex] = item;
                  } else {
                    let data = {
                      itemId: orders[i].orderInfo[j].itemInfo,
                      itemType: orders[i].orderInfo[j].type,
                      saleQty: orders[i].orderInfo[j].quantity,
                    };
                    productList.push(data);
                  }
                }
              } else if (req.body.fromDate == null && req.body.toDate == null) {
                let item = productList.find(
                  (x) => x.itemId == orders[i].orderInfo[j].itemInfo
                );
                let itemIndex = productList.findIndex(
                  (x) => x.itemId == orders[i].orderInfo[j].itemInfo
                );
                if (item != undefined) {
                  let newQty = item.saleQty + orders[i].orderInfo[j].quantity;
                  item.saleQty = parseFloat(newQty);
                  productList[itemIndex] = item;
                } else {
                  let data = {
                    itemId: orders[i].orderInfo[j].itemInfo,
                    itemType: orders[i].orderInfo[j].type,
                    saleQty: orders[i].orderInfo[j].quantity,
                  };
                  productList.push(data);
                }
              }
            }
          }
        }
        if (productList.length > 0) {
          let total = 0;
          for (let i = 0; i < productList.length; i++) {
            total = total + parseFloat(productList[i].saleQty);
          }
          for (let i = 0; i < productList.length; i++) {
            if (common_service.isObjectId(productList[i].itemId)) {
              if (productList[i].itemType == 1) {
                prod = await foodModel.findOne({
                  _id: productList[i].itemId,
                });
              }
            }

            let percentage = parseFloat((productList[i].saleQty / total) * 100);
            productList[i].salePercent = parseFloat(percentage.toFixed(2));
            productList[i].productName =
              prod != null ? prod.prod_name : "no name";
          }
          if (req.body.fast != null && req.body.fast == 0) {
            for (let i = 0; i < productList.length; i++) {
              productList.sort((a, b) => b.saleQty - a.saleQty);
            }
          } else if (req.body.fast != null && req.body.fast == 1) {
            for (let i = 0; i < productList.length; i++) {
              productList.sort((a, b) => a.saleQty - b.saleQty);
            }
          }
          let lowerLimit = req.body.index * 20;
          let upperLimit = lowerLimit + 19;
          if (upperLimit > productList.length) upperLimit = productList.length;
          //upperLimit=3

          let data = productList.slice(lowerLimit, upperLimit + 1);

          if (data.length > 0)
            return (res = { data, status: STATUSCODES.SUCCESS });
          else
            return (res = {
              data: { msg: "index out of boundary" },
              status: STATUSCODES.UNPROCESSED,
            });
        } else {
          return (res = { data: [], status: STATUSCODES.NOTFOUND });
        }
      } else if (req.body.type == 1) {
        let branches = await branchModel.find({});
        if (branches.length > 0) {
          let outletList = [];
          for (let l = 0; l < branches.length; l++) {
            let id = branches[l]._id;
            let data = {
              branchId: id.toString(),
              branchCode: branches[l].storeCode,
              branchName: branches[l].branchName,
              saleQty: 0,
            };
            outletList.push(data);
          }

          for (let l = 0; l < branches.length; l++) {
            let fromDate, toDate;
            if (req.body.fromDate != null)
              fromDate = new Date(req.body.fromDate).getTime();
            if (req.body.toDate != null)
              toDate = new Date(req.body.toDate).getTime();
                   
            let orders = await orderModel.find({
              branchId: branches[l].storeCode,
            });
            if (orders.length > 0) {
              for (let i = 0; i < orders.length; i++) {
                for (let j = 0; j < orders[i].orderInfo.length; j++) {
                  if (req.body.fromDate != null && req.body.toDate != null) {
                    if (
                      fromDate <= orders[i].orderDate &&
                      orders[i].orderDate <= toDate
                    ) {
                      let item = outletList.find(
                        (x) => x.branchCode == orders[i].branchId
                      );
                      let itemIndex = outletList.findIndex(
                        (x) => x.branchCode == orders[i].branchId
                      );
                      if (item != undefined) {
                        let newQty =
                          item.saleQty +
                          parseInt(orders[i].orderInfo[j].quantity);
                        item.saleQty = newQty;
                        outletList[itemIndex] = item;
                      }
                    }
                  } else if (
                    req.body.fromDate != null &&
                    req.body.toDate == null
                  ) {
                    if (fromDate <= orders[i].orderDate) {
                      let item = outletList.find(
                        (x) => x.branchCode == orders[i].branchId
                      );
                      let itemIndex = outletList.findIndex(
                        (x) => x.branchCode == orders[i].branchId
                      );
                      if (item != undefined) {
                        let newQty =
                          item.saleQty +
                          parseInt(orders[i].orderInfo[j].quantity);
                        item.saleQty = newQty;
                        outletList[itemIndex] = item;
                      }
                    }
                  } else if (
                    req.body.fromDate == null &&
                    req.body.toDate != null
                  ) {
                    if (orders[i].orderDate <= toDate) {
                      let item = outletList.find(
                        (x) => x.branchCode == orders[i].branchId
                      );
                      let itemIndex = outletList.findIndex(
                        (x) => x.branchCode == orders[i].branchId
                      );
                      if (item != undefined) {
                        let newQty =
                          item.saleQty +
                          parseInt(orders[i].orderInfo[j].quantity);
                        item.saleQty = newQty;
                        outletList[itemIndex] = item;
                      }
                    }
                  } else if (
                    req.body.fromDate == null &&
                    req.body.toDate == null
                  ) {
                    {
                      let item = outletList.find(
                        (x) => x.branchCode == orders[i].branchId
                      );
                      let itemIndex = outletList.findIndex(
                        (x) => x.branchCode == orders[i].branchId
                      );
                      if (item != undefined) {
                        let newQty =
                          item.saleQty +
                          parseInt(orders[i].orderInfo[j].quantity);
                        item.saleQty = newQty;
                        outletList[itemIndex] = item;
                      }
                    }
                  }
                }
              }
            }
          }

          if (outletList.length > 0) {
            let total = 0;
            for (let i = 0; i < outletList.length; i++) {
              total = total + outletList[i].saleQty;
            }
            for (let i = 0; i < outletList.length; i++) {
              let percentage = parseFloat(
                (outletList[i].saleQty / total) * 100
              );
              outletList[i].salePercent = parseFloat(percentage.toFixed(2));
            }
            if (req.body.fast != null && req.body.fast == 0)
              for (let i = 0; i < outletList.length; i++) {
                outletList.sort((a, b) => b.saleQty - a.saleQty);
              }
            else if (req.body.fast != null && req.body.fast == 1)
              for (let i = 0; i < outletList.length; i++) {
                outletList.sort((a, b) => a.saleQty - b.saleQty);
              }
            let lowerLimit = req.body.index * 20;
            let upperLimit = lowerLimit + 19;
            if (upperLimit > outletList.length) upperLimit = outletList.length;
            //upperLimit=3
            let data = outletList.splice(lowerLimit, upperLimit + 1);
            if (data.length > 0)
              return (res = { data, status: STATUSCODES.SUCCESS });
            else
              return (res = {
                data: { msg: "index out of boundary" },
                status: STATUSCODES.UNPROCESSED,
              });
          } else {
            return (res = { data: [], status: STATUSCODES.NOTFOUND });
          }
        }
      }
    } else {
      return (res = {
        data: { msg: "not acceptable" },
        status: STATUSCODES.NOTACCEPTABLE,
      });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
// added on 25-07-23
module.exports.creditDetails = async (req) => {
  const { creditModel } = conn.payment(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  try {
    var rsList = [];
    let creditList = "";
    if (req.decode.role == ROLES.ADMIN) {
      creditList = await creditModel.find({});
    } else {
      creditList = await creditModel.find({ branchId: req.body.branchId });
    }

    let branch = {};
    if (req.body.branchId) {
      branch = await branchModel.findOne({ storeCode: req.body.branchId });
      if (!common_service.isEmpty(branch)) {
        creditList = creditList.filter(
          (x) => x.branchId == req.body.branchId || x.branchId == branch._id
        );
      }
    }
    if (Array.isArray(creditList) && creditList.length > 0) {
      for (let i = 0; i < creditList.length; i++) {
        const element = creditList[i];
        let resobj = {};
        resobj.branchId = element.branchId;
        let branchExist = {};
        if (
          typeof element.branchId == "string" &&
          element.branchId.length == 24
        ) {
          branchExist = await branchModel.findOne({
            _id: element.branchId,
          });
        } else {
          branchExist = await branchModel.findOne({
            storeCode: element.branchId,
          });
        }
        resobj.branchId = !common_service.isEmpty(branchExist)
          ? branchExist.branchName
          : "no branch Name";
        let customerExist = {};
        if (common_service.isObjectId(element.supplierId)) {
          customerExist = await customerModel.findOne({
            _id: element.supplierId,
          });
        }
        resobj.customerName = !common_service.isEmpty(customerExist)
          ? customerExist.name
          : "No customerName";
        resobj.mobileno = !common_service.isEmpty(customerExist)
          ? customerExist.mobileNo
          : "No mobilleNo";
        resobj.LastPaidAmount = element.netAmount - element.balance;
        resobj.lastPaidDate = common_service
          .prescisedateconvert(element.lastPaidDate)
          .split(" ")[0];
        resobj.totalcreditAmount = element.netAmount;
        if (common_service.checkObject(customerExist)) {
          rsList.push(resobj);
        }
      }

      if (rsList.length > 10) {
        rsList.splice(0, 10);
      }

      res = { data: rsList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [{ msg: "not found" }], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

//#endregion
