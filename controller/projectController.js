
import { catchAsyncErrors } from "../middleware/catchAsyncErrors.js";

import ErrorHandler from "../middleware/error.js";

import { v2 as cloudinary } from "cloudinary"

import { Project } from "../models/projectSchema.js";






export const addNewProject = catchAsyncErrors(async (req, res, next) => {

    if (!req.files || Object.keys(req.files).length == 0) {
        return next(new ErrorHandler("project banner is required !"));
    }

    const { projectBanner } = req.files;
    const { title, description, gitRepoLink, projectLink, technologies, stack } = req.body;

    if (!title || !description || !gitRepoLink || !projectLink || !projectLink || !technologies || !stack) {
        return next(new ErrorHandler("these all field are required !", 400))
    }

    const cloudinaryResponse = await cloudinary.uploader.upload(projectBanner.tempFilePath, { folder: "PROJECT_BANNER" })


    if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error("Cloudinary Error", cloudinaryResponse.error || "Unknown cloudinary error");

        return next(new ErrorHandler("failed to upload project banner on cloudinary"))
    }

    const project = await Project.create({
        title, description, gitRepoLink, projectLink, technologies, stack,
        projectBanner: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
        }

    })

    res.status(200).json({
        success: true,
        message: "project added successfully",
        project
    })




})



export const deleteProject = catchAsyncErrors(async (req, res, next) => {

    const {id}= req.params;

    const project = await Project.findById(id);

    if(!project){
        return next (new ErrorHandler("project not found ! ",400))
    }

    await project.deleteOne();

    res.status(200).json({
        success:true,
        message:"project deleted successfully"
    })


})



export const updateProject = catchAsyncErrors(async (req, res, next) => {

    const newProjectData = {
        title: req.body.title,
        description: req.body.description,
        gitRepoLink: req.body.gitRepoLink,
        projectLink: req.body.projectLink,
        technologies: req.body.technologies,
        stack: req.body.stack,
    }

    if (req.files && req.files.projectBanner) {
        const projectBanner = req.files.projectBanner;
        const project = await Project.findById(req.params.id);

        const projectBannerId =  project.projectBanner.public_id;


        await cloudinary.uploader.destroy(projectBannerId);
        const cloudinaryResponse = await cloudinary.uploader.upload(projectBanner.tempFilePath, { folder: "PROJECT_BANNER" });

        newProjectData.projectBanner = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        }


    }

    const project = await Project.findByIdAndUpdate(req.params.id , newProjectData,{
        new :true,
        runValidators:true,
        useFindandModify:false,
    });



    res.status(200).json({
        success:true,
        message:"project updated successfully",
        project
    })






})



export const getAllProject = catchAsyncErrors(async (req, res, next) => {

    const projects = await Project.find();

    res.status(200).json({
        success:true,
        projects,
    })


})


export const getSingleProject = catchAsyncErrors(async (req, res, next) => {

    const {id}= req.params;

    const project = await Project.findById(id);

    if(!project){
        return next (new ErrorHandler("project not found ! ",400))
    }

    res.status(200).json({
        success:true,
        project
    })


})

