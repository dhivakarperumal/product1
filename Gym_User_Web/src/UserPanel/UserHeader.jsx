import { Menu, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";

const UserHeader = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-white/10 backdrop-blur-xl border-b border-white/20 px-4 py-3 flex justify-between items-center">

      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden">
          <Menu className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-white font-semibold text-lg">User Dashboard</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <p className="text-sm text-white">{user?.name || "User"}</p>
        </div>

        <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-400 hover:text-red-300"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </header>
  );
};

export default UserHeader;