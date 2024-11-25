import mongoose from 'mongoose';

const personaSchema = new mongoose.Schema({
    persona_id: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.model('Persona', personaSchema);
