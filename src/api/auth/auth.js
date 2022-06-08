/**
* @module Auth
* @description Modulo de autenticação
*/

import User from "../../models/User";
import UserInfo from "../../models/userInfo";
import processMiddleware from "../../http/processMiddleware";

/**
* @function getProtected
* @description [POST] - Cria um usuário ativo e seta uma permissão inicial
* @param {JSON} body
* @param {String} body.email email do usuário
* @param {String} body.password senha do usuário
* @param {String} body.confirmPassword confirmação de senha
* @param {String} body.cpf cpf do usuário
* @returns {(Object | String)} code 200 (Success)
* @returns {Number} code 500 (Internal Server Error)
* @returns {Array} code 500 (Internal Server Error)
* @returns {(Email | CPF)} code 400 (Bad Request)
*/
const protectedFunction = (req,res)=>{
	const checkProtected = async ()=> {
		var _id = req.user._id;
		const user = await User.findOne({_id, "active": true}).populate({path: "userInfo", model: UserInfo}).select(" -password ");
		if (!user) {
			return res.status(400).json({ message: "Usuário não encontrado" });
		} else {
			return res.status(201).json(user);
		}
	};
	checkProtected();
};
export const getProtected = processMiddleware(protectedFunction,{ schema: {}, methods: ["GET"], filters: ["auth/auth"] });