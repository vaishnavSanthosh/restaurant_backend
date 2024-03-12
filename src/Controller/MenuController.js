//#region headers
const menu_service = require("../Routes/MenuRoutes.js");
const express = require("express");
const { STATUSCODES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes.js");
//#endregion

//#region variables
const menu_router = express.Router();
//#endregion

//#region methods
//major change added on 28-02-22 to all methods : autentication middleware
menu_router.post("/", checkToken, async (req, res) => {
  try {
    let result = await menu_service.addMenu(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

menu_router.get("/", checkToken, async (req, res) => {
  try {
      let result = await menu_service.viewMenus();
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

menu_router.get("/:id", checkToken, async (req, res) => {
  try {
      let result = await menu_service.viewMenubyId(req.params.id);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

menu_router.put("/editMenu", checkToken, async (req, res) => {
  try {
      let result = await menu_service.editMenu(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

menu_router.delete("/:id", checkToken, async (req, res) => {
  try {
      let result = await menu_service.deleteMenu(req.params.id);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = menu_router;
//#endregion
