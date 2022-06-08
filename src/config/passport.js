import passport from "passport";
import User from "../models/User";
import config from "./auth";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";

const localOptions = {
	usernameField: "email",
	passwordField: "password",
	passReqToCallback: true,
};

const localLogin = new LocalStrategy(
	localOptions,
	(req, email, password, done) => {
		User.findOne({ email }).exec((err, user) => {
			if (err) {
				return done(err, false);
			}
			if (!user) {
				return done(null, false);
			}
			if (user.attempts < 3) {
				user.comparePassword(password, function (err, isMatch) {
					if (err) {
						return done(err, false);
					} else {
						if (!isMatch) {
							//user.attempts = user.attempts + 1
							user.save(function () {
								return done(null, false);
							});
						} else {
							// Sucesso
							return done(null, user);
						}
					}
				});
			} else {
				return done(null, false);
			}
		});
	}
);

const jwtOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: config.secret,
};

const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
	User.findById(payload._id).exec((err, user) => {
		if (err) {
			return done(err, false);
		}
		if (user) {
			return done(null, user);
		} else {
			return done(null, false);
		}
	});
});

passport.use(jwtLogin);
passport.use(localLogin);
