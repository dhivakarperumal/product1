import React, { useEffect, useState } from "react";
import api from "../api";
import { FaBell, FaEnvelopeOpen, FaTimes } from "react-icons/fa";
import { useAuth } from "../PrivateRouter/AuthContext";

const Notification = () => {
  const { user } = useAuth();
  const userEmail = user?.email;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const [totalMessages, setTotalMessages] = useState(0);
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get("/send-message/history");
        const allMessages = Array.isArray(res.data) ? res.data : [];
        setTotalMessages(allMessages.length);

        const userMessages = allMessages.filter((msg) => {
          try {
            let recipients = msg.recipients_json;

            if (typeof recipients === "string") {
              recipients = JSON.parse(recipients);
            }

            if (!Array.isArray(recipients)) return false;

            return recipients.some((r) => {
              const rEmail = String(r.email || "").toLowerCase().trim();
              const uEmail = String(userEmail || "").toLowerCase().trim();
              return rEmail === uEmail && uEmail !== "";
            });
          } catch (e) {
            console.error("Filter error:", e);
            return false;
          }
        });

        setMessages(userMessages);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
        setDebugInfo("Fetch Error: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchMessages();
    }
  }, [userEmail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-500/20 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <FaBell className="text-red-500 text-xl" />
            <h2 className="text-2xl font-bold">Notifications</h2>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded border border-white/5">
              Sync: {totalMessages} items found
            </div>
            <div className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full">
              Logged in as: <strong>{userEmail}</strong>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {debugInfo && (
          <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-red-500 text-xs text-center mb-4">
            ⚠️ {debugInfo}
          </div>
        )}

        {/* EMPTY */}
        {messages.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
            <FaEnvelopeOpen className="text-gray-700 text-4xl mx-auto mb-3" />
            <p className="text-gray-500">
              No notifications for <strong>{userEmail}</strong>
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className="bg-gray-900 border border-gray-800 hover:border-red-500/50 p-5 rounded-xl cursor-pointer group flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold text-white group-hover:text-red-400">
                    {msg.subject}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(msg.sent_at).toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-sm mt-2 line-clamp-1">
                    {msg.message}
                  </p>
                </div>

                <div className="text-red-500 opacity-0 group-hover:opacity-100">
                  View
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL */}
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80"
              onClick={() => setSelectedMessage(null)}
            ></div>

            <div className="relative bg-gray-900 border border-red-500/30 w-full max-w-lg rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FaBell /> Notification
                </h3>
                <button onClick={() => setSelectedMessage(null)}>
                  <FaTimes />
                </button>
              </div>

              <h2 className="text-lg font-bold mb-2">
                {selectedMessage.subject}
              </h2>

              <p className="text-gray-300 whitespace-pre-wrap mb-4">
                {selectedMessage.message}
              </p>

              <div className="text-xs text-gray-500">
                {new Date(selectedMessage.sent_at).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;