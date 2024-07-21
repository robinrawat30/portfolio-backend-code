import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js"

import { softwareApplication } from "../models/softwareApplicationSchema.js"

import ErrorHandler from "../middleware/error.js"

import {v2 as cloudinary} from "cloudinary"






export const  addNewApplication = catchAsyncErrors(async(req,res,next) =>{
    if (!req.files || Object.keys(req.files).length === 0) {

        return next(new ErrorHandler("software Application icon/svg is required !", 400))

    }

    const { svg  } = req.files;
    const {name} = req.body;

    if(!name){
        return next(new ErrorHandler("software name is required !",400))
    }

    const cloudinaryResponse = await cloudinary.uploader.upload(svg.tempFilePath, { folder: "PORTFOLIO_SOFTWARE_APPLICATION" });

    if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error("Cloudinary Error", cloudinaryResponse.error || "Unknown cloudinary error");
    }
    const softwareapplication =await softwareApplication.create({
        name,
        svg:{
            public_id:cloudinaryResponse.public_id,
            url:cloudinaryResponse.secure_url
        }

    })

    res.status(200).json({
        success:true,
        message:"new software application add successfully",
        softwareapplication,
    })



})
export const  deleteApplication = catchAsyncErrors(async(req,res,next) =>{
    const {id} = req.params
    const softwareapplication = await softwareApplication.findById(id);

    if(!softwareapplication){
        return next(new ErrorHandler("software application not found !",404));
    }

    const softwareApplicationSvgId=  softwareapplication.svg.public_id;

    await cloudinary.uploader.destroy(softwareApplicationSvgId);

    await softwareApplication.deleteOne(softwareapplication);

    res.status(200).json({
        success:true,
        message:"software application delete successfully"
    })




})
export const  getAllApplication = catchAsyncErrors(async(req,res,next) =>{

    const softwareApplications = await softwareApplication.find();

    res.status(200).json({
        success:true,
        softwareApplications
    })



})
