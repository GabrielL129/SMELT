"use client";
import { useEffect } from "react";

export default function DocsPage() {
  useEffect(() => {
    // Redirect to the static docs HTML served from public/
    window.location.href = "/docs/index.html";
  }, []);
  return (
    <div style={{
      background:"#0a0a0a", color:"#ff6b1a",
      minHeight:"100vh", display:"flex",
      alignItems:"center", justifyContent:"center",
      fontFamily:"monospace", fontSize:"14px", letterSpacing:".15em"
    }}>
      LOADING DOCS...
    </div>
  );
}
