/**
* @module Auth
* @description Modulo de autenticação em serviços
*/

import jwt from "jsonwebtoken";
import passport from "passport";
import authConfig from "../config/auth";
const requireAuth = passport.authenticate("jwt", { session: false }),
	requireLogin = passport.authenticate("local", {
		session: false,
		badRequestMessage: "Digite as credenciais",
	});

export const generateToken = (user) => {
	return jwt.sign(user, authConfig.secret, { expiresIn: "30 days" });
};

export const setUserInfo = (user) => {
	return {
		_id: user._id,
		email: user.email,
	};
};

export const login = requireLogin;

export const auth = requireAuth;

const roleAuthorization = (role, req) => {

	return new Promise((resolve, reject) => {
		if(req.user.role == role) resolve(req.user);
		else reject("Error, should have " + role + " role");
	});
};
export const user = (reqParams, atributes, req) => {  return roleAuthorization( "user", req );};