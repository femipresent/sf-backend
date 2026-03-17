const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Name should not be less than 3 Characters"]
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        trim: true,
    },
    role: {
        type: String,
        enum: ['user', 'driver', 'dispatcher', 'admin'],
        default: 'user'
    },
    licenseNumber: {
        type: String,
        required: function() { return this.role === 'driver'; }
    },
    vehicleInfo: {
        type: String,
        required: function() { return this.role === 'driver'; }
    },
    isActive: {
        type: Boolean,
        default: true
    }
},{timestamps: true })


module.exports = mongoose.model("user", userSchema)
