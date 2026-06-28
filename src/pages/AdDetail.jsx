import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdDetail() {
  const { id } = useParams(); // گرفتن آیدی آگهی از آدرس مرورگر
  const navigate = useNavigate();

  const [ad, setAd] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPhone, setShowPhone] = useState(false); // برای دکمه نمایش شماره تماس

  const API_URL = "http://localhost:3000/api";

  useEffect(() => {
    const fetchAdDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/ad/${id}`);
        setAd(response.data.adData);
      } catch (error) {
        toast.error("آگهی پیدا نشد یا حذف شده است!");
        navigate("/"); // اگه آگهی نبود برگرده صفحه اصلی
      } finally {
        setIsLoading(false);
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
        <div className="animate-spin w-10 h-10 border-4 border-divar border-t-transparent rounded-full"></div>
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

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f2f2f7] font-vazir text-[#1c1c1e] flex justify-center pb-24 relative"
    >
      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-xl flex flex-col animate-[fadeIn_0.3s_ease-out]">
        {/* هدر شناور */}
        <header className="absolute top-0 w-full z-40 bg-gradient-to-b from-black/50 to-transparent px-4 py-4 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </header>

        {/* گالری تصاویر (اسکرول افقی) */}
        <div className="w-full h-[350px] bg-gray-100 relative flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
          {ad.images && ad.images.length > 0 ? (
            ad.images.map((img, index) => (
              <img
                key={index}
                src={`${API_URL.replace("/api", "")}/${img}`}
                alt={`تصویر ${index + 1}`}
                className="w-full h-full object-cover shrink-0 snap-center"
              />
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              بدون تصویر
            </div>
          )}
          {/* شمارنده عکس */}
          {ad.images && ad.images.length > 1 && (
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">
              {ad.images.length} تصویر
            </div>
          )}
        </div>

        {/* اطلاعات آگهی */}
        <div className="p-5 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-snug">
              {ad.title}
            </h1>
            <p className="text-sm text-gray-500 font-bold mt-2">
              {ad.time || "لحظاتی پیش"} در {ad.city}
            </p>
          </div>

          <div className="flex justify-between items-center py-4 border-y border-gray-100">
            <span className="text-gray-500 font-bold">قیمت</span>
            <span className="text-xl font-black text-gray-900">
              {Number(ad.price).toLocaleString()}{" "}
              <span className="text-sm text-gray-500">تومان</span>
            </span>
          </div>

          {/* ویژگی‌های داینامیک */}
          {Object.keys(dynamicProps).length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="font-black text-gray-800">ویژگی‌ها</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(dynamicProps).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-gray-50 p-3 rounded-2xl flex flex-col gap-1 border border-gray-100"
                  >
                    <span className="text-[11px] font-bold text-gray-500">
                      {key}
                    </span>
                    <span className="text-sm font-black text-gray-900">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* توضیحات */}
          <div className="flex flex-col gap-2">
            <h3 className="font-black text-gray-800">توضیحات</h3>
            <p className="text-sm text-gray-700 leading-loose whitespace-pre-wrap">
              {ad.description}
            </p>
          </div>
        </div>

        {/* دکمه ثابت پایین صفحه (اطلاعات تماس) */}
        <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-100 p-4 pb-6 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
          <button
            onClick={() => setShowPhone(!showPhone)}
            className={`w-full font-bold rounded-2xl text-base px-5 py-4 text-center transition-all flex justify-center items-center h-[56px] ${showPhone ? "bg-gray-100 text-gray-900" : "bg-divar text-white hover:bg-[#8f1d1d] active:scale-[0.98]"}`}
          >
            {showPhone ? (
              <span className="text-xl tracking-widest" dir="ltr">
                {ad.user_phone}
              </span>
            ) : (
              "اطلاعات تماس"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
