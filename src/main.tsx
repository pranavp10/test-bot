// const chatDiv = document.createElement("div");
// chatDiv.setAttribute("id", "chat-id");
// document.body.appendChild(chatDiv);

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("chat-id") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
