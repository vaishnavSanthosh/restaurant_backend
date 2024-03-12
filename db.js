//#region Headers

const db = require("mongoose");
const dotenv = require("dotenv");
const chalk = require("chalk");

//#endregion

//#region Variables

dotenv.config({ path: "./config/.env" });
//#endregion

//#region Methods

async function main() {
  try {
    const CONNECTION_URL = `mongodb://${process.env.username}:${process.env.password}@${process.env.url}/${process.env.TEST_DB_NAME}?authSource=admin`;
    // const CONNECTION_URL = `mongodb+srv://leeyet:Pkpm%404750@cluster0.gzjox41.mongodb.net/${process.env.TEST_DB_NAME}?authSource=admin&replicaSet=atlas-m8f942-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true`;
    // console.log(CONNECTION_URL);
    db.connect(CONNECTION_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
      .then((result) =>
        console.log(chalk.green.bold.italic.inverse("connected"))
      )
      .catch((err) => console.log(chalk.red.bold.italic.inverse(err)));
    // console.log(db.connection)
    // this.conn = db.createConnection(CONNECTION_URL, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // });
  } catch (e) {
    console.log(chalk.red.inverse(e));
  }
}
main().catch(console.error);
// console.log(console.error);
module.exports = main;
//#endregion
