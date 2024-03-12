//#region headers
const db = require("mongoose");
//#endregion

//#region schema
//edited on 22-03-22-> added new fields to this model
// added on 20-06-23
const leaveSchema = new db.Schema({
  leaveType: String,
  numberOfDays: Number,
  status: Boolean,
});
//added on 26-01-22
//edited on 20-06-23
const holidaySchema = new db.Schema({
  holidayName: String,
  fromDate: Number,
  toDate: Number,
  numberOfDays: Number,
});
// added on 20-06-23
const staffLeaveSchema = new db.Schema({
  leaveType: String,
  leaveFromeDate: Number,
  leaveToDate: Number,
  reason: String,
  imageUrl: String,
  status: String,
  branchId: String,
  emp_id: String,
  appliedDate: Number,
});

//added on 02-03-22
const leaveTypeSchema = db.Schema(
  {
    leaveType: String,
    days: Number,
    dataStatus: Boolean,
    addedDate: Number,
    branchId: String, //edited  on 07-04-22
  }
);
//#endregion

//#region exports
module.exports = { leaveSchema, holidaySchema, leaveTypeSchema, staffLeaveSchema }; //modified on 02-03-22
//#endregion
