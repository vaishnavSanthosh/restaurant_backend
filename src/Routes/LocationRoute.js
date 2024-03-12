/** @format */

//created on 05-04-22
//#region headers
const { STATUSCODES, ROLES, LOG } = require("../Model/enums");
const common_service = require("../Routes/commonRoutes.js");
const conn = require("../../userDbConn");
//#endregion

//#region methods
module.exports.addLocation = async (req) => {
  const { locationModel } = conn.location(req.decode.db);
  try {
    let res = {};
    let locationExist = await locationModel.findOne({
      admin_id: req.decode._id,
      country: req.body.country.toLowerCase(),
      locationName: req.body.locationName,
    });
    if (locationExist) {
      res = { data: locationExist, status: STATUSCODES.EXIST };
    } else {
      let newlocation = await locationModel({
        admin_id: req.decode._id,
        country: req.body.country.toLowerCase(),
        locationName: req.body.locationName.toLowerCase(),
      });
      let data = await newlocation.save();
      if (data) {
        res = { data: data, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.UNPROCESSED };
      }
    }
    return res;
  } catch (e) {
    console.error(e);
    res = { data: e, status: STATUSCODES.ERROR };
    return res;
  }
};

//added on 06-04-22
module.exports.addBranch = async (req) => {
  const { branchModel } = conn.location(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    if (req.decode != undefined) {
      if (req.body) {
        let branchExist = await branchModel.findOne({
          location_id: req.body.location_id,
          branchName: req.body.branchName,
        });
        if (branchExist) {
          return (res = { data: branchExist, status: STATUSCODES.CONFLICT });
        } else {
          let BRNO = 0;
          let branchList = await branchModel
            .find()
            .sort({ transNo: -1 })
            .limit(1);
          if (branchList.length > 0) {
            BRNO = branchList[0].transNo + 1;
          } else {
            BRNO = 1;
          }
          let newbranch = new branchModel({
            locationId: req.body.locationId,
            status: true,
            contactPerson: req.body.contactPerson,
            nameOfStore: req.body.nameOfStore,
            branchName: req.body.branchName,
            address: req.body.address,
            nativeAddress: req.body.nativeAddress,
            nativenameOfStore: req.body.nativenameOfStore,
            contactNumber: req.body.contactNumber
              ? req.body.contactNumber
              : null,
            logo: null,
            transNo: BRNO,
            storeCode:
              req.decode.prefix.replace(/\s/g, "") +
              req.body.branchName.substring(0, 2).toUpperCase() +
              BRNO,
          });
          let data = await newbranch.save();
          if (data) {
            let newlog = new logModel({
              date: new Date().getTime(),
              emp_id: req.decode._id,
              type: LOG.BRANCH_ADD.type,
              description: LOG.BRANCH_ADD.description,
              branchId: data.storeCode,
              link: {},
              payload: { token: req.headers.authorization, body: req.body },
            });
            let logresponse = await newlog.save();
            if (logresponse==null) {
              console.log("log save faild");
            }
            return (res = { data: data, status: STATUSCODES.SUCCESS });
          } else {
            return (res = { data: {}, status: STATUSCODES.UNPROCESSED });
          }
        }
      } else {
        return (res = { data: {}, status: STATUSCODES.BADREQUEST });
      }
    } else {
      return (res = { data: {}, status: STATUSCODES.UNAUTHORIZED });
    }
  } catch (e) {
    console.error(e);
    res = { data: e, status: STATUSCODES.ERROR };
    return res;
  }
};

//added on 06-04-22
module.exports.viewLocations = async (req) => {
  const { locationModel } = conn.location(req.decode.db);
  try {
    let res = {};
    let locationExist = [];
    // if (req.decode.role == ROLES.USER) {
    locationExist = await locationModel.find({
      admin_id: req.decode.admin,
      country: req.body.country,
    }); //removed else case on 12-04-22-> api made to request base only
    // }
    if (Array.isArray(locationExist) && locationExist.length > 0) {
      res = { data: locationExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: [], status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.error(e);
    res = { data: e, status: STATUSCODES.ERROR };
    return res;
  }
};

module.exports.viewBranches = async (req) => {
  const { branchModel, locationModel } = conn.location(req.decode.db);
  try {
    var branchList;
    if (!common_service.isEmpty(req.body)) {
      branchList = await branchModel.find({
        status: true,
        locationId: req.body._id,
      });
    } else {
      branchList = await branchModel.find({
        status: true,
      });
    }
    if (Array.isArray(branchList) && branchList.length > 0) {
      for (let i = 0; i < branchList.length; i++) {
        let locationExist = {};
        if (common_service.isObjectId(branchList[i].locationId)) {
          locationExist = await locationModel.findOne({
            _id: branchList[i].location_Id,
          });
        }
        branchList[i]._doc["locationName"] = !common_service.isEmpty(
          locationExist
        )
          ? locationExist.locationName
          : "No-Location";
        branchList[i]._doc["country"] = !common_service.isEmpty(locationExist)
          ? locationExist.country
          : "No Country";
        if (branchList[i].logo != null)
          branchList[i]._doc["logo"] = process.env.FILEURL + branchList[i].logo;
      }
      res = { data: branchList, status: STATUSCODES.SUCCESS };
    } else {
      return (res = { data: [], status: STATUSCODES.NOTFOUND });
    }
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: { msg: e }, status: STATUSCODES.ERROR });
  }
};

//added on 20-05-22
module.exports.returnStoreCode = async (req) => {
  const { branchModel } = conn.location(req.decode.db);
  try {
    let res = {};
    let branchExist = await branchModel.findOne({
      _id: req,
    });
    if (!common_service.isEmpty(branchExist)) {
      res = {
        data: branchExist.storecode ? branchExist.storecode : null,
        status: STATUSCODES.SUCCESS,
      };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};

//added on 08-08-22
module.exports.returnStoreName = async (req) => {
  const { branchModel } = conn.location(process.env.db);
  try {
    let res = {};
    let branchExist = await branchModel.findOne({
      storecode: req,
    });
    if (!common_service.isEmpty(branchExist)) {
      return branchExist.branchName ? branchExist.branchName : "NO-NAME";
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    console.error(e);
  }
};

//added on 03-10-22
module.exports.viewBranchbyStorecode = async (req) => {
  const { branchModel } = conn.location(process.env.db);
  try {
    if (req.length > 0) {
      let branchExist = await branchModel.findOne({ storecode: req });
      if (!common_service.isEmpty(branchExist)) {
        let locationExist = await this.viewLocationById(branchExist.locationId);
        branchExist._doc["locationName"] = !common_service.isEmpty(
          locationExist.data
        )
          ? locationExist.data.locationName
          : "No-Location";
        res = { data: branchExist, status: STATUSCODES.SUCCESS };
      } else {
        res = { data: {}, status: STATUSCODES.NOTFOUND };
      }
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    return (res = { data: { msg: e }, status: STATUSCODES.ERROR });
  }
};
//#endregion
