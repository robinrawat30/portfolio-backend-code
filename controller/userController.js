import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js"
import ErrorHandler from "../middleware/error.js"

import { User } from "../models/userSchema.js"

import { v2 as cloudinary } from "cloudinary"
import { generateToken } from "../utils/jwtToken.js"
import { sendEmail } from "../utils/sendEmail.js"

import crypto from "crypto"


export const register = catchAsyncErrors(async (req, res, next) => {

    if (!req.files || Object.keys(req.files).length === 0) {

        return next(new ErrorHandler("avatar and resume are required !", 400))

    }

    const { avatar, resume } = req.files;

    const cloudinaryResponseForAvatar = await cloudinary.uploader.upload(avatar.tempFilePath, { folder: "AVATAR" });

    if (!cloudinaryResponseForAvatar || cloudinaryResponseForAvatar.error) {
        console.error("Cloudinary Error", cloudinaryResponseForAvatar.error || "Unknown cloudinary error");
    }
    const cloudinaryResponseForResume = await cloudinary.uploader.upload(resume.tempFilePath, { folder: "RESUME" });

    if (!cloudinaryResponseForResume || cloudinaryResponseForResume.error) {
        console.error("Cloudinary Error", cloudinaryResponseForResume.error || "Unknown cloudinary error");
    }

    const {
        fullname,
        email,
        phone,
        aboutme,
        password,
        githubURL,
        InstagramURL,
        linkedinURL,
    } = req.body;


    const user = await User.create({
        fullname,
        email,
        phone,
        aboutme,
        password,
        githubURL,
        InstagramURL,
        linkedinURL,
        avatar: {
            public_id: cloudinaryResponseForAvatar.public_id,
            url: cloudinaryResponseForAvatar.secure_url
        },
        resume: {
            public_id: cloudinaryResponseForResume.public_id,
            url: cloudinaryResponseForResume.secure_url
        }
    })



    generateToken(user, "user registered succesfully ", 201, res);


})


export const login = catchAsyncErrors(async (req, res, next) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("email and password are required !"))


    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler("email or password are invalid !"))
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
        return next(new ErrorHandler("email or password invalid !"))
    }

    generateToken(user, "user login successfully ", 200, res);
})


export const logout = catchAsyncErrors(async (req, res, next) => {
    res.status(200).cookie("token", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite:"None",
        secure:true,



    }).json({
        success: true,
        message: "logout successfully",
    })
})


export const getUser = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        user,
    })
})


export const updateProfile = catchAsyncErrors(async (req, res, next) => {

    const newUserData = {

        fullname: req.body.fullname,
        email: req.body.email,
        phone: req.body.phone,
        aboutme: req.body.aboutme,

        githubURL: req.body.githubURL,
        InstagramURL: req.body.InstagramURL,
        linkedinURL: req.body.linkedinURL,

    }

    if (req.files && req.files.avatar) {
        const avatar = req.files.avatar;
        const user = await User.findById(req.user.id);

        const ImageProfileId = user.avatar.public_id;

        await cloudinary.uploader.destroy(ImageProfileId);
        const cloudinaryResponse = await cloudinary.uploader.upload(avatar.tempFilePath, { folder: "AVATAR" });

        newUserData.avatar = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        }


    }

    if (req.files && req.files.resume) {
        const resume = req.files.resume;
        const user = await User.findById(req.user.id);

        const resumeId = user.resume.public_id;

        await cloudinary.uploader.destroy(resumeId);
        const cloudinaryResponse = await cloudinary.uploader.upload(resume.tempFilePath, { folder: "RESUME" });

        newUserData.resume = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        }


    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {


        new: true,
        runValidators: true,
        useFindAndModify: false,
    })

    res.status(200).json({
        success: true,
        message: "profile updated succesfully",
        user,
    })

})


export const updatePassword = catchAsyncErrors(async (req, res, next) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        return next(new ErrorHandler("Please fill the fields !", 400));
    }

    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
        return next(new ErrorHandler("incorrect current password "), 400);
    }

    if (newPassword !== confirmNewPassword) {
        return next(new ErrorHandler("new password and confirm new password not match !", 400))
    }
    user.password = newPassword;

    await user.save();

    res.status(200).json({
        success: true,
        message: "password update successfully"
    })
})



// for user who visit only portfolio

export const getUserForPortfolio = catchAsyncErrors(async (req, res, next) => {

    const id = "6696326d7fa2c28630ad796b";

    const user = await User.findById(id);

    res.status(200).json({
        success: true,
        user
    })
})



// for forgot password and reset password

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorHandler("user not found!", 404));
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${process.env.DASHBOARD_URL}/password/reset/${resetToken}`;
    const message = `your reset password token is :- \n\n ${resetPasswordUrl} \n\n if you have not requested to reset password token then ignore it `;

    try {
        await sendEmail({
            email:user.email,
            subject:"personal portfolio recovery password ",
            message
        })

        res.status(200).json({
            success:true,
            message:`Email sent to ${user.email} successfully`,
        })
        
    } catch (error) {

        user.resetPasswordExpire=undefined;
        user.resetPasswordToken=undefined;

        await user.save();

        return next(new ErrorHandler(error.message,500));
        
    }





})


export const resetPassword = catchAsyncErrors(async(req,res,next)=>{

    const {token} = req.params;

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const user= await User.findOne({
        resetPasswordToken,
        resetPasswordExpire :{$gt:Date.now()},
    })

    if(!user){
        return next(new ErrorHandler("reset password token is invalid or has been expire !",400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("password and cofirm password not matched !"))
    }

    user.password=req.body.password;
    user.resetPasswordExpire=undefined;
    user.resetPasswordToken=undefined;

    await user.save();
    generateToken(user,"reset password successfully",200,res);
})