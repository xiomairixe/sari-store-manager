// ── UTANG ROUTES ─────────────────────────────────────────────────────────────
// Replace the existing utang section in your server.js with this block.

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
    customer.status   = customer.balance <= 0 ? "paid" : customer.amountPaid > 0 ? "partial" : "unpaid";
    if (notes) customer.notes = notes;

    // ── Push transaction record ──
    customer.transactions.push({
      type:   "utang",
      amount: parseFloat(amount),
      notes:  notes || "",
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
    customer.status      = customer.balance <= 0 ? "paid" : customer.amountPaid > 0 ? "partial" : "unpaid";

    // ── Push transaction record ──
    customer.transactions.push({
      type:   "payment",
      amount: parseFloat(amountPaid),
      notes:  notes || "",
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