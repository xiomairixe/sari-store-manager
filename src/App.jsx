import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Costs from "./pages/Costs";
import Utang from "./pages/Utang";
import Checkout from "./pages/CheckOut";
import Suppliers from "./pages/Suppliers";
import Navbar from "./layout/Navbar";
import Assets from "./pages/Assets";
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
        <Route path="/utang" element={<Utang />} />
        <Route path="/Assets" element={<Assets />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/suppliers" element={<Suppliers />} />
      </Routes>
    </Router>
  );
}

export default App;