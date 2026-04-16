import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";

const AdvancedLogin = ({ defaultRole = "member" }) => {
  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    setSelectedRole(defaultRole);
  }, [defaultRole]);

  const roleOptions = [
    { value: "member", label: "Member", icon: "👤", color: "from-blue-500 to-cyan-500" },
    { value: "admin", label: "Admin", icon: "👨‍💼", color: "from-purple-500 to-pink-500" },
    { value: "trainer", label: "Trainer", icon: "💪", color: "from-green-500 to-emerald-500" },
    { value: "super admin", label: "Super Admin", icon: "👑", color: "from-amber-500 to-orange-500" },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        identifier,
        password,
        role: selectedRole,
      });

      if (!res.data?.token || !res.data?.user) {
        throw new Error("Invalid login response from server");
      }

      const userData = res.data.user;
      const token = res.data.token;

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("identifier", identifier);
      }

      contextLogin(userData, token);
      toast.success(`Welcome back, ${userData.username || userData.email}! 🎉`);

      setTimeout(() => {
        const role = userData.role?.toLowerCase() || "user";
        if (role === "super admin") {
          navigate("/superadmin");
        } else if (role === "admin") {
          navigate("/admin");
        } else if (role === "trainer") {
          navigate("/trainer");
        } else {
          navigate("/user");
        }
      }, 800);
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      try {
        const googleUser = credentialResponse;
        const res = await api.post("/auth/google-login", googleUser);

        if (!res.data?.token || !res.data?.user) {
          throw new Error("Invalid login response from server");
        }

        const userData = res.data.user;
        const token = res.data.token;
        contextLogin(userData, token);
        toast.success("Google Login Successful 🚀");

        setTimeout(() => {
          navigate("/user");
        }, 800);
      } catch (error) {
        console.error("Google Login Error:", error);
        toast.error(error?.response?.data?.message || "Google Login Failed");
      }
    },
    onError: () => {
      toast.error("Google Login Failed - Check Pop-up Blocker");
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* LEFT: Branding Section */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-black bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
                POWER GYM
              </h1>
              <p className="text-xl text-gray-300">
                Transform Your Body. Transform Your Life. 💪
              </p>
            </div>

            <div className="space-y-4 text-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏋️</span>
                <span>Advanced Workout Plans</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <span>Progress Tracking & Analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <span>Expert Trainer Guidance</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <span>Personalized Membership Plans</span>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10">
              <p className="text-sm text-gray-400">
                ⚡ Secure. Reliable. Trusted by thousands.
              </p>
            </div>
          </div>

          {/* RIGHT: Login Form Section */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl space-y-6">
              
              {/* Role Selector */}
              <div>
                <label className="block text-sm font-semibold mb-4 text-gray-200">
                  Login as
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setSelectedRole(role.value)}
                      className={`p-3 rounded-xl font-medium text-sm transition-all transform ${
                        selectedRole === role.value
                          ? `bg-gradient-to-r ${role.color} text-white scale-105 shadow-lg`
                          : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                      }`}
                    >
                      <span className="text-lg">{role.icon}</span>
                      <div>{role.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Email, Username or Phone
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your credentials"
                    disabled={loading}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={loading}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400 transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-white/10 border border-white/20 accent-orange-500"
                  />
                  <span className="text-gray-300 group-hover:text-white transition">
                    Remember me
                  </span>
                </label>
                <a href="#" className="text-orange-400 hover:text-orange-300 transition">
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={loading || !identifier || !password}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Login Now
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[rgba(15,12,41,0.8)] text-gray-400">
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>

              {/* Google Login */}
              <button
                onClick={() => googleLogin()}
                disabled={loading}
                className="w-full bg-white text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Footer Links */}
              <div className="pt-4 border-t border-white/10 text-center space-y-2">
                <p className="text-sm text-gray-400">
                  New to Power Gym?{" "}
                  <a href="#" className="text-orange-400 hover:text-orange-300 font-semibold transition">
                    Create Account
                  </a>
                </p>
                <p className="text-xs text-gray-500">
                  By logging in, you agree to our Terms & Conditions
                </p>
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedLogin;
