const fs = require("fs");
const filter = require("./filter");

function checkpath(pathUrl) {
	return new Promise((resolve, reject) => {
		const tempStep = pathUrl.split("/");
		const routeSteps = tempStep.slice(1);

		let path = "";
		let validPath = "";
		let validFile = "";
		for (let i = 0; i < routeSteps.length; i++) {
			path += `/${routeSteps[i]}`;
			try {
				const pathExist = fs.statSync(`src${path}`);
				validPath = path;
			} catch (err) {
				try {
					const fileExists = fs.statSync(`src${path}.js`);
					validFile = `${routeSteps[i]}.js`;
				} catch (err) {
					if (err.code === "ENOENT") {
						console.log("file or directory does not exist");
						reject("file or directory does not exist");
					}
				}
			}

			if (validPath !== "" && validFile !== "") {
				const method = pathUrl
					.split(validFile.replace(".js", "/"))
					.pop()
					.split("/")[0];

				const params = pathUrl.replace(
					`${validPath}/${validFile.replace(".js", "/")}${method}/`,
					""
				);
				return resolve({
					basePath: `${validPath}/${validFile.replace(".js", "")}`,
					controller: `..${validPath}/${validFile}`,
					method,
					params: params !== "" ? params.split("/") : [],
				});
			}
		}
	});
}

module.exports = (req, res, next) =>
	new Promise((resolve, reject) => {
		checkpath(req.path)
			.then((obj) => {
				const controller = require(obj.controller);
				const method = controller[obj.method];
				req.attr = method.options;
				if (
					req.attr.methods &&
          req.attr.methods.length > 0 &&
          !req.attr.methods.some((x) => x.toUpperCase() == req.method)
				) {
					reject("Método não permitido");
				}
				const result = filter.getList(req, res, next);
				req.customParams = obj.schema;
				result.push(method.callback);

				resolve({ path: `${obj.basePath}/${obj.method}`, result });
			})
			.catch((err) => {
				return reject(`Erro: ${JSON.stringify(err)}`);
			});
	});
