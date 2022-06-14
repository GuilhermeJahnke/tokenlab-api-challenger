/**
* @module User
* @description Modulo que gerencia o Usuário
*/

import User from "../../models/User";
import UserInfo from "../../models/UserInfo";
import processMiddleware from "../../http/processMiddleware";
import { generateToken, user } from "../../services/auth";
import { tryCatch } from "../../commons/utils";
import mongoose from "mongoose";
import { validate } from "gerador-validador-cpf";


/**
* @function create
* @description [POST] - Cria um usuário ativo e seta uma permissão inicial
* @param {JSON} body
* @param {String} body.email email do usuário
* @param {String} body.password senha do usuário
* @param {String} body.confirmPassword confirmação de senha
* @param {String} body.cpf cpf do usuário
* @param {String} body.name nome do usuário
* @param {String} body.lastName ultimo nome do usuário
* @returns {(Object | String)} code 200 (Success)
* @returns {Number} code 500 (Internal Server Error)
* @returns {Array} code 500 (Internal Server Error)
*/
const createFunction = (req, res) => {
	const create = async () => {
		const {  password, confirmPassword, name, lastName } = req.body;
		let { cpf, email } = req.body;
		cpf = cpf.replace(/\D/g, "");
		email = email.toLowerCase().trim();
		if (!email || !password || !confirmPassword || !cpf || !name || !lastName) {
			return res.status(500).json({ message: "Preencha todos os campo" });
		}
		const userExists = await User.findOne({ email });
		if (userExists) {
			return res.status(400).json({ message: "Email já cadastrado" });
		}
		const cpfExists = await User.findOne({ cpf });
		if (cpfExists) {
			return res.status(400).json({ message: "CPF já cadastrado" });
		}
		const ValidadeCpf = validate(cpf);

		if (!ValidadeCpf) {
			return res.status(400).json({ message: "CPF Inválido" });
		}

		if (password !== confirmPassword) {
			return res.status(400).json({ message: "Senhas não correspondentes" });
		}

		const [err, userID] = await tryCatch(
			UserInfo.create({ name, lastName })
		);
		if (err) {
			return res.status(500).json({ err });
		}
		const userInfo = mongoose.Types.ObjectId(userID._id);

		const user = new User({ email, password, cpf, userInfo });

		const [errCreated, userCreate] = await tryCatch(
			user.save()
		);
		if (errCreated) {
			return res.status(500).json({ errCreated });
		}

		return res.status(200).json({ userCreate });
	};
	create();
};
export const create = processMiddleware(createFunction, { schema: {}, methods: ["POST"], filters: [] });

/**
* @function getAll
* @description [GET] - Retorna um array de todos os usúario, tanto ativos como inativos
* @param {JSON} body
* @returns {Object} code 200 (Success)
* @returns {String} code 401 (unauthorized)
* @returns {String} code 500 (Internal Server Error)
*/
const getAllFunction = (req, res) => {
	const listAll = async () => {
		const users = User.find({ "active": true }).populate("userInfo");
		users.exec((err, data) => {
			if (err) res.status(500).json(err);
			else res.status(200).json(data);
		});
	};
	listAll();
};
export const getAll = processMiddleware(getAllFunction, { schema: {}, methods: ["GET"], filters: ["auth/auth"] });

/**
* @function edit
* @description [POST] - Edita os dados do usuário apartir do token
* @param {JSON} body
* @param {String} body.email campo email
* @param {String} body.password campo senha
* @param {String} body.cpf campo cpf
* @param {String} body.name nome do usuário
* @param {String} body.lastName ultimo nome do usuário
* @returns {(Object | String)} code 200 (Success)
* @returns {(Object | Number)} code 500 (Internal Server Error)
* @returns {Array} code 500 (Internal Server Error)
*/
const editFunction = (req, res) => {
	const { email, password, cpf, confirmPassword, name, lastName } = req.body;
	const edit = async () => {
		const [errGet, user] = await tryCatch(User.findOne({ _id: mongoose.Types.ObjectId(req.user._id) }).exec());
		if (errGet) return res.status(500).json({ message: "Erro ao encontrar usuario: ", err });

		if (password != null && password.length > 0) {
			if (password != confirmPassword) {
				return res.status(500).json({ message: "Senhas Divergentes" });
			}
			user.password = password;
		}
		if(email){
			user.email = email;
		}
		if(cpf){
			user.cpf = cpf;
		}
		await user.save();

		const [err] = await tryCatch(UserInfo.findOneAndUpdate({ _id: mongoose.Types.ObjectId(user.userInfo) }, { name, lastName }).exec());

		if (err) return res.status(500).json({ message: "Erro ao salvar usuário: ", err });
		return res.status(200).json({ message: "Usuário atualizado com sucesso!" });
	};
	edit();
};
export const edit = processMiddleware(editFunction, { schema: {}, methods: ["POST"], filters: ["auth/auth"] });

/**
* @function delete
* @description [POST] - Inativa um usuário apartir do token
* @param {JSON} body
* @returns {Object} code 200 (Success)
* @returns {Token} code 500 (Internal Server Error)
* @returns {Array} code 500 (Internal Server Error)
*/
const deleteFunction = (req, res) => {
	const remove = async () => {
		const [err] = await tryCatch(User.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.user._id) }, { "active": false }).exec());
		if (err) return res.status(500).json({ message: "Erro ao tentar deletar usuário: ", err });
		return res.status(200).json({ message: "Usuário deletado!" });
	};
	remove();
};
export const remove = processMiddleware(deleteFunction, { schema: {}, methods: ["POST"], filters: ["auth/auth"] });

/**
* @function login
* @description [POST] - Faz login e gera um Token
* @param {JSON} body
* @param {String} body.email email do usuário
* @param {String} body.cpf cpf do usuário
* @param {String} body.password senha do usuário
* @returns {(Object | String)} code 200 (Success)
* @returns {(Object | String)} code 400 (Bad Request)
* @returns {(Object | Number)} code 500 (Internal Server Error)
* @returns {(Array | String)} code 500 (Internal Server Error)
* @returns {(Array | Number)} code 500 (Internal Server Error)
*/
const loginFunction = (req, res) => {
	const login = async () => {
		const { login, password } = req.body;
		const ValidadeCpf = validate(login);
		let user;
		if (!ValidadeCpf) {
			 user = await User.findOne({ email:login, "active": true}).exec();
		} else {
			var cpfFormated = login.replace(/\D/g, "");
			 user = await User.findOne({ cpf:cpfFormated, "active": true}).exec();
		}
		if (!user) {
			return res.status(400).json({ message: "Usuário não encontrado" });
		}

		const isMatch = user.comparePassword(password);
		if (!isMatch) {
			return res.status(400).json({ message: "Senha incorreta" });
		}

		const token = generateToken({ _id: user._id, login });

		return res.status(200).json({ user: user._id, token });
	};
	login();
};
export const login = processMiddleware(loginFunction, { schema: {}, methods: ["POST"], filters: [] });

/**
* @function forgotPassword
* @description [POST] - Envia uma senha provisória para o usuário
* @param {JSON} body
* @param {String} body.email email para alteração e envio da senha
* @returns {(object| String)} code 200 (Success)
* @returns {(Object | String)} code 400 (Bad Request)
* @returns {(Object | Number)} code 500 (Internal Server Error)
* @returns {(Array | String)} code 500 (Internal Server Error)
* @returns {(Array | Number)} code 500 (Internal Server Error)
*/
const forgotPasswordFunction = (req, res) => {
	const resetPassword = async () => {
		const passwordRandom = Math.random().toString(36).slice(-8);
		const { email } = req.body;
		const user = await User.findOne({ email, "active": true }).exec();

		if (!user) {
			return res.status(400).json({ message: "Usuário não encontrado" });
		}

		user.password = passwordRandom;
		await user.save();
	};
	resetPassword();
};
export const forgotPassword = processMiddleware(forgotPasswordFunction, { schema: {}, methods: ["POST"], filters: [] });


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