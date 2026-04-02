import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    revoked: {
        type: Boolean,
        default: false  
    },
  },
  { timestamps: true }
);

const SessionModel = mongoose.model("Session", sessionSchema);

export default SessionModel;