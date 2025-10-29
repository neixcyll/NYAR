import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { CartProvider } from "@/context/cart-context"; // ✅ pastikan hurufnya sama persis
import { Toaster } from "react-hot-toast"; // ✅ untuk notifikasi toast

ReactDOM.createRoot(document.getElementById("root")!).render(
  <CartProvider>   {/* ✅ bungkus seluruh aplikasi */}
    <App />
    <Toaster position="bottom-right" />
  </CartProvider>
);
