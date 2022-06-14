import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import databaseConfig from "./config/database";
import router from "./http/router";
import customLogs from "./commons/logs";
import helmet from "helmet";
import compression from "compression";
import errorhandler from "errorhandler";
import bodyParser from "body-parser";
import "@babel/polyfill";
const PORT = 80;

const app = express();
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(bodyParser.json({ limit: "150mb" }));
app.use(bodyParser.raw({ "extended": "true", limit: "150mb" }));
app.use(bodyParser.urlencoded({ "extended": "true", "limit": 157286400 }));

app.all("/api/*", function (req, res, next) {
	router(req, res, next)
		.then((x) => {
			app.use(x.path, x.result);
			next();
		})
		.catch((err) => {
			res.status(404).send(err);
		});
});
app.use("/api/*", function (req, res, next) { customLogs(req, res, next); });

console.log("db ==> ", `mongodb://${databaseConfig.db_host}${databaseConfig.db_name}`);
mongoose.connect(`mongodb://${databaseConfig.db_host}${databaseConfig.db_name}`); //local
// mongoose.connect(`mongodb://db:27017/${databaseConfig.db_name}`); //docker-compose
var db = mongoose.connection;
if (process.env.NODE_ENV === "dev") {
	// only use in development
	app.use(errorhandler());
}
app.listen(PORT, () => {
	console.log(`Running on port ${PORT}`);
});

db.on("error", console.error.bind(console, "DB connection error:"));
db.once("open", function () {
	console.log("DB connection successful");
});

process.on("uncaughtException", function (err) {
	console.log("Erro prioritário...");
	console.log(err);
});
process
	.on("exit", (code) => {
		// nodemon.emit("quit");
		process.exit(code);
	})
	.on("SIGINT", () => {
		// nodemon.emit("quit");
		process.exit(0);
	});
