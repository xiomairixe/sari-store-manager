import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  unit: String,
  cost: Number,
  markup: Number,
  stock: Number,
  reorder: { type: Number, default: 10 },
  expiry: Date,
  supplier: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Product", productSchema);