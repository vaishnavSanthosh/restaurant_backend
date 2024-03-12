/** @format */

//created on 15-03-22
//#region headers
const { STATUSCODES, LOG, URL, API } = require("../Model/enums");
const common_service = require("./commonRoutes");
const settings_service = require("./settingsRoutes");
const conn = require("../../userDbConn");
//#endregion

//#region methods
//edited on 17-06-22
//edited on 06/07/23 changed env to decode
module.exports.addQuotation = async (req) => {
  const salesModel = conn.sales(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  let res = {},
    arr = [];
  try {
    let quotNo = 0;
    // let quotCount = await quotationModel.aggregate([
    //   {
    //     $sort: { quotNo: -1 },
    //   },
    // ]);
    /*edited on 17-06-22 */
    let quotCount = await salesModel.find({
      branchId: req.body.branchId,
    });
    if (quotCount.length > 0) {
      quotNo = quotCount[quotCount.length - 1].quotNo + 1;
    } else {
      quotNo = 1;
    }
    /*ends here */
    if (req.body.items.length > 0) {
      for (let i = 0; i < req.body.items.length; i++) {
        arr[i] = {
          itemName: req.body.items[i].itemName,
          description: req.body.items[i].description,
          unitCost: req.body.items[i].unitCost,
          qty: req.body.items[i].qty,
          uom: req.body.items[i].uom,
          amount: req.body.items[i].amount,
        };
      }
      let quotation = salesModel({
        quotNo,
        doAdd: new Date(Date.now()).getTime(),
        customerId: req.body.customerId,
        contact: req.body.contact,
        email: req.body.email,
        estDate: new Date(req.body.estDate).getTime(),
        expDate: new Date(req.body.expDate).getTime(),
        custAdd: req.body.custAdd,
        billAdd: req.body.billAdd,
        items: arr,
        branchId: req.body.branchId ? req.body.branchId : process.env.branchId,
        dataStatus: true,
        status: "active",
        total: req.body.total,
        tax: req.body.tax,
        discount: req.body.discount,
        grandTotal: req.body.grandTotal,
      });
      let data = await quotation.save();
      if (data) {
        let newlog = new logModel({
          date: new Date().getTime(),
          emp_id: req.decode._id,
          type: LOG.SALES_QUATATION_ADD.type,
          description: LOG.SALES_QUATATION_ADD.description,
          branchId: data.branchId,
          link: {},
          payload: { token: req.headers.authorization, body: req.body },
        });
        let logresponse = await newlog.save();
        if (logresponse == null) {
          console.log("log save faild");
        }
        data._doc["estDate"] = common_service.prescisedateconvert(data.estDate);
        data._doc["expDate"] = common_service.prescisedateconvert(data.expDate);
        data._doc["quotNo"] = "INV" + quotNo;
        data._doc["doAdd"] = common_service.prescisedateconvert(data.doAdd);
        res = { status: STATUSCODES.SUCCESS, data: data };
      } else res = { status: STATUSCODES.UNPROCESSED, data: {} };
    } else {
      res = { status: STATUSCODES.NOTACCEPTABLE, data: "not acceptable" };
    }
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//edited on 06/07/23
module.exports.editQuotation = async (req) => {
  const salesModel = conn.sales(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  let res = {};
  try {
    let quotation = {
      customerId: req.body.customerId,
      contact: req.body.contact,
      email: req.body.email,
      estDate: new Date(req.body.estDate).getTime(),
      expDate: new Date(req.body.expDate).getTime(),
      custAdd: req.body.custAdd,
      billAdd: req.body.billAdd,
      items: req.body.items,
      status: req.body.status,
      branchId: req.body.branchId ? req.body.branchId : process.env.branchId,
      total: req.body.total,
      tax: req.body.tax,
      discount: req.body.discount,
      grandTotal: req.body.grandTotal,
    };

    let data = await salesModel.findOneAndUpdate(
      { _id: req.body.id },
      { $set: quotation },
      { returnDocument: "after" }
    );
    if (data) {
      let newlog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.SALES_QUATATION_ADD.type,
        description: LOG.SALES_QUATATION_ADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newlog.save();
      if (logresponse == null) {
        console.log("log save faild");
      }
      data._doc["estDate"] = common_service.prescisedateconvert(data.estDate);
      data._doc["expDate"] = common_service.prescisedateconvert(data.expDate);
      data._doc["quotNo"] = "INV" + data.quotNo;
      res = { status: STATUSCODES.SUCCESS, data: data };
    } else res = { status: STATUSCODES.UNPROCESSED, data: {} };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//edited on 06/07/23
module.exports.getSingleQuotation = async (req) => {
  const salesModel = conn.sales(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  let res = {};
  try {
    let data = await salesModel.findOne({
      _id: req.body.id,
      dataStatus: true,
    });
    if (data) {
      let customer = await customerModel.findOne({ _id: data.customerId });
      data._doc["estDate"] = common_service
        .prescisedateconvert(data.estDate)
        .split(" ")[0];
      data._doc["expDate"] = common_service
        .prescisedateconvert(data.expDate)
        .split(" ")[0];
      data._doc["quotNo"] = "INV" + data.quotNo;
      data._doc["name"] = customer?.name;

      res = { status: STATUSCODES.SUCCESS, data: data };
    } else res = { status: STATUSCODES.UNPROCESSED, data: {} };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//edited on 06/07/23
module.exports.getQuotation = async (req) => {
  const salesModel = conn.sales(req.decode.db);
  let res = {},
    arr = [];
  try {
    let data = await salesModel.find({ branchId: req.body.branchId });
    if (data) {
      for (let i = 0; i < data.length; i++) {
        data[i]._doc["estDate"] = common_service.prescisedateconvert(
          data[i].estDate
        );
        data[i]._doc["expDate"] = common_service.prescisedateconvert(
          data[i].expDate
        );
        data[i]._doc["quotNo"] = "INV" + data[i].quotNo;
        arr.push(data[i]);
      }

      res = { status: STATUSCODES.SUCCESS, data: arr };
    } else res = { status: STATUSCODES.UNPROCESSED, data: {} };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 06/07/23
module.exports.getQuotationByMonth = async (req) => {
  const salesModel = conn.sales(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  let res = {},
    arr = [];
  try {
    req.body.index = parseInt(req.body.index) * 20;
    let data = await salesModel
      .find({ branchId: req.body.branchId })
      .skip(req.body.index)
      .limit(30);
    if (data) {
      for (let i = 0; i < data.length; i++) {
        let d = common_service.dateConverter(data[i].estDate);
        if (
          parseInt(d.month) == parseInt(req.body.monthnyear.split("/")[0]) &&
          parseInt(d.year) == parseInt(req.body.monthnyear.split("/")[1])
        ) {
          let customer = await customerModel.findOne({
            _id: data[i].customerId,
          });
          data[i]._doc["estDate"] = common_service
            .prescisedateconvert(data[i].estDate)
            .split(" ")[0];
          data[i]._doc["expDate"] = common_service
            .prescisedateconvert(data[i].expDate)
            .split(" ")[0];
          data[i]._doc["quotNo"] = "INV" + data[i].quotNo;
          data[i]._doc["name"] = customer?.name;
          arr.push(data[i]);
        }
      }

      res = { status: STATUSCODES.SUCCESS, data: arr };
    } else res = { status: STATUSCODES.UNPROCESSED, data: {} };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};
//edited on 06/07/23
module.exports.getActiveQuotation = async (req) => {
  const salesModel = conn.sales(req.decode.db);
  const { customerModel } = conn.customer(req.decode.db);
  let res = {},
    arr = [];
  try {
    let data = await salesModel.find({
      dataStatus: true,
      branchId: req.body.branchId,
    });
    if (data) {
      for (let i = 0; i < data.length; i++) {
        let customer = await customerModel.findOne({ _id: data[i].customerId });
        data[i]._doc["doAdd"] = common_service.prescisedateconvert(
          data[i].doAdd
        );
        data[i]._doc["estDate"] = common_service
          .prescisedateconvert(data[i].estDate)
          .split(" ")[0];
        data[i]._doc["expDate"] = common_service
          .prescisedateconvert(data[i].expDate)
          .split(" ")[0];
        data[i]._doc["quotNo"] = "INV" + data[i].quotNo;
        data[i]._doc["name"] = customer?.name;
        arr.push(data[i]);
      }
      res = { status: STATUSCODES.SUCCESS, data: data };
    } else res = { status: STATUSCODES.UNPROCESSED, data: {} };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//edited on 06/07/23
module.exports.deleteQuotation = async (req) => {
  const salesModel = conn.sales(req.decode.db);
  const { logModel } = conn.settings(req.decode.db);
  let res = {};
  try {
    let data = await salesModel.findOneAndUpdate(
      { _id: req.body.id },
      { $set: { dataStatus: false } },
      { returnDocument: "after" }
    );
    if (data) {
      let newlog = new logModel({
        date: new Date().getTime(),
        emp_id: req.decode._id,
        type: LOG.SALES_QUATATION_ADD.type,
        description: LOG.SALES_QUATATION_ADD.description,
        branchId: data.branchId,
        link: {},
        payload: { token: req.headers.authorization, body: req.body },
      });
      let logresponse = await newlog.save();
      if (logresponse == null) {
        console.log("log save faild");
      }
      data._doc["estDate"] = common_service.prescisedateconvert(data.estDate);
      data._doc["expDate"] = common_service.prescisedateconvert(data.expDate);
      res = { status: STATUSCODES.SUCCESS, data: data };
    } else res = { status: STATUSCODES.UNPROCESSED, data: {} };
    return res;
  } catch (e) {
    return (res = { data: e.message, status: STATUSCODES.ERROR });
  }
};

//#endregion
