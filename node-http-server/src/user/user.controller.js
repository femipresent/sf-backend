const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userSchema = require("../../models/User");
const e = require("express");

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const isExisting = await userSchema.findOne({ email });

        if(isExisting) {
            return res.status(403).json({success: false, message: "Email already exist",});
        }

        if (!password) {
            return res.status(400).json({success: false, message: "Password is required",});
        }

        if(!name) {
            return res.stats(400).json({success: false, message: "Name is required",});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userSchema({name: name, email, password: hashedPassword,});

        const response = await user.save();
        console.log(response);

        const jwtoken = jwt.sign({email: response.email, userId: response._id,}, process.env.JWTSECRET, {expiresIn: "1d"});
        console.log('Generated token:', jwtoken);
        console.log('Token length:', jwtoken.length);
        return res.status(201).json({success: true, message: "Account created successfully", data: {accessToken: jwtoken,},});
    } catch(error) {
        console.log("error", error);
        return res.status(412).send({ssuccess: false, message: error.message,});
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try{
        const user = await userSchema.findOne({ email });

        if(!user) {
            return res.status(401).json({ message: "Authorization failed"});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return res.status(401).json({message: "Invalid credentials"});
        }

        const jwtoken = jwt.sign({ email: user.email, userId: user._id,}, process.env.JWTSECRET, {expiresIn: "1d"});
        console.log('Generated token:', jwtoken);
        console.log('Token length:', jwtoken.length);

        return res.status(200).json({success: true, data: {accessToken: jwtoken}, message: "Login successful",});
    } catch (err) {
        console.log(err);
        return res.status(401).json({success: false, message: err.message,});
    }
};

const findOneUser = async (req, res) => {
    try{
        const { email } = req.body;
        console.log(email);

        const user = await userSchema.findOne({ email: email });

        if (!user) {
            return res.status(403).json({success: false, message: "User not found",});
        }

        return res.status(200).json({success: true, message: "User found", data: user, });
    } catch (error) {
        console.log("error", error);
        return res.status(500).json({message: "Internal server error",});
    }
};

const registerAdmin = async (req, res) => {
    const { name, email, password, adminSecret } = req.body;

    try {
        // Check admin secret key
        if (adminSecret !== process.env.ADMIN_SECRET) {
            return res.status(403).json({success: false, message: "Invalid admin secret key"});
        }

        const isExisting = await userSchema.findOne({ email });

        if(isExisting) {
            return res.status(403).json({success: false, message: "Email already exist"});
        }

        if (!password) {
            return res.status(400).json({success: false, message: "Password is required"});
        }

        if(!name) {
            return res.status(400).json({success: false, message: "Name is required"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userSchema({name, email, password: hashedPassword, role: 'admin'});

        const response = await user.save();
        console.log(response);

        const jwtoken = jwt.sign({email: response.email, userId: response._id}, process.env.JWTSECRET, {expiresIn: "1d"});
        console.log('Generated token:', jwtoken);
        console.log('Token length:', jwtoken.length);
        return res.status(201).json({success: true, message: "Admin account created successfully", data: {accessToken: jwtoken}});
    } catch(error) {
        console.log("error", error);
        return res.status(412).send({success: false, message: error.message});
    }
};

const registerDriver = async (req, res) => {
    const { name, email, password, licenseNumber, vehicleInfo } = req.body;

    try {
        const isExisting = await userSchema.findOne({ email });

        if(isExisting) {
            return res.status(403).json({success: false, message: "Email already exist"});
        }

        if (!password) {
            return res.status(400).json({success: false, message: "Password is required"});
        }

        if(!name) {
            return res.status(400).json({success: false, message: "Name is required"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userSchema({name, email, password: hashedPassword, role: 'driver', licenseNumber, vehicleInfo});

        const response = await user.save();

        const jwtoken = jwt.sign({email: response.email, userId: response._id}, process.env.JWTSECRET, {expiresIn: "1d"});
        return res.status(201).json({success: true, message: "Driver account created successfully", data: {accessToken: jwtoken}});
    } catch(error) {
        console.log("error", error);
        return res.status(412).send({success: false, message: error.message});
    }
};

const registerDispatcher = async (req, res) => {
    const { name, email, password, dispatcherSecret } = req.body;

    try {
        // Check dispatcher secret key
        if (dispatcherSecret !== process.env.DISPATCHER_SECRET) {
            return res.status(403).json({success: false, message: "Invalid dispatcher secret key"});
        }

        const isExisting = await userSchema.findOne({ email });

        if(isExisting) {
            return res.status(403).json({success: false, message: "Email already exist"});
        }

        if (!password) {
            return res.status(400).json({success: false, message: "Password is required"});
        }

        if(!name) {
            return res.status(400).json({success: false, message: "Name is required"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userSchema({name, email, password: hashedPassword, role: 'dispatcher'});

        const response = await user.save();

        const jwtoken = jwt.sign({email: response.email, userId: response._id}, process.env.JWTSECRET, {expiresIn: "1d"});
        return res.status(201).json({success: true, message: "Dispatcher account created successfully", data: {accessToken: jwtoken}});
    } catch(error) {
        console.log("error", error);
        return res.status(412).send({success: false, message: error.message});
    }
};

module.exports = { registerUser, login, findOneUser, registerAdmin, registerDriver, registerDispatcher };