import User from "../models/User.js";
import { upsertStreamUser } from '../config/stream.js'
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs'

export const register = async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400)
                .json({ message: "Email already exists, please use a diffrent one" });
        }

        const idx = Math.floor(Math.random() * 100000);
        const randomAvatar = `https://api.dicebear.com/7.x/thumbs/png?seed=${idx}&size=200`;

        const newUser = await User.create({
            email,
            firstName, 
            lastName,
            password,
            profilePic: randomAvatar,
        });
        try {
            await upsertStreamUser({
                id: newUser._id.toString(),
                name: newUser.lastName + " " + newUser.firstName,
                image: newUser.profilePic || "",
            });
            console.log(`Stream user created for ${newUser.firstName}`);
        } catch (error) { 
            console.log("Error creating Stream user:", error); 
        }

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "7d",
        });

        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true, // prevent XSS attacks,
            sameSite: "strict", // prevent CSRF attacks
        });

        res.status(201).json({ success: true, user: newUser, token });
    } catch (error) {
        console.log("Error in signup controller", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({email})
        if(!user) return res.status(400).json({ message: "User doesn't exists" })

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" })    
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "7d",
        });
        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true, // prevent XSS attacks,
            sameSite: "strict", // prevent CSRF attacks
        });

        const { password: _, ...userWithoutPassword } = user._doc;
        
        const hasLocation = Array.isArray(user?.location?.coordinates) &&
                    user.location.coordinates.length === 2;

        res.status(200).json({ success: true, user: userWithoutPassword, token, hasLocation });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const logout = async (req, res) => {
    res.clearCookie("jwt");
    res.status(200).json({ success: true, message: "Logout successful" });
}

export const onboard = async (req, res) => {
    // edit
}

export const updateLocation = async(req, res) => {
    const { latitude, longitude } = req.body;
    try {
        req.user.location = {
            type: "Point",
            coordinates: [longitude, latitude], // GeoJSON format: [lng, lat]
        };

        const updatedUser = await req.user.save();
        res.status(200).json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        res.status(500).json({success: false, message: "Failed to update location.",})
    }
}