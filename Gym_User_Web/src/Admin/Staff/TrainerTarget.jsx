import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { Users, ShoppingCart, CreditCard, TrendingUp } from "lucide-react";
import dayjs from "dayjs";

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const getTrainerLabel = (trainer) => {
  if (!trainer) return '';
  const fullName = [trainer?.first_name, trainer?.last_name].filter(Boolean).join(' ').trim();
  return (
    trainer?.name ||
    trainer?.displayName ||
    trainer?.display_name ||
    fullName ||
    trainer?.username ||
    trainer?.email ||
    trainer?.employee_id ||
    trainer?.employeeId ||
    `Trainer ${trainer?.id ?? ""}`
  ).toString();
};

const getOrderValue = (order) =>
  Number(order.total || order.total_amount || order.amount || order.grand_total || order.price || 0);

const getTrainerName = (item) =>
  String(
    item.trainerName ||
    item.trainer_name ||
    item.trainer_full_name ||
    item.name ||
    item.username ||
    item.trainer_employee_id ||
    item.trainerEmployeeId ||
    item.employee_id ||
    item.employeeId ||
    ""
  );

const groupByMonth = (items, dateKey) => {
  const grouped = {};
  items.forEach((item) => {
    const date = item[dateKey] ? dayjs(item[dateKey]) : null;
    if (!date || !date.isValid()) return;
    const month = date.format("YYYY-MM");
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(item);
  });
  return grouped;
};

const TrainerTarget = () => {
  const [trainers, setTrainers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allTargets, setAllTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrainerId, setSelectedTrainerId] = useState("all");
  const [targetDays, setTargetDays] = useState(1);
  const [targetAmount, setTargetAmount] = useState(0);
  const [assignedTarget, setAssignedTarget] = useState(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [showAssignSuccessModal, setShowAssignSuccessModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [trainerRes, membersRes, ordersRes] = await Promise.allSettled([
          api.get('/staff', { params: { role: 'trainer' } }),
          api.get('/memberships'),
          api.get('/orders'),
        ]);

        if (trainerRes.status === 'fulfilled') {
          const trainerData = Array.isArray(trainerRes.value.data) ? trainerRes.value.data : [];
          setTrainers(trainerData
            .map((t) => {
              const id = String(t.id ?? t.userId ?? t.user_id ?? t.employee_id ?? t.employeeId ?? "").trim();
              if (!id) return null;
              return {
                id,
                name: getTrainerLabel(t),
                email: t.email || "",
              };
            })
            .filter(Boolean));
        }

        if (membersRes.status === 'fulfilled') {
          const membershipData = Array.isArray(membersRes.value.data) ? membersRes.value.data : [];
          setMemberships(membershipData);
        }

        if (ordersRes.status === 'fulfilled') {
          const orderData = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : [];
          setOrders(orderData);
        }
      } catch (err) {
        console.error("TrainerTarget data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchAllTargets = async () => {
    try {
      const response = await api.get('/trainer-targets');
      const targetData = Array.isArray(response.data) ? response.data : [];
      setAllTargets(targetData);
    } catch (err) {
      console.error('Failed to load trainer target history:', err);
    }
  };

  useEffect(() => {
    fetchAllTargets();
  }, []);

  const filteredMemberships = useMemo(() => {
    const normalized = memberships.map((item) => ({
      ...item,
      trainerId: String(item.trainerId || item.trainer_id || item.trainerEmployeeId || item.trainer_employee_id || ""),
      trainerName: getTrainerName(item),
      pricePaid: Number(item.pricePaid ?? item.price ?? item.amount ?? 0),
      paymentDate: item.startDate || item.created_at || item.createdAt || item.paymentDate || item.paid_at || item.updated_at,
    }));

    const selected = selectedTrainerId === 'all'
      ? normalized
      : normalized.filter((m) => String(m.trainerId) === selectedTrainerId || String(m.trainerName).toLowerCase() === String(trainers.find((t) => t.id === selectedTrainerId)?.name || '').toLowerCase());

    return selected;
  }, [memberships, selectedTrainerId, trainers]);

  const filteredOrders = useMemo(() => {
    const normalized = orders.map((item) => ({
      ...item,
      amountValue: getOrderValue(item),
      orderDate: item.created_at || item.createdAt || item.date || item.order_date,
      trainerId: String(item.trainerId || item.trainer_id || item.trainerEmployeeId || item.trainer_employee_id || ""),
      trainerName: getTrainerName(item),
    }));

    const selected = selectedTrainerId === 'all'
      ? normalized
      : normalized.filter((o) => String(o.trainerId) === selectedTrainerId || String(o.trainerName).toLowerCase() === String(trainers.find((t) => t.id === selectedTrainerId)?.name || '').toLowerCase());

    return selected;
  }, [orders, selectedTrainerId, trainers]);

  const membershipGroups = useMemo(
    () => groupByMonth(filteredMemberships, 'paymentDate'),
    [filteredMemberships]
  );

  const orderGroups = useMemo(
    () => groupByMonth(filteredOrders, 'orderDate'),
    [filteredOrders]
  );

  const allMonths = useMemo(() => {
    const months = new Set([...Object.keys(membershipGroups), ...Object.keys(orderGroups)]);
    return [...months].sort((a, b) => b.localeCompare(a));
  }, [membershipGroups, orderGroups]);

  const selectedTrainerLabel = selectedTrainerId === 'all'
    ? 'All Trainers'
    : getTrainerLabel(trainers.find((t) => t.id === selectedTrainerId)) || `Trainer ${selectedTrainerId}`;

  const isAssignedToSelectedTrainer = assignedTarget?.trainer_id === selectedTrainerId || assignedTarget?.trainerId === selectedTrainerId;

  useEffect(() => {
    if (selectedTrainerId === 'all') {
      setAssignedTarget(null);
      setTargetDays(1);
      setTargetAmount(0);
      return;
    }

    const loadAssignedTarget = async () => {
      setTargetLoading(true);
      try {
        const response = await api.get('/trainer-targets', {
          params: { trainerId: selectedTrainerId },
        });
        const [target] = Array.isArray(response.data) ? response.data : [];

        if (target) {
          setAssignedTarget(target);
          setTargetDays(target.assigned_days || target.assignedDays || 1);
          setTargetAmount(target.assigned_amount || target.assignedAmount || 0);
        } else {
          setAssignedTarget(null);
          setTargetDays(1);
          setTargetAmount(0);
        }
      } catch (err) {
        console.error('Failed to load assigned target:', err);
        setAssignedTarget(null);
      } finally {
        setTargetLoading(false);
      }
    };

    loadAssignedTarget();
  }, [selectedTrainerId]);

  const handleAssignTarget = async () => {
    if (!selectedTrainerId || selectedTrainerId === 'all') {
      toast.error('Please select a trainer before assigning a target.');
      return;
    }

    const days = Number(targetDays);
    const amount = Number(targetAmount);

    if (!days || days < 1 || days > 31) {
      toast.error('Enter a valid day value between 1 and 31.');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount greater than 0.');
      return;
    }

    try {
      const trainer = trainers.find((t) => t.id === selectedTrainerId);
      const paymentHistory = monthRows.map((row) => ({
        month: row.month,
        membershipTotal: row.membershipTotal,
        orderTotal: row.orderTotal,
        combined: row.combined,
      }));

      const payload = {
        trainerId: selectedTrainerId,
        trainerName: trainer?.name || trainer?.username || trainer?.email || trainer?.employee_id || 'Trainer',
        days,
        amount,
        totalMembershipCollected: selectedTrainerMembershipTotal,
        totalOrderCollected: selectedTrainerOrderTotal,
        combinedTotal,
        paymentHistory,
      };

      const response = await api.post('/trainer-targets', payload);
      setAssignedTarget(response.data);
      setShowAssignSuccessModal(true);
      fetchAllTargets();

      toast.success(isAssignedToSelectedTrainer ? 'Trainer target reassigned successfully.' : 'Trainer target assigned successfully.');
    } catch (err) {
      console.error('Assign target error:', err);
      toast.error('Unable to save trainer target.');
    }
  };
  const selectedTrainerMembershipTotal = useMemo(
    () => filteredMemberships.reduce((sum, m) => sum + Number(m.pricePaid || 0), 0),
    [filteredMemberships]
  );

  const selectedTrainerOrderTotal = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + Number(o.amountValue || 0), 0),
    [filteredOrders]
  );

  const combinedTotal = selectedTrainerMembershipTotal + selectedTrainerOrderTotal;
  const totalAssignedTargets = allTargets.length;
  const totalAssignedAmount = allTargets.reduce((sum, target) => sum + Number(target.assigned_amount || target.amount || 0), 0);
  const trainersWithTargets = new Set(allTargets.map((target) => String(target.trainer_id || target.trainerId || '')).filter(Boolean)).size;

  const monthRows = allMonths.map((month) => {
    const membershipTotal = (membershipGroups[month] || []).reduce((sum, item) => sum + Number(item.pricePaid || 0), 0);
    const orderTotal = (orderGroups[month] || []).reduce((sum, item) => sum + Number(item.amountValue || 0), 0);
    return {
      month,
      membershipTotal,
      orderTotal,
      combined: membershipTotal + orderTotal,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-[2rem] bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <TrendingUp size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Trainer Target</h1>
              <p className="text-white/60 text-sm">Track monthly trainer fee collections and product sales.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Trainer</label>
              <select
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Trainers</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {getTrainerLabel(trainer)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Assign Days</label>
              <input
                type="number"
                min="1"
                max="31"
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value || 1))}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Assign Amount</label>
              <input
                type="number"
                min="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value || 0))}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="lg:col-span-2">
              <button
                onClick={handleAssignTarget}
                disabled={loading || targetLoading}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-3 text-white font-semibold shadow-xl shadow-orange-500/20 hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isAssignedToSelectedTrainer ? 'Reassign Target' : 'Assign Target'}
              </button>
            </div>
          </div>

          {assignedTarget && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
              <p className="font-semibold text-white">Assigned Target</p>
              <p className="mt-2">Trainer: {assignedTarget.trainerName}</p>
              <p>Days: {assignedTarget.days}</p>
              <p>Amount: ₹{Number(assignedTarget.amount).toLocaleString('en-IN')}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users size={24} className="text-blue-300" />
              <p className="text-sm text-gray-400">Trainer</p>
            </div>
            <p className="text-3xl font-semibold text-white">{selectedTrainerLabel}</p>
            <p className="text-sm text-gray-400 mt-2">Selected trainer for target analysis</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard size={24} className="text-green-300" />
              <p className="text-sm text-gray-400">Monthly Fee Collected</p>
            </div>
            <p className="text-3xl font-semibold text-white">{formatCurrency(selectedTrainerMembershipTotal)}</p>
            <p className="text-sm text-gray-400 mt-2">Collected from memberships / fees</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingCart size={24} className="text-orange-300" />
              <p className="text-sm text-gray-400">Product Sales</p>
            </div>
            <p className="text-3xl font-semibold text-white">{formatCurrency(selectedTrainerOrderTotal)}</p>
            <p className="text-sm text-gray-400 mt-2">Orders matched to trainer or all orders if no trainer assigned</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Target Report</h2>
                <p className="text-sm text-gray-400">Overview of assigned trainer targets across the gym.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5">
                <p className="text-sm text-gray-400">Assigned Targets</p>
                <p className="mt-3 text-3xl font-semibold text-white">{totalAssignedTargets}</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5">
                <p className="text-sm text-gray-400">Total Target Amount</p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatCurrency(totalAssignedAmount)}</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5">
                <p className="text-sm text-gray-400">Trainers with Targets</p>
                <p className="mt-3 text-3xl font-semibold text-white">{trainersWithTargets}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-white text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Trainer</th>
                    <th className="px-4 py-3">Days</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {allTargets.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-400">No target history available yet.</td>
                    </tr>
                  ) : (
                    allTargets.map((target) => {
                      const dateValue = target.updated_at || target.updatedAt || target.created_at || target.createdAt;
                      return (
                        <tr key={`${target.trainer_id || target.trainerId}-${target.assigned_amount}-${dateValue}`} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-medium">{target.trainer_name || target.trainerName || `Trainer ${target.trainer_id || target.trainerId || 'N/A'}`}</td>
                          <td className="px-4 py-4">{target.assigned_days || target.days || 0}</td>
                          <td className="px-4 py-4">{formatCurrency(target.assigned_amount || target.amount || 0)}</td>
                          <td className="px-4 py-4">{dateValue ? dayjs(dateValue).format('DD MMM YYYY') : 'N/A'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Monthly Target Summary</h2>
                <p className="text-sm text-gray-400">Includes monthly fee collection and product sales totals.</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Combined total</p>
                <p className="text-2xl font-semibold text-white">{formatCurrency(combinedTotal)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-white text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Trainer Fees</th>
                    <th className="px-4 py-3">Product Sales</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-400">Loading trainer target data…</td>
                    </tr>
                  ) : monthRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-400">No data available for the selected trainer.</td>
                    </tr>
                  ) : (
                    monthRows.map((row) => {
                      const targetValue = assignedTarget?.amount || 0;
                      const progress = targetValue > 0 ? Math.min(100, Math.round((row.combined / targetValue) * 100)) : 0;
                      return (
                        <tr key={row.month} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-medium">{dayjs(row.month).format('MMM YYYY')}</td>
                          <td className="px-4 py-4">{formatCurrency(row.membershipTotal)}</td>
                          <td className="px-4 py-4">{formatCurrency(row.orderTotal)}</td>
                          <td className="px-4 py-4">{formatCurrency(row.combined)}</td>
                          <td className="px-4 py-4">{formatCurrency(assignedTarget?.amount || 0)}</td>
                          <td className="px-4 py-4">
                            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                              <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">{progress}%</p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showAssignSuccessModal && assignedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowAssignSuccessModal(false)} />
          <div className="relative z-10 w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/95 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-sm text-green-400 uppercase tracking-[0.35em]">Target Assigned</p>
                <h3 className="text-2xl font-semibold text-white">Trainer target updated</h3>
              </div>
              <button
                onClick={() => setShowAssignSuccessModal(false)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 text-gray-300">
              <div className="rounded-2xl bg-slate-950/90 border border-white/10 p-4">
                <p className="text-sm text-gray-400">Trainer</p>
                <p className="mt-1 text-lg font-semibold text-white">{assignedTarget.trainerName || assignedTarget.trainer_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-950/90 border border-white/10 p-4">
                  <p className="text-sm text-gray-400">Days</p>
                  <p className="mt-1 text-lg font-semibold text-white">{assignedTarget.assigned_days || assignedTarget.days || targetDays}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/90 border border-white/10 p-4">
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="mt-1 text-lg font-semibold text-white">{formatCurrency(assignedTarget.assigned_amount || assignedTarget.amount || targetAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerTarget;
