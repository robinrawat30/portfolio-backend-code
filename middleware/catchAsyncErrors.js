import promise from "promise"

export const catchAsyncErrors =(theFunction) =>{

    return (req,res,next)=>{
        promise.resolve(theFunction(req,res,next)).catch(next);
    }

}