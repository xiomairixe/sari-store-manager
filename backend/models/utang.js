// models/utang.js
import mongoose from "mongoose";

const utangSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone:        { type: String, default: "" },
  creditLimit:  { type: Number, default: 1000 },
  amount:       { type: Number, default: 0 },   // total debt added
  amountPaid:   { type: Number, default: 0 },   // total paid
  balance:      { type: Number, default: 0 },   // amount - amountPaid
  notes:        { type: String, default: "" },
  status:       { type: String, enum: ["unpaid", "partial", "paid"], default: "unpaid" },
}, { timestamps: true });

export default mongoose.model("Utang", utangSchema);