import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../PrivateRouter/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { CreditCard } from 'lucide-react';
import dayjs from 'dayjs';

const TrainerFeeCollection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [search, setSearch] = useState('');

  const trainerId = user?.id || user?.userId || user?.user_id || user?.employee_id || user?.employeeId;
  // Normalize different possible payload shapes into a common user assignment object
  const normalizeAssignedUsers = (targets = []) => {
    // If the API returned assignments (memberships), normalize that shape
    // targets may already be an array of assignment rows in some calls
    const arr = Array.isArray(targets) && targets.length && targets[0] && (targets[0].memberId || targets[0].membershipId || targets[0].userId)
      ? targets
      : [];

    // If we were passed trainer_targets rows (not assignments), try to extract any embedded lists
    const fallback = [];

    // Map assignments to normalized user rows
    const list = arr.length ? arr.map((m) => {
      const planStartDate = m.planStartDate || m.startDate || m.start_date || m.plan_start_date || m.joinDate || m.join_date || null;
      const planEndDate = m.planEndDate || m.endDate || m.end_date || m.plan_end_date || m.expiryDate || m.expiry_date || null;
      const planName = m.planName || m.plan_name || m.plan || m.name || (m.plan && (m.plan.name || m.plan.title)) || '-';
      const username = m.username || m.user_name || m.member_name || m.name || 'Unknown';
      const phone = m.userMobile || m.user_mobile || m.phone || m.member_phone || m.mobile || '';
      const status = (m.status || m.membership_status || 'active').toString();
      return {
        id: m.membershipId || m.membership_id || m.memberId || m.member_id || m.userId || m.user_id || m.id,
        name: username,
        phone,
        plan: planName,
        startDate: planStartDate,
        endDate: planEndDate,
        paymentType: m.payment_type || m.paymentMode || m.mode || m.payment || 'cash',
        nextEmiDate: m.next_emi_date || m.nextEmiDate || m.next_payment_date || null,
        status,
        raw: m,
      };
    }) : fallback;

    // dedupe
    const uniq = Array.from(new Map(list.map((u) => [String(u.id || u.phone || u.name), u])).values());
    return uniq;
  };

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
  }, [trainerId]);

  // Collect payment for a membership/assignment row
  const handleCollectPaymentForUser = async (u) => {
    try {
      const membershipId = u.id;
      if (!membershipId) return toast.error('Membership id not found');

      // Ask amount and method
      const amountStr = window.prompt('Enter collected amount (numeric)');
      if (!amountStr) return;
      const amount = Number(amountStr);
      if (Number.isNaN(amount) || amount <= 0) return toast.error('Invalid amount');

      const method = window.prompt('Payment method (cash/online/card/emi)', 'cash') || 'cash';

      // If membership has EMI schedule, try to mark first pending EMI as paid
      const emiRes = await api.get(`/memberships/emi/payments/${membershipId}`);
      const payments = Array.isArray(emiRes.data) ? emiRes.data : [];
      const pending = payments.find((p) => p.status === 'pending');

      if (pending) {
        // Mark EMI payment as completed
        await api.put(`/memberships/emi/payment/${pending.id}`, {
          status: 'completed',
          paymentMethod: method,
          paidDate: new Date().toISOString(),
        });
        toast.success('EMI payment recorded');
      } else {
        // No EMI pending - register as a simple membership payment via membership update
        await api.put(`/memberships/${membershipId}`, {
          pricePaid: amount,
        });
        toast.success('Payment recorded for membership');
      }

      // Update trainer target totals if applicable
      try {
        const tRes = await api.get('/trainer-targets', { params: { trainerId } });
        const targets = Array.isArray(tRes.data) ? tRes.data : [];
        const target = targets.find((t) => String(t.trainer_id || t.trainerId || t.trainer) === String(trainerId));
        if (target) {
          const prevCombined = Number(target.combined_total || target.combinedTotal || 0) || 0;
          const newCombined = prevCombined + amount;
          await api.put(`/trainer-targets/${target.id}`, {
            total_collected: newCombined,
          });
        }
      } catch (e) {
        console.error('Failed to update trainer target after payment', e);
      }

      // refresh
      fetchTrainerTargets();
    } catch (err) {
      console.error('Collect payment error:', err);
      toast.error('Failed to record payment');
    }
  };

  // Complete current plan and optionally assign a new plan for the membership
  const handleCompletePlanForUser = async (u) => {
    try {
      const membershipId = u.id;
      if (!membershipId) return toast.error('Membership id not found');

      if (!window.confirm('Mark current plan complete and assign a new plan?')) return;

      const newPlanId = window.prompt('Enter new plan id (plan internal id or external plan_id)');
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
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <CreditCard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Assigned Users</h1>
              <p className="text-sm text-gray-400">Showing all users assigned to your targets ({assignedUsers.length})</p>
            </div>
          </div>
          <div className="w-72">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone or plan"
              className="w-full rounded-lg px-4 py-2 bg-slate-900 border border-white/10 text-white outline-none"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-4 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No assigned users found.</div>
          ) : (
            <table className="min-w-full table-auto text-left">
              <thead>
                <tr className="text-sm text-gray-400 border-b border-white/10">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Next EMI</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.plan}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.startDate ? dayjs(u.startDate).format('DD/MM/YYYY') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.endDate ? dayjs(u.endDate).format('DD/MM/YYYY') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{(u.paymentType || 'cash').toString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.nextEmiDate ? dayjs(u.nextEmiDate).format('DD/MM/YYYY') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCollectPaymentForUser(u)}
                          className="px-3 py-1 bg-emerald-500 text-white rounded-md text-sm hover:bg-emerald-600"
                        >
                          Collect
                        </button>
                        <button
                          onClick={() => handleCompletePlanForUser(u)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                        >
                          Complete Plan
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
