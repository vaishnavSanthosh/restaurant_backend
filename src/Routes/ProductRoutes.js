/** @format */

//added on 04-02-2022
//#region header
const {
  STATUSCODES,
  LOG,
  API,
  URL,
  PREFIXES,
  ROLES,
} = require("../Model/enums");
const fs = require("fs");
require("dotenv").config({ path: "./.env" });
const settings_service = require("./settingsRoutes");
const conn = require("../../userDbConn");
const common_service = require("./commonRoutes");
//#endregion

//#region methods
//added on 04-02-2022
module.exports.addProduct = async (req) => {
  const { productModel } = conn.product(req.decode.db);
  const { categoryModel } = conn.category(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let IMAGEURL = "";
    let PRODNO = 0;
    let PRODLIST = await productModel.find({});
    if (PRODLIST.length > 0) {
      PRODNO = PRODLIST[PRODLIST.length - 1].code + 1;
    } else {
      PRODNO = 1;
    }
    /*ends here */
    if (req.files) {
      let fp = await common_service.createDirectory(
        `./public/${req.decode.db}/ProductItem`
      );
      req.files.file.mv(
        `./public/${req.decode.db}/ProductItem/${req.decode.branchId}PROD${PRODNO}` +
          req.files.file.name.replace(/\s+/g, "")
      );
      IMAGEURL =
        `Images/${req.decode.db}/ProductItem/${req.decode.branchId}PROD${PRODNO}` +
        req.files.file.name.replace(/\s+/g, "");
    }
    let productItem = new productModel({
      code: PRODNO, //edited on 24-03-22 changed field from generate from backend to body based
      category: req.body.category,
      productName: req.body.productName,
      unit: req.body.unit.toLowerCase(),
      imageUrl: IMAGEURL,
      status: true,
      sellingRate: 0,
      branchId: req.body.branchId,
    });
    let data = await productItem.save();
    if (data) {
      data._doc["productcode"] = `PROD` + data.code; //added on 07-04-22//corrected on 18-04-22
      let catDetails = await categoryModel.findOne({ _id: data.category });
      data._doc["categoryName"] = catDetails ? catDetails.categoryName : null;
      let newlog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.PURCHASEMANAGE_ADDPRODUCT.type,
        description: LOG.PURCHASEMANAGE_ADDPRODUCT.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newlog.save();
      if (logresponse == null) {
        console.log("log save faild");
      }
      res = {
        data: data,
        status: STATUSCODES.SUCCESS,
      };
    } else {
      res = { data: {}, status: STATUSCODES.UNPROCESSED };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 07-02-2022
module.exports.viewProducts = async (req) => {
  const { productModel } = conn.product(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  const { categoryModel } = conn.category(req.decode.db);
  try {
    req.body.index=parseInt(req.body.index)*20
    let res = {};
    let productList = [];
    if (req.decode.role == ROLES.ADMIN) {
      productList = await productModel.find({
        status: true,
      }).skip(req.body.index).limit(30)
    } else {
      productList = await productModel.find({
        status: true,
        branchId: req.body.branchId,
      }).skip(req.body.index).limit(30)
    }
    if (productList.length > 0) {
      for (let i = 0; i < productList.length; i++) {
        const element = productList[i];
        element._doc["productcode"] = PREFIXES.PRODUCT + element.code;
        let category = {};
        if (common_service.isObjectId(element.category)) {
          category = await categoryModel.findOne({
            _id: element.category,
          });
        }
        element._doc["categoryName"] = common_service.checkObject(category)
          ? category.categoryName
          : "No category";
        element._doc["imageUrl"] = process.env.FILEURL + element.imageUrl;
        element._doc["stock"] = 0;
        let stockExist = await stockModel.findOne({ itemId: element._id });
        if (common_service.checkObject(stockExist)) {
          if (Array.isArray(stockExist.stock) && stockExist.stock.length) {
            stockExist.stock.map((x) => {
              if (typeof x.dimensionStock == "number" && x.dimensionStock > 0) {
                element._doc["stock"] =
                  element._doc["stock"] + x.dimensionStock;
              }
            });
          }
        }
      }
      res = { data: productList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 08-02-2022
module.exports.updateProductStock = async (req) => {
  const { productModel } = conn.product(process.env.db);
  try {
    let res = {};

    let prod_Single = await productModel.findOne({
      _id: req.itemInfo,
    });
    if (prod_Single) {
      prod_Single.stock = prod_Single.stock + req.quantity;
      let data = await prod_Single.save();
      if (data) {
        let lg = {
          type: LOG.PUR_UPDATESTOCK,
          emp_id: req.decode ? req.decode._id : null,
          description: "update stock",
          link: {
            url: null,
            api: null,
          },
        };
        await settings_service.addLog(lg);
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

//added on 08-02-2022
//edited on 07-04-2022
module.exports.viewProductSingle = async (req) => {
  const { productModel } = conn.product(req.decode.db);
  const { categoryModel } = conn.category(req.decode.db);
  const { stockModel } = conn.stock(req.decode.db);
  try {
    let res = {};
    let productSingle = await productModel.findOne({ _id: req.body._id });
    if (productSingle) {
      let category = await categoryModel.findOne({
        _id: productSingle.category,
      });
      productSingle._doc["productcode"] =
        productSingle.branchId.substr(3) + `PROD` + productSingle.code; //edited on 07-04-22 -> temporary product code removed and added proposed one//edited on 18-04-22
      productSingle._doc["categoryName"] = category
        ? category.categoryName
        : null;
      productSingle._doc["imageUrl"] =
        process.env.FILEURL + productSingle.imageUrl;
      productSingle._doc["stock"] = 0;
      let stockExist = await stockModel.findOne({ itemId: productSingle._id });
      if (common_service.checkObject(stockExist)) {
        if (Array.isArray(stockExist.stock) && stockExist.stock.length) {
          stockExist.stock.map((x) => {
            if (typeof x.dimensionStock == "number" && x.dimensionStock > 0) {
              productSingle._doc["stock"] =
                productSingle._doc["stock"] + x.dimensionStock;
            }
          });
        }
      }
      res = { data: productSingle, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 08-02-2022
//edited on 24-03-22 -> added imageUrl validation
//edited on 11-04-22
module.exports.editProducts = async (req) => {
  const { productModel } = conn.product(req.decode.db);
  const{logModel}=conn.settings(req.decode.db)
  try {
    let res = {};
    let prod_Single = await productModel.findOne({
      _id: req.body._id,
    });
    if (common_service.checkObject(prod_Single)) {
      if (req.files) {
        if (prod_Single.imageUrl != null) {
          //edited on 24-03-22

          fs.unlink(
            `public/` + prod_Single.imageUrl.split(process.env.SPLITURL)[1],
            (err) => {
              if (err)
                return (res = { data: err.message, status: STATUSCODES.ERROR });
            }
          );
        }
        req.files.file.mv(
          `./public/${req.decode.db}/ProductItem/${req.body.branchId}PROD${prod_Single.code}` +
            req.files.file.name.replace(/\s+/g, "")
        );
        prod_Single.imageUrl =
          `Images/${req.decode.db}/ProductItem/${req.body.branchId}PROD${prod_Single.code}` +
          req.files.file.name.replace(/\s+/g, "");
      } //removed on 02-06-22 -> removed else block
      prod_Single.category = req.body.category
        ? req.body.category
        : prod_Single.category;
      prod_Single.productName = req.body.productName
        ? req.body.productName
        : prod_Single.productName;
      prod_Single.unit = req.body.unit ? req.body.unit : prod_Single.unit;
      let data = await prod_Single.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.PURCHASEMANAGE_ADDPRODUCT.type,
          description: LOG.PURCHASEMANAGE_ADDPRODUCT.description,
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

//added on 08-02-2022 //edited on 09-02-2022
module.exports.deleteProducts = async (req) => {
  const { productModel } = conn.product(req.decode.db);
  const{logModel}=conn.settings(req.decode.db)
  try {
    let res = {};
    let prod_Single = await productModel.findOne({
      _id: req.body._id, //edited on 09-02-2022 incoming parameter was already id but assigned as req.params.id
    });
    if (prod_Single) {
      prod_Single.status = false;
      let data = await prod_Single.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.PURCHASEMANAGE_ADDPRODUCT.type,
          description: LOG.PURCHASEMANAGE_ADDPRODUCT.description,
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

//added on 24-03-22
//edited on 07-04-22
//edited on 12-04-22
module.exports.generateProdId = async (req) => {
  const { productModel } = conn.product(process.env.db);
  try {
    let PRODNO = 0;
    // let PRODLIST = await productModel.aggregate([
    //   {
    //     $sort: { code: -1 },
    //   },
    // ]); //added orderId creation based on latest order on 02-02-22
    // if (PRODLIST.length > 0) {
    //   PRODNO = PRODLIST[0].code + 1;
    // } else {
    //   PRODNO = 1;
    // }
    /*edited on 17-06-22 */
    let PRODLIST = await productModel.find({ branchId: process.env.branchId });
    if (PRODLIST.length > 0) {
      PRODNO = PRODLIST[PRODLIST.length - 1].code + 1;
    } else {
      PRODNO = 1;
    }
    /*ends here */
    return /* process.env.branchId +  */ `PROD${PRODNO}`; //changes added to return statement on 07-04-22 -> added prefix along with response//removed dual prefixing on 12-04-22
    //edited on 08-08-22 -> removed branchid prefix from return response
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 12-04-22
module.exports.viewStockOutProduct = async (req) => {
  const { productModel } = conn.product(req.decode.db);
  const { categoryModel } = conn.category(req.decode.db);
  try {
    let res = {};
    let productExist = await productModel.find({
      status: true,
      branchId: req.body.branchId,
    }); //added on 14-03-22->added status field to avoid deleted product listing
    if (Array.isArray(productExist) && productExist.length > 0) {
      for (let i = 0; i < productExist.length; i++) {
        const element = productExist[i];
        element._doc["productcode"] = element.branchId + `PROD` + element.code; //edited on 18-04-22
        let category = {};
        if (common_service.isObjectId(element.category)) {
          category = await categoryModel.findOne({ _id: element.category });
        }
        element._doc["categoryName"] =
          category != null ? category.categoryName : null;
      }
      res = { data: productExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 12-04-22
module.exports.viewProductByProductCode = async (req) => {
  const { productModel } = conn.product(process.env.db);
  try {
    let res = {};
    let CODE = req.body.code.split(`${process.env.branchId}PROD`);
    let productExist = await productModel.findOne({
      code: CODE[1],
      branchId: process.env.branchId,
    });
    if (productExist) {
      let category = await this.viewProductCategorySingle(
        productExist.category
      );
      productExist._doc["productcode"] =
        productExist.branchId + `PROD` + productExist.code; //edited on 18-04-22
      productExist._doc["categoryName"] = category
        ? category.data.categoryName
        : null;

      res = { data: productExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 12-04-22
//edited on 17-06-22
//assembled on 15-07-22
module.exports.addProductToBranch = async (req) => {
  const { productModel } = conn.product(process.env.db);
  const{logModel}=conn.settings(req.decode.db)
  try {
    let res = {};
    let product = await productModel.findOne({
      productName: req.productName,
      branchId: req.branchId,
    });
    if (product) {
      // console.log(req);
      product.stock = product.stock + req.stock;
      let data = await product.save();
      if (data) {
        let lg = {
          type: LOG.PUR_ADDORUPDATEPRODUCTINABRANCH,
          emp_id: req.decode ? req.decode._id : null, //changed on 15-06-22 -> line changed to avoid errors when _id is missing,
          description: "update stock in branch",
          link: {
            url: null,
            api: null,
          },
        };
        await settings_service.addLog(lg);
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      let PRODNO = 0;
      // let PRODLIST = await productModel.aggregate([
      //   {
      //     $sort: { code: -1 },
      //   },
      // ]); //added orderId creation based on latest order on 02-02-22
      // if (PRODLIST.length > 0) {
      //   PRODNO = PRODLIST[0].code + 1;
      // } else {
      //   PRODNO = 1;
      // }
      /*edited on 17-06-22 */
      let PRODLIST = await productModel.find({
        branchId: process.env.branchId,
      });
      if (PRODLIST.length > 0) {
        PRODNO = PRODLIST[PRODLIST.length - 1].code + 1;
      } else {
        PRODNO = 1;
      }
      /*ends here */
      let newproduct = new productModel({
        code: PRODNO,
        category: req.category,
        productName: req.productName,
        unit: req.unit,
        imageUrl: req.imageUrl,
        status: true,
        stock: req.stock,
        branchId: req.branchId,
      });
      let data = await newproduct.save();
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
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 14-05-2022
module.exports.stockReport = async (req) => {
  const { productModel } = conn.product(process.env.db);
  let res = {},
    arr = [],
    brr = [],
    crr = [];
  try {
    let data = await productModel.find({});
    if (data) {
      for (let i = 0; i < data.length; i++) {
        let stock = {
          _id: data[i]._id,
          productName: data[i].productName,
          quantity: data[i].stock,
        };
        arr.push(stock);
      }
      return (res = { data: arr, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.stockReportProductFilter = async (req) => {
  const { productModel } = conn.product(process.env.db);
  let res = {},
    arr = [];
  try {
    let data = await productModel.find({});
    if (data) {
      for (let i = 0; i < data.length; i++) {
        if (req.query.productName.toLowerCase() == data[i].productName) {
          let stock = {
            _id: data[i]._id,
            productName: data[i].productName,
            quantity: data[i].stock,
          };
          arr.push(stock);
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

//added on 24-06-23
module.exports.addUnit = async (req) => {
  const { unitModel } = conn.product(req.decode.db);
  try {
    let unitExist = await unitModel.findOne({ unitName: req.body.unitName });
    if (!common_service.checkObject(unitExist)) {
      let newunit = await unitModel({
        unitName: req.body.unitName,
        status: true,
      });
      let data = await newunit.save();
      if (common_service.checkObject(data)) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      if (unitExist.status == false) {
        let data = await unitModel.findOneAndUpdate(
          { _id: unitExist._id },
          { $set: { status: true } },
          { new: true }
        );
        if (common_service.checkObject(data)) {
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = { data: unitExist, status: STATUSCODES.CONFLICT };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 24-06-23
module.exports.viewUnit = async (req) => {
  const { unitModel } = conn.product(req.decode.db);
  try {
    let unitList = await unitModel.find({ status: true });
    return (res = { data: unitList, status: STATUSCODES.SUCCESS });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//#endregion
