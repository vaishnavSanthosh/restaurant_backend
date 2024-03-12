/** @format */

//created on 28-01-21
//#region header
const {
  ORDERSTATUS,
  STATUSCODES,
  ORDERTYPES,
  LOG,
  ROLES,
  PREFIXES,
  CREDITSTATUS,
  SHIFTSTATUS,
  PAYMENTTYPES,
} = require("../Model/enums.js");
const common_service = require("../Routes/commonRoutes.js");
const categoryService = require("../Routes/CategoryRoute.js");
const foodService = require("../Routes/FoodRoutes.js");
const seatingService = require("../Routes/ReservationRoutes.js");
const customerService = require("../Routes/customerRoute.js");
const rewardService = require("../Routes/RewardRoutes.js");
const employeeService = require("./EmployeeRoutes");
const settings_service = require("./settingsRoutes");
const conn = require("../../userDbConn");
const expenseService = require("./ExpenseRoutes.js");
const qr = require("qrcode");
const barcode = require("barcode");
const { isEmpty } = require("../Routes/commonRoutes.js");
const { log } = require("node-zklib/helpers/errorLog");
//#endregion

//#region methods

//method edited on 24-02-22
/*added array initialisation for items*/

//added on 21-03-22
module.exports.returnOrderType = (req) => {
  try {
    let res =
      req == 0
        ? ORDERTYPES.DIN
        : req == 1
        ? ORDERTYPES.TAK
        : req == 2
        ? ORDERTYPES.DEL
        : req == 3
        ? ORDERTYPES.MES
        : "invalid order";
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 30-04-22
//edited on 11-05-2022
module.exports.viewOrderByTableNumber = async (req) => {
  const { orderModel } = conn.order(process.env.db);
  try {
    let res = {};
    let orderExist = await orderModel.findOne({
      tableNumber: req.body.tableNumber,
    });

    if (orderExist) {
      for (let i = 0; i < orderExist.items.length; i++) {
        const element = orderExist.items[i];

        let category = await categoryService.viewCategoryById(element.category);
        let subcategory = await categoryService.viewSubCategorySingle(
          element.subcategory
        );
        let employee = await employeeService.viewSingleEmployee(
          orderExist.emp_id
        );
        orderExist._doc["categoryName"] =
          category.status == STATUSCODES.SUCCESS
            ? category.data.categoryName
            : null;
        orderExist._doc["subcategoryName"] =
          subcategory.status == STATUSCODES.SUCCESS
            ? subcategory.data.subcategoryName
            : null;
        let foodItem = await foodService.viewFoodItemsSingle(element.item);
        element.itemName =
          foodItem.status == STATUSCODES.SUCCESS
            ? foodItem.data.prod_name
            : null;
        orderExist._doc["orderDate"] = common_service.prescisedateconvert(
          orderExist.orderDate
        );
        orderExist._doc["employeeName"] =
          employee.status == STATUSCODES.SUCCESS
            ? employee.data.staff_name
            : null;
        orderExist._doc["designationName"] =
          employee.status == STATUSCODES.SUCCESS
            ? employee.data._doc["designationName"]
            : null;
      }
      res = { data: orderExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 05-05-22
module.exports.ordersList = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { paymentModel } = conn.payment(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let res = {};
    let rslist = [];
    let orderList = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        orderList = await orderModel
          .find({ branchId: req.body.branchId })
          .skip(req.body.index)
          .limit(30);
      } else {
        orderList = await orderModel.find({}).skip(req.body.index).limit(30);
      }
    } else {
      orderList = await orderModel
        .find({ branchId: req.body.branchId })
        .skip(req.body.index)
        .limit(30);
    }

    if (Array.isArray(orderList) && orderList.length > 0) {
      for (let i = 0; i < orderList.length; i++) {
        let resobj = {};
        const element = orderList[i];
        resobj.orderid = `ORD${element.orderId}`;
        resobj.date = common_service
          .prescisedateconvert(element.orderDate)
          .split(" ")[0];
        let customerData = {};
        if (common_service.isObjectId(element.cus_id)) {
          customerData = await customerModel.findOne({ id: element.cus_id });
        }
        resobj.customerName = customerData ? customerData.name : null;
        resobj.mobileNo = customerData ? customerData.mobileNo : null;
        let totalAmount = 0;
        let returnAmount = 0;
        resobj.balance = 0;
        if (element.orderInfo.length > 0) {
          for (let j = 0; j < element.orderInfo.length; j++) {
            // const element = element.orderInfo[j];
            if (element.orderInfo[j].returnAmount) {
              returnAmount = returnAmount + element.orderInfo[j].returnAmount;
            }
          }
        }
        let payment = await paymentModel.findOne({ purchasePk: element._id });
        if (payment != null) {
          if (payment.paymentMethod.length > 0) {
            payment.paymentMethod.map((x) => {
              totalAmount = totalAmount + x.paidAmount;
            });
          }
        }
        resobj.status =
          element.payableAmount == totalAmount ? "INVOICED" : "PENDING";

        resobj.totalAmount = element.totalAmount;
        resobj.paidAmount = totalAmount;
        resobj.discount = element.discount;
        resobj.returnAmount = returnAmount;
        resobj.balance =
          resobj.totalAmount -
          resobj.discount -
          resobj.paidAmount -
          resobj.returnAmount;
        resobj._id = element._id;
        rslist.push(resobj);
      }
      res = { data: rslist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 06-05-22
module.exports.viewpayments = async (req) => {
  const { paymentModel } = conn.payment(process.env.db);
  try {
    let res = {};
    let rslist = [];
    let paymentList = await paymentModel.find({
      branchId: process.env.branchId,
    });
    if (Array.isArray(paymentList) && paymentList.length > 0) {
      for (let i = 0; i < paymentList.length; i++) {
        const element = paymentList[i];
        let resobj = {};
        resobj.invoiceNo = `ORD${element.invoiceNo}`;
        let customerData = await customerService.getSingleCustomer({
          params: { id: element.cus_id },
        });
        resobj.customerName = customerData.data ? customerData.data.name : null;
        resobj.paymentType = element.paymentType;
        resobj.paidDate = common_service
          .prescisedateconvert(element.date)
          .split(" ")[0];
        resobj.paidAmount = element.paidAmount;
        rslist.push(resobj);
      }
      res = { data: rslist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.viewCredits = async (req) => {
  const { creditModel } = conn.payment(req.decode.db);
  const { orderModel } = conn.order(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  try {
    // req.body.index=parseInt(req.body.index)*20
    let rslist = {
      list: [],
      totalCredit: 0,
      totalsales: 0,
    };
    let str = {};
    let sum = 0;
    let duplist = [];
    if (req.body.cusId != null) str.supplierId = req.body.cusId;
    let brNo = req.body.branchId ? req.body.branchId : process.env.branchId;
    let branchExist = await branchModel.findOne({ storeCode: brNo });
    let creditList = [],
      credit = [];
    if (req.body.fromDate != null)
      fromDate = new Date(req.body.fromDate).getTime();
    if (req.body.toDate != null) toDate = new Date(req.body.toDate).getTime();
    if (!common_service.isEmpty(branchExist)) {
      str.branchId = branchExist?.storeCode;
      credit = await creditModel.find({ str });
      str.branchId = branchExist?._id;
    } else {
      credit = await creditModel.find(str);
    }

    for (let i = 0; i < credit.length; i++) {
      if (req.body.fromDate != null && req.body.toDate != null) {
        if (
          fromDate <= credit[i].purchaseDate &&
          credit[i].purchaseDate <= toDate
        ) {
          creditList.push(credit[i]);
        }
      } else if (req.body.fromDate != null && req.body.toDate == null) {
        if (fromDate <= credit[i].purchaseDate) {
          creditList.push(credit[i]);
        }
      } else if (req.body.fromDate == null && req.body.toDate != null) {
        if (credit[i].purchaseDate <= toDate) {
          creditList.push(credit[i]);
        }
      } else if (req.body.fromDate == null && req.body.toDate == null) {
        creditList.push(credit[i]);
      }
    }

    let supplierCreditTotal = 0,
      customerCreditTotal = 0;
    if (Array.isArray(creditList) && creditList.length > 0) {
      for (let i = 0; i < creditList.length; i++) {
        const element = creditList[i];
        let resobj = {};

        if (duplist.length == 0) {
          duplist.push({ purchaseId: element.purchaseId });
        } else {
          let dupfind = duplist.find((x) => x.purchaseId == element.purchaseId);
          if (common_service.isEmpty(dupfind)) {
            duplist.push({ purchaseId: element.purchaseId });
          }
        }
        sum = sum + element.balance;
        let customer = {};
        let supplier = {};
        if (common_service.isObjectId(element.supplierId)) {
          customer = await customerModel.findOne({ _id: element.supplierId });
          supplier = await supplierModel.findOne({ _id: element.supplierId });
        }
        let suppType;
        if (common_service.checkObject(customer)) {
          customerCreditTotal = customerCreditTotal + element.balance;
          suppType = "customer";
        }
        if (common_service.checkObject(supplier)) {
          supplierCreditTotal = supplierCreditTotal + element.balance;
          suppType = "supplier";
        }
        resobj.purchaseId = element.purchaseId;
        let branch = await branchModel.findOne({ storeCode: element.branchId });
        if (common_service.isEmpty(branch)) {
          branch = await branchModel.findOne({ _id: element.branchId });
        }
        resobj.supplierId = element.supplierId;
        resobj.purchaseDate = common_service
          .prescisedateconvert(element.purchaseDate)
          .split(" ")[0];
        resobj.netAmount = element.netAmount;
        resobj.discount = element.discount;
        resobj.lastPaidDate = common_service
          .prescisedateconvert(element.lastPaidDate)
          .split(" ")[0];
        resobj.paidAmount = element.paidAmount;
        resobj.balance = element.balance;
        resobj.status = element.status;
        resobj.isPurchase = element.isPurchase;
        resobj.branchId = element.branchId;
        resobj.purchasePk = element.purchasePk;
        resobj.purchasePk = element.purchasePk;
        resobj.suppType = suppType;
        resobj.id = !common_service.isEmpty(supplier)
          ? "SUP" + supplier.spId
          : !common_service.isEmpty(customer)
          ? "CUS" + customer.cusId
          : "no Name";
        resobj.supplier = !common_service.isEmpty(supplier)
          ? supplier.supplierName
          : !common_service.isEmpty(customer)
          ? customer.name
          : "no Name";
        resobj.mobileNo = !common_service.isEmpty(supplier)
          ? supplier.mobile
          : !common_service.isEmpty(customer)
          ? customer.mobileNo
          : "No Mobile";
        resobj.locationName = !common_service.isEmpty(branch)
          ? branch.branchName
          : "no branch";

        resobj.orderstatus = element.status;

        let sales = await orderModel.findOne({ _id: element.purchasePk });
        if (!common_service.isEmpty(sales)) {
          resobj.orderstatus = sales.status;

          rslist.totalsales = rslist.totalsales + element.balance;
        }

        rslist.totalCredit = rslist.totalCredit + element.balance;
        resobj.type = 1;
        if (resobj.purchaseId.includes(PREFIXES.SALESINV)) {
          resobj.type = 0;
        }
        let exist = rslist.list.find((x) => x.purchaseId == resobj.purchaseId);
        if (common_service.isEmpty(exist)) {
          rslist.list.push(resobj);
        }
      }
    }
    rslist.customerCreditTotal = customerCreditTotal;
    rslist.supplierCreditTotal = supplierCreditTotal;
    let wopa = 0;
    rslist.list.map((x) => {
      wopa = wopa + x.balance;
      if (x.netAmount == null) {
        x.netAmount = 0;
      }
    });
    if (req.body.status) {
      rslist.list = rslist.list.filter((x) => x.orderstatus == req.body.status);
    }
    return (res = { data: rslist, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 06-07-23
module.exports.viewwallet = async (req) => {
  const { walletModel } = conn.payment(process.env.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let res = {};
    let rslist = [];
    let wallettotal = 0;
    let debittotal = 0;
    let walletInfo = await walletModel
      .find({
        cus_id: req.body.cus_id,
      })
      .skip(req.body.index)
      .limit(30);
    if (Array.isArray(walletInfo) && walletInfo.length > 0) {
      for (let i = 0; i < walletInfo.length; i++) {
        const element = walletInfo[i];
        let resobj = {};
        resobj.cus_id = element.cus_id;
        let customerData = await customerService.getSingleCustomer({
          params: { id: element.cus_id },
        });
        resobj.customerName = customerData.data ? customerData.data.name : null;
        resobj.transNo = `TRANS${element.transNo}`;
        resobj.date = common_service.prescisedateconvert(element.date);
        resobj.credit = element.credit;
        resobj.debit = element.debit;
        debittotal = debittotal + element.debit;
        wallettotal = wallettotal + element.credit;
        rslist.push(resobj);
      }
      res = {
        data: {
          wallettotal: wallettotal,
          debittotal: debittotal,
          list: rslist,
        },
        status: STATUSCODES.SUCCESS,
      };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 10-05-22
//edited on 13-06-22
module.exports.searchInvoice = async (req) => {
  const { orderModel } = conn.order(process.env.db);
  try {
    let res = {};
    let orderExist = await orderModel.findOne({
      _id: req.body._id,
    });
    if (orderExist) {
      orderExist._doc["orderId"] = `ORD${orderExist.orderId}`;
      orderExist._doc["orderDate"] = common_service
        .prescisedateconvert(orderExist.orderDate)
        .split(" ")[0];
      for (let i = 0; i < orderExist.items.length; i++) {
        const element = orderExist.items[i];
        let category = await categoryService.viewCategoryById(element.category);
        let subcategory = await categoryService.viewSubCategorySingle(
          element.subcategory
        );
        element.categoryName =
          category.status == STATUSCODES.SUCCESS
            ? category.data.categoryName
            : null;
        element.subcategoryName =
          subcategory.status == STATUSCODES.SUCCESS
            ? subcategory.data.subcategoryName
            : null;
        let foodItem = await foodService.viewFoodItemsSingle(element.item);
        if (foodItem.status == STATUSCODES.SUCCESS) {
          element.itemName = foodItem.data.prod_name;
          element.unit = foodItem.data.unit;
        } else {
          //added on 13-06-22 -> added else case containing values if food is missing
          element.itemName = null;
          element.unit = null;
        }
      }
      let customer = await customerService.getSingleCustomer({
        params: { id: orderExist.cus_id },
      });
      orderExist._doc["CustomerName"] =
        customer.status == STATUSCODES.SUCCESS ? customer.data.name : null;
      orderExist._doc["MobileNo"] =
        customer.status == STATUSCODES.SUCCESS ? customer.data.mobileNo : null;
      res = { data: orderExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 11-05-22
//edited on 17-06-22
module.exports.holdOrder = async (req) => {
  const { orderModel } = conn.order(process.env.db);
  try {
    let res = {};
    let OFFERDETAILS = [];
    let REWARDCREDITED = [];
    let ORDERNO = 0;
    let orderExist = await orderModel.findOne({
      orderId: req.body.orderId.split("ORD")[1],
    });
    if (req.body.orderId) {
      if (!common_service.isEmpty(orderExist)) {
        if (Array.isArray(orderExist) && orderExist.items.length > 0) {
          for (let i = 0; i < orderExist.items.length; i++) {
            const element = orderExist.items[i];
            for (let j = 0; j < OFFERDETAILS.length; j++) {
              const offerElem = OFFERDETAILS[j];
              if (offerElem.itemId != element.item) {
                OFFERDETAILS.push({
                  itemId: element.item,
                  offer: element.offer,
                });
              } else {
                OFFERDETAILS.push({
                  itemId: element.item,
                  offer: element.offer,
                });
              }
            }
            let rewardDetails = await rewardService.viewPointOfFoodItem(
              element.item
            );
            //edited on 16-07-22 -> new validation added insted of old validation
            if (!common_service.isEmpty(rewardDetails.data)) {
              REWARDCREDITED.push({
                item: element.item,
                point: rewardDetails.data.point,
              });
            }
          }
        }
        orderExist.offers = OFFERDETAILS.length > 0 ? OFFERDETAILS : null;
        orderExist.rewardPoints =
          REWARDCREDITED.length > 0 ? REWARDCREDITED : null;
        orderExist.usedPoints = req.body.usedPoints;
        orderExist.status = ORDERSTATUS.HEL; //added on 12-07-22 -> implemented status change from pending to hold
        let data = await orderExist.save();
        if (data) {
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      }
    } else {
      let neworder = new orderModel({});
      // let orderList = await orderModel.aggregate([
      //   {
      //     $sort: { orderId: -1 },
      //   },
      // ]);
      // if (orderList.length > 0) {
      //   ORDERNO = orderList[0].orderId + 1;
      // } else {
      //   ORDERNO = 1;
      // }
      /*edited on 17-06-22 - transNo generation made branchwise */
      let orderList = await orderModel.find({
        branchId: process.env.branchId,
      });
      if (orderList.length > 0) {
        ORDERNO = orderList[orderList.length - 1].orderId + 1;
      } else {
        ORDERNO = 1;
      }
      /*ends here */
      for (let i = 0; i < req.body.items.length; i++) {
        const element = req.body.items[i];
        for (let j = 0; j < OFFERDETAILS.length; j++) {
          const offerElem = OFFERDETAILS[j];
          if (offerElem.itemId != element.item) {
            OFFERDETAILS.push({
              itemId: element.item,
              offer: element.offer,
            });
          } else {
            OFFERDETAILS.push({
              itemId: element.item,
              offer: element.offer,
            });
          }
        }
        let rewardDetails = await rewardService.viewPointOfFoodItem(
          element.item
        );
        //edited on 16-07-22 -> new validation added insted of old validation
        if (!common_service.isEmpty(rewardDetails.data)) {
          REWARDCREDITED.push({
            item: element.item,
            point: rewardDetails.data.point,
          });
        }
      }
      neworder.orderId = ORDERNO;
      neworder.orderType = this.returnOrderType(req.body.orderType);
      neworder.tableNumber = req.body.tableNumber;
      neworder.orderDate = new Date(Date.now()).getTime();
      neworder.items = req.body.items;
      // req.body.paymentMethod.paidAmount = req.body.paidAmount;
      // neworder.paymentMethod = req.body.paymentMethod;

      neworder.totalAmount = req.body.totalAmount;
      // if (req.body.totalAmount <= req.body.paidAmount) {
      //   neworder.status = ORDERSTATUS.COM;
      // } else {
      //   neworder.status = ORDERSTATUS.PEN;
      //   let newData = {
      //     body: {
      //       cus_id: req.body.customerId,
      //       order_id: neworder.orderId,
      //       paidAmount: req.body.paidAmount,
      //       balance: req.body.totalAmount - req.body.paidAmount,
      //       lastPaidDate: new Date(Date.now()).getTime(),
      //       adminId: req.decode.admin,
      //     },
      //   };
      //   await paymentService.addCredit(newData);
      // }
      neworder.status = ORDERSTATUS.PEN;
      neworder.coupons = req.body.coupons ? req.body.coupons : null;
      neworder.offers = OFFERDETAILS;
      neworder.rewardPoints = REWARDCREDITED;
      neworder.shipmentCharge = neworder.orderType == ORDERTYPES.DEL ? 10 : 0;
      neworder.branchId = process.env.branchId;
      neworder.cus_id = req.body.cus_id; //edited on 16-07-22 -> field name was incorrect (customerId to cus_id)

      if (req.body.usedPoints) {
        neworder.usedPoints = req.body.usedPoints;
        // await customerService.addRewardPoints({
        //   customerId: req.body.cus_id,
        //   points: 0 - req.body.usedPoints,
        // });
      } else {
        neworder.usedPoints = 0;
      }
      /*missing field assign implemented on 12-07-22 */
      neworder.emp_id = req.decode._id;
      neworder.shiftId = await settings_service.getCurrentShift();
      neworder.status = ORDERSTATUS.HEL;
      /*ends here */
      let data = await neworder.save();
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

module.exports.payorder = async (req) => {
  const { orderModel } = conn.order(process.env.db);
  const { paymentModel } = conn.payment(process.env.db);
  let db = process.env.db;
  try {
    if (Object.keys(req.query).length == 0) {
      return (res = { data: "not acceptable", status: 406 });
    }

    if (!req.query.toDate && req.query.invoiceNo && !req.query.fromDate) {
      let sales = await orderModel.findOne({ orderId: req.query.invoiceNo });
      if (sales) {
        let t = sales.paymentMethod;
        let ar = [],
          br = [];
        // for (let i = 0; i < t.length; i++) {
        //edited on 18-07-22 -> for loop,index removed because paymentMethod is object
        if (req.query.paymentType) {
          if (req.query.paymentType.toLowerCase() == t.type.toLowerCase())
            ar.push(t.type);
        } else {
          br.push(t.type);
        }
        // }
        var d = {};
        if (ar.length > 0 && req.query.paymentType) {
          d = {
            invoiceNo: sales.orderId,
            orderDate: common_service
              .prescisedateconvert(sales.orderDate)
              .split(" ")[0],
            paymentMethod: ar,
            orderTotal: sales.totalAmount,
          };
          arr.push(d);
        } else if (ar.length == 0 && req.query.paymentType) {
          return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        } else {
          d = {
            invoiceNo: sales.orderId,
            orderDate: common_service
              .prescisedateconvert(sales.orderDate)
              .split(" ")[0],
            paymentMethod: sales.paymentMethod.type, //re-assigned value on 18-07-22 ->value paymentMethod is re-assigned
            orderTotal: sales.totalAmount,
          };
          arr.push(d);
        }

        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.NOTFOUND });
      }
    }

    if (!req.query.toDate && req.query.invoiceNo && req.query.fromDate) {
      //edited on 18-07-22 -> search parameter modified
      let sales = await orderModel.findOne({
        orderId: req.query.invoiceNo,
        status: ORDERSTATUS.COM,
      });
      if (sales) {
        let ar = [],
          br = [];
        let fromDate = new Date(req.query.fromDate).getTime();
        let date = new Date(sales.orderDate);
        let d = `${
          date.getMonth() + 1
        }/${date.getDate()}/${date.getFullYear()}`;
        let saleFrom = new Date(d).getTime();
        if (saleFrom == fromDate) {
          let t = sales.paymentMethod;
          // for (let i = 0; i < t.length; i++) {
          //edited on 18-07-22 -> for loop,index removed because paymentMethod is object
          if (req.query.paymentType) {
            if (req.query.paymentType.toLowerCase() == t.type.toLowerCase())
              ar.push(t.type);
          } else {
            br.push(t.type);
          }
          // }

          var p = {};
          if (ar.length > 0 && req.query.paymentType) {
            p = {
              invoiceNo: sales.orderId,
              orderDate: common_service
                .prescisedateconvert(sales.orderDate)
                .split(" ")[0],
              paymentMethod: ar,
              orderTotal: sales.totalAmount,
            };
            arr.push(p);
          } else if (ar.length == 0 && req.query.paymentType) {
            return (res = { data: {}, status: STATUSCODES.NOTFOUND });
          } else {
            p = {
              invoiceNo: sales.orderId,
              orderDate: common_service
                .prescisedateconvert(sales.orderDate)
                .split(" ")[0],
              paymentMethod: br,
              orderTotal: sales.totalAmount,
            };
            arr.push(p);
          }
          return (res = { data: arr, status: STATUSCODES.SUCCESS });
        } else {
          return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        }
      } else {
        return (res = { data: {}, status: STATUSCODES.NOTFOUND });
      }
    }
    if (!req.query.fromDate && req.query.invoiceNo && req.query.toDate) {
      let sales = await orderModel.findOne({ orderId: req.query.invoiceNo });
      if (sales) {
        let ar = [],
          br = [];
        let toDate = new Date(req.query.toDate).getTime();
        let date = new Date(sales.orderDate);
        let d = `${
          date.getMonth() + 1
        }/${date.getDate()}/${date.getFullYear()}`;
        let saleTo = new Date(d).getTime();
        if (saleTo == toDate) {
          let t = sales.paymentMethod;
          for (let i = 0; i < t.length; i++) {
            if (req.query.paymentType) {
              if (
                req.query.paymentType.toLowerCase() == t[i].type.toLowerCase()
              )
                ar.push(t[i].type);
            } else {
              br.push(t[i].type);
            }
          }

          var p = {};
          if (ar.length > 0 && req.query.paymentType) {
            p = {
              invoiceNo: sales.orderId,
              orderDate: common_service
                .prescisedateconvert(sales.orderDate)
                .split(" ")[0],
              paymentMethod: ar,
              orderTotal: sales.totalAmount,
            };
            arr.push(p);
          } else if (ar.length == 0 && req.query.paymentType) {
            return (res = { data: {}, status: STATUSCODES.NOTFOUND });
          } else {
            p = {
              invoiceNo: sales.orderId,
              orderDate: common_service
                .prescisedateconvert(sales.orderDate)
                .split(" ")[0],
              paymentMethod: br,
              orderTotal: sales.totalAmount,
            };
            arr.push(p);
          }
          return (res = { data: arr, status: STATUSCODES.SUCCESS });
        } else {
          return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        }
      } else {
        return (res = { data: {}, status: STATUSCODES.NOTFOUND });
      }
    }
    if (req.query.invoiceNo && req.query.toDate && req.query.fromDate) {
      let sales = await orderModel.findOne({ orderId: req.query.invoiceNo });
      if (sales) {
        let ar = [],
          br = [];
        let toDate = new Date(req.query.toDate).getTime();
        let dat = new Date(sales.orderDate);
        let da = `${dat.getMonth() + 1}/${dat.getDate()}/${dat.getFullYear()}`;
        let saleTo = new Date(da).getTime();
        let fromDate = new Date(req.query.fromDate).getTime();
        let date = new Date(sales.orderDate);
        let d = `${
          date.getMonth() + 1
        }/${date.getDate()}/${date.getFullYear()}`;
        let saleFrom = new Date(d).getTime();
        if (saleFrom == fromDate || saleFrom == toDate) {
          let t = sales.paymentMethod;
          for (let i = 0; i < t.length; i++) {
            if (req.query.paymentType) {
              if (
                req.query.paymentType.toLowerCase() == t[i].type.toLowerCase()
              )
                ar.push(t[i].type);
            } else {
              br.push(t[i].type);
            }
          }
          var p = {};
          if (ar.length > 0 && req.query.paymentType) {
            p = {
              invoiceNo: sales.orderId,
              orderDate: common_service
                .prescisedateconvert(sales.orderDate)
                .split(" ")[0],
              paymentMethod: ar,
              orderTotal: sales.totalAmount,
            };
            arr.push(p);
          } else if (ar.length == 0 && req.query.paymentType) {
            return (res = { data: {}, status: STATUSCODES.NOTFOUND });
          } else {
            p = {
              invoiceNo: sales.orderId,
              orderDate: common_service
                .prescisedateconvert(sales.orderDate)
                .split(" ")[0],
              paymentMethod: br,
              orderTotal: sales.totalAmount,
            };
            arr.push(p);
          }
          return (res = { data: arr, status: STATUSCODES.SUCCESS });
        } else {
          return (res = { data: {}, status: STATUSCODES.NOTFOUND });
        }
      } else {
        return (res = { data: {}, status: STATUSCODES.NOTFOUND });
      }
    }
    if (!req.query.invoiceNo && req.query.toDate && req.query.fromDate) {
      let sales = await orderModel.find({ branchId: process.env.branchId });
      if (sales) {
        let fromDate = new Date(req.query.fromDate).getTime();
        let toDate = new Date(req.query.toDate).getTime();
        for (let i = 0; i < sales.length; i++) {
          let date = new Date(sales[i].orderDate);
          let d = `${
            date.getMonth() + 1
          }/${date.getDate()}/${date.getFullYear()}`;
          let saleFrom = new Date(d).getTime();

          if (fromDate <= saleFrom && saleFrom <= toDate) {
            let ar = [],
              br = [];
            let t = sales[i].paymentMethod;
            if (!common_service.isEmpty(t)) {
              if (req.query.paymentType) {
                if (
                  req.query.paymentType.toLowerCase() == t.type.toLowerCase()
                ) {
                  ar.push(t.type);
                }
              } else {
                br.push(t.type);
              }
            }

            var p = {};
            if (ar.length > 0 && req.query.paymentType) {
              p = {
                invoiceNo: sales[i].orderId,
                orderDate: common_service
                  .prescisedateconvert(sales[i].orderDate)
                  .split(" ")[0],
                paymentMethod: ar,
                orderTotal: sales[i].totalAmount,
              };
              arr.push(p);
            } else if (ar.length == 0 && req.query.paymentType) {
              brr.push({});
            } else {
              p = {
                invoiceNo: sales[i].orderId,
                orderDate: common_service
                  .prescisedateconvert(sales[i].orderDate)
                  .split(" ")[0],
                paymentMethod: br.length > 0 ? br : "Payment Pending",
                orderTotal: sales[i].totalAmount,
              };
              arr.push(p);
            }
          }
        }
        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.SUCCESS });
      }
    }

    if (!req.query.invoiceNo && !req.query.toDate && req.query.fromDate) {
      let sales = await orderModel.find({
        branchId: process.env.branchId,
        status: ORDERSTATUS.COM,
      });
      if (sales) {
        let fromDate = new Date(req.query.fromDate).getTime();
        for (let i = 0; i < sales.length; i++) {
          let date = new Date(sales[i].orderDate);
          let d = `${
            date.getMonth() + 1
          }/${date.getDate()}/${date.getFullYear()}`;
          let saleFrom = new Date(d).getTime();
          if (fromDate <= saleFrom) {
            let ar = [],
              br = [];
            let t = sales[i].paymentMethod;
            // for (let j = 0; j < t.length; j++) {
            if (req.query.paymentType) {
              if (req.query.paymentType.toLowerCase() == t?.type.toLowerCase())
                ar.push(t?.type);
            } else {
              br.push(t?.type);
            }
            // }

            var p = {};
            if (ar.length > 0 && req.query.paymentType) {
              p = {
                invoiceNo: sales[i].orderId,
                orderDate: common_service
                  .prescisedateconvert(sales[i].orderDate)
                  .split(" ")[0],
                paymentMethod: ar,
                orderTotal: sales[i].totalAmount,
              };
              arr.push(p);
            } else if (ar.length == 0 && req.query.paymentType) {
              brr.push({});
            } else {
              p = {
                invoiceNo: sales[i].orderId,
                orderDate: common_service
                  .prescisedateconvert(sales[i].orderDate)
                  .split(" ")[0],
                paymentMethod: br,
                orderTotal: sales[i].totalAmount,
              };
              arr.push(p);
            }
          }
        }
        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.SUCCESS });
      }
    }

    if (!req.query.invoiceNo && req.query.toDate && !req.query.fromDate) {
      let sales = await orderModel.find({});
      if (sales) {
        let toDate = new Date(req.query.toDate).getTime();
        for (let i = 0; i < sales.length; i++) {
          let date = new Date(sales[i].orderDate);
          let d = `${
            date.getMonth() + 1
          }/${date.getDate()}/${date.getFullYear()}`;
          let saleFrom = new Date(d).getTime();
          if (saleFrom <= toDate) {
            let ar = [],
              br = [];
            let t = sales[i].paymentMethod;
            for (let j = 0; j < t.length; j++) {
              if (req.query.paymentType) {
                if (
                  req.query.paymentType.toLowerCase() == t[j].type.toLowerCase()
                )
                  ar.push(t[j].type);
              } else {
                br.push(t[j].type);
              }
            }

            var p = {};
            if (ar.length > 0 && req.query.paymentType) {
              p = {
                invoiceNo: sales[i].orderId,
                orderDate: common_service
                  .prescisedateconvert(sales[i].orderDate)
                  .split(" ")[0],
                paymentMethod: ar,
                orderTotal: sales[i].totalAmount,
              };
              arr.push(p);
            } else if (ar.length == 0 && req.query.paymentType) {
              brr.push({});
            } else {
              p = {
                invoiceNo: sales[i].orderId,
                orderDate: common_service
                  .prescisedateconvert(sales[i].orderDate)
                  .split(" ")[0],
                paymentMethod: br,
                orderTotal: sales[i].totalAmount,
              };
              arr.push(p);
            }
          }
        }
        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.SUCCESS });
      }
    }
    if (!req.query.invoiceNo && !req.query.toDate && !req.query.fromDate) {
      let sales = await orderModel.find({
        branchId: process.env.branchId,
        "paymentMethod.type": req.query.paymentType,
      });
      if (Array.isArray(sales) && sales.length > 0) {
        for (let i = 0; i < sales.length; i++) {
          const element = sales[i];
          let resobj = {
            invoiceNo: `ORD-INV` + element.orderId,
            orderDate: common_service
              .prescisedateconvert(element.orderDate)
              .split(" ")[0],
            paymentMethod: element.paymentMethod.type,
            orderTotal: element.totalAmount,
          };
          arr.push(resobj);
        }
        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      }
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//Edited on 07-07-2023
module.exports.salesReport = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { paymentModel } = conn.payment(req.decode.db);
  try {
    let salesList = [];
    let newList = [];
    let rsList = [];

    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchCode) {
        let branch = await branchModel.findOne({
          storeCode: req.body.branchCode,
        });
        salesList = await orderModel.find({ branchId: branch.storeCode });
      } else {
        salesList = await orderModel.find({});
      }
    } else {
      let branch = await branchModel.findOne({
        storeCode: req.body.branchCode,
      });
      salesList = await orderModel.find({ branchId: branch.storeCode });
    }
    if (Array.isArray(salesList) && salesList.length > 0) {
      for (let i = 0; i < salesList.length; i++) {
        const element = salesList[i];
        var resobj = {};
        let branch = await branchModel.findOne({
          storeCode: element.branchId,
        });
        resobj.invoiceNo = branch?.storeCode
          ? `${branch.storeCode.substr(3)}${PREFIXES.SALESINV}${
              element.orderId
            }`
          : null;
        resobj.branchCode = element.branchId;
        resobj.branchName = !common_service.isEmpty(branch)
          ? branch.branchName
          : "no branchName";
        resobj.fromDate = common_service
          .prescisedateconvert(element.orderDate)
          .split(" ")[0];
        resobj.Date = element.orderDate;
        paymentExist = await paymentModel.findOne({ purchasePk: element._id });
        resobj.paymentType = !common_service.isEmpty(paymentExist)
          ? paymentExist.paymentMethod
          : [{ type: "No payment" }];
        resobj.orderTotal = element.totalAmount;
        rsList.push(resobj);
      }
    }
    rsList = rsList.sort((a, b) => {
      return a.Date - b.Date;
    });

    if (req.body.invoiceId && req.body.invoiceId.length > 0) {
      rsList = rsList.filter((x) => x.invoiceNo == req.body.invoiceId);
    }
    // if (req.body.branchCode && req.body.branchCode.length > 0) {
    //   rsList = rsList.filter((x) => x.branchCode == req.body.branchCode);
    // }
    if (
      common_service.checkIfNullOrUndefined(req.body.fromDate, req.body.endDate)
    ) {
      rsList.some((item) => {
        if (
          new Date(item.Date).getTime() >=
            new Date(req.body.fromDate).getTime() &&
          new Date(item.Date).getTime() <= new Date(req.body.endDate).getTime()
        ) {
          newList.push(item);
        }
      });
      rsList = newList;
    }
    return { data: rsList, status: STATUSCODES.SUCCESS };
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//Added on 07-07-23
module.exports.viewOrderInvoiceNo = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  try {
    let orderlist = [];
    let rslist = [];
    if (!common_service.isEmpty(req.decode)) {
      orderlist =
        req.decode.role == ROLES.ADMIN
          ? await orderModel.find(
              {},
              { orderId: 1, orderType: 1, orderDate: 1 }
            )
          : await orderModel.find(
              { branchId: req.body.branchId },
              { orderId: 1, orderType: 1, orderDate: 1 }
            );
      if (Array.isArray(orderlist) && orderlist.length > 0) {
        for (let i = 0; i < orderlist.length; i++) {
          const element = orderlist[i];
          var resobj = {};
          resobj._id = element._id;
          resobj.orderId = element.orderId;
          resobj.ORDERID = `${PREFIXES.SALESINV}${element.orderId}`;
          resobj.Date = element.orderDate;
          rslist.push(resobj);
        }
      }
      rslist = rslist.sort((a, b) => {
        return a.Date - b.Date;
      });
      return (res = { data: rslist, status: STATUSCODES.SUCCESS });
    } else {
      res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//Edited on 14-07-23
module.exports.paymentFilter = async (req) => {
  const { paymentModel } = conn.payment(process.env.db);
  const { customerModel } = conn.customer(process.env.db);
  let res = {},
    str = {},
    arr = [];
  try {
    if (Object.keys(req.query).length == 0) {
      return (res = { data: "not acceptable", status: 406 });
    }
    if (req.query.invoiceNo) str.invoiceNo = req.query.invoiceNo;
    if (req.query.customerId) str.cus_id = req.query.customerId;
    str.branchId = process.env.branchId;
    let payment = await paymentModel.find(str);

    if (str && req.query.fromDate && req.query.toDate) {
      let fromDate = new Date(req.query.fromDate).getTime(),
        toDate = new Date(req.query.toDate).getTime();
      for (let i = 0; i < payment.length; i++) {
        let d = payment[i].date;
        if (fromDate <= d && d <= toDate) {
          let t = [];
          for (let j = 0; j < payment[i].paymentMethod.length; j++) {
            t.push(payment[i].paymentMethod[j].type);
          }
          let cus = await customerModel.findOne({ _id: payment[i].cus_id });
          let pay = {
            invoiceId: payment[i].invoiceNo,
            customerId: payment[i].cus_id,
            customerName: !common_service.isEmpty(cus) ? cus.name : "EMPTY",
            paymentType: t,
            paidDate: common_service
              .prescisedateconvert(payment[i].date)
              .split(" ")[0],
            paidAmount: payment[i].totalAmount,
          };
          arr.push(pay);
        }
      }
      if (arr.length > 0)
        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }

    if (str && !req.query.fromDate && req.query.toDate) {
      let toDate = new Date(req.query.toDate).getTime();
      for (let i = 0; i < payment.length; i++) {
        let d = payment[i].date;
        if (d <= toDate) {
          let t = [];
          for (let j = 0; j < payment[i].paymentMethod.length; j++) {
            t.push(payment[i].paymentMethod[j].type);
          }
          let cus = await customerModel.findOne({ _id: payment[i].cus_id });
          let pay = {
            invoiceId: payment[i].invoiceNo,
            customerId: payment[i].cus_id,
            customerName: !common_service.isEmpty(cus) ? cus.name : "EMPTY",
            paymentType: t,
            paidDate: common_service
              .prescisedateconvert(payment[i].date)
              .split(" ")[0],
            paidAmount: payment[i].totalAmount,
          };
          arr.push(pay);
        }
      }
      if (arr.length > 0)
        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }

    if (str && req.query.fromDate && !req.query.toDate) {
      let fromDate = new Date(req.query.fromDate).getTime();

      for (let i = 0; i < payment.length; i++) {
        let d = payment[i].date;
        if (fromDate <= d) {
          let t = [];
          for (let j = 0; j < payment[i].paymentMethod.length; j++) {
            t.push(payment[i].paymentMethod[j].type);
          }
          let cus = await customerModel.findOne({ _id: payment[i].cus_id });
          let pay = {
            invoiceId: payment[i].invoiceNo,
            customerId: payment[i].cus_id,
            customerName: !common_service.isEmpty(cus) ? cus.name : "EMPTY",
            paymentType: t,
            paidDate: common_service
              .prescisedateconvert(payment[i].date)
              .split(" ")[0],
            paidAmount: payment[i].totalAmount,
          };
          arr.push(pay);
        }
      }
      if (arr.length > 0)
        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }

    if (str && !req.query.fromDate && !req.query.toDate) {
      for (let i = 0; i < payment.length; i++) {
        let t = [];
        for (let j = 0; j < payment[i].paymentMethod.length; j++) {
          t.push(payment[i].paymentMethod[j].type);
        }
        let cus = await customerModel.findOne({ _id: payment[i].cus_id });
        let pay = {
          invoiceId: payment[i].invoiceNo,
          customerId: payment[i].cus_id,
          customerName: !common_service.isEmpty(cus) ? cus.name : "EMPTY",
          paymentType: t,
          paidDate: common_service
            .prescisedateconvert(payment[i].date)
            .split(" ")[0],
          paidAmount: payment[i].totalAmount,
        };
        arr.push(pay);
      }
      if (arr.length > 0)
        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }

    if (!str && req.query.fromDate && req.query.toDate) {
      let payment = await paymentModel.find({});
      let fromDate = new Date(req.query.fromDate).getTime(),
        toDate = new Date(req.query.toDate).getTime();
      for (let i = 0; i < payment.length; i++) {
        let d = payment[i].date;
        if (fromDate <= d && d <= toDate) {
          let t = [];
          for (let j = 0; j < payment[i].paymentMethod.length; j++) {
            t.push(payment[i].paymentMethod[j].type);
          }
          let cus = await customerModel.findOne({ _id: payment[i].cus_id });
          let pay = {
            invoiceId: payment[i].invoiceNo,
            customerId: payment[i].cus_id,
            customerName: !common_service.isEmpty(cus) ? cus.name : "EMPTY",
            paymentType: t,
            paidDate: common_service
              .prescisedateconvert(payment[i].date)
              .split(" ")[0],
            paidAmount: payment[i].totalAmount,
          };
          arr.push(pay);
        }
      }
      if (arr.length > 0)
        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }

    if (!str && !req.query.fromDate && req.query.toDate) {
      let payment = await paymentModel.find({});
      let toDate = new Date(req.query.toDate).getTime();
      for (let i = 0; i < payment.length; i++) {
        let d = payment[i].date;
        if (d <= toDate) {
          let t = [];
          for (let j = 0; j < payment[i].paymentMethod.length; j++) {
            t.push(payment[i].paymentMethod[j].type);
          }
          let cus = await customerModel.findOne({ _id: payment[i].cus_id });
          let pay = {
            invoiceId: payment[i].invoiceNo,
            customerId: payment[i].cus_id,
            customerName: !common_service.isEmpty(cus) ? cus.name : "EMPTY",
            paymentType: t,
            paidDate: common_service
              .prescisedateconvert(payment[i].date)
              .split(" ")[0],
            paidAmount: payment[i].totalAmount,
          };
          arr.push(pay);
        }
      }
      if (arr.length > 0)
        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }

    if (!str && req.query.fromDate && !req.query.toDate) {
      let payment = await paymentModel.find({});
      let fromDate = new Date(req.query.fromDate).getTime();
      for (let i = 0; i < payment.length; i++) {
        let d = payment[i].date;
        if (fromDate <= d) {
          let t = [];
          for (let j = 0; j < payment[i].paymentMethod.length; j++) {
            t.push(payment[i].paymentMethod[j].type);
          }
          let cus = await customerModel.findOne({ _id: payment[i].cus_id });
          let pay = {
            invoiceId: payment[i].invoiceNo,
            customerId: payment[i].cus_id,
            customerName: !common_service.isEmpty(cus) ? cus.name : "EMPTY",
            paymentType: t,
            paidDate: common_service
              .prescisedateconvert(payment[i].date)
              .split(" ")[0],
            paidAmount: payment[i].totalAmount,
          };
          arr.push(pay);
        }
      }
      if (arr.length > 0)
        return (res = { data: arr, status: STATUSCODES.SUCCESS });
      else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 16-05-2022
module.exports.getPaymentInvoices = async (req) => {
  const { paymentModel } = conn.payment(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let paymentList = [];
    let rslist = [];
    if (req.body.branchId) {
      paymentList = await paymentModel.find({ branchId: req.body.branchId });
    } else {
      paymentList = await paymentModel.find({});
    }
    for (let i = 0; i < paymentList.length; i++) {
      const element = paymentList[i];
      let branchExist = await branchModel.findOne({
        storecode: element.branchId,
      });
      rslist.push({
        invoiceNo: common_service.checkObject(branchExist)
          ? branchExist.storecode.substr(3) + element.invoiceNo
          : element.invoiceNo,
        purchasePk: element.purchasePk,
      });
    }
    return (res = { data: rslist, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 16-05-2022
//Edited on 14-07-22
module.exports.getReturnInvoices = async (req) => {
  const { orderreturnModel } = conn.order(req.decode.db);
  let arr = [];
  try {
    let data = await orderreturnModel.find(
      { branchId: req.body.branchId }
      // { transNo: 1 }
    );
    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        let dat = {
          prefix: PREFIXES.SALESRETURN + data[i].branchId.slice(0, 2),
          invoiceNo: data[i].transNo,
        };
        arr.push(dat);
      }
      return (res = { data: arr, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: [], status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 18-05-22
module.exports.addMessPackage = async (req) => {
  const { messPackageModel } = conn.order(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let messPackageExist = await messPackageModel.findOne({
      type: req.body.type,
      branchId: req.body.branchId,
    });
    if (messPackageExist) {
      return (res = { data: messPackageExist, status: STATUSCODES.EXIST });
    } else {
      let newMessPackage = new messPackageModel({
        type: req.body.type,
        package: req.body.package,
        branchId: req.body.branchId,
      });
      let data = await newMessPackage.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.MESS_PACKAGE_ADD.type,
          description: LOG.MESS_PACKAGE_ADD.description,
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
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 18-05-22
module.exports.viewMessPackage = async (req) => {
  const { messPackageModel } = conn.order(req.decode.db);
  try {
    let res = {};

    if (req.decode.role == ROLES.USER) {
      var messPackageList = await messPackageModel.find({
        branchId: req.body.branchId,
      });
    } else {
      if (req.body.branchId) {
        var messPackageList = await messPackageModel.find({
          branchId: req.body.branchId,
        });
      } else {
        var messPackageList = await messPackageModel.find({});
      }
    }

    if (Array.isArray(messPackageList) && messPackageList.length > 0) {
      for (let i = 0; i < messPackageList.length; i++) {
        const element = messPackageList[i].package;
        let totalAmount = 0;
        if (Array.isArray(element)) {
          for (let j = 0; j < element.length; j++) {
            const packs = element[j];
            totalAmount = totalAmount + packs.monthly;
          }
        }
        messPackageList[i]._doc["totalAmount"] = totalAmount;
      }
      res = { data: messPackageList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 18-05-22
module.exports.viewMessPackageSingle = async (req) => {
  const { messPackageModel } = conn.order(req.decode.db);
  try {
    let res = {};
    let messExist = await messPackageModel.findOne({
      _id: req.body._id,
    });
    if (messExist) {
      let totalAmount = 0;
      if (Array.isArray(messExist)) {
        for (let i = 0; i < messExist.package.length; i++) {
          const packs = messExist.package[i];
          totalAmount = totalAmount + packs.monthly;
        }
      }
      messExist._doc["totalAmount"] = totalAmount;
      res = { data: messExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 18-05-22
module.exports.editMessPackage = async (req) => {
  const { messPackageModel } = conn.order(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let messExist = await messPackageModel.findOne({
      _id: req.body._id,
    });
    if (messExist) {
      messExist.package = req.body.package;
      let data = await messExist.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.MESS_PACKAGE_EDIT.type,
          description: LOG.MESS_PACKAGE_EDIT.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        res = { data: messExist, status: STATUSCODES.SUCCESS };
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

//added on 19-05-22
//edited on 17-06-22
module.exports.generateMessId = async (req) => {
  const { messModel } = conn.order(process.env.db);
  try {
    let res = {};
    let TRANSNO = 0;
    let messList = await messModel.find({
      branchId: process.env.branchId,
    });
    // let messList = await messModel.aggregate([
    //   {
    //     $sort: { transNo: -1 },
    //   },
    // ]);
    if (messList.length > 0) {
      TRANSNO = messList[messList.length - 1].transNo + 1;
    } else {
      TRANSNO = 1;
    }
    return (res = {
      data: { transNo: TRANSNO, prefix: "MESS" },
      status: STATUSCODES.SUCCESS,
    });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 19-05-22
module.exports.viewMess = async (req) => {
  const { messModel } = conn.order(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let res = {};
    if (req.decode.role == ROLES.USER) {
      var messList = await messModel.find({
        branchId: req.body.branchId,
      });
    } else {
      if (req.body.branchId) {
        var messList = await messModel.find({ branchId: req.body.branchId });
      } else {
        var messList = await messModel.find({});
      }
    }
    if (Array.isArray(messList) && messList.length > 0) {
      for (let i = 0; i < messList.length; i++) {
        const element = messList[i];
        element._doc["transNo"] = `MESS${element.transNo}`;
        element._doc["date"] = common_service
          .prescisedateconvert(element.date)
          .split(" ")[0];
        // let customer = await customerService.getSingleCustomer(
        //   element.customer
        // );
        let customer = await customerModel.find({});
        element._doc["customerName"] = !common_service.isEmpty(customer)
          ? customer.name
          : "EMPTY";
        // element._doc["storeName"] = await returnStoreName(element.branchId); //added on 08-08-22 -> added branchname reference here
        let branchExist = await branchModel.findOne({
          branchId: element.branchId,
        });
        element._doc["storeName"] = branchExist
          ? branchExist.storeName
          : "No storeName";
      }
      res = { data: messList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 19-05-22
module.exports.viewMessSingle = async (req) => {
  const { messModel } = conn.order(req.decode.db);
  try {
    let res = {};
    let messSingle = await messModel.findOne({
      _id: req.body._id,
    });
    if (!common_service.isEmpty(messSingle)) {
      messSingle._doc["transNo"] = `MESS${messSingle.transNo}`;
      messSingle._doc["date"] = common_service
        .prescisedateconvert(messSingle.date)
        .split(" ")[0];
      res = { data: messSingle, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 23-05-22
module.exports.vieworderSingle = async (req) => {
  const { orderModel } = conn.order(process.env.db);
  try {
    let res = {};
    let orderSingle = await orderModel.findOne({
      _id: req,
    });
    if (common_service.prescisedateconvert(orderSingle)) {
      orderSingle._doc["orderDate"] = common_service
        .prescisedateconvert(orderSingle.orderDate)
        .split(" ")[0];
      res = { data: orderSingle, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 23-05-22
module.exports.editMess = async (req) => {
  const { messModel } = conn.order(process.env.db);
  let db = process.env.db;
  try {
    let res = {};
    let messExist = await messModel.findOne({
      _id: req.body._id,
    });
    if (messExist) {
      let cur_date = new Date(Date.now()).getTime();
      let difference = cur_date - messExist.date;
      let diffDays = Math.ceil(difference / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        (messExist.packageDetails = req.body.packageDetails
          ? req.body.packageDetails
          : messExist.packageDetails), //edited on 23-05-22 -> incorrect field name corrected :packageAmount -> packageDetails
          (messExist.type = req.body.type ? req.body.type : messExist.type),
          (messExist.paidAmount = req.body.paidAmount
            ? req.body.paidAmount
            : messExist.paidAmount),
          (messExist.balanceAmount = req.body.balanceAmount
            ? req.body.balanceAmount
            : messExist.balanceAmount);
        let data = await messExist.save();
        if (data) {
          data._doc["date"] = common_service
            .prescisedateconvert(data.date)
            .split(" ")[0];
          let lg = {
            type: LOG.ORD_EDITMESS,
            emp_id: req.decode ? req.decode._id : null, //changed on 15-06-22 -> line changed to avoid errors when _id is missing,
            description: "edit a mess package",
            link: {
              url: null,
              api: null,
            },
          };
          await settings_service.addLog(lg, db);
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = {
          data: {
            message: "Package Not Expired",
          },
          status: STATUSCODES.UNPROCESSED,
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

//added on 10-06-22
module.exports.findOrderReturn = async (req) => {
  const { customerModel } = conn.customer(process.env.db);
  const { orderModel } = conn.order(process.env.db);
  try {
    let res = {};
    let findOrder = [];
    if (req.body.mobileNo) {
      let cus_exist = await customerModel.findOne({
        mobileNo: req.body.mobileNo,
      });
      if (cus_exist) {
        findOrder = await orderModel.find({
          cus_id: cus_exist._id,
        });
      }
    }
    if (req.body.cus_id) {
      findOrder = await orderModel.find({ cus_id: req.body.cus_id });
    }
    if (Array.isArray(findOrder) && findOrder.length > 0) {
      for (let i = 0; i < findOrder.length; i++) {
        const element = findOrder[i];
        let tableInfo = await seatingService.viewSeatingById(
          element.tableNumber
        );
        element._doc["table"] = tableInfo.data.tableNumber;
        element._doc["orderDate"] = common_service.prescisedateconvert(
          element.orderDate
        );
        element._doc["Amount"] = 0;
        for (let j = 0; j < element.items.length; j++) {
          //edited on 21-04-22 -> item -> items
          const itemData = element.items[j]; //edited on 21-04-22 -> item -> items
          let cat_info = await categoryService.viewCategoryById(
            itemData.category
          );
          let food_info = await foodService.viewFoodItemsSingle(itemData.item);
          (itemData.categoryName =
            cat_info.status == STATUSCODES.SUCCESS
              ? cat_info.data.categoryName
              : null),
            (itemData.itemName =
              food_info.status == STATUSCODES.SUCCESS
                ? food_info.data.prod_name
                : null);
          element._doc["Amount"] = element._doc["Amount"] + itemData.unitPrice;
        }
        let customer = await customerService.getSingleCustomer({
          params: { id: element.cus_id },
        });
        element._doc["CustomerName"] =
          customer.status == STATUSCODES.SUCCESS ? customer.data.name : null;
      }
      res = { data: findOrder, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 10-06-22
module.exports.billView = async (req) => {
  const { orderModel } = conn.order(process.env.db);
  try {
    let res = {};
    let orderView = await orderModel.findOne({
      _id: req,
    });
    if (!common_service.isEmpty(orderView)) {
      let resobj = {};
      resobj.orderId = `ORD${orderView.orderId}`;
      resobj.orderDate = common_service
        .prescisedateconvert(orderView.orderDate)
        .split(" ")[0];
      let customer = await customerService.getSingleCustomer({
        params: { id: orderView.cus_id },
      });
      if (!common_service.isEmpty(customer)) {
        resobj.billingAddress = `${customer.data.buildingName},${customer.data.streetName},${customer.data.landMark}`;
        resobj.shippingAddress = resobj.billingAddress;
      } else {
        resobj.billingAddress = null;
        resobj.shippingAddress = null;
      }
      // let foodItem = await foodService.viewFoodItemsSingle()
      if (Array.isArray(orderView.items) && orderView.items.length > 0) {
        let productInfo = [];
        for (let i = 0; i < orderView.items.length; i++) {
          const element = orderView.items[i];
          let foodItem = await foodService.viewFoodItemsSingle(element.item);
          let productelements = {};
          if (foodItem.status == STATUSCODES.SUCCESS) {
            productelements.productName = foodItem.data.prod_name;
            productelements.description = foodItem.data.description;
            productelements.quantity = element.quantity;
            let dimension = foodItem.data.dimensions.find(
              (x) => x.size == element.dimension
            );
            if (!common_service.isEmpty(dimension)) {
              productelements.grossAmount = dimension.price;
              productelements.taxableavalue = dimension.mrp;
              productelements.total =
                productelements.taxableavalue * productelements.quantity;
            }
            if (element.offer) {
              resobj.discount = element.offer.value[0];
            } else {
              productelements.discount = 0;
            }
            productInfo.push(productelements);
          }
          resobj.customerNotes = element.note ? element.note : null;
        }
        resobj.products = productInfo;
      }
      res = { data: resobj, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 09-07-22
module.exports.viewCreditOfCustomer = async (req) => {
  const { creditModel } = conn.payment(process.env.db);
  const { orderModel } = conn.order(process.env.db);
  try {
    let res = {};
    let rslist = [];
    let creditDetails = await creditModel.find({ cus_id: req.body.cus_id });
    if (Array.isArray(creditDetails) && creditDetails.length > 0) {
      for (let i = 0; i < creditDetails.length; i++) {
        const element = creditDetails[i];
        let resobj = {};
        let orderExist = await orderModel.findOne({ _id: element.order_id });
        resobj.creditID = element ? element._id : null;
        resobj.order_id = orderExist ? orderExist._id : null;
        resobj.orderNo = orderExist ? `ORD` + orderExist.orderId : null;
        resobj.orderDate = orderExist
          ? common_service
              .prescisedateconvert(orderExist.orderDate)
              .split(" ")[0]
          : null;
        resobj.netAmount = orderExist ? orderExist.totalAmount : 0;
        resobj.paidAmount = element ? element.paidAmount : 0;
        resobj.lastPaidDate = element
          ? common_service
              .prescisedateconvert(element.lastPaidDate)
              .split(" ")[0]
          : null;
        resobj.balance = element ? element.balance : 0;
        rslist.push(resobj);
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

//added on 11-07-22
module.exports.viewSalesReturnSingle = async (req) => {
  const { orderreturnModel } = conn.order(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { paymentModel, creditModel } = conn.payment(req.decode.db);
  try {
    let res = {};
    let sale = await orderreturnModel.findOne({
      _id: req.body._id,
    });

    if (common_service.checkObject(sale)) {
      let resobj = {
        orderId: "no invoice",
        transNo: "no transNo",
        date: "nan",
        paidAmount: 0,
        balance: 0,
        returnInfo: [],
        returnType: 0,
        customerName: "no name",
        returnDetails: [],
      };
      if (common_service.isObjectId(sale.customerId)) {
        let cusExist = await customerModel.findOne({ _id: sale.customerId });
        if (common_service.checkObject(cusExist)) {
          resobj.customerName = cusExist.name;
        }
      }
      resobj.orderId = sale.invoiceNo;
      resobj.transNo =
        PREFIXES.SALESRETURN + sale.branchId.substr(3) + sale.transNo;
      resobj.date = common_service
        .prescisedateconvert(sale.returnDate)
        .split(" ")[0];
      let payment = await paymentModel.findOne({ purchasePk: sale.purchasePk });
      if (common_service.checkObject(payment)) {
        if (Array.isArray(payment.paymentMethod)) {
          payment.paymentMethod.map((x) => {
            resobj.paidAmount = resobj.paidAmount + x.paidAmount;
          });
        }
      }
      let credit = await creditModel.findOne({ purchasePk: sale.purchasePk });
      if (common_service.checkObject(credit)) {
        resobj.balance = credit.balance;
      }
      resobj.returnType = sale.returnType;
      if (sale.returnInfo.length > 0) {
        sale.returnInfo.map((x) => {
          resobj.returnInfo.push({
            productName: x.itemName,
            returnQty: x.returnQty,
            rate: x.rate,
            amount: x.amount,
            type:
              x.returnType == 2
                ? "stock"
                : x.returnType == 0
                ? "old stock"
                : "damaged goods",
          });
        });
      }
      resobj.returnDetails = sale.returnInfo;
      res = { data: resobj, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: { msg: "no return exist" }, status: STATUSCODES.NOTFOUND };
    }

    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 11-07-22
module.exports.viewOrderById = async (req) => {
  const { orderModel } = conn.order(process.env.db);
  const { foodModel } = conn.food(process.env.db);
  try {
    let res = {};
    let orderExist = await orderModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(orderExist)) {
      let resobj = {};
      resobj.orderId = `ORD${orderExist.orderId}`;
      resobj.orderDate = common_service
        .prescisedateconvert(orderExist.orderDate)
        .split(" ")[0];
      if (orderExist.orderType == ORDERTYPES.DEL) {
        let customerExist = await customerService.getSingleCustomer(
          orderExist.cus_id
        );
        resobj.billingAddress = resobj.shippingAddress =
          !common_service.isEmpty(customerExist.data)
            ? `${
                customerExist.data.buildingName
                  ? customerExist.data.buildingName
                  : "------"
              },${
                customerExist.data.streetName
                  ? customerExist.data.streetName
                  : "------"
              },${
                customerExist.data.landMark
                  ? customerExist.data.landMark
                  : "------"
              }`
            : null;
      } else {
        resobj.billingAddress = resobj.shippingAddress = null;
      }
      resobj.shiftId = orderExist.shiftId
        ? `SHIFT${orderExist.shiftId}`
        : "none";
      resobj.itemArr = [];
      resobj.grandTotal = 0;
      resobj.sgstTotal = 0;
      resobj.cgstTotal = 0;
      resobj.discountTotal = 0;
      resobj.roundOffTotal = 0;
      resobj.shippingCharge = 0;
      for (let i = 0; i < orderExist.items.length; i++) {
        let itemObj = {};
        const element = orderExist.items[i];
        let productExist = await foodModel.findOne({ _id: element.item });
        itemObj.itemName = !common_service.isEmpty(productExist)
          ? productExist.prod_name
          : null;
        let dimensionfind = productExist?.dimensions.find(
          (x) => x.size == element.dimension
        );
        itemObj.quantity = element.quantity;
        itemObj.grossAmount = !common_service.isEmpty(dimensionfind)
          ? dimensionfind.mrp
          : 0;
        if (itemObj.grossAmount < 1000) {
          itemObj.taxableavalue =
            itemObj.grossAmount -
            Math.round(itemObj.grossAmount * (process.env.MIN_PERCENT / 100));
        } else {
          // itemObj.taxableavalue =
          //   itemObj.grossAmount * (process.env.MAX_PERCENT / 100);
          itemObj.taxableavalue =
            itemObj.grossAmount -
            Math.round(itemObj.grossAmount * (process.env.MAX_PERCENT / 100));
        }
        itemObj.total = itemObj.grossAmount;
        resobj.totalNoOfProd = orderExist.items.length;
        resobj.grandTotal = resobj.grandTotal + itemObj.total;
        if (element.orderType == ORDERSTATUS.DIN) {
          var value =
            Math.round(itemObj.grossAmount - itemObj.taxableavalue) / 2;

          resobj.cgstTotal = resobj.cgstTotal + value;
          resobj.sgstTotal = resobj.sgstTotal + value;
        }
        resobj.itemArr.push(itemObj);
      }
      res = { data: resobj, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 13-07-22
module.exports.clearCredit = async (req) => {
  const { creditModel } = conn.payment(process.env.db);
  try {
    let res = {};
    let orderExist = await creditModel.findOne({ order_id: req.orderId });
    if (!common_service.isEmpty(orderExist)) {
      orderExist.balance = req.balance == orderExist.balance ? 0 : req.balance;
      orderExist.lastPaidDate = new Date(Date.now()).getTime();
      orderExist.paidAmount = orderExist.paidAmount + req.balance;
      let data = await orderExist.save();
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

//added on 14-07-22
module.exports.addholdOrder = async (req) => {
  const { holdOrderModel } = conn.order(req.decode.db);
  try {
    let res = {};
    let orderExist = await holdOrderModel.findOne({
      orderId: req.body.orderId,
    });

    if (!common_service.isEmpty(orderExist)) {
      res = { data: orderExist, status: STATUSCODES.FORBIDDEN };
    } else {
      if (!common_service.isEmpty(req.body)) {
        let newHoldOrder = new holdOrderModel({
          orderId: req.body.orderId,
          cus_id: req.body.cus_id,
          order: req.body.order,
          branchId: req.body.branchId,
        });
        let data = await newHoldOrder.save();
        if (data) {
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = {
            data: { msg: "save to db failed" },
            status: STATUSCODES.UNPROCESSED,
          };
        }
      } else {
        res = {
          data: { msg: "Invalid Payload" },
          status: STATUSCODES.BADREQUEST,
        };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 14-07-22
module.exports.viewCustomerOrder = async (req) => {
  const { orderModel } = conn.order(process.env.db);
  try {
    let res = {};
    let orderExist = await orderModel.find({ cus_id: req });
    if (Array.isArray(orderExist) && orderExist.length > 0) {
      res = { data: orderExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 16-07-22
module.exports.viewHeldOrder = async (req) => {
  const { holdOrderModel } = conn.order(req.decode.db);
  try {
    let res = {};
    let holderOrderList = await holdOrderModel.find({
      branchId: req.body.branchId,
    });
    if (Array.isArray(holderOrderList) && holderOrderList.length > 0) {
      for (let i = 0; i < holderOrderList.length; i++) {
        const element = holderOrderList[i];
        element._doc["orderId"] = `ORD${element.orderId}`;
        let customer = await customerService.getSingleCustomer(element.cus_id);
        element._doc["customerName"] = !common_service.isEmpty(customer)
          ? customer.data.name
          : null;
      }
      res = { data: holderOrderList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 16-07-22
module.exports.deleteHeldOrder = async (req) => {
  const { holdOrderModel } = conn.order(process.env.db);
  try {
    let res = {};
    let heldOrder = await holdOrderModel.findOne({
      orderId: req,
    });
    if (!common_service.isEmpty(heldOrder)) {
      let data = await holdOrderModel.deleteOne({ orderId: req });
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 18-07-22
module.exports.printInvoice = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const adminModel = conn.auth(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { employeeModel } = conn.employee(req.decode.db);
  try {
    let res = {};
    let input = !common_service.isEmpty(req.body) ? req.body : req;
    let orderExist = await orderModel.findOne({
      _id: input._id,
    });
    if (!common_service.isEmpty(orderExist)) {
      let resobj = {};
      let adminExist = await adminModel.findOne({
        _id: req.decode.admin,
      });
      if (!common_service.isEmpty(adminExist)) {
        resobj.companyName = adminExist.profile.companyName;
        resobj.website = adminExist.profile.website;
        resobj.tax =
          req.decode.country == "india"
            ? adminExist.gst.gstNumber
            : adminExist.gst.vat;
        resobj.customerCare = adminExist.profile.contactNumber;
        resobj.address = adminExist.profile.companyAddress;
        resobj.logo = process.env.FILEURL + adminExist.profile?.logo; //added on 04-08-22 -> added admin logo/company logo to this response
        resobj.dateandtime = common_service.prescisedateconvert(
          orderExist.orderDate
        );
        resobj.terms = adminExist.terms; //added on 05-08-22 -> missing data from admin added
        resobj.taxno = adminExist.gst.gstNumber; //added on 05-08-22 -> missing data from admin added
        resobj.staffId = orderExist.emp_id ? orderExist.emp_id : req.decode._id;
        // let employee = await employeeService.viewSingleEmployee(resobj.staffId);
        let employee = await employeeModel.findOne({ _id: resobj.staffId });
        resobj.empName = !common_service.isEmpty(employee)
          ? employee.staff_name
          : "No employee"; //added on 05-08-22-> non employee name case fixed
        resobj.empId = !common_service.isEmpty(employee)
          ? `EMP${employee.emp_id}`
          : "No employee id"; //added on 05-08-22 -> non employee case fixed
        resobj.billNo = `BILL-ORD` + orderExist.orderId;
        resobj.items = await Promise.all(
          orderExist.items.map(async (x) => {
            let foodItem = await foodModel.findOne(
              { _id: x.item },
              { prod_name: 1 }
            );
            x.itemName = !common_service.isEmpty(foodItem)
              ? foodItem.prod_name
              : null;
            return x;
          })
        );
        /*//added on 05-08-22 */
        resobj.subtotal = 0;
        resobj.delivery = 0;
        if (Array.isArray(orderExist.items) && orderExist.items.length > 0) {
          for (let i = 0; i < orderExist.items.length; i++) {
            const element = orderExist.items[i];
            resobj.delivery =
              orderExist.orderType == ORDERTYPES.DEL
                ? resobj.delivery + orderExist.shipmentCharge
                : resobj.delivery + 0;
            if (element.unitPrice < 1000) {
              resobj.subtotal =
                element.unitPrice -
                Math.round(element.unitPrice * (process.env.MIN_PERCENT / 100));
              resobj.tax = process.env.MIN_PERCENT; //to be changed later
            } else {
              // resobj.subtotal =
              //   element.unitPrice * (process.env.MAX_PERCENT / 100);
              resobj.subtotal =
                element.unitPrice -
                Math.round(element.unitPrice * (process.env.MAX_PERCENT / 100));
              resobj.tax = process.env.MAX_PERCENT; //added on 05-08-22 //to be changed later
            }
          }
        }
        /*ends here*/ // resobj.subtotal = orderExist.totalAmount;
        resobj.grandTotal = orderExist.totalAmount;
        resobj.barcode = process.env.FILEURL + orderExist?.barcode; //added on 04-08-22-> field barcode of order to response
        resobj.qrcode = process.env.FILEURL + orderExist?.qrcode; //added on 04-08-22-> field qrcode of order to response
        res = { data: resobj, status: STATUSCODES.SUCCESS };
      } else {
        res = {
          data: { message: "INVALID ADMIN TOKEN - RELOGIN REQUIRED" },
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
// module.exports.dailyCashCardReport = async (req) => {
//   let { orderModel } = conn.order(process.env.db);
//   let { creditModel } = conn.payment(process.env.db);
//   const { branchModel } = conn.location(process.env.db);
//   const { cardModel } = conn.settings(process.env.db);
//   try {
//     let res = {};
//     let responseObj = {};
//     let shiftDetails = await settings_service.viewShiftByShiftId(
//       req.body.shiftNumber
//     );
//     if (req.body.brId) {
//       var branchDetails = await branchModel.findOne(
//         {
//           _id: req.body._id,
//         },
//         { branchName: 1 }
//       );
//     } else {
//       var branchDetails = await branchModel.findOne(
//         {
//           storecode: process.env.branchId,
//         },
//         { branchName: 1 }
//       );
//     }
//     responseObj.cashinhand = 0;
//     responseObj.salewexp = 0;
//     responseObj.sessionTotal = {
//       sessionAmntTotal: 0,
//       sessionCommissionTotal: 0,
//       sessionBalanceTotal: 0,
//     };
//     let cardOrderList = await orderModel.find({ "paymentMethod.type": "Card" });
//     let cashOrderList = await orderModel.find({ "paymentMethod.type": "Cash" });
//     let upiOrderList = await orderModel.find({ "paymentMethod.type": "Upi" });
//     responseObj.shiftOpenTime = !common_service.isEmpty(shiftDetails.data)
//       ? common_service.prescisedateconvert(shiftDetails.data.startDate)
//       : null;
//     responseObj.shiftClosingTime = !common_service.isEmpty(shiftDetails.data)
//       ? common_service.prescisedateconvert(shiftDetails.data.endDate)
//       : null;
//     responseObj.shiftNumber = !common_service.isEmpty(shiftDetails.data)
//       ? shiftDetails.data.shiftId
//       : null;
//     responseObj.branchName = !common_service.isEmpty(branchDetails)
//       ? branchDetails.branchName
//       : "no name for branch";
//     responseObj.orderList = [];

//     if (Array.isArray(cashOrderList) && cashOrderList.length > 0) {
//       let ordTotal = 0;
//       let commissionTotal = 0;
//       let balanceTotal = 0;
//       let ordObjList = [];
//       let ordObj = {};
//       cashOrderList.map((x) => {
//         ordObj = {
//           type: x.paymentMethod.type,
//         };
//         ordObjList.push({
//           id: `ORD` + x.orderId, //edited on 24-07-22 -> edited field passing from here
//           price: x.totalAmount,
//           commission: 0,
//           balance: x.totalAmount - 0,
//         });
//         ordObj.orders = ordObjList;
//         ordTotal = ordTotal + x.totalAmount;
//         commissionTotal = commissionTotal + 0;
//         balanceTotal = balanceTotal + Math.round(x.totalAmount - 0);
//       });
//       ordObj.totalOrders = ordTotal;
//       ordObj.totalCommission = commissionTotal;
//       ordObj.totalBalance = balanceTotal;
//       responseObj.sessionTotal.sessionAmntTotal =
//         responseObj.sessionTotal.sessionAmntTotal + ordTotal;
//       responseObj.sessionTotal.sessionCommissionTotal =
//         responseObj.sessionTotal.sessionCommissionTotal + commissionTotal;
//       responseObj.sessionTotal.sessionBalanceTotal =
//         responseObj.sessionTotal.sessionBalanceTotal + balanceTotal;
//       responseObj.orderList.push(ordObj);
//     }
//     if (Array.isArray(cardOrderList) && cardOrderList.length > 0) {
//       let ordTotal = 0;
//       let commissionTotal = 0;
//       let balanceTotal = 0;
//       let ordObjList = [];
//       let ordObj = {};
//       let cardComm = await settings_service.viewCardCommission();

//       cardOrderList.map((x) => {
//         ordObj = {
//           type: x.paymentMethod.provider,
//         };
//         let cardObj = cardComm.data.find(
//           (y) => y.cardName == x.paymentMethod.provider.toLowerCase()
//         );
//         ordObjList.push({
//           id: `ORD` + x.orderId, //edited on 24-07-22 -> edited field passing from here
//           price: x.totalAmount,
//           commission: Math.round(x.totalAmount * (cardObj.commission / 100)),
//           balance:
//             x.totalAmount -
//             Math.round(x.totalAmount * (cardObj.commission / 100)),
//         });
//         ordObj.orders = ordObjList;
//         ordTotal = ordTotal + x.totalAmount;
//         commissionTotal =
//           commissionTotal +
//           Math.round(x.totalAmount * (cardObj.commission / 100));
//         balanceTotal =
//           ordTotal - Math.round(x.totalAmount * (cardObj.commission / 100));
//       });
//       ordObj.totalOrders = ordTotal;
//       ordObj.totalCommission = commissionTotal;
//       ordObj.totalBalance = ordTotal - commissionTotal;
//       responseObj.sessionTotal.sessionAmntTotal =
//         responseObj.sessionTotal.sessionAmntTotal + ordTotal;
//       responseObj.sessionTotal.sessionCommissionTotal =
//         responseObj.sessionTotal.sessionCommissionTotal + commissionTotal;
//       responseObj.sessionTotal.sessionBalanceTotal =
//         responseObj.sessionTotal.sessionBalanceTotal + balanceTotal;
//       responseObj.orderList.push(ordObj);
//     }
//     if (Array.isArray(upiOrderList) && upiOrderList.length > 0) {
//       let ordTotal = 0;
//       let commissionTotal = 0;
//       let balanceTotal = 0;
//       let ordObjList = [];
//       let ordObj = {};
//       upiOrderList.map((x) => {
//         ordObj = {
//           type: x.paymentMethod.type,
//         };
//         ordObjList.push({
//           id: `ORD` + x.orderId, //edited on 24-07-22 -> edited field passing from here
//           price: x.totalAmount,
//           commission: 0,
//           balance: x.totalAmount - 0,
//         });
//         ordObj.orders = ordObjList;
//         ordTotal = ordTotal + x.totalAmount;
//         commissionTotal = commissionTotal + 0;
//         balanceTotal = balanceTotal + Math.round(x.totalAmount - 0);
//       });
//       ordObj.totalOrders = ordTotal;
//       ordObj.totalCommission = commissionTotal;
//       ordObj.totalBalance = balanceTotal;
//       responseObj.sessionTotal.sessionAmntTotal =
//         responseObj.sessionTotal.sessionAmntTotal + ordTotal;
//       responseObj.sessionTotal.sessionCommissionTotal =
//         responseObj.sessionTotal.sessionCommissionTotal + commissionTotal;
//       responseObj.sessionTotal.sessionBalanceTotal =
//         responseObj.sessionTotal.sessionAmntTotal -
//         responseObj.sessionTotal.sessionCommissionTotal;
//       responseObj.orderList.push(ordObj);
//     }
//     let expenseList = await expenseService.getAllActiveOutletExpense();
//     responseObj.expenseList =
//       expenseList.data.length > 0 ? expenseList.data : [];
//     responseObj.salewexp = responseObj.sessionTotal.sessionAmntTotal;
//     return (res = { data: responseObj, status: STATUSCODES.SUCCESS });
//   } catch (e) {
//     console.error(e);
//     return (res = { data: { message: e }, status: STATUSCODES.ERROR });
//   }
// };

//added on 03-08-22
module.exports.addQrcode = async (req) => {
  try {
    let data = {
      prodId: req,
    };
    let strData = JSON.stringify(data);
    let image = await qr.toFile(
      `./public/Images/Order/Qrcode/${process.env.branchId}-ORD${req}.png`,
      strData
    );
    return (res = `Images/Order/Qrcode/${process.env.branchId}-ORD${req}.png`);
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 03-08-22
module.exports.addBarcode = async (req) => {
  try {
    let res = {};
    let barcodeImg = barcode("code128", {
      data: req,
      width: 100,
      height: 100,
    });
    barcodeImg.saveImage(
      process.env.LOCALSTORAGEBASE +
        `/Images/Order/Barcode/${process.env.branchId}-ORD${req}.png`,
      function (err) {
        if (err) throw err;
      }
    );
    return (res = `Images/Order/Barcode/${process.env.branchId}-ORD${req}.png`);
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 03-08-22
module.exports.addQrcode = async (req) => {
  try {
    let data = {
      prodId: req,
    };
    let strData = JSON.stringify(data);
    let image = await qr.toFile(
      `./public/Images/Order/Qrcode/${process.env.branchId}-ORD${req}.png`,
      strData
    );
    return (res = `Images/Order/Qrcode/${process.env.branchId}-ORD${req}.png`);
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 03-08-22
module.exports.addBarcode = async (req) => {
  try {
    let res = {};
    let barcodeImg = barcode("code128", {
      data: req,
      width: 100,
      height: 100,
    });
    barcodeImg.saveImage(
      process.env.LOCALSTORAGEBASE +
        `/Images/Order/Barcode/${process.env.branchId}-ORD${req}.png`,
      function (err) {
        if (err) throw err;
      }
    );
    return (res = `Images/Order/Barcode/${process.env.branchId}-ORD${req}.png`);
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 27-06-23
module.exports.billOrder = async (req) => {
  const { orderModel, holdOrderModel } = conn.order(req.decode.db);
  const { rewardModel, pointModel } = conn.reward(req.decode.db);
  const { creditModel, paymentModel, walletModel, walletLogModel } =
    conn.payment(req.decode.db);
  const { stockModel, stockLogModel } = conn.stock(req.decode.db);
  const { shiftLogModel, logModel, shiftModel } = conn.settings(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
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
    if (Array.isArray(req.body.orderInfo)) {
      for (let i = 0; i < req.body.orderInfo.length; i++) {
        req.body.orderInfo[i].uuid = common_service.generateUuid();
      }
    } else {
      return (res = {
        data: "invalid payload",
        status: STATUSCODES.BADREQUEST,
      });
    }
    let neworder = new orderModel({});
    neworder.orderType = req.body.orderType;
    neworder.orderDate = new Date(req.body.orderDate).getTime();
    neworder.totalAmount = req.body.totalAmount;
    neworder.discount = req.body.discount;
    neworder.shipmentCharge = req.body.shipmentCharge;
    neworder.branchId = req.body.branchId;
    neworder.cus_id = req.body.cus_id;
    neworder.emp_id = req.body.emp_id;
    neworder.usedPoints = req.body.usedPoints;
    neworder.shiftId = shiftExist.shiftId;
    neworder.usedWallet = req.body.usedWallet;
    neworder.returnStatus = null;
    neworder.orderInfo = req.body.orderInfo;
    neworder.payableAmount = req.body.payableAmount;
    neworder.tableNumber = req.body.tableNumber;
    let orderList = await orderModel.find({ branchId: req.body.branchId });
    if (orderList.length > 0) {
      neworder.orderId = orderList[orderList.length - 1].orderId + 1;
    } else {
      neworder.orderId = 1;
    }
    let data = await neworder.save();
    if (common_service.checkObject(data)) {
      let paidAmount = 0;
      if (Array.isArray(req.body.paymentMethod)) {
        req.body.paymentMethod.map((x) => {
          paidAmount = paidAmount + x.paidAmount;
          x.uuid = common_service.generateUuid();
          x.shiftId = shiftExist.shiftId;
        });
      }

      if (
        Array.isArray(req.body.creditCleared) &&
        req.body.creditCleared.length > 0
      ) {
        await Promise.all(
          req.body.creditCleared.map((x) => {
            paidAmount = paidAmount - x.balance;
            req.body.paymentMethod[0].paidAmount =
              req.body.paymentMethod[0].paidAmount - x.balance;
          })
        );
        for (let j = 0; j < req.body.creditCleared.length; j++) {
          const element = req.body.creditCleared[j];
          let creditExist = await creditModel.findOne({
            purchasePk: element.order_id,
          });
          if (common_service.checkObject(creditExist)) {
            if (creditExist.balance > 0) {
              creditExist.balance = creditExist.balance - element.balance;
              creditExist.paidAmount = creditExist.paidAmount + element.balance;
              if (creditExist.balance == 0) {
                creditExist.status = CREDITSTATUS.COM;
              }
              let creditDataResponse = await creditModel.findOneAndUpdate(
                { _id: creditExist._id },
                { $set: creditExist },
                { new: true }
              );
              if (!common_service.checkObject(creditDataResponse)) {
                return (res = {
                  data: {
                    msg: `cannot update credit for ${creditExist.purchaseId}`,
                  },
                  status: STATUSCODES.UNPROCESSED,
                });
              } else {
                let paymentExist = await paymentModel.findOne({
                  purchasePk: element.order_id,
                });
                if (common_service.checkObject(paymentExist)) {
                  if (
                    Array.isArray(paymentExist.paymentMethod) &&
                    paymentExist.paymentMethod.length > 0
                  ) {
                    let payobj = {
                      type: req.body.paymentMethod[0].type,
                      account: req.body.paymentMethod[0].account,
                      date: req.body.paymentMethod[0].date,
                      paidAmount: element.balance,
                      vendor: req.body.paymentMethod[0].vendor,
                      shiftId: neworder.shiftId,
                    };
                    paymentExist.paymentMethod.push(payobj);
                  }
                  let paymentResponse = await paymentModel.findOneAndUpdate(
                    {
                      _id: paymentExist._id,
                    },
                    {
                      $set: { paymentMethod: paymentExist.paymentMethod },
                    },
                    {
                      returnDocument: "after",
                    }
                  );
                  if (common_service.isEmpty(paymentResponse)) {
                    return (res = {
                      data: {
                        msg: `cannot save payment for${paymentExist.invoiceNo}`,
                      },
                      status: STATUSCODES.UNPROCESSED,
                    });
                  } else {
                    let orderExist = await orderModel.findOne({
                      _id: paymentResponse.purchasePk,
                    });
                    if (!common_service.isEmpty(orderExist)) {
                      let paid = 0;
                      paymentResponse.paymentMethod.map((x) => {
                        paid = paid + x.paidAmount;
                      });
                      orderExist.status =
                        orderExist.totalAmount <= paid
                          ? ORDERSTATUS.COM
                          : ORDERSTATUS.PEN;
                      let orderdataresponse = await orderModel.findOneAndUpdate(
                        {
                          _id: orderExist._id,
                        },
                        {
                          $set: { status: orderExist.status },
                        },
                        {
                          returnDocument: "after",
                        }
                      );

                      if (common_service.isEmpty(orderdataresponse)) {
                        return (res = {
                          data: {
                            msg: `cannot update status of order ${orderExist.orderId} of branch ${orderExist.branchId}`,
                          },
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    }
                  }
                } else {
                  let paymentData = {};
                  let branchExist = {};
                  let orderExist = await orderModel.findOne({
                    _id: element.order_id,
                  });
                  if (common_service.checkObject(orderExist)) {
                    branchExist = await branchModel.findOne({
                      storecode: orderExist.branchId,
                    });
                    if (common_service.checkObject(branchExist)) {
                      paymentData.invoiceNo =
                        PREFIXES.SALESINV + orderExist.orderId;
                      paymentData.cus_id = orderExist.cus_id;
                      paymentData.date = new Date(data.orderDate).getTime();
                      let payobj = {
                        type: req.body.paymentMethod[0].type,
                        account: req.body.paymentMethod[0].account,
                        date: req.body.paymentMethod[0].date,
                        paidAmount:
                          order.totalAmount +
                          order.shipmentCharge -
                          order.discount,
                        vendor: req.body.paymentMethod[0].vendor,
                        shiftId: activeShift.shiftId,
                      };
                      paymentData.paymentMethod = [];
                      paymentData.paymentMethod.push(payobj);
                      paymentData.totalAmount = payobj.paidAmount;
                      paymentData.branchId = order.branchId;
                      paymentData.purchasePk = order._id;
                    } else {
                      return (res = {
                        data: {
                          msg: "invalid branch detected while creating new payment",
                        },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  }
                  let newpayment = new paymentModel(paymentData);
                  let savePaymentResponse = await newpayment.save();
                  if (common_service.isEmpty(savePaymentResponse)) {
                    return (res = {
                      data: {
                        msg: `failed to create payment for ${paymentData.invoiceNo}`,
                      },
                      status: STATUSCODES.UNPROCESSED,
                    });
                  }
                }
              }
            }
          }
        }
      }
      if (
        req.body.isWallet == true &&
        paidAmount > neworder.totalAmount &&
        req.body.paymentMethod.length == 1
      ) {
        req.body.paymentMethod[0].paidAmount = neworder.payableAmount;
      }
      if (neworder.usedWallet > 0) {
        paidAmount = paidAmount + neworder.usedWallet;
      }
      let status =
        data.payableAmount > paidAmount ? ORDERSTATUS.PEN : ORDERSTATUS.COM;
      let ordersave = await orderModel.findOneAndUpdate(
        { _id: data._id },
        { $set: { status: status } },
        { new: true }
      );
      if (ordersave.status == ORDERSTATUS.PEN) {
        let newCredit = new creditModel({
          purchaseId: PREFIXES.SALESINV + ordersave.orderId,
          purchasePk: ordersave._id,
          supplierId: ordersave.cus_id,
          purchaseDate: ordersave.orderDate,
          netAmount: ordersave.totalAmount,
          discount: ordersave.discount,
          lastPaidDate: ordersave.orderDate,
          paidAmount: paidAmount,
          returnAmount: 0,
          balance: ordersave.payableAmount - paidAmount,
          isPurchase: false,
          branchId: ordersave.branchId,
        });
        newCredit.status =
          newCredit.balance == 0 ? CREDITSTATUS.COM : CREDITSTATUS.PEN;
        let creditData = await newCredit.save();
        if (!creditData) {
          return (res = {
            data: { msg: "failed to update credit for this order" },
            status: STATUSCODES.UNPROCESSED,
          });
        }
      }

      if (
        Array.isArray(req.body.paymentMethod) &&
        req.body.paymentMethod.length > 0
      ) {
        let newpayment = new paymentModel({
          invoiceNo: `${PREFIXES.SALESINV}${ordersave.orderId}`,
          cus_id: ordersave.cus_id,
          date: ordersave.orderDate,
          paymentMethod: req.body.paymentMethod,
          totalAmount: ordersave.payableAmount,
          branchId: ordersave.branchId,
          purchasePk: ordersave._id,
        });
        let paymentdata = await newpayment.save();
        if (!paymentdata) {
          return (res = {
            paymentdata: { msg: "payment updation failed for this order" },
            status: STATUSCODES.UNPROCESSED,
          });
        }
      }
      if (common_service.isObjectId(req.body.heldOrderId)) {
        let helddelete = await holdOrderModel.deleteOne({
          _id: req.body.heldOrderId,
        });
        if (common_service.isEmpty(helddelete)) {
          return (res = {
            data: { msg: "held order Not deleted" },
            status: STATUSCODES.UNPROCESSED,
          });
        }
      }
      let REWARDCREDITED = [];
      let pointTotal = 0;
      for (let i = 0; i < data.orderInfo.length; i++) {
        const x = data.orderInfo[i];
        let product = {};
        let stockdata = {
          itemType: x.type,
          itemId: x.itemInfo,
          stock: -parseFloat(x.quantity),
          branchId: data.branchId,
          dimension: x.dimension,
          rate: parseFloat(x.rate),
        };
        let stockExist = await stockModel.findOne({
          itemId: stockdata.itemId,
          branchId: stockdata.branchId,
        });
        if (common_service.checkObject(stockExist)) {
          let stockFind = stockExist.stock.find(
            (x) => x.dimension == stockdata.dimension
          );
          if (common_service.checkObject(stockFind)) {
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
              date: new Date(data.orderDate).getTime(),
              orderNo: neworder.orderId,
              type: PREFIXES.SALESINV,
             
              categoryId: common_service.checkObject(product)
                ? product.category
                : null,
              subCategoryId:
                common_service.checkObject(product) && stockdata.itemType != 0
                  ? product.subcategoryId
                  : null,
              rate: stockdata.rate,
            });
            let stocklogdataresponse = await stockLogData.save();
            if (!common_service.checkObject(stocklogdataresponse)) {
              return (res = {
                data: { msg: "Error Saving Stock Updation To Log" },
                status: STATUSCODES.UNPROCESSED,
              });
            }
          } else {
            return (res = {
              data: { msg: "Error Saving Stock" },
              status: STATUSCODES.UNPROCESSED,
            });
          }
        }
        let rewardExist = {};
        rewardExist = await rewardModel.findOne({
          prodcutId: product.category,
          isCategory: true,
        });
        if (!common_service.checkObject(rewardExist)) {
          rewardExist = await rewardModel.findOne({
            prodcutId: product._id.toString(),
            isCategory: false,
          });
        }
        if (common_service.checkObject(rewardExist)) {
          REWARDCREDITED.push({
            item: product._id.toString(),
            point: Math.round(parseInt(rewardExist.point) * -stockdata.stock),
          });
          pointTotal =
            pointTotal +
            Math.round(parseInt(rewardExist.point) * -stockdata.stock);
        }
        let customerExist = {};
        if (ordersave.cus_id != "cash") {
          customerExist = await customerModel.findOne({
            _id: ordersave.cus_id,
          });
        }
        if (common_service.checkObject(customerExist)) {
          let cusPntaddresponse = await customerModel.findOneAndUpdate(
            { _id: ordersave.cus_id },
            { $set: { points: customerExist.points + pointTotal } },
            { new: true }
          );
          if (!common_service.checkObject(cusPntaddresponse)) {
            return (res = {
              data: { msg: `point updation failed` },
              status: STATUSCODES.UNPROCESSED,
            });
          } else {
            let pointLog = new pointModel({
              cus_id: ordersave.cus_id,
              food_id: product._id.toString(),
              points: pointTotal,
              date: ordersave.orderDate,
              purchasePk: ordersave._id.toString(),
              orderId: PREFIXES.SALESINV + ordersave.orderId,
              branchId: ordersave.branchId,
            });
            let pointsaveresponse = await pointLog.save();
            if (!common_service.checkObject(pointsaveresponse)) {
              return (res = {
                data: { msg: `point log updation failed` },
                status: STATUSCODES.UNPROCESSED,
              });
            }
          }
        }
      }
      let rew = await orderModel.findOneAndUpdate(
        { _id: data._id },
        { $set: { rewardPoints: REWARDCREDITED } },
        { new: true }
      );
      if (common_service.isObjectId(neworder.cus_id)) {
        if (neworder.usedWallet > 0) {
          let walletdata = {
            cus_id: neworder.cus_id,
            amount: -neworder.usedWallet,
            invoiceNo: `${PREFIXES.SALESINV}${neworder.orderId}`,
          };
          let walletExist = await walletModel.findOne({
            cus_id: walletdata.cus_id,
          });

          if (
            !common_service.isEmpty(walletExist) &&
            req.body.isWallet != true
          ) {
            if (walletExist.amount == 0 && walletdata.amount < 0) {
              return (res = {
                data: { msg: `Wallet Amount is ${walletExist.amount}` },
                status: STATUSCODES.FORBIDDEN,
              });
            } else {
              walletExist.amount = walletExist.amount + walletdata.amount;
              let data = await walletExist.save();
              if (data) {
                let walletLogData = walletLogModel({
                  cus_id: walletdata.cus_id,
                  date: new Date(req.body.orderDate).getTime(),
                  amount: walletdata.amount,
                  invoiceNo: walletdata.invoiceNo,
                  branchId: neworder.branchId,
                  purchasePk: data._id,
                });
                let walletlogdata = await walletLogData.save();
                if (common_service.isEmpty(walletlogdata)) {
                  return (res = {
                    data: { msg: "Error Saving Wallet Updation To Log" },
                    status: STATUSCODES.UNPROCESSED,
                  });
                }
              } else {
                return (res = {
                  data: { msg: "wallet updation failed from billorder" },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            }
          }
        }
        
        if (req.body.isWallet == true && paidAmount > neworder.payableAmount) {
          let walletdata = {
            cus_id: neworder.cus_id,
            amount: paidAmount - neworder.payableAmount,
            invoiceNo: `${PREFIXES.SALESINV}${neworder.orderId}`,
          };

          let walletExist = await walletModel.findOne({
            cus_id: walletdata.cus_id,
          });
          if (!common_service.isEmpty(walletExist)) {
            walletExist.amount = walletExist.amount + walletdata.amount;
            
            let data = await walletExist.save();
            if (data) {
              let walletLogData = walletLogModel({
                cus_id: walletdata.cus_id,
                date: new Date(req.body.orderDate).getTime(),
                amount: walletdata.amount,
                invoiceNo: walletdata.invoiceNo, //added on 21-10-22
                branchId: neworder.branchId, //added on 08-12-22
                purchasePk: data._id,
              });
              let walletlogdata = await walletLogData.save();
              if (common_service.isEmpty(walletlogdata)) {
                return (res = {
                  data: { msg: "Error Saving Wallet Updation To Log" },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            } else {
              return (res = {
                data: { msg: "wallet updation failed from billorder" },
                status: STATUSCODES.UNPROCESSED,
              });
            }
          } else {
            let newWallet = new walletModel({
              cus_id: neworder.cus_id,
              amount: paidAmount - neworder.payableAmount,
            });
            let data = await newWallet.save();
            if (data) {
              let walletLogData = new walletLogModel({
                cus_id: neworder.cus_id,
                date: new Date(req.body.orderDate).getTime(),
                amount: newWallet.amount,
                invoiceNo: walletdata.invoiceNo, //added on 21-10-22
                branchId: neworder.branchId,
                purchasePk: data._id,
              });
              let walletData = await walletLogData.save();
              if (common_service.isEmpty(walletData)) {
                return (res = {
                  data: { msg: "Error Saving wallet Updation To Log" },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            } else {
              return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
            }
          }
        }
      }
      return (res = { data: ordersave, status: STATUSCODES.SUCCESS });
    } else {
      return (res = {
        data: { msg: `save to db failed` },
        status: STATUSCODES.UNPROCESSED,
      });
    }
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 29-06-2023
module.exports.getCreditsOfACustomer = async (req) => {
  const { creditModel } = conn.payment(req.decode.db);
  try {
    let orderlist = await creditModel.find({
      supplierId: req.body._id,
      status: CREDITSTATUS.PEN,
      balance: { $gt: 0 },
    });
    if (req.body.prefix && req.body.prefix.length > 0) {
      orderlist = orderlist.filter((x) =>
        x.purchaseId.includes(req.body.prefix)
      );
    }
    if (Array.isArray(orderlist) && orderlist.length > 0) {
      for (let i = 0; i < orderlist.length; i++) {
        const element = orderlist[i];
        element._doc["purchaseDate"] = common_service
          .prescisedateconvert(element.purchaseDate)
          .split(" ")[0];
        element._doc["lastPaidDate"] = common_service
          .prescisedateconvert(element.lastPaidDate)
          .split(" ")[0];
      }
      res = { data: orderlist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 01-07-23
module.exports.viewOrdersByStatus = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { paymentModel } = conn.payment(req.decode.db);
  try {
    let rslist = [];
    let orderList = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        orderList = await orderModel.find({ branchId: req.body.branchId });
      } else {
        orderList = await orderModel.find({});
      }
    } else {
      orderList = await orderModel.find({ branchId: req.body.branchId });
    }
    for (let i = 0; i < orderList.length; i++) {
      let resobj = {};
      resobj.orderId = PREFIXES.SALESINV + orderList[i].orderId;
      resobj.branchCode = orderList[i].branchId;
      resobj.branchName = "No name";
      let branchExist = await branchModel.findOne({
        storecode: orderList[i].branchId,
      });
      if (common_service.checkObject(branchExist)) {
        resobj.branchName = branchExist.nameOfStore;
      }
      resobj.date = common_service
        .prescisedateconvert(orderList[i].orderDate)
        .split(" ")[0];
      resobj.customer = "No Customer";
      let customer = await customerModel.findOne({ _id: orderList[i].cus_id });
      if (common_service.checkObject(customer)) {
        resobj.customer = customer.name;
      }
      resobj.totalAmount = orderList[i].totalAmount;

      resobj.discount = orderList[i].discount;
      resobj.paidAmount = 0;
      let paymentExist = await paymentModel.findOne({
        purchasePk: orderList[i]._id,
      });

      if (common_service.checkObject(paymentExist)) {
        paymentExist.paymentMethod.map((x) => {
          resobj.paidAmount = resobj.paidAmount + x.paidAmount;
        });
      }
      resobj.returnAmount = 0;
      if (orderList[i].usedWallet > 0) {
        resobj.paidAmount = resobj.paidAmount + orderList[i].usedWallet;
      }
      resobj.balanceAmount = orderList[i].payableAmount - resobj.paidAmount;
      resobj._id = orderList[i]._id;
      rslist.push(resobj);
    }
    return (res = { data: rslist, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//#endregion

//added on 27-06-2023
module.exports.viewCategories = async (req) => {
  const { categoryModel } = conn.category(req.decode.db);
  res = {};
  try {
    select_Item = await categoryModel.find({
      dataStatus: true,
    });
    if (select_Item.length > 0) {
      res = { data: select_Item, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 27-06-23
module.exports.viewAvailableItems = async (req) => {
  const { subcategoryModel, categoryModel } = conn.category(req.decode.db);
  try {
    let res = {};
    let subcategoryExist = [];
    if (!req.decode.role == ROLES.ADMIN) {
      subcategoryExist = await subcategoryModel.find({
        branchId: req.body.branchId,
      });
    } else {
      subcategoryExist = await subcategoryModel.find({
        categoryId: req.body.categoryId,
      });
    }
    if (Array.isArray(subcategoryExist) && subcategoryExist.length > 0) {
      for (let i = 0; i < subcategoryExist.length; i++) {
        const element = subcategoryExist[i];
        let categories = await categoryModel.findOne({
          _id: element.categoryId,
        });
        element._doc["categoryName"] = categories
          ? categories.categoryName
          : null;
      }
      res = { data: subcategoryExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 01-07-23
module.exports.viewOrderSingle = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { categoryModel } = conn.category(req.decode.db);
  try {
    let orderExist = await orderModel.findOne({ _id: req.body._id });
    if (common_service.checkObject(orderExist)) {
      let resobj = {};
      resobj.orderId = PREFIXES.SALESINV + orderExist.orderId;
      resobj.date = common_service
        .prescisedateconvert(orderExist.orderDate)
        .split(" ")[0];
      resobj.customer = "no name";
      if (common_service.isObjectId(orderExist.cus_id)) {
        let customerExist = await customerModel.findOne({
          _id: orderExist.cus_id,
        });
        if (common_service.checkObject(customerExist)) {
          resobj.customer = customerExist.name;
        }
      }
      resobj.itemInfo = [];
      resobj.grandTotal = 0;
      if (Array.isArray(orderExist.orderInfo)) {
        for (let i = 0; i < orderExist.orderInfo.length; i++) {
          const element = orderExist.orderInfo[i];
          let itemObj = {};
          if (common_service.isObjectId(element.itemInfo)) {
            let foodExist = await foodModel.findOne({ _id: element.itemInfo });
            if (common_service.checkObject(foodExist)) {
              itemObj.itemName = foodExist.prod_name;
              if (common_service.isObjectId(foodExist.category)) {
                let category = await categoryModel.findOne({
                  _id: foodExist.category,
                });
                if (common_service.checkObject(category)) {
                  itemObj.categoryName = category.categoryName;
                }
              }
            }
          }
          itemObj.qty = element.quantity;
          itemObj.grossAmount = element.rate;
          itemObj.discount = orderExist.discount;
          itemObj.taxableavalue = 0;
          itemObj.total = itemObj.grossAmount + itemObj.taxableavalue;
          resobj.grandTotal = resobj.grandTotal + itemObj.total;
          resobj.itemInfo.push(itemObj);
        }
      }
      resobj.discount = orderExist.discount;
      resobj.shippingCharge = orderExist.shipmentCharge;
      res = { data: resobj, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 02-07-2023
module.exports.viewsalespayments = async (req) => {
  const { paymentModel } = conn.payment(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let paymentList = [];
    let rslist = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        paymentList = await paymentModel.find({ branchId: req.body.branchId });
      } else {
        paymentList = await paymentModel.find({});
      }
    } else {
      paymentList = await paymentModel.find({ branchId: req.body.branchId });
    }
    paymentList = paymentList.filter((x) =>
      x.invoiceNo.includes(PREFIXES.SALESINV)
    );
    for (let i = 0; i < paymentList.length; i++) {
      const element = paymentList[i];
      let resobj = {};
      let branchExist = await branchModel.findOne({
        storecode: element.branchId,
      });
      resobj.branchId = "no branchid";
      resobj.branchName = "No branch name";
      if (common_service.checkObject(branchExist)) {
        resobj.branchId = branchExist.storecode;
        resobj.branchName = branchExist.branchName;
      }
      resobj.invoiceNo = element.invoiceNo;
      resobj.paymentMethod = element.paymentMethod;

      if (common_service.isObjectId(element.cus_id)) {
        let customerExist = await customerModel.findOne({
          _id: element.cus_id,
        });
        resobj.cus_id = common_service.checkObject(customerExist)
          ? customerExist._id
          : "no id";
        resobj.customerName = common_service.checkObject(customerExist)
          ? customerExist.name
          : "no name";
      } else {
        resobj.cus_id = "cash";
        resobj.customerName = "cash";
      }
      resobj.date = common_service
        .prescisedateconvert(element.date)
        .split(" ")[0];
      resobj.totalAmount = element.totalAmount;
      resobj.purchasePk = element.purchasePk;
      rslist.push(resobj);
    }
    if (req.body.purchasePk) {
      rslist = rslist.filter((x) => x.purchasePk == req.body.purchasePk);
    }
    if (req.body.cus_id) {
      rslist = rslist.filter((x) => x.cus_id == req.body.cus_id);
    }
    return (res = { data: rslist, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 06-07-2023
module.exports.getOrderNoSalesReturn = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const { paymentModel } = conn.payment(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  try {
    let orderList = [];
    let rslist = [];
    if (req.body.branchId) {
      orderList = await orderModel.find({
        branchId: req.body.branchId,
        returnStatus: { $eq: null },
      });
    }
    orderList = orderList.filter((x) => x.orderType == 1 || x.orderType == 2);
    for (let i = 0; i < orderList.length; i++) {
      const element = orderList[i];
      let resobj = {
        _id: "647ac5565ed4c20462212477",
        orderNo: "no invoice",
        total: 0,
        status: "null",
        paidAmount: 0,
        balance: 0,
        cusId: "no id",
        cusName: "no name",
      };
      resobj._id = element._id;
      resobj.orderNo =
        element.branchId.substr(3) + PREFIXES.SALESINV + element.orderId;
      resobj.total = element.payableAmount;
      let paymentExist = await paymentModel.findOne({
        purchasePk: element._id,
      });
      if (common_service.checkObject(paymentExist)) {
        if (Array.isArray(paymentExist.paymentMethod)) {
          paymentExist.paymentMethod.map((x) => {
            resobj.paidAmount = resobj.paidAmount + x.paidAmount;
          });
        }
      }
      if (element.usedWallet > 0) {
        resobj.paidAmount = resobj.paidAmount + element.usedWallet;
      }
      resobj.status =
        element.returnStatus != null ? element.returnStatus : element.status;
      resobj.balance = resobj.total - resobj.paidAmount;
      if (common_service.isObjectId(element.cus_id)) {
        let customerExist = await customerModel.findOne({
          _id: element.cus_id,
        });
        if (common_service.checkObject(customerExist)) {
          resobj.cusId = `CUS${customerExist.cusId}`;
          resobj.cusName = customerExist.name;
        }
      }
      rslist.push(resobj);
    }
    return (res = { data: rslist, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 06-07-23
module.exports.orderDetailsSalesReturn = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  try {
    let resobj = {};
    let orderExist = await orderModel.findOne({ _id: req.body._id });
    if (common_service.checkObject(orderExist)) {
      resobj._id = orderExist._id;
      resobj.cusId = orderExist.cus_id;
      resobj.invoiceNo =
        orderExist.branchId.substr(3) + PREFIXES.SALESINV + orderExist.orderId;
      if (common_service.isObjectId(orderExist.cus_id)) {
        let customerExist = await customerModel.findOne({
          _id: orderExist.cus_id,
        });
        if (common_service.checkObject(customerExist)) {
          resobj.customerName = customerExist.name;
        }
      }
      resobj.productList = [];
      if (Array.isArray(orderExist.orderInfo)) {
        for (let i = 0; i < orderExist.orderInfo.length; i++) {
          const element = orderExist.orderInfo[i];
          let prodElement = {
            productCode: "nocode",
            productId: "no id",
            productName: "no name",
            uuid: "no uuid",
            unit: "no unit",
            quantity: 0,
            rate: 0,
            amount: 0,
            dimension: "no dimension",
            itemType: 0,
          };
          if (common_service.isObjectId(element.itemInfo)) {
            let product = await foodModel.findOne({ _id: element.itemInfo });
            if (common_service.checkObject(product)) {
              prodElement.productCode = "FOOD" + product.prod_id;
              prodElement.productId = product._id.toString();
              prodElement.productName = product.prod_name;
              prodElement.uuid = element.uuid;
              prodElement.unit = element.unit;
              prodElement.quantity = parseFloat(element.quantity);
              prodElement.rate = parseFloat(element.rate);
              prodElement.amount = prodElement.quantity * prodElement.rate;
              prodElement.dimension = element.dimension;
              prodElement.itemType = 1;
            }
          }
          resobj.productList.push(prodElement);
        }
      }
      resobj.total = orderExist.totalAmount;
      resobj.shipmentCharge = orderExist.shipmentCharge;
      resobj.discount = orderExist.discount;
    }
    return (res = { data: resobj, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 08-07-23
module.exports.addMess1 = async (req) => {
  const { messModel } = conn.order(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let messExist = await messModel.findOne({
      customer: req.body.customer,
      mobileNo: req.body.mobileNo,
      branchId: req.body.branchId,
    });

    if (common_service.isEmpty(messExist)) {
      let newMess = new messModel({
        customer: req.body.customer,
        mobileNo: req.body.mobileNo,
        email: req.body.email,
        date: new Date(req.body.date).getTime(),
        packageDetails: req.body.packageDetails,
        packageTotal: req.body.packageTotal,
        paidAmount: req.body.paidAmount,
        balanceAmount: req.body.balanceAmount,
        branchId: req.body.branchId,
      });
      let transfers = await messModel.find();
      if (transfers.length > 0) {
        newMess.transNo = transfers[transfers.length - 1].transNo + 1;
      } else {
        newMess.transNo = 1;
      }
      let data = await newMess.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.ORDERS_ADDMESS.type,
          description: LOG.ORDERS_ADDMESS.description,
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
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.CONFLICT };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 06-07-23
module.exports.addSalesReturn = async (req) => {
  const { orderreturnModel, orderModel, damagedGoodsModel } = conn.order(
    req.decode.db
  );
  const { creditModel, paymentModel, returnPaymentModel } = conn.payment(
    req.decode.db
  );
  const { shiftLogModel, logModel, shiftModel } = conn.settings(req.decode.db);
  const { stockModel, stockLogModel, oldStockLogModel } = conn.stock(
    req.decode.db
  );
  const { foodModel } = conn.food(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { rewardModel } = conn.reward(req.decode.db);
  try {
    if (common_service.checkObject(req.body)) {
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
        if (!common_service.isObjectId(req.body.order_id)) {
          return (res = {
            data: { msg: "Pass A Valid OrderId" },
            status: STATUSCODES.BADREQUEST,
          });
        }
        let salesReturn = new orderreturnModel({});
        salesReturn.returnType = req.body.returnType;
        salesReturn.customerId = req.body.customerId;
        salesReturn.invoiceNo = req.body.invoiceNo;
        salesReturn.returnDate = new Date(req.body.date).getTime();
        if (
          Array.isArray(req.body.returnInfo) &&
          req.body.returnInfo.length > 0
        ) {
          req.body.returnInfo.map(
            (x) => (x.returnDate = new Date(x.returnDate).getTime())
          );
        }
        salesReturn.returnInfo = req.body.returnInfo;
        salesReturn.branchId = req.body.branchId;
        salesReturn.purchasePk = req.body.order_id;
        salesReturn.shiftId = shiftExist.shiftId;
        let salesReturnList = await orderreturnModel.find({
          branchId: req.body.branchId,
        });
        salesReturn.transNo =
          Array.isArray(salesReturnList) && salesReturnList.length > 0
            ? salesReturnList[salesReturnList.length - 1].transNo + 1
            : 1;
        salesReturn.paymentMethod = req.body.paymentMethod;
        let data = await salesReturn.save();
        if (common_service.checkObject(data)) {
          let returnTotal = 0;
          let pointTotal = 0;
          let orderExist = await orderModel.findOne({ _id: data.purchasePk });
          if (common_service.checkObject(orderExist)) {
            for (let i = 0; i < data.returnInfo.length; i++) {
              let item = orderExist.orderInfo.find(
                (x) => x.uuid == data.returnInfo[i].uuid
              );
              let itemIndex = orderExist.orderInfo.findIndex(
                (x) => x.uuid == data.returnInfo[i].uuid
              );
              if (item != undefined) {
                if (item.returnQty) {
                  if (
                    item.returnQty + req.body.returnInfo[i].returnQty <=
                    item.quantity
                  ) {
                    item.returnQty =
                      item.returnQty + req.body.returnInfo[i].returnQty;
                    item.returnAmount =
                      item.returnAmount + req.body.returnInfo[i].amount;
                  } else {
                    return (res = {
                      data: {
                        msg: "return quantity exceeds ordered quantity",
                      },
                      status: STATUSCODES.UNPROCESSED,
                    });
                  }
                } else {
                  if (req.body.returnInfo[i].returnQty <= item.quantity) {
                    item.returnQty = req.body.returnInfo[i].returnQty;
                    item.returnAmount = req.body.returnInfo[i].amount;
                  } else {
                    return (res = {
                      data: {
                        msg: "return quantity exceeds ordered quantity",
                      },
                      status: STATUSCODES.UNPROCESSED,
                    });
                  }
                }

                if (item.quantity == data.returnInfo[i].returnQty)
                  item.status = "returned";
                orderExist.orderInfo[itemIndex] = item;
              }
              if (Array.isArray(orderExist.rewardPoints)) {
                let pointItem = orderExist.rewardPoints.find(
                  (x) => x.item == data.returnInfo[i].itemInfo
                );
                if (common_service.checkObject(pointItem)) {
                  pointTotal =
                    pointTotal + data.returnInfo[i].returnQty * pointItem.point;
                }
              }
            }
            if (common_service.isObjectId(data.customerId)) {
              let customerExist = await customerModel.findOne({
                _id: data.customerId,
              });
              if (common_service.checkObject(customerExist)) {
                customerExist.points = customerExist.points - pointTotal;
                await customerModel.findOneAndUpdate(
                  { _id: customerExist._id },
                  { $set: customerExist },
                  { new: true }
                );
              }
            }
            req.body.shipmentCharge != null
              ? (shipmentCharge = req.body.shipmentCharge)
              : (shipmentCharge = orderExist.shipmentCharge);
            req.body.discount != null
              ? (discount = req.body.discount)
              : (discount = orderExist.discount);
            let newOrder = await orderModel.findOneAndUpdate(
              { _id: orderExist._id },
              {
                $set: {
                  orderInfo: orderExist.orderInfo,
                  shipmentCharge,
                  discount,
                },
              },
              { new: true }
            );
            let count = 0;
            for (let i = 0; i < newOrder.orderInfo.length; i++) {
              if (
                newOrder.orderInfo[i].status != undefined &&
                newOrder.orderInfo[i].status == "returned"
              )
                count = count + 1;
            }
            if (count == newOrder.orderInfo.length) {
              await orderModel.findOneAndUpdate(
                { _id: orderExist._id },
                { $set: { returnStatus: "returned" } },
                { new: true }
              );
            } else {
            }
            for (let i = 0; i < data.returnInfo.length; i++) {
              returnTotal = returnTotal + data.returnInfo[i].amount;
              const element = data.returnInfo[i];
              let product = {};
              if (common_service.isObjectId(element.itemInfo)) {
                product = await foodModel.findOne({ _id: element.itemInfo });
              }
              let stockdata = {
                itemType: element.itemType,
                itemId: element.itemInfo,
                stock: element.returnQty,
                branchId: data.branchId,
                dimension: element.dimension,
                orderNo: data.transNo,
                type: PREFIXES.SALESRETURN,
                rate: element.originalAmt,
              };
              if (element.reasonType == 0) {
                let stockExist = await stockModel.findOne({
                  itemId: stockdata.itemId,
                  branchId: stockdata.branchId,
                });
                if (common_service.checkObject(stockExist)) {
                  if (
                    Array.isArray(stockExist.oldStock) &&
                    stockExist.oldStock.length > 0
                  ) {
                    let oldStockFind = stockExist.oldStock.find(
                      (x) => x.dimension == stockdata.dimension
                    );
                    if (!isEmpty(oldStockFind)) {
                      oldStockFind.dimensionStock =
                        oldStockFind.dimensionStock + stockdata.stock;
                    } else {
                      stockExist.oldStock.push({
                        dimension: stockdata.dimension,
                        dimensionStock: stockdata.stock,
                      });
                    }
                  } else {
                    stockExist.oldStock = [];
                    stockExist.oldStock.push({
                      dimension: stockdata.dimension,
                      dimensionStock: stockdata.stock,
                    });
                  }
                  let stkresponse = await stockModel.findOneAndUpdate(
                    { _id: stockExist._id },
                    { $set: stockExist },
                    { new: true }
                  );
                  if (isEmpty(stkresponse)) {
                    return (res = {
                      data: { msg: `Save Failed` },
                      status: STATUSCODES.UNPROCESSED,
                    });
                  }
                }
              } else if (element.reasonType == 1) {
                let damagedGoods = new damagedGoodsModel({
                  branchId: data.branchId,
                  customerId: data.customerId,
                  invoiceNo: data.invoiceNo,
                  paidAmount: data.paymentMethod
                    ? data.paymentMethod[0].paidAmount
                    : 0,
                  refundAmount: data.paymentMethod
                    ? data.paymentMethod[0].paidAmount
                    : 0,
                  itemid: data.returnInfo[i].itemInfo,
                  returnId: data._id,
                  itemInfo: [data.returnInfo[i]],
                });
                let damageList = await damagedGoodsModel.find({
                  branchId: damagedGoods.branchId,
                });
                if (Array.isArray(damageList) && damageList.length > 0) {
                  damagedGoods.transNo =
                    damageList[damageList.length - 1].transNo + 1;
                } else {
                  damagedGoods.transNo = 1;
                }
                let damagedresp = await damagedGoods.save();

                if (common_service.isEmpty(damagedresp)) {
                  return damagedresp;
                }
              } else if (element.reasonType == 2) {
                stockdata.category = !common_service.isEmpty(product)
                  ? product.category
                  : null;
                stockdata.subCategoryId =
                  !common_service.isEmpty(product) && stockdata.itemType != 0
                    ? product.subcategoryId
                    : null;

                let stockExist = await stockModel.findOne({
                  branchId: stockdata.branchId,
                  itemId: stockdata.itemId,
                });

                if (!common_service.isEmpty(stockExist)) {
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
                  let stockdata1 = await stockExist.save();
                  if (!isEmpty(stockdata1)) {
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
                      orderNo: data.transNo,
                      type: PREFIXES.SALESRETURN,
                      categoryId: !isEmpty(product) ? product.category : null,
                      subCategoryId:
                        !isEmpty(product) && stockdata.itemType != 0
                          ? product.subcategoryId
                          : null,
                      rate: stockdata.rate,
                    });
                    let data1 = await stockLogData.save();
                    if (isEmpty(data1)) {
                      return (res = {
                        data: { msg: "Error Saving Stock Updation To Log" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  } else {
                    return (res = {
                      data: { msg: "stock updation failed from billorder" },
                      status: STATUSCODES.UNPROCESSED,
                    });
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
                    let stockLogData = new stockLogModel({
                      itemType: stockdata.itemType,
                      itemId: stockdata.itemId,
                      stock: newStock.stock,
                      branchId: stockdata.branchId,
                      date: new Date(req.body.date).getTime(),
                      orderNo: data.transNo,
                      type: PREFIXES.SALESRETURN,
                      categoryId: !isEmpty(product) ? product.category : null,
                      subCategoryId:
                        !isEmpty(product) && stockdata.itemType != 2
                          ? product.subcategoryId
                          : null,
                      rate: stockdata.rate,
                    });
                    let stocklogdata = await stockLogData.save();
                    if (isEmpty(stocklogdata)) {
                      return (res = {
                        data: { msg: "Error Saving Stock Updation To Log" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  } else {
                    return (res = {
                      data: { msg: "stock updation failed from billorder" },
                      status: STATUSCODES.UNPROCESSED,
                    });
                  }
                }
              }
            }
            if (req.body.paymentMethod != null) {
              let total = 0;
              for (let i = 0; i < req.body.paymentMethod.length; i++) {
                req.body.paymentMethod[i].shiftId = shiftExist.shiftId;
                total = total + req.body.paymentMethod[i].paidAmount;
              }
              let retpaymentdata = new returnPaymentModel({
                invoiceNo: PREFIXES.SALESRETURN + data.transNo,
                cus_id: data.customerId,
                date: data.returnDate,
                paymentMethod: req.body.paymentMethod,
                totalAmount: total,
                branchId: data.branchId,
                purchasePk: data._id,
              });
              let retpaymentdataresponse = await retpaymentdata.save();
              if (common_service.checkObject(retpaymentdataresponse)) {
                if (req.body.isWallet == true) {
                  let walletExist = await walletModel.findOne({
                    cus_id: orderExist.cus_id,
                  });
                  if (!isEmpty(walletExist)) {
                    if (walletExist.wallet == 0 && req.wallet < 0) {
                      return (res = {
                        data: {
                          msg: `Wallet Amount is ${walletExist.amount}`,
                        },
                        status: STATUSCODES.FORBIDDEN,
                      });
                    } else {
                      walletExist.amount = walletExist.amount + total;

                      let data = await walletExist.save();
                      if (data) {
                        let walletLogData = walletLogModel({
                          cus_id: orderExist.cus_id,
                          date: new Date(req.body.date).getTime(),
                          amount: total,
                          invoiceNo: PREFIXES.SALESRETURN + data.transNo,
                          branchId: branch.storeCode,
                          purchasePk: data._id,
                        });
                        let walletlogdata = await walletLogData.save();
                        if (isEmpty(walletlogdata)) {
                          return (res = {
                            data: {
                              msg: "Error Saving Wallet Updation To Log",
                            },
                            status: STATUSCODES.UNPROCESSED,
                          });
                        }
                      } else {
                        return (res = {
                          data: {},
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    }
                  } else {
                    let newWallet = walletModel({
                      cus_id: orderExist.cus_id,
                      amount: total,
                      //purchasePk: req.body.orderId,
                    });
                    let data = await newWallet.save();
                    if (data) {
                      let walletLogData = new walletLogModel({
                        cus_id: orderExist.cus_id,
                        date: new Date(req.body.date).getTime(),
                        amount: total,
                        invoiceNo: PREFIXES.SALESRETURN + data.transNo,
                        branchId: branch.storeCode,
                        purchasePk: data._id,
                      });
                      let walletData = await walletLogData.save();
                      if (isEmpty(walletData)) {
                        return (res = {
                          data: {
                            msg: "Error Saving wallet Updation To Log",
                          },
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                      //return (res = { data: data, status: STATUSCODES.SUCCESS });
                    } else {
                      return (res = {
                        data: {},
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  }
                }
                let discount =
                  req.body.discount != null
                    ? req.body.discount
                    : orderExist.discount;
                let shipmentCharge =
                  req.body.shipmentCharge != null
                    ? req.body.shipmentCharge
                    : orderExist.shipmentCharge;
                let payment = await paymentModel.findOne({
                  purchasePk: orderExist._id,
                });
                if (payment) {
                  payment.totalAmount =
                    req.body.total + shipmentCharge - discount;

                  let pk = retpaymentdataresponse._id.toString();
                  if (payment.returnLog != undefined) {
                    payment.returnLog.push({
                      srtId: data._id,
                      returnPaymentPk: pk,
                      returnAmount: retpaymentdataresponse.totalAmount,
                      date: retpaymentdataresponse.date,
                    });
                  } else {
                    payment.returnLog = [];
                    payment.returnLog.push({
                      srtId: data._id.toString(),
                      returnPaymentPk: pk,
                      returnAmount: retpaymentdataresponse.totalAmount,
                      date: retpaymentdataresponse.date,
                    });
                  }
                  await payment.save();
                }
                let credit = await creditModel.findOne({
                  purchasePk: orderExist._id,
                });
                if (credit) {
                  if (retpaymentdataresponse != null) {
                    let returnAmount;
                    if (credit.returnAmount != undefined) {
                      returnAmount =
                        credit.returnAmount +
                        retpaymentdataresponse.totalAmount;
                    } else {
                      returnAmount = retpaymentdataresponse.totalAmount;
                    }
                    let balance = credit.balance - returnTotal;
                    if (balance < 0) {
                      await creditModel.findOneAndUpdate(
                        { purchasePk: req.body.order_id },
                        {
                          $set: {
                            balance: 0,
                            netAmount: req.body.total + shipmentCharge,
                            discount,
                            returnAmount,
                            status: CREDITSTATUS.COM,
                          },
                        },
                        { new: true }
                      );
                    } else if (balance > 0) {
                      await creditModel.findOneAndUpdate(
                        { purchasePk: req.body.order_id },
                        {
                          $set: {
                            balance,
                            netAmount: req.body.total + shipmentCharge,
                            discount,
                            returnAmount,
                          },
                        },
                        { new: true }
                      );
                    }
                  }
                }
              } else {
                return (res = {
                  data: { msg: "Return payment Save Failed" },
                  status: STATUSCODES.UNPROCESSED,
                });
              }
            } else {
              let credit = await creditModel.findOne({
                purchasePk: orderExist._id,
              });
              let discount =
                req.body.discount != null
                  ? req.body.discount
                  : orderExist.discount;
              let shipmentCharge =
                req.body.shipmentCharge != null
                  ? req.body.shipmentCharge
                  : orderExist.shipmentCharge;
              let netAmount = req.body.total + shipmentCharge;
              if (credit) {
                let balance = credit.balance - (returnTotal + discount);
                if (balance <= 0) {
                  await creditModel.findOneAndUpdate(
                    { purchasePk: req.body.order_id },
                    {
                      $set: {
                        balance: 0,
                        netAmount,
                        discount,
                        returnAmount: returnTotal,
                        status: CREDITSTATUS.COM,
                      },
                    },
                    { new: true }
                  );
                } else if (balance > 0) {
                  await creditModel.findOneAndUpdate(
                    { purchasePk: req.body.order_id },
                    {
                      $set: {
                        balance,
                        netAmount,
                        discount,
                        returnAmount: returnTotal,
                      },
                    },
                    { new: true }
                  );
                }
              }
              let payment = await paymentModel.findOne({
                purchasePk: workorder._id,
              });
              if (payment) {
                payment.totalAmount = netAmount - discount;
                if (payment.returnLog != undefined) {
                  payment.returnLog.push({
                    srtId: data._id,
                    returnPaymentPk: null,
                    returnAmount: returnTotal,
                    date: new Date(req.body.date).getTime(),
                  });
                } else {
                  payment.returnLog = [];
                  payment.returnLog.push({
                    srtId: data._id,
                    returnPaymentPk: null,
                    returnAmount: returnAmount,
                    date: new Date(req.body.date).getTime(),
                  });
                }
                await payment.save();
              }
            }
          } else {
            await orderreturnModel.deleteOne({ _id: data._id });
            return (res = {
              data: { msg: "Invalid Order Id Passed" },
              status: STATUSCODES.FORBIDDEN,
            });
          }
          let newlog = new logModel({
            date: new Date().getTime(),
            emp_id: req.decode._id,
            type: LOG.SALES_RETURN_ADD.type,
            description: LOG.SALES_RETURN_ADD.description,
            branchId: shiftExist.branchId,
            link: {},
            payload: { token: req.headers.authorization, body: req.body },
          });
          let logresponse = await newlog.save();
          if (logresponse == null) {
            console.log("log save faild");
          }

          return (res = { data: data, status: STATUSCODES.SUCCESS });
        } else {
          return (res = {
            data: { msg: `save failed` },
            status: STATUSCODES.UNPROCESSED,
          });
        }
      } else {
        return (res = {
          data: { msg: `No Active Shift For Branch ${req.body.branchId}` },
          status: STATUSCODES.NOTFOUND,
        });
      }
    } else {
      return (res = { data: { msg: "" }, status: STATUSCODES.BADREQUEST });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 16-05-2022
module.exports.getSalesReturn = async (req) => {
  const { orderreturnModel } = conn.order(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let rslist = [];
    let salesReturnList = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.decode.branchId) {
        salesReturnList = await orderreturnModel.find({
          branchId: req.body.branchId,
        });
      } else {
        salesReturnList = await orderreturnModel.find({});
      }
    } else {
      salesReturnList = await orderreturnModel.find({
        branchId: req.body.branchId,
      });
    }
    for (let i = 0; i < salesReturnList.length; i++) {
      // const element = salesReturnList[i];
      let resobj = {
        branchCode: "No Code",
        branchName: "No Name",
        invoiceNo: "no invoice",
        customerName: "no name",
        mobileNo: "No number",
        date: "No date",
        price: 0,
      };
      let branchExist = await branchModel.findOne({
        storeCode: salesReturnList[i].branchId,
      });
      if (common_service.checkObject(branchExist)) {
        resobj.branchCode = branchExist.storeCode;
        resobj.branchName = branchExist.branchName;
      }
      resobj.invoiceNo = salesReturnList[i].invoiceNo;
      if (common_service.isObjectId(salesReturnList[i].customerId)) {
        let customerExist = await customerModel.findOne({
          _id: salesReturnList[i].customerId,
        });
        if (common_service.checkObject(customerExist)) {
          resobj.customerName = customerExist.name;
          resobj.mobileNo = customerExist.mobileNo;
        }
      } else {
        if (salesReturnList[i].customerId.toLowerCase() == "cash") {
          resobj.customerName = "Cash Customer";
          resobj.mobileNo = "Cash Customer";
        }
      }
      resobj.date = common_service
        .prescisedateconvert(salesReturnList[i].returnDate)
        .split(" ")[0];
      if (salesReturnList[i].returnInfo.length > 0) {
        salesReturnList[i].returnInfo.map((x) => {
          if (typeof x.amount == "number") {
            resobj.price = resobj.price + x.amount;
          }
        });
      }
      resobj._id = salesReturnList[i]._id;
      rslist.push(resobj);
    }
    return (res = { data: rslist, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 16-05-2022
module.exports.getSalesReturn = async (req) => {
  const { orderreturnModel } = conn.order(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let rslist = [];
    let salesReturnList = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.decode.branchId) {
        salesReturnList = await orderreturnModel.find({
          branchId: req.body.branchId,
        });
      } else {
        salesReturnList = await orderreturnModel.find({});
      }
    } else {
      salesReturnList = await orderreturnModel.find({
        branchId: req.body.branchId,
      });
    }
    for (let i = 0; i < salesReturnList.length; i++) {
      // const element = salesReturnList[i];
      let resobj = {
        branchCode: "No Code",
        branchName: "No Name",
        invoiceNo: "no invoice",
        customerName: "no name",
        mobileNo: "No number",
        date: "No date",
        price: 0,
      };
      let branchExist = await branchModel.findOne({
        storeCode: salesReturnList[i].branchId,
      });
      if (common_service.checkObject(branchExist)) {
        resobj.branchCode = branchExist.storeCode;
        resobj.branchName = branchExist.branchName;
      }
      resobj.invoiceNo = salesReturnList[i].invoiceNo;
      if (common_service.isObjectId(salesReturnList[i].customerId)) {
        let customerExist = await customerModel.findOne({
          _id: salesReturnList[i].customerId,
        });
        if (common_service.checkObject(customerExist)) {
          resobj.customerName = customerExist.name;
          resobj.mobileNo = customerExist.mobileNo;
        }
      } else {
        if (salesReturnList[i].customerId.toLowerCase() == "cash") {
          resobj.customerName = "Cash Customer";
          resobj.mobileNo = "Cash Customer";
        }
      }
      resobj.date = common_service
        .prescisedateconvert(salesReturnList[i].returnDate)
        .split(" ")[0];
      if (salesReturnList[i].returnInfo.length > 0) {
        salesReturnList[i].returnInfo.map((x) => {
          if (typeof x.amount == "number") {
            resobj.price = resobj.price + x.amount;
          }
        });
      }
      resobj._id = salesReturnList[i]._id;
      rslist.push(resobj);
    }
    return (res = { data: rslist, status: STATUSCODES.SUCCESS });
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 12-07-23
module.exports.deleteSalesReturn = async (req) => {
  const { logModel } = conn.settings(req.decode.db);
  const { orderreturnModel, orderModel, damagedGoodsModel } = conn.order(
    req.decode.db
  );
  const { paymentModel, creditModel, returnPaymentModel } = conn.payment(
    req.decode.db
  );
  const { customerModel } = conn.customer(req.decode.db);
  const { stockModel, stockLogModel } = conn.stock(req.decode.db);
  try {
    let returnAmount = 0,
      balance = 0,
      totalAmount = 0;
    let ret = await orderreturnModel.findOne({ _id: req.body._id });

    let order = {};
    let stock = {};
    if (ret != null) {
      let payment = await paymentModel.findOne({
        purchasePk: ret.purchasePk,
      });
      let credit = await creditModel.findOne({ purchasePk: ret.purchasePk });
      if (ret.returnInfo.length > 0) {
        order = await orderModel.findOne({ _id: ret.purchasePk });
        if (order != null) {
          for (let i = 0; i < ret.returnInfo.length; i++) {
            const element = ret.returnInfo[i];
            let orderInfo = order.orderInfo.find((x) => x.uuid == element.uuid);
            if (orderInfo) {
              orderInfo.returnQty = orderInfo.returnQty - element.returnQty;
              orderInfo.returnAmount = orderInfo.returnAmount - element.rate;
            }
            if (
              typeof orderInfo.returnQty == "number" &&
              orderInfo.returnQty == 0
            ) {
              orderInfo.status = null;
            }
            totalAmount = totalAmount + element.amount;
            returnAmount = returnAmount + element.amount;
            balance = balance + element.amount;
            if (element.reasonType == 2) {
              stock = await stockModel.findOne({
                itemId: element.itemInfo,
              });
              if (stock != null) {
                let itemfind = stock.stock.find(
                  (x) => x.dimension == element.dimension
                );
                if (itemfind != null) {
                  itemfind.dimensionStock =
                    itemfind.dimensionStock - element.returnQty;
                }
                let stockLog = await stockLogModel.findOne({
                  branch: ret.branchId,
                  orderNo: ret.transNo,
                  type: PREFIXES.SALESRETURN,
                });
                if (stockLog != null) {
                  await stockLogModel.deleteOne({
                    branch: ret.branchId,
                    orderNo: ret.transNo,
                    type: PREFIXES.SALESRETURN,
                  });
                }
                await stockModel.findOneAndUpdate(
                  { _id: stock._id },
                  { $set: stock },
                  { new: true }
                );
              }
            }
            if (element.reasonType == 1) {
              await damagedGoodsModel.deleteOne({
                returnId: ret._id.toString(),
              });
            }
          }
          await orderModel.findOneAndUpdate(
            { _id: order._id },
            { $set: order },
            { new: true }
          );
        }

        if (payment != null) {
          payment.totalAmount = payment.totalAmount + totalAmount;
          payment.returnLog = payment.returnLog.filter(
            (x) => x.srtId != ret._id
          );
          await paymentModel.findOneAndUpdate(
            { _id: payment._id },
            { $set: payment },
            { new: true }
          );
        }
        if (credit != null) {
          credit.returnAmount = credit.returnAmount - returnAmount;
          credit.balance = credit.balance + balance;
          credit.netAmount = credit.netAmount + totalAmount;
          await creditModel.findOneAndUpdate(
            { _id: credit._id },
            { $set: credit },
            { new: true }
          );
        }
        let customer = await customerModel.findOne({
          _id: ret.customerId,
        });
        if (order.rewardPoints.length > 0 && customer != null) {
          order.rewardPoints.map((x) => {
            customer.points = customer.points + x.point;
          });
          await customerModel.findOneAndUpdate(
            { _id: customer._id },
            { $set: customer },
            { new: true }
          );
        }
        await orderreturnModel.deleteOne({ _id: ret._id });
        await returnPaymentModel.deleteOne({ purchasePk: ret._id });
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.SALES_RETURN_ADD.type,
          description: LOG.SALES_RETURN_ADD.description,
          branchId: ret.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        return (res = { data: "Return Deleted", status: STATUSCODES.SUCCESS });
      } else {
        return (res = {
          data: { msg: "no return with this id" },
          status: STATUSCODES.NOTFOUND,
        });
      }
    } else {
      return (res = {
        data: "no return with this id",
        status: STATUSCODES.NOTFOUND,
      });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.editSalesReturn = async (req) => {
  const { orderreturnModel, orderModel, damagedGoodsModel } = conn.order(
    req.decode.db
  );
  const { logModel } = conn.settings(req.decode.db);
  const {
    creditModel,
    paymentModel,
    returnPaymentModel,
    walletModel,
    walletLogModel,
  } = conn.payment(req.decode.db);
  const { shiftLogModel } = conn.settings(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { rewardModel } = conn.reward(req.decode.db);
  const { stockLogModel, stockModel } = conn.stock(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  try {
    let branch = await branchModel.findOne({ storeCode: req.body.branchId });
    if (branch) {
      let shiftExist = await shiftLogModel.findOne({
        status: SHIFTSTATUS.ACT,
        branchId: req.body.branchId,
      });
      if (shiftExist) {
        if (req.body.returnInfo.length > 0) {
          let sales = await orderreturnModel.findOne({
            _id: req.body.returnId,
          });
          if (sales) {
            if (sales.returnType == 0) {
              var pointTotal = 0;
              let returnTotal = 0;
              let rtnInfo = sales.returnInfo;
              for (let i = 0; i < req.body.returnInfo.length; i++) {
                const element = req.body.returnInfo[i];
                let item = rtnInfo.find(
                  (x) => x.itemInfo === req.body.returnInfo[i].itemInfo
                );
                let rewardPoint = await rewardModel({
                  productId: element.itemInfo,
                });
                if (!isEmpty(rewardPoint.data)) {
                  pointTotal += Math.round(
                    rewardPoint.point * element.returnQty
                  );
                }
                let product = {};
                if (common_service.isObjectId(element.itemInfo)) {
                  product = await foodModel.findOne({ _id: element.itemInfo });
                }
                let stockdata = {
                  itemType: element.itemType,
                  itemId: element.itemInfo,
                  stock: item.returnQty - element.returnQty,
                  branchId: sales.branchId,
                  dimension: element.dimension,
                  rate: element.rate,
                };
                if (element.reasonType == 0) {
                  let stockExist = await stockModel.findOne({
                    itemId: stockdata.itemId,
                    branchId: stockdata.branchId,
                  });
                  if (common_service.checkObject(stockExist)) {
                    if (
                      Array.isArray(stockExist.oldStock) &&
                      stockExist.oldStock.length > 0
                    ) {
                      let oldStockFind = stockExist.oldStock.find(
                        (x) => x.dimension == stockdata.dimension
                      );
                      if (!isEmpty(oldStockFind)) {
                        oldStockFind.dimensionStock =
                          oldStockFind.dimensionStock + stockdata.stock;
                      } else {
                        stockExist.oldStock.push({
                          dimension: stockdata.dimension,
                          dimensionStock: stockdata.stock,
                        });
                      }
                    } else {
                      stockExist.oldStock = [];
                      stockExist.oldStock.push({
                        dimension: stockdata.dimension,
                        dimensionStock: stockdata.stock,
                      });
                    }
                    let stkresponse = await stockModel.findOneAndUpdate(
                      { _id: stockExist._id },
                      { $set: stockExist },
                      { new: true }
                    );
                    if (isEmpty(stkresponse)) {
                      return (res = {
                        data: { msg: `Save Failed` },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  }
                } else if (element.reasonType == 1) {
                  let damage = await damagedGoodsModel.findOne({
                    returnId: sales._id,
                    itemId: element.itemInfo,
                  });
                  if (damage) {
                    await damagedGoodsModel.findOneAndUpdate(
                      { _id: damage._id },
                      {
                        $set: {
                          itemInfo: element,
                          itemId: element.itemInfo,
                          paidAmount: sales.paymentMethod
                            ? sales.paymentMethod[0].paidAmount
                            : 0,
                          refundAmount: sales.paymentMethod
                            ? sales.paymentMethod[0].paidAmount
                            : 0,
                          branchId: sales.branchId,
                          customerId: sales.customerId,
                          invoiceNo: sales.invoiceNo,
                          itemid: sales.returnInfo[i].itemInfo,
                          returnId: sales._id,
                        },
                      }
                    );
                  } else {
                    let damagedGoods = new damagedGoodsModel({
                      branchId: sales.branchId,
                      customerId: sales.customerId,
                      invoiceNo: sales.invoiceNo,
                      paidAmount: sales.paymentMethod
                        ? sales.paymentMethod[0].paidAmount
                        : 0,
                      refundAmount: sales.paymentMethod
                        ? sales.paymentMethod[0].paidAmount
                        : 0,
                      itemid: sales.returnInfo[i].itemInfo,
                      returnId: sales._id,
                      itemInfo: [sales.returnInfo[i]],
                    });
                    let damageList = await damagedGoodsModel.find({
                      branchId: damagedGoods.branchId,
                    });
                    if (Array.isArray(damageList) && damageList.length > 0) {
                      damagedGoods.transNo =
                        damageList[damageList.length - 1].transNo + 1;
                    } else {
                      damagedGoods.transNo = 1;
                    }
                    let damagedresp = await damagedGoods.save();

                    if (common_service.isEmpty(damagedresp)) {
                      return damagedresp;
                    }
                  }
                } else if (element.reasonType == 2) {
                  stockdata.category = !common_service.isEmpty(product)
                    ? product.category
                    : null;
                  stockdata.subCategoryId =
                    !common_service.isEmpty(product) && stockdata.itemType != 0
                      ? product.subcategoryId
                      : null;

                  let stockExist = await stockModel.findOne({
                    branchId: stockdata.branchId,
                    itemId: stockdata.itemId,
                  });

                  if (!common_service.isEmpty(stockExist)) {
                    let stockFind = stockExist.stock.find(
                      (x) => x.dimension == stockdata.dimension
                    );
                    if (!isEmpty(stockFind)) {
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
                      stockExist.stock.push({
                        dimension: stockdata.dimension,
                        dimensionStock: stockdata.stock,
                      });
                    }
                    let stockdata1 = await stockExist.save();
                    if (!isEmpty(stockdata1)) {
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
                        orderNo: sales.transNo,
                        type: PREFIXES.SALESRETURN,
                        categoryId: !isEmpty(product) ? product.category : null,
                        subCategoryId:
                          !isEmpty(product) && stockdata.itemType != 0
                            ? product.subcategoryId
                            : null,
                        rate: stockdata.rate,
                      });
                      let data1 = await stockLogData.save();
                      if (isEmpty(data1)) {
                        return (res = {
                          data: { msg: "Error Saving Stock Updation To Log" },
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    } else {
                      return (res = {
                        data: { msg: "stock updation failed from billorder" },
                        status: STATUSCODES.UNPROCESSED,
                      });
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
                      let stockLogData = new stockLogModel({
                        itemType: stockdata.itemType,
                        itemId: stockdata.itemId,
                        stock: newStock.stock,
                        branchId: stockdata.branchId,
                        date: new Date(req.body.date).getTime(),
                        orderNo: sales.transNo,
                        type: PREFIXES.SALESRETURN,
                        categoryId: !isEmpty(product) ? product.category : null,
                        subCategoryId:
                          !isEmpty(product) && stockdata.itemType != 2
                            ? product.subcategoryId
                            : null,
                        rate: stockdata.rate,
                      });
                      let stocklogdata = await stockLogData.save();
                      if (isEmpty(stocklogdata)) {
                        return (res = {
                          data: { msg: "Error Saving Stock Updation To Log" },
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    } else {
                      return (res = {
                        data: { msg: "stock updation failed from billorder" },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  }
                }
              }
              for (let i = 0; i < req.body.returnInfo.length; i++) {
                let itemIndex = rtnInfo.findIndex(
                  (element) =>
                    element.itemInfo === req.body.returnInfo[i].itemInfo
                );
                let item = rtnInfo.find(
                  (element) =>
                    element.itemInfo === req.body.returnInfo[i].itemInfo
                );
                if (item != undefined) {
                  rtnInfo[itemIndex] = req.body.returnInfo[i];
                }
              }
              let returns = await orderreturnModel.findOneAndUpdate(
                { _id: sales._id },
                { $set: { returnInfo: rtnInfo } },
                { new: true }
              );
              if (req.body.paymentMethod != null) {
                let arr = [];
                let rtnpay = await returnPaymentModel.findOne({
                  purchasePk: sales._id,
                });
                if (rtnpay) {
                  let arr = rtnpay.paymentMethod,
                    totalAmount = rtnpay.totalAmount;
                  let total = 0;
                  for (let i = 0; i < req.body.paymentMethod.length; i++) {
                    req.body.paymentMethod[i].shiftId = shiftExist.shiftId;
                    total = total + req.body.paymentMethod[i].paidAmount;
                    arr.push(req.body.paymentMethod[i]);
                  }
                  await returnPaymentModel.findOneAndUpdate(
                    { _id: rtnpay._id },
                    { $set: { totalAmount, paymentMethod: arr } }
                  );
                } else {
                  let total = 0;
                  for (let i = 0; i < req.body.paymentMethod.length; i++) {
                    req.body.paymentMethod[i].shiftId = shiftExist.shiftId;
                    total = total + req.body.paymentMethod[i].paidAmount;
                  }
                  let newPayment = returnPaymentModel({
                    invoiceNo: `${PREFIXES.SALESRETURN + sales.transNo}`,
                    cus_id: sales.customerId,
                    date: sales.returnDate,
                    paymentMethod: req.body.paymentMethod,
                    totalAmount: total,
                    branchId: sales.branchId,
                    purchasePk: sales.purchasePk,
                  });
                  await newPayment.save();
                }
              }
              let order = await orderModel.findOne({ _id: sales.purchasePk });
              if (req.body.billPaymentMethod != null) {
                let payment = await paymentModel.findOne({
                  purchasePk: order._id,
                });
                let discount =
                  req.body.discount != null
                    ? req.body.discount
                    : order.discount;
                let shipmentCharge =
                  req.body.shipmentCharge != null
                    ? req.body.shipmentCharge
                    : order.shipmentCharge;
                if (payment) {
                  let tot = req.body.total + shipmentCharge - discount;
                  for (let i = 0; i < req.body.billPaymentMethod.length; i++) {
                    req.body.billPaymentMethod[i].shiftId = shiftExist.shiftId;
                    req.body.billPaymentMethod[i].uuid =
                      common_service.generateUuid();
                    payment.paymentMethod.push(req.body.billPaymentMethod[i]);
                  }
                  payment.totalAmount = tot;
                  payment = await payment.save();
                  let paidAmount = 0;
                  for (let i = 0; i < payment.paymentMethod.length; i++) {
                    paidAmount =
                      paidAmount + payment.paymentMethod[i].paidAmount;
                  }
                  let balance = payment.totalAmount - paidAmount;
                  let credit = await creditModel.findOne({
                    purchasePk: order._id,
                  });
                  if (credit) {
                    let netAmount = req.body.total + shipmentCharge;
                    if (balance > 0) {
                      await creditModel.findOneAndUpdate(
                        { _id: credit._id },
                        {
                          $set: { balance, paidAmount, netAmount, discount },
                        },
                        { new: true }
                      );
                    }
                    if (balance <= 0) {
                      await creditModel.findOneAndUpdate(
                        { _id: credit._id },
                        {
                          $set: {
                            balance: 0,
                            paidAmount,
                            netAmount,
                            discount,
                            status: CREDITSTATUS.COM,
                          },
                        },
                        { new: true }
                      );
                    }
                  }
                } else {
                  for (let i = 0; i < req.body.billPaymentMethod.length; i++) {
                    req.body.billPaymentMethod[i].shiftId = shiftExist.shiftId;
                    req.body.billPaymentMethod[i].uuid =
                      common_service.generateUuid();
                  }
                  let netAmount = req.body.total + shipmentCharge;
                  let paymentData = paymentModel({
                    invoiceNo:
                      branch.storeCode.substr(3) +
                      PREFIXES.SALESINV +
                      req.decode.prefix.substring(0, 2) +
                      orderExist.orderId,
                    cus_id: order.cus_id,
                    date: new Date(req.body.date).getTime(),
                    paymentMethod: req.body.billPaymentMethod,
                    totalAmount: req.body.total + shipmentCharge - discount,
                    branchId: order.branchId,
                    purchasePk: order._id,
                  });
                  let payment = await paymentData.save();
                  let paidAmount = 0;
                  for (let i = 0; i < payment.paymentMethod.length; i++) {
                    paidAmount =
                      paidAmount + payment.paymentMethod[i].paidAmount;
                  }
                  let balance = payment.totalAmount - paidAmount;
                  let credit = await creditModel.findOne({
                    purchasePk: order._id,
                  });
                  if (credit) {
                    if (balance > 0) {
                      await creditModel.findOneAndUpdate(
                        { _id: credit._id },
                        {
                          $set: {
                            balance,
                            paidAmount,
                            netAmount: req.body.total + shipmentCharge,
                            discount,
                          },
                        },
                        { new: true }
                      );
                    }
                    if (balance <= 0) {
                      await creditModel.findOneAndUpdate(
                        { _id: credit._id },
                        {
                          $set: {
                            balance: 0,
                            paidAmount,
                            netAmount: req.body.total + shipmentCharge,
                            discount,
                            status: CREDITSTATUS.COM,
                          },
                        },
                        { new: true }
                      );
                    }
                  }
                }
              }

              if (req.body.paymentMethod != null) {
                let total = 0;
                for (let i = 0; i < req.body.paymentMethod.length; i++) {
                  req.body.paymentMethod[i].shiftId = shiftExist.shiftId;
                  total = total + req.body.paymentMethod[i].paidAmount;
                }
                let paymentData = new returnPaymentModel({
                  invoiceNo: PREFIXES.SALESRETURN + returns.transNo,
                  cus_id: returns.customerId,
                  date: returns.returnDate,
                  paymentMethod: req.body.paymentMethod,
                  totalAmount: total,
                  branchId: returns.branchId,
                  purchasePk: returns._id,
                });
                paymentResponse = await paymentData.save();
                returns = await orderreturnModel.findOneAndUpdate(
                  { _id: sales._id },
                  { $set: { paymentMethod: paymentData.paymentMethod } },
                  { new: true }
                );
                if (req.body.isWallet == true) {
                  let walletExist = await walletModel.findOne({
                    cus_id: order.cus_id,
                  });
                  if (!isEmpty(walletExist)) {
                    if (walletExist.wallet == 0 && req.wallet < 0) {
                      return (res = {
                        data: {
                          msg: `Wallet Amount is ${walletExist.amount}`,
                        },
                        status: STATUSCODES.FORBIDDEN,
                      });
                    } else {
                      walletExist.amount = walletExist.amount + total;

                      let data = await walletExist.save();
                      if (data) {
                        let walletLogData = walletLogModel({
                          cus_id: order.cus_id,
                          date: new Date(req.body.date).getTime(),
                          amount: total,
                          invoiceNo: PREFIXES.SALESINV + order.orderId,
                          branchId: branch.storeCode,
                          purchasePk: order._id,
                        });
                        let walletlogdata = await walletLogData.save();
                        if (isEmpty(walletlogdata)) {
                          return (res = {
                            data: {
                              msg: "Error Saving Wallet Updation To Log",
                            },
                            status: STATUSCODES.UNPROCESSED,
                          });
                        }
                      } else {
                        return (res = {
                          data: {},
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    }
                  } else {
                    let newWallet = walletModel({
                      cus_id: order.cus_id,
                      amount: total,
                      //purchasePk: req.body.orderId,
                    });
                    let data = await newWallet.save();
                    if (data) {
                      let walletLogData = new walletLogModel({
                        cus_id: order.cus_id,
                        date: new Date(req.body.date).getTime(),
                        amount: total,
                        invoiceNo: PREFIXES.SALESINV + order.orderId,
                        branchId: branch.storeCode,
                        purchasePk: order._id,
                      });
                      let walletData = await walletLogData.save();
                      if (isEmpty(walletData)) {
                        return (res = {
                          data: {
                            msg: "Error Saving wallet Updation To Log",
                          },
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    } else {
                      return (res = {
                        data: {},
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  }
                }
                let discount =
                  req.body.discount != null
                    ? req.body.discount
                    : order.discount;
                let shipmentCharge =
                  req.body.shipmentCharge != null
                    ? req.body.shipmentCharge
                    : order.shipmentCharge;
                let payment = await paymentModel.findOne({
                  purchasePk: order._id,
                });
                if (payment) {
                  payment.totalAmount =
                    req.body.total + shipmentCharge - discount;
                  if (payment.returnLog != undefined) {
                    payment.returnLog.push({
                      returnPaymentPk: paymentResponse._id,
                      returnAmount: paymentResponse.totalAmount,
                      date: paymentResponse.date,
                    });
                  } else {
                    payment.returnLog = [];
                    payment.returnLog.push({
                      returnPaymentPk: paymentResponse._id,
                      returnAmount: paymentResponse.totalAmount,
                      date: paymentResponse.date,
                    });
                  }
                  await payment.save();
                }
                let credit = await creditModel.findOne({
                  purchasePk: order._id,
                });
                if (credit) {
                  if (paymentResponse != null) {
                    let returnAmount;
                    if (credit.returnAmount != undefined) {
                      returnAmount =
                        credit.returnAmount + paymentResponse.totalAmount;
                    } else {
                      returnAmount = paymentResponse.totalAmount;
                    }
                    let balance = credit.balance - returnTotal;
                    if (balance < 0) {
                      await creditModel.findOneAndUpdate(
                        { purchasePk: order._id },
                        {
                          $set: {
                            balance: 0,
                            netAmount: req.body.total + shipmentCharge,
                            discount,
                            returnAmount,
                            status: CREDITSTATUS.COM,
                          },
                        },
                        { new: true }
                      );
                    } else if (balance > 0) {
                      await creditModel.findOneAndUpdate(
                        { purchasePk: order._id },
                        {
                          $set: {
                            balance,
                            netAmount: req.body.total + shipmentCharge,
                            discount,
                            returnAmount,
                          },
                        },
                        { new: true }
                      );
                    }
                  }
                }
              }

              if (
                req.body.billPaymentMethod == null &&
                req.body.paymentMethod == null
              ) {
                let credit = await creditModel.findOne({
                  purchasePk: order._id,
                });
                let discount =
                  req.body.discount != null
                    ? req.body.discount
                    : order.discount;
                let shipmentCharge =
                  req.body.shipmentCharge != null
                    ? req.body.shipmentCharge
                    : order.shipmentCharge;
                let netAmount = req.body.total + shipmentCharge;
                if (credit) {
                  let balance = credit.balance - (returnTotal + discount);
                  if (balance <= 0) {
                    await creditModel.findOneAndUpdate(
                      { purchasePk: order._id },
                      {
                        $set: {
                          balance: 0,
                          netAmount,
                          discount,
                          returnAmount: returnTotal,
                          status: CREDITSTATUS.COM,
                        },
                      },
                      { new: true }
                    );
                  } else if (balance > 0) {
                    await creditModel.findOneAndUpdate(
                      { purchasePk: order._id },
                      {
                        $set: {
                          balance,
                          netAmount,
                          discount,
                          returnAmount: returnTotal,
                        },
                      },
                      { new: true }
                    );
                  }
                }
                let payment = await paymentModel.findOne({
                  purchasePk: order._id,
                });
                if (payment) {
                  payment.totalAmount = netAmount - discount;
                  if (payment.returnLog != undefined) {
                    payment.returnLog.push({
                      returnPaymentPk: null,
                      returnAmount: returnTotal,
                      date: new Date(req.body.date).getTime(),
                    });
                  } else {
                    payment.returnLog = [];
                    payment.returnLog.push({
                      returnPaymentPk: null,
                      returnAmount: returnAmount,
                      date: new Date(req.body.date).getTime(),
                    });
                  }
                  await payment.save();
                }
              }
              if (order) {
                for (let i = 0; i < req.body.returnInfo.length; i++) {
                  let item = order.orderInfo.find(
                    (x) => x.uuid == req.body.returnInfo[i].uuid
                  );
                  let itemIndex = order.orderInfo.findIndex(
                    (x) => x.uuid == req.body.returnInfo[i].uuid
                  );
                  if (item != undefined) {
                    item.returnQty = req.body.returnInfo[i].returnQty;
                    if (item.quantity == req.body.returnInfo[i].returnQty)
                      item.status = "returned";
                    order.orderInfo[itemIndex] = item;
                  }
                }
                let discount =
                  req.body.discount != null
                    ? req.body.discount
                    : order.discount;
                let shipmentCharge =
                  req.body.shipmentCharge != null
                    ? req.body.shipmentCharge
                    : order.shipmentCharge;
                let newOrder = await orderModel.findOneAndUpdate(
                  { _id: order._id },
                  {
                    $set: {
                      orderInfo: order.orderInfo,
                      discount,
                      shipmentCharge,
                    },
                  },
                  { new: true }
                );
                let count = 0;
                for (let i = 0; i < newOrder.orderInfo.length; i++) {
                  if (
                    newOrder.orderInfo[i].status != undefined &&
                    newOrder.orderInfo[i].status == "returned"
                  )
                    count = count + 1;
                }
                if (count == newOrder.orderInfo.length)
                  await orderModel.findOneAndUpdate(
                    { _id: order._id },
                    { $set: { returnStatus: "returned" } },
                    { new: true }
                  );
              }
              let newlog = new logModel({
                date: new Date().getTime(),
                emp_id: req.decode._id,
                type: LOG.SALES_RETURN_ADD.type,
                description: LOG.SALES_RETURN_ADD.description,
                branchId: sales.branchId,
                link: {},
                payload: { token: req.headers.authorization, body: req.body },
              });
              let logresponse = await newlog.save();
              if (logresponse == null) {
                console.log("log save faild");
              }
              return (res = { data: returns, status: STATUSCODES.SUCCESS });
            }
          } else {
            return (res = { data: {}, status: STATUSCODES.NOTFOUND });
          }
        } else {
          return (res = { data: { msg: "not acceptable" } });
        }
      } else {
        return (res = {
          data: { msg: `No Active Shifts For ${req.body.branchId}` },
          status: STATUSCODES.NOTFOUND,
        });
      }
    } else {
      return (res = {
        data: { msg: "can not find branch" },
        status: STATUSCODES.NOTFOUND,
      });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 18-07-2023
module.exports.paymentReport = async (req) => {
  const { paymentModel } = conn.payment(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  const supplierModel = conn.supplier(req.decode.db);
  try {
    let rslist = [];
    let paymentList = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        paymentList = await paymentModel.find({
          branchId: req.body.branchId,
          invoiceNo: { $regex: PREFIXES.SALESINV },
        });
      } else {
        paymentList = await paymentModel.find({
          invoiceNo: { $regex: PREFIXES.SALESINV },
        });
      }
    } else {
      paymentList = await paymentModel.find({
        branchId: req.body.branchId,
        invoiceNo: { $regex: PREFIXES.SALESINV },
      });
    }
    if (paymentList.length > 0) {
      for (let i = 0; i < paymentList.length; i++) {
        const element = paymentList[i];
        let resobj = {
          branchId: "no code",
          locationName: "no location name",
          customer: "no customer name",
          mobileNo: "no mobile no",
          invoiceNo: "no invoice no",
          totalAmount: 0,
          date: [],
          paymentMethod: [],
        };
        let branchExist = await branchModel.findOne({
          storeCode: element.branchId,
        });
        if (branchExist != null) {
          resobj.branchId = branchExist.storeCode;
          resobj.locationName = branchExist.branchName;
        }
        if (common_service.isObjectId(element.cus_id)) {
          let customerExist = await customerModel.findOne({
            _id: element.cus_id,
          });
          if (customerExist != null) {
            resobj.customer = customerExist.name;
            resobj.mobileNo = customerExist.mobileNo;
          }
        }
        resobj.invoiceNo = element.invoiceNo;
        resobj.totalAmount = element.totalAmount;
        if (element.paymentMethod.length > 0) {
          for (let j = 0; j < element.paymentMethod.length; j++) {
            if (req.body.fromDate && req.body.endDate) {
              if (
                new Date(req.body.fromDate).getTime() <=
                  new Date(element.paymentMethod[j].date).getTime() &&
                new Date(req.body.endDate).getTime() >=
                  new Date(element.paymentMethod[j].date).getTime()
              ) {
                resobj.date.push(element.paymentMethod[j].date);
                resobj.paymentMethod.push({
                  type: element.paymentMethod[j].type,
                  paidAmount: element.paymentMethod[j].paidAmount,
                });
              }
            }
          }
        }
        if (resobj.date.length > 0 && resobj.paymentMethod.length > 0) {
          rslist.push(resobj);
        }
      }
    }
    return (res = { data: rslist, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 18/07/23
module.exports.dailyCashCardReport = async (req) => {
  const { orderModel, salesReturnModel } = conn.order(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { paymentModel, returnPaymentModel } = conn.payment(req.decode.db);
  const { unitModel } = conn.product(req.decode.db);
  const { shiftLogModel } = conn.settings(req.decode.db);
  const { outletExpenseModel, expenseTypeModel, pettycashModel } = conn.expense(
    req.decode.db
  );
  const { upiModel, cardModel, chequeModel, denominationModel } = conn.settings(
    req.decode.db
  );
  try {
    //CASE 01
    let branch = await branchModel.findOne({ storeCode: req.body.branchId });
    if (!common_service.checkObject(branch)) {
      return (res = {
        data: { msg: " no branch detected" },
        status: STATUSCODES.NOTFOUND,
      });
    }
    if (req.body.branchId && req.body.fromDate && req.body.endDate) {
      let resobj = {
        location: "no location",
        list: [],
        expensetable: [],
        foodItems: {
          list: [],
          rateTotal: 0,
          amountTotal: 0,
        },
        cashInHandAfterExpense: 0,
        totalSaleWoExpense: 0,
        sessionTotal: {
          total: 0,
          amount: 0,
          commission: 0,
          vatTotal: 0,
          walletTotal: 0,
        },
        amountafterreturn: 0,
      };
      let shiftList = await shiftLogModel.find({
        branchId: req.body.branchId,
        startDate: {
          $gte: new Date(req.body.fromDate).getTime(),
          $lte: new Date(req.body.endDate).getTime(),
        },
      });
      for (let i = 0; i < shiftList.length; i++) {
        const element = shiftList[i];
        let shiftObj = {};
        shiftObj.shiftId = `SHIFT${element.shiftId}`;
        shiftObj.shiftopeningTime = common_service.newdateconvert(
          element.startDate
        );
        shiftObj.shiftclosingTime =
          typeof element.endDate == "number"
            ? common_service.newdateconvert(element.endDate)
            : "Active Shift";

        shiftObj.paidSummary = {
          orderList: [],
          returnList: [],
          chequeList: { list: [], total: 0 },
        };
        let payments = await paymentModel.find({
          "paymentMethod.shiftId": element.shiftId,
        });
        payments = payments.filter(
          (x) => x.branchId == branch._id || x.branchId == branch.storeCode
        );
        let returnPayments = await returnPaymentModel.find({
          "paymentMethod.shiftId": element.shiftId,
          branchId: req.body.branchId,
        });
        for (let j = 0; j < payments.length; j++) {
          const paymentelement = payments[j];
          let ordobj = await orderModel.findOne({
            _id: paymentelement.purchasePk,
          });
          if (
            Array.isArray(paymentelement.paymentMethod) &&
            paymentelement.paymentMethod.length > 0
          ) {
            paymentelement.paymentMethod = paymentelement.paymentMethod.filter(
              (x) => x.shiftId == element.shiftId
            );
            for (let k = 0; k < paymentelement.paymentMethod.length; k++) {
              const payobj = paymentelement.paymentMethod[k];
              if (common_service.checkObject(ordobj)) {
                let respobj = {};
                let vatTotal = 0;
                respobj.commissionTotal = 0;
                respobj.orderInfo = [];
                if (
                  payobj.type != null &&
                  payobj.type.toLocaleLowerCase() !=
                    PAYMENTTYPES.CHEQ.toLocaleLowerCase()
                ) {
                  if (shiftObj.paidSummary.orderList.length == 0) {
                    respobj.walletTotal = 0;
                    respobj.walletTotal =
                      respobj.walletTotal + ordobj.usedWallet;
                    respobj.vatTotal = 0;
                    if (
                      ordobj.orderInfo != undefined &&
                      Array.isArray(ordobj.orderInfo) &&
                      ordobj.orderInfo.length > 0
                    ) {
                      ordobj.orderInfo.map((x) => {
                        if (typeof x.vatorgst == "number") {
                          respobj.vatTotal = respobj.vatTotal + x.vatorgst;
                          vatTotal = vatTotal + x.vatorgst;
                        }
                      });
                    }
                    if (payobj.type.toLowerCase() == PAYMENTTYPES.CASH) {
                      respobj.type =
                        payobj.type != null ? payobj.type : "No Type";
                      respobj.paidAmount = payobj.paidAmount;
                      respobj.commissionTotal = 0;
                      respobj.balanceTotal =
                        respobj.paidAmount - respobj.commissionTotal;
                      if (req.body.isDetails) {
                        respobj.orderInfo.push({
                          orderId:
                            branch.storeCode.substr(3) +
                            PREFIXES.SALESINV +
                            ordobj.orderId,
                          paidAmount: payobj.paidAmount,
                          commission: 0,
                          balance: payobj.paidAmount,
                          wallet: ordobj.usedWallet,
                          vatTotal,
                        });
                      }
                    } else if (payobj.type.toLowerCase() == PAYMENTTYPES.UPIS) {
                      let commissionResp = await upiModel.findOne({
                        upiName: payobj.vendor,
                      });
                      respobj.type =
                        payobj.vendor != null ? payobj.vendor : "No Vendor";
                      respobj.paidAmount = payobj.paidAmount;
                      respobj.commissionTotal = !isEmpty(commissionResp)
                        ? payobj.paidAmount *
                          ((!isEmpty(commissionResp)
                            ? commissionResp.commission
                            : 0) /
                            100)
                        : 0;
                      respobj.balanceTotal =
                        respobj.paidAmount - respobj.commissionTotal;
                      if (req.body.isDetails) {
                        respobj.orderInfo.push({
                          orderId:
                            branch.storeCode.substr(3) +
                            PREFIXES.SALESINV +
                            ordobj.orderId,
                          paidAmount: payobj.paidAmount,
                          commission: !isEmpty(commissionResp)
                            ? payobj.paidAmount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100)
                            : 0,
                          balance:
                            payobj.paidAmount -
                            payobj.paidAmount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100),
                          wallet: ordobj.usedWallet,
                          vatTotal,
                        });
                      }
                    } else if (payobj.type.toLowerCase() == PAYMENTTYPES.CARD) {
                      let commissionResp = await cardModel.findOne({
                        cardName: payobj.vendor,
                      });
                      respobj.type =
                        payobj.vendor != null ? payobj.vendor : "No Vendor";
                      respobj.paidAmount = payobj.paidAmount;
                      respobj.commissionTotal = !isEmpty(commissionResp)
                        ? payobj.paidAmount *
                          ((!isEmpty(commissionResp)
                            ? commissionResp.commission
                            : 0) /
                            100)
                        : 0;
                      respobj.balanceTotal =
                        respobj.paidAmount - respobj.commissionTotal;
                      if (req.body.isDetails) {
                        respobj.orderInfo.push({
                          orderId:
                            branch.storeCode.substr(3) +
                            PREFIXES.SALESINV +
                            ordobj.orderId,
                          paidAmount: payobj.paidAmount,
                          commission: !isEmpty(commissionResp)
                            ? payobj.paidAmount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100)
                            : 0,
                          balance:
                            payobj.paidAmount -
                            payobj.paidAmount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100),
                          wallet: ordobj.usedWallet,
                          vatTotal,
                        });
                      }
                    }

                    shiftObj.paidSummary.orderList.push(respobj);
                  } else {
                    let vatTotal = 0;
                    if (payobj.type.toLowerCase() == PAYMENTTYPES.CASH) {
                      typeExist = shiftObj.paidSummary.orderList.find(
                        (x) => x.type.toLowerCase() == payobj.type.toLowerCase()
                      );
                      if (!isEmpty(typeExist)) {
                        if (
                          ordobj.orderInfo != undefined &&
                          Array.isArray(ordobj.orderInfo) &&
                          ordobj.orderInfo.length > 0
                        ) {
                          ordobj.orderInfo.map((x) => {
                            if (typeof x.vatorgst == "number") {
                              typeExist.vatTotal =
                                typeExist.vatTotal + x.vatorgst;
                              vatTotal = vatTotal + x.vatorgst;
                            }
                          });
                        }
                        typeExist.paidAmount =
                          typeExist.paidAmount + payobj.paidAmount;
                        typeExist.commissionTotal = 0;
                        typeExist.balanceTotal =
                          typeExist.paidAmount - typeExist.commissionTotal;
                        if (req.body.isDetails) {
                          let prevorder = typeExist.orderInfo.find(
                            (n) =>
                              n.orderId ==
                              branch.storeCode.substr(3) +
                                PREFIXES.SALESINV +
                                ordobj.orderId
                          );
                          if (!common_service.checkObject(prevorder)) {
                            typeExist.walletTotal =
                              typeExist.walletTotal + ordobj.usedWallet;
                          }
                          typeExist.orderInfo.push({
                            orderId:
                              branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId,
                            paidAmount: payobj.paidAmount,
                            commission: 0,
                            balance: payobj.paidAmount - 0,
                            wallet: common_service.checkObject(prevorder)
                              ? 0
                              : ordobj.usedWallet,
                            vatTotal,
                          });
                        }
                      } else {
                        respobj.vatTotal = 0;
                        if (
                          ordobj.orderInfo != undefined &&
                          Array.isArray(ordobj.orderInfo) &&
                          ordobj.orderInfo.length > 0
                        ) {
                          ordobj.orderInfo.map((x) => {
                            if (typeof x.vatorgst == "number") {
                              respobj.vatTotal = respobj.vatTotal + x.vatorgst;
                              vatTotal = vatTotal + x.vatorgst;
                            }
                          });
                        }
                        respobj.walletTotal = 0;
                        respobj.walletTotal =
                          respobj.walletTotal + ordobj.usedWallet;
                        respobj.type =
                          payobj.type != null ? payobj.type : "No Type";
                        respobj.paidAmount = payobj.paidAmount;
                        respobj.commissionTotal = 0;
                        respobj.balanceTotal =
                          respobj.paidAmount - respobj.commissionTotal;
                        if (req.body.isDetails) {
                          respobj.orderInfo.push({
                            orderId:
                              branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId,
                            paidAmount: payobj.paidAmount,
                            commission: 0,
                            balance: payobj.paidAmount - 0,
                            wallet: ordobj.usedWallet,
                            vatTotal,
                          });
                        }
                        shiftObj.paidSummary.orderList.push(respobj);
                      }
                    } else if (payobj.type.toLowerCase() == PAYMENTTYPES.CARD) {
                      typeExist = shiftObj.paidSummary.orderList.find(
                        (x) => x.type == payobj.vendor
                      );
                      let commissionResp = await cardModel.findOne({
                        cardName: payobj.vendor,
                      });

                      if (!isEmpty(typeExist)) {
                        if (
                          ordobj.orderInfo != undefined &&
                          Array.isArray(ordobj.orderInfo) &&
                          ordobj.orderInfo.length > 0
                        ) {
                          ordobj.orderInfo.map((x) => {
                            if (typeof x.vatorgst == "number") {
                              typeExist.vatTotal =
                                typeExist.vatTotal + x.vatorgst;
                              vatTotal = vatTotal + x.vatorgst;
                            }
                          });
                        }
                        typeExist.paidAmount =
                          typeExist.paidAmount + payobj.paidAmount;
                        typeExist.commissionTotal =
                          typeExist.commissionTotal +
                          (!isEmpty(commissionResp)
                            ? payobj.paidAmount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100)
                            : 0);
                        typeExist.balanceTotal =
                          typeExist.paidAmount - typeExist.commissionTotal;
                        let prevorder = typeExist.orderInfo.find(
                          (n) =>
                            n.orderId ==
                            branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId
                        );
                        if (!common_service.checkObject(prevorder)) {
                          typeExist.walletTotal =
                            typeExist.walletTotal + ordobj.usedWallet;
                        }
                        if (req.body.isDetails) {
                          typeExist.orderInfo.push({
                            orderId:
                              branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId,
                            paidAmount: payobj.paidAmount,
                            commission: !isEmpty(commissionResp)
                              ? payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100)
                              : 0,
                            balance:
                              payobj.paidAmount -
                              payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100),
                            wallet: common_service.checkObject(prevorder)
                              ? 0
                              : ordobj.usedWallet,
                            vatTotal,
                          });
                        }
                      } else {
                        respobj.vatTotal = 0;
                        if (
                          ordobj.orderInfo != undefined &&
                          Array.isArray(ordobj.orderInfo) &&
                          ordobj.orderInfo.length > 0
                        ) {
                          ordobj.orderInfo.map((x) => {
                            if (typeof x.vatorgst == "number") {
                              respobj.vatTotal = respobj.vatTotal + x.vatorgst;
                              vatTotal = vatTotal + x.vatorgst;
                            }
                          });
                        }
                        respobj.walletTotal = 0;
                        respobj.walletTotal =
                          respobj.walletTotal + ordobj.usedWallet;
                        respobj.type =
                          payobj.vendor != null ? payobj.vendor : "No Vendor";
                        respobj.paidAmount = payobj.paidAmount;
                        respobj.commissionTotal = !isEmpty(commissionResp)
                          ? payobj.paidAmount *
                            ((!isEmpty(commissionResp)
                              ? commissionResp.commission
                              : 0) /
                              100)
                          : 0;
                        respobj.balanceTotal =
                          respobj.paidAmount - respobj.commissionTotal;
                        if (req.body.isDetails) {
                          respobj.orderInfo.push({
                            orderId:
                              branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId,
                            paidAmount: payobj.paidAmount,
                            commission: !isEmpty(commissionResp)
                              ? payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100)
                              : 0,
                            balance:
                              payobj.paidAmount -
                              payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100),
                            wallet: ordobj.usedWallet,
                            vatTotal,
                          });
                        }
                        shiftObj.paidSummary.orderList.push(respobj);
                      }
                    } else if (payobj.type.toLowerCase() == PAYMENTTYPES.UPIS) {
                      typeExist = shiftObj.paidSummary.orderList.find(
                        (x) => x.type == payobj.vendor
                      );
                      let commissionResp = await upiModel.findOne({
                        upiName: payobj.vendor,
                      });
                      if (isEmpty(commissionResp)) {
                        commissionResp = { commission: 0 };
                      }
                      if (!isEmpty(typeExist)) {
                        typeExist.paidAmount =
                          typeExist.paidAmount + payobj.paidAmount;
                        typeExist.commissionTotal =
                          typeExist.commissionTotal +
                          (!isEmpty(commissionResp)
                            ? payobj.paidAmount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100)
                            : 0);
                        typeExist.balanceTotal =
                          typeExist.paidAmount - typeExist.commissionTotal;
                        if (req.body.isDetails) {
                          typeExist.orderInfo.push({
                            orderId:
                              branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId,
                            paidAmount: payobj.paidAmount,
                            commission: !isEmpty(commissionResp)
                              ? payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100)
                              : 0,

                            balance:
                              payobj.paidAmount -
                              payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100),
                          });
                        }
                      } else {
                        respobj.type =
                          payobj.vendor != null ? payobj.vendor : "No Vendor";
                        respobj.paidAmount = payobj.paidAmount;
                        respobj.commissionTotal = !isEmpty(commissionResp)
                          ? payobj.paidAmount *
                            ((!isEmpty(commissionResp)
                              ? commissionResp.commission
                              : 0) /
                              100)
                          : 0;
                        respobj.balanceTotal =
                          respobj.paidAmount - respobj.commissionTotal;
                        if (req.body.isDetails) {
                          respobj.orderInfo.push({
                            orderId:
                              branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId,
                            paidAmount: payobj.paidAmount,
                            commission: !isEmpty(commissionResp)
                              ? payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100)
                              : 0,
                            balance:
                              payobj.paidAmount -
                              payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100),
                          });
                        }
                        shiftObj.paidSummary.orderList.push(respobj);
                      }
                    }
                  }
                }
                if (req.body.isCategory) {
                  for (let l = 0; l < ordobj?.orderInfo.length; l++) {
                    const ordelement = ordobj.orderInfo[l];

                    if (ordelement.type == 1) {
                      let prodobj = { productName: "no name" };
                      let product = {};
                      if (common_service.isObjectId(ordelement.itemInfo)) {
                        product = await foodModel.findOne({
                          _id: ordelement.itemInfo,
                        });
                      }
                      if (common_service.checkObject(product)) {
                        prodobj.productName = product.prod_name;
                      }
                      let typeExist = resobj.foodItems.list.find(
                        (x) =>
                          x.productName == prodobj.productName &&
                          x.amount == ordelement.rate
                      );
                      if (!isEmpty(typeExist)) {
                        if (typeExist.rate == ordelement.rate) {
                          typeExist.qty = typeExist.qty + ordelement.quantity;
                          typeExist.amount = typeExist.rate * typeExist.qty;
                        } else {
                          prodobj.unit = ordelement.unit;
                          prodobj.rate = ordelement.rate;
                          prodobj.qty = ordelement.quantity;
                          prodobj.amount = prodobj.rate * prodobj.qty;
                          resobj.foodItems.list.push(prodobj);
                        }
                      } else {
                        prodobj.rate = ordelement.rate;
                        prodobj.unit = ordelement.dimension;
                        prodobj.qty = ordelement.quantity;
                        prodobj.amount = prodobj.rate * prodobj.qty;
                        resobj.foodItems.list.push(prodobj);
                      }
                    }
                  }
                }
                if (
                  payobj.type != null &&
                  payobj.type.toLocaleLowerCase() ==
                    PAYMENTTYPES.CHEQ.toLowerCase()
                ) {
                  respobj.orderId =
                    branch.storeCode.substr(3) +
                    PREFIXES.SALESINV +
                    ordobj.orderId;
                  respobj.bankName =
                    typeof payobj.vendor == "string"
                      ? payobj.vendor
                      : "No Vendor";
                  respobj.date = payobj.date;
                  respobj.chequedate =
                    typeof payobj.chequeDate == "string"
                      ? payobj.chequeDate
                      : respobj.date;
                  respobj.paidAmount =
                    typeof payobj.paidAmount == "number"
                      ? payobj.paidAmount
                      : 0;
                  shiftObj.paidSummary.chequeList.total =
                    shiftObj.paidSummary.chequeList.total + respobj.paidAmount;
                  shiftObj.paidSummary.chequeList.list.push(respobj);
                }
              }
            }
          }
        }
        for (let j = 0; j < returnPayments.length; j++) {
          const returnpaymentelement = returnPayments[j];
          if (
            Array.isArray(returnpaymentelement.paymentMethod) &&
            returnpaymentelement.paymentMethod.length > 0
          ) {
            returnpaymentelement.paymentMethod =
              returnpaymentelement.paymentMethod.filter(
                (x) => x.shiftId == element.shiftId
              );
            for (
              let k = 0;
              k < returnpaymentelement.paymentMethod.length;
              k++
            ) {
              const payobj = returnpaymentelement.paymentMethod[k];
              let respobj = {};
              respobj.orderInfo = [];
              respobj.commissionTotal = 0;
              if (shiftObj.paidSummary.returnList.length == 0) {
                respobj.type = payobj.type != null ? payobj.type : "No Type";
                respobj.paidAmount = payobj.paidAmount;
                respobj.balanceTotal =
                  respobj.paidAmount - respobj.commissionTotal;
                if (req.body.isDetails) {
                  respobj.orderInfo.push({
                    orderId:
                      branch.storeCode.substr(3) +
                      req.decode.prefix.substring(0, 2) +
                      returnPayments[k].invoiceNo,
                    paidAmount: payobj.paidAmount,
                    commission: 0,
                    balance: payobj.paidAmount,
                    type: payobj.type,
                  });
                }

                shiftObj.paidSummary.returnList.push(respobj);
              } else {
                if (payobj.type.toLowerCase() == PAYMENTTYPES.CASH) {
                  typeExist = shiftObj.paidSummary.returnList.find(
                    (x) => x.type.toLowerCase() == payobj.type.toLowerCase()
                  );

                  if (!isEmpty(typeExist)) {
                    typeExist.paidAmount =
                      typeExist.paidAmount + payobj.paidAmount;
                    typeExist.balanceTotal = typeExist.paidAmount - 0;
                    if (req.body.isDetails) {
                      let prevorder = typeExist.orderInfo.find(
                        (n) =>
                          n.orderId ==
                          branch.storeCode.substr(3) +
                            req.decode.prefix.substring(0, 2) +
                            returnPayments[k].invoiceNo
                      );
                      if (isEmpty(prevorder)) {
                        typeExist.orderInfo.push({
                          orderId:
                            branch.storeCode.substr(3) +
                            req.decode.prefix.substring(0, 2) +
                            returnPayments[k].invoiceNo,
                          paidAmount: payobj.paidAmount,
                          commission: 0,
                          balance: payobj.paidAmount - 0,
                        });
                      } else {
                        prevorder.paidAmount =
                          prevorder.paidAmount + payobj.paidAmount;
                        prevorder.commission = 0;
                        prevorder.balance =
                          prevorder.paidAmount - prevorder.commission;
                      }
                    }
                  } else {
                    respobj.type =
                      payobj.type != null ? payobj.type : "No Type";
                    respobj.paidAmount = payobj.paidAmount;
                    respobj.commissionTotal = 0;
                    respobj.balanceTotal =
                      respobj.paidAmount - respobj.commissionTotal;

                    if (req.body.isDetails) {
                      respobj.orderInfo.push({
                        orderId:
                          branch.storeCode.substr(3) +
                          req.decode.prefix.substring(0, 2) +
                          PREFIXES.WORKORDER +
                          woobj.orderNo,
                        paidAmount: payobj.paidAmount,
                        commission: 0,
                        balance: payobj.paidAmount - 0,
                      });
                    }

                    shiftObj.paidSummary.returnList.push(respobj);
                  }
                }
              }
            }
          }
        }
        if (req.body.isExpense) {
          let expensetableExist = await outletExpenseModel.find({
            branchId: req.body.branchId,
            shiftId: element.shiftId,
          });
          if (
            Array.isArray(expensetableExist) &&
            expensetableExist.length > 0
          ) {
            for (let s = 0; s < expensetableExist.length; s++) {
              let typeexpenseExist = await expenseTypeModel.findOne({
                _id: expensetableExist[s].expenseType,
              });
              resobj.cashInHandAfterExpense =
                resobj.cashInHandAfterExpense - expensetableExist[s].amount;
              resobj.expensetable.push({
                expenseName: typeexpenseExist.expenseType,
                amount: expensetableExist[s].amount,
                commission: 0,
                balance: 0,
              });
            }
          }
        }
        let orderList = [];
        shiftObj.paidSummary.orderList.map((x) => {
          resobj.amountafterreturn = resobj.amountafterreturn + x.paidAmount;
          if (x.type.toLowerCase() == PAYMENTTYPES.CASH.toLocaleLowerCase()) {
            resobj.cashInHandAfterExpense =
              resobj.cashInHandAfterExpense + x.paidAmount;
          }
          resobj.totalSaleWoExpense = resobj.totalSaleWoExpense + x.paidAmount;
          resobj.sessionTotal.amount =
            resobj.sessionTotal.amount + x.paidAmount;
          resobj.sessionTotal.commission =
            resobj.sessionTotal.commission + x.commissionTotal;
          resobj.sessionTotal.total =
            resobj.sessionTotal.total + x.balanceTotal;
          resobj.sessionTotal.walletTotal =
            resobj.sessionTotal.walletTotal + x.walletTotal;
          resobj.sessionTotal.vatTotal =
            resobj.sessionTotal.vatTotal + x.vatTotal;
        });
        shiftObj.paidSummary.returnList.map((x) => {
          resobj.amountafterreturn = resobj.amountafterreturn - x.paidAmount;
          if (x.type.toLowerCase() == PAYMENTTYPES.CASH.toLocaleLowerCase()) {
            resobj.cashInHandAfterExpense =
              resobj.cashInHandAfterExpense - x.paidAmount;
          }
        });
        resobj.list.push(shiftObj);
      }
      resobj.location = branch.branchName;

      return (res = { data: resobj, status: STATUSCODES.SUCCESS });
    } else {
      //CASE 02
      let resobj = {
        location: "no location",
        shiftId: 0,
        shiftopeningTime: "",
        shiftclosingTime: "",
        paidSummary: {
          orderList: [],
          returnList: [],
          chequeList: { list: [], total: 0 },
        },
        expensetable: [],
        foodItems: {
          list: [],
          rateTotal: 0,
          amountTotal: 0,
        },
        cashInHandAfterExpense: 0,
        totalSaleWoExpense: 0,
        sessionTotal: {
          total: 0,
          amount: 0,
          commission: 0,
          vatTotal: 0,
          walletTotal: 0,
        },
        amountafterreturn: 0,
        denomination: {},
      };
      let shift = await shiftLogModel.findOne({
        shiftId: req.body.shiftNo,
        branchId: req.body.branchId,
      });
      if (common_service.checkObject(shift)) {
        resobj.location = branch.branchName;
        resobj.shiftopeningTime = common_service.newdateconvert(
          shift.startDate
        );
        resobj.shiftclosingTime =
          typeof shift.endDate == "number"
            ? common_service.newdateconvert(shift.endDate)
            : "Active Shift";
        resobj.shiftId = `SHIFT${shift.shiftId}`;
        let payments = await paymentModel.find({
          "paymentMethod.shiftId": shift.shiftId,
        });
        let returnPayments = await returnPaymentModel.find({
          "paymentMethod.shiftId": shift.shiftId,
          branchId: req.body.branchId,
        });

        payments = payments.filter(
          (x) => x.branchId == branch.storeCode || x.branchId == branch._id
        );

        for (let i = 0; i < payments.length; i++) {
          const element = payments[i];
          ordobj = await orderModel.findOne({
            _id: element.purchasePk,
            branchId: branch?.storeCode,
          });
          element.paymentMethod = element.paymentMethod.filter(
            (x) => x.shiftId == shift.shiftId
          );
          if (
            Array.isArray(element.paymentMethod) &&
            element.paymentMethod.length > 0
          ) {
            for (let j = 0; j < element.paymentMethod.length; j++) {
              const payobj = element.paymentMethod[j];

              if (common_service.checkObject(ordobj)) {
                let respobj = {};
                respobj.commissionTotal = 0;
                let vatTotal = 0;
                respobj.orderInfo = [];
                if (
                  payobj.type != null &&
                  payobj.type.toLocaleLowerCase() !=
                    PAYMENTTYPES.CHEQ.toLocaleLowerCase()
                ) {
                  if (resobj.paidSummary.orderList.length == 0) {
                    respobj.walletTotal = 0;
                    respobj.walletTotal =
                      respobj.walletTotal + ordobj.usedWallet;
                    respobj.vatTotal = 0;
                    if (
                      ordobj.orderInfo != undefined &&
                      Array.isArray(ordobj.orderInfo) &&
                      ordobj.orderInfo.length > 0
                    ) {
                      ordobj.orderInfo.map((x) => {
                        if (typeof x.vatorgst == "number") {
                          respobj.vatTotal = respobj.vatTotal + x.vatorgst;
                          vatTotal = vatTotal + x.vatorgst;
                        }
                      });
                    }
                    if (payobj.type.toLowerCase() == PAYMENTTYPES.CASH) {
                      respobj.type =
                        payobj.type != null ? payobj.type : "No Type";
                      respobj.paidAmount = payobj.paidAmount;
                      respobj.commissionTotal = 0;
                      respobj.balanceTotal =
                        respobj.paidAmount - respobj.commissionTotal;
                      if (req.body.isDetails) {
                        respobj.orderInfo.push({
                          orderId:
                            branch.storeCode.substr(3) +
                            PREFIXES.SALESINV +
                            ordobj.orderId,
                          paidAmount: payobj.paidAmount,
                          commission: 0,
                          balance: payobj.paidAmount,
                          wallet: ordobj.usedWallet,
                          vatTotal,
                        });
                      }
                    } else if (payobj.type.toLowerCase() == PAYMENTTYPES.UPIS) {
                      let commissionResp = await upiModel.findOne({
                        upiName: payobj.vendor,
                      });
                      respobj.type =
                        payobj.vendor != null ? payobj.vendor : "No Vendor";
                      respobj.paidAmount = payobj.paidAmount;
                      respobj.commissionTotal = !isEmpty(commissionResp)
                        ? payobj.paidAmount *
                          ((!isEmpty(commissionResp)
                            ? commissionResp.commission
                            : 0) /
                            100)
                        : 0;
                      respobj.balanceTotal =
                        respobj.paidAmount - respobj.commissionTotal;
                      if (req.body.isDetails) {
                        respobj.orderInfo.push({
                          orderId:
                            branch.storeCode.substr(3) +
                            PREFIXES.SALESINV +
                            ordobj.orderId,
                          paidAmount: payobj.paidAmount,
                          commission: !isEmpty(commissionResp)
                            ? payobj.paidAmount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100)
                            : 0,
                          balance:
                            payobj.paidAmount -
                            payobj.paidAmount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100),
                          wallet: ordobj.usedWallet,
                          vatTotal,
                        });
                      }
                    } else if (payobj.type.toLowerCase() == PAYMENTTYPES.CARD) {
                      let commissionResp = await cardModel.findOne({
                        cardName: payobj.vendor,
                      });
                      respobj.type =
                        payobj.vendor != null ? payobj.vendor : "No Vendor";
                      respobj.paidAmount = payobj.paidAmount;
                      respobj.commissionTotal = !isEmpty(commissionResp)
                        ? payobj.paidAmount *
                          ((!isEmpty(commissionResp)
                            ? commissionResp.commission
                            : 0) /
                            100)
                        : 0;
                      respobj.balanceTotal =
                        respobj.paidAmount - respobj.commissionTotal;
                      if (req.body.isDetails) {
                        respobj.orderInfo.push({
                          orderId:
                            branch.storeCode.substr(3) +
                            PREFIXES.SALESINV +
                            ordobj.orderId,
                          paidAmount: payobj.paidAmount,
                          commission: !isEmpty(commissionResp)
                            ? payobj.paidAmount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100)
                            : 0,
                          balance:
                            payobj.paidAmount -
                            payobj.paidAmount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100),
                          wallet: ordobj.usedWallet,
                          vatTotal,
                        });
                      }
                    }

                    resobj.paidSummary.orderList.push(respobj);
                  } else {
                    let vatTotal = 0;

                    if (payobj.type.toLowerCase() == PAYMENTTYPES.CASH) {
                      typeExist = resobj.paidSummary.orderList.find(
                        (x) => x.type.toLowerCase() == payobj.type.toLowerCase()
                      );
                      if (!isEmpty(typeExist)) {
                        if (
                          ordobj.orderInfo != undefined &&
                          Array.isArray(ordobj.orderInfo) &&
                          ordobj.orderInfo.length > 0
                        ) {
                          ordobj.orderInfo.map((x) => {
                            if (typeof x.vatorgst == "number") {
                              typeExist.vatTotal =
                                typeExist.vatTotal + x.vatorgst;
                              vatTotal = vatTotal + x.vatorgst;
                            }
                          });
                        }
                        typeExist.paidAmount =
                          typeExist.paidAmount + payobj.paidAmount;
                        typeExist.commissionTotal = 0;
                        typeExist.balanceTotal =
                          typeExist.paidAmount - typeExist.commissionTotal;
                        if (req.body.isDetails) {
                          let prevorder = typeExist.orderInfo.find(
                            (n) =>
                              n.orderId ==
                              branch.storeCode.substr(3) +
                                PREFIXES.SALESINV +
                                ordobj.orderId
                          );
                          if (!common_service.checkObject(prevorder)) {
                            typeExist.walletTotal =
                              typeExist.walletTotal + ordobj.usedWallet;
                          }
                          typeExist.orderInfo.push({
                            orderId:
                              branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId,
                            paidAmount: payobj.paidAmount,
                            commission: 0,
                            balance: payobj.paidAmount - 0,
                            wallet: common_service.checkObject(prevorder)
                              ? 0
                              : ordobj.usedWallet,
                            vatTotal,
                          });
                        }
                      } else {
                        respobj.vatTotal = 0;
                        if (
                          ordobj.orderInfo != undefined &&
                          Array.isArray(ordobj.orderInfo) &&
                          ordobj.orderInfo.length > 0
                        ) {
                          ordobj.orderInfo.map((x) => {
                            if (typeof x.vatorgst == "number") {
                              respobj.vatTotal = respobj.vatTotal + x.vatorgst;
                              vatTotal = vatTotal + x.vatorgst;
                            }
                          });
                        }
                        respobj.walletTotal = 0;
                        respobj.walletTotal =
                          respobj.walletTotal + ordobj.usedWallet;
                        respobj.type =
                          payobj.type != null ? payobj.type : "No Type";
                        respobj.paidAmount = payobj.paidAmount;
                        respobj.commissionTotal = 0;
                        respobj.balanceTotal =
                          respobj.paidAmount - respobj.commissionTotal;
                        if (req.body.isDetails) {
                          respobj.orderInfo.push({
                            orderId:
                              branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId,
                            paidAmount: payobj.paidAmount,
                            commission: 0,
                            balance: payobj.paidAmount - 0,
                            wallet: ordobj.usedWallet,
                            vatTotal,
                          });
                        }
                        resobj.paidSummary.orderList.push(respobj);
                      }
                    } else if (payobj.type.toLowerCase() == PAYMENTTYPES.CARD) {
                      typeExist = resobj.paidSummary.orderList.find(
                        (x) => x.type == payobj.vendor
                      );
                      let commissionResp = await cardModel.findOne({
                        cardName: payobj.vendor,
                      });

                      if (!isEmpty(typeExist)) {
                        if (
                          ordobj.orderInfo != undefined &&
                          Array.isArray(ordobj.orderInfo) &&
                          ordobj.orderInfo.length > 0
                        ) {
                          ordobj.orderInfo.map((x) => {
                            if (typeof x.vatorgst == "number") {
                              typeExist.vatTotal =
                                typeExist.vatTotal + x.vatorgst;
                              vatTotal = vatTotal + x.vatorgst;
                            }
                          });
                        }
                        typeExist.paidAmount =
                          typeExist.paidAmount + payobj.paidAmount;
                        typeExist.commissionTotal =
                          typeExist.commissionTotal +
                          (!isEmpty(commissionResp)
                            ? payobj.paidAmount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100)
                            : 0);
                        typeExist.balanceTotal =
                          typeExist.paidAmount - typeExist.commissionTotal;
                        let prevorder = typeExist.orderInfo.find(
                          (n) =>
                            n.orderId ==
                            branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId
                        );
                        if (!common_service.checkObject(prevorder)) {
                          typeExist.walletTotal =
                            typeExist.walletTotal + ordobj.usedWallet;
                        }
                        if (req.body.isDetails) {
                          typeExist.orderInfo.push({
                            orderId:
                              branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId,
                            paidAmount: payobj.paidAmount,
                            commission: !isEmpty(commissionResp)
                              ? payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100)
                              : 0,
                            balance:
                              payobj.paidAmount -
                              payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100),
                            wallet: common_service.checkObject(prevorder)
                              ? 0
                              : ordobj.usedWallet,
                            vatTotal,
                          });
                        }
                      } else {
                        respobj.vatTotal = 0;
                        if (
                          ordobj.orderInfo != undefined &&
                          Array.isArray(ordobj.orderInfo) &&
                          ordobj.orderInfo.length > 0
                        ) {
                          ordobj.orderInfo.map((x) => {
                            if (typeof x.vatorgst == "number") {
                              respobj.vatTotal = respobj.vatTotal + x.vatorgst;
                              vatTotal = vatTotal + x.vatorgst;
                            }
                          });
                        }
                        respobj.walletTotal = 0;
                        respobj.walletTotal =
                          respobj.walletTotal + ordobj.usedWallet;
                        respobj.type =
                          payobj.vendor != null ? payobj.vendor : "No Vendor";
                        respobj.paidAmount = payobj.paidAmount;
                        respobj.commissionTotal = !isEmpty(commissionResp)
                          ? payobj.paidAmount *
                            ((!isEmpty(commissionResp)
                              ? commissionResp.commission
                              : 0) /
                              100)
                          : 0;
                        respobj.balanceTotal =
                          respobj.paidAmount - respobj.commissionTotal;
                        if (req.body.isDetails) {
                          respobj.orderInfo.push({
                            orderId:
                              branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId,
                            paidAmount: payobj.paidAmount,
                            commission: !isEmpty(commissionResp)
                              ? payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100)
                              : 0,
                            balance:
                              payobj.paidAmount -
                              payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100),
                            wallet: ordobj.usedWallet,
                            vatTotal,
                          });
                        }
                        resobj.paidSummary.orderList.push(respobj);
                      }
                    } else if (payobj.type.toLowerCase() == PAYMENTTYPES.UPIS) {
                      typeExist = resobj.paidSummary.orderList.find(
                        (x) => x.type == payobj.vendor
                      );
                      let commissionResp = await upiModel.findOne({
                        upiName: payobj.vendor,
                      });
                      if (isEmpty(commissionResp)) {
                        commissionResp = { commission: 0 };
                      }
                      if (!isEmpty(typeExist)) {
                        typeExist.paidAmount =
                          typeExist.paidAmount + payobj.paidAmount;
                        typeExist.commissionTotal =
                          typeExist.commissionTotal +
                          (!isEmpty(commissionResp)
                            ? payobj.paidAmount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100)
                            : 0);
                        typeExist.balanceTotal =
                          typeExist.paidAmount - typeExist.commissionTotal;
                        if (req.body.isDetails) {
                          typeExist.orderInfo.push({
                            orderId:
                              branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId,
                            paidAmount: payobj.paidAmount,
                            commission: !isEmpty(commissionResp)
                              ? payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100)
                              : 0,
                            balance:
                              payobj.paidAmount -
                              payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100),
                          });
                        }
                      } else {
                        respobj.type =
                          payobj.vendor != null ? payobj.vendor : "No Vendor";
                        respobj.paidAmount = payobj.paidAmount;
                        respobj.commissionTotal = !isEmpty(commissionResp)
                          ? payobj.paidAmount *
                            ((!isEmpty(commissionResp)
                              ? commissionResp.commission
                              : 0) /
                              100)
                          : 0;
                        respobj.balanceTotal =
                          respobj.paidAmount - respobj.commissionTotal;
                        if (req.body.isDetails) {
                          respobj.orderInfo.push({
                            orderId:
                              branch.storeCode.substr(3) +
                              PREFIXES.SALESINV +
                              ordobj.orderId,
                            paidAmount: payobj.paidAmount,
                            commission: !isEmpty(commissionResp)
                              ? payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100)
                              : 0,
                            balance:
                              payobj.paidAmount -
                              payobj.paidAmount *
                                ((!isEmpty(commissionResp)
                                  ? commissionResp.commission
                                  : 0) /
                                  100),
                          });
                        }
                        resobj.paidSummary.orderList.push(respobj);
                      }
                    }
                  }
                }
                if (req.body.isCategory) {
                  for (let l = 0; l < ordobj?.orderInfo.length; l++) {
                    const ordelement = ordobj.orderInfo[l];
                    if (ordelement.type == 1) {
                      let prodobj = { productName: "no name" };
                      let product = {};
                      if (common_service.isObjectId(ordelement.itemInfo)) {
                        product = await foodModel.findOne({
                          _id: ordelement.itemInfo,
                        });
                      }
                      if (common_service.checkObject(product)) {
                        prodobj.productName = product.productName;
                      }
                      let typeExist = resobj.foodItems.list.find(
                        (x) =>
                          x.productName == prodobj.productName &&
                          x.amount == ordelement.rate
                      );
                      if (!isEmpty(typeExist)) {
                        if (typeExist.rate == ordelement.rate) {
                          typeExist.qty = typeExist.qty + ordelement.quantity;
                          typeExist.amount = typeExist.rate * typeExist.qty;
                        } else {
                          prodobj.unit = ordelement.unit;
                          prodobj.rate = ordelement.rate;
                          prodobj.qty = ordelement.quantity;
                          prodobj.amount = prodobj.rate * prodobj.qty;

                          resobj.foodItems.list.push(prodobj);
                        }
                      } else {
                        prodobj.rate = ordelement.rate;
                        prodobj.unit = ordelement.dimension;
                        prodobj.qty = ordelement.quantity;
                        prodobj.amount = prodobj.rate * prodobj.qty;
                        resobj.foodItems.list.push(prodobj);
                      }
                    }
                  }
                }
                if (
                  payobj.type != null &&
                  payobj.type.toLocaleLowerCase() ==
                    PAYMENTTYPES.CHEQ.toLowerCase()
                ) {
                  respobj.orderId =
                    branch.storeCode.substr(3) +
                    PREFIXES.SALESINV +
                    ordobj.orderId;
                  respobj.bankName =
                    typeof payobj.vendor == "string"
                      ? payobj.vendor
                      : "No Vendor";
                  respobj.date = payobj.date;
                  respobj.chequedate =
                    typeof payobj.chequeDate == "string"
                      ? payobj.chequeDate
                      : respobj.date;
                  respobj.paidAmount =
                    typeof payobj.paidAmount == "number"
                      ? payobj.paidAmount
                      : 0;
                  resobj.paidSummary.chequeList.total =
                    resobj.paidSummary.chequeList.total + respobj.paidAmount;
                  resobj.paidSummary.chequeList.list.push(respobj);
                }
              }
            }
          }
        }
        for (let j = 0; j < returnPayments.length; j++) {
          const returnpaymentelement = returnPayments[j];
          if (
            Array.isArray(returnpaymentelement.paymentMethod) &&
            returnpaymentelement.paymentMethod.length > 0
          ) {
            returnpaymentelement.paymentMethod =
              returnpaymentelement.paymentMethod.filter(
                (x) => x.shiftId == shift.shiftId
              );
            for (
              let k = 0;
              k < returnpaymentelement.paymentMethod.length;
              k++
            ) {
              const payobj = returnpaymentelement.paymentMethod[k];
              let respobj = {};
              respobj.orderInfo = [];
              respobj.commissionTotal = 0;
              if (resobj.paidSummary.returnList.length == 0) {
                respobj.type = payobj.type != null ? payobj.type : "No Type";
                respobj.paidAmount = payobj.paidAmount;
                respobj.balanceTotal =
                  respobj.paidAmount - respobj.commissionTotal;
                if (req.body.isDetails) {
                  respobj.orderInfo.push({
                    orderId:
                      branch.storeCode.substr(3) +
                      req.decode.prefix.substring(0, 2) +
                      returnPayments[k].invoiceNo,
                    paidAmount: payobj.paidAmount,
                    commission: 0,
                    balance: payobj.paidAmount,
                    type: payobj.type,
                  });
                }

                resobj.paidSummary.returnList.push(respobj);
              } else {
                if (payobj.type.toLowerCase() == PAYMENTTYPES.CASH) {
                  typeExist = resobj.paidSummary.returnList.find(
                    (x) => x.type.toLowerCase() == payobj.type.toLowerCase()
                  );

                  if (!isEmpty(typeExist)) {
                    typeExist.paidAmount =
                      typeExist.paidAmount + payobj.paidAmount;
                    typeExist.balanceTotal = typeExist.paidAmount - 0;
                    if (req.body.isDetails) {
                      let prevorder = typeExist.orderInfo.find(
                        (n) =>
                          n.orderId ==
                          branch.storeCode.substr(3) +
                            req.decode.prefix.substring(0, 2) +
                            returnPayments[k].invoiceNo
                      );
                      if (isEmpty(prevorder)) {
                        typeExist.orderInfo.push({
                          orderId:
                            branch.storeCode.substr(3) +
                            req.decode.prefix.substring(0, 2) +
                            returnPayments[k].invoiceNo,
                          paidAmount: payobj.paidAmount,
                          commission: 0,
                          balance: payobj.paidAmount - 0,
                        });
                      } else {
                        prevorder.paidAmount =
                          prevorder.paidAmount + payobj.paidAmount;
                        prevorder.commission = 0;
                        prevorder.balance =
                          prevorder.paidAmount - prevorder.commission;
                      }
                    }
                  } else {
                    respobj.type =
                      payobj.type != null ? payobj.type : "No Type";
                    respobj.paidAmount = payobj.paidAmount;
                    respobj.commissionTotal = 0;
                    respobj.balanceTotal =
                      respobj.paidAmount - respobj.commissionTotal;

                    if (req.body.isDetails) {
                      respobj.orderInfo.push({
                        orderId:
                          branch.storeCode.substr(3) +
                          req.decode.prefix.substring(0, 2) +
                          PREFIXES.WORKORDER +
                          woobj.orderNo,
                        paidAmount: payobj.paidAmount,
                        commission: 0,
                        balance: payobj.paidAmount - 0,
                      });
                    }
                    paidSummary.returnList.push(respobj);
                  }
                }
              }
            }
          }
        }
        if (req.body.isExpense) {
          let expensetableExist = await outletExpenseModel.find({
            branchId: req.body.branchId,
            shiftId: shift.shiftId,
          });
          if (
            Array.isArray(expensetableExist) &&
            expensetableExist.length > 0
          ) {
            for (let s = 0; s < expensetableExist.length; s++) {
              let typeexpenseExist = await expenseTypeModel.findOne({
                _id: expensetableExist[s].expenseType,
              });
              resobj.cashInHandAfterExpense =
                resobj.cashInHandAfterExpense - expensetableExist[s].amount;
              resobj.expensetable.push({
                expenseName: typeexpenseExist.expenseType,
                amount: expensetableExist[s].amount,
                commission: 0,
                balance: 0,
              });
            }
          }
        }
      }
      resobj.paidSummary.orderList.map((x) => {
        resobj.amountafterreturn = resobj.amountafterreturn + x.paidAmount;
        if (typeof x.type == "string") {
          if (x.type.toLowerCase() == PAYMENTTYPES.CASH.toLocaleLowerCase()) {
            resobj.cashInHandAfterExpense =
              resobj.cashInHandAfterExpense + x.paidAmount;
          }
        }
        resobj.totalSaleWoExpense = resobj.totalSaleWoExpense + x.paidAmount;
        resobj.sessionTotal.amount = resobj.sessionTotal.amount + x.paidAmount;
        resobj.sessionTotal.commission =
          resobj.sessionTotal.commission + x.commissionTotal;
        resobj.sessionTotal.total = resobj.sessionTotal.total + x.balanceTotal;
        resobj.sessionTotal.walletTotal =
          resobj.sessionTotal.walletTotal + x.walletTotal;
        resobj.sessionTotal.vatTotal =
          resobj.sessionTotal.vatTotal + x.vatTotal;
      });
      resobj.paidSummary.returnList.map((x) => {
        resobj.amountafterreturn = resobj.amountafterreturn - x.paidAmount;
        if (x.type.toLowerCase() == PAYMENTTYPES.CASH.toLocaleLowerCase()) {
          resobj.cashInHandAfterExpense =
            resobj.cashInHandAfterExpense - x.paidAmount;
        }
      });
      let denoExist = await denominationModel.findOne({
        branchId: branch.storeCode,
        shiftId: req.body.shiftNo,
      });
      if (common_service.checkObject(denoExist)) {
        let denomTable = [],
          grandTotal = 0;
        if (
          common_service.checkObject(denoExist) &&
          Array.isArray(denoExist.denomination) &&
          denoExist.denomination.length > 0
        ) {
          denoExist.denomination.map((x) => {
            let denomobj = {
              currency: x.currency,
              amount: x.amount,
              count: x.count,
              total: x.amount * x.count,
            };
            grandTotal = grandTotal + denomobj.total;
            denomTable.push(denomobj);
          });
        }
        resobj.denomination = { denomTable, grandTotal };
      }
      return (res = { data: resobj, status: STATUSCODES.SUCCESS });
    }
  } catch (e) {
    console.log(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 20-07-23
module.exports.dailyReport = async (req) => {
  const { orderModel, orderreturnModel } = conn.order(req.decode.db);
  const { pettycashModel, outletExpenseModel, expenseTypeModel } = conn.expense(
    req.decode.db
  );
  const { paymentModel, creditModel, returnPaymentModel } = conn.payment(
    req.decode.db
  );
  const { foodModel } = conn.food(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { shiftLogModel, cardModel, upiModel, chequeModel } = conn.settings(
    req.decode.db
  );
  try {
    let rsList = [];
    let branch = await branchModel.findOne({
      storeCode: req.body.branchId,
    });
    if (branch != null) {
      if (req.body.fromDate != null && req.body.endDate != null) {
        let shiftList = await shiftLogModel.find({
          branchId: req.body.branchId,
          startDate: {
            $gte: new Date(req.body.fromDate).getTime(),
            $lte: new Date(req.body.endDate).getTime(),
          },
        });
        let resobj = {
          location: "no location",
          list: [],
          product: {
            totalfoodsale: 0,
            totalCashExpense: 0,
          },
          expenses: {
            pettyvoucherexpense: 0,
            cashexpense: 0,
            total: 0,
          },
          order: {
            totalOrderAmount: 0,
            totalBalance: 0,
            totalCredit: 0,
            totalVat: 0,
            totalWallet: 0,
          },
          payment: {
            totalCard: 0,
            totalCash: 0,
            totalUpi: 0,
            totalReturn: 0,
            totalCheque: 0,
          },
          commission: {
            totalcardCommission: 0,
            totalUpiCommission: 0,
            totalCardAfterCommission: 0,
            totalUpiAfterCommission: 0,
            totalChequeCommission: 0,
            totalChequeAfterCommission: 0,
          },
          grandTotalOnHand: 0,
          expensetable: {
            openingBalance: 0,
            expenseList: [],
            balance: 0,
            crTot: 0,
            debTot: 0,
          },
          totalSalesAfterExpense: 0,
          totalAmount: 0,
        };

        resobj.location = branch.branchName;
        if (shiftList.length > 0) {
          for (let i = 0; i < shiftList.length; i++) {
            const element = shiftList[i];
            let shiftObj = {};
            shiftObj.shiftId = `SHIFT${element.shiftId}`;
            shiftObj.shiftnumber = element.shiftId;
            shiftObj.shiftopeningTime = common_service.prescisedateconvert(
              element.startDate
            );
            shiftObj.shiftClosingTime =
              typeof element.endDate == "number"
                ? common_service.prescisedateconvert(element.endDate)
                : "Active Shift";
            shiftObj.list = [];
            let orderList = await orderModel.find({
              branchId: branch.storeCode,
              shiftId: element.shiftId,
            });
            let paymentList = await paymentModel.find({
              "paymentMethod.shiftId": element.shiftId,
            });

            paymentList = paymentList.filter(
              (x) => x.branchId == branch._id || x.branchId == branch.storeCode
            );
            let returnList = await orderreturnModel.find({
              branchId: req.body.branchId,
              shiftId: element.shiftId,
            });

            for (let j = 0; j < orderList.length; j++) {
              const workorder = orderList[j];
              let woobj = {};
              woobj.items = [];
              woobj.paidAmountArray = [];
              woobj.paymenttypes = [];
              woobj._id = workorder._id;
              woobj.billNo =
                branch.storeCode.substr(3) +
                req.decode.prefix.substring(0, 2) +
                PREFIXES.SALESINV +
                workorder.orderId;
              woobj.orderNo = woobj.billNo;

              woobj.date = common_service
                .prescisedateconvert(workorder.orderDate)
                .split(" ")[0];
              woobj.totalAmount = workorder.totalAmount;
              resobj.order.totalOrderAmount =
                resobj.order.totalOrderAmount + woobj.totalAmount;
              woobj.discount = 0;
              if (typeof workorder.discount == "number") {
                woobj.discount = workorder.discount;
              }
              woobj.paidAmount = 0;
              woobj.status = workorder.status;
              woobj.wodelshiftId = workorder.deliveryShiftId;
              woobj.shiftId = workorder.shiftId;
              woobj.deliveryNo = woobj.orderNo;
              woobj.usedWallet = workorder.usedWallet;
              resobj.order.totalWallet =
                resobj.order.totalWallet + woobj.usedWallet;
              woobj.vatorgst = 0;
              if (
                Array.isArray(workorder.orderInfo) &&
                workorder.orderInfo.length > 0
              ) {
                for (let g = 0; g < workorder.orderInfo.length; g++) {
                  if (typeof workorder.orderInfo[g].vatorgst == "number") {
                    woobj.vatorgst =
                      woobj.vatorgst + workorder.orderInfo[g].vatorgst;
                    resobj.order.totalVat =
                      resobj.order.totalVat + workorder.orderInfo[g].vatorgst;
                  }
                  if (workorder.orderInfo[g].type == 1) {
                    let material = await foodModel.findOne({
                      _id: workorder.orderInfo[g].itemInfo,
                    });
                    // console.log("sarang" + material);

                    if (!isEmpty(material)) {
                      resobj.product.totalfoodsale =
                        resobj.product.totalfoodsale +
                        parseInt(
                          workorder.orderInfo[g].quantity *
                            workorder.orderInfo[g].rate
                        );
                      if (req.body.isDetails) {
                        woobj.items.push({
                          itemName: material.prod_name,
                          amount:
                            workorder.orderInfo[g].quantity *
                            workorder.orderInfo[g].rate,
                          vatorgst: workorder.orderInfo[g].vatorgst,
                        });
                      }
                    }
                  }
                }
              }
              let paymentDetails = await paymentModel.findOne({
                purchasePk: workorder._id,
              });
              if (common_service.checkObject(paymentDetails)) {
                for (let g = 0; g < paymentDetails.paymentMethod.length; g++) {
                  if (
                    paymentDetails.paymentMethod[g].shiftId == element.shiftId
                  ) {
                    woobj.paidAmountArray.push(
                      paymentDetails.paymentMethod[g].paidAmount
                    );
                    woobj.paidAmount =
                      woobj.paidAmount +
                      paymentDetails.paymentMethod[g].paidAmount;
                    resobj.order.totalBalance =
                      resobj.order.totalBalance +
                      paymentDetails.paymentMethod[g].paidAmount +
                      woobj.usedWallet;
                    let payobj = {};
                    payobj.type = paymentDetails.paymentMethod[g].type;
                    payobj.amount = paymentDetails.paymentMethod[g].paidAmount;
                    payobj.commission = 0;
                    if (
                      paymentDetails.paymentMethod[g].type.toLowerCase() ==
                      PAYMENTTYPES.CARD
                    ) {
                      payobj.vendor = paymentDetails.paymentMethod[g].vendor;
                      let commissionResp = await cardModel.findOne({
                        cardName: payobj.vendor,
                      });
                      if (!isEmpty(commissionResp)) {
                        payobj.commission =
                          payobj.amount *
                          ((!isEmpty(commissionResp)
                            ? commissionResp.commission
                            : 0) /
                            100);
                      }
                      resobj.payment.totalCard =
                        resobj.payment.totalCard + payobj.amount;
                      resobj.commission.totalcardCommission =
                        resobj.commission.totalcardCommission +
                        payobj.commission;
                    } else if (
                      paymentDetails.paymentMethod[g].type.toLowerCase() ==
                      PAYMENTTYPES.CASH
                    ) {
                      payobj.vendor = paymentDetails.paymentMethod[g].type;
                      payobj.commission = 0;
                      resobj.payment.totalCash =
                        resobj.payment.totalCash + payobj.amount;
                    } else if (
                      paymentDetails.paymentMethod[g].type.toLowerCase() ==
                      PAYMENTTYPES.UPIS
                    ) {
                      payobj.vendor = paymentDetails.paymentMethod[g].vendor;
                      resobj.payment.totalUpi =
                        resobj.payment.totalUpi + payobj.amount;
                      let commissionResp = await upiModel.findOne({
                        upiName: payobj.vendor,
                      });
                      if (!isEmpty(commissionResp)) {
                        payobj.commission =
                          payobj.amount *
                          ((!isEmpty(commissionResp)
                            ? commissionResp.commission
                            : 0) /
                            100);
                      }
                    } else if (
                      paymentDetails.paymentMethod[g].type.toLowerCase() ==
                      PAYMENTTYPES.CHEQ.toLocaleLowerCase()
                    ) {
                      payobj.vendor = paymentDetails.paymentMethod[g].vendor;
                      let commissionResp = await chequeModel.findOne({
                        bankName: payobj.vendor,
                      });
                      resobj.payment.totalCheque =
                        resobj.payment.totalCheque + payobj.amount;
                      if (common_service.checkObject(commissionResp)) {
                        payobj.commission =
                          payobj.amount *
                          ((!isEmpty(commissionResp)
                            ? commissionResp.commission
                            : 0) /
                            100);
                      }
                    }
                    woobj.paymenttypes.push(payobj);
                  }
                }
                if (woobj.paidAmount < woobj.totalAmount) {
                  let creditDetails = await creditModel.findOne({
                    purchasePk: woobj._id.toString(),
                  });
                  if (common_service.checkObject(creditDetails)) {
                    resobj.order.totalCredit =
                      resobj.order.totalCredit + creditDetails.balance;
                  }
                }
              } else {
                let creditDetails = await creditModel.findOne({
                  purchasePk: woobj._id.toString(),
                });
                if (common_service.checkObject(creditDetails)) {
                  resobj.order.totalCredit =
                    resobj.order.totalCredit + creditDetails.balance;
                }
              }
              shiftObj.list.push(woobj);
            }

            for (let j = 0; j < paymentList.length; j++) {
              let workorder = {};
              let exist = shiftObj.list.find(
                (x) => x._id == paymentList[j].purchasePk.toString()
              );
              if (!common_service.checkObject(exist)) {
                let ord = await orderModel.findOne({
                  _id: paymentList[j].purchasePk,
                });
                let type = 0;
                if (common_service.checkObject(ord)) {
                  workorder = ord;
                  type = 1;
                }
                let woobj = {};
                woobj.items = [];
                woobj.paidAmountArray = [];
                woobj.paymenttypes = [];
                woobj._id = workorder._id;
                woobj.usedWallet = workorder.usedWallet;
                if (typeof woobj.usedWallet == "number") {
                  resobj.order.totalWallet =
                    resobj.order.totalWallet + woobj.usedWallet;
                }
                woobj.vatorgst = 0;
                if (type == 1) {
                  woobj.billNo =
                    branch.storeCode.substr(3) +
                    req.decode.prefix.substring(0, 2) +
                    PREFIXES.SALESINV +
                    workorder.orderId;
                  woobj.orderNo = woobj.billNo;
                  woobj.date = common_service
                    .prescisedateconvert(workorder.orderDate)
                    .split(" ")[0];
                  woobj.totalAmount =
                    workorder.totalAmount + workorder.discount;
                  resobj.order.totalOrderAmount =
                    resobj.order.totalOrderAmount + woobj.totalAmount;
                  woobj.discount = workorder.discount ? workorder.discount : 0;
                  woobj.paidAmount = 0;
                  woobj.status = workorder.status;
                  woobj.wodelshiftId = 0;
                  woobj.shiftId = workorder.shiftId;
                  woobj.deliveryNo = woobj.orderNo;

                  if (
                    Array.isArray(workorder.orderInfo) &&
                    workorder.orderInfo.length > 0
                  ) {
                    for (let g = 0; g < workorder.orderInfo.length; g++) {
                      if (typeof workorder.orderInfo[g].vatorgst) {
                        woobj.vatorgst =
                          woobj.vatorgst + workorder.orderInfo[g].vatorgst;
                        resobj.order.totalVat =
                          resobj.order.totalVat +
                          workorder.orderInfo[g].vatorgst;
                      }
                      if (workorder.orderInfo[g].type == 1) {
                        let material = await foodModel.findOne({
                          _id: workorder.orderInfo[g].itemInfo,
                        });

                        if (!isEmpty(material)) {
                          resobj.product.totalfoodsale =
                            resobj.product.totalfoodsale +
                            parseInt(
                              workorder.orderInfo[g].quantity *
                                workorder.orderInfo[g].rate
                            );
                          if (req.body.isDetails) {
                            woobj.items.push({
                              itemName: material.prod_name,
                              amount:
                                workorder.orderInfo[g].quantity *
                                workorder.orderInfo[g].rate,
                              vatorgst: workorder.orderInfo[g].vatorgst,
                            });
                          }
                        }
                      }
                    }
                  }

                  let paymentDetails = paymentList[j];
                  if (!isEmpty(paymentDetails)) {
                    for (
                      let g = 0;
                      g < paymentDetails.paymentMethod.length;
                      g++
                    ) {
                      if (
                        paymentDetails.paymentMethod[g].shiftId ==
                        element.shiftId
                      ) {
                        woobj.paidAmountArray.push(
                          paymentDetails.paymentMethod[g].paidAmount
                        );
                        woobj.paidAmount =
                          woobj.paidAmount +
                          paymentDetails.paymentMethod[g].paidAmount;
                        resobj.order.totalBalance =
                          resobj.order.totalBalance +
                          paymentDetails.paymentMethod[g].paidAmount +
                          woobj.usedWallet;
                        let payobj = {};
                        payobj.type = paymentDetails.paymentMethod[g].type;
                        payobj.amount =
                          paymentDetails.paymentMethod[g].paidAmount;
                        payobj.commission = 0;
                        if (
                          paymentDetails.paymentMethod[g].type.toLowerCase() ==
                          PAYMENTTYPES.CARD
                        ) {
                          payobj.vendor =
                            paymentDetails.paymentMethod[g].vendor;
                          let commissionResp = await cardModel.findOne({
                            cardName: payobj.vendor,
                          });

                          payobj.commission =
                            payobj.amount *
                            ((!isEmpty(commissionResp)
                              ? commissionResp.commission
                              : 0) /
                              100);
                          resobj.payment.totalCard =
                            resobj.payment.totalCard + payobj.amount;
                          resobj.commission.totalcardCommission =
                            resobj.commission.totalcardCommission +
                            payobj.commission;
                        } else if (
                          paymentDetails.paymentMethod[g].type.toLowerCase() ==
                          PAYMENTTYPES.CASH
                        ) {
                          payobj.vendor = paymentDetails.paymentMethod[g].type;
                          payobj.commission = 0;
                          resobj.payment.totalCash =
                            resobj.payment.totalCash + payobj.amount;
                        } else if (
                          paymentDetails.paymentMethod[g].type.toLowerCase() ==
                          PAYMENTTYPES.UPIS
                        ) {
                          payobj.vendor =
                            paymentDetails.paymentMethod[g].vendor;
                          let commissionResp = await upiModel.findOne({
                            upiName: payobj.vendor,
                          });
                          payobj.commission =
                            payobj.amount *
                            ((!isEmpty(commissionResp)
                              ? commissionResp.commission
                              : 0) /
                              100);
                        } else if (
                          paymentDetails.paymentMethod[g].type.toLowerCase() ==
                          PAYMENTTYPES.CHEQ.toLocaleLowerCase()
                        ) {
                          payobj.vendor =
                            paymentDetails.paymentMethod[g].vendor;
                          let commissionResp = await chequeModel.findOne({
                            bankName: payobj.vendor,
                          });
                          resobj.payment.totalCheque =
                            resobj.payment.totalCheque + payobj.amount;
                          if (common_service.checkObject(commissionResp)) {
                            payobj.commission =
                              payobj.amount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100);
                          }
                        }
                        woobj.paymenttypes.push(payobj);
                      }
                    }
                  }
                }
                if (woobj.paidAmount < woobj.totalAmount) {
                  let creditDetails = await creditModel.findOne({
                    purchasePk: woobj._id.toString(),
                  });
                  if (common_service.checkObject(creditDetails)) {
                    resobj.order.totalCredit =
                      resobj.order.totalCredit + creditDetails.balance;
                  }
                }
                if (typeof woobj._id != "undefined") {
                  shiftObj.list.push(woobj);
                }
              }
            }
            for (let j = 0; j < returnList.length; j++) {
              let workorder = returnList[j];
              let woobj = {};
              woobj.items = [];
              woobj.paidAmountArray = [];
              woobj.paymenttypes = [];
              woobj.vatorgst = 0;
              woobj.usedWallet = 0;
              woobj._id = workorder._id;
              woobj._id = returnList[j]._id;
              woobj.billNo = returnList[j].invoiceNo;
              woobj.orderNo =
                branch.storeCode.substr(3) +
                PREFIXES.SALESRETURN +
                returnList[j].transNo;
              woobj.date = common_service
                .prescisedateconvert(returnList[j].returnDate)
                .split(" ")[0];
              woobj.totalAmount = 0;
              returnList[j].returnInfo.map((x) => {
                if (x.originalAmt != undefined) {
                  woobj.totalAmount = woobj.totalAmount + x.originalAmt;
                }
              });
              woobj.discount = returnList[j].discount
                ? returnList[j].discount
                : 0;
              woobj.paidAmount = 0;
              woobj.status = ORDERSTATUS.RET;
              woobj.wodelshiftId = returnList[j].shiftId;
              woobj.shiftId = returnList[j].shiftId;
              woobj.deliveryNo = woobj.billNo;
              await Promise.all(
                returnList[j].returnInfo.map(async (x) => {
                  let material = {};
                  if (common_service.isObjectId(x.itemInfo)) {
                    // if (x.itemType == 2) {
                    //   material = await productMaterialModel.findOne({
                    //     _id: x.itemInfo,
                    //   });
                    // }
                    if (x.itemType == 1) {
                      material = await foodModel.findOne({
                        _id: x.itemInfo,
                      });
                    }
                    // if (x.itemType == 0) {
                    //   material = await productReadyMadeModel.findOne({
                    //     _id: x.itemInfo,
                    //   });
                    // }
                  }
                  if (!isEmpty(material)) {
                    if (
                      !(
                        material.prod_name.toLowerCase().replace(/ +/g, "") ==
                        "outcloth"
                      )
                    ) {
                      woobj.items.push({
                        itemName: material?.productName,
                        amount: x.originalAmt,
                      });
                    } else {
                      woobj.items.push({
                        itemName: material?.productName,
                        amount: y.stitchRate * y.qty,
                      });
                    }
                  }
                })
              );
              let paymentDetails = await returnPaymentModel.findOne({
                purchasePk: returnList[j]._id,
              });
              if (isEmpty(paymentDetails)) {
                paymentDetails = await returnPaymentModel.findOne({
                  invoiceNo: PREFIXES.SALESRETURN + returnList[j].transNo,
                  branchId: returnList[j].branchId,
                });
              }
              if (!isEmpty(paymentDetails)) {
                for (let g = 0; g < paymentDetails.paymentMethod.length; g++) {
                  if (
                    paymentDetails.paymentMethod[g].shiftId ==
                    returnList[j].shiftId
                  ) {
                    woobj.paidAmountArray.push(
                      paymentDetails.paymentMethod[g].paidAmount
                    );
                    woobj.paidAmount =
                      woobj.paidAmount +
                      paymentDetails.paymentMethod[g].paidAmount;
                    let payobj = {};
                    payobj.type = paymentDetails.paymentMethod[g].type;
                    payobj.amount = paymentDetails.paymentMethod[g].paidAmount;
                    payobj.commission = 0;
                    if (
                      paymentDetails.paymentMethod[g].type.toLowerCase() ==
                      PAYMENTTYPES.CARD
                    ) {
                      payobj.vendor = paymentDetails.paymentMethod[g].vendor;
                      let commissionResp = await cardModel.findOne({
                        cardName: payobj.vendor,
                      });
                      payobj.commission =
                        payobj.amount *
                        (!isEmpty(commissionResp)
                          ? commissionResp.commission
                          : 0 / 100);
                    } else if (
                      paymentDetails.paymentMethod[g].type.toLowerCase() ==
                      PAYMENTTYPES.CASH
                    ) {
                      payobj.vendor = paymentDetails.paymentMethod[g].type;
                      payobj.commission = 0;
                    } else if (
                      paymentDetails.paymentMethod[g].type.toLowerCase() ==
                      PAYMENTTYPES.UPIS
                    ) {
                      payobj.vendor = paymentDetails.paymentMethod[g].vendor;
                      let commissionResp = await upiModel.findOne({
                        upiName: payobj.vendor,
                      });
                      payobj.commission =
                        payobj.amount *
                        (!isEmpty(commissionResp)
                          ? commissionResp.commission
                          : 0 / 100);
                    }
                    woobj.paymenttypes.push(payobj);
                  }
                }
              }
              shiftObj.list.push(woobj);
            }
            rsList.push(shiftObj);
            let end =
              typeof element.endDate == "number"
                ? element.endDate
                : common_service.startandenddateofaday(new Date().getTime())
                    .end;

            let pettycashexpenselist = await pettycashModel.find({
              branchId: req.body.branchId,
              date: { $gt: element.startDate, $lt: end },
            });
            if (
              Array.isArray(pettycashexpenselist) &&
              pettycashexpenselist.length > 0
            ) {
              pettycashexpenselist.map((x) => {
                resobj.expenses.pettyvoucherexpense =
                  resobj.expenses.pettyvoucherexpense + x.amount;
                resobj.expensetable.openingBalance =
                  resobj.expensetable.openingBalance + x.amount;
              });
            }
            let outletExpenseList = await outletExpenseModel.find({
              branchId: req.body.branchId,
              shiftId: element.shiftId,
            });
            if (
              Array.isArray(outletExpenseList) &&
              outletExpenseList.length > 0
            ) {
              await Promise.all(
                outletExpenseList.map(async (x, i) => {
                  resobj.expenses.cashexpense =
                    resobj.expenses.cashexpense + x.amount;
                  let typeexpenseExist = await expenseTypeModel.findOne({
                    _id: x.expenseType,
                  });

                  if (!common_service.isEmpty(typeexpenseExist)) {
                    x._doc["expenseName"] = typeexpenseExist.expenseType;
                  } else {
                    x._doc["expenseName"] = "No expense";
                  }

                  resobj.expensetable.crTot =
                    resobj.expensetable.crTot +
                    (!x.creditAmount ? 0 : x.creditAmount);
                  resobj.expensetable.debTot =
                    resobj.expensetable.debTot + x.amount;

                  resobj.expensetable.expenseList.push({
                    expenseName: x._doc["expenseName"],
                    date: common_service
                      .prescisedateconvert(x.date)
                      .split(" ")[0],
                    debit: x.amount,
                    credit: !x.creditAmount ? 0 : x.creditAmount,
                  });
                  resobj.expensetable.balance =
                    resobj.expensetable.balance - x.amount;
                })
              );
            }
          }
          resobj.list = rsList;
          resobj.expenses.total =
            resobj.expenses.pettyvoucherexpense + resobj.expenses.cashexpense;
          resobj.totalAmount =
            resobj.payment.totalCard +
            resobj.payment.totalCash +
            resobj.payment.totalUpi +
            resobj.payment.totalCheque +
            resobj.order.totalWallet;
          resobj.totalSalesAfterExpense =
            resobj.payment.totalCard +
            resobj.payment.totalCash +
            resobj.payment.totalUpi +
            resobj.order.totalWallet -
            resobj.expenses.total -
            resobj.payment.totalReturn;
          resobj.commission.totalCardAfterCommission =
            resobj.payment.totalCard - resobj.commission.totalcardCommission;
          resobj.product.totalCashExpense = resobj.product.totalfoodsale;
          resobj.grandTotalOnHand =
            resobj.payment.totalCard +
            resobj.payment.totalCash +
            resobj.payment.totalUpi -
            resobj.payment.totalReturn -
            resobj.commission.totalcardCommission -
            resobj.commission.totalUpiCommission +
            resobj.order.totalWallet;
        }
        return (res = { data: resobj, status: STATUSCODES.SUCCESS });
      } else {
        //CASE 02
        let resobj = {
          shiftNo: 0,
          shiftopeningTime: "",
          shiftClosingTime: "",
          location: "",
          list: [],
          product: {
            totalfoodsale: 0,
            totalCashExpense: 0,
          },
          expenses: {
            pettyvoucherexpense: 0,
            cashexpense: 0,
            total: 0,
          },
          order: {
            totalOrderAmount: 0,
            totalBalance: 0,
            totalCredit: 0,
            totalVat: 0,
            totalWallet: 0,
          },
          payment: {
            totalCard: 0,
            totalCash: 0,
            totalUpi: 0,
            totalReturn: 0,
            totalCheque: 0,
          },
          commission: {
            totalcardCommission: 0,
            totalUpiCommission: 0,
            totalCardAfterCommission: 0,
            totalUpiAfterCommission: 0,
            totalChequeCommission: 0,
            totalChequeAfterCommission: 0,
          },
          grandTotalOnHand: 0,
          expensetable: {
            openingBalance: 0,
            expenseList: [],
            balance: 0,
            crTot: 0,
            debTot: 0,
          },
          totalSalesAfterExpense: 0,
          totalAmount: 0,
        };

        let shiftDetails = await shiftLogModel.findOne({
          branchId: req.body.branchId,
          shiftId: req.body.shiftNo,
        });
        if (!isEmpty(shiftDetails)) {
          resobj.shiftNo = `SHIFT${shiftDetails.shiftId}`;
          resobj.shiftopeningTime = common_service.prescisedateconvert(
            shiftDetails.startDate
          );
          resobj.shiftClosingTime =
            typeof shiftDetails.endDate == "number"
              ? common_service.prescisedateconvert(shiftDetails.endDate)
              : "Active Shift";
          resobj.location = branch.branchName;
          let orderList = await orderModel.find({
            branchId: branch.storeCode,
            shiftId: shiftDetails.shiftId,
          });
          let paymentList = await paymentModel.find({
            "paymentMethod.shiftId": shiftDetails.shiftId,
          });

          paymentList = paymentList.filter(
            (x) => x.branchId == branch._id || x.branchId == branch.storeCode
          );
          let returnList = await orderreturnModel.find({
            branchId: req.body.branchId,
            shiftId: shiftDetails.shiftId,
          });
          let shiftObj = {};
          for (let j = 0; j < orderList.length; j++) {
            const workorder = orderList[j];
            let woobj = {};
            woobj.items = [];
            woobj.paidAmountArray = [];
            woobj.paymenttypes = [];
            woobj._id = workorder._id;
            woobj.billNo =
              branch.storeCode.substr(3) +
              req.decode.prefix.substring(0, 2) +
              PREFIXES.SALESINV +
              workorder.orderId;
            woobj.orderNo = woobj.billNo;

            woobj.date = common_service
              .prescisedateconvert(workorder.orderDate)
              .split(" ")[0];
            woobj.totalAmount = workorder.totalAmount;
            resobj.order.totalOrderAmount =
              resobj.order.totalOrderAmount + woobj.totalAmount;
            woobj.discount = 0;
            if (typeof workorder.discount == "number") {
              woobj.discount = workorder.discount;
            }
            woobj.paidAmount = 0;
            woobj.status = workorder.status;
            woobj.wodelshiftId = workorder.deliveryShiftId;
            woobj.shiftId = workorder.shiftId;
            woobj.deliveryNo = woobj.orderNo;
            woobj.usedWallet = workorder.usedWallet;
            resobj.order.totalWallet =
              resobj.order.totalWallet + woobj.usedWallet;
            woobj.vatorgst = 0;
            if (
              Array.isArray(workorder.orderInfo) &&
              workorder.orderInfo.length > 0
            ) {
              for (let g = 0; g < workorder.orderInfo.length; g++) {
                if (typeof workorder.orderInfo[g].vatorgst == "number") {
                  woobj.vatorgst =
                    woobj.vatorgst + workorder.orderInfo[g].vatorgst;
                  resobj.order.totalVat =
                    resobj.order.totalVat + workorder.orderInfo[g].vatorgst;
                }
                if (workorder.orderInfo[g].type == 1) {
                  let material = await foodModel.findOne({
                    _id: workorder.orderInfo[g].itemInfo,
                  });

                  if (!isEmpty(material)) {
                    resobj.product.totalfoodsale =
                      resobj.product.totalfoodsale +
                      parseInt(
                        workorder.orderInfo[g].quantity *
                          workorder.orderInfo[g].rate
                      );
                    if (req.body.isDetails) {
                      woobj.items.push({
                        itemName: material.productName,
                        amount:
                          workorder.orderInfo[g].quantity *
                          workorder.orderInfo[g].rate,
                        vatorgst: workorder.orderInfo[g].vatorgst,
                      });
                    }
                  }
                }
              }
            }
            let paymentDetails = await paymentModel.findOne({
              purchasePk: workorder._id,
            });
            if (common_service.checkObject(paymentDetails)) {
              for (let g = 0; g < paymentDetails.paymentMethod.length; g++) {
                if (
                  paymentDetails.paymentMethod[g].shiftId ==
                  shiftDetails.shiftId
                ) {
                  woobj.paidAmountArray.push(
                    paymentDetails.paymentMethod[g].paidAmount
                  );
                  woobj.paidAmount =
                    woobj.paidAmount +
                    paymentDetails.paymentMethod[g].paidAmount;
                  resobj.order.totalBalance =
                    resobj.order.totalBalance +
                    paymentDetails.paymentMethod[g].paidAmount +
                    woobj.usedWallet;
                  let payobj = {};
                  payobj.type = paymentDetails.paymentMethod[g].type;
                  payobj.amount = paymentDetails.paymentMethod[g].paidAmount;
                  payobj.commission = 0;
                  if (
                    paymentDetails.paymentMethod[g].type.toLowerCase() ==
                    PAYMENTTYPES.CARD
                  ) {
                    payobj.vendor = paymentDetails.paymentMethod[g].vendor;
                    let commissionResp = await cardModel.findOne({
                      cardName: payobj.vendor,
                    });
                    if (!isEmpty(commissionResp)) {
                      payobj.commission =
                        payobj.amount *
                        ((!isEmpty(commissionResp)
                          ? commissionResp.commission
                          : 0) /
                          100);
                    }
                    resobj.payment.totalCard =
                      resobj.payment.totalCard + payobj.amount;
                    resobj.commission.totalcardCommission =
                      resobj.commission.totalcardCommission + payobj.commission;
                  } else if (
                    paymentDetails.paymentMethod[g].type.toLowerCase() ==
                    PAYMENTTYPES.CASH
                  ) {
                    payobj.vendor = paymentDetails.paymentMethod[g].type;
                    payobj.commission = 0;
                    resobj.payment.totalCash =
                      resobj.payment.totalCash + payobj.amount;
                  } else if (
                    paymentDetails.paymentMethod[g].type.toLowerCase() ==
                    PAYMENTTYPES.UPIS
                  ) {
                    payobj.vendor = paymentDetails.paymentMethod[g].vendor;
                    resobj.payment.totalUpi =
                      resobj.payment.totalUpi + payobj.amount;
                    let commissionResp = await upiModel.findOne({
                      upiName: payobj.vendor,
                    });
                    if (!isEmpty(commissionResp)) {
                      payobj.commission =
                        payobj.amount *
                        ((!isEmpty(commissionResp)
                          ? commissionResp.commission
                          : 0) /
                          100);
                    }
                  } else if (
                    paymentDetails.paymentMethod[g].type.toLowerCase() ==
                    PAYMENTTYPES.CHEQ.toLocaleLowerCase()
                  ) {
                    payobj.vendor = paymentDetails.paymentMethod[g].vendor;
                    let commissionResp = await chequeModel.findOne({
                      bankName: payobj.vendor,
                    });
                    resobj.payment.totalCheque =
                      resobj.payment.totalCheque + payobj.amount;
                    if (common_service.checkObject(commissionResp)) {
                      payobj.commission =
                        payobj.amount *
                        ((!isEmpty(commissionResp)
                          ? commissionResp.commission
                          : 0) /
                          100);
                    }
                  }
                  woobj.paymenttypes.push(payobj);
                }
              }
              if (woobj.paidAmount < woobj.totalAmount) {
                let creditDetails = await creditModel.findOne({
                  purchasePk: woobj._id.toString(),
                });
                if (common_service.checkObject(creditDetails)) {
                  resobj.order.totalCredit =
                    resobj.order.totalCredit + creditDetails.balance;
                }
              }
            } else {
              let creditDetails = await creditModel.findOne({
                purchasePk: woobj._id.toString(),
              });
              if (common_service.checkObject(creditDetails)) {
                resobj.order.totalCredit =
                  resobj.order.totalCredit + creditDetails.balance;
              }
            }
            resobj.list.push(woobj);
          }
          for (let j = 0; j < paymentList.length; j++) {
            let workorder = {};
            let exist = resobj.list.find(
              (x) => x._id == paymentList[j].purchasePk.toString()
            );
            if (!common_service.checkObject(exist)) {
              let ord = await orderModel.findOne({
                _id: paymentList[j].purchasePk,
              });
              let type = 0;
              if (common_service.checkObject(ord)) {
                workorder = ord;
                type = 1;
              }
              if (typeof workorder._id != "undefined") {
                let woobj = {};
                woobj.items = [];
                woobj.paidAmountArray = [];
                woobj.paymenttypes = [];
                woobj._id = workorder._id;
                woobj.usedWallet = workorder.usedWallet;
                resobj.order.totalWallet =
                  resobj.order.totalWallet + woobj.usedWallet;
                woobj.vatorgst = 0;
                if (type == 1) {
                  woobj.billNo =
                    branch.storeCode.substr(3) +
                    req.decode.prefix.substring(0, 2) +
                    PREFIXES.SALESINV +
                    workorder.orderId;
                  woobj.orderNo = woobj.billNo;
                  woobj.date = common_service
                    .prescisedateconvert(workorder.orderDate)
                    .split(" ")[0];
                  woobj.totalAmount =
                    workorder.totalAmount + workorder.discount;
                  resobj.order.totalOrderAmount =
                    resobj.order.totalOrderAmount + woobj.totalAmount;
                  woobj.discount = workorder.discount ? workorder.discount : 0;
                  woobj.paidAmount = 0;
                  woobj.status = workorder.status;
                  woobj.wodelshiftId = 0;
                  woobj.shiftId = workorder.shiftId;
                  woobj.deliveryNo = woobj.orderNo;

                  if (
                    Array.isArray(workorder.orderInfo) &&
                    workorder.orderInfo.length > 0
                  ) {
                    for (let g = 0; g < workorder.orderInfo.length; g++) {
                      if (typeof workorder.orderInfo[g].vatorgst == "number") {
                        woobj.vatorgst =
                          woobj.vatorgst + workorder.orderInfo[g].vatorgst;
                        resobj.order.totalVat =
                          resobj.order.totalVat +
                          workorder.orderInfo[g].vatorgst;
                      }
                      if (workorder.orderInfo[g].type == 1) {
                        let material = await foodModel.findOne({
                          _id: workorder.orderInfo[g].itemInfo,
                        });

                        if (!isEmpty(material)) {
                          resobj.product.totalfoodsale =
                            resobj.product.totalfoodsale +
                            parseInt(
                              workorder.orderInfo[g].quantity *
                                workorder.orderInfo[g].rate
                            );
                          if (req.body.isDetails) {
                            woobj.items.push({
                              itemName: material.productName,
                              amount:
                                workorder.orderInfo[g].quantity *
                                workorder.orderInfo[g].rate,
                              vatorgst: workorder.orderInfo[g].vatorgst,
                            });
                          }
                        }
                      }
                    }
                  }

                  let paymentDetails = paymentList[j];
                  if (!isEmpty(paymentDetails)) {
                    for (
                      let g = 0;
                      g < paymentDetails.paymentMethod.length;
                      g++
                    ) {
                      if (
                        paymentDetails.paymentMethod[g].shiftId ==
                        shiftDetails.shiftId
                      ) {
                        woobj.paidAmountArray.push(
                          paymentDetails.paymentMethod[g].paidAmount
                        );
                        woobj.paidAmount =
                          woobj.paidAmount +
                          paymentDetails.paymentMethod[g].paidAmount;
                        resobj.order.totalBalance =
                          resobj.order.totalBalance +
                          paymentDetails.paymentMethod[g].paidAmount +
                          woobj.usedWallet;
                        let payobj = {};
                        payobj.type = paymentDetails.paymentMethod[g].type;
                        payobj.amount =
                          paymentDetails.paymentMethod[g].paidAmount;
                        payobj.commission = 0;
                        if (
                          paymentDetails.paymentMethod[g].type.toLowerCase() ==
                          PAYMENTTYPES.CARD
                        ) {
                          payobj.vendor =
                            paymentDetails.paymentMethod[g].vendor;
                          let commissionResp = await cardModel.findOne({
                            cardName: payobj.vendor,
                          });

                          payobj.commission =
                            payobj.amount *
                            ((!isEmpty(commissionResp)
                              ? commissionResp.commission
                              : 0) /
                              100);
                          resobj.payment.totalCard =
                            resobj.payment.totalCard + payobj.amount;
                          resobj.commission.totalcardCommission =
                            resobj.commission.totalcardCommission +
                            payobj.commission;
                        } else if (
                          paymentDetails.paymentMethod[g].type.toLowerCase() ==
                          PAYMENTTYPES.CASH
                        ) {
                          payobj.vendor = paymentDetails.paymentMethod[g].type;
                          payobj.commission = 0;
                          resobj.payment.totalCash =
                            resobj.payment.totalCash + payobj.amount;
                        } else if (
                          paymentDetails.paymentMethod[g].type.toLowerCase() ==
                          PAYMENTTYPES.UPIS
                        ) {
                          payobj.vendor =
                            paymentDetails.paymentMethod[g].vendor;
                          let commissionResp = await upiModel.findOne({
                            upiName: payobj.vendor,
                          });
                          payobj.commission =
                            payobj.amount *
                            ((!isEmpty(commissionResp)
                              ? commissionResp.commission
                              : 0) /
                              100);
                        } else if (
                          paymentDetails.paymentMethod[g].type.toLowerCase() ==
                          PAYMENTTYPES.CHEQ.toLocaleLowerCase()
                        ) {
                          payobj.vendor =
                            paymentDetails.paymentMethod[g].vendor;
                          let commissionResp = await chequeModel.findOne({
                            bankName: payobj.vendor,
                          });
                          resobj.payment.totalCheque =
                            resobj.payment.totalCheque + payobj.amount;
                          if (common_service.checkObject(commissionResp)) {
                            payobj.commission =
                              payobj.amount *
                              ((!isEmpty(commissionResp)
                                ? commissionResp.commission
                                : 0) /
                                100);
                          }
                        }
                        woobj.paymenttypes.push(payobj);
                      }
                    }
                  }
                }
                if (woobj.paidAmount < woobj.totalAmount) {
                  let creditDetails = await creditModel.findOne({
                    purchasePk: woobj._id.toString(),
                  });
                  if (common_service.checkObject(creditDetails)) {
                    resobj.order.totalCredit =
                      resobj.order.totalCredit + creditDetails.balance;
                  }
                }

                resobj.list.push(woobj);
              }
            }
          }
          for (let j = 0; j < returnList.length; j++) {
            let workorder = returnList[j];
            let woobj = {};
            woobj.items = [];
            woobj.paidAmountArray = [];
            woobj.paymenttypes = [];
            woobj.vatorgst = 0;
            woobj.usedWallet = 0;
            woobj._id = workorder._id;
            woobj._id = returnList[j]._id;
            woobj.billNo = returnList[j].invoiceNo;
            woobj.orderNo =
              branch.storeCode.substr(3) +
              PREFIXES.SALESRETURN +
              returnList[j].transNo;
            woobj.date = common_service
              .prescisedateconvert(returnList[j].returnDate)
              .split(" ")[0];
            woobj.totalAmount = 0;
            returnList[j].returnInfo.map((x) => {
              if (x.originalAmt != undefined) {
                woobj.totalAmount = woobj.totalAmount + x.originalAmt;
              }
            });
            woobj.discount = returnList[j].discount
              ? returnList[j].discount
              : 0;
            woobj.paidAmount = 0;
            woobj.status = ORDERSTATUS.RET;
            woobj.wodelshiftId = returnList[j].shiftId;
            woobj.shiftId = returnList[j].shiftId;
            woobj.deliveryNo = woobj.billNo;
            await Promise.all(
              returnList[j].returnInfo.map(async (x) => {
                let material = {};
                if (common_service.isObjectId(x.itemInfo)) {
                  if (x.itemType == 1) {
                    material = await foodModel.findOne({
                      _id: x.itemInfo,
                    });
                  }
                }
                if (!isEmpty(material)) {
                  if (material.prod_name) {
                    woobj.items.push({
                      itemName: material?.prod_name,
                      amount: x.originalAmt,
                    });
                  }
                }
              })
            );
            let paymentDetails = await returnPaymentModel.findOne({
              purchasePk: returnList[j]._id,
            });
            if (isEmpty(paymentDetails)) {
              paymentDetails = await returnPaymentModel.findOne({
                invoiceNo: PREFIXES.SALESRETURN + returnList[j].transNo,
                branchId: returnList[j].branchId,
              });
            }
            if (!isEmpty(paymentDetails)) {
              for (let g = 0; g < paymentDetails.paymentMethod.length; g++) {
                if (
                  paymentDetails.paymentMethod[g].shiftId ==
                  returnList[j].shiftId
                ) {
                  woobj.paidAmountArray.push(
                    paymentDetails.paymentMethod[g].paidAmount
                  );
                  woobj.paidAmount =
                    woobj.paidAmount +
                    paymentDetails.paymentMethod[g].paidAmount;
                  let payobj = {};
                  payobj.type = paymentDetails.paymentMethod[g].type;
                  payobj.amount = paymentDetails.paymentMethod[g].paidAmount;
                  resobj.payment.totalReturn =
                    resobj.payment.totalReturn +
                    paymentDetails.paymentMethod[g].paidAmount;
                  payobj.commission = 0;
                  if (
                    paymentDetails.paymentMethod[g].type.toLowerCase() ==
                    PAYMENTTYPES.CARD
                  ) {
                    payobj.vendor = paymentDetails.paymentMethod[g].vendor;
                    let commissionResp = await cardModel.findOne({
                      cardName: payobj.vendor,
                    });
                    payobj.commission =
                      payobj.amount *
                      (!isEmpty(commissionResp)
                        ? commissionResp.commission
                        : 0 / 100);
                  } else if (
                    paymentDetails.paymentMethod[g].type.toLowerCase() ==
                    PAYMENTTYPES.CASH
                  ) {
                    payobj.vendor = paymentDetails.paymentMethod[g].type;
                    payobj.commission = 0;
                  } else if (
                    paymentDetails.paymentMethod[g].type.toLowerCase() ==
                    PAYMENTTYPES.UPIS
                  ) {
                    payobj.vendor = paymentDetails.paymentMethod[g].vendor;
                    let commissionResp = await upiModel.findOne({
                      upiName: payobj.vendor,
                    });
                    payobj.commission =
                      payobj.amount *
                      (!isEmpty(commissionResp)
                        ? commissionResp.commission
                        : 0 / 100);
                  }
                  woobj.paymenttypes.push(payobj);
                }
              }
            }
            resobj.list.push(woobj);
          }
          rsList.push(shiftObj);
          let end =
            typeof shiftDetails.endDate == "number"
              ? shiftDetails.endDate
              : common_service.startandenddateofaday(new Date().getTime()).end;

          let pettycashexpenselist = await pettycashModel.find({
            branchId: req.body.branchId,
            date: { $gt: shiftDetails.startDate, $lt: end },
          });
          if (
            Array.isArray(pettycashexpenselist) &&
            pettycashexpenselist.length > 0
          ) {
            pettycashexpenselist.map((x) => {
              resobj.expenses.pettyvoucherexpense =
                resobj.expenses.pettyvoucherexpense + x.amount;
              resobj.expensetable.openingBalance =
                resobj.expensetable.openingBalance + x.amount;
            });
          }
          let outletExpenseList = await outletExpenseModel.find({
            branchId: req.body.branchId,
            shiftId: shiftDetails.shiftId,
          });
          if (
            Array.isArray(outletExpenseList) &&
            outletExpenseList.length > 0
          ) {
            await Promise.all(
              outletExpenseList.map(async (x, i) => {
                resobj.expenses.cashexpense =
                  resobj.expenses.cashexpense + x.amount;
                let typeexpenseExist = await expenseTypeModel.findOne({
                  _id: x.expenseType,
                });

                if (!common_service.isEmpty(typeexpenseExist)) {
                  x._doc["expenseName"] = typeexpenseExist.expenseType;
                } else {
                  x._doc["expenseName"] = "No expense";
                }

                resobj.expensetable.crTot =
                  resobj.expensetable.crTot +
                  (!x.creditAmount ? 0 : x.creditAmount);
                resobj.expensetable.debTot =
                  resobj.expensetable.debTot + x.amount;

                resobj.expensetable.expenseList.push({
                  expenseName: x._doc["expenseName"],
                  date: common_service
                    .prescisedateconvert(x.date)
                    .split(" ")[0],
                  debit: x.amount,
                  credit: !x.creditAmount ? 0 : x.creditAmount,
                });
                resobj.expensetable.balance =
                  resobj.expensetable.balance - x.amount;
              })
            );
          }
        }
        resobj.list.map((x) => {});
        resobj.expenses.total =
          resobj.expenses.pettyvoucherexpense + resobj.expenses.cashexpense;
        resobj.totalAmount =
          resobj.payment.totalCard +
          resobj.payment.totalCash +
          resobj.payment.totalUpi +
          resobj.payment.totalCheque +
          resobj.order.totalWallet;
        resobj.totalSalesAfterExpense =
          resobj.payment.totalCard +
          resobj.payment.totalCash +
          resobj.payment.totalUpi +
          resobj.order.totalWallet -
          resobj.expenses.total -
          resobj.payment.totalReturn;
        resobj.commission.totalCardAfterCommission =
          resobj.payment.totalCard - resobj.commission.totalcardCommission;
        resobj.product.totalCashExpense = resobj.product.totalfoodsale;
        resobj.grandTotalOnHand =
          resobj.payment.totalCard +
          resobj.payment.totalCash +
          resobj.payment.totalUpi -
          resobj.payment.totalReturn -
          resobj.commission.totalcardCommission -
          resobj.commission.totalUpiCommission +
          resobj.order.totalWallet;
        return (res = { data: resobj, status: STATUSCODES.SUCCESS });
      }
    } else {
      return (res = {
        data: { msg: "Invalid Branch" },
        status: STATUSCODES.FORBIDDEN,
      });
    }
  } catch (e) {
    console.error(e);
    return (res = { data: { msg: e }, status: STATUSCODES.ERROR });
  }
};

// added on 14-07-23
module.exports.stockReport = async (req) => {
  const { stockModel, stockLogModel } = conn.stock(req.decode.db);
  const { productModel, unitModel } = conn.product(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let retObj = {
      stkPriceTotal: 0,
      salPriceTotal: 0,
      clStockPriceTotal: 0,
      totalsales: 0,
      totalclosingStock: 0,
      totalStock: 0,
      rsList: [],
    };

    let itemList = await stockModel.find({});
    if (req.body.itemType) {
      itemList = itemList.filter(
        (x) => x.itemType == parseInt(req.body.itemType)
      );
    }
    if (req.body.branchId) {
      itemList = itemList.filter((x) => x.branchId == req.body.branchId);
    }

    if (req.body.itemId) {
      itemList = itemList.filter((x) => x.itemId.toString() == req.body.itemId);
    }
    for (let i = 0; i < itemList.length; i++) {
      const itemElement = itemList[i];
      let product = { productId: "no id", productName: "no name" };
      let productExist = {};
      if (itemElement.itemType == 0) {
        productExist = await productModel.findOne({
          _id: itemElement.itemId,
        });
      }
      if (itemElement.itemType == 1) {
        productExist = await foodModel.findOne({
          _id: itemElement.itemId,
        });
      }

      if (!isEmpty(productExist)) {
        if (itemElement.itemType == 0) {
          product.productId = productExist.code;
          product.productName = productExist.productName;
        } else {
          product.productId = productExist.prod_id;
          product.productName = productExist.prod_name;
        }
      }
      let unitExist = {};
      if (
        !isEmpty(productExist) &&
        common_service.isObjectId(productExist.unit)
      ) {
        unitExist = await unitModel.findOne({ _id: productExist.unit });
      }

      let branchElement = await branchModel.findOne({
        storeCode: itemElement.branchId,
      });
      if (isEmpty(branchElement)) {
        return (res = {
          data: { msg: `no branch with this id:${itemElement.branchId}` },
          status: STATUSCODES.NOTFOUND,
        });
      }
      if (Array.isArray(itemElement.stock) && itemElement.stock.length > 0) {
        for (let j = 0; j < itemElement.stock.length; j++) {
          const stkobj = itemElement.stock[j];
          let stockList = [];
          let prevstockList = [];
          if (
            (common_service.checkIfNullOrUndefined(req.body.fromDate),
            req.body.endDate)
          ) {
            stockList = await stockLogModel.find({
              branchId: branchElement.storeCode,
              itemId: itemElement.itemId.toString(),
              "stock.dimension": stkobj.dimension,
              date: {
                $gte: new Date(req.body.fromDate).getTime(),
                $lte: new Date(req.body.endDate).getTime(),
              },
              type: { $ne: null },
            });
            prevstockList = await stockLogModel.find({
              itemId: itemElement.itemId.toString(),
              "stock.dimension": stkobj.dimension,
              date: { $lt: new Date(req.body.fromDate).getTime() },
            });

            if (req.body.branchId) {
              prevstockList = prevstockList.filter(
                (x) => x.branchId == req.body.branchId
              );
            }
          }
          if (Array.isArray(stockList) && stockList.length > 0) {
            for (let c = 0; c < stockList.length; c++) {
              const stockElement = stockList[c];
              if (retObj.rsList.length == 0) {
                let resobj = {};
                resobj.branchId = req.body.branchId
                  ? branchElement.storeCode
                  : "No Code";
                resobj.locationName = req.body.branchId
                  ? branchElement.branchName
                  : "All Branches";
                resobj.list = [];
                resobj.stkPriceTotal = 0;
                resobj.salPriceTotal = 0;
                resobj.clStockPriceTotal = 0;
                let newresobj = {};

                newresobj._id = itemElement.itemId;
                newresobj.productCode =
                  itemElement.itemType == 0
                    ? "PROD" + product.productId
                    : "FOOD" + product.productId;
                newresobj.productName = product.productName;

                newresobj.size = stkobj.dimension;
                newresobj.filter = stkobj.dimension;
                newresobj.sales = 0;
                newresobj.purchases = 0;
                newresobj.transIn = 0;
                newresobj.salesReturn = 0;
                newresobj.postAdj = 0;
                newresobj.transOut = 0;
                newresobj.negativeStockAdjustment = 0;
                newresobj.purchaseReturn = 0;
                newresobj.quantity = 0;
                newresobj.stockPrice = 0;
                newresobj.salesprice = 0;
                newresobj.closingstockPrice = 0;
                newresobj.closingstock = 0;
                newresobj.recipie = 0;
                if (Array.isArray(prevstockList)) {
                  prevstockList.map((x) => {
                    if (Array.isArray(x.stock)) {
                      newresobj.quantity =
                        newresobj.quantity + x.stock[0].dimensionStock;
                    }
                  });
                }
                if (stockElement.type != undefined) {
                  if (
                    stockElement.type == PREFIXES.WORKORDER ||
                    stockElement.type == PREFIXES.SALESINV ||
                    stockElement.type == PREFIXES.ALTERATION
                  ) {
                    newresobj.sales =
                      newresobj.sales - stockElement.stock[0].dimensionStock;
                    newresobj.salesprice =
                      newresobj.salesprice +
                      (typeof stockElement.rate == "number"
                        ? stockElement.rate
                        : 0);
                  }
                  if (
                    stockElement.type == PREFIXES.GRN ||
                    stockElement.type == PREFIXES.PURCHASEWPO
                  ) {
                    newresobj.purchases =
                      newresobj.purchases +
                      stockElement.stock[0].dimensionStock;
                  }
                  if (stockElement.type == PREFIXES.STOCKADJUSTMENT) {
                    if (stockElement.stock[0].dimensionStock > 0) {
                      newresobj.postAdj =
                        newresobj.postAdj +
                        stockElement.stock[0].dimensionStock;
                      newresobj.stockPrice =
                        newresobj.stockPrice +
                        (typeof stockElement.rate == "number"
                          ? stockElement.rate
                          : 0);
                      newresobj.closingstockPrice = newresobj.stockPrice;
                    } else {
                      newresobj.negativeStockAdjustment =
                        newresobj.negativeStockAdjustment -
                        stockElement.stock[0].dimensionStock;
                    }
                  }
                  if (stockElement.type == PREFIXES.STOCKTRANSFER) {
                    if (stockElement.stock[0].dimensionStock > 0) {
                      newresobj.transIn =
                        newresobj.transIn +
                        stockElement.stock[0].dimensionStock;
                    } else {
                      newresobj.transOut =
                        newresobj.transOut -
                        stockElement.stock[0].dimensionStock;
                    }
                  }
                  if (stockElement.type == PREFIXES.SALESRETURN) {
                    newresobj.salesReturn =
                      newresobj.salesReturn +
                      stockElement.stock[0].dimensionStock;
                  }
                  if (stockElement.type == PREFIXES.PURCHASERETURN) {
                    newresobj.purchaseReturn =
                      newresobj.purchaseReturn -
                      stockElement.stock[0].dimensionStock;
                  }
                  if (stockElement.type == PREFIXES.RECEIPIENT) {
                    newresobj.recipie =
                      newresobj.recipie - stockElement.stock[0].dimensionStock;
                  }
                }
                newresobj.closingstock =
                  newresobj.quantity +
                  newresobj.transIn +
                  newresobj.postAdj +
                  newresobj.salesReturn +
                  newresobj.purchases -
                  newresobj.sales -
                  newresobj.negativeStockAdjustment -
                  newresobj.transOut -
                  newresobj.purchaseReturn +
                  newresobj.recipie;
                resobj.list.push(newresobj);

                retObj.rsList.push(resobj);
              } else {
                let branchFind = retObj.rsList.find((x) =>
                  x.locationName == req.body.branchId
                    ? branchElement.branchName
                    : "All Branches"
                );

                if (branchFind.list.length == 0) {
                  let newresobj = {};

                  newresobj._id = itemElement._id;
                  newresobj.productCode =
                    itemElement.itemType == 0
                      ? "PROD" + product.productId
                      : "FOOD" + product.productId;
                  newresobj.productName = product.productName;

                  newresobj.size = stkobj.dimension;
                  newresobj.filter = stkobj.dimension;
                  newresobj.sales = 0;
                  newresobj.purchases = 0;
                  newresobj.transIn = 0;
                  newresobj.salesReturn = 0;
                  newresobj.postAdj = 0;
                  newresobj.transOut = 0;
                  newresobj.negativeStockAdjustment = 0;
                  newresobj.purchaseReturn = 0;
                  newresobj.quantity = 0;
                  newresobj.stockPrice = 0;
                  newresobj.salesprice = 0;
                  newresobj.closingstockPrice = 0;
                  newresobj.closingstock = 0;
                  newresobj.recipie = 0;
                  if (Array.isArray(prevstockList)) {
                    prevstockList.map((x) => {
                      if (Array.isArray(x.stock)) {
                        newresobj.quantity =
                          newresobj.quantity + x.stock[0].dimensionStock;
                      }
                    });
                  }
                  if (stockElement.type != undefined) {
                    if (
                      stockElement.type == PREFIXES.WORKORDER ||
                      stockElement.type == PREFIXES.SALESINV ||
                      stockElement.type == PREFIXES.ALTERATION
                    ) {
                      newresobj.sales =
                        newresobj.sales - stockElement.stock[0].dimensionStock;
                      newresobj.salesprice =
                        newresobj.salesprice +
                        (typeof stockElement.rate == "number"
                          ? stockElement.rate
                          : 0);
                    }

                    if (
                      stockElement.type == PREFIXES.GRN ||
                      stockElement.type == PREFIXES.PURCHASEWPO
                    ) {
                      newresobj.purchases =
                        newresobj.purchases +
                        stockElement.stock[0].dimensionStock;
                    }
                    if (stockElement.type == PREFIXES.STOCKADJUSTMENT) {
                      if (stockElement.stock[0].dimensionStock > 0) {
                        newresobj.postAdj =
                          newresobj.postAdj +
                          stockElement.stock[0].dimensionStock;
                        newresobj.stockPrice =
                          newresobj.stockPrice +
                          (typeof stockElement.rate == "number"
                            ? stockElement.rate
                            : 0);
                        newresobj.closingstockPrice = newresobj.stockPrice;
                      } else {
                        newresobj.negativeStockAdjustment =
                          newresobj.negativeStockAdjustment -
                          stockElement.stock[0].dimensionStock;
                      }
                    }
                    if (stockElement.type == PREFIXES.STOCKTRANSFER) {
                      if (stockElement.stock[0].dimensionStock > 0) {
                        newresobj.transIn =
                          newresobj.transIn +
                          stockElement.stock[0].dimensionStock;
                      } else {
                        newresobj.transOut =
                          newresobj.transOut -
                          stockElement.stock[0].dimensionStock;
                      }
                    }
                    if (stockElement.type == PREFIXES.SALESRETURN) {
                      newresobj.salesReturn =
                        newresobj.salesReturn + element.stock[0].dimensionStock;
                    }
                    if (stockElement.type == PREFIXES.PURCHASERETURN) {
                      newresobj.purchaseReturn =
                        newresobj.purchaseReturn -
                        element.stock[0].dimensionStock;
                    }
                    if (stockElement.type == PREFIXES.RECEIPIENT) {
                      newresobj.recipie =
                        newresobj.recipie -
                        stockElement.stock[0].dimensionStock;
                    }
                  }
                  newresobj.closingstock =
                    newresobj.quantity +
                    newresobj.transIn +
                    newresobj.postAdj +
                    newresobj.salesReturn +
                    newresobj.purchases -
                    newresobj.sales -
                    newresobj.negativeStockAdjustment -
                    newresobj.transOut -
                    newresobj.purchaseReturn +
                    newresobj.recipie;

                  branchFind.list.push(newresobj);
                } else {
                  let itemExist = branchFind.list.find(
                    (x) =>
                      x._id == itemElement.itemId &&
                      x.filter == stkobj.dimension
                  );

                  if (isEmpty(itemExist)) {
                    let newresobj = {};

                    newresobj._id = itemElement.itemId;
                    newresobj.productCode =
                      itemElement.itemType == 0
                        ? "PROD" + product.productId
                        : "FOOD" + product.productId;
                    newresobj.productName = product.productName;

                    newresobj.size = stkobj.dimension;
                    newresobj.filter = stkobj.dimension;
                    newresobj.sales = 0;
                    newresobj.purchases = 0;
                    newresobj.transIn = 0;
                    newresobj.salesReturn = 0;
                    newresobj.postAdj = 0;
                    newresobj.transOut = 0;
                    newresobj.negativeStockAdjustment = 0;
                    newresobj.purchaseReturn = 0;
                    newresobj.quantity = 0;
                    newresobj.stockPrice = 0;
                    newresobj.salesprice = 0;
                    newresobj.closingstockPrice = 0;
                    newresobj.closingstock = 0;

                    newresobj.recipie = 0;

                    if (Array.isArray(prevstockList)) {
                      prevstockList.map((x) => {
                        if (Array.isArray(x.stock)) {
                          newresobj.quantity =
                            newresobj.quantity + x.stock[0].dimensionStock;
                        }
                      });
                    }
                    if (stockElement.type != undefined) {
                      if (
                        stockElement.type == PREFIXES.WORKORDER ||
                        stockElement.type == PREFIXES.SALESINV ||
                        stockElement.type == PREFIXES.ALTERATION
                      ) {
                        newresobj.sales =
                          newresobj.sales -
                          stockElement.stock[0].dimensionStock;
                        newresobj.salesprice =
                          newresobj.salesprice +
                          (typeof stockElement.rate == "number"
                            ? stockElement.rate
                            : 0);
                      }

                      if (
                        stockElement.type == PREFIXES.GRN ||
                        stockElement.type == PREFIXES.PURCHASEWPO
                      ) {
                        newresobj.purchases =
                          newresobj.purchases +
                          stockElement.stock[0].dimensionStock;
                      }
                      if (stockElement.type == PREFIXES.STOCKADJUSTMENT) {
                        if (stockElement.stock[0].dimensionStock > 0) {
                          newresobj.postAdj =
                            newresobj.postAdj +
                            stockElement.stock[0].dimensionStock;
                          newresobj.closingstockPrice = newresobj.stockPrice;
                          newresobj.stockPrice =
                            newresobj.stockPrice +
                            (typeof stockElement.rate == "number"
                              ? stockElement.rate
                              : 0);
                        } else {
                          newresobj.negativeStockAdjustment =
                            newresobj.negativeStockAdjustment -
                            stockElement.stock[0].dimensionStock;
                        }
                      }
                      if (stockElement.type == PREFIXES.STOCKTRANSFER) {
                        if (stockElement.stock[0].dimensionStock > 0) {
                          newresobj.transIn =
                            newresobj.transIn +
                            stockElement.stock[0].dimensionStock;
                        } else {
                          newresobj.transOut =
                            newresobj.transOut -
                            stockElement.stock[0].dimensionStock;
                        }
                      }
                      if (stockElement.type == PREFIXES.SALESRETURN) {
                        newresobj.salesReturn =
                          newresobj.salesReturn +
                          stockElement.stock[0].dimensionStock;
                      }
                      if (stockElement.type == PREFIXES.PURCHASERETURN) {
                        newresobj.purchaseReturn =
                          newresobj.purchaseReturn -
                          stockElement.stock[0].dimensionStock;
                      }
                      if (stockElement.type == PREFIXES.RECEIPIENT) {
                        newresobj.recipie =
                          newresobj.recipie -
                          stockElement.stock[0].dimensionStock;
                      }
                    }
                    newresobj.closingstock =
                      newresobj.quantity +
                      newresobj.transIn +
                      newresobj.postAdj +
                      newresobj.salesReturn +
                      newresobj.purchases -
                      newresobj.sales -
                      newresobj.negativeStockAdjustment -
                      newresobj.transOut -
                      newresobj.purchaseReturn +
                      newresobj.recipie;

                    branchFind.list.push(newresobj);
                  } else {
                    if (stockElement.type != undefined) {
                      if (
                        stockElement.type == PREFIXES.WORKORDER ||
                        stockElement.type == PREFIXES.SALESINV ||
                        stockElement.type == PREFIXES.ALTERATION
                      ) {
                        itemExist.sales =
                          itemExist.sales -
                          stockElement.stock[0].dimensionStock;
                        itemExist.salesprice =
                          itemExist.salesprice +
                          (typeof stockElement.rate == "number"
                            ? stockElement.rate
                            : 0);
                      }
                      if (
                        stockElement.type == PREFIXES.GRN ||
                        stockElement.type == PREFIXES.PURCHASEWPO
                      ) {
                        itemExist.purchases =
                          itemExist.purchases +
                          stockElement.stock[0].dimensionStock;
                      }
                      if (stockElement.type == PREFIXES.STOCKADJUSTMENT) {
                        if (stockElement.stock[0].dimensionStock > 0) {
                          itemExist.postAdj =
                            itemExist.postAdj +
                            stockElement.stock[0].dimensionStock;
                          itemExist.stockPrice =
                            itemExist.stockPrice +
                            (typeof stockElement.rate == "number"
                              ? stockElement.rate
                              : 0);
                          itemExist.closingstockPrice = itemExist.stockPrice;
                        } else {
                          itemExist.negativeStockAdjustment =
                            itemExist.negativeStockAdjustment -
                            stockElement.stock[0].dimensionStock;
                        }
                      }
                      if (stockElement.type == PREFIXES.STOCKTRANSFER) {
                        if (stockElement.stock[0].dimensionStock > 0) {
                          itemExist.transIn =
                            itemExist.transIn +
                            stockElement.stock[0].dimensionStock;
                        } else {
                          itemExist.transOut =
                            itemExist.transOut -
                            stockElement.stock[0].dimensionStock;
                        }
                      }
                      if (stockElement.type == PREFIXES.SALESRETURN) {
                        itemExist.salesReturn =
                          itemExist.salesReturn +
                          stockElement.stock[0].dimensionStock;
                      }
                      if (stockElement.type == PREFIXES.PURCHASERETURN) {
                        itemExist.purchaseReturn =
                          itemExist.purchaseReturn -
                          stockElement.stock[0].dimensionStock;
                      }

                      if (stockElement.type == PREFIXES.RECEIPIENT) {
                        itemExist.recipie =
                          itemExist.recipie -
                          stockElement.stock[0].dimensionStock;
                      }
                    }
                    itemExist.closingstock =
                      itemExist.quantity +
                      itemExist.transIn +
                      itemExist.postAdj +
                      itemExist.salesReturn +
                      itemExist.purchases -
                      itemExist.sales -
                      itemExist.negativeStockAdjustment -
                      itemExist.transOut -
                      itemExist.purchaseReturn +
                      itemExist.recipie;
                  }
                }
              }
            }
          } else {
            if (retObj.rsList.length == 0) {
              let resobj = {};
              resobj.branchId = req.body.branchId
                ? branchElement.storeCode
                : "No Code";
              resobj.locationName = req.body.branchId
                ? branchElement.branchName
                : "All Branches";
              resobj.list = [];
              resobj.stkPriceTotal = 0;
              resobj.salPriceTotal = 0;
              resobj.clStockPriceTotal = 0;
              let newresobj = {};
              newresobj._id = itemElement.itemId;
              newresobj.productCode =
                itemElement.itemType == 0
                  ? "PROD" + product.productId
                  : "FOOD" + product.productId;
              newresobj.productName = product.productName;

              newresobj.size = stkobj.dimension;
              newresobj.filter = stkobj.dimension;
              newresobj.sales = 0;
              newresobj.purchases = 0;
              newresobj.transIn = 0;
              newresobj.salesReturn = 0;
              newresobj.postAdj = 0;
              newresobj.transOut = 0;
              newresobj.negativeStockAdjustment = 0;
              newresobj.purchaseReturn = 0;
              newresobj.quantity = 0;
              newresobj.stockPrice = 0;
              newresobj.salesprice = 0;
              newresobj.closingstockPrice = 0;
              newresobj.closingstock = 0;
              newresobj.recipie = 0;
              if (Array.isArray(prevstockList)) {
                prevstockList.map((x) => {
                  if (Array.isArray(x.stock)) {
                    newresobj.quantity =
                      newresobj.quantity + x.stock[0].dimensionStock;
                  }
                });
              }
              newresobj.closingstock =
                newresobj.quantity +
                newresobj.transIn +
                newresobj.postAdj +
                newresobj.salesReturn +
                newresobj.purchases -
                newresobj.sales -
                newresobj.negativeStockAdjustment -
                newresobj.transOut -
                newresobj.purchaseReturn +
                newresobj.recipie;

              resobj.list.push(newresobj);

              retObj.rsList.push(resobj);
            } else {
              let branchFind = retObj.rsList.find((x) =>
                x.locationName == req.body.branchId
                  ? branchElement.branchName
                  : "All Branches"
              );
              if (branchFind.list.length == 0) {
                let newresobj = {};

                newresobj._id = itemElement.itemId;
                newresobj.productCode =
                  itemElement.itemType == 0
                    ? "PROD" + product.productId
                    : "FOOD" + product.productId;
                newresobj.productName = product.productName;

                newresobj.size = stkobj.dimension;
                newresobj.filter = stkobj.dimension;
                newresobj.sales = 0;
                newresobj.purchases = 0;
                newresobj.transIn = 0;
                newresobj.salesReturn = 0;
                newresobj.postAdj = 0;
                newresobj.transOut = 0;
                newresobj.negativeStockAdjustment = 0;
                newresobj.purchaseReturn = 0;
                newresobj.quantity = 0;
                newresobj.stockPrice = 0;
                newresobj.salesprice = 0;
                newresobj.closingstockPrice = 0;
                newresobj.closingstock = 0;
                newresobj.recipie = 0;
                if (Array.isArray(prevstockList)) {
                  prevstockList.map((x) => {
                    if (Array.isArray(x.stock)) {
                      newresobj.quantity =
                        newresobj.quantity + x.stock[0].dimensionStock;
                    }
                  });
                }
                newresobj.closingstock =
                  newresobj.quantity +
                  newresobj.transIn +
                  newresobj.postAdj +
                  newresobj.salesReturn +
                  newresobj.purchases -
                  newresobj.sales -
                  newresobj.negativeStockAdjustment -
                  newresobj.transOut -
                  newresobj.purchaseReturn +
                  newresobj.recipie;
                branchFind.list.push(newresobj);
              } else {
                let itemExist = branchFind.list.find(
                  (x) =>
                    x._id == itemElement.itemId && x.filter == stkobj.dimension
                );
                if (isEmpty(itemExist)) {
                  let newresobj = {};

                  newresobj._id = itemElement.itemId;
                  newresobj.productCode =
                    itemElement.itemType == 0
                      ? "PROD" + product.productId
                      : "FOOD" + product.productId;
                  newresobj.productName = product.productName;

                  newresobj.size = stkobj.dimension;
                  newresobj.filter = stkobj.dimension;
                  newresobj.sales = 0;
                  newresobj.purchases = 0;
                  newresobj.transIn = 0;
                  newresobj.salesReturn = 0;
                  newresobj.postAdj = 0;
                  newresobj.transOut = 0;
                  newresobj.negativeStockAdjustment = 0;
                  newresobj.purchaseReturn = 0;
                  newresobj.quantity = 0;
                  newresobj.stockPrice = 0;
                  newresobj.salesprice = 0;
                  newresobj.closingstockPrice = 0;
                  newresobj.closingstock = 0;

                  newresobj.recipie = 0;

                  if (Array.isArray(prevstockList)) {
                    prevstockList.map((x) => {
                      if (Array.isArray(x.stock)) {
                        newresobj.quantity =
                          newresobj.quantity + x.stock[0].dimensionStock;
                      }
                    });
                  }
                  newresobj.closingstock =
                    newresobj.quantity +
                    newresobj.transIn +
                    newresobj.postAdj +
                    newresobj.salesReturn +
                    newresobj.purchases -
                    newresobj.sales -
                    newresobj.negativeStockAdjustment -
                    newresobj.transOut -
                    newresobj.purchaseReturn +
                    newresobj.recipie;

                  branchFind.list.push(newresobj);
                }
              }
            }
          }
        }
      }
    }
    if (req.body.inactive != "true") {
      if (retObj.rsList[0] != undefined) {
        retObj.rsList[0].list = retObj.rsList[0].list.filter(
          (y) => y.quantity != y.closingstock
        );
      }
    }
    retObj.rsList.map((x) => {
      if (Array.isArray(x.list)) {
        x.list.map((y) => {
          y.closingstock = y.closingstock > 0 ? y.closingstock : 0;
          y.sales = y.sales > 0 ? y.sales : 0;
          x.clStockPriceTotal = x.clStockPriceTotal + y.closingstockPrice;
          x.salPriceTotal = x.salPriceTotal + y.salesprice;
          x.stkPriceTotal = x.stkPriceTotal + y.stockPrice;
          retObj.totalStock =
            retObj.totalStock +
            y.quantity +
            y.transIn +
            y.postAdj +
            y.salesReturn;
          retObj.totalsales = retObj.totalsales + y.sales;
          retObj.totalclosingStock = retObj.totalclosingStock + y.closingstock;
          retObj.stkPriceTotal = retObj.stkPriceTotal + y.stockPrice;
          retObj.salPriceTotal = retObj.salPriceTotal + y.salesprice;
          retObj.clStockPriceTotal =
            retObj.clStockPriceTotal + y.closingstockPrice;
        });
      }
    });
    if (retObj.rsList.length > 0)
      return (res = { data: retObj, status: STATUSCODES.SUCCESS });
    else return (res = { data: {}, status: STATUSCODES.NOTFOUND });
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 04-02-23
module.exports.updateCredit = async (req) => {
  const { creditModel, paymentModel } = conn.payment(req.decode.db);
  const { shiftLogModel, logModel } = conn.settings(req.decode.db);
  const { orderModel } = conn.order(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let branch = {};
    if (common_service.isObjectId(req.body.branchId)) {
      branch = await branchModel.findOne({ _id: req.body.branchId });
    } else {
      branch = await branchModel.findOne({ storeCode: req.body.branchId });
    }
    if (isEmpty(branch)) {
      return (res = {
        data: { msg: "Invalid branch" },
        status: STATUSCODES.FORBIDDEN,
      });
    }
    let activeShift = await shiftLogModel.findOne({
      status: SHIFTSTATUS.ACT,
      branchId: branch.storeCode,
    });
    let paidAmount = 0;
    let paymentresp = {};
    let paymentData = {};
    if (!isEmpty(activeShift) && activeShift.shiftId > 0) {
      let creditmainExist = await creditModel.findOne({
        purchasePk: req.body.purchasePk,
      });

      if (!isEmpty(creditmainExist)) {
        creditmainExist.discount = creditmainExist.discount + req.body.discount;
        if (
          Array.isArray(req.body.creditCleared) &&
          req.body.creditCleared.length > 0
        ) {
          await Promise.all(
            req.body.creditCleared.map((x) => {
              req.body.paymentMethod[0].paidAmount =
                req.body.paymentMethod[0].paidAmount - x.balance;
            })
          );
        }
        if (
          Array.isArray(req.body.paymentMethod) &&
          req.body.paymentMethod.length > 0
        ) {
          await Promise.all(
            req.body.paymentMethod.map((x) => {
              paidAmount = paidAmount + x.paidAmount;
              x.shiftId = activeShift.shiftId;
              x.uuid = common_service.generateUuid();
            })
          );
        }
        if (
          Array.isArray(req.body.creditCleared) &&
          req.body.creditCleared.length > 0
        ) {
          for (let i = 0; i < req.body.creditCleared.length; i++) {
            const element = req.body.creditCleared[i];
            let creditExist = await creditModel.findOne({
              purchasePk: element.order_id,
            });
            if (!isEmpty(creditExist)) {
              if (creditExist.balance > 0) {
                creditExist.balance = creditExist.balance - element.balance;
                creditExist.lastPaidDate = new Date(Date.now()).getTime();
                creditExist.paidAmount =
                  creditExist.paidAmount + element.balance;
                creditExist.status =
                  creditExist.balance == 0
                    ? CREDITSTATUS.COM
                    : CREDITSTATUS.PEN;
                let creditDataResponse = await creditModel.findOneAndUpdate(
                  { _id: creditExist._id },
                  {
                    $set: {
                      balance: creditExist.balance,
                      lastPaidDate: creditExist.lastPaidDate,
                      paidAmount: creditExist.paidAmount,
                      status: creditExist.status,
                    },
                  }
                );
                if (isEmpty(creditDataResponse)) {
                  return (res = {
                    data: {
                      msg: `cannot update credit for ${creditExist.purchaseId}`,
                    },
                    status: STATUSCODES.UNPROCESSED,
                  });
                } else {
                  let paymentExist = await paymentModel.findOne({
                    purchasePk: element.order_id,
                  });

                  if (!isEmpty(paymentExist)) {
                    if (
                      Array.isArray(paymentExist.paymentMethod) &&
                      paymentExist.paymentMethod.length > 0
                    ) {
                      let payobj = {
                        type: req.body.paymentMethod[0].type,
                        account: req.body.paymentMethod[0].account,
                        date: req.body.paymentMethod[0].date,
                        paidAmount: element.balance,
                        vendor: req.body.paymentMethod[0].vendor,
                        shiftId: activeShift.shiftId,
                      };
                      paymentExist.paymentMethod.push(payobj);
                    }
                    let paymentResponse = await paymentModel.findOneAndUpdate(
                      {
                        _id: paymentExist._id,
                      },
                      {
                        $set: {
                          paymentMethod: paymentExist.paymentMethod,
                        },
                      },
                      {
                        returnDocument: "after",
                      }
                    );
                    if (isEmpty(paymentResponse)) {
                      return (res = {
                        data: {
                          msg: `cannot save payment for${paymentExist.invoiceNo}`,
                        },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    } else {
                      let orderExist = await orderModel.findOne({
                        _id: paymentResponse.purchasePk,
                      });
                      if (!isEmpty(orderExist)) {
                        let paid = 0;
                        paymentResponse.paymentMethod.map((x) => {
                          paid = paid + x.paidAmount;
                        });
                        orderExist.status =
                          orderExist.totalAmount <= paid
                            ? ORDERSTATUS.COM
                            : ORDERSTATUS.PEN;
                        let orderdataresponse =
                          await orderModel.findOneAndUpdate(
                            {
                              _id: orderExist._id,
                            },
                            {
                              $set: { status: orderExist.status },
                            },
                            {
                              returnDocument: "after",
                            }
                          );
                        if (isEmpty(orderdataresponse)) {
                          return (res = {
                            data: {
                              msg: `cannot update status of order ${orderExist.orderId} of branch ${orderExist.branchId}`,
                            },
                            status: STATUSCODES.UNPROCESSED,
                          });
                        }
                      }
                    }
                  } else {
                    let paymentData = {};
                    let branchExist = {};
                    let order = await orderModel.findOne({
                      _id: element.order_id,
                    });
                    if (!isEmpty(order)) {
                      branchExist = await branchModel.findOne({
                        storeCode: order.branchId,
                      });
                      if (!isEmpty(branchExist)) {
                        paymentData.invoiceNo =
                          PREFIXES.SALESINV + order.orderId;
                        paymentData.cus_id = order.cus_id;
                        paymentData.date = new Date().getTime();
                        let payobj = {
                          type: req.body.paymentMethod[0].type,
                          account: req.body.paymentMethod[0].account,
                          date: req.body.paymentMethod[0].date,
                          paidAmount:
                            order.totalAmount +
                            order.shipmentCharge -
                            order.discount,
                          vendor: req.body.paymentMethod[0].vendor,
                          shiftId: activeShift.shiftId,
                        };
                        paymentData.paymentMethod = [];
                        paymentData.paymentMethod.push(payobj);
                        paymentData.totalAmount = payobj.paidAmount;
                        paymentData.branchId = order.branchId;
                        paymentData.purchasePk = order._id;
                      } else {
                        return (res = {
                          data: {
                            msg: "invalid branch detected while creating new payment",
                          },
                          status: STATUSCODES.UNPROCESSED,
                        });
                      }
                    }
                    let newpayment = new paymentModel(paymentData);
                    let savePaymentResponse = await newpayment.save();
                    if (isEmpty(savePaymentResponse)) {
                      return (res = {
                        data: {
                          msg: `failed to create payment for ${paymentData.invoiceNo}`,
                        },
                        status: STATUSCODES.UNPROCESSED,
                      });
                    }
                  }
                }
              }
            }
          }
        }
        for (let i = 0; i < req.body.paymentMethod.length; i++) {
          const element = req.body.paymentMethod[i];
          creditmainExist.balance =
            creditmainExist.balance - element.paidAmount;
          creditmainExist.paidAmount =
            creditmainExist.paidAmount + element.paidAmount;
        }
        creditmainExist.status =
          creditmainExist.balance <= 0 ? CREDITSTATUS.COM : CREDITSTATUS.PEN;
        let creditupdateresp = await creditModel.findOneAndUpdate(
          { _id: creditmainExist._id },
          { $set: creditmainExist },
          { returnDocument: "after" }
        );
        let paymentExist = await paymentModel.findOne({
          purchasePk: req.body.purchasePk,
        });
        if (!isEmpty(paymentExist)) {
          for (let i = 0; i < req.body.paymentMethod.length; i++) {
            const element = req.body.paymentMethod[i];
            paymentExist.paymentMethod.push(element);
          }
          paymentresp = await paymentModel.findOneAndUpdate(
            { _id: paymentExist._id },
            { $set: { paymentMethod: paymentExist.paymentMethod } },
            { returnDocument: "after" }
          );
        } else {
          if (req.body.type == 0) {
            let order = await orderModel.findOne({ _id: req.body.purchasePk });
            if (!isEmpty(order)) {
              paymentData = {
                invoiceNo:
                  req.body.branchId.substr(3) +
                  PREFIXES.SALESINV +
                  order.orderId,
                cus_id: order.cus_id,
                date: new Date().getTime(),
                paymentMethod: req.body.paymentMethod,
                totalAmount:
                  order.totalAmount + order.shipmentCharge - order.discount,
                branchId: order.branchId,
                purchasePk: order._id,
              };
            } else {
              res = {
                data: { msg: "no order with passed Pk" },
                status: STATUSCODES.NOTFOUND,
              };
            }
          }
          let paymentobject = new paymentModel(paymentData);
          paymentresp = await paymentobject.save();
        }
        if (!isEmpty(paymentresp)) {
          let newlog = new logModel({
            date: new Date().getTime(),
            emp_id: req.decode._id,
            type: LOG.SALES_CREDIT_UPDATE.type,
            description: LOG.SALES_CREDIT_UPDATE.description,
            branchId: paymentresp.branchId,
            link: {},
            payload: { token: req.headers.authorization, body: req.body },
          });
          let logresponse = await newlog.save();
          if (logresponse == null) {
            console.log("log save faild");
          }
          res = {
            data: { msg: "payment Success", workorder: creditmainExist },
            status: STATUSCODES.SUCCESS,
          };
        } else {
          res = { data: "payment failed", status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = {
          data: { msg: "no credit with this id" },
          status: STATUSCODES.NOTFOUND,
        };
      }
    } else {
      res = {
        data: { msg: `No Active Shifts For ${req.body.branchId}` },
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 25-07-23
module.exports.invoiceView = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const adminModel = conn.auth(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { employeeModel } = conn.employee(req.decode.db);
  const { paymentModel } = conn.payment(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  try {
    if (req.body && common_service.isObjectId(req.body._id)) {
      let logo = "";
      let orderSingle = await orderModel.findOne({ _id: req.body._id });
      if (!isEmpty(orderSingle)) {
        let resobj = {};
        let adminExist = await adminModel.findOne({});
        let customerExist ={}
        if (common_service.isObjectId(orderSingle.cus_id)) {
          
          customerExist =  await customerModel.findOne({
            _id: orderSingle.cus_id,
          });
        }
        let branchExist = await branchModel.findOne({
          storeCode: orderSingle.branchId,
        });

        let employeeExist = await employeeModel.findOne({
          _id: orderSingle.emp_id,
        });

        resobj.companyName = !isEmpty(adminExist)
          ? !isEmpty(adminExist.profile)
            ? adminExist.profile.companyName
            : "no companyName"
          : "no companyName";
        resobj.customerName = !isEmpty(customerExist)
          ? (customerExist.name)
            ? customerExist.name
            :orderSingle.cus_id
          : orderSingle.cus_id;
        resobj.mobileNo = !isEmpty(customerExist)
          ? !isEmpty(customerExist.mobileNo)
            ? customerExist.mobileNo
            : "No mobileNo"
          : "No mobileNo";
        resobj.nativecompanyName = !isEmpty(adminExist)
          ? !isEmpty(adminExist.profile)
            ? adminExist.profile.nativeCompanyName
            : "no nativecompanyName"
          : "no nativecompanyName";
        if (branchExist?.logo != undefined)
          logo = process.env.FILEURL + branchExist.logo;
        else if (branchExist?.logo == undefined && adminExist)
          logo = process.env.FILEURL + adminExist.profile.logo;
        if (!isEmpty(branchExist)) {
          resobj.companyName = branchExist.nameOfStore;
          resobj.nativecompanyName = branchExist.nativenameOfStore;
        }
        resobj.companyLogo = logo != "" ? logo : "no logo";
        resobj.website = !isEmpty(adminExist)
          ? !isEmpty(adminExist.profile)
            ? adminExist.profile.website
            : "no website"
          : "no website";
        resobj.vat = !isEmpty(adminExist)
          ? !isEmpty(adminExist.gst)
            ? adminExist.gst.gstNumber
            : "no gst"
          : "no gst";
        resobj.customercare = !isEmpty(branchExist)
          ? branchExist.contactNumber
          : "no contactNumber";
        resobj.contactPerson = !isEmpty(branchExist)
          ? branchExist.contactPerson
          : "no contactPerson";
        resobj.terms = !isEmpty(adminExist)
          ? !isEmpty(adminExist)
            ? adminExist.terms
            : "no terms and condition"
          : "no terms and condition";
        resobj.nativeTerms = !isEmpty(adminExist)
          ? !isEmpty(adminExist)
            ? adminExist.nativeTerms
            : "no nativeTerms"
          : "no nativeTerms";
        resobj.orderDate = common_service.prescisedateconvert(
          orderSingle.orderDate
        );
        resobj.address = !isEmpty(branchExist)
          ? branchExist.address
          : "no address";
        resobj.nativeAddress = !isEmpty(branchExist)
          ? branchExist.nativeAddress
          : "no address";
        resobj.empId = !isEmpty(employeeExist)
          ? `EMP${employeeExist.emp_id}`
          : "no id";
        resobj.staff_name = !isEmpty(employeeExist)
          ? employeeExist.staff_name
          : "no staff";
        resobj.billNo = PREFIXES.SALESINV + orderSingle.orderId;
        // resobj.deliveryDate = common_service.prescisedateconvert(
        //   orderSingle.deliveryDate
        // ).split(" ")[0]; /* added on 27-04-23 */
        let itemList = [];
        resobj.taxamount = 0;
        if (
          Array.isArray(orderSingle.orderInfo) &&
          orderSingle.orderInfo.length > 0
        ) {
          await Promise.all(
            orderSingle.orderInfo.map(async (x) => {
              let itemObj = {};
              itemObj.type = x.type;
              itemObj.quantity = x.quantity;
              itemObj.price = x.rate;
              itemObj.total = x.quantity * itemObj.price;
              let foodAmount = await foodModel.findOne({
                _id: x.itemInfo,
              });
              itemObj.name = "no product";
              if (!isEmpty(foodAmount)) {
                itemObj.name = foodAmount.prod_name;
                resobj.taxamount = resobj.taxamount + x.vatorgst;
              }
              itemList.push(itemObj);
            })
          );
        }
        resobj.items = itemList;
        resobj.subTotal = orderSingle.totalAmount - resobj.taxamount;
        resobj.discount = 0;
        if (typeof orderSingle.discount == "number") {
          resobj.discount = orderSingle.discount;
        }
        resobj.qrcode = orderSingle.qrcode
          ? process.env.FILEURL + orderSingle.qrcode
          : "no qrcode";
        resobj.tax = `${process.env.MIN_PERCENT},${process.env.MAX_PERCENT}`;
        resobj.grandTotal =
          orderSingle.totalAmount +
          orderSingle.shipmentCharge -
          orderSingle.discount;
        resobj.barcode = orderSingle.barcode
          ? process.env.FILEURL + orderSingle.barcode
          : "no barcode";
        resobj.paidAmount = 0;
        if (!isEmpty(branchExist) && !isEmpty(req.decode)) {
          let paymentExist = await paymentModel.findOne({
            purchasePk: req.body._id,
          });
          if (!isEmpty(paymentExist)) {
            if (
              Array.isArray(paymentExist.paymentMethod) &&
              paymentExist.paymentMethod.length > 0
            ) {
              paymentExist.paymentMethod.map((x) => {
                resobj.paidAmount = resobj.paidAmount + x.paidAmount;
              });
            }
          }
        }
        if (orderSingle.usedWallet > 0) {
          resobj.paidAmount = resobj.paidAmount + orderSingle.usedWallet;
        }
        resobj.balance = resobj.grandTotal - resobj.paidAmount;

        res = { data: resobj, status: STATUSCODES.SUCCESS };
      } else {
        res = {
          data: { msg: "order not found" },
          status: STATUSCODES.NOTFOUND,
        };
      }
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

//added on 16-08-23
module.exports.searchProduct = async (req) => {
  try {
    const { foodModel } = conn.food(req.decode.db);
    let foodList = await foodModel.find({ branchId: req.body.branchId });
    let rsList = [];
    if (typeof req.body.search == "string") {
      req.body.search = req.body.search.toLowerCase();
    }
    foodList = foodList.filter(
      (x) =>
        x.prod_id == req.body.search ||
        x.prod_name.toLowerCase().includes(req.body.search) ||
        x.dimensions.find((x) => x.barcode == req.body.search)
    );

    if (foodList.length > 0) {
      for (let i = 0; i < foodList.length; i++) {
        const element = foodList[i];
        let resobj = {};
        resobj.itemInfo = element._id;
        rsList.push(resobj);
      }
    }
    return (res = { data: rsList, status: STATUSCODES.SUCCESS });
  } catch (e) {
    console.error(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

//#endregion
