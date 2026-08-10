import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Control de Asistencia</h1>
      <p>CHIQUISTRUKIS — esqueleto. API: /api/v1</p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
