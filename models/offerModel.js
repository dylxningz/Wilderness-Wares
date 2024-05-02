const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    status: {
        type: String,
        enum: ['pending', 'rejected', 'accepted'],
        default: 'pending'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    }
});

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;