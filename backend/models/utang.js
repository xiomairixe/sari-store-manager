import mongoose from "mongoose";

const utangSchema = new mongoose.Schema({
  customerName: String,
  phone: String,
  creditLimit: { type: Number, default: 1000 },
  amount: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  status: { type: String, default: "unpaid" }, // unpaid | partial | paid
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Utang", utangSchema);