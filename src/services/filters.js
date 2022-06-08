require("../config/passport");
const passport = require("passport");

const requireAuth = passport.authenticate("jwt", { session: false });
const requireLogin = passport.authenticate("local", {
	session: false,
  	badRequestMessage: "Digite as credenciais",
});
const authService = require("./auth.js");

const paramValid = (name, reqParam, param, method) =>
	new Promise((resolve, reject) => {
		if (param.required) {
			if (!reqParam) return reject(`${name} e requerido`);
			if (method == "POST") {
				if (typeof reqParam !== typeof param.type()) {
					return reject(
						`${name}: ${typeof reqParam} deveria ser ${typeof param.type()}`
					);
				}
				if (typeof param.type() === "object") {
					Promise.all(
						Object.keys(param).map((x) =>
							paramValid(x, reqParam[x], param[x], req)
						)
					)
						.then(() => {
							resolve();
						})
						.catch((err) => {
							reject(`${name}.${err}`);
						});
				} else resolve();
			} else resolve();
		} else resolve();
	});

exports.parameters = (req, res, next) => {
	Promise.all(
		Object.keys(req.attr.schema).map((x) =>
			paramValid(x, req.reqParams[x], req.attr.schema[x], req.method)
		)
	)
		.then(() => {
			next();
		})
		.catch((err) => {
			res.status(500).send(`Parametro ${err}`);
		});
};

exports.login = requireLogin;
exports.auth = requireAuth;

exports.user = (reqParams, atributes, req) =>
	authService.roleAuthorization("user", req);

// exports.admin = (reqParams, atributes, req) =>
//   authService.roleAuthorization("admin", req);
