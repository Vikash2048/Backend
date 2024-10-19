import { config } from "dotenv";
import dbConnect from "./db/index.js";
import { app } from "./app.js";
config(".env")

//connection with database mongodb
dbConnect()
.then(() => {
    app.listen(process.env.PORT || 5000, () => {
        console.log("Server is successfully hosted")
    })
})
.catch((err) => {
    console.log("error while connecting to db...",err.message)
})

