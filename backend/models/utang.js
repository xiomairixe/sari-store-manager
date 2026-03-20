import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  type:      { type: String, enum: ["utang", "payment"], required: true },
  amount:    { type: Number, required: true },
  notes:     { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const utangSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone:        { type: String, default: "" },
  creditLimit:  { type: Number, default: 1000 },
  amount:       { type: Number, default: 0 },
  amountPaid:   { type: Number, default: 0 },
  balance:      { type: Number, default: 0 },
  notes:        { type: String, default: "" },
  status:       { type: String, enum: ["unpaid", "partial", "paid"], default: "unpaid" },
  transactions: { type: [transactionSchema], default: [] },
}, { timestamps: true });

export default mongoose.model("Utang", utangSchema);