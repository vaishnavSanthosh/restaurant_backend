/** @format */

//#region headers
const {
  STATUSCODES,
  OFFERTYPES,
  LOG,
  API,
  URL,
  ROLES,
  SHIFTSTATUS,
  PREFIXES,
  ORDERSTATUS,
} = require("../Model/enums.js");
const common_service = require("../Routes/commonRoutes.js");
const cat_service = require("../Routes/CategoryRoute.js");
const fs = require("fs");
const productService = require("../Routes/ProductRoutes.js");
const empService = require("../Routes/EmployeeRoutes.js");
const qr = require("qrcode");
const offerService = require("../Routes/OfferRoutes.js");
const barcode = require("barcode");
const conn = require("../../userDbConn");
const { log } = require("node-zklib/helpers/errorLog.js");
const { error } = require("console");

//#endregion

//#region methods
module.exports.addFoodItem = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let food_exist = await foodModel.findOne({
      prod_name: req.body.prod_name,
      branchId: req.body.branchId,
      dataStatus: true,
    });
    if (!food_exist) {
      let prodId = 0;
      let foodList = await foodModel.find({ branchId: req.body.branchId });
      if (Array.isArray(foodList) && foodList.length > 0) {
        prodId = foodList[foodList.length - 1].prod_id + 1;
      } else {
        prodId = 1;
      }
      let IMAGEURL = [];
      if (req.files) {
        if (req.files.file.length) {
          let fp = await common_service.createDirectory(
            `./public/${req.decode.db}/FoodItems`
          );
          for (let i = 0; i < req.files.file.length; i++) {
            const element = req.files.file[i];
            element.mv(
              `./public/${
                req.decode.db
              }/FoodItems/${prodId}-${i}-${element.name.replace(/\s+/g, "")}`
            );
            IMAGEURL.push(
              `Images/${
                req.decode.db
              }/FoodItems/${prodId}-${i}-${element.name.replace(/\s+/g, "")}`
            );
          }
        } else {
          const element = req.files.file;
          element.mv(
            `./public/${
              req.decode.db
            }/FoodItems/${prodId}-${0}-${element.name.replace(/\s+/g, "")}`
          );
          IMAGEURL.push(
            /* process.env.FILEURL + */
            `Images/${
              req.decode.db
            }/FoodItems/${prodId}-${0}-${element.name.replace(/\s+/g, "")}`
          );
        }
      }
      let foodData = await foodModel({
        prod_id: prodId,
        prod_name: req.body.prod_name,
        release_date: new Date(req.body.release_date).getTime(),
        food_type: req.body.food_type,
        category: req.body.category,
        subcategoryId: req.body.subcategoryId,
        unit: req.body.unit,
        dimensions: JSON.parse(req.body.dimensions),
        gen_info: req.body.gen_info,
        tags: req.body.tags,
        description: req.body.description,
        imageUrl: IMAGEURL,
        status: true,
        branchId: req.body.branchId,
        dataStatus: true,
        isStockBased: req.body.isStockBased,
        isUnitBased: req.body.isUnitBased,
        nativeprod_name: req.body.nativeprod_name,
        isPreparable: req.body.isPreparable,
      });

      let data = await foodData.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.FOODMANAGEMENT_FOOD_ADD.type,
          description: LOG.FOODMANAGEMENT_FOOD_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        data._doc["release_date"] = common_service.prescisedateconvert(
          data.release_date
        );
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: food_exist, status: STATUSCODES.CONFLICT };
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.viewFoodItems = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  const { subcategoryModel, categoryModel } = conn.category(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let res = {};
    let food_List = [];
    if (req.decode.role == ROLES.USER) {
      food_List = await foodModel
        .find({
          dataStatus: true,
          branchId: req.body.branchId,
          isStockBased: true,
          isUnitBased: true,
        })
        .skip(req.body.index)
        .limit(30);
    } else {
      if (req.body.branchId) {
        food_List = await foodModel
          .find({
            dataStatus: true,
            branchId: req.body.branchId,
            isStockBased: true,
            isUnitBased: true,
          })
          .skip(req.body.index)
          .limit(30);
      } else {
        food_List = await foodModel
          .find({
            dataStatus: true,
            isStockBased: true,
            isUnitBased: true,
          })
          .skip(req.body.index)
          .limit(30);
      }
    }
    if (food_List.length > 0) {
      for (let i = 0; i < food_List.length; i++) {
        const element = food_List[i];
        let offerData = await offerService.viewofferByitemId(element._id);
        if (offerData.data.offerType == OFFERTYPES.PERCENTAGE) {
          let percent = offerData.data.offer;
          element.dimensions.forEach(
            (item) =>
              (item.offerprice =
                item.size != offerData.data.dimension
                  ? 0
                  : Math.ceil(
                      item.calculatedPrice -
                        item.calculatedPrice * (percent / 100)
                    ))
          );
          element._doc["offer"] = {
            offerType: offerData.data.offerType,
            value: offerData.data.offer,
          };
        } else {
          element.dimensions.forEach((item) => (item.offerprice = 0)); //added on 15-06-22 -> to show offerprice in dimensions if no  offer is present
        }
        /*added on 10-06-22 -> new fileurl implementation */
        if (Array.isArray(element.imageUrl) && element.imageUrl.length > 0) {
          for (let j = 0; j < element.imageUrl.length; j++) {
            element.imageUrl[j] = process.env.FILEURL + element.imageUrl[j];
          }
        }
        /*ends here */
        element._doc["release_date"] = common_service.prescisedateconvert(
          element.release_date
        );

        let category = await categoryModel.findOne({ _id: element.category });
        let subcategory = await subcategoryModel.findOne({
          _id: element.subcategoryId,
        });
        element._doc["categoryName"] =
          category != null ? category.categoryName : null;
        element._doc["subcategoryName"] = subcategory
          ? subcategory.subcategoryName
          : null;
        element.barcode =
          element.barcode == null
            ? null
            : element.barcode == undefined
            ? undefined
            : element.barcode == ""
            ? ""
            : process.env.FILEURL + element.barcode;
        element.qrcode =
          element.qrcode != null &&
          element.qrcode != undefined &&
          element.qrcode != ""
            ? process.env.FILEURL + element.qrcode
            : null || undefined || "";
        element._doc["prod_id"] = `FOOD${element.prod_id}`; //added on 06-08-22 -> product id changed on basis of  admin/user view
      }
      res = { data: food_List, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 23-04-22
module.exports.viewFoodItemsSingle = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  try {
    let res = {};
    let food_single = await foodModel.findOne({
      _id: req != undefined ? req : "testkeyforthis1234567890",
    });

    if (food_single) {
      food_single._doc["release_date"] = common_service.prescisedateconvert(
        food_single.release_date
      );
      let category = await cat_service.viewCategoryById(food_single.category);
      let subcategory = await cat_service.viewSubCategorySingle(
        food_single.subcategoryId
      );
      food_single._doc["categoryName"] = category.data.categoryName;
      food_single._doc["subcategoryName"] = subcategory.data.subcategoryName;
      let offerData = await offerService.viewofferByitemId(food_single._id);
      if (offerData.data.offerType == OFFERTYPES.PERCENTAGE) {
        let percent = offerData.data.offer;
        food_single.dimensions.forEach(
          (item) =>
            (item.offerprice =
              item.size != offerData.data.dimension
                ? 0
                : Math.ceil(
                    item.calculatedPrice -
                      item.calculatedPrice * (percent / 100)
                  ))
        );
        /*ends here */
        food_single._doc["offer"] = {
          offerType: offerData.data.offerType,
          value: offerData.data.offer,
        };
      } else {
        food_single.dimensions.forEach((item) => (item.offerprice = 0)); //added on 15-06-22 -> to show offerprice in dimensions if no  offer is present
      }
      food_single.imageUrl = food_single.imageUrl.map(
        (e) => process.env.FILEURL + e
      );
      res = { data: food_single, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//recoded on 16-06-22
module.exports.editFoodItems = async (req) => {
  const { logModel } = conn.settings(req.decode.db);
  const { foodModel } = food(req.decode.db);
  try {
    let res = {};
    let food_single = await foodModel.findOne({
      _id: req.body.id,
    });
    if (!common_service.isEmpty(food_single)) {
      food_single.gen_info = req.body.gen_info
        ? req.body.gen_info
        : food_single.gen_info;
      food_single.tags = req.body.tags ? req.body.tags : food_single.tags;
      food_single.description = req.body.description
        ? req.body.description
        : food_single.description;
      food_single.gen_info = req.body.gen_info
        ? req.body.gen_info
        : food_single.gen_info;
      let data = await food_single.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.FOODMANAGEMENT_FOOD_ADD.type,
          description: LOG.FOODMANAGEMENT_FOOD_ADD.description,
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
//edited on 26-07-23
module.exports.deleteFoodItem = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  const { orderModel } = conn.order(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let orderList = await orderModel.find({
      status: ORDERSTATUS.PEN,
      "orderInfo.itemInfo": req.body._id,
    });
    let data = "";
    if (orderList.length > 0) {
      return (res = {
        data: "this item is pending in orders",
        status: STATUSCODES.NOTACCEPTABLE,
      });
    } else {
      data = await foodModel.findOneAndUpdate(
        { _id: req.body._id },
        { $set: { dataStatus: false } },
        { new: true }
      );
    }
    if (data) {
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.FOODMANAGEMENT_FOOD_ADD.type,
          description: LOG.FOODMANAGEMENT_FOOD_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        return (res = { data: data, status: STATUSCODES.SUCCESS });
      } else {
        return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//added on 03-02-22
//edited on 13-05-22
//edited on 11-06-22
//edited on 23-06-22
// module.exports.addCoupon = async (req) => {
//   const { couponModel } = conn.food(req.decode.db);
//   const { shiftLogModel, logModel, shiftModel } = conn.settings(req.decode.db);
//   const { categoryModel } = conn.category(req.decode.db);
//   const { foodModel } = conn.food(req.decode.db);
//   try {
//     let res = {};
//     let couponList = [];
//     for (let i = 0; i < req.body.quantity; i++) {
//       let cpncode = `CPN` + common_service.getRandomStr() + i;
//       couponList.push({ couponCode:cpncode, redeemed: false });
//     }
//     let shiftExist = {};
//     let shiftSettings = await shiftModel.findOne({
//       branchId: req.body.branchId,
//     });
//     if (common_service.checkObject(shiftSettings)) {
//       if (shiftSettings.shiftType == 2) {
//         shiftExist.shiftId = 0;
//       } else {
//         shiftExist = await shiftLogModel.findOne({
//           branchId: req.body.branchId,
//           status: SHIFTSTATUS.ACT,
//         });
//       }
//     } else {
//       return (res = {
//         data: { msg: `No Settings Defined For Branch ${req.body.branchId}` },
//         status: STATUSCODES.NOTFOUND,
//       });
//     }
//     let coupon = new couponModel({
//       food_type: req.body.food_type,
//       category: req.body.category,
//       foodItem: req.body.foodItem,
//       couponcode: couponList,
//       couponType: req.body.couponType,
//       expiryDate: new Date(req.body.expiryDate).getTime(),
//       conditions: req.body.conditions,
//       branchId: req.body.branchId,
//       shiftId: shiftExist.shiftId,
//       dimension: req.body.dimension,
//     });
//     let data = await coupon.save();
//     if (data) {
//       data._doc["expiryDate"] = common_service.prescisedateconvert(
//         data.expiryDate
//       );
//       let foodItem = await foodModel.findOne({ _id: data.foodItem });
//       let category = await categoryModel.findOne({ _id: data.category });
//       data._doc["type"] = data.food_type ? "veg" : "non-veg";
//       data._doc["categoryName"] = category ? category.categoryName : null;
//       data._doc["itemName"] = foodItem ? foodItem.prod_name : null;
//       res = { data: data, status: STATUSCODES.SUCCESS };
//     } else {
//       res = { data: {}, status: STATUSCODES.UNPROCESSED };
//     }
//     return res;
//   } catch (e) {
//     console.log(e);
//     return (res = { data: "Inernal server error", status: STATUSCODES.ERROR });
//   }
// };

// Added on 09-08-23
module.exports.addCoupon = async (req) => {
  const { couponModel } = conn.food(req.decode.db);
  const { shiftLogModel, shiftModel, logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let couponList = [];
    for (let i = 0; i < req.body.quantity; i++) {
      let cpncode = `CPN` + common_service.getRandomStr() + i;
      couponList.push({ couponCode: cpncode, redeemed: false });
    }
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
    let coupon = new couponModel({
      food_type: req.body.food_type,
      category: req.body.category,
      foodItem: req.body.foodItem,
      couponCode: couponList,
      couponType: req.body.couponType,
      expiryDate: new Date(req.body.expiryDate).getTime(),
      conditions: req.body.conditions,
      branchId: req.body.branchId,
      shiftId: shiftExist.shiftId,
      dimension: req.body.dimension,
    });
    let data = await coupon.save();

    if (data) {
      let newlog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.FOODMANAGEMENT_COUPON_ADD.type,
        description: LOG.FOODMANAGEMENT_COUPON_ADD.description,
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
    return (res = { data: "Inernal server error", status: STATUSCODES.ERROR });
  }
};

//added on 03-02-22
// Edited on 09-08-23
module.exports.viewCoupons = async (req) => {
  const { couponModel } = conn.food(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  try {
    let res = {};
    let rslist = [];
    let couponList = [];
    if (req.decode.role == ROLES.ADMIN) {
      couponList = await couponModel.find({});
    } else {
      couponList = await couponModel.find({ branchId: req.body.branchId });
    }
    if (couponList.length > 0) {
      for (let i = 0; i < couponList.length; i++) {
        const element = couponList[i];
        let foodList = await foodModel.findOne({ _id: element.foodItem });

        let resobj = {
          // id: item._id,
          coupon: element?.couponCode,
          conditions: element?.conditions,
          prod_name: foodList?.prod_name ? foodList?.prod_name : "null",
          dimension: element?.dimension,
          couponType: element?.couponType?.offer?.percentage,
          quantity: element?.couponCode.length,

          expiryDate: common_service
            .prescisedateconvert(element.expiryDate)
            .split(" ")[0],
        };
        resobj.remaining = 0;
        element.couponCode.map((x) =>
          x.redeemed == false
            ? (resobj.remaining = resobj.remaining + 1)
            : resobj.used
        );
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

//added on 11-02-22
//completed on 14-02-22
//edited
module.exports.addrecipie = async (req) => {
  const { recipeModel, foodModel } = conn.food(req.decode.db);
  const { stockModel, stockLogModel } = conn.stock(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let recipient = new recipeModel({
      emp_id: req.body.emp_id,
      foodId: req.body.foodId,
      recipient: req.body.recipient,
      date: new Date(req.body.date).getTime(),
      quantity: req.body.quantity,
      branchId: req.body.branchId,
      dimension: req.body.dimension,
      productCost: req.body.productCost,
      expense: req.body.expense,
      profit: req.body.profit,
      totalSellingPrice: req.body.totalSellingPrice,
    });
    let receipieList = await recipeModel.find({ branchId: recipient.branchId });
    if (Array.isArray(receipieList) && receipieList.length > 0) {
      recipient.transNo = receipieList[receipieList.length - 1].transNo + 1;
    } else {
      recipient.transNo = 1;
    }
    let data = await recipient.save();
    if (data) {
      for (let i = 0; i < req.body.recipient.length; i++) {
        // const x = req.body.recipient[i];
        let stockdata = {
          itemType: req.body.recipient[i].type,
          itemId: req.body.recipient[i].itemInfo,
          stock: -req.body.recipient[i].quantity,
          branchId: data.branchId,
          dimension: req.body.recipient[i].dimension,
          rate: req.body.recipient[i].rate,
        };
        let stockExist = await stockModel.findOne({
          itemId: stockdata.itemId,
          branchId: stockdata.branchId,
        });
        if (common_service.checkObject(stockExist)) {
          let stockFind = {};
          stockExist.stock.find((x) => {
            if (x.dimension == stockdata.dimension) {
              stockFind = x;
            }
          });
          if (common_service.checkObject(stockFind)) {
            if (stockFind.dimensionStock == 0 && stockdata.stock < 0) {
              await recipeModel.deleteOne({ _id: data._id });
              return (res = {
                data: { msg: `Item Stock is ${stockFind.dimensionStock}` },
                status: STATUSCODES.FORBIDDEN,
              });
            } else {
              stockFind.dimensionStock =
                stockFind.dimensionStock + stockdata.stock;
            }
          } else {
            await recipeModel.deleteOne({ _id: data._id });
            return (res = {
              data: { msg: `Item Stock Not Updated ` },
              status: STATUSCODES.FORBIDDEN,
            });
          }
          let stockdataresponse = await stockModel.findOneAndUpdate(
            { _id: stockExist._id },
            { $set: stockExist },
            { new: true }
          );
          if (common_service.checkObject(stockdataresponse)) {
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
              date: new Date(recipient.date).getTime(),
              orderNo: recipient.transNo,
              type: PREFIXES.RECEIPIENT,
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
              date: new Date(recipient.date).getTime(),
              orderNo: recipient.transNo,
              type: PREFIXES.RECEIPIENT,
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
        }
      }

      if (data.quantity > 0) {
        let foodSingle = await foodModel.findOne({ _id: data.foodId });
        if (common_service.checkObject(foodSingle)) {
          let stockdata = {
            itemType: 1,
            itemId: data.foodId,
            stock: data.quantity,
            branchId: data.branchId,
            dimension: data.dimension,
            rate: 0,
          };
          let dimensionfind = foodSingle.dimensions.find(
            (x) => x.size == data.dimension
          );
          if (common_service.checkObject(dimensionfind)) {
            let price = data.totalSellingPrice / data.quantity;
            let calculatedPrice = price * (dimensionfind.gst / 100);
            dimensionfind.price = price;
            dimensionfind.calculatedPrice = calculatedPrice;
            dimensionfind.mrp = price + calculatedPrice;
            await foodModel.findOneAndUpdate(
              { _id: foodSingle._id },
              { $set: foodSingle },
              { new: true }
            );
            stockdata.dimension = dimensionfind.size;
            stockdata.rate = dimensionfind.mrp;
          }
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
            let stockdataresponse = await stockModel.findOneAndUpdate(
              { _id: stockExist._id },
              { $set: stockExist },
              { new: true }
            );
            if (common_service.checkObject(stockdataresponse)) {
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
                date: new Date(recipient.date).getTime(),
                orderNo: recipient.transNo,
                type: PREFIXES.RECEIPIENT,
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
                date: new Date(recipient.date).getTime(),
                orderNo: recipient.transNo,
                type: PREFIXES.RECEIPIENT,
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
                let newlog = new logModel({
                  date: new Date().getTime(),
                  emp_id: req.decode._id,
                  type: LOG.FOODMANAGEMENT_RECIPE_ADD.type,
                  description: LOG.FOODMANAGEMENT_RECIPE_ADD.description,
                  branchId: stocklogdataresponse.branchId,
                  link: {},
                  payload: { token: req.headers.authorization, body: req.body },
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
        }
      }
      data._doc["date"] = common_service
        .prescisedateconvert(data.date)
        .split(" ")[0];

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

//added on 14-02-22
//edited on 20-04-22
// edited on 03/07/23
module.exports.viewRecipies = async (req) => {
  const { recipeModel } = conn.food(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  const { employeeModel } = conn.employee(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let res = {};
    let rslist = [];
    if (req.decode.role == ROLES.USER) {
      var recipientsList = await recipeModel
        .find({
          branchId: req.body.branchId,
        })
        .skip(req.body.index)
        .limit(30);
    } else {
      if (req.body.branchId) {
        var recipientsList = await recipeModel
          .find({
            branchId: req.body.branchId,
          })
          .skip(req.body.index)
          .limit(30);
      } else {
        var recipientsList = await recipeModel
          .find({})
          .skip(req.body.index)
          .limit(30);
      }
    }
    if (recipientsList.length > 0) {
      for (let i = 0; i < recipientsList.length; i++) {
        const element = recipientsList[i];
        let resobj = {};
        resobj._id = element._id; //added on 20-04-22
        resobj.productCost = 0;
        resobj.totalExpense = element.expense.totalAmount;
        resobj.profit = element.profit;
        resobj.totalSellingPrice = element.totalSellingPrice;
        resobj.quantity = element.quantity;
        let employee = await employeeModel.findOne({
          _id: element.emp_id,
        });
        let foodItem = await foodModel.findOne({
          _id: element.foodId,
        });
        resobj.itemName = foodItem != null ? foodItem.prod_name : "no product";
        resobj.recipientList = [];
        for (let j = 0; j < element.recipient.length; j++) {
          const item = element.recipient[j];

          var product = await productModel.findOne({
            _id: item.itemInfo,
          });
          if (product) {
            product._doc["stock"] = 0;
          }
          resobj.recipientList.push({
            productName: product?.productName ? product.productName : null,
            // stock: product?.stock ? product.stock : null, //added on 20-04-22
            uom: item.dimension, //added on 20-04-22
            quantity: item.quantity, //renamed parameter on 20-04-22-> quantity -> used
            wastage: item.wastage,
            unitPrice: item.rate,
            productCost: item.rate * item.quantity,
          });
          resobj.productCost = resobj.productCost + item.rate * item.quantity;
        }
        resobj.date = common_service
          .prescisedateconvert(element.date)
          .split(" ")[0]; //added on 20-04-22 -> added new date convertion
        resobj.employeeName = employee?.staff_name ? employee.staff_name : null;

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
//added on 17-02-22
module.exports.addQrcode = async (req) => {
  try {
    let data = {
      barcodeNumber: req.body.barcodeNumber,
    };
    let strData = JSON.stringify(data);
    await common_service.createDirectory(
      `./public/${req.decode.db}/FoodItems/Qrcode`
    );
    let image = await qr.toFile(
      `./public/${req.decode.db}/FoodItems/Qrcode/${req.body._id}.png`,
      strData
    );
    return (res = `Images/${req.decode.db}/FoodItems/Qrcode/${req.body._id}.png`);
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 17-02-22
module.exports.addBarcode = async (req) => {
  try {
    let res = {};
    let barcodeImg = barcode("code128", {
      data: req.body.prod_name,
      width: 400,
      height: 100,
    });
    barcodeImg.saveImage(
      process.env.LOCALSTORAGEBASE +
        `/Images/FoodItems/Barcode/${req.body.prod_id}.png`,
      function (err) {
        if (err) throw err;
      }
    );
    return (res =
      process.env.FILEURL + `Images/FoodItems/Barcode/${req.body.prod_id}.png`);
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 02-03-22
//edited on 13-05-22
//edited on 21-06-22
//edited on 22-06-22
// Edited on 09-08-23
module.exports.applycoupon = async (req) => {
  const { couponModel } = conn.food(req.decode.db);
  try {
    let res = {};
    let couponExist = await couponModel.findOne({
      branchId: req.body.branchId, //added on 21-06-22
      "couponCode.couponCode": req.body.couponCode, //Changed on 09-08-23
    });
    if (!common_service.isEmpty(couponExist)) {
      couponExist.couponType.prod_id = couponExist.foodItem; //added on 22-06-22 -> foodItem field added to return response
      couponExist.couponType.dimension = couponExist.dimension; //added on 23-06-22 -> dimension field added to return response
      console.log(couponExist.couponcode);
      let index = couponExist.couponCode.findIndex(
        (x) => x.couponCode == req.body.couponCode
      );
      if (index != -1) {
        couponExist.couponCode[index].redeemed = true;
        await couponExist.save();
      }
      res = { data: couponExist.couponType, status: STATUSCODES.SUCCESS };
    } else {
      let response = {
        offertype: "NO Offer",
        offer: null,
      };
      res = { data: response, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 10-03-22
module.exports.foodSingleView = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  const offerModel = conn.offer(req.decode.db);
  const { subcategoryModel, categoryModel } = conn.category(req.decode.db);
  try {
    let res = {};
    if (req.body._id.length == 24) {
      var food_single = await foodModel.findOne({
        _id: req.body._id,
      });
    } else {
      res = {
        data: { msg: `Invalid Payload` },
        status: STATUSCODES.BADREQUEST,
      };
    }

    if (common_service.checkObject(food_single)) {
      let element = food_single;
      element.dimensions.map(async (e) => {
        let offerdata = await offerModel.findOne({
          food_id: element._id,
          dimension: e.size,
          dataStatus: true,
        });
        e.offer =
          !common_service.isEmpty(offerdata) &&
          offerdata.endDate > new Date(Date.now()).getTime()
            ? offerdata?.offer
            : null;
        if (
          !common_service.isEmpty(e.offer) &&
          e.offer.offerTypes == OFFERTYPES.PERCENTAGE
        ) {
          e.calculatedPrice =
            e.calculatedPrice -
            Math.ceil(e.calculatedPrice * (e.offer.percentage[0] / 100));
        }
        if (e.barcode) {
          e.barcode = process.env.FILEURL + e.barcode;
        }
        if (e.qrcode) {
          e.qrcode = process.env.FILEURL + e.qrcode;
        }
      });
      /*ends here */
      food_single._doc["release_date"] = common_service
        .prescisedateconvert(food_single.release_date)
        .split(" ")[0];
      let category = await categoryModel.findOne({ _id: food_single.category });
      let subcategory = await subcategoryModel.findOne({
        _id: food_single.subcategoryId,
      });

      food_single._doc["categoryName"] = category
        ? category.categoryName
        : null;
      food_single._doc["subcategoryName"] = subcategory
        ? subcategory.subcategoryName
        : null;
      food_single.imageUrl = food_single.imageUrl.map(
        (e) => process.env.FILEURL + e
      );
      res = { data: food_single, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 20-04-22
// edited on 03/07/23
module.exports.viewrecipieSingle = async (req) => {
  const { recipeModel } = conn.food(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { employeeModel } = conn.employee(req.decode.db);
  const { productModel } = conn.product(req.decode.db);
  try {
    let res = {};
    let recipieSingle = await recipeModel.findOne({
      _id: req.body.id,
    });
    if (recipieSingle) {
      let resobj = {};
      resobj._id = recipieSingle._id;
      let foodItem = await foodModel.findOne({
        _id: recipieSingle.foodId,
      });
      resobj.itemName = foodItem ? foodItem.prod_name : null;
      let employee = await employeeModel.findOne({
        _id: recipieSingle.emp_id,
      });
      resobj.employeeName = employee ? employee.staff_name : null;
      resobj.recipientList = [];
      resobj.totalProductCost = 0;
      for (let i = 0; i < recipieSingle.recipient.length; i++) {
        const element = recipieSingle.recipient[i];
        var product = await productModel.findOne({
          _id: element.itemInfo,
        });
        if (product) {
          resobj.recipientList.push({
            productName: element.itemName,
            // stock: product.stock,
            unit: element.dimension,
            used: element.quantity,
            unitPrice: element.rate,
            wastage: element.wastage,
            productCost: element.quantity * element.rate,
          });
          resobj.totalProductCost =
            resobj.totalProductCost + element.quantity * element.rate;
        }
      }
      resobj.date = common_service
        .prescisedateconvert(recipieSingle.date)
        .split(" ")[0];
      resobj.profit = recipieSingle.profit;
      resobj.totalSellingPrice = recipieSingle.totalSellingPrice;
      resobj.totalExpense = recipieSingle.expense.totalAmount;
      res = { data: resobj, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 04-05-22
//edited on 21-06-22
//assembled on 15-07-22
module.exports.viewfooditembycatandsubcategory = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  const offerModel = conn.offer(req.decode.db);
  const { categoryModel, subcategoryModel } = conn.category(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  try {
    let res = {};
    let foodList = await foodModel.find({
      category: req.body.category,
      subcategoryId: req.body.subcategoryId,
      dataStatus: true,
      branchId: req.body.branchId,
    });
    if (Array.isArray(foodList) && foodList.length > 0) {
      for (let i = 0; i < foodList.length; i++) {
        const element = foodList[i];
        element.dimensions.map(async (e) => {
          let offerdata = await offerModel.findOne({
            food_id: element._id,
            dimension: e.size,
            dataStatus: true,
          });
          e.offer =
            !common_service.isEmpty(offerdata) &&
            offerdata.endDate > new Date(Date.now()).getTime()
              ? offerdata?.offer
              : null;
          if (
            !common_service.isEmpty(e.offer) &&
            e.offer.offerTypes == OFFERTYPES.PERCENTAGE
          ) {
            // e.calculatedPrice =
            //   e.calculatedPrice -
            //   Math.ceil(e.calculatedPrice * (e.offer.percentage[0] / 100));
          }
        });
        let category = await categoryModel.findOne({ _id: element.category });
        let subcategory = await subcategoryModel.findOne({
          _id: element.subcategoryId,
        }); //added on 23-04-22 -> added on 23-04-22 -> subcategory reference
        element._doc["categoryName"] =
          category != null ? category.categoryName : null;
        element._doc["subcategoryName"] =
          subcategory != null ? subcategory.subcategoryName : null;
        element._doc["release_date"] = common_service
          .prescisedateconvert(element.release_date)
          .split(" ")[0];
        if (Array.isArray(element.imageUrl)) {
          for (let j = 0; j < element.imageUrl.length; j++) {
            element.imageUrl[j] = process.env.FILEURL + element.imageUrl[j];
          }
        }
        /*ends here */
      }
      res = { data: foodList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 19-05-2022,assembled
module.exports.getFoodId = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  let res = {},
    arr = [];
  try {
    let TRANSNO = 0;
    // let TRANSLIST = await foodModel.aggregate([
    //   {
    //     $sort: { prod_id: -1 },
    //   },
    // ]); //added orderId creation based on latest order on 02-02-22
    /*edited on 17-06-22 */
    let TRANSLIST = await foodModel.find({ branchId: req.body.branchId });
    if (TRANSLIST.length > 0) {
      TRANSNO = TRANSLIST[TRANSLIST.length - 1].prod_id + 1;
    } else {
      TRANSNO = 1;
    }
    /*ends here */
    return (res = {
      data: { prefix: "PROD", transNo: TRANSNO },
      status: STATUSCODES.SUCCESS,
    });
  } catch (error) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 10-06-22
module.exports.removeFoodItem = async (req) => {
  const { foodModel } = conn.food(process.env.db);
  try {
    let res = {};
    let food_single = await foodModel.findOne({
      _id: req,
    });
    if (!common_service.isEmpty(food_single)) {
      food_single.dataStatus = false;
      let data = await food_single.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
      return res;
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 13-06-22
module.exports.taxableRate = (req) => {
  try {
    let res = {};
    let taxedRate = 0;
    taxedRate =
      req >= 1000
        ? req * (process.env.MAX_PERCENT / 100)
        : (taxedRate = (req * process.env.MIN_PERCENT) / 100);
    req = Math.ceil(req + taxedRate);
    return (res = { data: req, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 23-07-22
module.exports.updateQRcodeAndBarcode = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  try {
    let res = {};
    let foodExist = await foodModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(foodExist)) {
      let dimensionfind = foodExist.dimensions.find(
        (x) => x.size == req.body.size
      );
      if (!common_service.isEmpty(dimensionfind)) {
        let index = foodExist.dimensions.findIndex(
          (y) => y.size == req.body.size
        );
        if (index != -1) {
          let dimObj = {
            size: foodExist.dimensions[index].size,
            qty: foodExist.dimensions[index].qty,
            mrp: foodExist.dimensions[index].mrp,
            price: foodExist.dimensions[index].price,
            calculatedPrice: foodExist.dimensions[index].calculatedPrice,
            barcodeNumber: req.body.barcodeNumber,
          };
          await common_service.createDirectory(
            `./public/${req.decode.db}/FoodItems/Barcode`
          );
          if (!foodExist.dimensions[index].barcode) {
            if (req.files.barcode) {
              req.files.barcode.mv(
                `./public/${req.decode.db}/FoodItems/Barcode/${
                  foodExist.prod_id
                }-${req.files.barcode.name.replace(/\s+/g, "")}`
              );
              dimObj.barcode = `Images/${req.decode.db}/FoodItems/Barcode/${
                foodExist.prod_id
              }-${req.files.barcode.name.replace(/\s+/g, "")}`;
            }
          } else {
            if (foodExist.dimensions[index].barcode) {
              if (req.files.barcode) {
                fs.unlink(
                  `public/` + foodExist.dimensions[index].barcode,
                  (err) => {
                    if (err) console.log(err);
                  }
                );
                req.files.barcode.mv(
                  `./public/${req.decode.db}/FoodItems/Barcode/${
                    foodExist.prod_id
                  }-${req.files.barcode.name.replace(/\s+/g, "")}`
                );
                dimObj.barcode = `Images/${req.decode.db}/FoodItems/Barcode/${
                  foodExist.prod_id
                }-${req.files.barcode.name.replace(/\s+/g, "")}`;
              }
            }
          }
          if (!foodExist.dimensions[index].qrcode) {
            dimObj.qrcode = await this.addQrcode(req);
          } else {
            if (foodExist.dimensions[index].qrcode) {
              fs.unlink(
                `public/` +
                  foodExist.dimensions[index].qrcode.split(
                    process.env.SPLITPATH
                  )[1],
                (err) => {
                  if (err) console.log(err);
                }
              );
              dimObj.qrcode = await this.addQrcode(req);
            }
          }
          foodExist.dimensions[index] = dimObj;
        }
      }
      let data = await foodModel.findOneAndUpdate(
        { _id: foodExist._id },
        { $set: foodExist },
        { new: true }
      );
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
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//added on 01-07-23
module.exports.viewProductsforBilling = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  const offerModel = conn.offer(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let rsList = [];
    let stock_List = await stockModel.find({
      dataStatus: true,
      branchId: req.body.branchId,
      itemType: 1,
    });
    if (Array.isArray(stock_List) && stock_List.length > 0) {
      for (let i = 0; i < stock_List.length; i++) {
        const element = stock_List[i];
        let resobj = {
          _id: null,
          release_date: null,
          imageUrl: null,
          stock: 0,
          closingStock: 0,
          locationName: null,
          branchId: null,
          food_type: null,
          unit: null,
          prod_name: null,
          calculatedPrice: null,
          category: null,
          subCategoryId: null,
          offer: [],
          vatorgst: 0,
          dimensions: null,
          prod_id: null,
        };
        resobj._id = element.itemId;
        let offerExist = await offerModel.findOne({
          food_id: element.itemId,
          branchId: req.body.branchId,
        });
        if (offerExist) {
          let date = new Date(req.body.date).getTime();
          if (offerExist.startDate <= date && date <= offerExist.endDate) {
            resobj.offer = offerExist.offer;
          }
        }
        let product = await foodModel.findOne({
          _id: element.itemId,
        });
        if (product != null) {
          if (Array.isArray(product.imageUrl) && product.imageUrl.length > 0) {
            resobj.imageUrl = product?.imageUrl?.map(
              (x) => (x = process.env.FILEURL + x)
            );
          }
          resobj.release_date = product.release_date
          ? common_service.prescisedateconvert(product.release_date)
          : null;
          resobj.branchId = product.branchId ? product.branchId : null;
          resobj.food_type = product.food_type ? product.food_type : null;
          resobj.unit = product.unit ? product.unit : null;
          resobj.prod_name = product.prod_name ? product.prod_name : null;
          resobj.category = product.category ? product.category : null;
          resobj.subCategoryId = product.subcategoryId
          ? product.subcategoryId
          : null;
          resobj.dimensions = product.dimensions;
          resobj.prod_id = `FOOD${product.prod_id}`;
        }
        let branchExist = await branchModel.findOne({
          storeCode: element.branchId,
        });
        resobj.locationName = "No Location";
        if (!common_service.isEmpty(branchExist)) {
          resobj.locationName = branchExist.branchName;
        }
        if (Array.isArray(resobj.dimensions)) {
          resobj?.dimensions.map((x) => {
            let stkExist = element.stock.find((n) => n.dimension == x.size);
            if (!common_service.isEmpty(stkExist)) {
              x.stock = stkExist.dimensionStock;
              resobj.stock = resobj.stock + x.stock;
            } else {
              x.stock = 0;
            }
          });
        } else {
          resobj.stock = 0;
        }
        resobj.closingStock = resobj.stock;
        if(resobj.prod_id != null){
          rsList.push(resobj);
        }
      }
      if (req.body.categoryId) {
        rsList = rsList.filter((x) => x.category == req.body.categoryId);
      }
      if (req.body.subcategoryId) {
        rsList = rsList.filter(
          (x) => x.subCategoryId == req.body.subcategoryId
        );
      }
      if (rsList.length > 0)
        return (res = { data: rsList, status: STATUSCODES.SUCCESS });
      else return (res = { data: rsList, status: STATUSCODES.NOTFOUND });
    } else {
      return (res = { data: [], status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    console.error(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 24/07/23
module.exports.deleteRecipie = async (req) => {
  const { recipeModel } = conn.food(req.decode.db);
  const { stockModel, stockLogModel } = conn.stock(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let recipieSingle = await recipeModel.findOne({
      _id: req.body.id,
    });
    if (common_service.checkObject(recipieSingle)) {
      for (let i = 0; i < recipieSingle.recipient.length; i++) {
        let stockdata = {
          itemId: recipieSingle.recipient[i].itemInfo,
          stock: parseInt(
            recipieSingle.recipient[i].quantity +
              recipieSingle.recipient[i].wastage
          ),
          branchId: recipieSingle.branchId,
        };
        let stockExist = await stockModel.findOne({
          itemId: stockdata.itemId,
          branchId: stockdata.branchId,
        });
        if (stockExist) {
          stockExist.stock.map((x) => {
            x.dimensionStock = x.dimensionStock + stockdata.stock;
          });
          let newstockData = await stockExist.save();
        }
      }
      let stocklogExist = await stockLogModel.deleteMany({
        branchId: recipieSingle.branchId,
        orderNo: recipieSingle.transNo,
        type: PREFIXES.RECEIPIENT,
      });

      let foodstockExist = await stockModel.findOne({
        itemId: recipieSingle.foodId,
        branchId: recipieSingle.branchId,
      });

      if (common_service.checkObject(foodstockExist)) {
        let stockFind = foodstockExist.stock.find(
          (x) => x.dimension === recipieSingle.dimension
        );
        if (common_service.checkObject(stockFind)) {
          stockFind.dimensionStock =
            stockFind.dimensionStock - recipieSingle.quantity;
        }

        let newfoodstock = await foodstockExist.save();
        let data = await recipeModel.deleteOne({
          _id: req.body.id,
        });

        if (data && newfoodstock) {
          let newlog = new logModel({
            date: new Date().getTime(),
            emp_id: req.decode._id,
            type: LOG.FOODMANAGEMENT_RECIPE_ADD.type,
            description: LOG.FOODMANAGEMENT_RECIPE_ADD.description,
            branchId: newfoodstock.branchId,
            link: {},
            payload: { token: req.headers.authorization, body: req.body },
          });
          let logresponse = await newlog.save();
          if (logresponse == null) {
            console.log("log save faild");
          }
          return (res = { data: data, status: STATUSCODES.SUCCESS });
        } else {
          return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
        }
      } else {
        return (res = {
          data: "food stock not found",
          status: STATUSCODES.NOTFOUND,
        });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 04-08-23
module.exports.addFoodDimension = async (req) => {
  const { foodDimensionModel } = conn.food(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let dimension = await foodDimensionModel.findOne({
      dimensionName: req.body.dimensionName,
    });
    if (dimension) {
      res = { data: dimension, status: STATUSCODES.EXIST };
    } else {
      let newDimension = await foodDimensionModel({
        dimensionName: req.body.dimensionName,
        status: true,
      });
      let data = await newDimension.save();
      let newlog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.FOODMANAGEMENT_FOODDIMENSION_ADD.type,
        description: LOG.FOODMANAGEMENT_FOODDIMENSION_ADD.description,
        branchId: data.branchId,
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
    }
    return res;
  } catch (e) {
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

// added on 04-08-23
module.exports.viewFoodDimension = async (req) => {
  const { foodDimensionModel } = conn.food(req.decode.db);
  try {
    let dimensionExist = await foodDimensionModel.find({});
    if (Array.isArray(dimensionExist) && dimensionExist.length > 0) {
      // for (let i = 0; i < dimensionExist.length; i++) {
      //   const element = dimensionExist[i];
      // }
      res = { data: dimensionExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

//added on 08-05-23
module.exports.viewFoodList = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  const { subcategoryModel, categoryModel } = conn.category(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let res = {};
    let food_List = [];
    if (req.decode.role == ROLES.USER) {
      food_List = await foodModel
        .find({
          dataStatus: true,
          branchId: req.body.branchId,
        })
        .skip(req.body.index)
        .limit(30);
    } else {
      if (req.body.branchId) {
        food_List = await foodModel
          .find({
            dataStatus: true,
            branchId: req.body.branchId,
          })
          .skip(req.body.index)
          .limit(30);
      } else {
        food_List = await foodModel
          .find({
            dataStatus: true,
          })
          .skip(req.body.index)
          .limit(30);
      }
    }
    if (food_List.length > 0) {
      for (let i = 0; i < food_List.length; i++) {
        const element = food_List[i];
        let offerData = await offerService.viewofferByitemId(element._id);
        if (offerData.data.offerType == OFFERTYPES.PERCENTAGE) {
          let percent = offerData.data.offer;
          element.dimensions.forEach(
            (item) =>
              (item.offerprice =
                item.size != offerData.data.dimension
                  ? 0
                  : Math.ceil(
                      item.calculatedPrice -
                        item.calculatedPrice * (percent / 100)
                    ))
          );

          element._doc["offer"] = {
            offerType: offerData.data.offerType,
            value: offerData.data.offer,
          };
        } else {
          element.dimensions.forEach((item) => (item.offerprice = 0)); //added on 15-06-22 -> to show offerprice in dimensions if no  offer is present
        }
        /*added on 10-06-22 -> new fileurl implementation */
        if (Array.isArray(element.imageUrl) && element.imageUrl.length > 0) {
          for (let j = 0; j < element.imageUrl.length; j++) {
            element.imageUrl[j] = process.env.FILEURL + element.imageUrl[j];
          }
        }
        /*ends here */
        element._doc["release_date"] = common_service.prescisedateconvert(
          element.release_date
        );

        let category = await categoryModel.findOne({ _id: element.category });
        let subcategory = await subcategoryModel.findOne({
          _id: element.subcategoryId,
        });
        element._doc["categoryName"] =
          category != null ? category.categoryName : null;
        element._doc["subcategoryName"] = subcategory
          ? subcategory.subcategoryName
          : null;
        element.barcode =
          element.barcode == null
            ? null
            : element.barcode == undefined
            ? undefined
            : element.barcode == ""
            ? ""
            : process.env.FILEURL + element.barcode;
        element.qrcode =
          element.qrcode != null &&
          element.qrcode != undefined &&
          element.qrcode != ""
            ? process.env.FILEURL + element.qrcode
            : null || undefined || "";
        element._doc["prod_id"] = `FOOD${element.prod_id}`; //added on 06-08-22 -> product id changed on basis of  admin/user view
      }
      res = { data: food_List, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//added on 09-08-23
module.exports.updateBarcode = async (req) => {
  const { foodModel } = conn.food(req.decode.db);
  try {
    let res = {};
    let foodExist = await foodModel.findOne({ _id: req.body._id });
    let fp = await common_service.createDirectory(
      `./public/${req.decode.db}/FoodItems/Barcode`
    );
    if (!common_service.isEmpty(foodExist)) {
      let dimensionfind = foodExist.dimensions.find(
        (x) => x.size == req.body.size
      );
      if (!common_service.isEmpty(dimensionfind)) {
        let index = foodExist.dimensions.findIndex(
          (y) => y.size == req.body.size
        );
        if (index != -1) {
          let dimObj = {
            size: foodExist.dimensions[index].size,
            qty: foodExist.dimensions[index].qty,
            mrp: foodExist.dimensions[index].mrp,
            price: foodExist.dimensions[index].price,
            calculatedPrice: foodExist.dimensions[index].calculatedPrice,
          };
          if (!foodExist.dimensions[index].barcode) {
            if (req.files.barcode) {
              req.files.barcode.mv(
                `./public/${req.decode.db}/FoodItems/Barcode/${
                  foodExist.prod_id
                }-${req.body.size}-${req.files.barcode.name.replace(
                  /\s+/g,
                  ""
                )}`
              );
              dimObj.barcode = `Images/${req.decode.db}/FoodItems/Barcode/${
                foodExist.prod_id
              }-${req.body.size}-${req.files.barcode.name.replace(/\s+/g, "")}`;
              dimObj.barcodeNo = req.body.barcodeNo ? req.body.barcodeNo : null;
            }
          } else {
            if (foodExist.dimensions[index].barcode) {
              if (req.files.barcode) {
                fs.unlink(
                  `public/` +
                    foodExist.dimensions[index].barcode.split("Images/")[1],
                  (err) => {
                    if (err) console.log(err);
                  }
                );
                req.files.barcode.mv(
                  `./public/${req.decode.db}/FoodItems/Barcode/${
                    foodExist.prod_id
                  }-${req.body.size}-${req.files.barcode.name.replace(
                    /\s+/g,
                    ""
                  )}`
                );
                dimObj.barcode = `Images/${req.decode.db}/FoodItems/Barcode/${
                  foodExist.prod_id
                }-${req.body.size}-${req.files.barcode.name.replace(
                  /\s+/g,
                  ""
                )}`;
                dimObj.barcodeNo = req.body.barcodeNo
                  ? req.body.barcodeNo
                  : null;
              }
            }
          }
          foodExist.dimensions[index] = dimObj;
        }
      } else {
        return (res = {
          data: "dimension not found",
          status: STATUSCODES.NOTFOUND,
        });
      }
      let data = await foodExist.save();
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
    console.log(e);
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 16-08-23
module.exports.addBillofMaterial = async (req) => {
  const { billofMaterialModel } = conn.food(req.decode.db);
  try {
    let materialExist = await billofMaterialModel.findOne({
      productId: req.body.productId,
    });

    if (materialExist == null) {
      let newMaterial = new billofMaterialModel({
        productId: req.body.productId,
        productName: req.body.productName,
        quantity: req.body.quantity,
        uom: req.body.uom,
        materials: req.body.materials,
        totalCost: req.body.totalCost,
      });
      let data = await newMaterial.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      res = { data: {}, status: STATUSCODES.CONFLICT };
    }
    return res;
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

// added on 16-08-23
module.exports.viewBillOfMaterials = async (req) => {
  const { billofMaterialModel } = conn.food(req.decode.db);
  try {
    let materialExist = await billofMaterialModel.findOne({
      productId: req.body.productId,
    });
    if (materialExist) {
      res = { data: materialExist.materials, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.log(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

// added on 17-08-23
module.exports.editBillofMaterials = async (req) => {
  const { billofMaterialModel } = conn.food(req.decode.db);
  try {
    let materialsExist = await billofMaterialModel.findOne({
      productId: req.body.productId,
    });
    if (materialsExist != null) {
      materialsExist.materials = req.body.materials
        ? req.body.materials
        : materialsExist.materials;
      let data = await billofMaterialModel.findOneAndUpdate(
        { _id: materialsExist._id },
        { $set: materialsExist },
        { new: true }
      );

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
    console.error(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

// added on 17-08-23
module.exports.deletebillofProduct = async (req) => {
  const { billofMaterialModel } = conn.food(req.decode.db);
  try {
    let materialExist = await billofMaterialModel.findOne({
      _id: req.body._id,
    });
    if (materialExist) {
      materialExist.materials = materialExist.materials.filter(
        (x) => x.itemId != req.body.itemId
      );
      let data = await billofMaterialModel.findOneAndUpdate(
        { _id: materialExist._id },
        { $set: materialExist },
        { new: true }
      );
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
    console.error(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//#endregion
