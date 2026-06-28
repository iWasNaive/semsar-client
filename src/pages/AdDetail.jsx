import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion"; // 👈 اضافه شدن جادوگر

export default function AdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ad, setAd] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPhone, setShowPhone] = useState(false);

  const API_URL = "http://localhost:3000/api";

  useEffect(() => {
    const fetchAdDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/ad/${id}`);
        setAd(response.data.adData);
      } catch (error) {
        toast.error("آگهی پیدا نشد یا حذف شده است!");
        navigate("/");
      } finally {
        setTimeout(() => setIsLoading(false), 400); // یه کوچولو تاخیر برای دیدن انیمیشن لودینگ
      }
    };

    fetchAdDetails();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#f2f2f7] flex items-center justify-center"
      >
        {/* لودینگ استایل iOS */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-[3px] border-gray-300 border-t-gray-800 rounded-full"
        />
      </div>
    );
  }

  if (!ad) return null;

  // پارس کردن دیتای داینامیک
  let dynamicProps = {};
  if (ad.dynamicProperties) {
    try {
      dynamicProps =
        typeof ad.dynamicProperties === "string"
          ? JSON.parse(ad.dynamicProperties)
          : ad.dynamicProperties;
    } catch (e) {
      console.error("Error parsing dynamic props");
    }
  }

  // تنظیمات انیمیشنِ ورودِ پله‌ای (Stagger) برای محتوای صفحه
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f2f2f7] font-vazir text-[#1c1c1e] flex justify-center pb-28 relative"
    >
      <div className="w-full max-w-[420px] bg-[#fbfbfd] min-h-screen flex flex-col shadow-2xl relative">
        {/* دکمه بکِ شناور و شیشه‌ای (iOS Blur) */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 z-40"
        >
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-black/20 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-black/30 active:scale-90 transition-all shadow-lg"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </motion.header>

        {/* گالری تصاویر لبه‌به‌لبه (Edge to Edge) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full h-[400px] bg-gray-100 relative flex overflow-x-auto snap-x snap-mandatory hide-scrollbar rounded-b-[2.5rem] shadow-sm z-10"
        >
          {ad.images && ad.images.length > 0 ? (
            ad.images.map((img, index) => (
              <div
                key={index}
                className="w-full h-full shrink-0 snap-center relative"
              >
                <img
                  src={`${API_URL.replace("/api", "")}/${img}`}
                  alt={`تصویر ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* یه گرادیانت خیلی نرم پایین عکس که حس پرمیوم میده */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
            ))
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-12 h-12 opacity-20"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="font-bold text-sm">بدون تصویر</span>
            </div>
          )}

          {/* شمارنده عکس با استایل اپل */}
          {ad.images && ad.images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold tracking-widest">
              ۱ / {ad.images.length}
            </div>
          )}
        </motion.div>

        {/* اطلاعات آگهی (با انیمیشن پله‌ای) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="p-6 flex flex-col gap-8 -mt-4 relative z-20"
        >
          {/* عنوان و زمان */}
          <motion.div variants={itemVariants}>
            <h1 className="text-[22px] font-black text-gray-900 leading-snug">
              {ad.title}
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                {ad.city}
              </span>
              <span className="text-gray-400 text-xs font-bold">
                {ad.time || "لحظاتی پیش"}
              </span>
            </div>
          </motion.div>

          {/* قیمت (باکس جداگانه و بولد) */}
          <motion.div
            variants={itemVariants}
            className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100"
          >
            <span className="text-gray-500 font-bold text-sm">مبلغ کل</span>
            <span className="text-xl font-black text-gray-900">
              {Number(ad.price).toLocaleString()}{" "}
              <span className="text-xs text-gray-400">تومان</span>
            </span>
          </motion.div>

          {/* ویژگی‌های داینامیک (استایل ویجت‌های iOS) */}
          {Object.keys(dynamicProps).length > 0 && (
            <motion.div variants={itemVariants} className="flex flex-col gap-3">
              <h3 className="font-black text-gray-800 text-lg mb-1">مشخصات</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(dynamicProps).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-white p-4 rounded-3xl flex flex-col gap-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100"
                  >
                    <span className="text-[11px] font-bold text-gray-400">
                      {key}
                    </span>
                    <span className="text-sm font-black text-gray-800">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* توضیحات */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-3 mb-6"
          >
            <h3 className="font-black text-gray-800 text-lg mb-1">توضیحات</h3>
            <p className="text-[15px] text-gray-600 font-medium leading-loose whitespace-pre-wrap">
              {ad.description}
            </p>
          </motion.div>
        </motion.div>

        {/* داک پایینی ثابت (Bottom Bar با استایل شیشه‌ای iOS) */}
        <div className="fixed bottom-0 w-full max-w-[420px] bg-white/70 backdrop-blur-2xl border-t border-gray-200/50 p-4 pb-6 z-50">
          <motion.button
            layout // 👈 این باعث میشه وقتی متن عوض میشه، دکمه نرم تغییر سایز بده
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPhone(!showPhone)}
            className={`w-full font-bold rounded-[1.25rem] text-base px-5 py-4 text-center transition-colors flex justify-center items-center h-[56px] shadow-sm ${
              showPhone
                ? "bg-gray-100 text-gray-900 border border-gray-200/50"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            <AnimatePresence mode="wait">
              {showPhone ? (
                <motion.span
                  key="phone"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xl tracking-widest font-black"
                  dir="ltr"
                >
                  {ad.user_phone}
                </motion.span>
              ) : (
                <motion.span
                  key="text"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  اطلاعات تماس
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
