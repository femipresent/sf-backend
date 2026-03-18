const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: [1, "First name too short"]
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: [1, "Last name too short"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"],
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
}, { timestamps: true });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`.trim();
});

// Ensure virtuals in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("user", userSchema);
