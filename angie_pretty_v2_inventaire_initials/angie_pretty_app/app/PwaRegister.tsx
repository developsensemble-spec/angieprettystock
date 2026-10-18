"use client";
import { useEffect } from "react";
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && (window.location.protocol === "https:" || window.location.hostname === "localhost")) {
      navigator.serviceWorker.register("/sw.js").catch((error) => console.warn("Enregistrement PWA indisponible", error));
    }
  }, []);
  return null;
}
