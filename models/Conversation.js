import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    conversation_id: {
        type: String,
        required: true,
    },
});

const Conversation = mongoose.model("conversation", ConversationSchema);

export default Conversation;