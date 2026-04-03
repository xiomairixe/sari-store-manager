import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import DailyConfirmed from "./models/DailyConfirmed.js";

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
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

// ── Helper: parse numeric fields from FormData ──
const BULK_UNITS = ["pack", "box"];

const parseProductFields = (body) => {
  const data = { ...body };
  ["cost", "markup", "stock", "reorder", "pcsPerUnit", "sellingPrice"].forEach((field) => {
    if (data[field] !== undefined && data[field] !== "") {
      const parsed = parseFloat(data[field]);
      data[field] = isNaN(parsed) ? null : parsed;
    } else if (data[field] === "") {
      data[field] = null;
    }
  });
  return data;
};

// ── Helper: compute selling price ──
const computeSellingPrice = (cost, markup, unit, pcsPerUnit) => {
  const isBulk = BULK_UNITS.includes(unit);
  if (isBulk && pcsPerUnit && pcsPerUnit > 0) {
    return Math.ceil((cost / pcsPerUnit) * (1 + markup / 100));
  }
  return Math.ceil(cost * (1 + markup / 100));
};

// ── Helper: handle duplicate key error ──
const isDuplicateKeyError = (err) =>
  err.code === 11000 || (err.message && err.message.includes("duplicate key"));

// ── Models ──
import Product from "./models/product.js";
import Sale from "./models/sale.js";
import Cost from "./models/cost.js";
import Utang from "./models/utang.js";
import Asset from "./models/asset.js";
import Note from "./models/note.js";

// ── HEALTH CHECK ──
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ════════════════════════════════════════════════════════════════════════════

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
    const data = parseProductFields(req.body);
    if (req.file) data.image = req.file.path;

    const isBulk = BULK_UNITS.includes(data.unit);
    if (isBulk && data.pcsPerUnit && data.pcsPerUnit > 0 && data.stockInPacks === "true") {
      data.stock = (data.stock || 0) * data.pcsPerUnit;
    }
    delete data.stockInPacks;

    data.sellingPrice = computeSellingPrice(
      data.cost || 0,
      data.markup || 0,
      data.unit,
      data.pcsPerUnit
    );

    data.priceHistory = [{
      cost:         data.cost || 0,
      markup:       data.markup || 0,
      sellingPrice: data.sellingPrice,
      changedAt:    new Date(),
      note:         "Initial price",
    }];

    const product = new Product(data);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ error: "DUPLICATE", message: "Mayroon nang product na may ganitong pangalan." });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const data = parseProductFields(req.body);

    if (req.file) {
      const old = await Product.findById(req.params.id);
      if (old?.image && old.image.includes("cloudinary.com")) {
        await deleteCloudinaryImage(old.image);
      }
      data.image = req.file.path;
    }

    const isBulk = BULK_UNITS.includes(data.unit);
    if (isBulk && data.pcsPerUnit && data.pcsPerUnit > 0 && data.stockInPacks === "true") {
      data.stock = (data.stock || 0) * data.pcsPerUnit;
    }
    delete data.stockInPacks;

    const newSellingPrice = computeSellingPrice(
      data.cost || 0,
      data.markup || 0,
      data.unit,
      data.pcsPerUnit
    );
    data.sellingPrice = newSellingPrice;
    data.updatedAt = new Date();

    const existing = await Product.findById(req.params.id);
    if (existing) {
      const costChanged   = existing.cost         !== data.cost;
      const markupChanged = existing.markup       !== data.markup;
      const priceChanged  = existing.sellingPrice !== newSellingPrice;

      if (costChanged || markupChanged || priceChanged) {
        data.$push = {
          priceHistory: {
            cost:         data.cost,
            markup:       data.markup,
            sellingPrice: newSellingPrice,
            changedAt:    new Date(),
            note: `Cost: ₱${existing.cost}→₱${data.cost}, SP: ₱${existing.sellingPrice}→₱${newSellingPrice}`,
          },
        };
      }
    }

    const { $push, ...flatData } = data;
    const updatePayload = { ...flatData };
    if ($push) updatePayload.$push = $push;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ error: "DUPLICATE", message: "Mayroon nang product na may ganitong pangalan." });
    }
    res.status(500).json({ error: err.message });
  }
});

app.patch("/products/:id/essential", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    product.isEssential = !product.isEssential;
    product.updatedAt = new Date();
    await product.save();
    res.json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product?.image && product.image.includes("cloudinary.com")) {
      await deleteCloudinaryImage(product.image);
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
// SALES
// ════════════════════════════════════════════════════════════════════════════

app.get("/sales", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ saleDate: -1 });
    res.json(sales);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/sales", async (req, res) => {
  try {
    const { productId, qty, unitPrice, productName, saleDate, notes, isDailySummary } = req.body;

    const sale = new Sale({
      productId:      productId || null,
      productName:    productName || "Manual Entry",
      qty:            parseFloat(qty) || 1,
      unitPrice:      parseFloat(unitPrice) || 0,
      saleDate:       saleDate || new Date(),
      notes:          notes || "",
      isDailySummary: isDailySummary || false,
    });

    await sale.save();

    if (productId && productId !== "null") {
      const product = await Product.findById(productId);
      if (product) {
        product.stock = Math.max(0, product.stock - (parseInt(qty) || 1));
        await product.save();
      }
    }

    res.status(201).json(sale);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
// DAILY CONFIRMED SALES
// ════════════════════════════════════════════════════════════════════════════

app.get("/sales/confirmed", async (req, res) => {
  try {
    const records = await DailyConfirmed.find();
    const map = {};
    records.forEach(r => { map[r.date] = r.confirmedAmount; });
    res.json(map);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/sales/confirmed/:date", async (req, res) => {
  try {
    const { confirmedAmount } = req.body;
    const record = await DailyConfirmed.findOneAndUpdate(
      { date: req.params.date },
      { confirmedAmount },
      { new: true, upsert: true }
    );
    res.json(record);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
// COSTS
// ════════════════════════════════════════════════════════════════════════════

app.get("/costs", async (req, res) => {
  try {
    const costs = await Cost.find().sort({ costDate: -1 });
    res.json(costs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/costs", upload.single("receipt"), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.receipt = req.file.path;
    const cost = new Cost(data);
    await cost.save();
    res.status(201).json(cost);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/costs/:id", async (req, res) => {
  try {
    const cost = await Cost.findById(req.params.id);
    if (cost?.receipt) await deleteCloudinaryImage(cost.receipt);
    await Cost.findByIdAndDelete(req.params.id);
    res.json({ message: "Cost deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
// UTANG (Customer Credit)
// ════════════════════════════════════════════════════════════════════════════

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
      phone:        req.body.phone || "",
      creditLimit:  req.body.creditLimit || 1000,
      amount: 0, amountPaid: 0, balance: 0, status: "unpaid",
      transactions: [],
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

    customer.amount  += parseFloat(amount);
    customer.balance  = customer.amount - customer.amountPaid;
    customer.status   = customer.balance <= 0 ? "paid"
                      : customer.amountPaid > 0 ? "partial"
                      : "unpaid";
    customer.transactions.push({
      type:      "utang",
      amount:    parseFloat(amount),
      notes:     notes || "",
      createdAt: new Date(),
    });

    await customer.save();
    res.json(customer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/utang/customers/:id/pay", async (req, res) => {
  try {
    const { amountPaid, notes } = req.body;
    const customer = await Utang.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    customer.amountPaid += parseFloat(amountPaid);
    customer.balance     = customer.amount - customer.amountPaid;
    customer.status      = customer.balance <= 0 ? "paid"
                         : customer.amountPaid > 0 ? "partial"
                         : "unpaid";
    customer.transactions.push({
      type:      "payment",
      amount:    parseFloat(amountPaid),
      notes:     notes || "",
      createdAt: new Date(),
    });

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

// ════════════════════════════════════════════════════════════════════════════
// ASSETS
// ════════════════════════════════════════════════════════════════════════════

app.get("/api/assets", async (req, res) => {
  try {
    const assets = await Asset.find().sort({ createdAt: -1 });
    res.json(assets);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/assets", async (req, res) => {
  try {
    const asset = new Asset(req.body);
    await asset.save();
    res.status(201).json(asset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/api/assets/:id", async (req, res) => {
  try {
    const updated = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Asset not found" });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/assets/:id", async (req, res) => {
  try {
    await Asset.findByIdAndDelete(req.params.id);
    res.json({ message: "Asset deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
// NOTES
// ════════════════════════════════════════════════════════════════════════════

app.get("/notes", async (req, res) => {
  try {
    const notes = await Note.find().sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/notes", async (req, res) => {
  try {
    const note = new Note(req.body);
    await note.save();
    res.status(201).json(note);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put("/notes/:id", async (req, res) => {
  try {
    const updated = await Note.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Note not found" });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/notes/:id", async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: "Note deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════════════════

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);

  const SELF_URL = process.env.RENDER_EXTERNAL_URL;

  if (SELF_URL) {
    setInterval(async () => {
      try {
        const res = await fetch(`${SELF_URL}/health`);
        const data = await res.json();
        console.log(`🏓 Keep-alive ping OK — uptime: ${data.uptime}s`);
      } catch (err) {
        console.warn("⚠️ Keep-alive ping failed:", err.message);
      }
    }, 14 * 60 * 1000);

    console.log(`🏓 Keep-alive enabled → ${SELF_URL}/health`);
  } else {
    console.log("ℹ️  Keep-alive disabled (RENDER_EXTERNAL_URL not set)");
  }
});