import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

const Login = () => {
  const [identifier, setIdentifier] = useState(""); // email OR username
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();

  // 🔹 Redirect by role
  const redirectByRole = (role) => {
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "trainer") {
      navigate("/trainer");
    } else {
      navigate("/");
    }
  };

  // 🔹 Normal Login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;
    setLoading(true);

    try {
      let loginPassword = password;

      // phone number login auto password
      if (!loginPassword && /^\d+$/.test(identifier)) {
        loginPassword = identifier;
      }

      const res = await api.post("/auth/login", {
        identifier,
        password: loginPassword,
      });

      const userData = res.data.user;
      const token = res.data.token;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      contextLogin(userData, token);

      toast.success("Login successful");

      redirectByRole(userData.role);

    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        err.message ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Custom Google Login Hook (More Robust Popup)
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        // Get user info from Google API using the access token
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        const googleUser = {
          name: userInfo.data.name,
          email: userInfo.data.email,
          picture: userInfo.data.picture,
          googleId: userInfo.data.sub
        };

        // Send to our backend
        const res = await api.post("/auth/google-login", googleUser);

        const userData = res.data.user;
        const token = res.data.token;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));

        contextLogin(userData, token);

        toast.success("Google Login Successful");
        redirectByRole(userData.role);

      } catch (error) {
        console.error("Google Success Error:", error);
        toast.error("Google Authentication Failed");
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google Login Error:", error);
      toast.error("Google Login Failed - Check Pop-up Blocker");
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4">

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 
                      bg-black/70 backdrop-blur-xl border border-gray-800 
                      rounded-3xl shadow-2xl overflow-hidden">

        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-center px-12 
                        bg-gradient-to-br from-red-600 to-orange-500 text-white">

          <h1 className="text-4xl font-extrabold mb-4 tracking-wide">
            POWER GYM
          </h1>

          <p className="text-lg text-red-100 leading-relaxed">
            Train harder. Track progress. Become unstoppable 💪
          </p>

          <ul className="mt-8 space-y-3 text-red-100 font-medium">
            <li>✔ Personal workout plans</li>
            <li>✔ Membership & attendance</li>
            <li>✔ Progress tracking</li>
          </ul>

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center px-6 py-10">

          <div className="w-full max-w-md">

            <h2 className="text-3xl font-bold text-center text-white mb-2">
              Member Login
            </h2>

            <p className="text-center text-gray-400 mb-6">
              Enter your credentials to continue
            </p>

            <form onSubmit={handleLogin} className="space-y-4">

              {/* Identifier */}
              <input
                type="text"
                placeholder="Email, Username or Phone"
                className="w-full bg-gray-900 text-white border border-gray-700 
                           p-3 rounded-lg focus:outline-none 
                           focus:ring-2 focus:ring-red-500"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />

              {/* Password */}
              <div className="relative">

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full bg-gray-900 text-white border border-gray-700 
                             p-3 pr-12 rounded-lg focus:outline-none 
                             focus:ring-2 focus:ring-red-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center 
                             text-gray-400 hover:text-red-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

              </div>

              {/* Login Button */}
              <button
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-500 
                           text-white py-3 rounded-lg font-bold tracking-wide 
                           hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

            </form>

            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-800"></div>
              <span className="px-4 text-gray-500 text-sm">OR</span>
              <div className="flex-1 h-px bg-gray-800"></div>
            </div>

            {/* Google Login Custom Button */}
            <button 
              onClick={() => googleLogin()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black py-3 rounded-lg font-bold transition mb-4 disabled:opacity-50"
            >
              <img 
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" 
                alt="Google" 
                className="w-6 h-6"
              />
              Continue with Google
            </button>

            <p className="text-sm mt-5 text-center text-gray-400">
              New member?{" "}
              <Link to="/register" className="text-red-500 font-semibold hover:underline">
                Join Now
              </Link>
            </p>

            <p className="text-sm mt-5 text-center text-gray-400">
              <Link to="/" className="text-red-500 font-semibold hover:underline">
                Back to Home
              </Link>
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;
