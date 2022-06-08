import mongoose from "mongoose";
import { Schema } from "mongoose";

const ServiceSettingsSchema = new Schema(
	{
		serviceRef: {
			type: Schema.ObjectId,
			required: true,
		},
		monday: {
			initAt: {
				type: Date,
			},
			endAt: {
				type: Date,
			},
			interval: {
				type: Number,
				default: 0,
			},
		},
		tuesday: {
			initAt: {
				type: Date,
			},
			endAt: {
				type: Date,
			},
			interval: {
				type: Number,
				default: 0,
			},
		},
		wednesday: {
			initAt: {
				type: Date,
			},
			endAt: {
				type: Date,
			},
			interval: {
				type: Number,
				default: 0,
			},
		},
		thursday: {
			initAt: {
				type: Date,
			},
			endAt: {
				type: Date,
			},
			interval: {
				type: Number,
				default: 0,
			},
		},
		friday: {
			initAt: {
				type: Date,
			},
			endAt: {
				type: Date,
			},
			interval: {
				type: Number,
				default: 0,
			},
		},
		saturday: {
			initAt: {
				type: Date,
			},
			endAt: {
				type: Date,
			},
			interval: {
				type: Number,
				default: 0,
			},
		},
		sunday: {
			initAt: {
				type: Date,
			},
			endAt: {
				type: Date,
			},
			interval: {
				type: Number,
				default: 0,
			},
		},
		active:{
			type: Boolean,
			default: true,
		}
	},
	{
		collection: "ServiceSettings",
		strict: false,
		timestamps: true,
	}
);

export default mongoose.model("ServiceSettings", ServiceSettingsSchema);
