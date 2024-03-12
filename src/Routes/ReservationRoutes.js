//#region header
const {
  STATUSCODES,
  LOG,
  API,
  URL,
  ROLES,
  SHIFTSTATUS,
} = require("../Model/enums.js");
const fs = require("fs");
const common_service = require("../Routes/commonRoutes.js");
const settings_service = require("../Routes/settingsRoutes.js");
const conn = require("../../userDbConn");
//#endregion

//#region methods
//edited on 14-03-22 reservationId added
//edited on 16-06-22
//edited on 26-06-23
module.exports.addReservation = async (req) => {
  const { reservationModel } = conn.reservation(req.decode.db);
  const { shiftModel, shiftLogModel, logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let RESRID = 0;
    let shiftExist = {};
    let shiftSettings = await shiftModel.findOne({
      branchId: req.body.branchId,
    });
    if (common_service.checkObject(shiftSettings)) {
      if (typeof shiftSettings.shiftType == "number") {
        if (shiftSettings.shiftType == 2) {
          shiftExist.shiftId = 0;
        } else {
          shiftExist = await shiftLogModel.findOne({
            status: SHIFTSTATUS.ACT,
            branchId: req.body.branchId,
          });
        }
      } else {
        return (res = {
          data: {
            msg: `no shift Settings Defined For branch ${req.body.branchId}`,
          },
          status: STATUSCODES.NOTFOUND,
        });
      }
    } else {
      return (res = {
        data: {
          msg: `no shift Settings Defined For branch ${req.body.branchId}`,
        },
        status: STATUSCODES.NOTFOUND,
      });
    }
    let reservationList = await reservationModel.find({
      branchId: req.body.branchId,
    });
    if (reservationList.length > 0) {
      RESRID = reservationList[reservationList.length - 1].reservationId + 1;
    } else {
      RESRID = 1;
    }
    let reservation = new reservationModel({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      contactNumber: req.body.contactNumber,
      date: new Date(req.body.date).getTime(),
      time: req.body.time,
      no_of_guest: req.body.no_of_guest,
      reservationType: req.body.reservationType,
      note: req.body.note,
      reservationId: RESRID, //added on 14-03-22
      branchId: req.body.branchId, //added on 09-06-22 initialised branchid
      shiftId: shiftExist.shiftId,
    });
    let data = await reservation.save();
    if (data) {
      let newlog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.RESERVATION_ADD.type,
        description: LOG.RESERVATION_ADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newlog.save();
      if (logresponse == null) {
        console.log("log save faild");
      }
      data._doc["date"] = common_service.prescisedateconvert(data.date);
      data._doc["reservationId"] = `BRANCHRES${data.reservationId}`; //added on 14-03-22
      res = { data: data, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.UNPROCESSED };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 14-03-22 new field reservationId (combo of branch and reservation code) added
// EDITED ON 26/06/23
module.exports.viewReservations = async (req) => {
  const { reservationModel } = conn.reservation(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let res = {};
    /*edited on 06-08-22 augrole1 */
    let reservationExist =
      req.decode.role == ROLES.USER
        ? await reservationModel.find({
            branchId: req.body.branchId,
          })
        : await reservationModel.find({}).skip(req.body.index).limit(30); //added on 09-06-22 branchid added as search parameter
    /*ends here */
    if (reservationExist.length > 0) {
      let branchName = "";
      for (let i = 0; i < reservationExist.length; i++) {
        reservationExist[i]._doc["date"] = common_service.prescisedateconvert(
          reservationExist[i].date
        );
        reservationExist[i]._doc[
          "reservationId"
        ] = `${reservationExist[i].branchId}RES${reservationExist[i].reservationId}`; //added on 14-03-22 //edited on 08-08-22 -> branchid appended from response
        let storeName = await branchModel.findOne({
          storecode: reservationExist[i].branchId,
        });
        if (!common_service.isEmpty(storeName)) {
          branchName = storeName.branchName ? storeName.branchName : "NO-NAME";
        } else {
          branchName = "NO NAME";
        }
        reservationExist[i]._doc["storeName"] = branchName;
      }
      res = { data: reservationExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 14-03-22
//edited on 26-06-23
module.exports.viewReservationSingle = async (req) => {
  const { reservationModel } = conn.reservation(req.decode.db);
  try {
    let res = {};
    let reservationSingle = await reservationModel.findOne({
      _id: req.body._id,
    });
    if (reservationSingle) {
      reservationSingle._doc["date"] = common_service.prescisedateconvert(
        reservationSingle.date
      );
      reservationSingle._doc[
        "reservationId"
      ] = `${reservationSingle.branchId}RES${reservationSingle.reservationId}`; //added on 14-03-22//edited branch code on 08-08-22 -> added correct format
      res = { data: reservationSingle, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 26/06/23
module.exports.editReservation = async (req) => {
  const { reservationModel } = conn.reservation(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let reservationSingle = await reservationModel.findOne({
      _id: req.body._id,
    });
    if (reservationSingle) {
      reservationSingle.firstName = !req.body.firstName
        ? reservationSingle.firstName
        : req.body.firstName;
      reservationSingle.lastName = !req.body.lastName
        ? reservationSingle.lastName
        : req.body.lastName;
      reservationSingle.email = !req.body.email
        ? reservationSingle.email
        : req.body.email;
      reservationSingle.contactNumber = !req.body.contactNumber
        ? reservationSingle.contactNumber
        : req.body.contactNumber;
      reservationSingle.date = !req.body.date
        ? reservationSingle.date
        : new Date(req.body.date).getTime();
      reservationSingle.time = !req.body.time
        ? reservationSingle.time
        : req.body.time;
      reservationSingle.no_of_guest = !req.body.no_of_guest
        ? reservationSingle.no_of_guest
        : req.body.no_of_guest;
      reservationSingle.reservationType = !req.body.reservationType
        ? reservationSingle.reservationType
        : req.body.reservationType;
      reservationSingle.note = !req.body.note
        ? reservationSingle.note
        : req.body.note;
      let data = await reservationSingle.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.RESERVATION_EDIT.type,
          description: LOG.RESERVATION_EDIT.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        data._doc["date"] = common_service.prescisedateconvert(data.date);
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
      return res;
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

module.exports.deleteReservation = async (req) => {
  const { reservationModel } = conn.reservation(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let reservationExist = await reservationModel.findOne({
      _id: req.body._id,
    });
    if (reservationExist) {
      let data = await reservationModel.deleteOne({
        _id: req.body._id,
      });
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.RESERVATION_EDIT.type,
          description: LOG.RESERVATION_EDIT.description,
          branchId: reservationExist.branchId,
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
//edited on 26/06/23
module.exports.addSettings = async (req) => {
  const { res_settingsModel } = conn.reservation(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let res = {};
    let settings_exist = await res_settingsModel.findOne({
      branchId: req.body.branchId,
    });
    if (!common_service.checkObject(settings_exist)) {
      let settings = new res_settingsModel({
        open_time: new Date(req.body.open_time).getTime(),
        close_time: new Date(req.body.close_time).getTime(),
        max_res_person: req.body.max_res_person,
        branchId: req.body.branchId,
      });
      let data = await settings.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.RESERVATION_ADD_SETTINGS.type,
          description: LOG.RESERVATION_ADD_SETTINGS.description,
          branchId: data.branchId,
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
      settings_exist.open_time = req.body.open_time
        ? new Date(req.body.open_time).getTime()
        : settings_exist.open_time;
      settings_exist.close_time = req.body.close_time
        ? new Date(req.body.close_time).getTime()
        : settings_exist.close_time;
      settings_exist.max_res_person = req.body.max_res_person
        ? req.body.max_res_person
        : settings_exist.max_res_person;
      settings_exist.branchId = req.body.branchId
        ? req.body.branchId
        : settings_exist.branchId;
      let data = await settings_exist.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.RESERVATION_EDIT_SETTINGS.type,
          description: LOG.RESERVATION_EDIT_SETTINGS.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        res = { data: data, status: STATUSCODES.SUCCESS };
      }else{
        res = { data: {msg:"Reservation Settings Save Failed"}, status: STATUSCODES.UNPROCESSED };
      }
    }
    
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 26/06/23
module.exports.viewSettings = async (req) => {
  const { res_settingsModel } = conn.reservation(req.decode.db);
  try {
    let res = {};
    let settings_exist = await res_settingsModel.findOne({
      branchId: req.body.branchId,
    });
    if (settings_exist) {
      settings_exist._doc["open_time"] = common_service
        .prescisedateconvert(settings_exist.open_time)
        .split(" ")[1];
      settings_exist._doc["close_time"] = common_service
        .prescisedateconvert(settings_exist.close_time)
        .split(" ")[1];
      res = { data: settings_exist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 29-01-22
//edited on 22-06-22
module.exports.addSeating = async (req) => {
  const { seatingModel } = conn.reservation(req.decode.db);
  try {
    let res = {};
    let TABLENUMBER = 0;
    let SEATNUMBER = 0;
    let CHAIRNUMBER = [];
    let seatInfo = await seatingModel.find({
      branchId: req.body.branchId,
    });

    if (seatInfo.length > 0) {
      TABLENUMBER = seatInfo[seatInfo.length - 1].tableNumber + 1;
    } else {
      TABLENUMBER = 1;
    }
    for (let i = 0; i < req.body.chaircount; i++) {
      SEATNUMBER++;
      CHAIRNUMBER.push({ seatNumber: SEATNUMBER, status: true });
    }
    const seating = new seatingModel({
      tableNumber: TABLENUMBER,
      chairNumber: CHAIRNUMBER,
      status: true,
      branchId: req.body.branchId,
      dataStatus: true,
      available: true,
    });
    let data = await seating.save();
    if (data) {
      res = { data: data, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: { msg: `Save Failed ` }, status: STATUSCODES.SUCCESS };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 29-04-2022
//edited on 10-06-22 -> fileurl appended insted of adding while  saving
module.exports.uploadFloorPlan = async (req) => {
  const { floorPlanModel } = conn.reservation(req.decode.db);
  try {
    if (req.files) {
      let fp = await common_service.createDirectory(
        `./public/${req.decode.db}/FloorPlan`
      );
      req.files.floorPlan.mv(
        `./public/${req.decode.db}/FloorPlan/plan${req.body.branchId}-` +
          req.files.floorPlan.name.replace(/\s+/g, "")
      );
      IMAGEURL =
        /* process.env.FILEURL + */
        `public/Images/${req.decode.db}/FloorPlan/plan${process.env.branchId}-` +
        req.files.floorPlan.name.replace(/\s+/g, "");

      let plan = floorPlanModel({
        imgUrl: IMAGEURL,
        branchId: process.env.branchId,
        dataStatus: true,
        date: new Date(Date.now()).getTime(),
      });
      let data = await plan.save();
      let lg = {
        type: LOG.RES_UPLOADFLOORPLAN,
        emp_id: req.decode ? req.decode._id : null, //changed on 15-06-22 -> line changed to avoid errors when _id is missing,
        description: "upload floor plan",
        link: {
          url: null,
          api: null,
        },
      };
      await settings_service.addLog(lg, req.decode.db);
      return (res = { data: data, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: "not acceptable", status: 406 });
    }
  } catch (error) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 29-01-22
module.exports.viewSeating = async (req) => {
  const { seatingModel } = conn.reservation(req.decode.db);
  try {
    req.body.index=parseInt(req.body.index)*20
    let res = {};

    if (req.decode.role == ROLES.USER) {
      var seatingList = await seatingModel.find({
        branchId: req.body.branchId,
        dataStatus: true,
      }).skip(req.body.index).limit(30) //edited on 22-06-22->
    } else {
      var seatingList = await seatingModel.find({
        dataStatus: true,
      }).skip(req.body.index).limit(30) 
      if (req.body.branchId) {
        var seatingList = await seatingModel.find({
          branchId: req.body.branchId,
          dataStatus: true,
        }).skip(req.body.index).limit(30) 
      }
    }
    if (seatingList.length > 0) {
      for (let i = 0; i < seatingList.length; i++) {
        const element = seatingList[i];
        element._doc["tableNumber"] = `T-` + element.tableNumber; //need edit lated (table prefix)
        element._doc["seatingcapacity"] = element.chairNumber.length;
        for (let j = 0; j < element.chairNumber.length; j++) {
          const chairelement = element.chairNumber[j];
          chairelement._doc["available"] =
            chairelement.status.toString() == "true" ? true : false;
        }
        let freeCnt = element.chairNumber.filter((x) => x.status == true);
        if (element.chairNumber.length == freeCnt.length) {
          element._doc["tableOccupied"] = false;
        } else {
          element._doc["tableOccupied"] = true;
        }
      }
      res = { data: seatingList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 31-01-22
module.exports.viewSeatingById = async (req) => {
  const { seatingModel } = conn.reservation(req.decode.db);
  try {
    let res = {};
    if (common_service.isObjectId(req.body._id)) {
      var tableSingle = await seatingModel.findOne({
        _id: req.body._id,
      });
    } else {
      return (res = { data: {}, status: STATUSCODES.BADREQUEST });
    }
    if (tableSingle) {
      tableSingle._doc["tableNumber"] = `T-` + tableSingle.tableNumber; //need edit lated (table prefix)
      tableSingle._doc["seatingcapacity"] = tableSingle.chairNumber.length;
      for (let j = 0; j < tableSingle.chairNumber.length; j++) {
        const chairelement = tableSingle.chairNumber[j];
        chairelement._doc["available"] =
          chairelement.status.toString() == "true" ? true : false;
      }
      let freeCnt = tableSingle.chairNumber.filter((x) => x.status == true);
      if (tableSingle.chairNumber.length == freeCnt.length) {
        tableSingle._doc["tableOccupied"] = false;
      } else {
        tableSingle._doc["tableOccupied"] = true;
      }
      res = { data: tableSingle, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 02-07-22
//added and assembled on 15-07-22
module.exports.disableSeating = async (req) => {
  const { seatingModel } = conn.reservation(process.env.db);
  try {
    let res = {};
    let seatingExist = await seatingModel.findOne({
      _id: req.body._id,
    });
    if (!common_service.isEmpty(seatingExist)) {
      seatingExist.status = seatingExist.status == false ? true : false;
      let data = await seatingExist.save();
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
