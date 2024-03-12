/** @format */

//#region headers
//edited to impliment dynamic db
const { STATUSCODES, LOG, API, URL, ROLES } = require("../Model/enums");
const fs = require("fs");
require("dotenv").config({ path: "./.env" });
const settings_service = require("./settingsRoutes");
const conn = require("../../userDbConn");
const {
  isEmpty,
  createDirectory,
  checkObject,
} = require("../Routes/commonRoutes");
//#endregion

//#region methods
//edited on 08-06-2022 to add log
//edited on 21-04-22
//edited on 01-06-22
module.exports.addCategory = async (req) => {
  const { categoryModel } = conn.category(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let IMAGEURL = "";
    if (req.files) {
      await createDirectory(`./public/${req.decode.db}/Category`);
      req.files.file.mv(
        `./public/${req.decode.db}/Category/${req.body.categoryName.replace(
          /\s+/g,
          ""
        )}-` + req.files.file.name.replace(/\s+/g, "")
      );
      IMAGEURL =
        `Images/${req.decode.db}/Category/${req.body.categoryName.replace(
          /\s+/g,
          ""
        )}-` + req.files.file.name.replace(/\s+/g, ""); //manipulated on 01-06-22 -> removed field FILEURL GLOBAL VARIABLE from this section
    }
    const categoryExist = await categoryModel.findOne({
      categoryName: req.body.categoryName,
      branchId: req.body.branchId,
    });
    if (!checkObject(categoryExist)) {
      let category = new categoryModel({
        categoryName: req.body.categoryName,
        type: req.body.type,
        imageUrl: IMAGEURL,
        branchId: req.body.branchId,
        status: true,
        isFoodCat: req.body.isFoodCat,
      });
      let data = await category.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    } else {
      if (categoryExist.status == false) {
        if (req.files) {
          if (categoryExist.imageUrl != null && categoryExist.imageUrl != "") {
            let remvArr = categoryExist.imageUrl.split("Images/")[1];
            fs.unlink(`public/` + remvArr, (err) => {
              if (err) console.log(err);
            });
          }
          req.files.file.mv(
            `./public/${
              req.decode.db
            }/Category/${categoryExist.categoryName.replace(/\s+/g, "")}-` +
              req.files.file.name.replace(/\s+/g, "")
          );
          categoryExist.imageUrl =
            `Images/${
              req.decode.db
            }/Category/${categoryExist.categoryName.replace(/\s+/g, "")}-` +
            req.files.file.name.replace(/\s+/g, "");
        }
        categoryExist.status = true;
        let data = await categoryExist.save();
        if (data) {
          let newLog = new logModel({
            date: new Date().getTime(),
            emp_id: req.decode._id,
            type: LOG.PURCHASE_CATEGORY_ADD.type,
            description: LOG.PURCHASE_CATEGORY_ADD.description,
            branchId: data.branchId,
            link: {},
            payload: { token: req.headers.authorization, body: req.body },
          });
          let logresponse = await newLog.save();
          if (logresponse == null) {
            console.log("log save failed");
          }
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = {
          data: { msg: `duplicate category ` },
          status: STATUSCODES.EXIST,
        };
      }
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//edited on 05-03-22
module.exports.viewCategories = async (req) => {
  const { categoryModel } = conn.category(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let res = {};
    let categories_exist = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        categories_exist = await categoryModel
          .find({
            status: true,
            isFoodCat: req.body.isFoodCat,
            branchId: req.body.branchId,
          })
          .skip(req.body.index)
          .limit(30);
      } else {
        categories_exist = await categoryModel
          .find({
            status: true,
            isFoodCat: req.body.isFoodCat,
          })
          .skip(req.body.index)
          .limit(30);
      }
    } else
      categories_exist = await categoryModel
        .find({
          status: true,
          branchId: req.body.branchId,
          isFoodCat: req.body.isFoodCat,
        })
        .skip(req.body.index)
        .limit(30);
    if (categories_exist.length > 0) {
      for (let i = 0; i < categories_exist.length; i++) {
        const element = categories_exist[i];
        element.imageUrl = `${process.env.FILEURL}${element.imageUrl}`; //added on 02-06-22 -> appended fileserver path with url
        element._doc["TYPE"] = element.type == true ? "Veg" : "Non Veg";
      }
      res = { data: categories_exist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 08-03-22 // input parameter changed
module.exports.viewCategoryById = async (req) => {
  const { categoryModel } = conn.category(req.decode.db);
  try {
    let res = {};
    let category_exist = await categoryModel.findOne({
      _id: req.body._id,
    });
    if (category_exist) {
      let rmvArr = category_exist.imageUrl.split("Images/")[1];
      category_exist.imageUrl = process.env.FILEURL + "public/" + rmvArr; //added on 02-06-22-> appended fileserver path with uri
      res = { data: category_exist, status: STATUSCODES.SUCCESS };
    } else {
      res = {
        data: { msg: `Category not Found` },
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 01-02-22
//edited on 04-08-22
module.exports.editCategory = async (req) => {
  const { categoryModel } = conn.category(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let IMAGEURL = "";
    let category_exist = await categoryModel.findOne({
      _id: req.body.id,
      // status: true,
      // branchId: process.env.branchId, //added on 04-03-22//edited on 18-04-22-> unique id is enough as paramter
    }); //edited on 01-02-22
    if (category_exist) {
      if (req.files) {
        await createDirectory(`./public/${req.decode.db}/Category`);
        let remvArr = category_exist.imageUrl.split("Images/")[1];
        fs.unlink(`public/` + remvArr, (err) => {
          if (err) console.log(err);
        });
        req.files.file.mv(
          `./public/${req.decode.db}/Category/${req.body.categoryName.replace(
            /\s+/g,
            ""
          )}-` + req.files.file.name.replace(/\s+/g, "")
        );
        category_exist.imageUrl =
          `Images/${req.decode.db}/Category/${req.body.categoryName.replace(
            /\s+/g,
            ""
          )}-` + req.files.file.name.replace(/\s+/g, "");
      }
      category_exist.categoryName = !req.body.categoryName
        ? category_exist.categoryName
        : req.body.categoryName;
      category_exist.status = !req.body.status
        ? category_exist.status
        : req.body.status;
      category_exist.imageUrl =
        IMAGEURL == "" ? category_exist.imageUrl : IMAGEURL;
      category_exist.type = !req.body.type
        ? category_exist.type
        : req.body.type;
      category_exist.isFoodCat = !req.body.isFoodCat
        ? category_exist.isFoodCat
        : req.body.isFoodCat;
      let data = await category_exist.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.PURCHASE_CATEGORY_ADD.type,
          description: LOG.PURCHASE_CATEGORY_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        data.imageUrl = process.env.FILEURL + data.imageUrl;
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

//edited on 01-02-22 delete method modified to hide data insted of removing
module.exports.deleteCategory = async (req) => {
  const { categoryModel } = conn.category(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let category_exist = await categoryModel.findOne({
      _id: req.body._id,
      // status: true,
      // branchId: process.env.branchId, //added on 04-03-22//edited on 18-04-22 -> unique id is enough as parameter
    }); //edited on 01-02-22
    if (category_exist) {
      // let remvArr = category_exist.imageUrl.split(process.env.SPLITURL);
      // fs.unlink(`public/` + remvArr[1],(err)=>{
      //   if (err) console.log(err);
      // });
      category_exist.status = false; //added on 01-02-22
      // let data = await categoryModel.deleteOne({
      //   _id: req,
      // });
      let data = await category_exist.save(); //modified from delete from table to keep in table
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.PURCHASE_CATEGORY_ADD.type,
          description: LOG.PURCHASE_CATEGORY_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save failed");
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

//added on 05-03-22-> sub function
module.exports.viewAllCategories = async () => {
  const { categoryModel } = conn.category(process.env.db);
  try {
    let res = {};
    let categories_exist = await categoryModel.find({
      // branchId: process.env.branchId, //added on 04-03-22
    });
    if (categories_exist.length > 0) {
      res = { data: categories_exist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 18-04-22
//edited on 20-06-22
module.exports.addsubcategorymain = async (req) => {
  const { subcategoryModel, categoryModel } = conn.category(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let subcategoryExist = await subcategoryModel.findOne({
      categoryId: req.body.categoryId,
      subcategoryName: req.body.subcategoryName,
      // branchId: process.env.branchId,
    });

    if (subcategoryExist) {
      //modified on 21-04-22 -> modified to avoid redundency and to bring back deleted subcategories
      if (subcategoryExist.status == false) {
        if (req.files) {
          if (
            subcategoryExist.imageUrl != "" &&
            subcategoryExist.imageUrl != null
          ) {
            // let remvArr = subcategoryExist.imageUrl.split(process.env.SPLITURL);
            fs.unlink(
              `public/${req.decode.db}/${subcategoryExist.imageUrl}`,
              (err) => {
                if (err) console.log(err);
              }
            );
          }
          req.files.file.mv(
            `./public/${req.decode.db}/Subcategory/${
              subcategoryExist.branchId
            }-${subcategoryExist.subcategoryName.replace(
              /\s+/g,
              ""
            )}-${req.files.file.name.replace(/\s+/g, "")}`
          );
          subcategoryExist.imageUrl = `Images/${req.decode.db}/Subcategory/${
            subcategoryExist.branchId
          }-${subcategoryExist.subcategoryName.replace(
            /\s+/g,
            ""
          )}-${req.files.file.name.replace(/\s+/g, "")}`; //added on 02-06-22 fileurl removed while saving
        }
        subcategoryExist.status = true;
        let data = await subcategoryExist.save();
        if (data) {
          //let categories_exist = await this.viewCategoryById(data.categoryId);
          let categories_exist = await categoryModel.findOne({
            _id: data.categoryId,
          });
          data._doc["categoryName"] = checkObject(categories_exist)
            ? categories_exist.categoryName
            : "No Category";
          data.imageUrl = null;
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = {
          data: { msg: "categoryId,subcategoryName,alreadyExist" },
          status: STATUSCODES.EXIST,
        };
      }
    } else {
      let newsubcategory = new subcategoryModel({
        categoryId: req.body.categoryId,
        subcategoryName: req.body.subcategoryName,
        status: true,
        branchId: req.body.branchId,
      });
      if (req.files) {
        await createDirectory(`./public/${req.decode.db}/Subcategory`);
        req.files.file.mv(
          `./public/${req.decode.db}/Subcategory/${
            newsubcategory.branchId
          }-${newsubcategory.subcategoryName.replace(
            /\s+/g,
            ""
          )}-${req.files.file.name.replace(/\s+/g, "")}`
        );
        newsubcategory.imageUrl = `Images/${req.decode.db}/Subcategory/${
          newsubcategory.branchId
        }-${newsubcategory.subcategoryName.replace(
          /\s+/g,
          ""
        )}-${req.files.file.name.replace(/\s+/g, "")}`; //added on 02-06-22 fileurl removed while saving
      } else {
        newsubcategory.imageUrl = null;
      }
      let data = await newsubcategory.save();

      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.PURCHASE_SUBCATEGORY_ADD.type,
          description: LOG.PURCHASE_SUBCATEGORY_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        // let categories_exist = await this.viewCategoryById(data.categoryId);
        let categories_exist = await categoryModel.findOne({
          _id: data.categoryId,
        });

        data._doc["categoryName"] = categories_exist
          ? categories_exist.categoryName
          : null;
        data.imageUrl =
          process.env.FILEURL + "public/" + data.imageUrl.split("Images/")[1]; //added on 02-06-22 -> fileurl appended to uri
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

//added on 18-04-22
//edited on 09-06-2022
module.exports.viewAllActiveSubcategory = async (req) => {
  const { subcategoryModel, categoryModel } = conn.category(req.decode.db);
  try {
    let res = {};
    let subcategoryExist = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId == null) {
        subcategoryExist = await subcategoryModel.find({
          status: true,
        });
      } else {
        subcategoryExist = await subcategoryModel.find({
          status: true,
          branchId: req.body.branchId,
        });
      }
    } else {
      subcategoryExist = await subcategoryModel.find({
        status: true,
        branchId: req.body.branchId,
      });
    }
    if (Array.isArray(subcategoryExist) && subcategoryExist.length > 0) {
      for (let i = 0; i < subcategoryExist.length; i++) {
        const element = subcategoryExist[i];
        if (element.categoryId != null && element.categoryId != "") {
          let categories = await categoryModel.findOne({
            _id: element.categoryId,
          });
          element._doc["categoryName"] = categories
            ? categories.categoryName
            : null;
        } else {
          element._doc["categoryName"] = null;
        }
        element.imageUrl = process.env.FILEURL + element.imageUrl; //added on 02-06-22 -> fileurl appended to uri
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

//added on 18-04-22
module.exports.viewAllSubcategory = async (req) => {
  const { subcategoryModel, categoryModel } = conn.category(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let res = {};
    let subcategoryExist = [];
    if (!req.decode.role == ROLES.ADMIN) {
      subcategoryExist = await subcategoryModel
        .find({
          branchId: req.body.branchId,
        })
        .skip(req.body.index)
        .limit(30);
    } else {
      subcategoryExist = await subcategoryModel
        .find({})
        .skip(req.body.index)
        .limit(30);
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
        element.imageUrl = process.env.FILEURL + element.imageUrl; //added on 02-06-22 fileurl removed while saving
      }
      res = { data: subcategoryExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: e, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 18-04-22
module.exports.viewSubCategorySingle = async (req) => {
  const { subcategoryModel, categoryModel } = conn.category(req.decode.db);
  try {
    let res = {};
    let subcategorySingle = await subcategoryModel.findOne({
      _id: req.body._id,
    });
    if (subcategorySingle) {
      let categories = await categoryModel.findOne({
        _id: subcategorySingle.categoryId,
      });
      subcategorySingle._doc["categoryName"] = categories
        ? categories.categoryName
        : null;
      subcategorySingle.imageUrl =
        process.env.FILEURL +
        "public/" +
        subcategorySingle.imageUrl.split("Images/")[1]; //added on 02-06-22 fileurl removed while saving
      res = { data: subcategorySingle, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 18-04-22
//edited on 20-04-22 ->
//edited on 27/07/23
module.exports.editSubcategory = async (req) => {
  const { subcategoryModel } = conn.category(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let subcategoryExist = await subcategoryModel.findOne({
      _id: req.body.id,
    });
    if (subcategoryExist) {
      subcategoryExist.categoryId = req.body.categoryId
        ? req.body.categoryId
        : subcategoryExist.subcategoryName;
      subcategoryExist.subcategoryName = req.body.subcategoryName
        ? req.body.subcategoryName
        : subcategoryExist.subcategoryName;
      subcategoryExist.status = req.body.status
        ? req.body.status
        : subcategoryExist.status;
      if (req.files) {
        //edited on 20-04-22 -> removed files key from if condition,added imageurl validation
        /*from here */
        if (
          subcategoryExist.imageUrl != null &&
          subcategoryExist.imageUrl != ""
        ) {
          // let remvArr = subcategoryExist.imageUrl.split(process.env.SPLITURL);
          fs.unlink(
            `public/` + subcategoryExist.imageUrl.split("Images/")[1],
            (err) => {
              //edited on 02-06-22 removed array initialisation from here
              if (err) console.log(err);
            }
          );
          req.files.file.mv(
            `./public/${req.decode.db}/Subcategory/${
              subcategoryExist.branchId
            }-${subcategoryExist.subcategoryName.replace(
              /\s+/g,
              ""
            )}-${req.files.file.name.replace(/\s+/g, "")}`
          );
          subcategoryExist.imageUrl = `Images/${req.decode.db}/Subcategory/${
            subcategoryExist.branchId
          }-${subcategoryExist.subcategoryName.replace(
            /\s+/g,
            ""
          )}-${req.files.file.name.replace(/\s+/g, "")}`; //added on 02-06-22 fileurl removed while saving
        } else {
          req.files.file.mv(
            `./public/${req.decode.db}/Subcategory/${
              subcategoryExist.branchId
            }-${subcategoryExist.subcategoryName.replace(
              /\s+/g,
              ""
            )}-${req.files.file.name.replace(/\s+/g, "")}`
          );
          subcategoryExist.imageUrl = `Images/${req.decode.db}/Subcategory/${
            subcategoryExist.branchId
          }-${subcategoryExist.subcategoryName.replace(
            /\s+/g,
            ""
          )}-${req.files.file.name.replace(/\s+/g, "")}`; //added on 02-06-22 fileurl removed while saving
        }
        /* to here */
      }
      let data = await subcategoryExist.save();

      if (data) {
        let newlog = new logModel({
          date: data.date,
          emp_id: req.decode._id,
          branchId: data.branchId,
          type: LOG.PURCHASE_SUBCATEGORY_ADD.type,
          description: LOG.PURCHASE_SUBCATEGORY_ADD.description,
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

//added on 18-04-22
module.exports.deleteSubCategory = async (req) => {
  const { subcategoryModel } = conn.category(req.decode.db);
  try {
    let res = {};
    let subcategoryExist = await subcategoryModel.findOne({
      _id: req.body.id,
    });
    if (subcategoryExist) {
      subcategoryExist.status = false;
      let data = await subcategoryExist.save();
      if (data) {
        let newlog = new logModel({
          date: data.date,
          emp_id: req.decode._id,
          branchId: data.branchId,
          type: LOG.PURCHASE_SUBCATEGORY_ADD.type,
          description: LOG.PURCHASE_SUBCATEGORY_ADD.description,
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
      res = { data: e, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 04-05-22
module.exports.viewAllSubcategoryByCategory = async (req) => {
  const { subcategoryModel, categoryModel } = conn.category(process.env.db);
  try {
    let res = {};
    let subcategorieslist = await subcategoryModel.find({
      categoryId: req.body.categoryId,
      status: true,
      branchId: req.body.branchId,
    });
    if (Array.isArray(subcategorieslist) && subcategorieslist.length > 0) {
      for (let i = 0; i < subcategorieslist.length; i++) {
        const element = subcategorieslist[i];
        let categories = await categoryModel.findOne({
          _id: element.categoryId,
        });
        element._doc["categoryName"] = categories
          ? categories.categoryName
          : null;
        element._doc["imageUrl"] = process.env.FILEURL + element.imageUrl;
      }
      res = { data: subcategorieslist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 02-06-22
module.exports.filtercategorybytype = async (req) => {
  const { categoryModel } = conn.category(req.decode.db);
  try {
    let categories_exist = await categoryModel.find({
      type: req.body.type,
      status: true,
      branchId: req.body.branchId,
      isFoodCat: req.body.isFoodCat,
    });
    if (Array.isArray(categories_exist) && categories_exist.length > 0) {
      for (let i = 0; i < categories_exist.length; i++) {
        const element = categories_exist[i];
        element.imageUrl = `${process.env.FILEURL}public/${
          element.imageUrl.split("Images/")[1]
        }`; //added on 02-06-22 -> appended fileserver path with url
        element._doc["TYPE"] = element.type == true ? "Veg" : "Non Veg";
      }
      res = { data: categories_exist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 28-07-22
module.exports.removeSubCategory = async (req) => {
  const { subcategoryModel } = conn.category(req.decode.db);
  try {
    let res = {};
    let subcatExist = await subcategoryModel.findOne({ _id: req.body._id });
    if (!isEmpty(subcatExist)) {
      if (subcatExist.imageUrl != "" && subcatExist.imageUrl != null) {
        fs.unlink(
          `public/` + subcatExist.imageUrl.split("Images/")[1],
          (err) => {
            if (err) console.log(err);
          }
        );
      }
      let data = await subcategoryModel.deleteOne({ _id: req.body._id });
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

//added on 28-07-22
module.exports.removeCategory = async (req) => {
  const { categoryModel } = conn.category(req.decode.db);
  try {
    let res = {};
    let catExist = await categoryModel.findOne({ _id: req.body._id });
    if (!isEmpty(catExist)) {
      if (catExist.imageUrl != "" && catExist.imageUrl != null) {
        fs.unlink(`public/` + catExist.imageUrl.split("Images/")[1], (err) => {
          if (err) console.log(err);
        });
      }
      let data = await categoryModel.deleteOne({ _id: req.body._id });
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
//#endregion
