import mongoose, { Schema } from "mongoose";
import { hashPassword, accessTokenGenerator, refreshTokenGenerator, isPasswordCorrect } from "./user.model.query.js";


const userSchema = new Schema(
  {
    watchHistory: [
      {
        videoId:{
          type: Schema.Types.ObjectId,
          ref: "Video"
        }
      }
    ],
    userName: {
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
    fullName: {
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

// middleware 
userSchema.pre("save", hashPassword)

// methods
userSchema.methods.isPasswordCorrect = isPasswordCorrect;
userSchema.methods.accessTokenGenerator = accessTokenGenerator;
userSchema.methods.refreshTokenGenerator = refreshTokenGenerator;

const User = mongoose.model("User", userSchema);

export { User };
