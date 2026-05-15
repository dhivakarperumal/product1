import { useEffect, useState } from 'react';
import { useAuth } from '../PrivateRouter/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle2, CircleDollarSign, Clock, ArrowRight, Sparkles } from 'lucide-react';
import dayjs from 'dayjs';

const TrainerFeeCollection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState([]);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [billingAmount, setBillingAmount] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const trainerId = user?.id || user?.userId || user?.user_id || user?.employee_id || user?.employeeId;

  useEffect(() => {
    if (!trainerId) return;
    fetchTrainerTargets();
  }, [trainerId]);

  const fetchTrainerTargets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/trainer-targets', {
        params: { trainerId },
      });

      const targetData = Array.isArray(response.data) ? response.data : [];
      setTargets(targetData);

      if (targetData.length > 0) {
        const latestTarget = targetData[0];
        setCurrentTarget(latestTarget);
      } else {
        setCurrentTarget(null);
      }
    } catch (error) {
      console.error('Error fetching trainer targets:', error);
      toast.error('Unable to load trainer targets');
    } finally {
      setLoading(false);
    }
  };

  const buildPaymentHistory = (target) => {
    return target?.paymentHistory || target?.payment_history || [];
  };

  const getCollectedAmount = (target) => {
    return Number(target?.combined_total || target?.total_collected || target?.combinedTotal || 0);
  };

  const getTargetAmount = (target) => {
    return Number(target?.assigned_amount || target?.amount || 0);
  };

  const handleCollectPayment = async (event) => {
    event.preventDefault();
    if (!currentTarget?.id) {
      toast.error('No active target found');
      return;
    }

    const billingValue = Number(billingAmount || 0);
    const emiValue = Number(emiAmount || 0);
    const totalCollected = billingValue + emiValue;

    if (totalCollected <= 0) {
      toast.error('Enter a billing amount or EMI amount');
      return;
    }

    const previousCollected = getCollectedAmount(currentTarget);
    const newCollected = previousCollected + totalCollected;
    const paymentHistory = buildPaymentHistory(currentTarget);

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
      billingAmount: billingValue,
      emiAmount: emiValue,
      totalAmount: totalCollected,
      note: note.trim() || 'Collected by trainer',
      targetId: currentTarget.id,
    };

    const updatedHistory = [...paymentHistory, entry];

    try {
      setSubmitting(true);
      const response = await api.put(`/trainer-targets/${currentTarget.id}`, {
        total_collected: newCollected,
        payment_history: updatedHistory,
      });

      const updatedTarget = response.data;
      setCurrentTarget(updatedTarget);
      setBillingAmount('');
      setEmiAmount('');
      setNote('');
      toast.success('Payment collected successfully');
    } catch (error) {
      console.error('Error collecting payment:', error);
      toast.error('Failed to collect payment');
    } finally {
      setSubmitting(false);
      fetchTrainerTargets();
    }
  };

  const handleCompleteTarget = async () => {
    if (!currentTarget?.id) {
      toast.error('No active target available');
      return;
    }

    if (!window.confirm('Mark this target as complete and stop collection?')) {
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`/trainer-targets/${currentTarget.id}`, {
        is_completed: true,
      });
      toast.success('Target marked as complete');
      fetchTrainerTargets();
    } catch (error) {
      console.error('Error completing target:', error);
      toast.error('Failed to complete target');
    } finally {
      setSubmitting(false);
    }
  };

  const outstandingAmount = currentTarget ? Math.max(getTargetAmount(currentTarget) - getCollectedAmount(currentTarget), 0) : 0;
  const progressPercent = currentTarget
    ? Math.min(Math.round((getCollectedAmount(currentTarget) / Math.max(getTargetAmount(currentTarget), 1)) * 100), 100)
    : 0;
  const paymentHistory = buildPaymentHistory(currentTarget);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <CreditCard size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Client Fee Collection</h1>
              <p className="text-gray-400 text-sm mt-1">Collect billing amount, EMI payment, and complete the target.</p>
            </div>
          </div>
          <button
            onClick={handleCompleteTarget}
            disabled={!currentTarget || currentTarget.is_completed || currentTarget.completed || submitting}
            className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50"
          >
            {currentTarget?.is_completed || currentTarget?.completed ? 'Target Completed' : submitting ? 'Saving...' : 'Complete Target'}
          </button>
        </div>

        {currentTarget ? (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 backdrop-blur-xl">
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Active Target</p>
                  <h2 className="text-2xl font-semibold text-white">{currentTarget.trainer_name || 'Your Target'}</h2>
                  <p className="text-sm text-gray-400">Created on {dayjs(currentTarget.created_at).format('DD MMM YYYY')}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Target Amount</p>
                    <p className="mt-3 text-3xl font-bold text-blue-300">₹{getTargetAmount(currentTarget).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Collected</p>
                    <p className="mt-3 text-3xl font-bold text-emerald-300">₹{getCollectedAmount(currentTarget).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Outstanding</p>
                    <p className="mt-3 text-3xl font-bold text-orange-300">₹{outstandingAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-300">Progress</p>
                    <p className="text-sm font-semibold text-white">{progressPercent}%</p>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/20">
                    <div className="h-full bg-linear-to-r from-orange-400 to-amber-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white">Collect Billing & EMI</h3>
                  <form onSubmit={handleCollectPayment} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Billing Amount (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={billingAmount}
                          onChange={(e) => setBillingAmount(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                          placeholder="Enter amount collected"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">EMI Amount (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={emiAmount}
                          onChange={(e) => setEmiAmount(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                          placeholder="Enter EMI collected"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Note</label>
                      <textarea
                        rows="3"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        placeholder="Optional collection note"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-2xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50"
                    >
                      {submitting ? 'Recording...' : 'Record Collection'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-2xl bg-blue-500/20 p-3 text-blue-300">
                    <CircleDollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Target stats</p>
                    <h3 className="text-xl font-semibold text-white">File Summary</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                    <p className="text-sm text-gray-400">Current Client Count</p>
                    <p className="mt-2 text-3xl font-bold text-white">{targets.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                    <p className="text-sm text-gray-400">Target Status</p>
                    <p className="mt-2 text-xl font-semibold text-white">{currentTarget.is_completed || currentTarget.completed ? 'Completed' : 'Collecting'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                    <p className="text-sm text-gray-400">Last updated</p>
                    <p className="mt-2 text-lg font-semibold text-white">{dayjs(currentTarget.updated_at || currentTarget.created_at).format('DD MMM YYYY')}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="rounded-2xl bg-orange-500/20 p-3 text-orange-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Collection history</p>
                    <h3 className="text-xl font-semibold text-white">Recent payments</h3>
                  </div>
                </div>
                {paymentHistory.length === 0 ? (
                  <p className="text-gray-400">No collection records yet. Record billing or EMI payments to track progress.</p>
                ) : (
                  <div className="space-y-3">
                    {paymentHistory.slice(-6).reverse().map((item) => (
                      <div key={item.id || `${item.date}-${item.totalAmount}`} className="rounded-2xl bg-white/5 p-4 border border-white/10">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">₹{Number(item.totalAmount || 0).toLocaleString('en-IN')} collected</p>
                            <p className="text-sm text-gray-400">Billing ₹{Number(item.billingAmount || 0).toLocaleString('en-IN')}, EMI ₹{Number(item.emiAmount || 0).toLocaleString('en-IN')}</p>
                          </div>
                          <span className="text-xs uppercase tracking-[0.2em] text-green-300">{dayjs(item.date).format('DD MMM')}</span>
                        </div>
                        {item.note && <p className="mt-3 text-sm text-gray-300">{item.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/20 bg-slate-950/80 p-12 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-orange-400">
              <ArrowRight className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">No trainer target found</h2>
            <p className="text-gray-400 mb-6">Create a target first from the target page before collecting client fees or EMI payments.</p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '#/trainer/target';
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600 transition"
            >
              Go to Target Page
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerFeeCollection;
