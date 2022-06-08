import mongoose from "mongoose";
import { Schema } from "mongoose";

const EventsSchema = new Schema(
	{
		serviceRef: {
			type: Schema.ObjectId,
		},
		description: {
			type: String,
			required: true
		},
		userRef: {
			type: Schema.ObjectId,
		},
		day: {
			type: Date,
			required: true
		},
		weekDay: {
			type: String,
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
