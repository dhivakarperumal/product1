import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, Calendar, TrendingUp } from 'lucide-react';
import api from '../../api';
import { formatDate, getDaysTillDue, formatEMIText, getEMIStatusSummary } from '../../utils/emiUtils';

const EMISidebar = () => {
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUpcomingEMI();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUpcomingEMI, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUpcomingEMI = async () => {
    try {
      setLoading(true);
      const response = await api.get('/memberships/emi/upcoming?daysAhead=30');
      setUpcomingPayments(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch upcoming EMI payments:', err);
      setError('Failed to load EMI data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (payment) => {
    const daysLeft = getDaysTillDue(payment.dueDate);
    
    if (daysLeft < 0) {
      return {
        text: 'Overdue',
        bg: 'bg-red-500/20',
        border: 'border-red-500',
        icon: AlertCircle,
        textColor: 'text-red-400'
      };
    } else if (daysLeft <= 3) {
      return {
        text: `Due in ${daysLeft}d`,
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500',
        icon: Clock,
        textColor: 'text-yellow-400'
      };
    } else {
      return {
        text: `Due in ${daysLeft}d`,
        bg: 'bg-blue-500/20',
        border: 'border-blue-500',
        icon: Calendar,
        textColor: 'text-blue-400'
      };
    }
  };

  const groupByMember = (payments) => {
    return payments.reduce((acc, payment) => {
      const memberId = payment.memberId;
      if (!acc[memberId]) {
        acc[memberId] = [];
      }
      acc[memberId].push(payment);
      return acc;
    }, {});
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-bold text-white">EMI Payments</h3>
        </div>
        <div className="text-center text-gray-400 py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-red-500/30">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-bold text-white">EMI Payments</h3>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const groupedPayments = groupByMember(upcomingPayments);
  const memberCount = Object.keys(groupedPayments).length;
  const totalPaymentsDue = upcomingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700 max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-bold text-white">EMI Payments</h3>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Members</p>
          <p className="text-xl font-bold text-blue-400">{memberCount}</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Total Due</p>
          <p className="text-xl font-bold text-orange-400">₹{totalPaymentsDue.toFixed(0)}</p>
        </div>
      </div>

      {/* Payments List */}
      {upcomingPayments.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-green-500/40 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No upcoming EMI payments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingPayments.slice(0, 10).map((payment, index) => {
            const statusInfo = getStatusBadge(payment);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={payment.id}
                className={`p-3 rounded-lg border ${statusInfo.border} ${statusInfo.bg} backdrop-blur-sm hover:bg-opacity-50 transition-all`}
              >
                {/* Member Info */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {payment.member_name || 'Member'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Inst. {payment.installmentNumber}/{payment.emiMonths || '?'}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${statusInfo.textColor}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.text}
                  </div>
                </div>

                {/* Amount & Date */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400 mb-1">Amount</p>
                    <p className="text-white font-bold">₹{(payment.amount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Due Date</p>
                    <p className="text-white font-bold">{formatDate(payment.dueDate)}</p>
                  </div>
                </div>

                {/* Phone/Email (optional) */}
                {payment.member_phone && (
                  <p className="text-xs text-gray-500 mt-2 truncate">
                    {payment.member_phone}
                  </p>
                )}
              </div>
            );
          })}

          {upcomingPayments.length > 10 && (
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                +{upcomingPayments.length - 10} more payments
              </p>
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchUpcomingEMI}
        className="mt-4 w-full py-2 px-3 bg-orange-500/20 border border-orange-500/40 rounded-lg text-xs font-medium text-orange-400 hover:bg-orange-500/30 transition-colors"
      >
        Refresh EMI Data
      </button>
    </div>
  );
};

export default EMISidebar;
