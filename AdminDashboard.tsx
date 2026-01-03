import React, { useState } from 'react';
import { User, Assignment, Submission, Section, UserRole } from '../types.ts';
import StatCard from '../components/StatCard.tsx';
import { analyzeResearchData } from '../geminiService.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AdminDashboardProps {
  users: User[];
  assignments: Assignment[];
  submissions: Submission[];
  onAddUser: (user: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, assignments, submissions, onAddUser, onDeleteUser, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users'>('stats');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.STUDENT);
  const [newUserSection, setNewUserSection] = useState<Section>(Section.EINSTEIN_G11);
  const [newUserSubject, setNewUserSubject] = useState('');

  const getStats = (section: Section) => {
    const sectionAssignments = assignments.filter(a => a.section === section);
    const sectionSubmissions = submissions.filter(s => {
      const ass = assignments.find(a => a.id === s.assignmentId);
      return ass?.section === section;
    });

    const totalExpected = sectionAssignments.length * users.filter(u => u.role === UserRole.STUDENT && u.section === section).length;
    const onTime = sectionSubmissions.filter(s => s.status === 'ON_TIME').length;
    const late = sectionSubmissions.filter(s => s.status === 'LATE').length;
    const rate = totalExpected > 0 ? Math.round(((onTime + late) / totalExpected) * 100) : 0;
    
    return { onTime, late, rate, total: onTime + late };
  };

  const einsteinStats = getStats(Section.EINSTEIN_G11);
  const galileiStats = getStats(Section.GALILEI_G12);

  const chartData = [
    { name: 'Einstein (On-Time)', value: einsteinStats.onTime, fill: '#10b981' },
    { name: 'Einstein (Late)', value: einsteinStats.late, fill: '#6ee7b7' },
    { name: 'Galilei (On-Time)', value: galileiStats.onTime, fill: '#059669' },
    { name: 'Galilei (Late)', value: galileiStats.late, fill: '#34d399' },
  ];

  const fetchAiInsight = async () => {
    setLoadingAi(true);
    const insight = await analyzeResearchData(assignments, submissions);
    setAiInsight(insight || '');
    setLoadingAi(false);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserPassword) return;
    onAddUser({
      name: newUserName,
      username: newUserName.toLowerCase().replace(/\s+/g, '_'),
      password: newUserPassword,
      role: newUserRole,
      section: newUserRole === UserRole.ADMIN ? Section.NONE : newUserSection,
      subject: newUserRole === UserRole.TEACHER ? newUserSubject : undefined
    });
    setNewUserName('');
    setNewUserPassword('');
    setNewUserSubject('');
  };

  const UserTable = ({ title, sectionUsers }: { title: string, sectionUsers: User[] }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <span className="text-xs font-bold text-gray-400">{sectionUsers.length} Users</span>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-50">
              <th className="px-6 py-4">Participant</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sectionUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 text-sm">{u.name}</div>
                  <div className="text-[10px] font-mono text-gray-400">PWD: {u.password}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">{u.role}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => setResettingUser(u)} className="p-2 text-gray-400 hover:text-emerald-600"><i className="fas fa-key"></i></button>
                  <button onClick={() => setConfirmDeleteUser(u)} className="p-2 text-gray-400 hover:text-rose-600"><i className="fas fa-trash-alt"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mustang Stride Admin</h2>
          <p className="text-gray-500 text-sm font-medium">Research Monitoring</p>
        </div>
        <div className="flex bg-gray-200 p-1.5 rounded-2xl">
          <button onClick={() => setActiveTab('stats')} className={`px-6 py-2.5 rounded-xl text-sm font-bold ${activeTab === 'stats' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}>Analytics</button>
          <button onClick={() => setActiveTab('users')} className={`px-6 py-2.5 rounded-xl text-sm font-bold ${activeTab === 'users' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}>Participants</button>
        </div>
      </div>

      {activeTab === 'stats' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Einstein ON-TIME" value={`${einsteinStats.rate}%`} icon="fa-atom" color="bg-emerald-500" />
            <StatCard title="Einstein Late" value={einsteinStats.late} icon="fa-clock" color="bg-emerald-400" />
            <StatCard title="Galilei ON-TIME" value={`${galileiStats.rate}%`} icon="fa-telescope" color="bg-emerald-700" />
            <StatCard title="Galilei Late" value={galileiStats.late} icon="fa-hourglass-half" color="bg-emerald-600" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} fontWeight="700" />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-emerald-950 text-white p-8 rounded-3xl flex flex-col justify-between">
              <h3 className="text-lg font-bold">Stride Analyst AI</h3>
              <p className="text-emerald-100 text-sm">{aiInsight || "Ready to audit performance patterns."}</p>
              <button onClick={fetchAiInsight} disabled={loadingAi} className="w-full py-4 bg-emerald-500 text-emerald-950 rounded-2xl font-black">
                {loadingAi ? 'Decoding...' : 'Run Performance Audit'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Register Participant</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <input type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-2xl" placeholder="Full Name" />
                <input type="text" required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-2xl" placeholder="Initial Password" />
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)} className="w-full px-4 py-3 bg-gray-50 border rounded-2xl">
                  <option value={UserRole.STUDENT}>Student</option>
                  <option value={UserRole.TEACHER}>Teacher</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
                <select disabled={newUserRole === UserRole.ADMIN} value={newUserSection} onChange={e => setNewUserSection(e.target.value as Section)} className="w-full px-4 py-3 bg-gray-50 border rounded-2xl">
                  <option value={Section.EINSTEIN_G11}>Einstein (G11)</option>
                  <option value={Section.GALILEI_G12}>Galilei (G12)</option>
                </select>
                <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black">Confirm Enrollment</button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-8 space-y-8">
             <UserTable title="Einstein Field (Grade 11)" sectionUsers={users.filter(u => u.section === Section.EINSTEIN_G11)} />
             <UserTable title="Galilei Field (Grade 12)" sectionUsers={users.filter(u => u.section === Section.GALILEI_G12)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;