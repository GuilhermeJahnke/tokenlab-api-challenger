/**
* @module Service
* @description Modulo que os Serviços
*/

import processMiddleware from "../../http/processMiddleware";
import { tryCatch } from "../../commons/utils";
import Service from "../../models/Service";
const mongoose = require("mongoose");


/**
* @function create
* @description [POST] - Cria um Serviço
* @param {JSON} body
* @param {String} body.title Título do Serviço
* @param {String} body.description Descrição do Serviço
* @param {Boolean} body.active ativa ou inativa uma sala
* @returns {(Object | String )} code 200 (Success)
* @returns {Object | String } code 401 (Unauthorized)
* @returns {Object | Number} code 500 (Internal Server Error)
* @returns {Object | Array} code 500 (Internal Server Error)
* @returns {Array} code 500 (Internal Server Error)
*/

const createServiceFunction = (req,res)=>{
	const create = async ()=> {
		const { title, description } = req.body;
		if(!title || !description ){
			return res.status(400).json({message: "Parâmetros Inválidos"});
		}
		const [err, service] = await tryCatch(
			Service.create({ title, description })
		) ;
		if(err){
			return res.status(500).json({err});
		}

		return res.status(200).json(service);
	};
	create();
};
export const create = processMiddleware(createServiceFunction,{ schema: {}, methods: ["POST"], filters: ["auth/auth"] });

/**
* @function getAll
* @description [GET] - Retorna um array de todos os serviços
* @param {JSON} Token
* @returns {Object} code 200 (Success)
* @returns {String} code 401 (unauthorized)
* @returns {String} code 500 (Internal Server Error)
*/
const getAllFunction = (req, res) =>{
	const listAll = async ()=>{
		const service = Service.find({"active": true});
		service.exec((err, data) => {
			if (err) res.status(500).json(console.log(err));
			else res.status(200).json(data);
		});
	};
	listAll();
};
export const getAll = processMiddleware(getAllFunction, {schema: {}, methods: ["GET"], filters: ["auth/auth"]});

/**
* @function edit
* @description [POST] - Edita um Serviço
* @param {JSON} body
* @param {String} body.title Título do Serviço
* @param {String} body.description Descrição do Serviço
* @returns {(Object | String)} code 200 (Success)
* @returns {(Object | String) } code 401 (Unauthorized)
* @returns {(Object | Number)} code 500 (Internal Server Error)
* @returns {(Object | Array)} code 500 (Internal Server Error)
* @returns {Array} code 500 (Internal Server Error)
*/
const editFunction = (req, res) =>{
	const edit = async () => {
		const { title, description } = req.body;
		const [err, sucess] = await tryCatch(Service.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body._id) }, {title, description}).exec());
		if (err) return res.status(500).json({ message: "Erro ao editar sala: ", err });
		return res.status(200).json( sucess );
	};
	edit();
};
export const edit = processMiddleware(editFunction, {schema: {}, methods: ["POST"], filters: ["auth/auth"]});

/**
* @function deleteLocation
* @description [POST] - Inativa um Serviço
* @param {JSON} body
* @param {Model} body._id id da sala que vai ser inativada
* @returns {Object} code 200 (Success)
* @returns {Token} code 500 (Internal Server Error)
* @returns {Array} code 500 (Internal Server Error)
*/
const deleteFunction = (req, res) =>{
	const remove = async () => {
		const [err] = await tryCatch(Service.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body._id) }, {"active": false}).exec());
		if (err) return res.status(500).json({ message: "Erro ao tentar deletar sala: ", err });
		return res.status(200).json({ message: "Sala removida!" });
	};
	remove();
};
export const remove = processMiddleware(deleteFunction, {schema: {}, methods: ["POST"], filters: ["auth/auth"]});
