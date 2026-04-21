import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import api from "../api";

/**
 * Admin Filter Dropdown Component
 * Used by super admin to filter data by specific admin
 */
const AdminFilter = ({ value, onChange, disabled }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only fetch admins if user is super admin (we assume parent handles that check)
    const fetchAdmins = async () => {
      setLoading(true);
      try {
        const res = await api.get("/auth/admins");
        setAdmins(res.data || []);
      } catch (err) {
        console.error("Failed to fetch admins:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const selectedAdmin = admins.find(a => a.admin_uuid === value || a.user_uuid === value);

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-300">Admin:</label>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border
            ${disabled || loading 
              ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
              : 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
            }
          `}
        >
          <span className="text-sm">
            {loading 
              ? "Loading..." 
              : selectedAdmin 
                ? selectedAdmin.username || selectedAdmin.email 
                : "All Admins"
            }
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && !disabled && !loading && (
        <div className="absolute z-50 mt-1 w-56 bg-gray-800 border border-gray-600 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-2 text-left text-sm hover:bg-gray-700
                ${!value ? 'bg-gray-700 text-blue-400' : 'text-white'}
              `}
            >
              All Admins
            </button>
            {admins.map((admin) => (
              <button
                key={admin.id}
                type="button"
                onClick={() => {
                  onChange(admin.admin_uuid || admin.user_uuid);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-2 text-left text-sm hover:bg-gray-700
                  ${(value === admin.admin_uuid || value === admin.user_uuid) 
                    ? 'bg-gray-700 text-blue-400' 
                    : 'text-white'
                  }
                `}
              >
                {admin.username || admin.email}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFilter;