import mongoose from "mongoose";

const noteItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  checked: { type: Boolean, default: false },
  qty: { type: String, default: "" },
});

const noteSchema = new mongoose.Schema({
  title: { type: String, default: "Shopping List" },
  items: [noteItemSchema],
  color: { type: String, default: "#fff8f0" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Note", noteSchema);