// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// ── MongoDB Connection ──
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ── Multer Setup ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Images only!"));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ── Models ──
import Product from "../sari-store-api/models/product.js";
import Sale from "../sari-store-api/models/sale.js";
import Cost from "../sari-store-api/models/cost.js";
import Utang from "../sari-store-api/models/utang.js";

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
    if (req.file) data.image = req.file.filename;
    const product = new Product(data);
    await product.save();
    res.status(201).json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = req.file.filename;
    if (req.file) {
      const old = await Product.findById(req.params.id);
      if (old && old.image && !old.image.startsWith("http")) {
        const oldPath = path.join(__dirname, "uploads", old.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }
    const updated = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product && product.image && !product.image.startsWith("http")) {
      const filePath = path.join(__dirname, "uploads", product.image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
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
    const sale = new Sale({ productId, productName, qty, unitPrice, total, saleDate: saleDate || new Date() });
    await sale.save();

    // Update stock
    if (productId) {
      const product = await Product.findById(productId);
      if (product) {
        product.stock -= qty;
        await product.save();
      }
    }
    res.status(201).json(sale);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── COSTS ──
app.get("/costs", async (req, res) => {
  try { const costs = await Cost.find().sort({ costDate: -1 }); res.json(costs); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/costs", async (req, res) => {
  try { const cost = new Cost(req.body); await cost.save(); res.status(201).json(cost); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/costs/:id", async (req, res) => {
  try { await Cost.findByIdAndDelete(req.params.id); res.json({ message: "Cost deleted" }); }
  catch (err) { res.status(500).json({ error: err.message }); }
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
    const customer = new Utang({ ...req.body, amount: 0, amountPaid: 0, status: "unpaid" });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/utang/customers/:id/pay", async (req, res) => {
  try {
    const { amountPaid } = req.body;
    const customer = await Utang.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    customer.amountPaid += parseFloat(amountPaid);
    if (customer.amountPaid >= customer.amount) customer.status = "paid";
    else if (customer.amountPaid > 0) customer.status = "partial";
    else customer.status = "unpaid";

    await customer.save();
    res.json(customer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/utang/customers/:id", async (req, res) => {
  try { await Utang.findByIdAndDelete(req.params.id); res.json({ message: "Customer deleted" }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── START SERVER ──
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));