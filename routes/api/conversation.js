import express from "express";
import axios from "axios";
import translate from "@iamtraction/google-translate";
import dotenv from "dotenv";
import auth from "../../middleware/auth";
import { languageData } from "../../config/languageData.js";
// Add this line to import Socket.IO
import { getIO } from '../../socket';

dotenv.config();

const router = express.Router();
import Conversation from "../../models/Conversation";
import Notification from "../../models/Notification";

const tavusApiKey = process.env.TAVUS_API_KEY; // Make sure to add this to your .env file
const API_URL = process.env.API_URL;

let conversationCreateOption = {
    method: "POST",
    url: "https://tavusapi.com/v2/conversations",
    headers: {
        "x-api-key": tavusApiKey,
        "Content-Type": "application/json",
    },
}

let getOption = { method: 'GET', headers: { 'x-api-key': tavusApiKey } };
let deleteOption = { method: 'DELETE', headers: { 'x-api-key': tavusApiKey } };

router.get("/", auth, async (req, res) => {
    const userConversation = await Conversation.find({ user: req.user.id });
    const conversationData = [];
    for (const conversation of userConversation) {
        const resultData = await axios.get(`https://tavusapi.com/v2/conversations/${conversation.conversation_id}`, getOption);
        conversationData.push(resultData.data);
    }
    res.json({ conversationData });
});

router.post("/create", auth, async (req, res) => {
    const { persona_id, replica_id, conversation_name, conversation_context } = req.body;
    const creatingData = {
        persona_id: persona_id,
        replica_id: replica_id,
        conversation_name: conversation_name || `Conversation_${Date.now()}`,
        conversational_context: conversation_context,
        callback_url: `${API_URL}/api/conversation/conversation-created`,

    };
    conversationCreateOption = { ...conversationCreateOption, data: creatingData };
    try {
        const response = await axios(conversationCreateOption);
        console.log(response.data);
        const conversation = new Conversation({
            user: req.user.id,
            conversation_id: response.data.conversation_id,
        });
        await conversation.save();
        res.json({ resultData: response.data });
    } catch (error) {
        console.error("Error creating conversation:", error);
        res.status(500).json({ error: "Error creating conversation" });
    }
});

router.post("/conversation-created", async (req, res) => {
    const conversationData = req.body;
    console.log(conversationData);
    // await Conversation.updateOne({ conversation_id: conversationData.conversation_id });
    const io = getIO();
    io.emit("conversationCreated", conversationData);
    res.json({ resultData: "Conversation created successfully" });
});

router.delete("/:conversation_id", auth, async (req, res) => {
    const { conversation_id } = req.params;
    try {
        await Conversation.deleteOne({ conversation_id });
        await axios.delete(`https://tavusapi.com/v2/conversations/${conversation_id}`, deleteOption);
        res.json({ resultData: "Conversation deleted successfully" });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        res.status(500).json({ error: "Error deleting conversation" });
    }
});

export default router;