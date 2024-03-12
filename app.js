//#region header
require("dotenv").config({ path: "./.env" });
const express = require("express");
const user = require("./src/Routes/commonRoutes.js"); //edited on 04-02-2022
const chalk = require("chalk");
const upload = require("express-fileupload");
const cors = require("cors");
const customerRouter = require("./src/Controller/CustomerController ");
const sale_router = require("./src/Controller/SalesController.js");
const dashBoardRouter = require("./src/Controller/DashBoardController.js");
// const ZKLib = require("zklib");
const ZKLib = require("node-zklib");
const nodeCron = require("node-cron");
//#endregion

//#region variables
const app = express();
//#endregion

//#region methods
app.use(cors({ origin: "*" }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.json());
app.use(upload());
app.use("/Images", express.static("public")); //edited on 04-02-2022

let date = user.prescisedateconvert(Date.now());
//#endregion

//#region api routing//edited on 04-02-2022
app.use("/designation", require("./src/Controller/DesignationController.js"));
app.use("/department", require("./src/Controller/DepartmentController.js"));
app.use("/employee", require("./src/Controller/EmployeeController.js"));
app.use("/category", require("./src/Controller/CategoryController.js"));
app.use("/menu", require("./src/Controller/MenuController.js"));
app.use("/expense", require("./src/Controller/ExpenseController.js"));
app.use("/leave", require("./src/Controller/LeaveController.js"));
app.use("/reservation", require("./src/Controller/ReservationController.js"));
app.use("/supplier", require("./src/Controller/SupplierController.js"));
app.use("/food", require("./src/Controller/FoodController.js"));
app.use(
  "/foodavailable",
  require("./src/Controller/AvailableFoodController.js")
);
app.use("/purchase", require("./src/Controller/PurchaseController.js"));
app.use("/order", require("./src/Controller/OrderController.js"));
app.use("/product", require("./src/Controller/ProductController.js"));
app.use("/admin", require("./src/Controller/AuthController.js"));
app.use("/stock", require("./src/Controller/StockController.js"));
app.use("/offer", require("./src/Controller/OfferController.js"));
app.use("/settings", require("./src/Controller/SettingsController.js")); //added on 16-03-22
app.use("/rewards", require("./src/Controller/RewardController.js")); //added on 21-03-22
app.use("/customer", customerRouter);
app.use("/sales", sale_router);
app.use("/dashboard", dashBoardRouter);
app.use("/account", require("./src/Controller/AccountController.js")); //added on 12-08-23

//#region server
app.listen(process.env.PORT, () => {
  console.log(
    chalk.cyanBright.bold.italic.inverse(
      `running on ${process.env.PORT} on ${date} on db ${process.env.db}`
    )
  );
});
//#endregion
