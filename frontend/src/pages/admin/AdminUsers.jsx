import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { AdminPagination } from '../../components/admin/AdminPagination';
import { Avatar } from '../../components/ui/Avatar';

export const AdminUsers = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ page, limit: 20, search, status });
      setData(res.data || []);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const viewUser = async (id) => {
    setDetailLoading(true);
    try {
      const res = await adminService.getUserModeration(id);
      setSelectedUser(res);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    setActionId(id);
    try {
      if (action === 'block') await adminService.blockUser(id, 'Blocked by admin');
      if (action === 'unblock') await adminService.unblockUser(id);
      if (action === 'suspend') await adminService.suspendUser(id, 'Suspended by admin');
      if (action === 'delete') await adminService.deleteUser(id);
      await load();
      if (selectedUser?.user?.id === id) setSelectedUser(null);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-extrabold">Users</h2>
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? <div className="animate-pulse h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3 hidden lg:table-cell">Email</th>
                <th className="p-3 hidden md:table-cell">Profession</th>
                <th className="p-3">Followers</th>
                <th className="p-3 hidden sm:table-cell">Posts</th>
                <th className="p-3">Status</th>
                <th className="p-3 hidden xl:table-cell">Joined</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={u.profileImage} alt={u.fullName} size="sm" />
                      <div>
                        <p className="font-bold">{u.fullName}</p>
                        <p className="text-xs text-slate-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden lg:table-cell text-xs">{u.email}</td>
                  <td className="p-3 hidden md:table-cell text-xs">{u.title || '—'}</td>
                  <td className="p-3">{u.followersCount}</td>
                  <td className="p-3 hidden sm:table-cell">{u.postsCount}</td>
                  <td className="p-3"><span className="text-xs font-bold capitalize px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">{u.accountStatus}</span></td>
                  <td className="p-3 hidden xl:table-cell text-xs text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <button type="button" onClick={() => viewUser(u.id)} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-600">View</button>
                      {u.accountStatus === 'active' ? (
                        <>
                          <button disabled={actionId === u.id} onClick={() => handleAction(u.id, 'block')} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600">Block</button>
                          <button disabled={actionId === u.id} onClick={() => handleAction(u.id, 'suspend')} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600">Suspend</button>
                        </>
                      ) : (
                        <button disabled={actionId === u.id} onClick={() => handleAction(u.id, 'unblock')} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600">Unblock</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdminPagination pagination={pagination} onPageChange={setPage} />

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            {detailLoading ? (
              <div className="animate-pulse h-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar src={selectedUser.user?.profileImage} alt={selectedUser.user?.fullName} size="md" />
                  <div>
                    <p className="font-bold">{selectedUser.user?.fullName}</p>
                    <p className="text-xs text-slate-400">@{selectedUser.user?.username} · {selectedUser.user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <p>Followers: {selectedUser.stats?.followersCount ?? selectedUser.user?.followersCount}</p>
                  <p>Following: {selectedUser.stats?.followingCount ?? selectedUser.user?.followingCount}</p>
                  <p>Posts: {selectedUser.stats?.postsCount ?? selectedUser.user?.postsCount}</p>
                  <p>Reels: {selectedUser.stats?.reelsCount ?? 0}</p>
                  <p className="col-span-2">Status: {selectedUser.accountStatus || selectedUser.user?.accountStatus}</p>
                  <p className="col-span-2">Profession: {selectedUser.user?.title || '—'}</p>
                </div>
                {(selectedUser.reportsAgainst?.length > 0) && (
                  <div className="mb-3">
                    <p className="text-xs font-bold mb-1">Reports against user</p>
                    {selectedUser.reportsAgainst.slice(0, 5).map((r) => (
                      <p key={r.id} className="text-xs text-slate-400 capitalize">{r.reason?.replace(/_/g, ' ')} · {r.status}</p>
                    ))}
                  </div>
                )}
                {(selectedUser.reportsSubmitted?.length > 0) && (
                  <div className="mb-3">
                    <p className="text-xs font-bold mb-1">Reports submitted by user</p>
                    {selectedUser.reportsSubmitted.slice(0, 5).map((r) => (
                      <p key={r.id} className="text-xs text-slate-400 capitalize">{r.targetType} · {r.reason?.replace(/_/g, ' ')} · {r.status}</p>
                    ))}
                  </div>
                )}
                {(selectedUser.blocks?.blockedUsers?.length > 0 || selectedUser.blocks?.blockedBy?.length > 0) && (
                  <div className="mb-3">
                    <p className="text-xs font-bold mb-1">User blocks</p>
                    <p className="text-xs text-slate-400">Blocked: {selectedUser.blocks?.blockedUsers?.length || 0} · Blocked by: {selectedUser.blocks?.blockedBy?.length || 0}</p>
                  </div>
                )}
                {(selectedUser.restrictions?.restrictedUsers?.length > 0) && (
                  <div className="mb-3">
                    <p className="text-xs font-bold mb-1">Restrictions</p>
                    <p className="text-xs text-slate-400">Restricted users: {selectedUser.restrictions?.restrictedUsers?.length || 0}</p>
                  </div>
                )}
                <button type="button" onClick={() => setSelectedUser(null)} className="w-full py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700">Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
