import React, { useState, useEffect } from 'react';
import { Bell, Send, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import api from '../../api';
import { formatDate, getDaysTillDue } from '../../utils/emiUtils';

const EMINotificationManager = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reminderType, setReminderType] = useState('upcoming');
  const [daysAhead, setDaysAhead] = useState(3);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/emi-notifications/stats');
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch EMI stats:', err);
      setError('Failed to load notification stats');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      setSending(true);
      setSuccessMessage('');
      setError('');

      const response = await api.post('/emi-notifications/send-reminders', {
        reminderType,
        daysAhead
      });

      setSuccessMessage(
        `✅ Sent ${response.data.sent} reminders (${response.data.failed} failed)`
      );

      // Refresh stats
      await fetchStats();
    } catch (err) {
      setError('Failed to send reminders: ' + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  const handleMarkOverdue = async () => {
    try {
      setSending(true);
      setSuccessMessage('');
      setError('');

      const response = await api.post('/emi-notifications/mark-overdue', {
        daysOverdue: 1
      });

      setSuccessMessage(`✅ ${response.data.message}`);
      await fetchStats();
    } catch (err) {
      setError('Failed to mark overdue: ' + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-6 h-6 text-orange-500" />
        <h2 className="text-2xl font-bold text-white">EMI Notifications</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Upcoming */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Upcoming (7 days)</p>
              <p className="text-3xl font-bold text-blue-400">
                {stats?.upcoming?.count || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ₹{(stats?.upcoming?.total || 0).toFixed(0)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-400/50" />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Overdue</p>
              <p className="text-3xl font-bold text-red-400">
                {stats?.overdue?.count || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ₹{(stats?.overdue?.total || 0).toFixed(0)}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400/50" />
          </div>
        </div>

        {/* Completed This Month */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Completed (This Month)</p>
              <p className="text-3xl font-bold text-green-400">
                {stats?.completed?.count || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ₹{(stats?.completed?.total || 0).toFixed(0)}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400/50" />
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Send Reminders</h3>

        <div className="space-y-4">
          {/* Reminder Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reminder Type
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setReminderType('upcoming')}
                className={`flex-1 py-2 rounded-lg transition-colors ${
                  reminderType === 'upcoming'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setReminderType('overdue')}
                className={`flex-1 py-2 rounded-lg transition-colors ${
                  reminderType === 'overdue'
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
                }`}
              >
                Overdue
              </button>
            </div>
          </div>

          {/* Days Ahead */}
          {reminderType === 'upcoming' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Days Ahead
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={daysAhead}
                onChange={(e) => setDaysAhead(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-600 rounded-lg text-white border border-slate-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          {/* Send Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSendReminders}
              disabled={sending}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
                sending
                  ? 'bg-orange-400 text-white cursor-not-allowed opacity-60'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Reminders'}
            </button>

            {reminderType === 'overdue' && (
              <button
                onClick={handleMarkOverdue}
                disabled={sending}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  sending
                    ? 'bg-red-400 text-white cursor-not-allowed opacity-60'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                Mark Overdue
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 text-sm mb-4">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default EMINotificationManager;
