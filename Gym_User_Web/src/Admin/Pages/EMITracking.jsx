import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, CheckCircle2, Clock, TrendingUp, Download } from 'lucide-react';
import api from '../../api';
import * as emiUtilsModule from '../../utils/emiUtils';

// Import with fallback
let formatDate, getDaysTillDue;

const emiUtils = emiUtilsModule || {};
formatDate = emiUtils.formatDate || ((dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
});
getDaysTillDue = emiUtils.getDaysTillDue || ((dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const EMITracking = () => {
  const [memberships, setMemberships] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [emiPayments, setEmiPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/memberships');
      const emiMembers = (response.data || []).filter(m => m.isEMI);
      setMemberships(emiMembers);
    } catch (err) {
      console.error('Failed to fetch memberships:', err);
      setError('Failed to load memberships: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchEMIPayments = async (membershipId) => {
    try {
      const response = await api.get(`/memberships/emi/payments/${membershipId}`);
      setEmiPayments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch EMI payments:', err);
      setEmiPayments([]);
    }
  };

  const handleSelectMembership = (membership) => {
    setSelectedMembership(membership);
    fetchEMIPayments(membership.id);
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      await api.put(`/memberships/emi/payment/${paymentId}`, {
        status: newStatus,
        paidDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null,
        paymentMethod: newStatus === 'completed' ? 'admin-marked' : null
      });
      
      if (selectedMembership) {
        fetchEMIPayments(selectedMembership.id);
      }
    } catch (err) {
      console.error('Failed to update payment:', err);
      alert('Failed to update payment status');
    }
  };

  const getStatusBadge = (payment) => {
    switch (payment.status) {
      case 'completed':
        return { text: 'Paid', color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 };
      case 'pending':
        const daysLeft = getDaysTillDue(payment.dueDate);
        if (daysLeft < 0) {
          return { text: 'Overdue', color: 'bg-red-500/20 text-red-400', icon: AlertCircle };
        }
        return { text: 'Pending', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock };
      case 'overdue':
        return { text: 'Overdue', color: 'bg-red-500/20 text-red-400', icon: AlertCircle };
      default:
        return { text: payment.status, color: 'bg-gray-500/20 text-gray-400', icon: Clock };
    }
  };

  const downloadEMIReport = () => {
    if (!selectedMembership || emiPayments.length === 0) {
      alert('No EMI data to download');
      return;
    }

    const headers = ['Installment', 'Amount', 'Due Date', 'Paid Date', 'Status'];
    const rows = emiPayments.map(p => [
      p.installmentNumber,
      `₹${p.amount.toFixed(2)}`,
      formatDate(p.dueDate),
      p.paidDate ? formatDate(p.paidDate) : 'N/A',
      p.status.toUpperCase()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EMI_${selectedMembership.member_name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full"></div>
          <p className="text-gray-400 mt-4">Loading EMI data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            EMI Payment Tracking
          </h1>
          <p className="text-gray-400">Track and manage EMI payments for members</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Memberships List */}
          <div className="md:col-span-1">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">EMI Members ({memberships.length})</h2>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {memberships.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4">No EMI memberships found</p>
                ) : (
                  memberships.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMembership(m)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedMembership?.id === m.id
                          ? 'bg-orange-500/30 border border-orange-500 shadow-lg shadow-orange-500/20'
                          : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-600'
                      }`}
                    >
                      <p className="font-semibold text-white text-sm">{m.member_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400 mt-1">{m.planName}</p>
                      <p className="text-xs text-orange-400 mt-1">₹{m.emiAmount?.toFixed(2) || 0}/month</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: EMI Details */}
          <div className="md:col-span-2">
            {selectedMembership ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">EMI Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-xs text-gray-400 mb-2">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-400">₹{selectedMembership.totalAmount?.toFixed(2) || 0}</p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                      <p className="text-xs text-gray-400 mb-2">Monthly EMI</p>
                      <p className="text-2xl font-bold text-orange-400">₹{selectedMembership.emiAmount?.toFixed(2) || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Duration</p>
                      <p className="text-lg font-bold text-white">{selectedMembership.emiMonths} months</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Start Date</p>
                      <p className="text-lg font-bold text-white">{formatDate(selectedMembership.emiStartDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Next Payment</p>
                      <p className="text-lg font-bold text-orange-400">{formatDate(selectedMembership.nextEMIDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Payments Table */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Payment Schedule</h3>
                    <button
                      onClick={downloadEMIReport}
                      className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 border border-orange-500/40 rounded-lg text-sm text-orange-400 hover:bg-orange-500/30 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-600">
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold">Inst.</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold">Amount</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold">Due Date</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold">Paid Date</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emiPayments.map(payment => {
                          const statusInfo = getStatusBadge(payment);
                          return (
                            <tr key={payment.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                              <td className="py-3 px-4 font-bold text-white">#{payment.installmentNumber}</td>
                              <td className="py-3 px-4 font-bold text-orange-400">₹{payment.amount?.toFixed(2) || 0}</td>
                              <td className="py-3 px-4 text-gray-300">{formatDate(payment.dueDate)}</td>
                              <td className="py-3 px-4 text-gray-400">{payment.paidDate ? formatDate(payment.paidDate) : '—'}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                                  {statusInfo.text}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {payment.status !== 'completed' && (
                                  <button
                                    onClick={() => updatePaymentStatus(payment.id, 'completed')}
                                    className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                                  >
                                    Mark Paid
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Select a member to view EMI details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EMITracking;
