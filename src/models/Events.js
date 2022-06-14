import mongoose from "mongoose";
import { Schema } from "mongoose";

const EventsSchema = new Schema(
	{
		serviceRef: {
			type: Schema.ObjectId,
			required: true
		},
		title: {
			type: String,
			required: true
		},
		description: {
			type: String,
			required: true
		},
		userRef: {
			type: Schema.ObjectId,
			required: true
		},
		initAt: {
			type: Date,
			required: true
		},
		endAt: {
			type: Date,
			required: true
		},
		active:{
			type: Boolean,
			default: true,
		}
	},
	{
		collection: "Events",
		strict: false,
		timestamps: true,
	}
);

export default mongoose.model("Events", EventsSchema);
