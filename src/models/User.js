import mongoose from "mongoose";
import { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
	{
		email: {
			type: String,
			lowercase: true,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		cpf: {
			type: String,
			required: true,
		},
		userInfo: {
			type: Schema.ObjectId,
			ref: "UserInfo"
		},
		active: {
			type: Boolean,
			default: true,
		}
	},
	{
		usePushEach: true,
		collection: "User",
		strict: false,
		timestamps: true,
	}
);

userSchema.pre("save", function (next) {
	if (!this.isModified("password")) {
		return next();
	}
	this.password = bcrypt.hashSync(this.password, 10);
	next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
	return bcrypt.compareSync(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
