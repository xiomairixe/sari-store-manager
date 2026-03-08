import express from "express";
import Sale from "../models/Sale.js";
import DailyConfirmed from "../models/DailyConfirmed.js";

const router = express.Router();

// ── Sales ─────────────────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ saleDate: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { productId, productName, qty, unitPrice, saleDate, notes, isDailySummary } = req.body;
    const total = parseFloat(unitPrice) * (parseInt(qty) || 1);
    const sale = await Sale.create({
      productId: productId || null,
      productName,
      qty: qty || 1,
      unitPrice: parseFloat(unitPrice),
      total,
      saleDate: saleDate ? new Date(saleDate) : new Date(),
      notes,
      isDailySummary: isDailySummary || false,
    });
    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Daily Confirmed Amounts ───────────────────────────────────────────────────

router.get("/confirmed", async (req, res) => {
  try {
    const records = await DailyConfirmed.find({});
    const map = {};
    records.forEach(r => { map[r.date] = r.confirmedAmount; });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/confirmed/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const { confirmedAmount } = req.body;
    const record = await DailyConfirmed.findOneAndUpdate(
      { date },
      { confirmedAmount },
      { upsert: true, new: true }
    );
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;