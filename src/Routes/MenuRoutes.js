// //#region headers
// const { STATUSCODES, LOG, API, URL } = require("../Model/enums");
// //const menumodel = require("../Model/MenuModel.js");
// const fs = require("fs");
// const conn = require("../../userDbConn");
// require("dotenv").config({ path: "./.env" });
// const settings_service = require("./settingsRoutes");
// common_service=require("./commonRoutes")
// //#endregion

// //#region methods

// //assembled on 15-07-22
// module.exports.addMenu = async (req) => {
//   const menuModel = conn.menu(process.env.db);
//   let db = process.env.db;
//   try {
//     let res = {};
//     let IMAGEURL = "";
//     let menu_exist = await menuModel.findOne({
//       menuType: req.body.menuType,
//       branchId: process.env.branchId, //added on 16-06-22  search parameter branchId added
//     });
//     if (!menu_exist) {
//       if (req.files) {
//         let fp = await common_service.createDirectory(
//           `./public/${req.decode.db}/Menu`
//         );
//         req.files.file.mv(
//           `./public/${req.decode.db}/Menu/${req.body.menuType}-` + req.files.file.name.replace(/\s+/g, "")
//         );
//         IMAGEURL = `Images/${req.decode.db}/Menu/${req.body.menuType}-` + req.files.file.name.replace(/\s+/g, ""); //removed on 16-06-22 -> File url removed from here
//       }
//       let menu = new menuModel({
//         menuType: req.body.menuType,
//         status: req.body.status,
//         imageUrl: IMAGEURL,
//         branchId: process.env.branchId, //added on 16-06-22 branchId field initialised
//       });
//       let data = await menu.save();
//       if (data) {
//         let lg = {
//           type: LOG.FOD_ADDMENUTYPE,
//           emp_id: req.decode._id,
//           description: "add menu",
//           link: {
//             url: URL.null,
//             api: API.null,
//           },
//         };
//         await settings_service.addLog(lg, db);
//         res = { data: menu, status: STATUSCODES.SUCCESS };
//       } else {
//         res = { data: {}, status: STATUSCODES.UNPROCESSED };
//       }
//     } else {
//       res = { data: menu_exist, status: STATUSCODES.EXIST };
//     }
//     return res;
//   } catch (e) {
//     return (res = { data: e.message, status: STATUSCODES.ERROR });
//   }
// };

// //assembled on 15-07-22
// module.exports.viewMenus = async () => {
//   const menuModel = conn.menu(process.env.db);
//   try {
//     let res = {};
//     let menu_exist = await menuModel.find({
//       branchId: process.env.branchId,
//       status: true,
//     });
//     if (Array.isArray(menu_exist) && menu_exist.length > 0) {
//       //added on 16-06-22 if condition modified
//       for (let i = 0; i < menu_exist.length; i++) {
//         const element = menu_exist[i];
//         element._doc["imageUrl"] = process.env.FILEURL + element.imageUrl; //added on 16-06-22 -> FILEURL appended//edited on 26-07-22 -> file url assignment corrected
//       }
//       res = { data: menu_exist, status: STATUSCODES.SUCCESS };
//     } else {
//       res = { data: {}, status: STATUSCODES.NOTFOUND };
//     }
//     return res;
//   } catch (e) {
//     return (res = { data: e.message, status: STATUSCODES.ERROR });
//   }
// };

// //assembled on 15-07-22
// module.exports.viewMenubyId = async (req) => {
//   const menuModel = conn.menu(process.env.db);
//   try {
//     let res = {};
//     let menu_exist = await menuModel.findOne({ _id: req });
//     if (menu_exist) {
//       menu_exist._doc["imageUrl"] = process.env.FILEURL + menu_exist.imageUrl; //added on 16-06-22 -> FILEURL appended//edited on 26-07-22 -> file url assignment corrected
//       res = { data: menu_exist, status: STATUSCODES.SUCCESS };
//     } else {
//       res = { data: {}, status: STATUSCODES.NOTFOUND };
//     }
//     return res;
//   } catch (e) {
//     return (res = { data: e.message, status: STATUSCODES.ERROR });
//   }
// };

// //assembled on 15-07-22
// module.exports.editMenu = async (req) => {
//   const menuModel = conn.menu(req.decode.db);
//   let db = process.env.db;
//   try {
//     let res = {};
//     let menu_exist = await menuModel.findOne({
//       _id: req.body.id,
//     });
//     if (menu_exist) {
//       if (req.files) {
//         let fp = await common_service.createDirectory(
//           `./public/${req.decode.db}/Menu`
//         );
//         fs.unlink(`public/` + menu_exist.imageUrl.split("Images/")[1], (err) => {
//           //edited on 16-06-22 FILEURL appended
//           if (err) console.log(err);
//         });
//         req.files.file.mv(
//           `./public/${req.decode.db}/Menu/${menu_exist.menuType}-` + req.files.file.name.replace(/\s+/g, "")
//         );
//         menu_exist.imageUrl =
//          /* process.env.FILEURL +*/
//           `Images/${req.decode.db}/Menu/${menu_exist.menuType}-` +
//           req.files.file.name.replace(/\s+/g, "");
//       }
//       menu_exist.menuType = !req.body.menuType
//         ? menu_exist.menuType
//         : req.body.menuType;
//       menu_exist.status = !req.body.status
//         ? menu_exist.status
//         : req.body.status;
//       let data = await menu_exist.save();
//       if (data) {
//         let lg = {
//           type: LOG.FOD_EDITMENUTYPE,
//           emp_id: req.decode._id,
//           description: "edit menu type",
//           link: {
//             url: URL.null,
//             api: API.null,
//           },
//         };
//         await settings_service.addLog(lg, req.decode.APIdb);
//         res = { data: data, status: STATUSCODES.SUCCESS };
//       } else {
//         res = { data: {}, status: STATUSCODES.UNPROCESSED };
//       }
//     } else {
//       res = { data: {}, status: STATUSCODES.NOTFOUND };
//     }
//     return res;
//   } catch (e) {
//     return (res = { data: e.message, status: STATUSCODES.ERROR });
//   }
// };

// //assembled on 15-07-22
// module.exports.deleteMenu = async (req) => {
//   const menuModel = conn.menu(process.env.db);
//   let db = process.env.db;
//   try {
//     let res = {};
//     let menu_exist = await menuModel.findOne({
//       _id: req,
//     });
//     if (menu_exist) {
//       // let remvArr = menu_exist.imageUrl.split(process.env.SPLITURL);
//       // fs.unlink(`public/` + menu_exist.imageUrl, (err) => {
//       //   //added on 16-06-22 -> FILEURL appended
//       //   if (err) console.log(err);
//       // });
//       menu_exist.status = false;
//       let data = await menu_exist.save();
//       if (data) {
//         let lg = {
//           type: LOG.FOD_DELETEMENUTYPE,
//           emp_id: req.decode?._id,
//           description: "delete menu type",
//           link: {
//             url: URL.null,
//             api: API.null,
//           },
//         };
//         await settings_service.addLog(lg, db);
//         res = { data: data, status: STATUSCODES.SUCCESS };
//       } else {
//         res = { data: {}, status: STATUSCODES.UNPROCESSED };
//       }
//     } else {
//       res = { data: {}, status: STATUSCODES.NOTFOUND };
//     }
//     return res;
//   } catch (e) {
//     return (res = { data: e.message, status: STATUSCODES.ERROR });
//   }
// };
// //#endregion
