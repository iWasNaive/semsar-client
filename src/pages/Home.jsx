import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom"; // اضافه شدن برای جابجایی بین صفحات

export default function Home() {
  // ---------------- استیت‌های مربوط به آگهی‌ها و دسته‌بندی‌ها ----------------
  const [ads, setAds] = useState([]);
  const [rawCategories, setRawCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [currentParentCategory, setCurrentParentCategory] = useState(null);

  // ---------------- استیت‌های مربوط به شهر و استان ----------------
  const [city, setCity] = useState("انتخاب شهر");
  const [citiesList, setCitiesList] = useState([]);
  const [needsCitySelection, setNeedsCitySelection] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState(null);

  // ---------------- استیت لودینگ ----------------
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate(); // برای انتقال کاربر
  const API_URL = "http://localhost:3000/api";

  useEffect(() => {
    const initApp = async () => {
      const savedCityId = Cookies.get("city_id");
      const savedCityName = Cookies.get("city_name");

      if (!savedCityId) {
        try {
          setIsLoading(true);
          const response = await axios.get(`${API_URL}/city`);
          const citiesData = response.data.cities || response.data;
          setCitiesList(citiesData);
          setNeedsCitySelection(true);
        } catch (error) {
          toast.error("خطا در دریافت لیست شهرها");
        } finally {
          setIsLoading(false);
        }
      } else {
        setCity(savedCityName || "نامشخص");
        fetchAdsAndCategories(savedCityId);
      }
    };
    initApp();
  }, []);

  const fetchAdsAndCategories = async (cityId) => {
    setIsLoading(true);
    try {
      const [adsResponse, catsResponse] = await Promise.all([
        axios.get(`${API_URL}/ad?city_id=${cityId}`),
        axios.get(`${API_URL}/category`),
      ]);

      const adsData = adsResponse.data.ads || adsResponse.data;
      setAds(Array.isArray(adsData) ? adsData : []);

      const catsData =
        catsResponse.data.data ||
        catsResponse.data.categories ||
        catsResponse.data;
      if (Array.isArray(catsData)) {
        setRawCategories(catsData);
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setAds([]);
      } else {
        toast.error("ارتباط با سرور برقرار نشد!");
      }
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  };

  const handleOpenCitySelection = async () => {
    if (citiesList.length === 0) {
      try {
        const response = await axios.get(`${API_URL}/city`);
        const citiesData = response.data.cities || response.data;
        setCitiesList(citiesData);
      } catch (error) {
        toast.error("خطا در دریافت لیست شهرها");
        return;
      }
    }
    Cookies.remove("city_id");
    Cookies.remove("city_name");
    setNeedsCitySelection(true);
    setSelectedProvince(null);
  };

  const handleSelectFinalCity = (selectedCity) => {
    Cookies.set("city_id", selectedCity.id, { expires: 365 });
    Cookies.set("city_name", selectedCity.name || selectedCity.title, {
      expires: 365,
    });

    setCity(selectedCity.name || selectedCity.title);
    setNeedsCitySelection(false);
    setSelectedProvince(null);
    fetchAdsAndCategories(selectedCity.id);
  };

  // --- منطق بررسی ورود برای دکمه ثبت آگهی ---
  const handleCreateAdClick = async () => {
    try {
      // بررسی می‌کنیم که کاربر توکن معتبر داره یا نه
      await axios.get(`${API_URL}/auth/me`, {
        withCredentials: true,
      });
      // اگه ارور نداد یعنی لاگینه، بفرستش صفحه ثبت آگهی
      navigate("/create-ad");
    } catch (error) {
      // اگه ارور داد (401) یعنی لاگین نیست
      toast("برای ثبت آگهی اول باید وارد بشی!", { icon: "🔐" });
      navigate("/auth");
    }
  };

  // --- محاسبات مربوط به شهرها و دسته‌بندی‌ها ---
  const provinces = citiesList.filter(
    (c) => c.parent_id === null || c.parent_id === undefined,
  );
  const subCities = selectedProvince
    ? citiesList.filter((c) => c.parent_id == selectedProvince.id)
    : [];

  const displayCategories = currentParentCategory
    ? rawCategories.filter((c) => c.parent_id == currentParentCategory.id)
    : rawCategories.filter(
        (c) => c.parent_id === null || c.parent_id === undefined,
      );

  const displayedAds = ads.filter((ad) => {
    if (activeCategory) {
      return ad.category_id == activeCategory;
    }
    if (currentParentCategory) {
      const childIds = rawCategories
        .filter((c) => c.parent_id == currentParentCategory.id)
        .map((c) => c.id);
      return (
        ad.category_id == currentParentCategory.id ||
        childIds.some((id) => id == ad.category_id)
      );
    }
    return true;
  });

  // ---------------- UI مودال انتخاب شهر / استان ----------------
  if (needsCitySelection) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-[#f2f2f7] font-vazir text-[#1c1c1e] p-4 animate-[fadeIn_0.4s_ease-out]"
      >
        <div className="w-full max-w-[420px] bg-white rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] transform transition-all duration-500 hover:shadow-3xl">
          <h2 className="text-2xl font-black text-center mb-2 text-divar animate-[slideDown_0.5s_ease-out]">
            {selectedProvince
              ? `شهرهای استان ${selectedProvince.name}`
              : "استان خود را انتخاب کنید"}
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            {selectedProvince
              ? "شهر مورد نظر خود را انتخاب کنید"
              : "برای دیدن آگهی‌ها، لطفاً استان خود را مشخص کنید"}
          </p>

          {isLoading ? (
            <div className="flex flex-col gap-3 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded-2xl animate-pulse"
                ></div>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto hide-scrollbar fade-in-list">
              {selectedProvince ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedProvince(null)}
                    className="flex items-center gap-2 py-3 px-4 mb-2 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 active:scale-95 transition-all duration-300"
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    بازگشت به لیست استان‌ها
                  </button>

                  {subCities.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {subCities.map((cityObj, index) => (
                        <button
                          key={cityObj.id}
                          style={{ animationDelay: `${index * 50}ms` }}
                          onClick={() => handleSelectFinalCity(cityObj)}
                          className="py-3 px-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 hover:bg-white hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-300 animate-[slideUp_0.4s_ease-out_backwards]"
                        >
                          {cityObj.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-sm text-gray-400 py-4">
                      شهری برای این استان ثبت نشده است.
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {provinces.map((prov, index) => (
                    <button
                      key={prov.id}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => setSelectedProvince(prov)}
                      className="group flex justify-between items-center py-3 px-4 bg-white border border-gray-100 rounded-2xl font-bold text-gray-700 shadow-sm hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 animate-[slideUp_0.4s_ease-out_backwards]"
                    >
                      <span className="group-hover:text-divar transition-colors">
                        {prov.name}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="w-4 h-4 text-gray-400 group-hover:text-divar transition-colors"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------- UI اصلی اپلیکیشن ----------------
  return (
    <div
      dir="rtl"
      className="min-h-screen flex justify-center bg-[#f2f2f7] font-vazir text-[#1c1c1e] selection:bg-divar selection:text-white"
    >
      {/* Keyframes انیمیشن‌ها */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="w-full max-w-[420px] bg-[#f2f2f7] flex flex-col pb-24 relative min-h-screen">
        {/* هدر اپلیکیشن */}
        <header className="sticky top-0 z-40 bg-[#f2f2f7]/80 backdrop-blur-xl pt-8 pb-3 px-4 border-b border-gray-200/50">
          <div className="flex justify-between items-center mb-4 animate-[fadeIn_0.5s_ease-out]">
            <h1 className="text-4xl font-black text-divar tracking-tighter hover:scale-105 transition-transform cursor-pointer origin-right">
              سمسار.
            </h1>

            <button
              onClick={handleOpenCitySelection}
              className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm text-sm font-bold text-gray-700 hover:shadow-md hover:bg-gray-50 active:scale-95 transition-all duration-300"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-4 h-4 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {city}
            </button>
          </div>

          {/* اسلایدر دسته‌بندی‌ها */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 animate-[slideDown_0.6s_ease-out]">
            <button
              onClick={() => {
                if (currentParentCategory) setCurrentParentCategory(null);
                setActiveCategory(null);
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1 active:scale-95 ${
                activeCategory === null
                  ? "bg-gray-900 text-white shadow-md shadow-gray-900/20"
                  : "bg-white text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50 hover:shadow-md"
              }`}
            >
              {currentParentCategory ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-3 h-3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  همه {currentParentCategory.name}
                </>
              ) : (
                "همه آگهی‌ها"
              )}
            </button>

            {displayCategories.map((cat, index) => (
              <button
                key={cat.id}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
                  const hasSubCategories = rawCategories.some(
                    (c) => c.parent_id == cat.id,
                  );
                  if (hasSubCategories) setCurrentParentCategory(cat);
                  else setActiveCategory(cat.id);
                }}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 animate-[fadeIn_0.5s_ease-out_backwards] ${
                  activeCategory == cat.id
                    ? "bg-gray-900 text-white shadow-md shadow-gray-900/20"
                    : "bg-white text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50 hover:shadow-md"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </header>

        {/* لیست آگهی‌ها */}
        <main className="flex-1 px-4 mt-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex bg-white rounded-3xl p-3 shadow-sm border border-gray-100 animate-pulse"
                >
                  <div className="flex flex-col flex-1 pr-1 pl-3 py-1 justify-between">
                    <div>
                      <div className="w-full h-4 bg-gray-200 rounded-md mb-2"></div>
                      <div className="w-2/3 h-3 bg-gray-100 rounded-md"></div>
                    </div>
                    <div className="w-1/2 h-5 bg-gray-200 rounded-md mt-4"></div>
                  </div>
                  <div className="w-[110px] h-[110px] bg-gray-100 rounded-2xl shrink-0"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayedAds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 mt-10 animate-[slideUp_0.5s_ease-out]">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="w-10 h-10 opacity-40"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-500">
                    آگهی‌ای تو این دسته‌بندی پیدا نشد!
                  </p>
                </div>
              ) : (
                displayedAds.map((ad, index) => (
                  <div
                    key={ad.id}
                    onClick={() => navigate(`/ad/${ad.id}`)} // 👈 این خط رو به دیوِ اصلیِ آگهی اضافه کن
                    style={{ animationDelay: `${index * 80}ms` }}
                    className="group flex bg-white rounded-3xl p-2.5 shadow-sm border border-transparent hover:border-gray-100 hover:shadow-lg active:scale-[0.98] transition-all duration-400 cursor-pointer animate-[slideUp_0.5s_ease-out_backwards]"
                  >
                    <div className="flex flex-col flex-1 pr-2 pl-3 py-1.5 justify-between">
                      <div>
                        <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-divar transition-colors duration-300">
                          {ad.title}
                        </h3>
                        <div className="text-[11px] text-gray-400 font-medium mt-1.5 flex items-center gap-1.5">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md">
                            {ad.location || city}
                          </span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span>{ad.time || "لحظاتی پیش"}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-left">
                        <span className="text-[16px] font-black text-gray-900 tracking-tight">
                          {Number(ad.price).toLocaleString()}{" "}
                          <span className="text-[10px] font-bold text-gray-400">
                            تومان
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="relative w-[115px] h-[115px] shrink-0 rounded-[20px] overflow-hidden bg-gray-50 shadow-inner">
                      <img
                        src={
                          ad.cover_image
                            ? `${API_URL.replace("/api", "")}/${ad.cover_image}`
                            : "https://placehold.co/115x115/f2f2f7/a1a1aa?text=No+Image"
                        }
                        alt={ad.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://placehold.co/115x115/f2f2f7/ef4444?text=Error";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        {/* دکمه شناور ثبت آگهی */}
        <button
          onClick={handleCreateAdClick}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-divar text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-[0_8px_20px_rgba(166,38,38,0.3)] hover:scale-105 active:scale-95 transition-all z-50 animate-[slideUp_0.8s_ease-out]"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>ثبت آگهی</span>
        </button>
      </div>
    </div>
  );
}
