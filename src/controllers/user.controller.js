import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const registerUser = asyncHandler ( async (req, res) =>{
    const { userName, email, fullName, password, } = req.body;

    // checking that any field is empty or not
    if ( [userName, email, fullName, password].some(( field ) => field?.trim() === "" ) ) {
        throw new ApiError(400, "All field are required")
    }

    const existedUser = await User.findOne({
        $or: [{email},{userName}]
    })
    if ( existedUser ) throw new ApiError(409, "User already exist")
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.avatar[0]?.path

    if ( !avatarLocalPath ){
        throw new ApiError(400, "avatar image not found")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath ?? "")

    if ( !avatar ){
        throw new ApiError(400,"avatar file is required")
    }

    const user = await User.create( {
        fullName,
        email,
        userName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password
    } )

    // if user created successfully or not
    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if( !userCreated ){
        throw new ApiError(500,"Something went wrong user not created")
    }

    return res.status(201).json( new ApiResponse(200,userCreated, "User registered Successfully") )

})

export { registerUser }