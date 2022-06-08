/**
* @module Utils
* @description Modulo que gerencia os horários disponiveis
*/

import  Mongoose  from "mongoose";
import moment from "moment";
import Events from "../models/Events";
import ServiceSettings from "../models/ServiceSettings";
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
* @function setDiffDay
* @description [FUNCTION] - Iguala as datas para os calculos
* @param {Date} actualDate Data usada como base
* @param {Object} objectDate Inicio e o Fim que deve ser igualado
* @returns {Object} Inicio e o Fim formatado
*/
export const setDiffDay = (actualDate, objectDate) => {
	// is expected in this formatting:
	// objectDate:{
	// ...
	// 	initAt: Date,
	// 	endAt: Date
	// ...
	// };

	// needs to be revised and refactored
	const endOfDate = moment(actualDate).endOf("day");
	const endOfInit = moment(objectDate.initAt);
	const endOfEnd = moment(objectDate.endAt);

	const diffDaysInitAt = moment(endOfDate).endOf("day").diff(endOfInit, "days");
	const diffDaysEndAt = moment(endOfDate).endOf("day").diff(endOfEnd, "days");

	let settingsInitAt = endOfInit.add(diffDaysInitAt, "days");
	let settingsEndAt = endOfEnd.add(diffDaysEndAt, "days");

	return {
		initAt: settingsInitAt,
		endAt: settingsEndAt
	};
};

/**
* @function checkAvailable
* @description [FUNCTION] - Verifica a disponibilidade para criação do evento
* @param {Date} actualDate Data usada como base
* @param {ID} locationID ID da location
* @param {Object} objectDate Inicio e o Fim que deve ser igualado
* @returns {Object} Inicio e o Fim formatado
*/
export const checkAvailable = (date, serviceID, objectDate) =>{
	return new Promise(async function (resolve, reject) {

		// remove o fuso horario
		const day = moment( moment(date).format("YYYY-MM-DD")).subtract(3, "hours").toDate();
		const initAtSlot = moment(objectDate.initAt);
		const endAtSlot = moment(objectDate.endAt);

		const availableWithSettings = await checkSettings(date, serviceID, objectDate);
		if(!availableWithSettings){
			resolve(false);
		}
		const [errFind, finded] = await tryCatch(
			Events.aggregate([
				{
					$match: {
						$and:[
							{"serviceRef": Mongoose.Types.ObjectId(serviceID)},
							{ "active": true},
							{ "day":{  $eq: day }},
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
* @function checkSettings
* @description [FUNCTION] - Verifica se os horários estão de acordo com os limites de horas
* @param {Date} actualDate Data usada como base
* @param {ID} serviceID ID da location
* @param {Object} objectDate Inicio e o Fim que deve ser igualado
* @returns {Boolean} Retorna true caso esteja dentro do limite
*/
export const checkSettings = (date, serviceID, objectDate) => {
	return new Promise(async function (resolve, reject) {

		const initAtSlot = moment(objectDate.initAt);
		const endAtSlot = moment(objectDate.endAt);
		const daySelected = moment(date).format("dddd").toLowerCase();

		const [errSettings, locationsSettings] = await tryCatch(
			ServiceSettings.findOne( {$and:[{"serviceRef": Mongoose.Types.ObjectId(serviceID)}, { "active": true}]}).exec()
		);
		if(errSettings){
			reject(errSettings);
		}
		const daySettings = setDiffDay(date, locationsSettings[daySelected]);

		const settingsInit = moment(daySettings.initAt);
		const settingsEnd = moment(daySettings.endAt);

		const AfterBefore = initAtSlot.isAfter(settingsInit, "hours") && endAtSlot.isBefore(settingsEnd, "hours");
		const Same = initAtSlot.isSame(settingsInit, "hours") && endAtSlot.isSame(settingsEnd, "hours");
		const SameBefore =  initAtSlot.isSame(settingsInit, "hours") && endAtSlot.isBefore(settingsEnd, "hours");
		const AfterSame =  initAtSlot.isAfter(settingsInit, "hours") && endAtSlot.isSame(settingsEnd, "hours");
		const SameHour =  initAtSlot.isSame(endAtSlot, "hours");

		if(SameHour){
			resolve(false);
		}

		resolve(AfterBefore || Same || SameBefore || AfterSame);

	});
};

/**
* @function isEmptySettings
* @description [FUNCTION] - Verifica se possui algum evento apartir de uma data
* @param {Date} date Data usada como base
* @param {ID} serviceID ID da location
* @returns {Boolean} Retorna true caso ele esteja vazio
*/
export const isEmptySettings = (serviceID, date) => {
	return new Promise(async function (resolve, reject) {
		const day =moment( moment(date).format("YYYY-MM-DD")).subtract(3, "hours").toDate();
		const [errSettings, locationsSettings] = await tryCatch(
			Events.aggregate([
				{
					$match: {
						$and:[
							{"serviceRef": Mongoose.Types.ObjectId(serviceID)},
							{ "active": true},
							{ "day":{  $gte: day }},
						]
					}
				},


			]).exec()
		);
		if(errSettings){
			reject(errSettings);
		}
		resolve(locationsSettings.length > 0 ? false : true);
	});
};


/**
* @function verifyExistsSettings
* @description [FUNCTION] - Verifica se possui algum limite ja definido para o serviço
* @param {ID} serviceID ID da serviço
* @returns {Boolean} Retorna true caso ele esteja vazio
*/
export const verifyExistsSettings = (serviceID) => {
	return new Promise(async function (resolve, reject) {
		const [errFind, finded] = await tryCatch(
			ServiceSettings.findOne({$and:[
				{"serviceRef": Mongoose.Types.ObjectId(serviceID)},
				{ "active": true}
			]})
		);
		if (errFind) {
			reject(errFind);
		}
		resolve(finded ? true : false);
	});
};

/**
* @function existsService
* @description [FUNCTION] - Verifica se o serviço existe
* @param {ID} serviceID ID da serviço
* @returns {Boolean} Retorna true caso ele esteja vazio
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
