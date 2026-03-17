const mongoose = require("mongoose");

const rateSchema = mongoose.Schema({
    serviceType: {
        type: String,
        enum: ['ftl', 'ltl', 'express', 'lastMile'],
        required: true
    },
    baseRate: {
        type: Number,
        required: true
    },
    perKmRate: {
        type: Number,
        default: 0
    },
    perKgRate: {
        type: Number,
        default: 0
    },
    surcharges: {
        fuel: { type: Number, default: 0 },
        peakHours: { type: Number, default: 0 },
        specialHandling: { type: Number, default: 0 }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Rate", rateSchema);
