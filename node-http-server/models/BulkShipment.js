const mongoose = require("mongoose");

const bulkShipmentSchema = mongoose.Schema({
    items: [{
        description: String,
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        },
        quantity: Number
    }],
    totalWeight: Number,
    totalItems: Number,
    status: {
        type: String,
        enum: ['pending', 'picked_up', 'in_transit', 'delivered'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const BulkShipment = mongoose.model("BulkShipment", bulkShipmentSchema);

module.exports = BulkShipment;
