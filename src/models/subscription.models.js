/* 
    id string pk
    subscriber ObjectId users
    channel ObjectId users
    createdAt Date
    updatedAt Date 
*/

import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber:
        {
            type: Schema.Types.ObjectId, // one who IS SUBSCRIBING
            ref: "User",
        },
        channel: {
            // one to WHOM `subscriber` is SUBSCRIBING.
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true } // createdAt and updatedAt is added here
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema);