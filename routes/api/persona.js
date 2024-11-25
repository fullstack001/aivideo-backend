import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

import auth from '../../middleware/auth';
import Persona from '../../models/Persona';

dotenv.config();
const router = express.Router();

const tavusApiKey = process.env.TAVUS_API_KEY; // Make sure to add this to your .env file
const createPersonaOptioin = {
    method: "POST",
    url: "https://tavusapi.com/v2/personas",
    headers: {
        "x-api-key": tavusApiKey,
        "Content-Type": "application/json",
    },
};
const getPersonaOption = {
    method: "GET",
    url: "https://tavusapi.com/v2/personas",
    headers: {
        "x-api-key": tavusApiKey,
        "Content-Type": "application/json",
    },
};

router.post('/create-persona', auth, async (req, res) => {
    const { model,
        personalRole,
        systemPrompt,
        conversationalContext,
        replica_id, } = req.body;

    const creatingData = {
        persona_name: personalRole,
        system_prompt: systemPrompt,
        context: conversationalContext,
        default_replica_id: replica_id,
        layers: {
            llm: {
                model: model,
            }
        }

    };

    createPersonaOptioin.data = creatingData;

    try {
        const response = await axios(createPersonaOptioin);
        console.log(response.data);
        const persona = new Persona({
            persona_id: response.data.persona_id,
            user: req.user.id,
        });
        await persona.save();
        res.json({ resultData: response.data });
    } catch (error) {
        console.error("Error creating persona:", error);
        res.status(500).json({ error: "Error creating persona" });
    }

});


router.get('/get-personas', auth, async (req, res) => {
    try {
        const persona = await Persona.find({ user: req.user.id });
        const allPersonaResponse = await axios(getPersonaOption);
        const allPersona = allPersonaResponse.data.data;
        console.log(allPersona, "--------------------")
        const matchedPersonas = allPersona.filter(p =>
            persona.some(a => a.persona_id === p.persona_id)
        );



        res.json({ matchedPersonas });
    } catch (error) {
        console.error("Error getting persona:", error);
        res.status(500).json({ error: "Error getting persona" });
    }
});

export default router;
