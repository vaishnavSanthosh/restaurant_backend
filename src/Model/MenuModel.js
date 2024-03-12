//#region headers
const db = require("mongoose");
//#endregion

//#region schema
const menuSchema = new db.Schema(
  {
    menuType: String,
    status: Boolean,
    imageUrl: String,
    branchId: String, //edited  on 07-04-22
  }
);

//#endregion

//#region exports
module.exports = menuSchema;
//#endregion
