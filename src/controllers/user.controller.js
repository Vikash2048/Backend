import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
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

const generateAccessAndRefreshToken = async (userId) => {
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
};

const loginUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

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

export { registerUser, loginUser, logoutUser };
