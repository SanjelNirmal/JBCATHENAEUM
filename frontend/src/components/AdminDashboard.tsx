// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import React, { useState, useEffect } from "react";
import { Users, FileText, Settings, Database, Trash2, AlertTriangle, X, Plus, Shield, Mail } from "lucide-react";
import { createResource, deleteResource, UserProfile, fetchUsers, updateUserRole, fetchSubscribers } from "../lib/api";
import { useResourcesData } from "../lib/api";
import { Toast, ToastType } from "./Toast";
import { AnimatePresence } from "motion/react";
import { SystemStatusPanel } from "./admin/SystemStatusPanel";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'notes' | 'users' | 'subscribers' | 'settings'>('notes');
  const { resources, subjects, refresh } = useResourcesData();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
    if (activeTab === 'subscribers') {
      loadSubscribers();
    }
  }, [activeTab]);

  const loadSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const data = await fetchSubscribers();
      setSubscribers(data);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('relation "newsletter_subscriptions" does not exist')) {
        showToast("Database Error: 'newsletter_subscriptions' table not found. Please run the SQL in SUPABASE_SETUP.md", 'error');
      } else {
        showToast("Failed to fetch newsletter subscribers.", 'error');
      }
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch user directory. Check database connectivity.", 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateRole = async (user: UserProfile) => {
    const shouldGrant = !user.roles.includes('admin');
    const action = shouldGrant ? 'grant' : 'revoke';
    if (!window.confirm(`${action === 'grant' ? 'Grant' : 'Revoke'} the admin role for this user?`)) return;
    
    try {
      await updateUserRole(user.id, 'admin', shouldGrant);
      await loadUsers();
      showToast(`Admin role ${action === 'grant' ? 'granted' : 'revoked'} successfully`, 'success');
    } catch (err: unknown) {
      console.error(err);
      showToast("Role change was denied. Privileged role changes require a super administrator.", 'error');
    }
  };

  const [newResource, setNewResource] = useState({
    title: '', subject: '', faculty: 'BCA', semester: '1st Semester', author_name: 'Admin', file_url: '', file_size: '2MB', resource_type: 'PDF'
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    setIsDeleting(id);
    try {
      await deleteResource(id);
      showToast("Resource archived successfully", 'success');
      refresh();
    } catch (err: any) {
      console.error(err);
      if (err?.code === '42501' || err?.message?.includes('row-level security')) {
         showToast("Permission denied: only an authorized administrator can archive resources.", 'error');
      } else {
         showToast("Failed to archive resource", 'error');
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createResource(newResource);
      setShowAddModal(false);
      showToast("Resource added successfully", 'success');
      refresh();
    } catch (err: any) {
      console.error(err);
      if (err?.code === '42501' || err?.message?.includes('row-level security')) {
         showToast("Permission denied: only an authorized administrator can import legacy resources.", 'error');
      } else {
         showToast("Failed to create resource", 'error');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-serif font-bold text-[#002147]">Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Manage library archives, users, and system settings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab('notes')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
              activeTab === 'notes' ? 'bg-[#002147] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database size={18} />
            <span className="font-medium text-sm">Review Notes</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
              activeTab === 'users' ? 'bg-[#002147] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users size={18} />
            <span className="font-medium text-sm">Manage Users</span>
          </button>

          <button 
            onClick={() => setActiveTab('subscribers')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
              activeTab === 'subscribers' ? 'bg-[#002147] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mail size={18} />
            <span className="font-medium text-sm">Newsletter</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
              activeTab === 'settings' ? 'bg-[#002147] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings size={18} />
            <span className="font-medium text-sm">System Status</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === 'notes' && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                  <FileText size={20} className="text-[#c1121f]" />
                  Uploaded Resources
                </h2>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-[#002147] text-white text-sm font-medium rounded hover:bg-[#001530] transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Import Legacy Resource
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resources.map((resource) => (
                      <tr key={resource.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{resource.title}</div>
                          <div className="text-xs text-slate-400 mt-1">{resource.author_name} • {new Date(resource.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{resource.subject}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 uppercase tracking-widest">
                            {resource.resource_type || 'PDF'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleDelete(resource.id)}
                              className="p-2 text-slate-400 hover:text-[#c1121f] hover:bg-red-50 rounded transition-colors" 
                              title="Delete Resource"
                              disabled={isDeleting === resource.id}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {resources.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No resources uploaded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                    <Users size={20} className="text-[#c49b63]" />
                    User Accounts
                  </h2>
                  <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    {users.length} Total Users
                  </div>
                </div>
                <button 
                  onClick={loadUsers}
                  disabled={loadingUsers}
                  className="p-2 text-slate-400 hover:text-[#002147] hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200"
                  title="Refresh Users"
                >
                  <Database size={16} className={loadingUsers ? 'animate-spin' : ''} />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                {loadingUsers ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[#002147] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm">Loading user directory...</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Faculty</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[#002147] font-bold text-xs">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-slate-800">{user.name}</div>
                                <div className="text-xs text-slate-400 mt-0.5">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-600">{user.faculty || 'Unspecified'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-widest ${
                              user.roles.some((role) => role === 'admin' || role === 'super_admin')
                                ? 'bg-red-50 text-red-600 border border-red-100' 
                                : 'bg-blue-50 text-[#002147] border border-blue-100'
                            }`}>
                              {user.roles.join(', ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleUpdateRole(user)}
                                className="p-2 text-slate-400 hover:text-[#c49b63] hover:bg-amber-50 rounded transition-colors" 
                                title={user.roles.includes('admin') ? 'Revoke admin role' : 'Grant admin role'}
                              >
                                <Shield size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                            No user profiles found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-bold uppercase tracking-tight mr-1">Note:</span>
                  Role changes use the audited database function. Only a super administrator can grant or revoke admin and super-admin memberships.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscribers' && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                    <Mail size={20} className="text-[#c49b63]" />
                    Newsletter Subscribers
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {/* Compose a mail for newsletter subscribers to announce new archive additions. */}


                  {subscribers.length > 0 && (
                    <button 
                      onClick={() => {
                        const bcc = subscribers.map(s => s.email).join(',');
                        const subject = encodeURIComponent("JBC ATHENAEUM | Monthly Academic Archive Update");
                        const body = encodeURIComponent(`Greetings Scholar,\n\nWe are pleased to share the latest additions to the JBC ATHENAEUM Archive for this month.\n\nNew Materials Available:\n- Verified BCA/BSW Faculty Notes\n- Recent Terminal Examination Questions\n- Student Research Theses\n\nAccess the full archive at: https://jbcathenaeum.pages.dev/\n\nStay curious, stay inspired.\n\nWarm regards,\nNirmal Sanjel\nhttps://nirmalsanjel.com.np\nBCA 4TH Semester\nJana Bhawana Campus`);
                        window.location.href = `mailto:admin@nirmalsanjel.com.np?bcc=${bcc}&subject=${subject}&body=${body}`;
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#c49b63] text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-[#b08b58] transition-colors shadow-sm"
                    >
                      <Mail size={14} />
                      Compose Bulletin
                    </button>
                  )}
                  <button 
                    onClick={loadSubscribers}
                    disabled={loadingSubscribers}
                    className="p-2 text-slate-400 hover:text-[#002147] hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200"
                  >
                    <Database size={16} className={loadingSubscribers ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {loadingSubscribers ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[#002147] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm">Loading subscribers...</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Email Address</th>
                        <th className="px-6 py-4">Subscription Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">{sub.email}</td>
                          <td className="px-6 py-4 text-slate-500">{new Date(sub.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {subscribers.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-6 py-12 text-center text-slate-500 italic">
                            No one has subscribed yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <SystemStatusPanel />
            </div>
          )}
        </div>
      </div>
      
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-[#002147] text-lg">Import Legacy Resource</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="addResourceForm" onSubmit={handleAddResource} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Title</label>
                  <input 
                    required type="text" 
                    className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                    value={newResource.title}
                    onChange={e => setNewResource({...newResource, title: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Faculty</label>
                    <select 
                      required 
                      className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                      value={newResource.faculty}
                      onChange={e => {
                        const newFaculty = e.target.value;
                        const newSemester = (newFaculty === 'BCA' || newFaculty === 'BICTE') ? '1st Semester' : '1st Year';
                        const defaultSub = subjects.find(s => s.faculty === newFaculty && s.semester === newSemester);
                        setNewResource({...newResource, faculty: newFaculty, semester: newSemester, subject: defaultSub ? defaultSub.name : ''});
                      }}
                    >
                      <option value="BCA">BCA</option>
                      <option value="BICTE">BICTE</option>
                      <option value="BSW">BSW</option>
                      <option value="BBS">BBS</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      {(newResource.faculty === 'BCA' || newResource.faculty === 'BICTE') ? 'Semester' : 'Year'}
                    </label>
                    <select 
                      required 
                      className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                      value={newResource.semester}
                      onChange={e => {
                        const newSem = e.target.value;
                        const defaultSub = subjects.find(s => s.faculty === newResource.faculty && s.semester === newSem);
                        setNewResource({...newResource, semester: newSem, subject: defaultSub ? defaultSub.name : ''});
                      }}
                    >
                      {(newResource.faculty === 'BCA' || newResource.faculty === 'BICTE') ? (
                        <>
                          <option value="1st Semester">1st Semester</option>
                          <option value="2nd Semester">2nd Semester</option>
                          <option value="3rd Semester">3rd Semester</option>
                          <option value="4th Semester">4th Semester</option>
                          <option value="5th Semester">5th Semester</option>
                          <option value="6th Semester">6th Semester</option>
                          <option value="7th Semester">7th Semester</option>
                          <option value="8th Semester">8th Semester</option>
                        </>
                      ) : (
                        <>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Subject</label>
                  <select 
                    required 
                    className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                    value={newResource.subject}
                    onChange={e => setNewResource({...newResource, subject: e.target.value})}
                  >
                    <option value="" disabled>Select a subject...</option>
                    {subjects
                      .filter(s => s.faculty === newResource.faculty && s.semester === newResource.semester)
                      .map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">File URL (Google Drive)</label>
                  <input 
                    required type="url" 
                    className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                    value={newResource.file_url}
                    onChange={e => setNewResource({...newResource, file_url: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Author Name</label>
                    <input 
                      required type="text" 
                      className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                      value={newResource.author_name}
                      onChange={e => setNewResource({...newResource, author_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">File Size</label>
                    <input 
                      required type="text" placeholder="e.g. 2.5MB"
                      className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                      value={newResource.file_size}
                      onChange={e => setNewResource({...newResource, file_size: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Resource Type</label>
                    <select 
                      required 
                      className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#002147] bg-slate-50" 
                      value={newResource.resource_type}
                      onChange={e => setNewResource({...newResource, resource_type: e.target.value})}
                    >
                      <option value="PDF">PDF</option>
                      <option value="DOCX">DOCX</option>
                      <option value="PPTX">PPTX</option>
                      <option value="LINK">LINK</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-600 font-medium text-sm hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="addResourceForm"
                className="px-4 py-2 bg-[#002147] text-white font-medium text-sm rounded hover:bg-[#001530] transition-colors"
              >
                Import Resource
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {notification && (
          <Toast 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
