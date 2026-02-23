import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Expenses from "./pages/Expenses";
import Sales from "./pages/Sales";
import Costs from "./pages/Costs";
import Utang from "./pages/Utang";
import Checkout from "./pages/CheckOut";
import Navbar from "./layout/Navbar";
import React from "react";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/costs" element={<Costs />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/utang" element={<Utang />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </Router>
  );
}

export default App;
