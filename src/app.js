import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
app.use(cors())
app.use(express.json({limit : "20kb"}))
app.use(express.urlencoded())
app.use(express.static("public"))
app.use(cookieParser())

// router import 
import userRoute from "./routes/user.route.js"

// route declartion 
app.use("/api/v1/users", userRoute)


export { app }