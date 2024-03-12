//#region header
const express = require("express");
const cus_service = require("../Routes/customerRoute.js");
const { STATUSCODES } = require("../Model/enums.js");
const { checkToken } = require("../Routes/commonRoutes.js");
const paymentService = require("../Routes/PaymentRoutes.js");
//#endregion

//#region variable
const customerRouter = express.Router();
//#endregion

//#region method
//added on 14/4/2022
//Add customer
customerRouter.post("/addCustomer", checkToken, async (req, res) => {
  try {
    let result = await cus_service.addCustomer(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

customerRouter.post("/addRelationship", checkToken, async (req, res) => {
  try {
    let result = await cus_service.addRelationship(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//get all Active customers
customerRouter.post("/getAllActiveCustomers", checkToken, async (req, res) => {
  try {
    let result = await cus_service.getAllActiveCustomers(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

//get all customers
customerRouter.post("/getAllCustomers", checkToken, async (req, res) => {
  try {
    let result = await cus_service.getAllCustomers(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

//get all customers
customerRouter.post("/getSingleCustomer", checkToken, async (req, res) => {
  try {
    let result = await cus_service.getSingleCustomer(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

customerRouter.post("/generateCustomerId", checkToken, async (req, res) => {
  try {
    let result = await cus_service.generateCustomerId(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

customerRouter.post("/generateRelationId", checkToken, async (req, res) => {
  try {
    let result = await cus_service.generateRelationId(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

//get all Active relationships
customerRouter.post(
  "/getAllActiveRelationships",
  checkToken,
  async (req, res) => {
    try {
      let result = await cus_service.getAllActiveRelationships(req);
      res.status(result.status).send(result.data);
    } catch (error) {
      res.status(STATUSCODES.ERROR).json({ message: error.message });
    }
  }
);

customerRouter.post(
  "/getRelationshipOfCustomer",
  checkToken,
  async (req, res) => {
    try {
      let result = await cus_service.getRelationshipOfCustomer(req);
      res.status(result.status).send(result.data);
    } catch (error) {
      res.status(STATUSCODES.ERROR).json({ message: error.message });
    }
  }
);

//get all Active relationships
customerRouter.post("/getAllRelationships", checkToken, async (req, res) => {
  try {
    let result = await cus_service.getAllRelationships(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

//get single relationship
customerRouter.post("/getSingleRelationship", checkToken, async (req, res) => {
  try {
    let result = await cus_service.getSingleRelationship(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

//delete a customer
customerRouter.delete("/deleteCustomer/:id", checkToken, async (req, res) => {
  try {
    let result = await cus_service.deleteCustomer(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

//delete a customer
//edited on 02-06-22 -> changed url of this method
customerRouter.delete("/deleteRelationship/", checkToken, async (req, res) => {
  try {
    let result = await cus_service.deleteRelationship(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

//edit a customer
customerRouter.put("/editCustomer", checkToken, async (req, res) => {
  try {
    let result = await cus_service.editCustomer(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

//edit a customer
customerRouter.put("/editRelationship", checkToken, async (req, res) => {
  try {
    let result = await cus_service.editRelationship(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

//added on 30-04-22
//edited on 26-06-23
customerRouter.put("/edit/points", checkToken, async (req, res) => {
  try {
    let result = await cus_service.addRewardPoints(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 05-04-2022
customerRouter.post("/findCustomerOrders", checkToken, async (req, res) => {
  try {
    let result = await cus_service.findCustomerOrders(req);
    res.status(result.status).send(result.data);
  } catch (error) {
    res.status(STATUSCODES.ERROR).json({ message: error.message });
  }
});

customerRouter.post("/addwallet", checkToken, async (req, res) => {
  try {
    let walletData = {
      cus_id: req.body.cus_id,
      branchId: req.body.branchId,
      decode: {
        adminId: req.decode.adminId,
        db: req.decode.db,
      },
      credit: req.body.credit ? req.body.credit : null,
      debit: req.body.debit ? req.body.debit : null,
    };
    let result = await cus_service.addwallet(walletData);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

customerRouter.post("/getCustomerPoints", checkToken, async (req, res) => {
  try {
    let result = await cus_service.viewRewardPointsOfACustomer(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 14-07-22
customerRouter.post("/getCustomerDetails", checkToken, async (req, res) => {
  try {
    let result = await cus_service.customerSingleView(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 14-07-22
customerRouter.post(
  "/viewCustomerOrdersByStatus",
  checkToken,
  async (req, res) => {
    try {
      let result = await cus_service.viewCustomerOrdersByStatus(req);
      res.status(result.status).send(result.data);
    } catch (e) {
      res.status(STATUSCODES.ERROR).send({ data: e.message });
    }
  }
);

//added on 23-07-22
customerRouter.post("/viewwallet", checkToken, async (req, res) => {
  try {
    let result = await paymentService.viewWallet(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 04-07-23
customerRouter.get("/getCustomerByPhone", checkToken, async (req, res) => {
  try {
    let result = await cus_service.getCustomerByPhone(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 05-07-2023
customerRouter.post("/validateCustomer", checkToken, async (req, res) => {
  try {
    result = await cus_service.validityCustomer(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 05-07-2023
customerRouter.post("/validaterelation", checkToken, async (req, res) => {
  try {
    result = await cus_service.validityrelation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.massage });
  }
});

//added on 12-07-23
customerRouter.post("/viewCustomerwithfilter", checkToken, async (req, res) => {
  try {
    result = await cus_service.viewcustomerwithfilter(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

customerRouter.post("/viewcustomerwallet", checkToken, async (req, res) => {
  try {
    result = await cus_service.viewWalletofaCustomer(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = customerRouter;
//#endregion
