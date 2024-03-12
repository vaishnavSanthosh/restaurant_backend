/** @format */

//#region headers
const { STATUSCODES, LOG, URL, API } = require("../Model/enums.js");
const conn = require("../../userDbConn");
const { prescisedateconvert } = require("./commonRoutes.js");
//#endregion

//#region methods
module.exports.addFoodAvailable = async (req) => {
  const foodAvailableModel = conn.foodavailable(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let fd_available = new foodAvailableModel({
      fd_name: req.body.fd_name,
      available_day: req.body.available_day,
      frm_time: new Date(req.body.frm_time).getTime(),
      to_time: new Date(req.body.to_time).getTime(),
      active: req.body.active,
      branchId: req.body.branchId, //added on 05-08-22 -> branchid initialisation
    });
    let data = await fd_available.save();
    if (data) {
      let newlog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.FOODAVAILABLE_ADD.type,
        description: LOG.FOODAVAILABLE_ADD.description,
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
    return res;
  } catch (e) {
    console.log(e);
    return (res = { data: "internal server error", status: STATUSCODES.ERROR });
  }
};

module.exports.viewFoodAvailable = async (req) => {
  const foodAvailableModel = conn.foodavailable(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let res = {};
    let foodAvailable = await foodAvailableModel
      .find({
        branchId: req.body.branchId,
      })
      .skip(req.body.index)
      .limit(30);
    if (foodAvailable.length > 0) {
      for (let i = 0; i < foodAvailable.length; i++) {
        const element = foodAvailable[i];
        /*added on 14-06-22 -> foodName initialisation */
        let foodData = await foodModel.findOne({ _id: element.fd_name });
        element._doc["itemName"] = foodData ? foodData.prod_name : null;
        element._doc["fromTime"] = prescisedateconvert(element.frm_time).split(
          " "
        )[1];
        element._doc["toTime"] = prescisedateconvert(element.to_time).split(
          " "
        )[1];
        /*ends Here */
      }
      res = { data: foodAvailable, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.log(e);
    return (res = { data: "internal server error", status: STATUSCODES.ERROR });
  }
};

module.exports.viewFoodSingle = async (req) => {
  const foodAvailableModel = conn.foodavailable(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  try {
    let foodavailableSingle = await foodAvailableModel.findOne({
      _id: req.body.id,
    });
    if (foodavailableSingle) {
      /*added on 14-06-22-> food name initialisation */
      let foodData = await foodModel.findOne({
        _id: foodavailableSingle.fd_name,
      });
      foodavailableSingle._doc["itemName"] = foodData
        ? foodData.prod_name
        : null;
      foodavailableSingle._doc["fromTime"] = prescisedateconvert(
        foodavailableSingle.frm_time
      ).split(" ")[1];
      foodavailableSingle._doc["toTime"] = prescisedateconvert(
        foodavailableSingle.to_time
      ).split(" ")[1];
      /*ends here */
      res = { data: foodavailableSingle, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.log(e);
    return (res = { data: "internal server error", status: STATUSCODES.ERROR });
  }
};

module.exports.editFoodAvailable = async (req) => {
  const foodAvailableModel = conn.foodavailable(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let food_single = await foodAvailableModel.findOne({
      _id: req.body.id,
      branchId: req.body.branchId,
    });
    if (food_single) {
      food_single.fd_name = !req.body.fd_name
        ? food_single.fd_name
        : req.body.fd_name;
      food_single.available_day = !req.body.available_day
        ? food_single.available_day
        : req.body.available_day;
      food_single.frm_time = !req.body.frm_time
        ? food_single.frm_time
        : new Date(req.body.frm_time).getTime();
      food_single.to_time = !req.body.to_time
        ? food_single.to_time
        : new Date(req.body.to_time).getTime();
      food_single.active = !req.body.active
        ? food_single.active
        : req.body.active;
      let data = await foodAvailableModel.findOneAndUpdate(
        { _id: food_single._id },
        { $set: food_single },
        { new: true }
      );
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.FOODAVAILABLE_ADD.type,
          description: LOG.FOODAVAILABLE_ADD.description,
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
    console.log(e);
    return (res = { data: "internal server error", status: STATUSCODES.ERROR });
  }
};

module.exports.deleteFoodAvailable = async (req) => {
  const foodAvailableModel = conn.foodavailable(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let food_single = await foodAvailableModel.findOne({
      _id: req.body.id,
    });
    if (food_single) {
      let data = await foodAvailableModel.deleteOne({
        _id: req.body.id,
      });
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.FOODAVAILABLE_ADD.type,
          description: LOG.FOODAVAILABLE_ADD.description,
          branchId: food_single.branchId,
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
    console.log(e);
    return (res = { data: "internal server error", status: STATUSCODES.ERROR });
  }
};
//#endregion
