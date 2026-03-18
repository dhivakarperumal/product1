import React, { useEffect, useState } from "react";
import api from "../api";
import { FaBell, FaEnvelopeOpen, FaTimes } from "react-icons/fa";

const UserNotifications = ({ userEmail }) => {
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
        
        console.log("DEBUG: Total messages fetched:", allMessages.length);
        
        // Filter messages where the user's email is in the recipients list
        const userMessages = allMessages.filter((msg) => {
          try {
            let recipients = msg.recipients_json;
            if (typeof recipients === 'string') {
              recipients = JSON.parse(recipients);
            }
            
            if (!Array.isArray(recipients)) return false;

            // Log first recipient for debug
            if (recipients.length > 0) {
              console.log("Checking msg", msg.id, "recipients:", recipients[0].email);
            }

            return recipients.some(r => {
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
    return <div className="text-gray-400">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-500/20 pb-4">
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

      {debugInfo && (
        <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-red-500 text-xs text-center mb-4">
          ⚠️ {debugInfo}
        </div>
      )}

      {messages.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
          <FaEnvelopeOpen className="text-gray-700 text-4xl mx-auto mb-3" />
          <p className="text-gray-500">No personal notifications found for <strong>{userEmail}</strong>.</p>
          <p className="text-xs text-gray-600 mt-2">Checked {totalMessages} total system messages.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              className="bg-gray-900 border border-gray-800 hover:border-red-500/50 p-5 rounded-xl transition-all cursor-pointer group flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold text-white group-hover:text-red-400 transition-colors">
                  {msg.subject}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Sent on: {new Date(msg.sent_at).toLocaleDateString()} at {new Date(msg.sent_at).toLocaleTimeString()}
                </p>
                <p className="text-gray-400 text-sm mt-2 line-clamp-1">
                  {msg.message}
                </p>
              </div>
              <div className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                View Details
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POPUP MODAL */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedMessage(null)}
          ></div>
          <div className="relative bg-gray-900 border border-red-500/30 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="bg-red-600 p-5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaBell /> Notification
              </h3>
              <button 
                onClick={() => setSelectedMessage(null)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <div className="mb-6">
                <label className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Subject</label>
                <h2 className="text-2xl font-bold text-white mt-1">{selectedMessage.subject}</h2>
              </div>

              <div className="mb-6">
                <label className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Message</label>
                <div className="mt-2 text-gray-200 leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-lg border border-white/5">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 border-t border-white/5 pt-6">
                <span>Ref: #{selectedMessage.id}</span>
                <span>{new Date(selectedMessage.sent_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-black/20 p-4 text-center">
              <button
                onClick={() => setSelectedMessage(null)}
                className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full text-sm font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNotifications;
