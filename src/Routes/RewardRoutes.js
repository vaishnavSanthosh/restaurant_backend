/** @format */

//created on 18-02-22

//#region headers
const { STATUSCODES, LOG, URL, API, PREFIXES } = require("../Model/enums");
const foodService = require("./FoodRoutes.js");
const settings_service = require("./settingsRoutes");
const conn = require("../../userDbConn");
const { isEmpty, checkObject } = require("./commonRoutes");
//#endregion

//#region methods
//edited on 26-05-2022
//edited on 23-07-22 ->add reward recoded
module.exports.addreward = async (req) => {
  const { rewardModel } = conn.reward(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  // const departmentModel = conn.department(process.env.db);
  try {
    let res = {};
    let rewardExist = await rewardModel.findOne({
      productId: req.body.productId,
      branchId: req.body.branchId,
    });
    if (checkObject(rewardExist)) {
      if (rewardExist.isCategory.toString() == "true") {
        let foodList = await foodModel.find({ category: req.body.productId });
        for (let i = 0; i < foodList.length; i++) {
          const element = foodList[i];
          await rewardModel.findOneAndUpdate(
            { productId: element._id },
            { $set: { status: false } },
            { new: true }
          );
        }
        return (res = { data: rewardExist, status: STATUSCODES.CONFLICT });
      } else {
        let food_single = await foodModel.findOne({ _id: req.body.productId });
        if (checkObject(food_single)) {
          await rewardModel.findOneAndUpdate(
            { productId: food_single.category },
            { $set: { status: false } },
            { new: true }
          );
        }
        return (res = { data: rewardExist, status: STATUSCODES.CONFLICT });
      }
    } else {
      var reward = new rewardModel({
        productName: req.body.productName,
        productId: req.body.productId,
        itemType: req.body.itemType,
        point: req.body.point,
        amount: req.body.amount,
        isCategory: req.body.isCategory,
        status: true,
        branchId: req.body.branchId,
      });
      if (reward.isCategory.toString() == "true") {
        let foodList = await foodModel.find({ category: req.body.productId });
        for (let i = 0; i < foodList.length; i++) {
          const element = foodList[i];
          await rewardModel.findOneAndUpdate(
            { productId: element._id },
            { $set: { status: false } },
            { new: true }
          );
        }
      } else {
        let food_single = await foodModel.findOne({ _id: req.body.productId });
        if (checkObject(food_single)) {
          await rewardModel.findOneAndUpdate(
            { productId: food_single.category },
            { $set: { status: false } },
            { new: true }
          );
        }
      }
      let data = await reward.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.REWARD_POINTS_ADD.type,
          description: LOG.REWARD_POINTS_ADD.description,
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

// module.exports.addCustomer = async (req) => {
//   try {
//     let res = {};
//     let cus_exist = await customerModel.findOne({
//       phoneNumber: req.body.phoneNumber,
//     });
//     if (!cus_exist) {
//       let cus_points = new customerModel({
//         customerName: req.body.customerName,
//         phoneNumber: req.body.phoneNumber,
//         points: 0,
//       });
//       let data = await cus_points.save();
//       if (data) {
//         res = { data: data, status: STATUSCODES.SUCCESS };
//       } else {
//         res = { data: {}, status: STATUSCODES.UNPROCESSED };
//       }
//     } else {
//       res = { data: {}, status: STATUSCODES.EXIST };
//     }
//     return res;
//   } catch (e) {
//     return (res = { data: e.message, status: STATUSCODES.ERROR });
//   }
// };

module.exports.addCustomerPoints = async (req) => {
  const { customerModel } = conn.customer(process.env.db);
  try {
    let res = {};
    let cus_exist = await customerModel.findOne({
      phoneNumber: req.body.phoneNumber,
    });
    if (cus_exist) {
      cus_exist.points = cus_exist.points + req.body.points;
      let data = await cus_exist.save();
      if (data) {
        res = { data: cus_exist, status: STATUSCODES.SUCCESS };
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

module.exports.addPointLog = async (req) => {
  const { pointsModel } = conn.reward(process.env.db);
  try {
    let res = {};
    let pointLog = new pointsModel({
      cus_id: req.body.cus_id,
      food_id: req.body.food_id,
      points: req.body.points,
      date: new Date().getTime(),
    });
    let data = await pointLog.save();
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



//added on 21-02-22
//edited on 28/06/23
module.exports.getRewardPointByProdId = async (req) => {
  const { rewardModel } = conn.reward(req.decode.db);
  try {
    let res = {};
    let food_exist = await rewardModel.findOne({
      food_id: req.body._id,
    });
    if (food_exist) {
      res = { data: food_exist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//added on 08-03-22
module.exports.viewPointOfFoodItem = async (req) => {
  const { rewardModel } = conn.reward(process.env.db);
  try {
    let res = {};
    let rewardDetails = await rewardModel.findOne({
      food_id: req,
    });
    if (rewardDetails) {
      res = { data: rewardDetails, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: rewardDetails, status: STATUSCODES.SUCCESS };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 08-07-22
//edited on 09-07-22
module.exports.showRewardAmount = async (req) => {
  const adminModel = conn.auth(process.env.db);
  try {
    let res = {};
    let adminExist = await adminModel.findOne({ _id: req.decode.admin });
    if (!isEmpty(adminExist)) {
      let calObj = adminExist.rewardCriteria.find(
        (x) => x.type == req.query.type
      );
      if (!isEmpty(calObj)) {
        let pointCal = calObj.amount / calObj.point; //edited on 09-07-22
        calObj.pointAmount = Math.ceil(req.query.point * pointCal); //edited on 09-07-22 -> added new obj to response
        res = { data: calObj, status: STATUSCODES.SUCCESS };
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

//added on 23-07-22
//edited on 27/06/23
module.exports.viewCustomerWithPoints = async (req) => {
  const { customerModel } = conn.customer(req.decode.db);
  try {
    let res = {};
    let rewardsList = await customerModel.find({
      branchId: req.body.branchId,
    });
    if (Array.isArray(rewardsList) && rewardsList.length > 0) {
      res = { data: rewardsList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 24-07-22
//edited on 27/06/23
module.exports.viewRewardList = async (req) => {
  const { rewardModel } = conn.reward(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { categoryModel } = conn.category(req.decode.db);
  try {
    req.body.index=parseInt(req.body.index)*20
    let res = {};
    let rewardList = await rewardModel.find({
      branchId: req.body.branchId,
      status: true,
    }).skip(req.body.index).limit(30)
    if (Array.isArray(rewardList) && rewardList.length > 0) {
      for (let i = 0; i < rewardList.length; i++) {
        const element = rewardList[i];
        if (element.isCategory == true) {
          // var dep = await categoryModel.findOne({ _id: element.productId });
        } else {
          var prod = await foodModel.findOne({ _id: element.productId });
          element._doc["PRODUCTID"] = prod.prod_id
            ? PREFIXES.PRODUCT + prod.prod_id
            : null;
        }
        element._doc["TYP"] = element.isCategory == true ? "CATEGORY" : "FOOD";
      }
      res = { data: rewardList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 27-07-22
//edited on 28/06/23
module.exports.editRewards = async (req) => {
  const { rewardModel } = conn.reward(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let rewardExist = await rewardModel.findOne({
      _id: req.body._id,
      dataStatus: true,
    });
    if (!isEmpty(rewardExist)) {
      rewardExist.productName = !req.body.productName
        ? rewardExist.productName
        : req.body.productName;
      rewardExist.productId = !req.body.productId
        ? rewardExist.productId
        : req.body.productId;
      rewardExist.itemType = !req.body.itemType
        ? rewardExist.itemType
        : req.body.itemType;
      rewardExist.point = !isEmpty(req.body)
        ? req.body.point
        : rewardExist.point;
      rewardExist.amount = !isEmpty(req.body)
        ? req.body.amount
        : rewardExist.amount;
      let data = await rewardExist.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.REWARD_POINTS_ADD.type,
          description: LOG.REWARD_POINTS_ADD.description,
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
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 27-07-22
//edited on 28/06/23
module.exports.deleteReward = async (req) => {
  const { rewardModel } = conn.reward(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let data = await rewardModel.findOneAndUpdate(
      { _id: req.body._id },
      { $set: { status: false } },
      { new: true }
    );
    if (data) {
      let newlog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.REWARD_POINTS_DELETE.type,
        description: LOG.REWARD_POINTS_DELETE.description,
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
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//#endregion
