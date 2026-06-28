import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true); // برای جابجایی بین فرم ورود و ثبت‌نام
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
  });

  const navigate = useNavigate(); // برای انتقال کاربر بعد از ورود موفق
  const API_URL = "http://localhost:3000/api/auth";

  // هندل کردن تایپ کاربر تو اینپوت‌ها
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ارسال درخواست به بک‌اِند
  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("شماره موبایل نامعتبر است! (مثال: 09123456789)");
      return; // اجرای تابع همینجا متوقف میشه و به سرور درخواست نمیره
    }
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/login" : "/register";

      // اگر تو حالت ورود هستیم، فقط شماره و رمز رو بفرست
      const payload = isLogin
        ? { phone: formData.phone, password: formData.password }
        : formData;

      const response = await axios.post(`${API_URL}${endpoint}`, payload, {
        withCredentials: true, // ⚠️ این برای گرفتن کوکی carrot از سرور الزامیه!
      });

      toast.success(
        isLogin ? "با موفقیت وارد شدید! 🚀" : "ثبت‌نام با موفقیت انجام شد! 🎉",
      );

      // بعد از ورود یا ثبت‌نام موفق، بفرستش به صفحه اصلی
      navigate("/");

      // تو فایل Auth.jsx این تیکه رو پیدا کن و با این جایگزین کن:
    } catch (error) {
      // ۱. پیامی که بک‌اِند فرستاده رو می‌گیریم (با علامت سوال‌ها جلوی کرش کردن برنامه در صورت قطعی نت رو می‌گیریم)
      const backendMessage = error.response?.data?.message;

      // ۲. حالا بر اساس پیامی که بک‌اِند داده، به کاربر توست (Toast) فارسی نشون میدیم:
      if (backendMessage === "phone exists") {
        toast.error("با این شماره قبلاً ثبت‌نام شده! لطفاً وارد شوید.");
      } else if (backendMessage === "incorrect user or pass") {
        toast.error("شماره موبایل یا رمز عبور اشتباه است!");
      } else if (backendMessage === "invalid phone format") {
        toast.error("فرمت شماره موبایل ارسالی به سرور اشتباه است!"); // این خط رو اضافه کن
      } else {
        // اگه ارور دیگه‌ای بود که ما پیش‌بینی نکردیم (مثلا ارور 500 دیتابیس)
        toast.error("خطایی تو ارتباط با سرور رخ داد!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-[#f2f2f7] font-vazir text-[#1c1c1e] p-4 animate-[fadeIn_0.4s_ease-out]"
    >
      <div className="w-full max-w-[400px] bg-white rounded-[32px] p-8 shadow-2xl">
        {/* هدر فرم */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-divar mb-2 tracking-tighter">
            سمسار.
          </h1>
          <h2 className="text-xl font-bold text-gray-800">
            {isLogin ? "ورود به حساب کاربری" : "ثبت‌نام در سمسار"}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {isLogin
              ? "برای ثبت آگهی لطفاً وارد شوید"
              : "برای شروع، اطلاعات خود را وارد کنید"}
          </p>
        </div>

        {/* فرم */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* فیلد نام (فقط در حالت ثبت‌نام نشون داده میشه) */}
          {!isLogin && (
            <div className="flex flex-col gap-1.5 animate-[slideDown_0.3s_ease-out]">
              <label className="text-sm font-bold text-gray-700 pr-1">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                name="name"
                required={!isLogin}
                value={formData.name}
                onChange={handleChange}
                placeholder="مثال: علی حسینی"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-divar/20 focus:border-divar block p-3.5 transition-all outline-none"
              />
            </div>
          )}

          {/* فیلد شماره موبایل */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700 pr-1">
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
              className="w-full text-left bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-divar/20 focus:border-divar block p-3.5 transition-all outline-none"
            />
          </div>

          {/* فیلد رمز عبور */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700 pr-1">
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
              className="w-full text-left bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-divar/20 focus:border-divar block p-3.5 transition-all outline-none"
            />
          </div>

          {/* دکمه ارسال */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white bg-divar hover:bg-[#8f1d1d] focus:ring-4 focus:ring-divar/30 font-bold rounded-2xl text-sm px-5 py-4 text-center transition-all mt-2 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center h-[52px]"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
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
          </button>
        </form>

        {/* دکمه جابجایی بین ورود و ثبت‌نام */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {isLogin ? "حساب کاربری ندارید؟ " : "قبلاً ثبت‌نام کرده‌اید؟ "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ name: "", phone: "", password: "" }); // پاک کردن فرم
              }}
              className="font-bold text-gray-900 hover:text-divar transition-colors underline decoration-2 underline-offset-4"
            >
              {isLogin ? "ثبت‌نام کنید" : "وارد شوید"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
