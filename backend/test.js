import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("MongoDB connected successfully");
    process.exit();
})
.catch(err=>{
    console.log(err);
    process.exit(1);
});