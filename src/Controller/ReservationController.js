//#region headers
const res_service = require("../Routes/ReservationRoutes.js");
const express = require("express");
const { STATUSCODES } = require("../Model/enums");
const { checkToken } = require("../Routes/commonRoutes.js");
//#endregion

//#region variables
const res_router = express.Router();
//#endregion

//#region methods
//major change added on 28-02-22 to all methods : autentication middleware
//edited on 26-06-23
res_router.post("/addReservation", checkToken, async (req, res) => {
  try {
    let result = await res_service.addReservation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//edited on 26-06-23
res_router.post("/viewReservations", checkToken, async (req, res) => {
  try {
    let result = await res_service.viewReservations(req); //edited on 08-08-22 -> passed request into this method
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 25-01-22
//edited on 26-06-23
res_router.post("/viewReservationSingle", checkToken, async (req, res) => {
  try {
    let result = await res_service.viewReservationSingle(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 25-01-22
//edited on 26/06/23
res_router.put("/editReservation", checkToken, async (req, res) => {
  try {
    let result = await res_service.editReservation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 25-01-22
//edited on 26-06-23
res_router.delete("/deleteReservation", checkToken, async (req, res) => {
  try {
    let result = await res_service.deleteReservation(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 26-06-23
res_router.post("/settings", checkToken, async (req, res) => {
  try {
    let result = await res_service.addSettings(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//edited on 26-06-23
res_router.post("/viewsettings", checkToken, async (req, res) => {
  try {
    let result = await res_service.viewSettings(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    console.error(e);
    res = { data: e, status: STATUSCODES.ERROR };
    return res;
  }
});

//added on 29-01-22
res_router.post("/seating", checkToken, async (req, res) => {
  try {
    let result = await res_service.addSeating(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 29-01-22
res_router.post("/viewseating", checkToken, async (req, res) => {
  try {
    let result = await res_service.viewSeating(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 29-04-22
res_router.post("/uploadFloorPlan", checkToken, async (req, res) => {
  try {
    let result = await res_service.uploadFloorPlan(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 02-07-22
res_router.put("/disableseat", checkToken, async (req, res) => {
  try {
    let result = await res_service.disableSeating(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});

//added on 07-07-2023
res_router.post("/viewsingleseating", checkToken, async (req, res) => {
  try {
    let result = await res_service.viewSeatingById(req);
    res.status(result.status).send(result.data);
  } catch (e) {
    res.status(STATUSCODES.ERROR).send({ data: e.message });
  }
});
//#endregion

//#region exports
module.exports = res_router;
//#endregion
