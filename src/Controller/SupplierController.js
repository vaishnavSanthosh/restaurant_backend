//#region headers
const express = require("express");
const { STATUSCODES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes");
const supp_service = require("../Routes/SupplierRoutes.js");
//#endregion

//#region variables
const supp_router = express.Router();
//#endregion

//#region methods
//major change added on 28-02-22 to all methods : autentication middleware
supp_router.post("/", checkToken, async (req, res) => {
  try {
    let result = await supp_service.addSupplier(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

supp_router.post("/getSupplier", checkToken, async (req, res) => {
  try {
    let result = await supp_service.viewSupplier(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 12-06-23 changed from get to post
supp_router.post("/viewSuppliersingle", checkToken, async (req, res) => {
  try {
    let result = await supp_service.viewSupplierSingle(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 24-03-22 endpoint changed to avoid routing problem
supp_router.put("/edit", checkToken, async (req, res) => {
  try {
    let result = await supp_service.editSupplier(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 24-03-22 endpoint changed to avoid routing problem
supp_router.delete("/delete", checkToken, async (req, res) => {
  try {
    let result = await supp_service.deleteSupplier(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 24-03-22
supp_router.post("/ledger", checkToken, async (req, res) => {
  try {
    let result = await supp_service.supplierLedger(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 21-06-23
supp_router.post("/addcreditLimit", checkToken, async (req, res) => {
  try {
    let result = await supp_service.addcreditLimit(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 16-09-22
supp_router.post("/viewcreditLimit", checkToken, async (req, res) => {
  try {
    let result = await supp_service.viewcreditLimit(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

// added on 17-09-22
supp_router.put("/editcreditLimit", checkToken, async (req, res) => {
  try {
    let result = await supp_service.editcreditLimit(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = supp_router;
//#endregion
