import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../PrivateRouter/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { CreditCard, Edit3, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const TrainerFeeCollection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [search, setSearch] = useState('');

  const trainerId = user?.id || user?.userId || user?.user_id || user?.employee_id || user?.employeeId;
  const navigate = useNavigate();
  // Normalize different possible payload shapes into a common user assignment object
  const normalizeAssignedUsers = useCallback((targets = []) => {
    // If the API returned assignments (memberships), normalize that shape
    // targets may already be an array of assignment rows in some calls
    const arr = Array.isArray(targets) && targets.length && targets[0] && (targets[0].memberId || targets[0].membershipId || targets[0].userId)
      ? targets
      : [];

    // If we were passed trainer_targets rows (not assignments), try to extract any embedded lists
    const fallback = [];

    // Helper to resolve a property from multiple possible places on the row
    const resolve = (obj, keys) => {
      if (!obj) return null;
      for (const k of keys) {
        if (k in obj && obj[k] != null) return obj[k];
      }
      // look into common nested holders
      const nestedCandidates = [obj.membership, Array.isArray(obj.membership) ? obj.membership[0] : null, obj.raw, obj.data, obj.record];
      for (const nested of nestedCandidates) {
        if (!nested) continue;
        for (const k of keys) {
          if (k in nested && nested[k] != null) return nested[k];
        }
      }
      // try payments/emi arrays
      const arrays = [obj.payments, obj.emiPayments, obj.emi_schedule, obj.emiSchedule, obj.payments_list, obj.membership?.payments];
      for (const arrc of arrays) {
        if (!Array.isArray(arrc)) continue;
        for (const item of arrc) {
          for (const k of keys) {
            if (k in item && item[k] != null) return item[k];
          }
        }
      }

      return null;
    };

    // Map assignments to normalized user rows
    const list = arr.length ? arr.map((m) => {
      const planStartDate = m.planStartDate || m.startDate || m.start_date || m.plan_start_date || m.joinDate || m.join_date || m.membership?.startDate || m.membership?.start_date || null;
      const planEndDate = m.planEndDate || m.endDate || m.end_date || m.plan_end_date || m.expiryDate || m.expiry_date || m.membership?.endDate || m.membership?.end_date || null;
      const planName = m.planName || m.plan_name || m.plan || m.name || (m.plan && (m.plan.name || m.plan.title)) || m.membership?.planName || m.membership?.plan || '-';
      const username = m.username || m.user_name || m.member_name || m.name || m.membership?.member_name || 'Unknown';
      const phone = m.userMobile || m.user_mobile || m.phone || m.member_phone || m.mobile || m.membership?.mobile || '';
      const status = (m.status || m.membership_status || m.membership?.status || 'active').toString();
      const hasPlan = Boolean(planName && planName !== '-' && planName !== 'Unknown');
      const isExpired = Boolean(hasPlan && planEndDate && dayjs(planEndDate).isBefore(dayjs(), 'day'));
      const planStatus = !hasPlan ? 'No Plan' : isExpired ? 'Expired' : status === 'active' ? 'Active' : status;
      const membershipId = m.membershipId || m.membership_id || (m.membership ? m.membership.id : null) || null;
      const memberId = m.memberId || m.member_id || m.userId || m.user_id || null;

      // Payment / EMI: try multiple shapes including nested `membership` object
      const rawPaymentMode = resolve(m, ['paymentType', 'payment_type', 'payment_mode', 'paymentMode', 'payment', 'mode']) || '';
      const rawNextEmi = resolve(m, ['nextEmiDate', 'next_emi_date', 'next_payment_date', 'nextPaymentDate']) || null;
      const rawIsEmi = resolve(m, ['isEMI', 'is_emi']) || resolve(m.membership, ['isEMI', 'is_emi']);
      const isEMI = Boolean(rawNextEmi) || rawIsEmi === 1 || rawIsEmi === true;
      const paymentType = isEMI ? 'EMI' : (rawPaymentMode ? String(rawPaymentMode) : 'cash');

      return {
        id: membershipId || memberId || `${username}-${phone}`,
        membershipId,
        memberId,
        name: username,
        phone,
        plan: planName,
        startDate: planStartDate,
        endDate: planEndDate,
        paymentType,
        nextEmiDate: rawNextEmi || null,
        status,
        planStatus,
        isExpired,
        trainerName: user?.name || user?.username || 'You',
        raw: m,
      };
    }) : fallback;

    // dedupe
    const uniq = Array.from(new Map(list.map((u) => [String(u.id || u.phone || u.name), u])).values());
    return uniq;
  }, [user]);

  const fetchTrainerTargets = useCallback(async () => {
    try {
      setLoading(true);

      // Prefer assignments endpoint which returns memberships assigned to a trainer
      const res = await api.get(`/assignments`, { params: { trainerUserId: trainerId } });
      const membersRaw = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.assignments || [];
      console.debug('[TrainerFeeCollection] assignments fetched:', membersRaw?.length || 0, res.data);

      // If assignments are empty, fall back to trainer-targets (older data shape)
      const fallbackRes = await api.get('/trainer-targets', { params: { trainerId } });
      console.debug('[TrainerFeeCollection] trainer-targets fetched:', Array.isArray(fallbackRes.data) ? fallbackRes.data.length : (fallbackRes.data?.length || 0));
      const source = membersRaw.length ? membersRaw : fallbackRes.data || [];

      const users = normalizeAssignedUsers(source);
      setAssignedUsers(users);
    } catch (err) {
      console.error('Error fetching trainer targets or assignments:', err);
      toast.error('Unable to load assigned users');
    } finally {
      setLoading(false);
    }
  }, [trainerId, normalizeAssignedUsers]);

  // (Collect payment removed from UI — handler kept for possible future use)

  // Complete current plan and optionally assign a new plan for the membership
  const handleCompletePlanForUser = async (u) => {
    try {
      const membershipId = u.membershipId || u.id;
      if (!membershipId) return toast.error('Membership id not found');

      const confirmMessage = u.isExpired
        ? 'This plan has expired. Update the plan by assigning a replacement?'
        : 'Mark current plan complete and assign a new plan?';
      if (!window.confirm(confirmMessage)) return;

      const newPlanId = window.prompt(`Enter new plan id${u.isExpired ? ' for update' : ''} (plan internal id or external plan_id)`);
      if (!newPlanId) return toast.error('No plan id provided');

      const start = window.prompt('Enter new start date (YYYY-MM-DD)', dayjs().format('YYYY-MM-DD'));
      const end = window.prompt('Enter new end date (YYYY-MM-DD)', dayjs().add(30, 'day').format('YYYY-MM-DD'));

      await api.put(`/memberships/${membershipId}`, {
        planId: newPlanId,
        startDate: start,
        endDate: end,
      });

      toast.success('Membership updated with new plan');
      fetchTrainerTargets();
    } catch (err) {
      console.error('Complete plan error:', err);
      toast.error('Failed to update membership');
    }
  };

  useEffect(() => {
    if (!trainerId) return;
    fetchTrainerTargets();
  }, [trainerId, fetchTrainerTargets]);

  const getDaysRemaining = (date) => {
    if (!date) return '-';
    const diff = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
    if (diff < 0) return 'Expired';
    if (diff === 0) return 'Today';
    return `${diff} days`;
  };

  const totalAssigned = assignedUsers.length;
  const expiredCount = assignedUsers.filter((u) => u.isExpired).length;
  const activeCount = totalAssigned - expiredCount;

  const filtered = assignedUsers.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.name || '').toLowerCase().includes(s) || (u.phone || '').toLowerCase().includes(s) || (u.plan || '').toLowerCase().includes(s);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Memberships</h1>
            <p className="text-sm text-gray-400">Showing users assigned to your targets ({assignedUsers.length})</p>
          </div>
          <div className="w-full sm:w-80">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone or plan"
              className="w-full rounded-2xl px-4 py-3 bg-slate-900 border border-white/10 text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-5 shadow-lg shadow-black/20">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Assigned</p>
            <h2 className="mt-3 text-4xl font-bold text-white">{totalAssigned}</h2>
          </div>
          <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-5 shadow-lg shadow-black/20">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Active Plans</p>
            <h2 className="mt-3 text-4xl font-bold text-emerald-400">{activeCount}</h2>
          </div>
          <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-5 shadow-lg shadow-black/20">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Expired Plans</p>
            <h2 className="mt-3 text-4xl font-bold text-rose-400">{expiredCount}</h2>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-4 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No assigned users found.</div>
          ) : (
            <table className="min-w-full table-auto text-left">
              <thead>
                <tr className="text-sm text-gray-400 border-b border-white/10">
                  <th className="px-4 py-3">S.No</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3">Trainer</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Next EMI</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, index) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-4 py-3 font-semibold text-slate-200">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.plan}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.startDate ? dayjs(u.startDate).format('DD/MM/YYYY') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.endDate ? dayjs(u.endDate).format('DD/MM/YYYY') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{getDaysRemaining(u.endDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.trainerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-300"><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold ${u.paymentType === 'EMI' ? 'bg-orange-500/20 text-orange-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{u.paymentType}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.nextEmiDate && dayjs(u.nextEmiDate).isValid() ? dayjs(u.nextEmiDate).format('DD/MM/YYYY') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate('/trainer/billing-history', { state: { member: u } })}
                          title="View billing"
                          className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/10 bg-slate-950/80 text-slate-200 hover:bg-slate-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleCompletePlanForUser(u)}
                          title="Update plan"
                          className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/10 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerFeeCollection;
