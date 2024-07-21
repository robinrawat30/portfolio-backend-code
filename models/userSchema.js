import mongoose from "mongoose";

import bcrypt from "bcrypt";

import jwt from "jsonwebtoken"

import crypto from "crypto"

const userSchema=new mongoose.Schema({


    fullname:{
        type:String,
        required:[true,"Name is Required !"]
    },
    
    email:{
        type:String,
        required:[true,"Email is Required !"]
    },
    
    phone:{
        type:String,
        required:[true,"Phone number is Required !"]
    },
    
    aboutme:{
        type:String,
        required:true
    },
    
    password:{
        type:String,
        required:[true,"password is required !"],
        minlength:[6,"Password must contains 6 characters !"],
        select:false,
    },
    avatar:{
        public_id:{
            type:String,
            required:true,
        },
        url:{
            type:String,
            required:true,
        }
    },
    resume:{
        public_id:{
            type:String,
            required:true,
        },
        url:{
            type:String,
            required:true,
        }
    },

    githubURL:String,
    InstagramURL:String,

    linkedinURL:String,

    resetPasswordToken:String,
    resetPasswordExpire:Date,



})


// for hasing the password before the saving password in data base when a new user is registered

userSchema.pre("save",async function(next){

    if(!this.isModified("password")){
        next();
    }

    this.password= await bcrypt.hash(this.password,10);
})


// comparing the password which entered by user  when user trying to login and the password which is store in database in hashing values.

userSchema.methods.comparePassword=async function(enteredPassword){

    return await bcrypt.compare(enteredPassword,this.password);
}


// for generating a json web token 

userSchema.methods.generateJsonWebToken=  function(){

    return  jwt.sign({id:this._id},process.env.JWT_SECRET_KEY,{
        expiresIn: process.env.JWT_EXPIRES
    });

}


// for generating reset password token 

userSchema.methods.getResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
}

export const User = mongoose.model("User",userSchema);


