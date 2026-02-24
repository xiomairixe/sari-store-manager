import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: String,
  qty: { type: Number, default: 1 },
  unitPrice: Number,
  total: Number,
  saleDate: { type: Date, default: Date.now }
});

export default mongoose.model("Sale", saleSchema);