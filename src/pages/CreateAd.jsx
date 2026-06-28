import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

// --- تابع تبدیل عدد به حروف فارسی (برای نمایش قیمت) ---
const numberToPersianWords = (number) => {
  if (!number || number === "0") return "";
  const ones = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const tens = [
    "",
    "ده",
    "بیست",
    "سی",
    "چهل",
    "پنجاه",
    "شصت",
    "هفتاد",
    "هشتاد",
    "نود",
  ];
  const teens = [
    "ده",
    "یازده",
    "دوازده",
    "سیزده",
    "چهارده",
    "پانزده",
    "شانزده",
    "هفده",
    "هجده",
    "نوزده",
  ];
  const hundreds = [
    "",
    "صد",
    "دویست",
    "سیصد",
    "چهارصد",
    "پانصد",
    "ششصد",
    "هفتصد",
    "هشتصد",
    "نهصد",
  ];
  const bases = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

  const convertLessThanOneThousand = (num) => {
    let word = "";
    if (num > 99) {
      word += hundreds[Math.floor(num / 100)] + " و ";
      num %= 100;
    }
    if (num > 9 && num < 20) {
      word += teens[num - 10] + " و ";
      return word;
    }
    if (num > 19) {
      word += tens[Math.floor(num / 10)] + " و ";
      num %= 10;
    }
    if (num > 0) {
      word += ones[num] + " و ";
    }
    return word;
  };

  let numStr = number.toString().replace(/,/g, "");
  if (isNaN(numStr)) return "";
  if (numStr === "0") return "صفر";

  let word = "";
  let baseIndex = 0;
  while (numStr.length > 0) {
    const chunk = numStr.slice(-3);
    numStr = numStr.slice(0, -3);
    const chunkNum = parseInt(chunk, 10);
    if (chunkNum !== 0) {
      let chunkWord = convertLessThanOneThousand(chunkNum);
      chunkWord = chunkWord.slice(0, -3); // remove trailing " و "
      if (baseIndex > 0) chunkWord += " " + bases[baseIndex];
      word = word ? chunkWord + " و " + word : chunkWord;
    }
    baseIndex++;
  }
  return word;
};

// --- کامپوننت دراپ‌داون سفارشی (فوق‌العاده جذاب و مدرن) ---
const CustomSelect = ({ options, value, onChange, placeholder, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // بستن منو وقتی بیرونش کلیک میشه
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(
    (opt) => opt.id === value || opt.value === value,
  );

  return (
    <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
      <label className="text-sm font-black text-gray-700 pr-1">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-gray-50 border ${isOpen ? "border-divar ring-2 ring-divar/20" : "border-gray-200"} text-gray-900 text-sm rounded-2xl p-4 cursor-pointer flex justify-between items-center transition-all`}
      >
        <span
          className={
            selectedOption ? "text-gray-900 font-bold" : "text-gray-400"
          }
        >
          {selectedOption
            ? selectedOption.name || selectedOption.label
            : placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-divar" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-[100%] left-0 w-full mt-2 bg-white border border-gray-100 shadow-2xl rounded-2xl z-50 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          <ul className="max-h-60 overflow-y-auto hide-scrollbar py-2">
            {options.map((opt, i) => (
              <li
                key={opt.id || i}
                onClick={() => {
                  onChange(opt.id || opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 text-sm cursor-pointer transition-colors ${value === (opt.id || opt.value) ? "bg-red-50 text-divar font-bold" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                {opt.name || opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function CreateAd() {
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCity, setSelectedCity] = useState(
    Cookies.get("city_id") || "",
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [formSchema, setFormSchema] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
  });
  const [dynamicData, setDynamicData] = useState({});
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const API_URL = "http://localhost:3000/api";

  // لود کردن شهرها و دسته‌ها
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cityRes, catRes] = await Promise.all([
          axios.get(`${API_URL}/city`),
          axios.get(`${API_URL}/category`),
        ]);

        // تنظیم لیست شهرها (فقط شهرها، نه استان‌ها)
        const allCities = cityRes.data.cities || cityRes.data;
        setCities(allCities.filter((c) => c.parent_id !== null)); // فرض بر اینه که شهرها parent_id دارن

        // تنظیم لیست دسته‌ها
        const allCats =
          catRes.data.data || catRes.data.categories || catRes.data;
        const leafCats = allCats.filter(
          (c) => !allCats.some((child) => child.parent_id === c.id),
        );
        setCategories(leafCats);
      } catch (error) {
        toast.error("خطا در دریافت اطلاعات پایه");
      }
    };
    fetchData();
  }, []);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setDynamicData({});
    const cat = categories.find((c) => c.id == catId);
    if (cat && cat.form_schema) {
      try {
        setFormSchema(
          typeof cat.form_schema === "string"
            ? JSON.parse(cat.form_schema)
            : cat.form_schema,
        );
      } catch (err) {
        setFormSchema([]);
      }
    } else {
      setFormSchema([]);
    }
  };

  // هندل کردن قیمت (اضافه کردن کاما)
  const handlePriceChange = (e) => {
    // حذف کاماها برای بررسی عدد بودن
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^\d+$/.test(rawValue)) {
      setFormData({ ...formData, price: rawValue });
    }
  };

  const handleStaticChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleDynamicChange = (e) =>
    setDynamicData({ ...dynamicData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      toast.error("حداکثر ۳ عکس می‌توانید انتخاب کنید!");
      e.target.value = null;
      return;
    }
    setImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCity) return toast.error("لطفاً شهر آگهی را انتخاب کنید");
    if (!selectedCategory) return toast.error("لطفاً دسته‌بندی را انتخاب کنید");

    setIsLoading(true);
    const fd = new FormData();
    fd.append("city_id", selectedCity);
    fd.append("category_id", selectedCategory);
    fd.append("title", formData.title);
    fd.append("description", formData.description);
    fd.append("price", formData.price); // ارسال قیمت بدون کاما به سرور
    fd.append("dynamicProperties", JSON.stringify(dynamicData));
    images.forEach((img) => fd.append("images", img));

    try {
      await axios.post(`${API_URL}/ad`, fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("آگهی شما با موفقیت ثبت شد 🎉");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "خطا در ثبت آگهی");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f2f2f7] font-vazir text-[#1c1c1e] flex justify-center pb-12"
    >
      <div className="w-full max-w-[460px] bg-[#f2f2f7] flex flex-col animate-[fadeIn_0.3s_ease-out]">
        {/* هدر */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200 px-5 py-5 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => navigate("/")}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5 text-gray-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">ثبت آگهی</h1>
            <p className="text-xs font-bold text-gray-500 mt-0.5">
              آگهی خود را رایگان منتشر کنید
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4 mt-2">
          {/* کارت ۱: مکان و دسته‌بندی */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6 relative z-30">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-6 bg-divar rounded-full"></span>
              <h2 className="font-black text-gray-800 text-lg">
                مکان و دسته‌بندی
              </h2>
            </div>

            <CustomSelect
              label="شهر آگهی"
              placeholder="انتخاب شهر..."
              options={cities}
              value={selectedCity}
              onChange={setSelectedCity}
            />

            <CustomSelect
              label="دسته‌بندی آگهی"
              placeholder="انتخاب دسته‌بندی..."
              options={categories}
              value={selectedCategory}
              onChange={handleCategoryChange}
            />
          </div>

          {/* کارت ۲: اطلاعات اصلی */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6 relative z-20">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-6 bg-divar rounded-full"></span>
              <h2 className="font-black text-gray-800 text-lg">اطلاعات آگهی</h2>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-gray-700 pr-1">
                عنوان آگهی
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleStaticChange}
                placeholder="مثال: پراید 111 مدل 95"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl p-4 focus:ring-2 focus:ring-divar/20 focus:border-divar outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-gray-700 pr-1">
                قیمت (تومان)
              </label>
              <input
                type="text" // text گذاشتیم تا کاما رو پشتیبانی کنه
                name="price"
                required
                value={
                  formData.price ? Number(formData.price).toLocaleString() : ""
                }
                onChange={handlePriceChange}
                placeholder="0"
                dir="ltr"
                className="w-full text-left font-black tracking-wider bg-gray-50 border border-gray-200 text-gray-900 text-base rounded-2xl p-4 focus:ring-2 focus:ring-divar/20 focus:border-divar outline-none transition-all"
              />
              {/* متن فارسی قیمت */}
              <span className="text-[11px] font-bold text-divar pr-2 h-4">
                {formData.price
                  ? `${numberToPersianWords(formData.price)} تومان`
                  : ""}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-gray-700 pr-1">
                توضیحات
              </label>
              <textarea
                name="description"
                required
                rows="4"
                value={formData.description}
                onChange={handleStaticChange}
                placeholder="جزئیات و ویژگی‌های آگهی خود را بنویسید..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl p-4 focus:ring-2 focus:ring-divar/20 focus:border-divar outline-none resize-none transition-all"
              ></textarea>
            </div>
          </div>

          {/* کارت ۳: ویژگی‌های داینامیک */}
          {formSchema.length > 0 && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6 relative z-10 animate-[slideUp_0.4s_ease-out]">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-6 bg-gray-800 rounded-full"></span>
                <h2 className="font-black text-gray-800 text-lg">
                  ویژگی‌های تکمیلی
                </h2>
              </div>

              {formSchema.map((field, index) => (
                <div key={index}>
                  {field.type === "select" ? (
                    <CustomSelect
                      label={field.name}
                      placeholder={`انتخاب ${field.name}...`}
                      options={field.options.map((opt) => ({
                        label: opt,
                        value: opt,
                      }))}
                      value={dynamicData[field.name]}
                      onChange={(val) =>
                        setDynamicData({ ...dynamicData, [field.name]: val })
                      }
                    />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-black text-gray-700 pr-1">
                        {field.name}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        required={field.require}
                        onChange={handleDynamicChange}
                        placeholder={`وارد کنید...`}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl p-4 outline-none focus:ring-2 focus:ring-gray-800/10 focus:border-gray-800 transition-all"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* کارت ۴: عکس‌ها */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4 relative z-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-6 bg-divar rounded-full"></span>
              <h2 className="font-black text-gray-800 text-lg">تصاویر آگهی</h2>
            </div>

            <div className="flex gap-3 overflow-x-auto py-2 hide-scrollbar">
              <label className="w-[100px] h-[100px] shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-3xl bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-divar transition-colors group">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-7 h-7 text-gray-400 mb-2 group-hover:text-divar transition-colors"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-[11px] font-black text-gray-500 group-hover:text-divar transition-colors">
                  افزودن عکس
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {imagePreviews.map((src, index) => (
                <div
                  key={index}
                  className="w-[100px] h-[100px] shrink-0 relative rounded-3xl overflow-hidden border border-gray-100 shadow-sm"
                >
                  <img
                    src={src}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-divar/90 text-white text-[10px] font-bold text-center py-1 backdrop-blur-md">
                      عکس کاور
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* دکمه ارسال */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 mb-6 w-full text-white bg-divar hover:bg-[#8f1d1d] hover:shadow-lg hover:shadow-divar/30 font-bold rounded-2xl text-base px-5 py-4 text-center transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center h-[56px]"
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
            ) : (
              "ثبت آگهی"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
