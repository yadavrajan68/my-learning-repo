
// require('dotenv').config({path: './.env'});
import dotenv from "dotenv";
// import express from "express"
// import mongoose from "mongoose"
import {app} from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: './.env'
})

// const app = express();

connectDB()
.then(()=> {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is running on port: ${process.env.PORT || 8000}`);
    })
})
.catch((err) => {
    console.log("MongoDB connection failed", err);
})











/*
impoer express from 'express';
const app = express()

(async () => {
    try{
      await  mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
      app.on("error", (error) => {
        console.log("Error", error);
        throw error
      })

      app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${process.env.PORT}`);
      })
    } catch (error) {
        console.error("Error", error)
        throw error
    }

})()

*/