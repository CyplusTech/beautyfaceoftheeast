const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
    contestantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    voterEmail: {
        type: String,
        required: false,
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model("Vote", voteSchema);