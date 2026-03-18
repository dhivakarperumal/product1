import { useEffect, useState } from "react";
import {
  Send, Users, CheckSquare, Square, Search,
  Mail, Phone, X, CheckCircle, AlertCircle,
  MessageSquare, RefreshCw,
} from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";

import api from "../../api";

/* =====================
   STATUS BADGE
===================== */
const StatusBadge = ({ status }) => {
  if (!status) return null;
  const map = {
    sent: { color: "bg-green-500/20 text-green-400", label: "Sent" },
    failed: { color: "bg-red-500/20 text-red-400", label: "Failed" },
    pending: { color: "bg-yellow-500/20 text-yellow-400", label: "Pending" },
  };
  const s = map[status] || map.pending;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>;
};

/* =====================
   MAIN
===================== */
const SendMessage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("compose"); // compose | history

  /* Fetch members and history */
  const fetchHistory = async () => {
    try {
      const res = await api.get("/send-message/history");
      setHistory(res.data || []);
    } catch {
      console.error("Failed to fetch history");
    }
  };

  useEffect(() => {
    api.get("/members")
      .then((res) => {
        const data = res.data;
        const withEmail = Array.isArray(data)
          ? data.filter((m) => m.email || m.user_email)
          : [];
        setMembers(withEmail);
      })
      .catch(() => toast.error("Failed to load members"))
      .finally(() => setLoading(false));

    fetchHistory();
  }, []);

  /* Filter */
  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      (m.email || m.user_email || "").toLowerCase().includes(q)
    );
  });

  /* Select helpers */
  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((m) => m.id || m.u_id)));
    }
  };

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  /* Selected member objects */
  const selectedMembers = members.filter((m) =>
    selected.has(m.id || m.u_id)
  );

  /* Send */
  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (selected.size === 0) {
      toast.error("Please select at least one member");
      return;
    }

    setSending(true);
    const recipients = selectedMembers.map((m) => ({
      id: m.id || m.u_id,
      name: m.name || "Member",
      email: m.email || m.user_email,
      phone: m.phone || "",
    }));

    try {
      const res = await api.post("/send-message", {
        subject: subject || "Message from Gym Admin",
        message,
        recipients,
      });

      const result = res.data;
      const sentCount = result.results?.filter((r) => r.status === "sent").length || selected.size;
      const failCount = result.results?.filter((r) => r.status === "failed").length || 0;

      toast.success(`✅ Sent to ${sentCount} member(s)${failCount ? `, ${failCount} failed` : ""}`);

      // Refetch from database so we have true state
      fetchHistory();

      // Reset
      setMessage("");
      setSubject("");
      setSelected(new Set());
    } catch (err) {
      console.error(err);
      // Still record in local history as pending (email may not be configured)
      const info = {
        id: Date.now(),
        subject: subject || "Message from Gym Admin",
        message,
        sentTo: selected.size,
        failed: 0,
        sentAt: new Date().toISOString(),
        recipients: selectedMembers.slice(0, 5).map((m) => ({
          name: m.name,
          email: m.email || m.user_email,
          phone: m.phone || "",
        })),
      };
      setHistory((prev) => [info, ...prev]);
      toast.error("Email server not configured. Message recorded locally.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen py-2 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Send Message</h1>
            <p className="text-white/50 text-sm">Broadcast messages to your gym members</p>
          </div>
        </div>
        {/* TABS */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("compose")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === "compose" ? "bg-orange-500 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
          >
            Compose
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === "history" ? "bg-orange-500 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
          >
            History {history.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{history.length}</span>}
          </button>
        </div>
      </div>

      {tab === "compose" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: MEMBER SELECTOR */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users size={18} className="text-orange-400" />
                Select Members
              </h2>
              <span className="text-sm text-white/50">
                {selected.size} / {members.length} selected
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search by name, phone or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Select All */}
            <button
              onClick={selectAll}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition text-white text-sm font-medium"
            >
              {allSelected ? (
                <CheckSquare size={18} className="text-orange-400" />
              ) : (
                <Square size={18} className="text-white/40" />
              )}
              {allSelected ? "Deselect All" : `Select All (${filtered.length})`}
            </button>

            {/* Member List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scroll">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw size={20} className="animate-spin text-orange-400" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">
                  {members.length === 0 ? "No members with email found" : "No results for your search"}
                </div>
              ) : (
                filtered.map((m) => {
                  const id = m.id || m.u_id;
                  const isSelected = selected.has(id);
                  return (
                    <div
                      key={id}
                      onClick={() => toggleOne(id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition border ${
                        isSelected
                          ? "bg-orange-500/15 border-orange-500/40"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-orange-400 shrink-0" />
                      ) : (
                        <Square size={18} className="text-white/30 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{m.name || "N/A"}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {(m.email || m.user_email) && (
                            <span className="text-xs text-white/50 flex items-center gap-1 truncate">
                              <Mail size={11} /> {m.email || m.user_email}
                            </span>
                          )}
                          {m.phone && (
                            <span className="text-xs text-white/50 flex items-center gap-1">
                              <Phone size={11} /> {m.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: COMPOSE */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Mail size={18} className="text-orange-400" />
              Compose Message
            </h2>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Subject</label>
              <input
                type="text"
                placeholder="e.g. Monthly Offer, Gym Update..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>

            {/* Message */}
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-white/70 mb-1.5">Message</label>
              <textarea
                placeholder="Type your message here... (e.g. 'Dear Member, We have an exciting offer this month...')"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="flex-1 w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
              />
              <p className="text-xs text-white/30 mt-1 text-right">{message.length} chars</p>
            </div>

            {/* Preview */}
            {selected.size > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 text-sm text-orange-200">
                <p className="font-semibold mb-1">📋 Ready to send to {selected.size} member(s):</p>
                <p className="text-orange-300/80 text-xs">
                  {selectedMembers
                    .slice(0, 4)
                    .map((m) => m.name || "Member")
                    .join(", ")}
                  {selected.size > 4 && ` +${selected.size - 4} more`}
                </p>
              </div>
            )}

            {/* SEND BUTTON */}
            <button
              onClick={handleSend}
              disabled={sending || selected.size === 0 || !message.trim()}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition ${
                sending || selected.size === 0 || !message.trim()
                  ? "bg-white/10 cursor-not-allowed opacity-60"
                  : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/25 active:scale-95"
              }`}
            >
              {sending ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send to {selected.size} Member{selected.size !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* HISTORY TAB */
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            Message History
          </h2>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40">
              <MessageSquare size={48} className="mb-4 opacity-30" />
              <p className="text-lg">No messages sent yet</p>
              <p className="text-sm mt-1">Messages you send will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((h) => (
                <div key={h.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{h.subject}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {new Date(h.sent_at).toLocaleString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-green-400 font-medium">{h.sent_to} sent</span>
                      {h.failed > 0 && <span className="text-xs text-red-400 font-medium">{h.failed} failed</span>}
                    </div>
                  </div>
                  <p className="text-sm text-white/60 line-clamp-2">{h.message}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(h.recipients_json || []).map((r, i) => (
                      <span key={i} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                        {r.name}
                      </span>
                    ))}
                    {h.sent_to > (h.recipients_json?.length || 0) && (
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/40">
                        +{h.sent_to - (h.recipients_json?.length || 0)} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SendMessage;
