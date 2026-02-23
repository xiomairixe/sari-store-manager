// routes/utang.js
const express = require("express");
const router = express.Router();

router.get("/customers", async (req, res) => { /* ... */ });
router.post("/customers", async (req, res) => { /* ... */ });
router.post("/customers/:id/add", async (req, res) => { /* ... */ });
router.put("/customers/:id/pay", async (req, res) => { /* ... */ });
router.delete("/customers/:id", async (req, res) => { /* ... */ });

module.exports = router;