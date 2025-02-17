import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessandRefreshToken = async(userId) => {
    try{
      const user = await User.findById(userId);

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      const accessToken = user.generateAccessToken(); // Fixed method name
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
    } catch(error){
      console.error("Error generating tokens:", error); // Log the error
      throw new ApiError(500, "Failed to generate access and refresh token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username , email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    //create user object - create entry in db
    // remove password and refresh token field from response
    //check fro user creation
    //return res


    const {fullName, email, password,username} = req.body;
    console.log("email", email)
    if(
        [fullName, email, username, password].some((field)  =>
            field?.trim() === "")
    ){
            throw new ApiError(400, "Please fill all fields");
    }

    const existedUser = await User.findOne({
        $or: [{ username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = coverImageLocalPath 
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;
    
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }


    const user =  await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refereshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Failed to create user while registering")
    }

    return res.status(201).json(
        new ApiResponse(201, "User registered successfully",createdUser)
     )

}); 

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // email, or username
    // find user 
    // password check
    // access and refresh  token
    // send cookie

    const {email,username, password} = req.body;

    if(!username && !email){
        throw new ApiError(400, "username or password is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

        if(!isPasswordValid){
            throw new ApiError(401, "Invalid user credentials")
        }

        const {accessToken, refreshToken} = await 
        generateAccessandRefreshToken(user._id)

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        const cookieOptions = {
            httpOnly: true,
            secure:true 
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200, {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )

});

const logoutUser = asyncHandler(async(req, res) => {
        await   User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    refreshToken: undefined
                }
            },
            {
                new: true
            }

        
        )

        const cookieOptions = {
        httpOnly: true,
        secure: true
        };

        return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        )
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized access");
    }

    try {
        const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
        );
    
        const user = await User.findById(decodedToken?._id);
    
        if (!user) {
        throw new ApiError(401, "Invalid refresh token");
        }
    
        if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "refresh token is expired or used");
        }
    
        const cookieOptions = {
        httpOnly: true,
        secure: true
        };
    
        const { accessToken, newRefreshToken } = await generateAccessandRefreshToken(
        user._id
        );
        return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(new ApiResponse(200, { accessToken, newRefreshToken },
        "New access token generated successfully"
        ));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }

});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.
    isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
    new ApiResponse(200, {}, "Password changed successfully")
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(200, req.user, "User details fetched successfully");
}
); 

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email){
    throw new ApiError(400, "Please fill all fields");
    }

    const user = User.findByIdAndUpdate(
    req.user?._id,
    {
        $set: {
        fullName,
        email:email
        }
    },
    {
        new: true
    }
    ).select("-password");

    return res.status(200).json(
    new ApiResponse(200, user, "User details updated successfully")
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
    throw new ApiError(400, "Failed to upload avatar");
    }
    const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set: {
        avatar: avatar.url
        }
    },
    {new: true}
    ).  select("-password");

      return res
        .status(200)
        .json(
          new ApiResponse(200, user, "User Avatar Image updated successfully")
        );

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalPath = req.file?.path;
  if (!CoverImageLocalPath) {
    throw new ApiError(400, "CoverImage file is required");
  }
  const coverImage = await uploadOnCloudinary(CoverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Failed to upload coverImage");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(
    new ApiResponse(200, user, "User coverImage updated successfully")
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
updateUserCoverImage
};