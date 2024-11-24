import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler( async (req, res) => {
  const { userName, email, fullName, password } = req.body;

  // checking that any field is empty or not
  if (
    [userName, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }

  // checking user already exist or not
  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existedUser) throw new ApiError(409, "User already exist");

  const avatarLocalPath = await req.files?.avatar[0]?.path;
  const coverImageLocalPath = await req.files?.coverImage[0]?.path;

  console.log("avatar: ", avatarLocalPath);
  console.log("coverImage: ", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar image not found");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // checking that avatar image in successfully uploaded on cloudinary or not
  if (!avatar) {
    throw new ApiError(
      400,
      "avatar file is required unable to upload image on cloud"
    );
  }

  const user = await User.create({
    fullName,
    email,
    userName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  // if user created successfully or not
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500, "Something went wrong user not created");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "User registered Successfully"));
});

const generateAccessAndRefreshToken = asyncHandler( async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.accessTokenGenerator();
    const refreshToken = user.refreshTokenGenerator();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); //bcs it will update all other data also 
    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh token"
    );
  }
});

const loginUser = asyncHandler( async (req, res) => {
  const { userName, email, password } = req.body;
  console.log("req.user",req.user)

  if (!userName && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // find user
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  
  if (!user) {
    throw new ApiError(400, "user does not exist");
  }
  // pass check
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // send cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler( async (req,res) => {
  // delete cookies and refresh token from the user model
  const userId = req.user._id

  const u = await User.findByIdAndUpdate(
    userId,
    {
      $unset:{
        refreshToken: ""
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "user logged out"))
   
})

const refreshAccessToken = asyncHandler( async (req,res) => {
  const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incommingRefreshToken){
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    const decodeToken = jwt.verify(incommingRefreshToken, REFRESH_TOKEN_SECRET)
  
    if (!decodeToken){
      throw new ApiError(401,"token not available")
    }
  
    const user = await User.findById(decodeToken?._id)
  
    if (!user){
      throw new ApiError(401, "invalid refresh token")
    }
  
    if (incommingRefreshToken !== user?.refreshToken){
      throw new ApiError(400, "refresh token is expired or used")
    }
  
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user?._id)
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(200,{accessToken,refreshToken: newRefreshToken},
        "token updated"
      )
    )
  } catch (err) {
    throw new ApiError(401, err?.message || "invalid refresh token")
  }


})

const changeCurrentPassword = asyncHandler( async(req,res) => {
  const { oldPassword, newPassword, confPassword } = req.body

  if (newPassword !== confPassword){
    throw new ApiError(400,"Password didn't match")
  }

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect) {
    throw new ApiError(400,"Invalid old password")
  }

  user.password = newPassword
  user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(200, {}, "Password Change Successfully")
})

const getCurrentUser = asyncHandler( async(req, res) => {
  const currentUser = req.user

  return res 
  .status(200)
  .json(200, {currentUser}, "Current User Fetch Successfully")
})

// update rest of ther detail as your need 
const updateAvatarImage = asyncHandler( async(req, res) => {
  const avatarImgPath = req.file?.path

  if(!avatarImgPath){
    throw new ApiError(400,"File path not found")
  }

  const avatar = uploadOnCloudinary(avatarImgPath)

  if(!avatar){
    throw new ApiError(400,"File not uploaded on cloudinary")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password")

  return res 
  .status(200)
  .json(200,{user}, "Avatar Image Updated Successfully")
})

const updateCoverImage = asyncHandler( async(req, res) => {
  const coverImgPath = req.file?.path

  if(!coverImgPath){
    throw new ApiError(400,"File path not found")
  }

  const coverImage = uploadOnCloudinary(avatarImgPath)

  if(!coverImage){
    throw new ApiError(400,"File not uploaded on cloudinary")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {new: true}
  ).select("-password")

  return res 
  .status(200)
  .json(200,{user}, "Cover Image Updated Successfully")
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAvatarImage, updateCoverImage };
