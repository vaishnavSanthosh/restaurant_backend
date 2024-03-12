//#region header
const { STATUSCODES } = require("../Model/enums");
const category_service = require("../Routes/CategoryRoute.js");
const express = require("express");
const { checkToken } = require("../Routes/commonRoutes");
//#endregion

//#region variables
const cat_router = express.Router();
//#endregion

//#region methods
//major change added on 28-02-22 to all methods : authentication middleware
cat_router.post("/", checkToken, async (req, res) => {
  try {
    let result = await category_service.addCategory(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 18-04-22 -> endpoint modified to prevent native endpoint errors
cat_router.post("/view", checkToken, async (req, res) => {
  try {
    let result = await category_service.viewCategories(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 18-04-22 -> endpoint modified to prevent native endpoint errors
cat_router.post("/viewbyid", checkToken, async (req, res) => {
  try {
    let result = await category_service.viewCategoryById(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 18-04-22 -> endpoint modified to prevent native endpoint errors
cat_router.put("/edit", checkToken, async (req, res) => {
  try {
    let result = await category_service.editCategory(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 18-04-22 -> endpoint modified to prevent native endpoint errors
//edited on 27/07/23
cat_router.delete("/delete", checkToken, async (req, res) => {
  try {
    let result = await category_service.deleteCategory(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 18-04-22
cat_router.post("/subcategory/add", checkToken, async (req, res) => {
  try {
    let result = await category_service.addsubcategorymain(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 18-04-22
cat_router.post("/subcategory", checkToken, async (req, res) => {
  try {
    let result = await category_service.viewAllActiveSubcategory(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 18-04-22
cat_router.post("/subcategory/view/", checkToken, async (req, res) => {
  try {
    let result = await category_service.viewSubCategorySingle(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 18-04-22
//edited on 27/07/23
cat_router.put("/subcategory/edit/", checkToken, async (req, res) => {
  try {
    let result = await category_service.editSubcategory(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 18-04-22
cat_router.delete("/subcategory/delete/", checkToken, async (req, res) => {
  try {
    let result = await category_service.deleteSubCategory(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 18-04-22
cat_router.post("/subcategory/viewall", checkToken, async (req, res) => {
  try {
    let result = await category_service.viewAllSubcategory(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 04-05-22
cat_router.post("/subcategoryfilter", checkToken, async (req, res) => {
  try {
    let result = await category_service.viewAllSubcategoryByCategory(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 02-06-22
cat_router.post("/filtercategorybytype", checkToken, async (req, res) => {
  try {
    let result = await category_service.filtercategorybytype(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 28-07-22
cat_router.delete("/removesubcategory", checkToken, async (req, res) => {
  try {
    let result = await category_service.removeSubCategory(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 28-07-22
cat_router.delete("/removecategory", checkToken, async (req, res) => {
  try {
    let result = await category_service.removeCategory(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = cat_router;
//#endregion
