// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors({
  origin: [
    "https://honrado-store.vercel.app",
    "http://localhost:5173",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// ── MongoDB Connection ──
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ── Cloudinary Config ──
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer + Cloudinary Storage ──
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sari-store",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Helper: delete image from Cloudinary ──
const deleteCloudinaryImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes("cloudinary.com")) return;
  try {
    const parts = imageUrl.split("/");
    const filenameWithExt = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${filenameWithExt.split(".")[0]}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Failed to delete Cloudinary image:", err.message);
  }
};

// ── Models ──
import Product from "./models/product.js";
import Sale from "./models/sale.js";
import Cost from "./models/cost.js";
import Utang from "./models/utang.js";

// ── PRODUCTS ──
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/products", upload.single("image"), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.path;

    // ── Stock is always saved in PIECES ──
    // If bulk (pack/box) and owner entered packs, convert to pcs before saving
    const isBulk = ["pack", "box"].includes(data.unit);
    if (isBulk && data.pcsPerUnit && parseFloat(data.pcsPerUnit) > 0) {
      data.stock = parseFloat(data.stock) * parseFloat(data.pcsPerUnit);
    }

    const product = new Product(data);
    await product.save();
    res.status(201).json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      const old = await Product.findById(req.params.id);
      if (old?.image) await deleteCloudinaryImage(old.image);
      data.image = req.file.path;
    }

    // ── If stock was re-entered in packs, convert to pcs ──
    // Frontend sends stockInPacks flag when owner edits stock count
    const isBulk = ["pack", "box"].includes(data.unit);
    if (isBulk && data.pcsPerUnit && data.stockInPacks === "true") {
      data.stock = parseFloat(data.stock) * parseFloat(data.pcsPerUnit);
    }
    delete data.stockInPacks; // clean up before saving

    const updated = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product?.image) await deleteCloudinaryImage(product.image);
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SALES ──
app.get("/sales", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ saleDate: -1 });
    res.json(sales);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/sales", async (req, res) => {
  try {
    const { productId, qty, unitPrice, productName, saleDate } = req.body;
    const total = parseFloat(qty) * parseFloat(unitPrice);
    const sale = new Sale({
      productId, productName, qty, unitPrice, total,
      saleDate: saleDate || new Date(),
    });
    await sale.save();

    // ── Stock is always in PIECES, so just deduct qty directly ──
    if (productId) {
      const product = await Product.findById(productId);
      if (product) {
        product.stock = Math.max(0, product.stock - parseInt(qty));
        await product.save();
      }
    }
    res.status(201).json(sale);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── COSTS ──
app.get("/costs", async (req, res) => {
  try {
    const costs = await Cost.find().sort({ costDate: -1 });
    res.json(costs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/costs", async (req, res) => {
  try {
    const cost = new Cost(req.body);
    await cost.save();
    res.status(201).json(cost);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/costs/:id", async (req, res) => {
  try {
    await Cost.findByIdAndDelete(req.params.id);
    res.json({ message: "Cost deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── UTANG ──
app.get("/utang/customers", async (req, res) => {
  try {
    const customers = await Utang.find().sort({ customerName: 1 });
    res.json(customers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/utang/customers", async (req, res) => {
  try {
    const customer = new Utang({
      customerName: req.body.customerName,
      phone: req.body.phone || "",
      creditLimit: req.body.creditLimit || 1000,
      amount: 0, amountPaid: 0, balance: 0, status: "unpaid",
    });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/utang/customers/:id/add", async (req, res) => {
  try {
    const { amount, notes } = req.body;
    const customer = await Utang.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    customer.amount += parseFloat(amount);
    customer.balance = customer.amount - customer.amountPaid;
    if (customer.balance <= 0) customer.status = "paid";
    else if (customer.amountPaid > 0) customer.status = "partial";
    else customer.status = "unpaid";
    if (notes) customer.notes = notes;
    await customer.save();
    res.json(customer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/utang/customers/:id/pay", async (req, res) => {
  try {
    const { amountPaid } = req.body;
    const customer = await Utang.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    customer.amountPaid += parseFloat(amountPaid);
    customer.balance = customer.amount - customer.amountPaid;
    if (customer.balance <= 0) customer.status = "paid";
    else if (customer.amountPaid > 0) customer.status = "partial";
    else customer.status = "unpaid";
    await customer.save();
    res.json(customer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/utang/customers/:id", async (req, res) => {
  try {
    await Utang.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── START SERVER ──
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));