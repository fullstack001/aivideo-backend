import mongoose from "mongoose";

const ReplicaSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  replica_id: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },  
});

const Replica = mongoose.model("Replica", ReplicaSchema);

export default Replica;
