import mongoose from "mongoose";

const dailyConfirmedSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  confirmedAmount: { type: Number, default: null },
}, { timestamps: true });

export default mongoose.model("DailyConfirmed", dailyConfirmedSchema);