//#region header
const {
  STATUSCODES,
  LOG,
  API,
  URL,
  ORDERSTATUS,
  PREFIXES,
  ROLES,
} = require("../Model/enums.js");
const common_service = require("./commonRoutes");
const order_service = require("./OrderRoute.js");
const settings_service = require("./settingsRoutes");
const conn = require("../../userDbConn");
//#endregion

//region method
// edited on 08-06-2022 to add log
//added on 14/4/2022

//Function to add customer

//edited on 17-06-22
// edited on 23-06-23
module.exports.generateCustomerId = async (req) => {
  const { customerModel } = conn.customer(req.decode.db);
  let res = {};
  try {
    let customerId = 0;
    /*edited on 17-06-22 unique transNo generation changed on branchwise */
    let customerCount = await customerModel.find({
      branchId: req.body.branchId,
    });
    if (customerCount.length > 0) {
      customerId = customerCount[customerCount.length - 1].cusId + 1;
    } else {
      customerId = 1;
    }
    /*ends here */
    let data = { prefix: "CUS", Id: customerId };
    return (res = { status: STATUSCODES.SUCCESS, data: { customerId: data } });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 17-06-22
// edited on 01-07-2023
module.exports.generateRelationId = async (req) => {
  const { relationModel } = conn.customer(req.decode.db);
  let res = {};
  try {
    let customerId = 0;
    /*edited on 17-06-22 unique transNo generation changed on branchwise */
    let customerCount = await relationModel.find({
      branchId: req.body.branchId,
    });
    customerId =
      Array.isArray(customerCount) && customerCount.length > 0
        ? customerCount[customerCount.length - 1].relationId + 1
        : 1;
    /*ends here */

    let data = {
      prefix:
        PREFIXES.CUSTOMER + req.decode.prefix.substring(0, 2) + customerId,
      customerId,
    };
    return (res = { status: STATUSCODES.SUCCESS, data: { customerId: data } });
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 17-06-22
// edited on 23-06-2023
module.exports.addCustomer = async (req) => {
  const { customerModel } = conn.customer(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    let customerExist = await customerModel.find({
      mobileNo: req.body.mobileNo,
      branchId: req.body.branchId, //added on 12-11-22
    });
    if (customerExist.length == 0) {
      let cusId = 0;
      let customerList = await customerModel.find({
        branchId: req.body.branchId,
      });
      cusId =
        customerList.length > 0
          ? customerList[customerList.length - 1].cusId + 1
          : 1;
      let newcustomer = new customerModel({
        cusId,
        name: req.body.name,
        mobileNo: req.body.mobileNo,
        buildingName: req.body.buildingName,
        streetName: req.body.streetName,
        landMark: req.body.landMark,
        email: req.body.email,
        refferedBy: req.body.refferedBy,
        gst: req.body.gst,
        status: true,
        points: 0 /* added new field initialisation on 21-09-22 */,
        branchId:
          req.body.branchId /* added on 12-11-22 -> new field initialisation */,
        alternateNumber:
          req.body
            .alternateNumber /* added new field initialisation on 09-01-23 */,
      });
      if (newcustomer.branchId != null) {
        let data = await newcustomer.save();
        if (data) {
          res = { data: data, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      } else {
        res = { data: "branchId Invalid", status: STATUSCODES.UNPROCESSED };
      }
    } else {
      let customerFind = customerExist.find(
        (x) =>
          x.name.toLowerCase() == req.body.name.toLowerCase() &&
          x.mobileNo == req.body.mobileNo
      );
      if (!isEmpty(customerFind)) {
        res = {
          data: {
            msg: `customer already exist with ${customerFind.mobileNo}`,
          },
          status: STATUSCODES.CONFLICT,
        };
      } else {
        let cusId = 0;
        let customerList = await customerModel.find({
          branchId: process.env.branchId,
        });
        cusId =
          customerList.length > 0
            ? customerList[customerList.length - 1].cusId + 1
            : 1;
        let newcustomer = new customerModel({
          cusId,
          name: req.body.name,
          mobileNo: req.body.mobileNo,
          buildingName: req.body.buildingName,
          streetName: req.body.streetName,
          landMark: req.body.landMark,
          email: req.body.email,
          refferdBy: req.body.refferdBy,
          gst: req.body.gst,
          status: true,
          points: 0 /* added new field initialisation on 21-09-22 */,
          branchId:
            req.body
              .branchId /* added on 12-11-22 -> new field initialisation */,
          alternateNumber:
            req.body
              .alternateNumber /* added new field initialisation on 09-01-23 */,
        });

        if (newcustomer.branchId != null) {
          let data = await newcustomer.save();
          if (data) {
            let newlog = new logModel({
              date: new Date().getTime(),
              emp_id: req.body.emp_id,
              type: LOG.CUSTOMER_ADD.type,
              description: LOG.CUSTOMER_ADD.description,
              branchId: data.branchId,
              link: {},
              payload: { token: req.headers.authorization, body: req.body },
            });
            let logresponse = await newlog.save();
            if (logresponse == null) {
              console.log("log save failed");
            }
            res = { data: data, status: STATUSCODES.SUCCESS };
          } else {
            res = { data: {}, status: STATUSCODES.UNPROCESSED };
          }
        } else {
          res = { data: "branchId Invalid", status: STATUSCODES.UNPROCESSED };
        }
      }
    }
    return res;
  } catch (e) {
    if (error.code == 11000)
      return (res = {
        data: "orderNo duplication",
        status: STATUSCODES.UNPROCESSED,
      });
    else return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//Function to add relationship
//edited on 16-06-22
//edited on 17-06-22
//Modified on 01-07-23
module.exports.addRelationship = async (req) => {
  const { relationModel, customerModel } = conn.customer(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  try {
    if (!common_service.isEmpty(req.body)) {
      let relationExist = await relationModel.find({
        mobileNo: req.body.mobileNo,
        branchId: req.body.branchId,
      });
      let customer = await customerModel.findOne({
        mobileNo: req.body.mobileNo,
        branchId: req.body.branchId,
      });
      if (relationExist.length > 0) {
        let relationfind = relationExist.find(
          (x) =>
            x.mobileNo == req.body.mobileNo &&
            x.name.toLowerCase() == req.body.name.toLowerCase() &&
            x.refferedBy == req.body.refferedBy
        );

        if (!common_service.isEmpty(relationfind)) {
          if (relationfind.dataStatus == false) {
            let data = await relationModel.findOneAndUpdate(
              { _id: relationfind._id },
              { $set: { dataStatus: true } },
              { returnDocument: "after" }
            );
            if (common_service.isEmpty(data)) {
              res = {
                data: {
                  msg: `save failed`,
                },
                status: STATUSCODES.UNPROCESSED,
              };
            } else {
              res = {
                data: relationfind,
                status: STATUSCODES.SUCCESS,
              };
            }
          } else {
            res = {
              data: {
                msg: `relation already exist with ${relationfind.mobileNo}`,
              },
              status: STATUSCODES.CONFLICT,
            };
          }
        } else {
          let newrelation = new relationModel({
            name: req.body.name,
            mobileNo: req.body.mobileNo,
            buildingName: req.body.buildingName,
            streetName: req.body.streetName,
            landMark: req.body.landMark,
            email: req.body.email,
            reference: req.body.reference,
            relType: req.body.relType,
            dataStatus: true,
            refferedBy: req.body.refferedBy,
            branchId: req.body.branchId,
          });
          let relationList = await relationModel.find({
            branchId: req.body.branchId,
          });
          newrelation.relationId =
            Array.isArray(relationList) && relationList.length > 0
              ? relationList[relationList.length - 1].relationId + 1
              : 1;
          let data = await newrelation.save();
          if (data) {
            res = { data: newrelation, status: STATUSCODES.SUCCESS };
          } else {
            res = { data: {}, status: STATUSCODES.UNPROCESSED };
          }
        }
      } else {
        let newrelation = new relationModel({
          name: req.body.name,
          mobileNo: req.body.mobileNo,
          buildingName: req.body.buildingName,
          streetName: req.body.streetName,
          landMark: req.body.landMark,
          email: req.body.email,
          reference: req.body.reference,
          relType: req.body.relType,
          dataStatus: true,
          refferedBy: req.body.refferedBy,
          branchId: req.body.branchId,
        });
        /*  */
        let relationList = await relationModel.find({
          branchId: req.body.branchId,
        });
        newrelation.relationId =
          Array.isArray(relationList) && relationList.length > 0
            ? relationList[relationList.length - 1].relationId + 1
            : 1;
        let data = await newrelation.save();
        if (data) {
          let newLog = new logModel({
            date: new Date().getTime(),
            emp_id: req.decode._id,
            type: LOG.CUSTOMER_RELATIONSHIP_ADD.type,
            description: LOG.CUSTOMER_RELATIONSHIP_ADD.description,
            branchId: data.branchId,
            link: {},
            payload: { token: req.headers.authorization, body: req.body },
          });
          let logresponse = await newLog.save();
          if (logresponse == null) {
            console.log("log save failed");
          }
          res = { data: newrelation, status: STATUSCODES.SUCCESS };
        } else {
          res = { data: {}, status: STATUSCODES.UNPROCESSED };
        }
      }
    } else {
      res = { data: {}, status: STATUSCODES.BADREQUEST };
    }
    return res;
  } catch (e) {
    if (e.code == 11000) {
      return (res = {
        data: "relation id duplication",
        status: STATUSCODES.UNPROCESSED,
      });
    } else {
      return (res = { data: e.message, status: STATUSCODES.ERROR });
    }
  }
};

//function to get all active customers
// edited on 23-06-23
module.exports.getAllActiveCustomers = async (req) => {
  const { customerModel, relationModel } = conn.customer(req.decode.db);
  let res = {},
    arr = [];
  try {
    let data = await customerModel.find({
      dataStatus: true,
      branchId: req.body.branchId,
    });
    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        data[i]._doc["customerId"] = "CUS" + data[i].cusId;
        //added on 15-07-22 --> reference by issue solution
        if (
          Array.isArray(data[i].referenceBy) &&
          data[i].referenceBy.length > 0
        ) {
          let arr = [];
          for (let j = 0; j < data[i].referenceBy.length; j++) {
            if (data[i].referenceBy[j].length == 24) {
              let rel = await relationModel.findOne({
                _id: data[i].referenceBy[j],
              });
              if (!common_service.isEmpty(rel)) {
                arr.push(rel.name);
              }
            }
          }
          data[i]._doc["referenceBy"] = arr;
        }
        /*ends here */
      }
      res = {
        data,
        status: STATUSCODES.SUCCESS,
      };
    } else {
      res = {
        data: [],
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (error) {
    return (res = { data: error.message, status: STATUSCODES.ERROR });
  }
};

//function to get all customers
// edited on 23-06-23
module.exports.getAllCustomers = async (req) => {
  const { customerModel, relationModel } = conn.customer(req.decode.db);
  let res = {},
    arr = [];
  try {
    req.body.index = parseInt(req.body.index) * 20;
    // let data = await customerModel.find({ branchId: req.body.branchId });
    let data = [];
    if (req.decode.role == ROLES.ADMIN) {
      if (req.body.branchId) {
        data = await customerModel
          .find({ branchId: req.body.branchId })
          .skip(req.body.index)
          .limit(30);
      } else {
        data = await customerModel.find({});
      }
    } else {
      data = await customerModel.find({ branchId: req.body.branchId });
    }
    if (data) {
      for (let i = 0; i < data.length; i++) {
        data[i]._doc["customerId"] = "CUS" + data[i].cusId;
        if (Array.isArray(data[i].referenceBy)) {
          for (let j = 0; j < data[i].referenceBy.length; j++) {
            let rel = await relationModel.findOne({
              _id: data[i].referenceBy[j],
            });
            if (rel) arr.push(rel.name);
          }
          data[i]._doc["referenceBy"] = arr;
        }
      }
      res = {
        data,
        status: STATUSCODES.SUCCESS,
      };
    } else {
      res = {
        data: [],
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//function to get a single customers
//edited on 17/06/2022 to add referenceBy objects from relationship
// edited on 23-06-23
module.exports.getSingleCustomer = async (req) => {
  const { customerModel, relationModel } = conn.customer(req.decode.db);
  let res = {},
    arr = [];
  try {
    let input = req.body._id;
    let data = await customerModel.findOne({
      _id: input, //edited on 23-07-22 -> search parameter set to work on normal and sub api calls
      dataStatus: true,
    });
    if (data) {
      data._doc["customerId"] = "CUS" + data.cusId;
      /*added on 21-07-22 -> validation to check if reference is null */
      if (!common_service.isEmpty(data.referenceBy)) {
        if (data.referenceBy.length > 0) {
          for (let i = 0; i < data.referenceBy.length; i++) {
            let user = await relationModel.findOne({
              _id: data.referenceBy[i],
            });
            user._doc["relationId"] = "REL" + user.relationId;
            arr.push(user);
          }
          data._doc["referenceBy"] = arr;
        }
      } /*ends here */

      res = {
        data,
        status: STATUSCODES.SUCCESS,
      };
    } else {
      res = {
        data: {},
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//function to get all active relationships
// edited on 24-06-23
module.exports.getAllActiveRelationships = async (req) => {
  const { relationModel } = conn.customer(req.decode.db);
  let res = {},
    relation = [];
  try {
    let data = await relationModel.find({
      dataStatus: true,
      branchId: req.body.branchId,
    });
    if (data) {
      for (let i = 0; i < data.length; i++) {
        relation[i] = {
          _id: data[i]._id,
          customerId: "REL" + data[i].relationId,
          name: data[i].name,
          relationship: data[i].relType,
          email: data[i].email,
          mobileNo: data[i].mobileNo,
          street: data[i].streetName,
        };
      }
      res = {
        data: relation,
        status: STATUSCODES.SUCCESS,
      };
    } else {
      res = {
        data: [],
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 13-06-22
//edited on 24-06-23
module.exports.getRelationshipOfCustomer = async (req) => {
  const { customerModel, relationModel } = conn.customer(req.decode.db);
  let res = {},
    relation = [];
  try {
    let data = await customerModel.findOne({
      _id: req.body.customerId,
      dataStatus: true,
    });
    if (!common_service.isEmpty(data)) {
      if (Array.isArray(data.referenceBy) && data.referenceBy.length > 0) {
        if (data.referenceBy.length > 0) {
          for (let i = 0; i < data.referenceBy.length; i++) {
            if (data.referenceBy[i] != "") {
              let rel = await relationModel.findOne({
                _id: data.referenceBy[i],
              });
              if (rel) {
                rel._doc["relationId"] = "REL" + rel.relationId;
                relation.push(rel);
              }
            }
          }
        }
        // res = {
        //   data: relation,
        //   status: STATUSCODES.SUCCESS,
        // };
      }
      data._doc["customerId"] = `CUS${data.customerId}`;
      data._doc["joiningDate"] = common_service
        .prescisedateconvert(data.joiningDate)
        .split(" ")[0];
      res = { data: relation, status: STATUSCODES.SUCCESS };
    } else {
      res = {
        data: [],
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//function to get all relationships
//edited on 24-06-23
module.exports.getAllRelationships = async (req) => {
  const { relationModel } = conn.customer(req.decode.db);
  let res = {},
    relation = [];
  try {
    let data = await relationModel.find({ branchId: req.body.branchId });
    if (data) {
      for (let i = 0; i < data.length; i++) {
        relation[i] = {
          _id: data[i]._id,
          customerId: "REL" + data[i].relationId,
          name: data[i].name,
          relationship: data[i].relType,
          email: data[i].email,
          mobileNo: data[i].mobileNo,
          street: data[i].streetName,
        };
      }
      res = {
        data: relation,
        status: STATUSCODES.SUCCESS,
      };
    } else {
      res = {
        data: [],
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//function to get single relationship
//edited on 24-06-23
module.exports.getSingleRelationship = async (req) => {
  const { relationModel } = conn.customer(req.decode.db);
  let db = req.decode.db;
  let res = {},
    relation = [];
  try {
    let data = await relationModel.findOne({
      _id: req.body._id,
      dataStatus: true,
    });
    if (data) {
      relation = {
        _id: data._id,
        customerId: "REL" + data.relationId,
        name: data.name,
        relationship: data.relType,
        email: data.email,
        mobileNo: data.mobileNo,
        street: data.streetName,
      };

      res = {
        data: relation,
        status: STATUSCODES.SUCCESS,
      };
    } else {
      res = {
        data: [],
        status: STATUSCODES.NOTFOUND,
      };
    }
    return res;
  } catch (e) {
    res = { data: e.message, status: STATUSCODES.ERROR };
  }
};

//delete a customer
//edited on 24-06-23
module.exports.deleteCustomer = async (req) => {
  const { customerModel } = conn.customer(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  let db = req.decode.db;
  let res = {};
  try {
    let customer = await customerModel.findOne({ _id: req.params.id });
    if (customer) {
      customer.dataStatus = false;
      let data = await customer.save();
      if (data) {
        let newLog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.CUSTOMER_ADD.type,
          description: LOG.CUSTOMER_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newLog.save();
        if (logresponse == null) {
          console.log("log save failed");
        }
        res = { data, status: STATUSCODES.SUCCESS };
      } else res = { data: {}, status: STATUSCODES.UNPROCESSED };
    } else {
      res = { status: STATUSCODES.NOTFOUND, data: {} };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//delete Relationship
//edited on 24-06-23
module.exports.deleteRelationship = async (req) => {
  const { logModel } = conn.settings(req.decode.db);
  let res = {};
  const { customerModel, relationModel } = conn.customer(req.decode.db);
  let db = req.decode.db;
  try {
    let relation = await relationModel.findOne({
      _id: req.body.relationId,
    });
    if (relation) {
      relation.dataStatus = false;
      let data = await relation.save();
      if (data) {
        let customer = await customerModel.findOne({
          _id: req.body.customerId,
        });
        if (customer) {
          for (let i = 0; i < customer.referenceBy.length; i++) {
            if (customer.referenceBy[i] == data._id)
              customer.referenceBy.splice(i, 1);
          }
          await customer.save();
        }
        let newLog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.CUSTOMER_RELATIONSHIP_ADD.type,
          description: LOG.CUSTOMER_RELATIONSHIP_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newLog.save();
        if (logresponse == null) {
          console.log("log save failed");
        }
        res = { data, status: STATUSCODES.SUCCESS };
      } else res = { data: {}, status: STATUSCODES.UNPROCESSED };
    } else {
      res = { status: STATUSCODES.NOTFOUND, data: {} };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edit customer
//edited on 24-06-23
module.exports.editCustomer = async (req) => {
  const { logModel } = conn.settings(req.decode.db);
  let res = {};
  const { customerModel } = conn.customer(req.decode.db);
  let db = req.decode.db;
  try {
    let data = {
      name: req.body.name,
      mobileNo: req.body.mobileNo,
      landMark: req.body.landMark,
      streetName: req.body.streetName,
      buildingName: req.body.buildingName,
      email: req.body.email,
    };

    let result = await customerModel.findOneAndUpdate(
      { _id: req.body.customerId },
      { $set: data },
      { returnDocument: "after" }
    );
    if (result) {
      let lg = {
        type: LOG.CUS_EDITCUSTOMER,
        emp_id: req.decode._id,
        description: "edit existing customer",
        link: {
          url: URL.CUS_CUSTOMERSINGLEVIEW,
          api: API.CUS_GETSINGLECUSTOMER + result._id,
        },
      };
      await settings_service.addLog(lg, db);
      result._doc["customerId"] = "CUS" + result.customerId;
      res = { data: result, status: STATUSCODES.SUCCESS };
    } else res = { data: {}, status: STATUSCODES.NOTFOUND };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edit relationship
//edited on 24-06-23
module.exports.editRelationship = async (req) => {
  let res = {};
  const { relationModel } = conn.customer(req.decode.db);
  let db = req.decode.db;
  try {
    let data = {
      name: req.body.name,
      mobileNo: req.body.mobileNo,
      landMark: req.body.landMark,
      streetName: req.body.streetName,
      buildingName: req.body.buildingName,
      email: req.body.email,
      reference: req.body.reference,
      relType: req.body.relType,
    };

    let result = await relationModel.findOneAndUpdate(
      { _id: req.body.relationId },
      { $set: data },
      { returnDocument: "after" }
    );
    if (result) {
      let lg = {
        type: LOG.CUS_EDITRELATIONSHIP,
        emp_id: req.decode._id,
        description: "edit a relationship",
        link: {
          url: URL.CUS_CUSTOMERSINGLEVIEW,
          api: API.CUS_GETSINGLECUSTOMER + result._id,
        },
      };
      await settings_service.addLog(lg, db);
      result._doc["relationId"] = "REL" + result.relationId;
      res = { data: result, status: STATUSCODES.SUCCESS };
    } else res = { data: {}, status: STATUSCODES.UNPROCESSED };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 06-04-22
//edited on 26-06-23
module.exports.addRewardPoints = async (req) => {
  const { logModel } = conn.settings(req.decode.db);
  let res = {};
  const { customerModel } = conn.customer(req.decode.db);
  try {
    let customerExist = await customerModel.findOne({
      customerId: req.body.customerId,
    });
    if (customerExist) {
      customerExist.points = customerExist.points + req.body.points;
      let data = await customerExist.save();
      if (data) {
        let newLog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.CUSTOMER_REWARD_ADD.type,
          description: LOG.CUSTOMER_REWARD_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newLog.save();
        if (logresponse) {
          console.log("log save failed");
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

//added on 30-04-2022
//edited on 24-06-23
module.exports.findCustomerOrders = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  let res = {},
    str = {},
    arr = [];
  try {
    if (req.body.length == 0) {
      return (res = { data: "not acceptable", status: 406 });
    }
    if (req.body.orderType) {
      // let a = order_service.returnOrderType(req.body.orderType);
      str.orderType = req.body.orderType;
    }
    if (req.body.status) str.status = req.body.status;
    if (req.body.customerId) str.cus_id = req.body.customerId;
    let orders = await orderModel.find(str);
    if (orders) {
      for (let i = 0; i < orders.length; i++) {
        if (req.body.orderDate) {
          let dt = new Date(
            common_service
              .prescisedateconvert(orders[i].orderDate)
              .split(" ")[0]
          );
          if (dt.getTime() == new Date(req.body.orderDate).getTime()) {
            let data = {
              _id: orders[i]._id,
              orderId: "ORD" + orders[i].orderId,
              orderDate: new Date(
                common_service
                  .prescisedateconvert(orders[i].orderDate)
                  .split(" ")[0]
              ),
              orderType: orders[i].orderType,
              amount: orders[i].totalAmount,
              status: orders[i].status,
            };
            arr.push(data);
          }
        } else {
          let data = {
            _id: orders[i]._id,
            orderId: "ORD" + orders[i].orderId,
            orderDate: new Date(
              common_service
                .prescisedateconvert(orders[i].orderDate)
                .split(" ")[0]
            ),
            orderType: orders[i].orderType,
            amount: orders[i].totalAmount,
            status: orders[i].status,
          };
          arr.push(data);
        }
      }
      return (res = { data: arr, status: STATUSCODES.SUCCESS });
    } else {
      return (res = { data: {}, status: STATUSCODES.NOTFOUND });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 03-08-22
//edited on 26-06-23
module.exports.addwallet = async (req) => {
  let res = {};
  const { walletModel } = conn.payment(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  try {
    let transNo = 0;
    let walletCount = await walletModel.find({
      branchId: req.branchId,
    });
    if (walletCount.length > 0) {
      transNo = walletCount[walletCount.length - 1].transNo + 1;
    } else {
      transNo = 1;
    }
    let wallet = new walletModel({
      transNo: transNo,
      cus_id: req.cus_id,
      date: new Date(Date.now()).getTime(),
      adminId: req.decode?.admin,
      branchId: process.env.branchId,
    });
    /*//added on 03-08-22 wallet updation in customer */
    let customerExist = await customerModel.findOne({ _id: req.cus_id });
    if (!common_service.isEmpty(customerExist)) {
      var walletAmnt = customerExist.wallet;
    }
    /*ends here */
    if (req.credit) {
      wallet.credit = req.credit;
      wallet.debit = 0;
      walletAmnt = walletAmnt + req.credit; //added on 03-08-22 wallet updation in customer
    } else {
      wallet.debit = req.debit;
      wallet.credit = 0;
      walletAmnt = walletAmnt - req.debit; //added on 03-08-22 wallet updation in customer
    }
    /*//added on 03-08-22 wallet updation in customer */
    customerExist.wallet = walletAmnt;
    await customerExist.save();
    /*ends here */
    let data = await wallet.save();
    if (data) {
      res = { data: data, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.UNPROCESSED };
    }
    return res;
  } catch (e) {
    return (res = { data: e.massage, status: STATUSCODES.ERROR });
  }
};

//added on 19-05-22
//edited on 04-07-23
module.exports.getCustomerByPhone = async (req) => {
  const { customerModel } = conn.customer(req.decode.db);
  let res = {};
  try {
    let customerExist = await customerModel.findOne({
      mobileNo: req.body.mobileNo,
    });
    if (customerExist) {
      customerExist._doc["joiningDate"] = common_service
        .prescisedateconvert(customerExist.joiningDate)
        .split(" ")[0];
      return (res = { data: customerExist, status: STATUSCODES.SUCCESS });
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.massage, status: STATUSCODES.ERROR });
  }
};

//added on 07-07-22
//edited on 26-06-23
module.exports.viewRewardPointsOfACustomer = async (req) => {
  const { customerModel } = conn.customer(req.decode.db);
  const { walletModel, creditModel } = conn.payment(req.decode.db);
  try {
    let res = {};
    let customerExist = await customerModel.findOne({
      _id: req.body._id,
    });
    if (!common_service.isEmpty(customerExist)) {
      var resobj = {};
      let creditTot = 0;
      resobj.points = customerExist.points ? customerExist.points : 0;
      let wallet = await walletModel.findOne({ cus_id: req.body._id });
      let credit = await creditModel.find({ cus_id: req.body._id });
      /*edited on 15-07-22 credit assign from here */
      if (Array.isArray(credit) && credit.length > 0) {
        credit.map((x) => (creditTot = creditTot + x.balance));
      }
      resobj.wallet = !common_service.isEmpty(wallet) ? wallet.credit : 0;
      resobj.credit = creditTot; //added on 15-07-22 -> improper assign fixed,revious value was single credit now total credit
      /*to here */
      res = { data: resobj, status: 200 };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: { message: e.message }, status: STATUSCODES.ERROR });
  }
};

//added on 14-07-22
//edited on 26-06-23
module.exports.customerSingleView = async (req) => {
  const { customerModel } = conn.customer(req.decode.db);
  try {
    let res = {};
    let customerExist = await customerModel.findOne({ _id: req.body._id });
    if (!common_service.isEmpty(customerExist)) {
      customerExist._doc["joiningDate"] = common_service
        .prescisedateconvert(customerExist.joiningDate)
        .split(" ")[0];
      let orderList = await order_service.viewCustomerOrder(req.body._id);
      if (Array.isArray(orderList.data)) {
        customerExist._doc["order"] = orderList;
      } else {
        customerExist._doc["order"] = null;
      }
      res = { data: customerExist, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 14-07-22
//edited on 03-07-23
module.exports.viewCustomerOrdersByStatus = async (req) => {
  const { orderModel } = conn.order(req.decode.db);
  const { foodModel } = conn.food(req.decode.db);
  const { categoryModel } = conn.category(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  let res = {};
  try {
    let orderList = [];
    if (req.body.status != ORDERSTATUS.ALL) {
      orderList = await orderModel.find({
        orderType: req.body.orderType,
        status: req.body.status,
        branchId: req.body.branchId,
        cus_id: req.body._id,
      });
    } else {
      orderList = await orderModel.find({
        branchId: req.body.branchId,
        cus_id: req.body._id, //added on 15-07-22 -> new search parameter added
        orderType: req.body.orderType, //added on 15-07-22 -> new search parameter added
      });
    } //edited on 23-05-22 -> else block converted to branchId wise

    if (orderList.length > 0) {
      for (let i = 0; i < orderList.length; i++) {
        const element = orderList[i];
        element._doc["orderDate"] = common_service.prescisedateconvert(
          element.orderDate
        );
        element._doc["Amount"] = 0;
        for (let j = 0; j < element.orderInfo.length; j++) {
          //edited on 21-04-22 -> item -> items
          const itemData = element.orderInfo[j]; //edited on 21-04-22 -> item -> items
          let food_info = await foodModel.findOne(itemData.item);
          let cat_info = await categoryModel.findOne(itemData.category);
          (itemData.categoryName = cat_info.categoryName
            ? cat_info.categoryName
            : null),
            (itemData.itemName = food_info.prod_name
              ? food_info.prod_name
              : null);
          element._doc["Amount"] = element._doc["Amount"] + itemData.rate;
          let customer = await customerModel.findOne({ id: element.cus_id });
          element._doc["CustomerName"] = customer.name ? customer.name : null;
          element._doc["mobileNo"] = customer.mobileNo
            ? customer.mobileNo
            : null;
        }
      }
      res = { data: orderList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: {}, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on 01-07-23
module.exports.viewCustomerWallet = async (req) => {
  const { walletModel } = conn.payment(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  try {
    let walletExist = await walletModel.findOne({ cus_id: req.body._id });
    if (common_service.checkObject(walletExist)) {
      walletExist._doc["customerName"] = "No Customer";
      if (common_service.isObjectId(walletExist.cus_id)) {
        let customer = await customerModel.findOne({ _id: walletExist.cus_id });
        if (common_service.checkObject(customer)) {
          walletExist._doc["customerName"] = customer.name;
        }
      }
      return (res = { data: walletExist, status: STATUSCODES.SUCCESS });
    } else {
      return (res = {
        data: { msg: "no wallet for customer" },
        status: STATUSCODES.NOTFOUND,
      });
    }
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//added on  05-07-2023
module.exports.validityCustomer = async (req) => {
  const { customerModel } = conn.customer(req.decode.db);
  try {
    let customerExist = await customerModel.find({
      mobileNo: req.body.mobileNo,
      branchId: req.body.branchId,
    });
    if (Array.isArray(customerExist) && customerExist.length > 0) {
      let customerFind = customerExist.find(
        (x) =>
          x.name.replace(/ +g/, "").toLowerCase() ==
            req.body.name.replace(/ +g/, "").toLowerCase() &&
          x.mobileNo == req.body.mobileNo
      );
      if (!common_service.isEmpty(customerFind)) {
        res = { data: "customer Exist", status: STATUSCODES.FORBIDDEN };
      } else {
        res = { data: "mobile duplication", status: STATUSCODES.CONFLICT };
      }
    } else {
      res = { data: { msg: "not found" }, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.massage, status: STATUSCODES.ERROR });
  }
};

//added on 05-07-2023
module.exports.validityrelation = async (req) => {
  const { relationModel } = conn.customer(req.decode.db);
  try {
    let valExist = await relationModel.findOne({ mobileNo: req.body.mobileNo });
    if (valExist) {
      if (valExist.name.toLowerCase() == req.body.name.toLowerCase()) {
        res = { data: valExist, status: STATUSCODES.FORBIDDEN };
      } else {
        res = { data: "mobile duplication", status: STATUSCODES.CONFLICT };
      }
    } else {
      res = { data: { msg: "not found" }, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.massage, status: STATUSCODES.ERROR });
  }
};

//added on 12-07-2023
module.exports.viewcustomerwithfilter = async (req) => {
  const { customerModel, relationModel } = conn.customer(req.decode.db);
  const { branchModel } = conn.location(req.decode.db);
  try {
    let customerList = [];
    customerList =
      req.decode.role == ROLES.USER
        ? await customerModel.find({
            branchId: req.body.branchId, //added on 12-11-22
          })
        : req.body.branchId
        ? await customerModel.find({
            branchId: req.body.branchId, //added on 12-11-22
          })
        : await customerModel.find({});
    if (Array.isArray(customerList) && customerList.length > 0) {
      for (let i = 0; i < customerList.length; i++) {
        const element = customerList[i];
        let branchExist = await branchModel.findOne({
          storeCode: element.branchId,
        });

        element._doc["BRANCHID"] = !common_service.isEmpty(branchExist)
          ? branchExist.branchName
          : " No Location";
        element._doc["cusId"] =
          PREFIXES.CUSTOMER + req.decode.prefix.substring(0, 2) + element.cusId;

        let relationList = await relationModel.find({
          refferedBy: element._id.toString(),
        });

        let reltnArr = [];

        if (Array.isArray(relationList) && relationList.length > 0) {
          relationList.map(async (x) => {
            reltnArr.push({ name: x.name });
          });
        }
        element._doc["relation"] = reltnArr;
      }
      if (req.body.status) {
        if (req.body.status == "true") {
          customerList = customerList.filter((x) => x.status == true);
        } else {
          customerList = customerList.filter((x) => x.status == false);
        }
      }
      if (req.body.cusId) {
        customerList = customerList.filter((x) => x._id == req.body.cusId);
      }
      if (req.body.mobileNo) {
        customerList = customerList.filter(
          (x) => x.mobileNo == req.body.mobileNo
        );
      }
      if (req.body.branchId) {
        customerList = customerList.filter(
          (x) => x.branchId == req.body.branchId
        );
      }
      res = { data: customerList, status: STATUSCODES.SUCCESS };
    } else {
      res = { data: { msg: "not found" }, status: STATUSCODES.NOTFOUND };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

// added on 11-09-23
module.exports.viewWalletofaCustomer = async (req) => {
  const { walletModel } = conn.payment(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  try {
    let walletExist = await walletModel.findOne({ cus_id: req.body._id });
    if (!common_service.isEmpty(walletExist)) {
      const element = walletExist;
      let cus_id = {};
      if (common_service.isObjectId(req.body.cus_id)) {
        cus_id = await customerModel.findOne({ _id: req.body.cus_id });
      }
      element._doc["customerName"] = cus_id!=null
        ? cus_id.name
        : "No customer";
      res = { data: walletExist, status: STATUSCODES.SUCCESS };
    } else {
      res = {
        data: { msg: "No Wallet Created For Customer" },
        status: STATUSCODES.NOTFOUND,
      };
    } 
    return res;
  } catch (e) {
    console.error(e);
    return (res = { data: e, status: STATUSCODES.ERROR });
  }
};
//#endregion
