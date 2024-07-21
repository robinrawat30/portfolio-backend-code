import mongoose from "mongoose";

const dbConnection = () => {

    mongoose.connect(process.env.MONGO_URI, {
        // dbName: ""
    }).then(() => {
        console.log("db connect successfully");
    }).catch((err) => {
        console.log("some error occur in database:", err);
    })


}

export default  dbConnection;
