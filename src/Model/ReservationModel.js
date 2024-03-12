//#region headers
const db = require("mongoose");
//#endregion

//#region schema
const reservationSchema = new db.Schema({
  firstName: String,
  lastName: String,
  email: String,
  contactNumber: String,
  date: Number,
  time: String,
  no_of_guest: Number,
  reservationType: String,
  note: String,
  branchId: String, //edited  on 07-04-22
  reservationId: Number, //added on 14-03-22
  shiftId: Number, //added on 06-06-22 -> shift id f.k reference
});

const res_settingsSchema = new db.Schema({
  open_time: Number,
  close_time: Number,
  max_res_person: Number,
  branchId: String, //edited  on 07-04-22
});
//added on 25-01-22
//edited on 28-01-22
const seatingSchema = new db.Schema({
  tableNumber: Number,
  chairNumber: [
    {
      seatNumber: Number,
      status: Boolean,
    },
  ],
  status: Boolean,
  imgUrl: String,
  branchId: String,
  dataStatus: Boolean,
  available: Boolean,
});

const floorPlanSchema = new db.Schema({
  branchId: String,
  imgUrl: String,
  date: Number,
  dataStatus: Boolean,
});

//#endregion

//#region exports
module.exports = {
  reservationSchema,
  res_settingsSchema,
  seatingSchema,
  floorPlanSchema,
}; //modified on 25-01-22
//#endregion
