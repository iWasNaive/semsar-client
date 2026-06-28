import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [pendingAds, setPendingAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const API_URL = "http://localhost:3000/api";

  // گرفتن لیست آگهی‌های در انتظار تایید موقع لود صفحه
  useEffect(() => {
    const fetchPendingAds = async () => {
      try {
        const res = await axios.get(`${API_URL}/ad/pending-ads`, {
          withCredentials: true, // حتماً باید باشه تا کوکی و نقش ادمین چک بشه
        });

        // بک‌اِند ممکنه پیام بده یا لیست آگهی‌ها رو بفرسته
        if (res.data.ads) {
          setPendingAds(res.data.ads);
        } else {
          setPendingAds([]);
        }
      } catch (error) {
        // اگه کاربر ادمین نبود یا لاگین نکرده بود
        if (error.response?.status === 401 || error.response?.status === 403) {
          toast.error("شما دسترسی مدیریت ندارید!");
          navigate("/");
        } else {
          toast.error("خطا در دریافت لیست آگهی‌ها");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingAds();
  }, [navigate]);

  // تابع تغییر وضعیت آگهی (تایید یا رد)
  const handleStatusChange = async (adId, status) => {
    // برای جلوگیری از کلیک اشتباه، یه تاییدیه می‌گیریم
    const actionName = status === "approved" ? "تایید" : "رد";
    if (!window.confirm(`آیا از ${actionName} این آگهی مطمئن هستید؟`)) return;

    try {
      await axios.patch(
        `${API_URL}/ad/${adId}/status`,
        { status: status },
        { withCredentials: true },
      );

      toast.success(`آگهی با موفقیت ${actionName} شد`);

      // آگهیِ تعیین‌تکلیف‌شده رو از استیت حذف می‌کنیم تا از صفحه ناپدید بشه
      setPendingAds((prevAds) => prevAds.filter((ad) => ad.id !== adId));
    } catch (error) {
      toast.error("خطا در تغییر وضعیت آگهی");
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f2f2f7] font-vazir text-[#1c1c1e] flex justify-center pb-12"
    >
      <div className="w-full max-w-[600px] flex flex-col animate-[fadeIn_0.3s_ease-out]">
        {/* هدر صفحه ادمین */}
        <header className="sticky top-0 z-40 bg-gray-900 text-white backdrop-blur-xl px-5 py-5 flex justify-between items-center shadow-lg rounded-b-3xl mb-6">
          <div>
            <h1 className="text-xl font-black">پنل مدیریت سمسار</h1>
            <p className="text-xs font-bold text-gray-400 mt-1">
              بررسی آگهی‌های در انتظار
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-sm font-bold"
          >
            بازگشت به سایت
          </button>
        </header>

        <main className="px-4 flex flex-col gap-4">
          {isLoading ? (
            <div className="text-center font-bold text-gray-500 mt-10">
              در حال بارگذاری...
            </div>
          ) : pendingAds.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center shadow-sm flex flex-col items-center border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-8 h-8 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-black text-gray-800">
                همه چیز مرتب است!
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                هیچ آگهی در انتظار تاییدی وجود ندارد.
              </p>
            </div>
          ) : (
            pendingAds.map((ad) => (
              <div
                key={ad.id}
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4 animate-[slideUp_0.4s_ease-out_backwards]"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      {ad.title}
                    </h3>
                    <p className="text-[13px] text-gray-500 mt-2 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {ad.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
                    قیمت: {Number(ad.price).toLocaleString()} تومان
                  </span>
                  <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
                    شهر (ID): {ad.city_id}
                  </span>
                  <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
                    دسته (ID): {ad.category_id}
                  </span>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => handleStatusChange(ad.id, "approved")}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-2xl transition-colors active:scale-95 shadow-sm shadow-green-500/20"
                  >
                    تایید آگهی
                  </button>
                  <button
                    onClick={() => handleStatusChange(ad.id, "rejected")}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-2xl transition-colors active:scale-95"
                  >
                    رد آگهی
                  </button>
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
