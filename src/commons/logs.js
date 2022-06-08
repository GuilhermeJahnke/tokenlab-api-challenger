
var logsDB = require("../models/Logs");
var util = require("util");
const RequestIp = require("@supercharge/request-ip");


module.exports = (req, res, next)=> {
	const initTime = new Date();
	const ip = RequestIp.getClientIp(req);
	const timings = {
		// use process.hrtime() as it"s not a subject of clock drift
		startAt: process.hrtime(),
		dnsLookupAt: undefined,
		tcpConnectionAt: undefined,
		tlsHandshakeAt: undefined,
		firstByteAt: undefined,
		endAt: undefined
	};
	const LogModel = {
		date: new Date(),
		action: req.originalUrl || "error",
		type:  req.originalUrl ? "request" : "error",
		method: req.method,
		headers:req.headers,
		body: req.body,
		params: req.params,
		query: req.query,
		protocol: req.protocol,
		// req: req,
		size: "",
		timings: "",
		statusCode: "",
		statusMessage: "",
		response: "",
		address: ip,
		xhr: req.xhr,
		complete: req.complete

	};
	req.on("socket", (socket) => {
		socket.on("lookup", () => {
			timings.dnsLookupAt = process.hrtime();
		});
		socket.on("connect", () => {
			timings.tcpConnectionAt = process.hrtime();
		});
		socket.on("secureConnect", () => {
			timings.tlsHandshakeAt = process.hrtime();
		});
	});
	res.once("readable", () => {
		timings.firstByteAt = process.hrtime();
	});
	res.on("data", (chunk) => { responseBody += chunk; });
	res.on("end", () => {
		timings.endAt = process.hrtime();
	});


	res.on("finish", ()=>{
		LogModel.timings = new Date().getTime() - initTime.getTime() + "ms";
		LogModel.complete = true;
		LogModel.statusCode = res.statusCode;
		LogModel.statusMessage = res.statusMessage;
		LogModel.size = res._headers["content-length"];
		LogModel.response = JSON.stringify(util.inspect(res));
		saveLog(LogModel);

	}); // successful pipeline (regardless of its response)
	res.on("close", ()=>{
		LogModel.timings = new Date().getTime() - initTime.getTime() + "ms";
		LogModel.complete = false;
		saveLog(LogModel);
	}); // aborted pipeline
	res.on("error", ()=>{
		LogModel.timings = new Date().getTime() - initTime.getTime() + "ms";
		LogModel.complete = false;
		saveLog(LogModel);
	}); // pipeline internal error

	next();

};
function saveLog(log){
	if(log.headers.host === "localhost") return;
	const logInfo = new logsDB(log);
	logInfo.save((err, doc)=>{
	});
}