import mongoose  from "mongoose";

const messageSchema = new mongoose.Schema({
    senderName:{
        type:String,
        minlength:[2,"Name must contain atleast two character "]
    },
    subject:{
        type:String,
        minlength:[2,"subject must contain atleast two character "]
    },
    message:{
        type:String,
        minlength:[2,"message must contain atleast two character "]
    },
    createAt:{
 
        type:Date,
        default:Date.now()
    }
})

export const Message = mongoose.model("Message",messageSchema);