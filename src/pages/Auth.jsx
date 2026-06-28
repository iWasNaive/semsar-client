import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // 👈 اضافه شدن Framer Motion

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
  });

  const navigate = useNavigate();
  const API_URL = "http://localhost:3000/api/auth";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // اعتبارسنجی شماره موبایل در فرانت‌اِند
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("شماره موبایل نامعتبر است! (مثال: 09123456789)");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/login" : "/register";
      const payload = isLogin
        ? { phone: formData.phone, password: formData.password }
        : formData;

      await axios.post(`${API_URL}${endpoint}`, payload, {
        withCredentials: true,
      });

      toast.success(
        isLogin ? "با موفقیت وارد شدید! 🚀" : "ثبت‌نام با موفقیت انجام شد! 🎉",
      );
      navigate("/");
    } catch (error) {
      const backendMessage = error.response?.data?.message;
      if (backendMessage === "phone exists") {
        toast.error("با این شماره قبلاً ثبت‌نام شده! لطفاً وارد شوید.");
      } else if (backendMessage === "incorrect user or pass") {
        toast.error("شماره موبایل یا رمز عبور اشتباه است!");
      } else if (backendMessage === "invalid phone format") {
        toast.error("فرمت شماره موبایل ارسالی به سرور اشتباه است!");
      } else {
        toast.error("خطایی رخ داد!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-[#f2f2f7] font-vazir text-[#1c1c1e] p-4 overflow-hidden"
    >
      {/* 
        استفاده از motion.div با خاصیت layout 
        این کار باعث میشه وقتی ارتفاع فرم زیاد/کم میشه، با انیمیشن نرم تغییر کنه
      */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-[400px] bg-white rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.08)] relative z-10"
      >
        {/* هدر فرم با انیمیشن تغییر متن */}
        <div className="text-center mb-8">
          <motion.h1
            layout
            className="text-4xl font-black text-divar mb-2 tracking-tighter"
          >
            سمسار.
          </motion.h1>

          {/* AnimatePresence برای انیمیشنِ ورود و خروجِ المان‌ها استفاده میشه */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-black text-gray-900">
                {isLogin ? "ورود به حساب کاربری" : "ثبت‌نام در سمسار"}
              </h2>
              <p className="text-sm font-bold text-gray-400 mt-2">
                {isLogin
                  ? "برای ثبت آگهی لطفاً وارد شوید"
                  : "برای شروع، اطلاعات خود را وارد کنید"}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* فرم */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* فیلد نام (انیمیشن آکاردئونی) */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                animate={{ height: "auto", opacity: 1, overflow: "visible" }}
                exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="flex flex-col gap-2"
              >
                <label className="text-sm font-black text-gray-700 pr-1">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  name="name"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: علی حسینی"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-divar/20 focus:border-divar block p-4 transition-all outline-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* فیلد شماره موبایل */}
          <motion.div layout className="flex flex-col gap-2">
            <label className="text-sm font-black text-gray-700 pr-1">
              شماره موبایل
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="09123456789"
              dir="ltr"
              className="w-full text-left bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-divar/20 focus:border-divar block p-4 transition-all outline-none"
            />
          </motion.div>

          {/* فیلد رمز عبور */}
          <motion.div layout className="flex flex-col gap-2">
            <label className="text-sm font-black text-gray-700 pr-1">
              رمز عبور
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              dir="ltr"
              className="w-full text-left bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-divar/20 focus:border-divar block p-4 transition-all outline-none"
            />
          </motion.div>

          {/* دکمه ارسال با انیمیشن هاور و کلیک */}
          <motion.button
            layout
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading}
            className="w-full text-white bg-divar hover:bg-[#8f1d1d] hover:shadow-[0_8px_20px_rgba(166,38,38,0.25)] font-black rounded-2xl text-base px-5 py-4 text-center transition-all mt-4 disabled:opacity-70 flex justify-center items-center h-[56px]"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : isLogin ? (
              "ورود به حساب"
            ) : (
              "ثبت‌نام"
            )}
          </motion.button>
        </form>

        {/* دکمه جابجایی بین ورود و ثبت‌نام */}
        <motion.div layout className="mt-8 text-center">
          <p className="text-sm font-bold text-gray-500">
            {isLogin ? "حساب کاربری ندارید؟ " : "قبلاً ثبت‌نام کرده‌اید؟ "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ name: "", phone: "", password: "" }); // پاک کردن فرم
              }}
              className="font-black text-gray-900 hover:text-divar transition-colors underline decoration-2 underline-offset-4"
            >
              {isLogin ? "ثبت‌نام کنید" : "وارد شوید"}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
