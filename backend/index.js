const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "workbench_user", // put your MySQL username here if you have one
  password: "YourStrongPassword", // put your MySQL password here if you have one
  database: "sari_store",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL");
  }
});


// =======================
// ROUTES
// =======================

// Root test route
app.get("/", (req, res) => {
  res.send("Sari-Sari Store API Running");
});


// GET all products
app.get("/products", (req, res) => {
  const sql = "SELECT * FROM products";
  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});


// ADD product
app.post("/products", (req, res) => {
  const { name, price, stock } = req.body;

  const sql = "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)";
  db.query(sql, [name, price, stock], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json({ message: "Product added successfully" });
  });
});


// UPDATE product
app.put("/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, stock } = req.body;

  const sql =
    "UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?";

  db.query(sql, [name, price, stock, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json({ message: "Product updated successfully" });
  });
});


// DELETE product
app.delete("/products/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM products WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json({ message: "Product deleted successfully" });
  });
});


// =======================
// SERVER
// =======================

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
