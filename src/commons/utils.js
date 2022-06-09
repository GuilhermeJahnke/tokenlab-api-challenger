/**
* @module Utils
* @description Modulo que gerencia os horários disponiveis
*/

import  Mongoose  from "mongoose";
import moment from "moment";
import Events from "../models/Events";
import Service from "../models/Service";

/**
* @function tryCatch
* @param {JSON} Promise
* @returns {Object} first params is error (Error)
* @returns {Object} second params is result (Success)
*/
export const tryCatch = (promise) => {
	// await without try, catch
	return promise
		.then((data) => {
			return [null, data];
		})
		.catch((err) => [err]);
};


/**
* @function checkAvailable
* @description [FUNCTION] - Verifica a disponibilidade para criação do evento
* @param {ID} serviceID ID do serviço
* @param {Object} objectDate Inicio e o Fim que deve ser igualado
* @returns {Boolean} Retorna true caso esteja disponivel
*/
export const checkAvailable = ( serviceID, objectDate) =>{
	return new Promise(async function (resolve, reject) {

		const initAtSlot = moment(objectDate.initAt);
		const endAtSlot = moment(objectDate.endAt);

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
			reject(errFind);
		}
		finded.length > 0 ? resolve(false) : resolve(true);
	});
};

/**
* @function checkAvailableForEdit
* @description [FUNCTION] - Verifica se existe algum evento nos horarios escolhidos para edição
* @param {ID} serviceID ID do serviço
* @param {ID} eventID ID do evento
* @param {Object} objectDate Inicio e o Fim que deve ser igualado
* @returns {Array} eventos conflitantes
*/
export const checkAvailableForEdit = ( serviceID, objectDate, eventID) =>{
	return new Promise(async function (resolve, reject) {

		const initAtSlot = moment(objectDate.initAt);
		const endAtSlot = moment(objectDate.endAt);

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
			reject(errFind);
		}
		let conflictEvents = [];
		for (let i = 0; i < finded.length; i++) {
			const element = finded[i];
			const isSame = String(element._id) === String(eventID);
			if(!isSame){
				conflictEvents.push(element);
			}
		}

		 resolve(conflictEvents);
	});
};

/**
* @function existsService
* @description [FUNCTION] - Verifica se o serviço existe
* @param {ID} serviceID ID da serviço
* @returns {Boolean} Retorna true caso o serviço exista
*/
export const existsService = (serviceID) => {
	return new Promise(async function (resolve, reject) {
		const [errFind, finded] = await tryCatch(
			Service.findOne({$and:[
				{"_id": Mongoose.Types.ObjectId(serviceID)},
				{ "active": true}
			]})
		);
		if (errFind) {
			reject(errFind);
		}
		resolve(finded ? true : false);
	});
};
