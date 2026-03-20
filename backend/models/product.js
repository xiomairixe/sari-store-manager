import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema({
  cost:         { type: Number, required: true },
  markup:       { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  changedAt:    { type: Date, default: Date.now },
  note:         { type: String, default: "" },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name:         { type: String, required: true, unique: true, trim: true },
  category:     String,
  unit:         String,
  pcsPerUnit:   { type: Number, default: null },
  cost:         Number,
  markup:       Number,
  sellingPrice: { type: Number, default: null },
  stock:        Number,
  reorder:      { type: Number, default: 10 },
  expiry:       Date,
  supplier:     String,
  image:        String,
  priceHistory: { type: [priceHistorySchema], default: [] },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now },
});

// Case-insensitive unique index on name
productSchema.index({ name: 1 }, {
  unique: true,
  collation: { locale: "en", strength: 2 },
});

export default mongoose.model("Product", productSchema);