/**
* @module ServiceSettings
* @description Modulo que gerencia as configurações de disponibilidade
*/

import processMiddleware from "../../http/processMiddleware";
import { existsService, isEmptySettings, tryCatch, verifyExistsSettings } from "../../commons/utils";
import ServiceSettings from "../../models/ServiceSettings";
const mongoose = require("mongoose");

/**
* @function create
* @description [POST] - Cria uma configuração de limites diarios
* @param {JSON} body
* @param {Model} body.serviceRef Vinculo com o Serviço
* @param {Object} body.monday Segunda-feira
* @param {Date} body.monday.initAt Horario inicial
* @param {Date} body.monday.endAt Horario final
* @param {Number} body.monday.interval Intervalo entre cada horario
* @param {Object} body.tuesday Terça-feira
* @param {Date} body.tuesday.initAt Horario inicial
* @param {Date} body.tuesday.endAt Horario final
* @param {Number} body.tuesday.interval Intervalo entre cada horario
* @param {Object} body.wednesday Quarta-feira
* @param {Date} body.wednesday.initAt Horario inicial
* @param {Date} body.wednesday.endAt Horario final
* @param {Number} body.wednesday.interval Intervalo entre cada horario
* @param {Object} body.thursday Quinta-feira
* @param {Date} body.thursday.initAt Horario inicial
* @param {Date} body.thursday.endAt Horario final
* @param {Number} body.thursday.interval Intervalo entre cada horario
* @param {Object} body.friday Sexta-feira
* @param {Date} body.friday.initAt Horario inicial
* @param {Date} body.friday.endAt Horario final
* @param {Number} body.friday.interval Intervalo entre cada horario
* @param {Object} body.saturday Sabado
* @param {Date} body.saturday.initAt Horario inicial
* @param {Date} body.saturday.endAt Horario final
* @param {Number} body.saturday.interval Intervalo entre cada horario
* @param {Object} body.sunday Domingo
* @param {Date} body.sunday.initAt Horario inicial
* @param {Date} body.sunday.endAt Horario final
* @param {Number} body.sunday.interval Intervalo entre cada horario
* @returns {(Object | String)} code 200 (Success)
* @returns {Number} code 500 (Internal Server Error)
* @returns {Array} code 500 (Internal Server Error)
* @returns {String} code 401 (unauthorized)
*/
const createFunction = (req, res) => {
	const create = async () => {
		const { serviceRef, monday, tuesday, wednesday, thursday, friday, saturday, sunday } = req.body;
		if (!serviceRef || !monday || !tuesday || !wednesday || !thursday || !friday || !saturday || !sunday ) {
			return res.status(500).json({ message: "Preencha todos os campo" });
		}
		var settingsExists = await verifyExistsSettings(serviceRef);
		if(settingsExists){
			return res.status(409).json({message: "Conflito Detectado, limite já cadastrado!"});
		}
		var serviceExists = await existsService(serviceRef);
		if(!serviceExists){
			return res.status(404).json({message: "Serviço não encontrado!"});
		}
		const [err, preferences] = await tryCatch(
			ServiceSettings.create({ serviceRef, monday, tuesday, wednesday, thursday, friday, saturday, sunday  })
		);
		if (err) {
			return res.status(500).json({ err });
		}

		return res.status(200).json(preferences);
	};
	create();
};
export const create = processMiddleware(createFunction, { schema: {}, methods: ["POST"], filters: ["auth/auth"] });

/**
* @function getAll
* @description [GET] - Retorna os configurações
* @param {JSON} Token
* @returns {Object} code 200 (Success)
* @returns {String} code 401 (unauthorized)
* @returns {String} code 500 (Internal Server Error)
*/
const getAllFunction = (req, res) => {
	const listAll = async () => {
		const preferences = ServiceSettings.find({ "active": true });
		preferences.exec((err, data) => {
			if (err) res.status(500).json(console.log(err));
			else res.status(200).json(data);
		});
	};
	listAll();
};
export const getAll = processMiddleware(getAllFunction, { schema: {}, methods: ["GET"], filters: ["auth/auth"] });

/**
* @function getByLocationID
* @description [GET] - Retorna a settings de uma location
* @param {JSON} body
* @param {Model} body.serviceID ID usado para buscar
* @returns {Object} code 200 (Success)
* @returns {String} code 401 (unauthorized)
* @returns {String} code 500 (Internal Server Error)
*/
const getByServiceIDFunction = (req, res) => {
	const listAll = async () => {
		const { serviceID } = req.body;
		const preferences = ServiceSettings.findOne({$and:[
			{"serviceRef": mongoose.Types.ObjectId(serviceID)},
			{ "active": true}
		]});
		preferences.exec((err, data) => {
			if (err) res.status(500).json(console.log(err));
			else res.status(200).json(data);
		});
	};
	listAll();
};
export const getByServiceID = processMiddleware(getByServiceIDFunction, { schema: {}, methods: ["POST"], filters: ["auth/auth"] });


/**
* @function edit
* @description [POST] - Edita os dados da configuração
* @param {JSON} body
* @param {Model} body.serviceRef Vinculo com o Serviço
* @param {Object} body.monday Segunda-feira
* @param {Date} body.monday.initAt Horario inicial
* @param {Date} body.monday.endAt Horario final
* @param {Number} body.monday.interval Intervalo entre cada horario
* @param {Object} body.tuesday Terça-feira
* @param {Date} body.tuesday.initAt Horario inicial
* @param {Date} body.tuesday.endAt Horario final
* @param {Number} body.tuesday.interval Intervalo entre cada horario
* @param {Object} body.wednesday Quarta-feira
* @param {Date} body.wednesday.initAt Horario inicial
* @param {Date} body.wednesday.endAt Horario final
* @param {Number} body.wednesday.interval Intervalo entre cada horario
* @param {Object} body.thursday Quinta-feira
* @param {Date} body.thursday.initAt Horario inicial
* @param {Date} body.thursday.endAt Horario final
* @param {Number} body.thursday.interval Intervalo entre cada horario
* @param {Object} body.friday Sexta-feira
* @param {Date} body.friday.initAt Horario inicial
* @param {Date} body.friday.endAt Horario final
* @param {Number} body.friday.interval Intervalo entre cada horario
* @param {Object} body.saturday Sabado
* @param {Date} body.saturday.initAt Horario inicial
* @param {Date} body.saturday.endAt Horario final
* @param {Number} body.saturday.interval Intervalo entre cada horario
* @param {Object} body.sunday Domingo
* @param {Date} body.sunday.initAt Horario inicial
* @param {Date} body.sunday.endAt Horario final
* @param {Number} body.sunday.interval Intervalo entre cada horario
* @returns {(Object | String)} code 200 (Success)
* @returns {(Object | Number)} code 500 (Internal Server Error)
* @returns {Array} code 500 (Internal Server Error)
*/
const editFunction = (req, res) => {
	const data = req.body;
	delete data.active;

	let query = {
		$and:[
			{"active": true},
			{ "_id": mongoose.Types.ObjectId(req.body._id)}
		]};

	const edit = async () => {
		const IsEmpty = await isEmptySettings(req.body.serviceID, req.body.date);
		if(!IsEmpty){
			return res.status(409).json({ message: "Não é possivel editar o limite, pois existem reservas futuras"});
		}
		const [err, sucess] = await tryCatch(ServiceSettings.findOneAndUpdate(query, { ...data }).exec());
		if (err) return res.status(500).json({ message: "Erro ao editar card: ", err });
		return res.status(200).json(sucess);
	};
	edit();
};
export const edit = processMiddleware(editFunction, { schema: {}, methods: ["POST"], filters: ["auth/auth"] });

/**
* @function remove
* @description [POST] - Inativa uma configuração
* @param {JSON} body
* @param {JSON} body._id
* @returns {Object} code 200 (Success)
* @returns {Token} code 500 (Internal Server Error)
* @returns {Array} code 500 (Internal Server Error)
*/
const deleteFunction = (req, res) => {
	let query = {
		$and:[
			{"active": true},
			{ "_id": mongoose.Types.ObjectId(req.body._id)}
		]};
	const remove = async () => {
		const [err] = await tryCatch(ServiceSettings.findOneAndUpdate(query, { "active": false }).exec());
		if (err) return res.status(500).json({ message: "Erro ao tentar deletar card: ", err });
		return res.status(200).json({ message: "Card deletado!" });
	};
	remove();
};
export const remove = processMiddleware(deleteFunction, { schema: {}, methods: ["POST"], filters: ["auth/auth"] });
