import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const dbConnect = async() => {
try{
        const connection = await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`);
        console.log("DB is connected successfully on host name :",connection.connection.host)
    }
    catch(error){
        console.log("ERROR while DB CONNECTION :",error.message);
        process.exit(1)
    }
}

export default dbConnect;