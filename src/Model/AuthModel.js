//created on 08-08-02-2022
//#region header
const db = require("mongoose");
//#endregion

//#region Schema
//edited on 05-04-2022 schema design updated
//edited on 07-04-2022 prefix field added
const authSchema = db.Schema({
  userName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  db: String,
  salt: String,
  profile: {
    companyName: String,
    companyEmail: String,
    contactNumber: String,
    companyAddress: String,
    contactPerson: String,
    website: String,
    logo: String,
    country: String,
    currency: String,
    language: String,
    prefix: String, //added on 07-04-22
  },
  bank: {
    accountHolderName: String,
    accountType: String,
    accountNumber: String,
    ifscCode: String,
  },
  gst: {
    sellerRegisteredNumber: String,
    gstNumber: String,
    panNumber: String,
    productTaxCode: String,
    isTax: Boolean /* added on 12-06-23 */,
  },
  code: Number,
  firstLogin: Boolean,
  discount: {}, //added on 22-06-22
  upi: [{}], //added on 23-06-22
  terms: String, //added on 28-06-22
  rewardCriteria: {}, //added on 08-07-22
  db: String, //added on 20-07-22
  enableBackup: Boolean /* added on 06-06-2023 */,
  shiftType: Number /* added on 06-06-2023 */,
});

//const adminModel = new db.model("admin", authSchema);deprecated due to dynamic db
//#endregion

//#region exports
module.exports = authSchema;
//#endregion
