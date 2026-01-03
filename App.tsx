import React, { useState, useEffect } from 'react';
import { User, UserRole, Assignment, Submission, Section } from './types.ts';
import { INITIAL_USERS, INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS } from './mockData.ts';
import Layout from './Layout.tsx';
import AdminDashboard from './views/AdminDashboard.tsx';
import TeacherDashboard from './views/TeacherDashboard.tsx';
import StudentDashboard from './views/StudentDashboard.tsx';
import { loadState, saveState } from './db.ts';

const App: React.FC = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Login Form States
  const [fullNameInput, setFullNameInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loginError, setLoginError] = useState(false);

  // Hydrate state from IndexedDB on boot
  useEffect(() => {
    const hydrate = async () => {
      try {
        const [savedUser, savedUsers, savedAssignments, savedSubmissions] = await Promise.all([
          loadState('research_user'),
          loadState('research_users'),
          loadState('research_assignments'),
          loadState('research_submissions')
        ]);

        if (savedUser) setUser(savedUser);
        if (savedUsers) setUsers(savedUsers);
        if (savedAssignments) setAssignments(savedAssignments);
        if (savedSubmissions) setSubmissions(savedSubmissions);
      } catch (e) {
        console.error("Hydration failed, using defaults", e);
      } finally {
        setIsHydrated(true);
      }
    };
    hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    saveState('research_users', users);
    saveState('research_assignments', assignments);
    saveState('research_submissions', submissions);
    if (user) {
      saveState('research_user', user);
    } else {
      saveState('research_user', null);
    }
  }, [users, assignments, submissions, user, isHydrated]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    });

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
    
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    if (ios && !standalone) {
      setShowInstallBanner(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert('To install Mustang Stride on iOS:\n1. Tap the "Share" button at the bottom of Safari.\n2. Scroll down and tap "Add to Home Screen".');
      return;
    }
    
    if (!deferredPrompt) {
      alert('Mustang Stride is ready to use!');
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setIsStandalone(true);
    }
    setDeferredPrompt(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.name.toLowerCase() === fullNameInput.trim().toLowerCase());
    
    if (foundUser && foundUser.password === password) {
      setUser(foundUser);
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 3000);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setFullNameInput('');
    setPassword('');
    setShowPassword(false);
    setLoginError(false);
  };

  const handleAddAssignment = (data: Partial<Assignment>) => {
    const newAssignment: Assignment = {
      id: `a-${Date.now()}`,
      title: data.title || '',
      description: data.description || '',
      dueDate: data.dueDate || '',
      section: data.section || Section.NONE,
      teacherId: data.teacherId || '',
      teacherName: data.teacherName || '',
      subject: data.subject || '',
      attachments: data.attachments || [],
      createdAt: new Date().toISOString()
    };
    setAssignments([newAssignment, ...assignments]);
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
    setSubmissions(submissions.filter(s => s.assignmentId !== id));
  };

  const handleUpdateAssignment = (id: string, updates: Partial<Assignment>) => {
    setAssignments(assignments.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleAddSubmission = (data: Partial<Submission>) => {
    const newSubmission: Submission = {
      id: `s-${Date.now()}`,
      assignmentId: data.assignmentId || '',
      studentId: data.studentId || '',
      studentName: data.studentName || '',
      submittedAt: data.submittedAt || new Date().toISOString(),
      files: data.files || [],
      textResponse: data.textResponse,
      status: data.status || 'ON_TIME'
    };
    setSubmissions([newSubmission, ...submissions]);
  };

  const handleAddUser = (data: Partial<User>) => {
    const newUser: User = {
      id: `u-${Date.now()}`,
      username: data.username || '',
      password: data.password || '',
      name: data.name || '',
      role: data.role || UserRole.STUDENT,
      section: data.section || Section.NONE,
      subject: data.subject
    };
    setUsers([...users, newUser]);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const InstallBanner = () => (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-emerald-950 text-white p-5 rounded-[2.5rem] shadow-2xl border border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center">
            <i className="fas fa-horse-head text-xl"></i>
          </div>
          <div>
            <h4 className="text-sm font-black">Mustang Stride</h4>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Add to home screen</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isIOS ? (
            <div className="text-[10px] bg-emerald-900/50 px-3 py-2 rounded-xl border border-emerald-800 italic">
               Tap <i className="fa-solid fa-arrow-up-from-bracket mx-1"></i> then "Add to Home Screen"
            </div>
          ) : (
            <button onClick={handleInstallClick} className="bg-white text-emerald-950 px-5 py-2.5 rounded-2xl text-xs font-black">Install</button>
          )}
          <button onClick={() => setShowInstallBanner(false)} className="w-10 h-10 rounded-2xl text-emerald-400">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  );

  if (!isHydrated) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {showInstallBanner && <InstallBanner />}
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="inline-block bg-emerald-600 text-white p-4 rounded-3xl mb-4 shadow-xl shadow-emerald-200">
              <i className="fas fa-horse-head text-2xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mustang Stride</h1>
            <p className="text-gray-500 font-medium">Assignment Efficiency Study Platform</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            {isResetMode ? (
              <div className="text-center space-y-6">
                <h2 className="text-xl font-bold">Reset Credentials</h2>
                <p className="text-sm text-gray-500">Contact researchers to reset your account.</p>
                <button onClick={() => setIsResetMode(false)} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">Back</button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input type="text" required value={fullNameInput} onChange={e => setFullNameInput(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all pr-12" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                {loginError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-xs font-bold text-center animate-in fade-in slide-in-from-top-1">
                    sorry, wrong credentials
                  </div>
                )}
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.98] transition-all">Sign In</button>
                <div className="text-center">
                  <button type="button" onClick={() => setIsResetMode(true)} className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Need Help?</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      {showInstallBanner && <InstallBanner />}
      {user.role === UserRole.ADMIN && (
        <AdminDashboard 
          users={users} assignments={assignments} submissions={submissions}
          onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} onUpdateUser={handleUpdateUser}
        />
      )}
      {user.role === UserRole.TEACHER && (
        <TeacherDashboard 
          user={user} assignments={assignments} submissions={submissions}
          onAddAssignment={handleAddAssignment} onDeleteAssignment={handleDeleteAssignment} onUpdateAssignment={handleUpdateAssignment}
        />
      )}
      {user.role === UserRole.STUDENT && (
        <StudentDashboard user={user} assignments={assignments} submissions={submissions} onSubmit={handleAddSubmission} />
      )}
    </Layout>
  );
};

export default App;
