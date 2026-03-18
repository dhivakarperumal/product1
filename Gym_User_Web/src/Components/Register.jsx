import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    // 🔍 Validations
    if (!username.trim()) return toast.error("Username is required");
    if (!email.trim()) return toast.error("Email is required");
    if (!mobile.trim()) return toast.error("Mobile number is required");
    if (mobile.length !== 10) return toast.error("Enter valid 10 digit mobile number");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);

    try {
      await api.post("/auth/register", {
        username,
        email,
        mobile,
        password,
      });

      toast.success("Account created successfully");
      navigate("/login");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-[#05060c] px-4 py-6">

    {/* MAIN CARD */}
    <div className="w-full max-w-5xl bg-[#0b0c10] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-white/10">

      {/* LEFT SECTION */}
      <div className="hidden md:flex flex-col justify-center px-14 
        bg-gradient-to-br from-red-600 to-orange-500 text-white">

        <h1 className="text-4xl font-extrabold mb-4">
          Welcome to Power Gym 💪
        </h1>

        <p className="text-lg leading-relaxed text-white/90">
          Create your account to unlock professional training programs,
          personalized workouts, and complete fitness support.
        </p>

        <ul className="mt-8 space-y-3 text-white/90">
          <li>✔ Certified Trainers & Programs</li>
          <li>✔ Personalized Diet & Workout Plans</li>
          <li>✔ Secure Membership Management</li>
        </ul>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">

          {/* Heading */}
          <h2 className="text-3xl font-extrabold text-center text-red-500 mb-2">
            Create Account
          </h2>

          <p className="text-center text-gray-400 mb-6">
            Start your fitness journey today 🔥
          </p>

          <form onSubmit={handleRegister} className="space-y-4">

            {/* USERNAME */}
            <input
              type="text"
              placeholder="Username"
              className="w-full border border-white/10 p-3 rounded-lg 
              bg-[#05060c] text-white placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-red-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            {/* MOBILE */}
            <input
              type="tel"
              placeholder="Mobile Number"
              className="w-full border border-white/10 p-3 rounded-lg 
              bg-[#05060c] text-white placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-red-500"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              maxLength={10}
              required
            />

            {/* EMAIL */}
            <input
              type="email"
              placeholder="Email"
              className="w-full border border-white/10 p-3 rounded-lg 
              bg-[#05060c] text-white placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-red-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* PASSWORDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full border border-white/10 p-3 pr-12 rounded-lg 
                  bg-[#05060c] text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center 
                  text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="w-full border border-white/10 p-3 pr-12 rounded-lg 
                  bg-[#05060c] text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute inset-y-0 right-3 flex items-center 
                  text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* BUTTON */}
            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-500 
              text-white py-3 rounded-lg font-semibold
              hover:scale-[1.02] transition
              disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-sm mt-4 text-center text-gray-400">
            Already a member?{" "}
            <Link
              to="/login"
              className="text-red-500 font-medium hover:underline "
            >
              Login
            </Link>
          </p>

           <p className="text-sm mt-5 text-center text-gray-400">
           
            <Link
              to="/"
              className="text-red-500 font-semibold hover:underline"
            >
              Back to Home
            </Link>
          </p>


        </div>
      </div>
    </div>
  </div>
);

};

export default Register;
