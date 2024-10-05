import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Page from "./page/index.jsx";
import App from "./App.jsx";
import "./index.css";

export default function Routing() {
  const [planet, setPlanet] = useState({});
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Page planet={planet} setPlanet={setPlanet} />}
        />
        <Route
          path="/app"
          element={<App planet={planet} setPlanet={setPlanet} />}
        />
      </Routes>
    </Router>
  );
}
