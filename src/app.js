import express from 'express';
import cors from 'cors';
import cookieparser from 'cookie-pasrer';

const app = express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended: true, limits: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
export { app}