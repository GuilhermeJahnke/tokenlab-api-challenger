exports.getList = (req, res) => {
	try {
		// cria uma lista de middlewares
		// let list = ["log/initial"];
		let list = ["filters/parameters"];
		if (req.attr.filters) list = list.concat(req.attr.filters);

		// retorna uma lista de funções
		return list.map((item) => {
			const file = item.split("/")[0];
			const filePath = `../services/${file}.js`;

			// pega os parametros da request
			if (req.method === "POST") {
				req.reqParams = req.body ? JSON.parse(JSON.stringify(req.body)) : "";
			}
			if (req.method === "GET") {
				req.reqParams = req.query ? JSON.parse(JSON.stringify(req.query)) : "";
			}
			// retorna a função
			const func = item.split("/")[1];
			const controller = require(filePath);
			return controller[func];

		});
	} catch (err) {
		res.status(500).send("Erro: consulte o terminal para detalhes");
	}
};
