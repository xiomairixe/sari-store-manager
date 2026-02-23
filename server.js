// server.js
// Run: npm install express mysql2 multer cors dotenv

import express from "express";
import mysql   from "mysql2/promise";
import multer  from "multer";
import cors    from "cors";
import path    from "path";
import fs      from "fs";
import dotenv  from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// ── MySQL Pool ──────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "sari_store",
  waitForConnections: true,
  connectionLimit:    10,
});

// ── Multer ──────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase())
             && allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Images only!"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── PRODUCTS ────────────────────────────────────────────────────────────────

app.get("/products", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products ORDER BY createdAt DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/products", upload.single("image"), async (req, res) => {
  try {
    const { name, category, unit, cost, markup, stock, reorder, expiry, supplier, image } = req.body;
    const imagePath = req.file ? req.file.filename : (image || null);

    await pool.query(
      `INSERT INTO products (name, category, unit, cost, markup, stock, reorder, expiry, supplier, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, unit, cost, markup, stock, reorder || 10, expiry || null, supplier || null, imagePath]
    );

    const [newProduct] = await pool.query("SELECT * FROM products WHERE id = LAST_INSERT_ID()");
    res.status(201).json(newProduct[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, category, unit, cost, markup, stock, reorder, expiry, supplier, image } = req.body;
    let imagePath = req.file ? req.file.filename : (image || null);

    if (req.file) {
      const [old] = await pool.query("SELECT image FROM products WHERE id = ?", [req.params.id]);
      if (old.length && old[0].image && !old[0].image.startsWith("http")) {
        const oldPath = path.join(__dirname, "uploads", old[0].image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    await pool.query(
      `UPDATE products
       SET name=?, category=?, unit=?, cost=?, markup=?, stock=?, reorder=?, expiry=?, supplier=?, image=?, updatedAt=NOW()
       WHERE id=?`,
      [name, category, unit, cost, markup, stock, reorder || 10, expiry || null, supplier || null, imagePath, req.params.id]
    );

    const [updated] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT image FROM products WHERE id = ?", [req.params.id]);
    if (rows.length && rows[0].image && !rows[0].image.startsWith("http")) {
      const filePath = path.join(__dirname, "uploads", rows[0].image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SALES ───────────────────────────────────────────────────────────────────

app.get("/sales", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM sales ORDER BY saleDate DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/sales", async (req, res) => {
  try {
    const { productId, productName, qty, unitPrice, saleDate, isDailySummary } = req.body;
    const total = parseFloat(qty) * parseFloat(unitPrice);
    const saleDateVal = saleDate ? new Date(saleDate) : new Date();

    if (!isDailySummary && productId && parseInt(productId) > 0) {
      await pool.query("UPDATE products SET stock = stock - ? WHERE id = ?", [qty, productId]);
    }

    await pool.query(
      "INSERT INTO sales (productId, productName, qty, unitPrice, total, saleDate) VALUES (?, ?, ?, ?, ?, ?)",
      [productId || 0, productName, qty || 1, unitPrice, total, saleDateVal]
    );

    res.status(201).json({ message: "Sale recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── COSTS ───────────────────────────────────────────────────────────────────

app.get("/costs", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM costs ORDER BY costDate DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/costs", async (req, res) => {
  try {
    const { description, amount, category, costDate } = req.body;
    await pool.query(
      "INSERT INTO costs (description, amount, category, costDate) VALUES (?, ?, ?, ?)",
      [description, amount, category || null, costDate]
    );
    res.status(201).json({ message: "Cost recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/costs/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM costs WHERE id = ?", [req.params.id]);
    res.json({ message: "Cost deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UTANG ────────────────────────────────────────────────────────────────────

// GET all customers — balance computed on the fly so no missing-column errors
app.get("/utang/customers", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         id,
         customerName,
         phone,
         creditLimit,
         amount,
         amountPaid,
         (amount - amountPaid) AS balance,
         status,
         createdAt
       FROM utang
       ORDER BY customerName ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new customer
app.post("/utang/customers", async (req, res) => {
  try {
    const { customerName, phone, creditLimit } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: "customerName is required" });
    }

    const limit = parseFloat(creditLimit) || 1000;

    await pool.query(
      `INSERT INTO utang (customerName, phone, creditLimit, amount, amountPaid, status)
       VALUES (?, ?, ?, 0, 0, 'unpaid')`,
      [customerName.trim(), phone ? phone.trim() : null, limit]
    );

    const [newRow] = await pool.query(
      `SELECT id, customerName, phone, creditLimit, amount, amountPaid,
              (amount - amountPaid) AS balance, status, createdAt
       FROM utang WHERE id = LAST_INSERT_ID()`
    );
    res.status(201).json(newRow[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add utang (increase debt)
app.post("/utang/customers/:id/add", async (req, res) => {
  try {
    const { amount, notes } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    const [rows] = await pool.query("SELECT * FROM utang WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Customer not found" });

    const newAmount = parseFloat(rows[0].amount) + parseFloat(amount);
    const paid      = parseFloat(rows[0].amountPaid);
    const status    = newAmount <= paid ? "paid" : paid > 0 ? "partial" : "unpaid";

    await pool.query(
      `UPDATE utang SET amount = ?, status = ?, updatedAt = NOW() WHERE id = ?`,
      [newAmount, status, req.params.id]
    );

    const [updated] = await pool.query(
      `SELECT id, customerName, phone, creditLimit, amount, amountPaid,
              (amount - amountPaid) AS balance, status, createdAt
       FROM utang WHERE id = ?`,
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT record payment
app.put("/utang/customers/:id/pay", async (req, res) => {
  try {
    const { amountPaid } = req.body;

    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      return res.status(400).json({ error: "Valid amountPaid is required" });
    }

    const [rows] = await pool.query("SELECT * FROM utang WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Customer not found" });

    const newPaid = parseFloat(rows[0].amountPaid) + parseFloat(amountPaid);
    const status  = newPaid >= parseFloat(rows[0].amount) ? "paid"
                  : newPaid > 0 ? "partial" : "unpaid";

    await pool.query(
      `UPDATE utang SET amountPaid = ?, status = ?, updatedAt = NOW() WHERE id = ?`,
      [newPaid, status, req.params.id]
    );

    const [updated] = await pool.query(
      `SELECT id, customerName, phone, creditLimit, amount, amountPaid,
              (amount - amountPaid) AS balance, status, createdAt
       FROM utang WHERE id = ?`,
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE customer
app.delete("/utang/customers/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id FROM utang WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Customer not found" });

    await pool.query("DELETE FROM utang WHERE id = ?", [req.params.id]);
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── STATS ────────────────────────────────────────────────────────────────────

app.get("/stats", async (req, res) => {
  try {
    const [[todaySales]]   = await pool.query("SELECT COALESCE(SUM(total),0) AS total FROM sales WHERE DATE(saleDate)=CURDATE()");
    const [[monthlySales]] = await pool.query("SELECT COALESCE(SUM(total),0) AS total FROM sales WHERE MONTH(saleDate)=MONTH(CURDATE()) AND YEAR(saleDate)=YEAR(CURDATE())");
    const [[monthlyCosts]] = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM costs WHERE MONTH(costDate)=MONTH(CURDATE()) AND YEAR(costDate)=YEAR(CURDATE())");
    const [[totalItems]]   = await pool.query("SELECT COUNT(*) AS count FROM products");
    // FIX: compute balance inline instead of referencing a stored column
    const [[totalUtang]]   = await pool.query("SELECT COALESCE(SUM(amount - amountPaid),0) AS total FROM utang WHERE status != 'paid'");
    const [lowStock]       = await pool.query("SELECT * FROM products WHERE stock <= reorder");
    const [expiringSoon]   = await pool.query("SELECT * FROM products WHERE expiry IS NOT NULL AND expiry <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)");

    res.json({
      todaySales:   todaySales.total,
      netProfitMo:  monthlySales.total - monthlyCosts.total,
      totalItems:   totalItems.count,
      totalUtang:   totalUtang.total,
      lowStock,
      expiringSoon,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on http://localhost:${PORT}`));