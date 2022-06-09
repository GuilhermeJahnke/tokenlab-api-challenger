/**
* @module Events
* @description Modulo que gerencia os eventos
*/

import { checkAvailable, checkAvailableForEdit, existsService, tryCatch } from "../../commons/utils";
import  Mongoose  from "mongoose";
import processMiddleware from "../../http/processMiddleware";
import moment from "moment";
import Events from "../../models/Events";

/**
* @function Create
* @description [POST] - Cria reservas de horarios de acordo com o limite de horas registrado
* @param {JSON} body
* @param {Date} body.initAt horário inicial
* @param {Date} body.endAt horário final
* @param {String} body.description descrição do evento
* @param {Model} body.serviceRef id do serviço
* @returns {Object} code 200 (Success)
* @returns {String} code 500 (Internal Server Error)
*/
const createFunction = (req, res) =>{
	const create = async ()=> {
		const{ serviceRef, description, initAt, endAt } = req.body;
		if(!initAt || !endAt || !serviceRef || !description ){
			return res.status(400).json({message: "Parâmetros Inválidos!"});
		}

		var findedService = await existsService(serviceRef);
		if(!findedService){
			return res.status(404).json({message: "Serviço não encontrado"});
		}

		const initAtSlot = moment(initAt);
		const endAtSlot = moment(endAt);

		if(initAtSlot.isAfter(endAtSlot)){
			return res.status(400).json({message: "O final do evento não pode ser antes do Inicio!"});
		}
		const objectDate = {
			initAt,
			endAt
		};
		const thisAvailable = await checkAvailable(serviceRef, objectDate);
		if(thisAvailable){
			const [err, events] = await tryCatch(
				Events.create({initAt, endAt, serviceRef, description, userRef: Mongoose.Types.ObjectId(req.user._id) })
			);
			if(err){
				return res.status(500).json({err});
			}
			return res.status(200).json({events});
		}
		return res.status(409).json({message: "Ocorreu um conflito ao tentar gerar um evento!"});

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
* @returns {Object} code 200 (Success)
* @returns {String} code 401 (unauthorized)
* @returns {String} code 500 (Internal Server Error)
*/
const editFunction = async (req, res) => {
	const{ serviceRef, description, initAt, endAt, eventID } = req.body;
	const update = async () =>{
		let query = {
			$and:[
				{"active": true},
				{ "_id": Mongoose.Types.ObjectId(eventID)}
			]};
		const objectDate = {
			initAt,
			endAt
		};
		const thisAvailable = await checkAvailableForEdit(serviceRef, objectDate, eventID);

		if(thisAvailable.length > 0){
			return res.status(409).json({message: "Ocorreu um conflito ao tentar gerar um evento!", conflictEvents: thisAvailable });
		}

		const[err, sucess] = await tryCatch(Events.findOneAndUpdate(query, {description, initAt, endAt}).exec());
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
* @function GetEventsForHours
* @description [GET] - Retorna todos os eventos dentro do range
* @param {JSON} body
* @param {ID} body.serviceID ID do Serviço
* @param {Date} body.initAt horário inicial
* @param {Date} body.endAt horário final
* @returns {Object} code 200 (Success)
* @returns {String} code 401 (unauthorized)
* @returns {String} code 500 (Internal Server Error)
*/
const getEventsForHoursFunction = async (req, res) => {
	const listAll = async () => {
		const { serviceID, initAt, endAt  } =req.body;
		if(!initAt || !endAt || !serviceID){
			return res.status(400).json({message: "Parâmetros Inválidos!"});
		}
		var findedService = await existsService(serviceID);
		if(!findedService){
			return res.status(404).json({message: "Serviço não encontrado"});
		}
		const initAtSlot = moment(initAt);
		const endAtSlot = moment(endAt);
		const [errFind, finded] = await tryCatch(
			Events.aggregate([
				{
					$match: {
						$and:[
							{"serviceRef": Mongoose.Types.ObjectId(serviceID)},
							{ "active": true},
							{
								$or:[
									{
										$and:[
											{"initAt": {$lte: initAtSlot.toDate()}}, // começo enviado é maior que o começo do slot
											{"endAt": {$gte: initAtSlot.toDate() }}, // começo enviado é menor que o fim do slot
										]
									},
									{
										$and:[
											{"initAt": {$lte: endAtSlot.toDate() }}, // fim enviado é maior que o começo do slot
											{"endAt": {$gte: endAtSlot.toDate() }}, // fim enviado é menor que o começo do slot
										]
									},
									{
										$and:[
											{"initAt": {$gte: initAtSlot.toDate()}}, // começo enviado é menor que o começo do slot
											{"endAt": {$lte: endAtSlot.toDate() }},  // fim enviado é maior que o começo do slot
										]
									},
									{
										$and:[
											{"initAt": {$eq: initAtSlot.toDate()}}, // começo enviado é menor que o começo do slot
											{"endAt": {$eq: endAtSlot.toDate() }},  // fim enviado é maior que o começo do slot
										]
									},
								]
							}
						]
					}
				},


			]).exec()
		);
		if(errFind){
			return res.status(500).json(errFind);
		}

		return res.status(200).json(finded);
	};
	listAll();
};
export const getEventsForHours = processMiddleware(getEventsForHoursFunction, {schema: {}, methods: ["POST"], filters: []});