import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // 👈 اضافه شدن جادوگر انیمیشن‌ها

export default function Home() {
  const [ads, setAds] = useState([]);
  const [rawCategories, setRawCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [currentParentCategory, setCurrentParentCategory] = useState(null);

  const [city, setCity] = useState("انتخاب شهر");
  const [citiesList, setCitiesList] = useState([]);
  const [needsCitySelection, setNeedsCitySelection] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
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
      setTimeout(() => setIsLoading(false), 500);
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

  const handleCreateAdClick = async () => {
    try {
      await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
      navigate("/create-ad");
    } catch (error) {
      toast("برای ثبت آگهی ابتدا وارد شوید", { icon: "🔐" });
      navigate("/auth");
    }
  };

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
    if (activeCategory) return ad.category_id == activeCategory;
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

  // تنظیمات انیمیشن برای لیست (Stagger effect)
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }, // فاصله زمانی بین لود شدن هر کارت
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

  // ---------------- UI مودال انتخاب شهر ----------------
  if (needsCitySelection) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-[#f2f2f7] font-vazir text-[#1c1c1e] p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-[420px] bg-white rounded-[2rem] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex flex-col max-h-[85vh]"
        >
          <h2 className="text-2xl font-black text-center mb-2 text-divar">
            {selectedProvince
              ? `شهرهای ${selectedProvince.name}`
              : "استان خود را انتخاب کنید"}
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6 font-medium">
            {selectedProvince
              ? "شهر مورد نظر خود را برای مشاهده آگهی‌ها انتخاب کنید"
              : "برای شروع، استان محل سکونت خود را مشخص کنید"}
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
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              {selectedProvince ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedProvince(null)}
                    className="flex items-center justify-center gap-2 py-3.5 px-4 mb-2 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
                  >
                    بازگشت به لیست استان‌ها
                  </button>

                  {subCities.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {subCities.map((cityObj) => (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          key={cityObj.id}
                          onClick={() => handleSelectFinalCity(cityObj)}
                          className="py-3.5 px-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-colors"
                        >
                          {cityObj.name}
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-sm text-gray-400 py-4 font-bold">
                      شهری یافت نشد.
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {provinces.map((prov) => (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      key={prov.id}
                      onClick={() => setSelectedProvince(prov)}
                      className="group flex justify-between items-center py-3.5 px-4 bg-white border border-gray-100 rounded-2xl font-bold text-gray-700 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
                    >
                      <span className="group-hover:text-divar transition-colors">
                        {prov.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ---------------- UI اصلی اپلیکیشن ----------------
  return (
    <div
      dir="rtl"
      className="min-h-screen flex justify-center bg-[#f2f2f7] font-vazir text-[#1c1c1e] selection:bg-divar selection:text-white"
    >
      <div className="w-full max-w-[420px] bg-[#f2f2f7] flex flex-col pb-24 relative min-h-screen">
        {/* هدر اپلیکیشن */}
        <header className="sticky top-0 z-40 bg-[#f2f2f7]/80 backdrop-blur-xl pt-8 pb-3 px-4 border-b border-gray-200/50">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex justify-between items-center mb-5"
          >
            <h1 className="text-4xl font-black text-divar tracking-tighter cursor-pointer">
              سمسار.
            </h1>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenCitySelection}
              className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 text-sm font-bold text-gray-700 hover:shadow-md transition-shadow"
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
                  strokeWidth="2.5"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {city}
            </motion.button>
          </motion.div>

          {/* اسلایدر دسته‌بندی‌ها */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 overflow-x-auto hide-scrollbar pb-2"
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (currentParentCategory) setCurrentParentCategory(null);
                setActiveCategory(null);
              }}
              className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-black transition-colors flex items-center gap-1 ${
                activeCategory === null
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-white text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {currentParentCategory ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-4 h-4"
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
            </motion.button>

            {displayCategories.map((cat) => (
              <motion.button
                whileTap={{ scale: 0.9 }}
                key={cat.id}
                onClick={() => {
                  const hasSubCategories = rawCategories.some(
                    (c) => c.parent_id == cat.id,
                  );
                  if (hasSubCategories) setCurrentParentCategory(cat);
                  else setActiveCategory(cat.id);
                }}
                className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-black transition-colors ${
                  activeCategory == cat.id
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-white text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50"
                }`}
              >
                {cat.name}
              </motion.button>
            ))}
          </motion.div>
        </header>

        {/* لیست آگهی‌ها */}
        <main className="flex-1 px-4 mt-4">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex bg-white rounded-3xl p-3 shadow-sm border border-gray-100 animate-pulse"
                  >
                    <div className="flex flex-col flex-1 pr-1 pl-3 py-2 justify-between">
                      <div>
                        <div className="w-full h-4 bg-gray-200 rounded-md mb-3"></div>
                        <div className="w-2/3 h-3 bg-gray-100 rounded-md"></div>
                      </div>
                      <div className="w-1/2 h-5 bg-gray-200 rounded-md"></div>
                    </div>
                    <div className="w-[115px] h-[115px] bg-gray-100 rounded-[20px] shrink-0"></div>
                  </div>
                ))}
              </motion.div>
            ) : displayedAds.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 mt-10"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-10 h-10 text-gray-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <p className="text-base font-black text-gray-400">
                  آگهی‌ای در این دسته یافت نشد!
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-3"
              >
                {displayedAds.map((ad) => (
                  <motion.div
                    variants={itemVariants}
                    whileHover={{
                      scale: 1.02,
                      y: -4,
                      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    key={ad.id}
                    onClick={() => navigate(`/ad/${ad.id}`)}
                    className="group flex bg-white rounded-3xl p-2.5 shadow-sm border border-transparent hover:border-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col flex-1 pr-2 pl-3 py-1.5 justify-between">
                      <div>
                        <h3 className="text-[15px] font-black text-gray-900 leading-snug line-clamp-2 group-hover:text-divar transition-colors">
                          {ad.title}
                        </h3>
                        <div className="text-[11px] text-gray-400 font-bold mt-2 flex items-center gap-1.5">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">
                            {ad.location || city}
                          </span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span>{ad.time || "لحظاتی پیش"}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-left">
                        <span className="text-[17px] font-black text-gray-900 tracking-tight">
                          {Number(ad.price).toLocaleString()}{" "}
                          <span className="text-[10px] font-bold text-gray-400">
                            تومان
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="relative w-[115px] h-[115px] shrink-0 rounded-[20px] overflow-hidden bg-gray-50 border border-gray-100/50">
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
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* دکمه شناور ثبت آگهی */}
        <motion.button
          initial={{ y: 100, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.5,
          }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 10px 30px rgba(166,38,38,0.4)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreateAdClick}
          className="fixed bottom-6 left-1/2 flex items-center gap-2 bg-divar text-white px-7 py-4 rounded-full font-black text-sm shadow-[0_8px_20px_rgba(166,38,38,0.25)] z-50"
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
        </motion.button>
      </div>
    </div>
  );
}
