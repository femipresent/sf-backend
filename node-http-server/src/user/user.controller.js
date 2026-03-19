const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userSchema = require("../../models/User");

const registerUser = async (req, res) => {
    const { firstName, lastName, email, password, phone, businessName } = req.body;

    try {
        const isExisting = await userSchema.findOne({ email });

        if(isExisting) {
            return res.status(403).json({success: false, message: "Email already exist",});
        }

        if (!password) {
            return res.status(400).json({success: false, message: "Password is required",});
        }

        if (!firstName || !lastName) {
            return res.status(400).json({success: false, message: "First name and last name are required",});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userSchema({firstName, lastName, email, password: hashedPassword, phone, businessName });

        const response = await user.save();
        console.log("New user created:", response);

        const jwtoken = jwt.sign({email: response.email, userId: response._id}, process.env.JWTSECRET, {expiresIn: "1d"});
        console.log('Generated token:', jwtoken.substring(0, 20) + '...');
        return res.status(201).json({success: true, message: "Account created successfully", data: {accessToken: jwtoken, user: response},});
    } catch(error) {
        console.log("registerUser error", error);
        return res.status(412).json({success: false, message: error.message});
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

        const jwtoken = jwt.sign({ email: user.email, userId: user._id}, process.env.JWTSECRET, {expiresIn: "1d"});
        console.log('Login token:', jwtoken.substring(0, 20) + '...');

        return res.status(200).json({success: true, data: {accessToken: jwtoken, user}, message: "Login successful",});
    } catch (err) {
        console.log(err);
        return res.status(401).json({success: false, message: err.message,});
    }
};

const findOneUser = async (req, res) => {
    try{
        const { email } = req.body;
        console.log(email);

        const user = await userSchema.findOne({ email: email }).select('-password');

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
    const { firstName, lastName, email, password, adminSecret } = req.body;

    try {
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

        if (!firstName || !lastName) {
            return res.status(400).json({success: false, message: "First name and last name are required"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userSchema({firstName, lastName, email, password: hashedPassword, role: 'admin'});

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
    const { firstName, lastName, email, password, licenseNumber, vehicleInfo } = req.body;

    try {
        const isExisting = await userSchema.findOne({ email });

        if(isExisting) {
            return res.status(403).json({success: false, message: "Email already exist"});
        }

        if (!password) {
            return res.status(400).json({success: false, message: "Password is required"});
        }

        if (!firstName || !lastName) {
            return res.status(400).json({success: false, message: "First name and last name are required"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userSchema({firstName, lastName, email, password: hashedPassword, role: 'driver', licenseNumber, vehicleInfo});

        const response = await user.save();

        const jwtoken = jwt.sign({email: response.email, userId: response._id}, process.env.JWTSECRET, {expiresIn: "1d"});
        return res.status(201).json({success: true, message: "Driver account created successfully", data: {accessToken: jwtoken}});
    } catch(error) {
        console.log("error", error);
        return res.status(412).send({success: false, message: error.message});
    }
};

const registerDispatcher = async (req, res) => {
    const { firstName, lastName, email, password, dispatcherSecret } = req.body;

    try {
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

        if (!firstName || !lastName) {
            return res.status(400).json({success: false, message: "First name and last name are required"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userSchema({firstName, lastName, email, password: hashedPassword, role: 'dispatcher'});

        const response = await user.save();

        const jwtoken = jwt.sign({email: response.email, userId: response._id}, process.env.JWTSECRET, {expiresIn: "1d"});
        return res.status(201).json({success: true, message: "Dispatcher account created successfully", data: {accessToken: jwtoken}});
    } catch(error) {
        console.log("error", error);
        return res.status(412).send({success: false, message: error.message});
    }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // from authMiddleware
    const user = await userSchema.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { registerUser, login, findOneUser, registerAdmin, registerDriver, registerDispatcher, getUserProfile }; 



  