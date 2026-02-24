import mongoose from "mongoose";

const utangSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone:        { type: String, default: null },
    creditLimit:  { type: Number, default: 1000 },
    amount:       { type: Number, default: 0 },      // total debt incurred
    amountPaid:   { type: Number, default: 0 },      // total paid
    status:       { type: String, enum: ["unpaid", "partial", "paid"], default: "unpaid" },
  },
  { timestamps: true }
);

// Virtual: balance (not stored — computed on read)
utangSchema.virtual("balance").get(function () {
  return this.amount - this.amountPaid;
});

utangSchema.set("toJSON",   { virtuals: true });
utangSchema.set("toObject", { virtuals: true });

export default mongoose.model("Utang", utangSchema);