//created on 16-02-2022
//#region header
const { STATUSCODES, OFFERTYPES, ROLES, PREFIXES, LOG } = require("../Model/enums");
const common_service = require("./commonRoutes.js");
const foodService = require("../Routes/FoodRoutes.js");
let conn = require("../../userDbConn");
const categoryService = require("./CategoryRoute.js");
const { returnStoreName } = require("./LocationRoute");
const fs = require("fs");
const { log } = require("console");
//#endregion

//#region methods
//edited on 17-02-2022
//edited on 21-04-2022
//edited on 20-06-2022
//assembled on 15-07-22
//edited on 26/06/23
module.exports.addOffer = async (req) => {
  const offerModel = conn.offer(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let offer = new offerModel({
      category: req.body.category,
      subcategory: req.body.subcategory,
      food_id: req.body.food_id,
      // dimension: req.body.dimension,
      offer: req.body.offer,
      startDate: new Date(req.body.startDate).getTime(),
      endDate: new Date(req.body.endDate).getTime(),
      conditions: req.body.conditions,
      festivalName: null,
      imageUrl: null,
      branchId: req.body.branchId,
      dataStatus: true,
    });
    let data = await offer.save();
    if (data) {
      let newlog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.OFFER_ADD.type,
        description: LOG.OFFER_ADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newlog.save();
      if (logresponse==null) {
        console.log("log save faild");
      }
      data._doc["startDate"] = common_service.prescisedateconvert(
        data.startDate
      );
      data._doc["endDate"] = common_service.prescisedateconvert(data.endDate);
      res = { data: data, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.UNPROCESSED };
    }
    return res;
  } catch (e) {
    console.log(e);
    return (res = { data: "Internal server error", status: STATUSCODES.ERROR });
  }
};

//edited on 03-03-22
//edited on 20-04-22 -> methods value assigning section coded properly
//edited on 20-06-22
//assembled on 15-07-22
// edited on 26/06/23
module.exports.viewOffers = async (req) => {
  const offerModel = conn.offer(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  try {
    
    if (!common_service.isEmpty(req.decode)) {
      var offerList;
      if (req.decode.role == ROLES.ADMIN) {
        if (req.body.branchId) {
          offerList = await offerModel.find({ branchId: req.body.branchId, dataStatus: true });
        } else {
          offerList = await offerModel.find({ dataStatus: true });
        }
      } else {
        offerList = await offerModel.find({
          dataStatus: true,
          branchId: req.body.branchId
        });
      }
      if (Array.isArray(offerList) && offerList.length > 0) {
        for (let i = 0; i < offerList.length; i++) {
          const element = offerList[i];
          let branchExist = await branchModel.findOne({
            storecode: element.branchId,
          });
          element._doc["branchName"] = !common_service.isEmpty(branchExist)
            ? branchExist.branchName
            : "no branchName";
          element._doc["startDate"] = common_service
            .prescisedateconvert(element.startDate)
            .split(" ")[0];
          element._doc["endDate"] = common_service
            .prescisedateconvert(element.endDate)
            .split(" ")[0];
          let product = {};
          if (common_service.isObjectId(element.food_id)) {
            product = await foodModel.findOne({
              _id: element.food_id,
            });
          }
          element._doc["calculatedPrice"] = 0;
          if (!common_service.isEmpty(product)) {
            element._doc["itemName"] = product.prod_name;
            element._doc["calculatedPrice"] = product.calculatedPrice;
            element._doc["prodId"] = `${PREFIXES.PRODUCT}M${product.prod_id}`;
            if (
              Array.isArray(product.imageUrl) &&
              product.imageUrl.length > 0
            ) {
              for (let j = 0; j < product.imageUrl.length; j++) {
                product.imageUrl[j] = process.env.FILEURL + product.imageUrl[j];
              }
            }
            element._doc["ProductImageUrl"] = product.imageUrl;
          }
        }
        res = { data: offerList, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: [], status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.UNAUTHORIZED };
    }
    return res;
  } catch (e) {
    console.log(e);
    return (res = { data: "Internal server error", status: STATUSCODES.ERROR });
  }
};

//added on 21-02-22
//edited on 03-03-22
//edited on 20-06-22
module.exports.viewOfferSingle = async (req) => {
  const offerModel = conn.offer(req.decode.db);
  try {
    let res = {};
    let resobj = {};
    let offerSingle = await offerModel.findOne({
      _id: req.body._id,
    });
    if (offerSingle && offerSingle.endDate > new Date().getTime()) {
      //if condition added with expiry date validation on 03-03-22
      let foodItem = await foodService.viewFoodItemsSingle(offerSingle.food_id);
      resobj.prodId = foodItem.data
        ? /* foodItem.data.prod_id */ `FOOD${1}`
        : null;
      resobj.prodName = foodItem.data ? foodItem.data.prod_name : null;
      resobj.imageUrl = foodItem.data ? foodItem.data.imageUrl[0] : null;
      resobj.offerType = offerSingle.offer.offerTypes;
      resobj.offer =
        offerSingle.offer.offerTypes == OFFERTYPES.PERCENTAGE
          ? offerSingle.offer.percentage
          : offerSingle.offer.offerTypes == OFFERTYPES.BUYGET
            ? offerSingle.offer.buyGet
            : offerSingle.offer.offerTypes == OFFERTYPES.QUANTITY
              ? offerSingle.offer.quantity
              : null;
      resobj.startDate = common_service
        .prescisedateconvert(offerSingle.startDate)
        .split(" ")[0];
      resobj.endDate = common_service
        .prescisedateconvert(offerSingle.endDate)
        .split(" ")[0];
      resobj.conditions = offerSingle.conditions;
      /*added on 20-06-22 -> price field  initialisation added*/
      let dimension = foodItem.data.dimensions.find(
        (x) => x.size == offerSingle.dimension
      );

      resobj.price = dimension ? dimension.calculatedPrice : 0;
      /*ends here */
      if (offerSingle.offer.offerTypes == OFFERTYPES.PERCENTAGE) {
        let cutoff = resobj.price / offerSingle.offer.percentage[0];
        resobj.offerPrice = Math.ceil(resobj.price - cutoff); //added on 20-06-22 -> added calculated offer price to response
      }
      res = { data: resobj, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 22-02-22
module.exports.addFestivalImage = async (req) => {
  const offerModel = conn.offer(process.env.db);
  try {
    let res = {};
    let offerExist = await offerModel.findOne({
      _id: req.body.id,
    });
    if (offerExist) {
      if (req.files) {
        let fp = await common_service.createDirectory(
          `./public/${req.decode.db}/OfferImages`
        );
        if (offerExist.imageUrl != undefined)
          fs.unlink(
            `public` + offerExist.imageUrl.split("Images/")[1],
            (err) => {
              if (err) console.log(err);
            }
          );
        req.files.file.mv(
          `./public/${req.decode.db}/OfferImages/${
            offerExist._id
          }-${req.body.festivalName.replace(/\s+/g, "")}` +
            req.files.file.name.replace(/\s+/g, "")

        );
        offerExist.imageUrl =
          `Images/${req.decode.db}/OfferImages/${
            offerExist._id
          }-${req.body.festivalName.replace(/\s+/g, "")}` +
          req.files.file.name.replace(/\s+/g, "");
      }
      offerExist.festivalName = req.body.festivalName;
      let data = await offerExist.save();
      if (data) {
        data._doc["startDate"] = common_service.prescisedateconvert(
          data.startDate
        );
        data._doc["endDate"] = common_service.prescisedateconvert(data.endDate);
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

//added on 08-03-22
//edited on 21-03-22 -> obj id of offer added to response body
//edited on 13-06-22
module.exports.viewofferByitemId = async (req) => {
  const offerModel = conn.offer(process.env.db);
  const { foodModel } = conn.food(process.env.db);
  try {
    let res = {};
    let offerSingle = await offerModel.findOne({
      food_id: req,
    });

    if (offerSingle && offerSingle.endDate > new Date().getTime()) {
      let resobj = {};
      let foodItem = {};
      let dataobj = await foodModel.findOne({ _id: offerSingle.food_id });
      foodItem.data = dataobj;
      resobj.prodId = foodItem.data ? foodItem.data.prod_id : null;
      resobj.prodName = foodItem.data ? foodItem.data.prod_name : null;
      resobj.imageUrl = foodItem.data ? foodItem.data.imageUrl[0] : null;
      resobj.offerType = offerSingle.offer.offerTypes;
      resobj.offer =
        offerSingle.offer.offerTypes == OFFERTYPES.PERCENTAGE
          ? offerSingle.offer.percentage
          : offerSingle.offer.offerTypes == OFFERTYPES.BUYGET
            ? offerSingle.offer.buyGet //edited on 24-06-22 -> name corrected today
            : offerSingle.offer.offerTypes == OFFERTYPES.QUANTITY
              ? offerSingle.offer.quantity
              : null;
      resobj.startDate = common_service.prescisedateconvert(
        offerSingle.startDate
      );
      resobj.endDate = common_service.prescisedateconvert(offerSingle.endDate);
      resobj.conditions = offerSingle.conditions;
      resobj._id = offerSingle._id.toString();
      resobj.dimension = offerSingle.dimension; //added on 13-06-22 added new dimension field
      res = { data: resobj, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 20-06-22
module.exports.editOffer = async (req) => {
  const offerModel = conn.offer(process.env.db);
  try {
    let res = {};
    let offerExist = await offerModel.findOne({
      _id: req.body._id,
    });
    if (!common_service.isEmpty(offerExist)) {
      offerExist.category = req.body.category
        ? req.body.category
        : offerExist.category;
      offerExist.subCategory = req.body.subCategory
        ? req.body.subCategory
        : offerExist.subCategory;
      offerExist.food_id = req.body.food_id
        ? req.body.food_id
        : offerExist.food_id;
      offerExist.dimension = req.body.dimension
        ? req.body.dimension
        : offerExist.dimension;
      offerExist.offer = req.body.offer ? req.body.offer : offerExist.offer;
      offerExist.startDate = req.body.startDate
        ? new Date(req.body.startDate).getTime()
        : offerExist.startDate;
      offerExist.endDate = req.body.endDate
        ? new Date(req.body.endDate).getTime()
        : offerExist.endDate;
      offerExist.conditions = req.body.conditions
        ? req.body.conditions
        : offerExist.conditions;
      let data = await offerExist.save();
      if (data) {
        data._doc["startDate"] = common_service.prescisedateconvert(
          data.startDate
        );
        data._doc["endDate"] = common_service.prescisedateconvert(data.endDate);
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

//added on 20-06-22
module.exports.deleteOffer = async (req) => {
  const offerModel = conn.offer(process.env.db);
  try {
    let res = {};
    let offerExist = await offerModel.findOne({
      _id: req,
    });
    if (!common_service.isEmpty(offerExist)) {
      offerExist.dataStatus = false;
      let data = await offerExist.save();
      if (data) {
        data._doc["startDate"] = common_service.prescisedateconvert(
          data.startDate
        );
        data._doc["endDate"] = common_service.prescisedateconvert(data.endDate);
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
