import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Asset name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["equipment", "vehicle", "property", "inventory", "other"],
      default: "other",
    },
    value: {
      type: Number,
      required: [true, "Asset value is required"],
      min: [0, "Value cannot be negative"],
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "maintenance", "disposed"],
      default: "active",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    quantity: {
      type: Number,
      default: null,
      min: [0, "Quantity cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;