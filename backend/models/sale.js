import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: String,
  qty: { type: Number, default: 1 },
  unitPrice: Number,
  total: Number,
  saleDate: { type: Date, default: Date.now },
  notes: String,
  isDailySummary: { type: Boolean, default: false },
});

// Always recompute total before saving
saleSchema.pre("save", function (next) {
  this.total = (this.qty || 1) * (this.unitPrice || 0);
  next();
});

export default mongoose.model("Sale", saleSchema);