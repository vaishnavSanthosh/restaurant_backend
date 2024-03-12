/** @format */

//#region header
const express = require("express");
const dep_service = require("../Routes/DepartmentRoutes.js");
const { STATUSCODES } = require("../Model/enums.js");
const { checkToken } = require("../Routes/commonRoutes.js");
//#endregion

//#region variable
const dep_router = express.Router();
//#endregion

//#region method
//major change added on 28-02-22 to all methods : autentication middleware
dep_router.post("/", checkToken, async (req, res) => {
  try {
      let result = await dep_service.createDepartment(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});


dep_router.post("/view", checkToken, async (req, res) => {

  try {
      let result = await dep_service.getAllDepartments(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dep_router.post("/singleDepartmentbyId", checkToken, async (req, res) => {
  try {
      let result = await dep_service.getSingleDepartment(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 12/06/23 changed get to post
dep_router.post("/edit", checkToken, async (req, res) => {
  try {
      let result = await dep_service.editDepartment(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

dep_router.delete("/deleteDepartment", checkToken, async (req, res) => {
  try {
      let result = await dep_service.deleteDepartment(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = dep_router;
//#endregion
