import mongoose from "mongoose";

const costSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    amount:      { type: Number, required: true },
    category:    { type: String, default: null },
    costDate:    { type: Date,   required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Cost", costSchema);