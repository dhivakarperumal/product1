import React, { useEffect, useState } from "react";
import { Send, Users, Mail, Phone, CheckSquare, Square, Search, Loader } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";

const SendMessage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // Selection
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Message Form
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("email"); // email or phone
  const [sending, setSending] = useState(false);

  // Fetch Members
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/members");
      setMembers(res.data);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Filter Members
  const filtered = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search) ||
      (m.email || m.user_email)?.toLowerCase().includes(search.toLowerCase())
  );

  // Handle Selection
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filtered.map((m) => m.id || m.u_id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectMember = (id) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((mId) => mId !== id));
      setSelectAll(false);
    } else {
      const newSelection = [...selectedMembers, id];
      setSelectedMembers(newSelection);
      if (newSelection.length === filtered.length && filtered.length > 0) {
        setSelectAll(true);
      }
    }
  };

  // Handle Send
  const handleSendMessage = async () => {
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    // Filter out users missing the required contact info
    const selectedUsersData = members.filter((m) => selectedMembers.includes(m.id || m.u_id));
    const validUsers = selectedUsersData.filter(m => messageType === "email" ? (m.email || m.user_email) : m.phone);

    if (validUsers.length === 0) {
      toast.error(`Selected members do not have a valid ${messageType}.`);
      return;
    }

    try {
      setSending(true);
      
      const payload = {
        type: messageType,
        message: message,
        recipients: validUsers.map(m => ({
          name: m.name,
          email: messageType === "email" ? (m.email || m.user_email) : null,
          phone: m.phone
        }))
      };

      await api.post("/send-message", payload);

      toast.success(`Message sent successfully to ${validUsers.length} members!`);
      setMessage("");
      setSelectedMembers([]);
      setSelectAll(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Send className="text-orange-500" />
              Send Message
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Send an email or SMS to selected members.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: MEMBER SELECTION */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl flex flex-col h-[600px]">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition whitespace-nowrap bg-white/5 rounded-lg border border-white/10"
                  >
                    {selectAll ? (
                      <CheckSquare className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    Select All
                  </button>
                  <span className="text-xs text-orange-400 whitespace-nowrap bg-orange-500/10 px-2 py-1.5 rounded-lg font-medium border border-orange-500/20">
                    {selectedMembers.length} Selected
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-gray-400">Loading members...</div>
                ) : filtered.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">No members found.</div>
                ) : (
                  filtered.map((m) => {
                    const id = m.id || m.u_id;
                    const isSelected = selectedMembers.includes(id);
                    return (
                      <div 
                        key={id}
                        onClick={() => toggleSelectMember(id)}
                        className={`flex items-center gap-4 p-3 rounded-xl border transition cursor-pointer
                        ${isSelected ? "bg-orange-500/10 border-orange-500/50" : "bg-black/20 border-white/5 hover:bg-white/5"}
                        `}
                      >
                        <div className="shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-orange-500" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{m.name || "N/A"}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {m.phone || "-"}</span>
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {m.email || m.user_email || "-"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

          {/* RIGHT: MESSAGE COMPOSER */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">Compose</h2>

              <div className="space-y-4">
                
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Message Type</label>
                  <div className="flex rounded-lg overflow-hidden border border-white/20">
                    <button
                      onClick={() => setMessageType("email")}
                      className={`flex-1 py-2 text-sm flex items-center justify-center gap-2 transition
                      ${messageType === "email" ? "bg-orange-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                    >
                      <Mail className="w-4 h-4" /> Email
                    </button>
                    <button
                      onClick={() => setMessageType("phone")}
                      className={`flex-1 py-2 text-sm flex items-center justify-center gap-2 transition
                      ${messageType === "phone" ? "bg-orange-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                    >
                      <Phone className="w-4 h-4" /> Phone / SMS
                    </button>
                  </div>
                </div>

                {/* Message Box */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Message Content</label>
                  <textarea
                    rows="8"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black/40 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm resize-none"
                  ></textarea>
                </div>

                {/* Info Text */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-blue-400 leading-relaxed">
                    This message will be sent to the selected {selectedMembers.length} member(s) via {messageType === "email" ? "Email" : "SMS/Phone"}.
                  </p>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={sending || selectedMembers.length === 0}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <><Loader className="w-5 h-5 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Send Message</>
                  )}
                </button>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SendMessage;
