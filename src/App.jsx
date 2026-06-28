import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// ایمپورت کردن صفحاتی که قراره بسازیم
import Home from "./pages/Home";
import Auth from "./pages/Auth"; // اینو بعدا که ساختیم از کامنت درمیاریم
import CreateAd from "./pages/CreateAd";
import Admin from "./pages/Admin";
import AdDetail from "./pages/AdDetail";

function App() {
  return (
    <Router>
      {/* Toaster اینجا میمونه که تو کل صفحات کار کنه */}
      <Toaster
        position="top-center"
        toastOptions={{
          className: "text-sm font-bold",
          style: {
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(20px)",
            borderRadius: "100px",
            padding: "12px 24px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          },
        }}
      />

      <Routes>
        {/* مسیر صفحه اصلی */}
        <Route path="/" element={<Home />} />
        {/* مسیر صفحه ورود و ثبت‌نام (بعدا می‌سازیمش) */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/create-ad" element={<CreateAd />} />{" "}
        {/* 👈 این رو اضافه کن */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/ad/:id" element={<AdDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
