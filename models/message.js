const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: {
        type: String,
        required: true
    },
    date: { type: Date, default: Date.now, required: true },
});

module.exports = mongoose.model('Message', messageSchema);
