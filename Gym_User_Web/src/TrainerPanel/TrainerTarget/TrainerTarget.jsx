import { useEffect, useState } from 'react';
import { useAuth } from '../../PrivateRouter/AuthContext';
import api from '../../api';
import toast from 'react-hot-toast';
import { TrendingUp, CheckCircle, AlertCircle, Calendar, Target, Zap } from 'lucide-react';
import dayjs from 'dayjs';

const TrainerTarget = () => {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetDays, setTargetDays] = useState(1);
  const [targetAmount, setTargetAmount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [stats, setStats] = useState({
    targetAmount: 0,
    targetDays: 0,
    targetCompleted: false,
    progressPercent: 0,
  });

  const trainerId = user?.id || user?.userId || user?.user_id || user?.employee_id || user?.employeeId;
  const trainerName = user?.name || user?.username || user?.email || 'Trainer';

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
        setTargetDays(latestTarget.assigned_days || latestTarget.days || 1);
        setTargetAmount(latestTarget.assigned_amount || latestTarget.amount || 0);
        
        // Calculate progress
        const collected = latestTarget.total_collected || latestTarget.combinedTotal || 0;
        const progressPercent = ((collected / (latestTarget.assigned_amount || 1)) * 100).toFixed(1);
        
        setStats({
          targetAmount: latestTarget.assigned_amount || latestTarget.amount || 0,
          targetDays: latestTarget.assigned_days || latestTarget.days || 1,
          targetCompleted: latestTarget.is_completed || latestTarget.completed || false,
          progressPercent: Math.min(progressPercent, 100),
          collected,
        });
      }
    } catch (err) {
      console.error('Error fetching targets:', err);
      toast.error('Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTarget = async (e) => {
    e.preventDefault();
    const days = Number(targetDays);
    const amount = Number(targetAmount);

    if (!days || days < 1 || days > 31) {
      toast.error('Days must be between 1 and 31');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        trainerId,
        trainerName,
        days,
        amount,
      };

      const response = await api.post('/trainer-targets', payload);
      setCurrentTarget(response.data);
      setShowForm(false);
      setTargetDays(1);
      setTargetAmount(0);
      await fetchTrainerTargets();
      toast.success('Target created successfully');
    } catch (err) {
      console.error('Error creating target:', err);
      toast.error(err.response?.data?.message || 'Failed to create target');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTarget = async () => {
    if (!currentTarget?.id) {
      toast.error('No target to complete');
      return;
    }

    if (window.confirm('Mark this target as complete?')) {
      try {
        await api.put(`/trainer-targets/${currentTarget.id}`, {
          is_completed: true,
        });
        setStats({ ...stats, targetCompleted: true });
        await fetchTrainerTargets();
        toast.success('Target marked as complete');
      } catch (err) {
        console.error('Error completing target:', err);
        toast.error('Failed to complete target');
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">{title}</p>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <TrendingUp size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Target</h1>
              <p className="text-gray-400 text-sm mt-1">Track and manage your sales targets</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
          >
            {showForm ? 'Cancel' : 'Create Target'}
          </button>
        </div>

        {/* Create Target Form */}
        {showForm && (
          <div className="rounded-2xl border border-orange-500/30 bg-slate-950/80 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-6">Create New Target</h2>
            <form onSubmit={handleCreateTarget} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Days (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={targetDays}
                    onChange={(e) => setTargetDays(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Target'}
              </button>
            </form>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Target Amount"
            value={`₹${Number(stats.targetAmount).toLocaleString('en-IN')}`}
            icon={Target}
            color="bg-blue-500/20"
          />
          <StatCard
            title="Target Days"
            value={stats.targetDays}
            icon={Calendar}
            color="bg-purple-500/20"
          />
          <StatCard
            title="Progress"
            value={`${stats.progressPercent}%`}
            icon={Zap}
            color="bg-green-500/20"
          />
        </div>

        {/* Current Target Details */}
        {currentTarget && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-8 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Current Target</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Created on {dayjs(currentTarget.created_at).format('DD MMM YYYY')}
                </p>
              </div>
              {currentTarget.is_completed || currentTarget.completed ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Completed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">In Progress</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-gray-400 text-sm mb-2">Days Assigned</p>
                <p className="text-3xl font-bold text-orange-400">{currentTarget.assigned_days || currentTarget.days || '-'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-gray-400 text-sm mb-2">Amount Target</p>
                <p className="text-3xl font-bold text-blue-400">₹{Number(currentTarget.assigned_amount || currentTarget.amount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-gray-400 text-sm mb-2">Collected Amount</p>
                <p className="text-3xl font-bold text-green-400">₹{Number(stats.collected || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-300">Progress</p>
                <p className="text-sm font-semibold text-orange-400">{stats.progressPercent}%</p>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                  style={{ width: `${stats.progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Action Button */}
            {!currentTarget.is_completed && !currentTarget.completed && (
              <button
                onClick={handleCompleteTarget}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:brightness-110 transition"
              >
                Mark Target as Complete
              </button>
            )}
          </div>
        )}

        {/* No Target State */}
        {!currentTarget && (
          <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950/80 p-12 text-center backdrop-blur-xl">
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Target Assigned Yet</h3>
            <p className="text-gray-400 mb-6">Create a target to start tracking your sales goals</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
            >
              Create Your First Target
            </button>
          </div>
        )}

        {/* Target History */}
        {targets.length > 1 && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white mb-6">Target History</h2>
            <div className="space-y-3">
              {targets.slice(1).map((target, index) => (
                <div
                  key={target.id || index}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      ₹{Number(target.assigned_amount || target.amount || 0).toLocaleString('en-IN')} in {target.assigned_days || target.days || '-'} days
                    </p>
                    <p className="text-sm text-gray-400">
                      {dayjs(target.created_at).format('DD MMM YYYY')}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    target.is_completed || target.completed
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {target.is_completed || target.completed ? 'Completed' : 'In Progress'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerTarget;
