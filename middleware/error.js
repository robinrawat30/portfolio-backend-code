

class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode;
    }
}




export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Internal server failed"
    err.statusCode = err.statusCode || 500

    if (err.code == 11000) {
        const message = `duplicate  ${Object.keys(err.keyValue)} Entered`
        err = new ErrorHandler(message, 400);
    }

    if (err.name == "JsonWebTokenError") {
        const message = `json web token is invalid try again !`
        err = new ErrorHandler(message, 400);
    }
    if (err.name == "TokenExpireError") {
        const message = `json web token is Expire try again !`
        err = new ErrorHandler(message, 400);
    }
    if (err.name == "CastError") {
        const message = `Invalid ${err.path}`
        err = new ErrorHandler(message, 400);
    }

    console.log(err);

    const errorMessage = err.errors ? Object.values(err.errors).map(error => error.message).join(" ") : err.message

    return res.status(err.statusCode).json({
        success:false,
        message:errorMessage
    })
}

export default ErrorHandler