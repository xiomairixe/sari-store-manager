import mongoose from "mongoose";

const costSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  category: String,
  costDate: { type: Date, default: Date.now }
});

export default mongoose.model("Cost", costSchema);