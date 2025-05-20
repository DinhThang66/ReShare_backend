import express from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { connectDB } from './config/mongoDb.js'

import authRoutes from './routes/auth.route.js'
import userRoutes from './routes/user.route.js'
import chatRoutes from './routes/chat.route.js'
import postRoutes from './routes/post.route.js'
import commentRoutes from './routes/comment.route.js'

// App config
const app = express()
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true, // allow frontend to send cookies
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // để parse application/x-www-form-urlencoded
app.use(cookieParser());

// Api endpoint
app.use("/api/auth", authRoutes)
app.use("/api/user", userRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/post", postRoutes)
app.use("/api/comment", commentRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
    connectDB()
})
