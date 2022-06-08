import mongoose from "mongoose";
import { Schema } from "mongoose";

const ServiceSchema = new Schema(
	{
		title: {
			type: String,
			required: true,
			uppercase: false,
		},
		description: {
			type: String,
			required: true,
			uppercase: false,
		},
		active: {
			type: Boolean,
			default: true,
		},
	},
	{
		collection: "Service",
		strict: false,
		timestamps: true,
	}
);

export default mongoose.model("Service", ServiceSchema);
