// require('dotenv').config({path: './env})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from './app.js'
dotenv.config({
    path: './env'
})

connectDB()
// app.on("error", (error) =>{
//     console.log("ERROR:", err);
// })
.then(() =>{
    app.listen(process.env.PORT || 8000, () => {
        console.log(`"server is running at port:" ${process.env.PORT} `);
    })
})
.catch((err) => {
    console.log("MONGO db connecction failed !!!", err);
})

/*const app = express()
;( async () => { // we use An IIFE (Immediately Invoked Function Expression) is an idiom in which a JavaScript function runs as soon as it is defined. It is also known as a self-executing anonymous function. The name IIFE is promoted by Ben Alman in his blog. js.
    try{
     await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) // WE USE ASYNC AWAIT TO WAIT FOR THE CONNECTION TO BE ESTABLISHED BECAUSE WE ASSUME ALWAYS THAT OUR DATA BASE IN ANOTHER CONTINENT
     app.on("error", (error) => {
        console.log("ERROR:", error);
        throw error
     })
     app.listen(process.env.PORT, () =>{  // WE USE LISTEN BECAUSE HERE EXPRESS GETS SOME ERROR TO PRINT ERROR IN EXPRESS
        console.log(`app is listening on port ${process.env.PORT}`); // WE USE PROCESS.ENV.PORT TO MAKE OUR PORT DYNAMIC
     })
    }
    catch(error){
        console.log("ERROR:",error)
        throw err
    }
})()
    */
