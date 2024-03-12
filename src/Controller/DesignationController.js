//#region header
const designation_Service = require("../Routes/DesignationRoute.js");
const express = require("express");
const { STATUSCODES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes.js");
//#endregion

//#region variables
const designationRouter = express.Router();
//#endregion

//#region methods
//major change added on 28-02-22 to all methods : autentication middleware
designationRouter.post("/", checkToken, async (req, res) => {
  try {
    let result = await designation_Service.createDesignation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

designationRouter.get("/", checkToken, async (req, res) => {
  try {
    let result = await designation_Service.getAllDesignations(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 12/06/23
designationRouter.post("/getDesignationById", checkToken, async (req, res) => {
  try {
    let result = await designation_Service.getDesignationById(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 12/06/23
designationRouter.put(
  "/updateDesignationbyId",
  checkToken,
  async (req, res) => {
    try {
      let result = await designation_Service.updateDesignation(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

// edited on 12/06/23
designationRouter.delete("/deleteDesignation", checkToken, async (req, res) => {
  try {
    let result = await designation_Service.deleteDesignation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//added on 19-06-23

designationRouter.post(
  "/getDesignationsByDepartment",
  checkToken,
  async (req, res) => {
    try {
      result = await designation_Service.getDesignationsByDepartment(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);
//#endregion

//#region exports
module.exports = designationRouter;
//#endregion
