import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    productId:    { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    productName:  { type: String, required: true },
    qty:          { type: Number, default: 1 },
    unitPrice:    { type: Number, required: true },
    total:        { type: Number, required: true },
    saleDate:     { type: Date,   default: Date.now },
    isDailySummary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);