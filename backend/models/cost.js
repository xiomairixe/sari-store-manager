import mongoose from "mongoose";

const costSchema = new mongoose.Schema({
  description: String,
  amount:      Number,
  category:    String,
  costDate:    { type: Date, default: Date.now },
  receipt:     { type: String, default: null },
});

export default mongoose.model("Cost", costSchema);