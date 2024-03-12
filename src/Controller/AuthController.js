//created on 08-02-19
//#region header
const adminService = require("../Routes/AuthRoutes.js");
const express = require("express");
// const regService = require("../Routes/RegistrationRoutes.js");
const {
  checkToken,
  createDirectory,
  generateUuid,
  prescisedateconvert,
} = require("../Routes/commonRoutes.js");
const { STATUSCODES } = require("../Model/enums.js");
const locationService = require("../Routes/LocationRoute.js");
//#endregion

//#region variables
const authrouter = express.Router();
//#endregion

//#region methods
authrouter.post("/", async (req, res) => {
  try {
    let result = await adminService.signUp(req);
    res.status(result.status).send(result);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

authrouter.post("/login", async (req, res) => {
  try {
    let result = await adminService.login(req);
    res.status(result.status).send(result);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 05-04-22
//edited on 06-04-22
authrouter.post("/searchuser", async (req, res) => {
  try {
    let result = await adminService.searchUserName(req);
    res.status(result.status).send(result.data); //edited on 06-04-22 json type return added while sending data
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 05-04-22
authrouter.put("/editprofile", checkToken, async (req, res) => {
  try {
    if (req.settings.dashboard) {
      let result = await adminService.editProfile(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "ACTION FORBIDDEN" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 06-04-22
authrouter.post("/addlocation", checkToken, async (req, res) => {
  try {
    if (req.settings.settings) {
      let result = await locationService.addLocation(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "ACTION FORBIDDEN" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 06-04-22
authrouter.post("/addbranch", checkToken, async (req, res) => {
  try {
    if (req.settings.settings) {
      let result = await locationService.addBranch(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "ACTION FORBIDDEN" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 06-04-22
//edited on 11-04-22-> method converted to post
authrouter.post("/locations", checkToken, async (req, res) => {
  try {
    // if (req.settings.settings) {
    let result = await locationService.viewLocations(req);
    res.status(result.status).send(result.data);
    // } else {
    //   res.status(STATUSCODES.FORBIDDEN).send({ data: "ACTION FORBIDDEN" });
    // }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 06-04-22
//edited on 11-04-22-> method converted to post
authrouter.post("/branches", checkToken, async (req, res) => {
  try {
    // if (req.settings.settings) {
    let result = await locationService.viewBranches(req);
    res.status(result.status).send(result.data);
    // } else {
    //   res.status(STATUSCODES.FORBIDDEN).send({ data: "ACTION FORBIDDEN" });
    // }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 10-04-22
authrouter.post("/sendotp", async (req, res) => {
  try {
    let result = await adminService.sendOtp(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 10-04-22
authrouter.post("/verifyotp", async (req, res) => {
  try {
    let result = await adminService.verifyotp(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-06-22
authrouter.put("/adddiscount", checkToken, async (req, res) => {
  try {
    if (req.settings.settings) {
      let result = await adminService.addDiscount(req);
      res.status(result.status).send(result.data);
    } else {
      req.status(STATUSCODES.FORBIDDEN).send({ data: "ACCESS FORBIDDEN" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-06-22
//added and assembled on 14-07-22
authrouter.post("/fetchdiscount", checkToken, async (req, res) => {
  try {
    let result = await adminService.fetchDiscount(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-06-22
//added and assembled on 14-07-22
authrouter.post("/addupidetails", checkToken, async (req, res) => {
  try {
    if (req.settings.settings) {
      let result = await adminService.addUpiDetails(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "ACCESS FORBIDDEN" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-06-22
//added and assembled on 14-07-22
authrouter.post("/viewupidetails", checkToken, async (req, res) => {
  try {
    let result = await adminService.viewUpiDetails(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 25-06-22
//changed on 26-06-22  -> changed post to put
//added and assembled on 14-07-22
authrouter.put("/viewprofile", checkToken, async (req, res) => {
  try {
    if (req.settings.settings) {
      let result = await adminService.profile(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "FORBIDDEN ACCESS" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 12-07-22
//added and assembled on 14-07-22
authrouter.post("/viewmaxdiscount", async (req, res) => {
  try {
    if (req.headers.authorization) {
      let decode = JSON.parse(atob(req.headers.authorization.split(".")[1]));
      if (decode && decode.role) {
        process.env.admin = decode.admin;
      }
    }
    let result = await adminService.viewMaxDiscount();
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 12-07-22
//added and assembled on 14-07-22
authrouter.delete("/deleteupidetails", checkToken, async (req, res) => {
  try {
    if (req.settings.settings) {
      let result = await adminService.deleteUpi(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "FORBIDDEN ACCESS" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-07-22
authrouter.put("/updatepassword", checkToken, async (req, res) => {
  try {
    if (req.settings.settings) {
      let result = await adminService.updatePassword(req);
      res.status(result.status).send(result.data);
    } else {
      res.status(STATUSCODES.FORBIDDEN).send({ data: "FORBIDDEN ACCESS" });
    }
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-07-22
authrouter.post("/authsendotp", checkToken, async (req, res) => {
  try {
    let result = await adminService.sendOtp(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 23-07-22
authrouter.post("/authverifyotp", checkToken, async (req, res) => {
  try {
    let result = await adminService.verifyotp(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

authrouter.post("/generatebarcode", checkToken, async (req, res) => {
  try {
    await createDirectory(`./public/${req.decode.db}/BarcodeSample`);
    res.status(STATUSCODES.SUCCESS).send(__dirname);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 20-07-2023
authrouter.post("/verifypassword", checkToken, async (req, res) => {
  try {
    let result = await adminService.verifyPassword(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 21-07-23
authrouter.get("/generateuuid", async (req, res) => {
  try {
    let result = generateUuid();
    res.status(STATUSCODES.SUCCESS).send({ data: result });
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 24-07-2023
authrouter.post("/dateconvert", async (req, res) => {
  try {
    let result = await prescisedateconvert(req.body.date);
    res.status(200).send({ data: result });
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});

//added on 05-09-23
authrouter.post("/updateExpiry", async (req, res) => {
  try {
    result = await adminService.setExpiryDate(req);
    res.status(result.status).send(result.data); //edited on 06-04-22 json type return added while sending data
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e });
  }
});
//#endregion

//#region exports
module.exports = authrouter;
//#endregion
