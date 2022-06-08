/**
* @module Events
* @description Modulo que gerencia os eventos
*/

import { checkAvailable, tryCatch } from "../../commons/utils";
import  Mongoose  from "mongoose";
import processMiddleware from "../../http/processMiddleware";
import moment from "moment";
import Events from "../../models/Events";
import ServiceSettings from "../../models/ServiceSettings";

/**
* @function Create
* @description [POST] - Cria reservas de horarios de acordo com o limite de horas registrado
* @param {JSON} body
* @param {Date} body.initAt horário inicial
* @param {Date} body.endAt horário final
* @param {String} body.description descrição do evento
* @param {Model} body.serviceRef id do serviço
* @param {Model} body.userRef id do serviço
* @param {Model} body.date dia que deseja reservar
* @returns {Object} code 200 (Success)
* @returns {String} code 500 (Internal Server Error)
*/
const createFunction = (req, res) =>{
	const create = async ()=> {
		const{ serviceRef, description, userRef, day, initAt, endAt } = req.body;
		if(!initAt || !endAt || !serviceRef || !day || !description || !userRef ){
			return res.status(400).json({message: "Parâmetros Inválidos!"});
		}
		let formatDay = moment(day).format("YYYY-MM-DD");
		let weekDay = moment(day).format("dddd");
		const [errFind, findedEvents] = await tryCatch(
			Events.findOne( {$and:[{"_id": Mongoose.Types.ObjectId(serviceRef)}, { "active":true}]}).exec()
		);
		if(errFind){
			return res.status(500).json({errFind});
		}
		if(findedEvents) {
			const objectDate = {
				initAt,
				endAt
			};
			const thisAvailable = await checkAvailable(day, serviceRef, objectDate);
			if(thisAvailable){
				const [err, events] = await tryCatch(
					Events.create({initAt, endAt, serviceRef, day: formatDay, weekDay })
				);
				if(err){
					return res.status(500).json({err});
				}
				return res.status(200).json({events});
			}
			return res.status(409).json({message: "Ocorreu um conflito ao tentar gerar uma reserva!"});
		} else {
			return res.status(401).json("Propriedade não encontrada");
		}
	};
	create();

};
export const create = processMiddleware(createFunction, {schema: {}, methods: ["POST"], filters: ["auth/auth"]});

/**
* @function GetAll
* @description [GET] - Retorna todos os eventos
* @param {JSON} Token
* @returns {Object} code 200 (Success)
* @returns {String} code 500 (Internal Server Error)
*/
const getAllFunction = async (req, res) => {
	const listAll = async () => {
		const events = Events.find({"active": true});
		events.exec((err, data) =>{
			if(err) return res.status(500).json(console.log(err));
			else return res.status(200).json(data);
		});
	};
	listAll();
};
export const getAll = processMiddleware(getAllFunction, {schema: {}, methods: ["GET"], filter: []});

/**
* @function Edit
* @description [POST] - Edita um evento
* @param {Date} body.initAt horário inicial
* @param {Date} body.endAt horário final
* @param {String} body.description descrição do evento
* @param {Model} body.serviceRef id do serviço
* @param {Model} body.userRef id do serviço
* @param {Model} body.date dia que deseja reservar
* @returns {Object} code 200 (Success)
* @returns {String} code 401 (unauthorized)
* @returns {String} code 500 (Internal Server Error)
*/
const editFunction = async (req, res) => {
	const data = req.body;
	const update = async () =>{
		let query = {
			$and:[
				{"active": true},
				{ "_id": Mongoose.Types.ObjectId(req.body._id)}
			]};
		const[err, sucess] = await tryCatch(Events.findOneAndUpdate(query, {...data}).exec());
		if(err) return res.status(500).json({message: "Erro ao editar", err});
		else return res.status(200).json(sucess);
	};
	update();
};
export const edit = processMiddleware(editFunction, {schema: {}, methods: ["POST"], filters: ["auth/auth"]});

/**
* @function Delete
* @description [POST] - Inativa um evento
* @param {JSON} body
* @param {Model} body._id id do evento
* @returns {Object} code 200 (Success)
* @returns {String} code 401 (unauthorized)
* @returns {String} code 500 (Internal Server Error)
*/
const deleteFunction = async (req,res) => {
	const remov = async () => {
		let query = {
			$and:[
				{"active": true},
				{ "_id": Mongoose.Types.ObjectId(req.body._id)},
			]};
		const [err] = await tryCatch(Events.findOneAndUpdate(query, {"active": false}).exec());
		if(err) return res.status(500).json({message: "Erro ao excluir", err});
		return res.status(200).json({message: "Removido com sucesso"});
	};
	remov();
};
export const remove = processMiddleware(deleteFunction, {schema: {}, methods: ["POST"], filters: ["auth/auth"]});


/**
* @function GetAvailableHours
* @description [GET] - Retorna todos os horarios indisponiveis e o limite de horas
* @param {JSON} body
* @param {ID} body.serviceID ID do Serviço
* @param {Date} body.date Dia para verificação
* @returns {Object} code 200 (Success)
* @returns {String} code 401 (unauthorized)
* @returns {String} code 500 (Internal Server Error)
*/
const getAvailableHoursFunction = async (req, res) => {
	const listAll = async () => {
		const { date, serviceID } =req.body;
		if(!date || !serviceID){
			return res.status(400).json({message: "Parâmetros Inválidos!"});
		}
		const [errSettings, locationsSettings] = await tryCatch(
			ServiceSettings.findOne( {$and:[{"serviceRef": Mongoose.Types.ObjectId(serviceID)}, { "active": true}]}).exec()
		);
		if(errSettings){
			return res.status(500).json({errSettings});
		}
		const daySelected = moment(date).add(4, "hours").format("dddd").toLowerCase();
		const daySettings = locationsSettings[daySelected];
		const [errFind, finded] = await tryCatch(
			Events.find( {$and:[
				{"serviceRef": Mongoose.Types.ObjectId(serviceID)},
				{ "active": true},
				{ "day":{  $eq: moment(date).format("YYYY-MM-DD") }},
			]}).exec()
		);
		if(errFind){
			return res.status(500).json({errFind});
		}

		// retorna as indisponiveis e o limite de horas
		// todos os que não estiverem indisponiveis no limite de horas,
		// é passivel de locação
		return res.status(200).json({
			hoursSettings: daySettings,
			hoursUnavailable: finded
		});
	};
	listAll();
};
export const getAvailableHours = processMiddleware(getAvailableHoursFunction, {schema: {}, methods: ["POST"], filters: []});