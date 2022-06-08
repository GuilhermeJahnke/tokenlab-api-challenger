import mongoose from "mongoose";
import { Schema } from "mongoose";

const userInfoSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		lastName: {
			type: String,
			required: true,
		},
	},
	{
		usePushEach: true,
		collection: "UserInfo",
		strict: false,
		timestamps: true,
	}
);

export default mongoose.model("UserInfo", userInfoSchema);
