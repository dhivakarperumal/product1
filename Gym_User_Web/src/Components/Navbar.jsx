import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useState, useRef, useEffect } from "react";
import { Bell, ShoppingCart, ChevronDown } from "lucide-react";
// import logo from "../../public/images/logo-dark.png";
const logo = "/images/logo-dark.png";

import { Menu, X } from "lucide-react";
import { FaUser } from "react-icons/fa";
import PageContainer from "./PageContainer";

const Navbar = () => {
  const { user, role, profileName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (!user || !user.id) {
      setCartCount(0);
      return;
    }

    const fetchCartCount = async () => {
      if (!user || !user.id) return;

      try {
        const response = await api.get(`/cart`, {
          params: { userId: user.id }
        });

        const cart = Array.isArray(response.data) ? response.data : [];

        // Count number of items instead of quantity
        setCartCount(cart.length);

      } catch (err) {
        console.error("Failed to fetch cart:", err);
        setCartCount(0);
      }
    };

    fetchCartCount();
    // Optionally refresh cart periodically
    const interval = setInterval(fetchCartCount, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const fetchPlansConfig = async () => {
      try {
        const response = await api.get("/plans");
        const plans = Array.isArray(response.data) ? response.data : [];
        const hasTrainerPlan = plans.some((plan) => plan.trainerIncluded === true);
        setShowCalendar(hasTrainerPlan);
      } catch (err) {
        console.error("Failed to fetch plans:", err);
      }
    };

    fetchPlansConfig();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [open, setOpen] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState("menu"); // menu | categories | subcategories
  const [selectedCategory, setSelectedCategory] = useState(null);

  const dropdownRef = useRef(null);
  const categoryRef = useRef(null);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    handleScroll(); // run once on load
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ------------------ CLOSE ON ROUTE CHANGE ------------------ */
  useEffect(() => {
    setOpen(false);
    setShowCategory(false);
    setActiveCategory(null);
    setMobileOpen(false);
  }, [location.pathname]);

  /* ------------------ OUTSIDE CLICK (USER MENU) ------------------ */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ------------------ OUTSIDE CLICK (CATEGORY) ------------------ */
  useEffect(() => {
    if (!showCategory) return;

    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategory(false);
        setActiveCategory(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showCategory]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      logout(); // clear localStorage
      setOpen(false);
      setShowCategory(false);
      setActiveCategory(null);
      setMobileOpen(false);
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  if (["/login", "/register"].includes(location.pathname)) return null;

  const userInitial =
    profileName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase();

  return (
    <>
      <header
        style={{
          backdropFilter: scrolled ? "blur(18px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(18px) saturate(180%)" : "none",
        }}
        className={`fixed top-0 w-full z-50 transition-all duration-500
    ${scrolled
            ? "bg-gradient-to-b from-black/60 via-black/40 to-black/20 border-b border-white/10 shadow-xl"
            : "bg-transparent"
          }
  `}
      >
        <PageContainer>
          <div className="flex items-center justify-between  py-2">
            {/* LOGO */}
            <Link to="/" className="shrink-0 flex items-center">
              <img
                src={logo}
                alt="Power Gym"
                className="h-15 w-auto object-contain"
              />
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-8 font-medium text-white">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `cursor-pointer transition ${isActive
                    ? "text-red-500 font-semibold"
                    : "hover:text-red-400"
                  }`
                }
              >
                Home
              </NavLink>

              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `cursor-pointer transition ${isActive
                    ? "text-red-500 font-semibold"
                    : "hover:text-red-400"
                  }`
                }
              >
                Products
              </NavLink>

              <NavLink
                to="/pricing"
                className={({ isActive }) =>
                  `cursor-pointer transition ${isActive
                    ? "text-red-500 font-semibold"
                    : "hover:text-red-400"
                  }`
                }
              >
                Pricing
              </NavLink>

              {/* MORE DROPDOWN */}
              <div className="relative" ref={categoryRef}>
                <button
                  onMouseEnter={() => setShowCategory(true)}
                  onClick={() => setShowCategory(!showCategory)}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  More <ChevronDown size={16} />
                </button>

                {showCategory && (
                  <div
                    onMouseLeave={() => setShowCategory(false)}
                    className="absolute top-full mt-4 w-56 bg-white text-black rounded-xl shadow-xl overflow-hidden"
                  >
                    <NavLink
                      to="/trainers"
                      className={({ isActive }) =>
                        `block px-5 py-3 cursor-pointer ${isActive
                          ? "bg-gray-200 font-semibold"
                          : "hover:bg-gray-100"
                        }`
                      }
                    >
                      Trainers
                    </NavLink>
                    <NavLink
                      to="/services"
                      className={({ isActive }) =>
                        `block px-5 py-3 cursor-pointer ${isActive
                          ? "bg-gray-200 font-semibold"
                          : "hover:bg-gray-100"
                        }`
                      }
                    >
                      Services
                    </NavLink>
                    <NavLink
                      to="/facilities"
                      className={({ isActive }) =>
                        `block px-5 py-3 cursor-pointer ${isActive
                          ? "bg-gray-200 font-semibold"
                          : "hover:bg-gray-100"
                        }`
                      }
                    >
                      Facilities
                    </NavLink>
                    {showCalendar && (
                      <NavLink
                        to="/calendar"
                        className={({ isActive }) =>
                          `cursor-pointer transition pl-5 ${isActive
                            ? "text-red-500 font-semibold"
                            : "hover:text-red-400"
                          }`
                        }
                      >
                        Calendar
                      </NavLink>
                    )}

                    <NavLink
                      to="/contact"
                      className={({ isActive }) =>
                        `block px-5 py-3 cursor-pointer ${isActive
                          ? "bg-gray-200 font-semibold"
                          : "hover:bg-gray-100"
                        }`
                      }
                    >
                      Contact Us
                    </NavLink>
                  </div>
                )}
              </div>
            </nav>

            {/* RIGHT */}
            <div className="flex items-center gap-6 text-white">
              {/* NOTIFICATION */}
              {/* <button className="text-white cursor-pointer">
                <Bell size={20} />
              </button> */}

              {/* CART */}
              <button
                onClick={() => navigate("/cart")}
                className="relative text-white hover:text-red-500 transition cursor-pointer"
              >
                <ShoppingCart size={20} />

                {cartCount > 0 && (
                  <span
                    className="
      absolute -top-2 -right-2
      bg-red-600 text-white text-[10px]
      w-4 h-4 rounded-full
      flex items-center justify-center
      font-bold
    "
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {!user ? (
                <Link
                  to="/login"
                  className="border border-white rounded-full w-5 h-5 md:w-8 md:h-8 flex items-center justify-center bg-white text-black"
                >
                  <FaUser />
                </Link>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setOpen(!open)}
                    className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white text-black text-primary font-bold cursor-pointer"
                  >
                    {userInitial}
                  </button>

                  {open && (
                    <div className="absolute right-0 mt-4 w-64 bg-white rounded-2xl shadow-xl overflow-hidden">
                      <div className="bg-black px-4 py-3 text-white">
                        <p className="font-bold">{profileName}</p>
                        <p className="text-sm truncate">{user.email}</p>
                      </div>

                      <div className="p-3 space-y-2">
                        <Link
                          to="/account"
                          className="block px-4 py-2 rounded-lg text-black"
                        >
                          My Account
                        </Link>

                        {role === "admin" && (
                          <Link
                            to="/admin"
                            className="block px-4 py-2 rounded-lg text-black"
                          >
                            Admin Panel
                          </Link>
                        )}

                        {role === "trainer" && (
                          <Link
                            to="/trainer"
                            className="block px-4 py-2 rounded-lg text-black"
                          >
                            Trainer Panel
                          </Link>
                        )}

                        <button
                          onClick={handleLogout}
                          className="w-full mt-2 py-2 rounded-lg bg-gray-100 text-black cursor-pointer"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MOBILE MENU */}
              <button onClick={() => setMobileOpen(true)} className="md:hidden">
                <Menu />
              </button>
            </div>
          </div>
        </PageContainer>

        {/* ================= MOBILE SIDEBAR ================= */}
      </header>
      {mobileOpen && (
        <>
          {/* OVERLAY */}
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* SIDEBAR */}
          <div
            className="
              fixed top-0 left-0 h-full w-[85%] max-w-sm
              bg-gradient-to-b from-black to-gray-900
              z-50 shadow-2xl
              flex flex-col
              overflow-y-auto
            "
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <Link to="/" className="shrink-0 flex items-center">
                <img
                  src={logo}
                  alt="Power Gym"
                  className="h-14 w-auto object-contain"
                />
              </Link>
              <X
                className="text-white cursor-pointer"
                onClick={() => setMobileOpen(false)}
              />
            </div>

            {/* USER INFO */}
            {user && (
              <div className="px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold">
                    {userInitial}
                  </div>
                  <div className="text-white">
                    <p className="font-semibold">{profileName}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* NAV LINKS */}
            <nav className="flex flex-col px-5 py-3 gap-2 text-white text-lg">
              {[
                { name: "Home", path: "/" },
                { name: "Facilities", path: "/facilities" },
                { name: "Services", path: "/services" },
                { name: "Trainers", path: "/trainers" },
                { name: "Pricing", path: "/pricing" },
                { name: "Products", path: "/products" },

                ...(showCalendar
                  ? [{ name: "Calendar", path: "/calendar" }]
                  : []),

                { name: "Contact Us", path: "/contact" },
              ].map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className="
    py-3 border-b border-white/10
    hover:text-red-500 transition
  "
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
