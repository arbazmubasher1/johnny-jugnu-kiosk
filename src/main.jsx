import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Kitchen from "./Kitchen.jsx";
import "./input.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Kiosk login + order flow */}
        <Route path="/" element={<App />} />

        {/* Kitchen display */}
        <Route path="/kitchen" element={<Kitchen />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
