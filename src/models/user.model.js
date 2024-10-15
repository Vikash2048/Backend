import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    watchHistory: [
      {
        videoId: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      }
    ],
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lower: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String, // store cloudinary url
      required: true,
    },
    coverImage:{
      type: String,
    },
    password: {
      type: String,
      required: [true, "Password required"]
    },
    refreshToken: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export { User, userSchema };
