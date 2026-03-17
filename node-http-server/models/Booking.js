const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ['single', 'bulk'],
        required: true,
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'assigned', 'picked_up', 'in_transit', 'delivered'],
        default: 'draft'
    },
 
  //  pick up info 
    pickup: {
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            country: { type: String, required: true },
            coordinates: {
                lat: Number,
                lng: Number
            }
        },
        scheduledDate: {type: Date, required: true}, //m/d/y
        scheduledTime: {type: Date, required: true}, 
        timePreference: String,
        contactPerson: String,
        contactPhone: String
    },

    //now delivery info
    delivery: {
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            country: { type: String, required: true },
            coordinates:{
                lat: Number,
                lng: Number
            }
        },
        reciepentName: String,
        reciepentPhone: String,
        deliveryInstructions: String
    },
    // services type
    services: {
        ftl: {
            selected: { type: Boolean, default: false},
            price: { type: Number, defualt: 45000}   //base amount for full truck
        },
        ltl: {
            selected: { type: Boolean, default: false },
            price: { type: Number, default: 12000}
        },
        lastMile: {
            selected: { type: Boolean, default: false },
            price: { type: Number, default: 1800 }
        },
        express: {
            selected: { type: Boolean, default: false },
            price: { type: Number, default: 2500 }
        }
    },

    //pricing
    pricing: {
        subtotal: { type: Number, default: 0},
        tax: { type: Number, default: 0 },
        total: { type: Number, default: 0},
        currency: { type: String, default: 'NGN'}
    },
    //tracking
    trackingNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    trackingHistory: [{
        status: String,
        location: String,
        timestamp: { type: Date, default: Date.now },
        note: String
    }],

    //for single shipment
    itemDetails: {
        description: String,
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        }
    },

    //for bulk shipments 
    bulkShipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BulkShipment'
    },

    //metdata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    proofOfDelivery: {
        recipientName: String,
        recipientSignature: String,
        deliveryNotes: String,
        photoUrl: String,
        deliveredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        deliveredAt: Date
    },
    failedDelivery: {
        attemptDate: Date,
        reason: String,
        photoUrl: String,
        notes: String,
        nextAttemptDate: Date
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    }
}, {
    timestamp: true //automatically adds createdAt and updateAt
});

//cretae model
const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
