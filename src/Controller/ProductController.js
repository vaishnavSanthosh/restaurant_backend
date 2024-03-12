//created on 07-02-2022
//#region  headers
const productService = require("../Routes/ProductRoutes.js");
const express = require("express");
const { STATUSCODES } = require("../Model/enums.js");
const { checkToken } = require("../Routes/commonRoutes.js");
//#endregion

//#region variables
const productRouter = express.Router();
//#endregion

//#region methods
productRouter.post("/", checkToken, async (req, res) => {
  try {
    let result = await productService.addProduct(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

productRouter.post("/viewproduct", checkToken, async (req, res) => {
  try {
    let result = await productService.viewProducts(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 08-02-2022
productRouter.post("/viewsingleproduct", checkToken, async (req, res) => {
  try {
    let result = await productService.viewProductSingle(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 08-02-2022
productRouter.put("/edit", checkToken, async (req, res) => {
  try {
      let result = await productService.editProducts(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 08-02-2022
productRouter.delete("/delete/", checkToken, async (req, res) => {
  try {
      let result = await productService.deleteProducts(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 24-03-22
//edited on 12-04-22
productRouter.get("/generateid", checkToken, async (req, res) => {
  try {
    //edited on 12-04-22 -> added settings block
      let result = await productService.generateProdId(req);
      res.status(STATUSCODES.SUCCESS).send({ url: result });
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 12-04-22
productRouter.post("/getproductbycode", checkToken, async (req, res) => {
  try {
      let result = await productService.viewProductByProductCode(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 14-05-2022
productRouter.get("/stockReport", checkToken, async (req, res) => {
  try {
      let result = await productService.stockReport(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

productRouter.get("/stockReportProductFilter", checkToken, async (req, res) => {
  try {
      let result = await productService.stockReportProductFilter(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 24-06-23
productRouter.post("/addunit", checkToken, async (req, res) => {
  try {
      let result = await productService.addUnit(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 24-06-23
productRouter.post("/addunit", checkToken, async (req, res) => {
  try {
      let result = await productService.addUnit(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 24-06-23
productRouter.get("/viewunit", checkToken, async (req, res) => {
  try {
      let result = await productService.viewUnit(req);
      res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = productRouter;
//#endregion
