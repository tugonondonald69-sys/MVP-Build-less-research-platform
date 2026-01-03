
import React, { useState } from 'react';
import { User, Assignment, Submission, SubmissionFile } from '../types';

interface StudentDashboardProps {
  user: User;
  assignments: Assignment[];
  submissions: Submission[];
  onSubmit: (submission: Partial<Submission>) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, assignments, submissions, onSubmit }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<{ assignment: Assignment, submission: Submission } | null>(null);
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [textResponse, setTextResponse] = useState('');

  const myAssignments = assignments.filter(a => a.section === user.section);

  const getSubmission = (assignmentId: string) => {
    return submissions.find(s => s.assignmentId === assignmentId && s.studentId === user.id);
  };

  const pendingAssignments = myAssignments.filter(a => !getSubmission(a.id));
  const completedAssignments = myAssignments.filter(a => !!getSubmission(a.id));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setIsReadingFiles(true);
      const fileList = Array.from(e.target.files) as File[];
      
      const filePromises = fileList.map(file => {
        return new Promise<SubmissionFile>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              type: file.type,
              data: reader.result as string
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      try {
        const processedFiles = await Promise.all(filePromises);
        setFiles(prev => [...prev, ...processedFiles]);
      } catch (err) {
        console.error("Error reading files:", err);
        alert("Failed to read one or more files. Please try again.");
      } finally {
        setIsReadingFiles(false);
        e.target.value = ''; // Reset input
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadFromData = (file: SubmissionFile) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (files.length === 0) {
      alert('Error: You must attach at least one file to submit this assignment.');
      return;
    }

    const isLate = new Date() > new Date(selectedAssignment.dueDate);

    onSubmit({
      assignmentId: selectedAssignment.id,
      studentId: user.id,
      studentName: user.name,
      files: files,
      textResponse,
      submittedAt: new Date().toISOString(),
      status: isLate ? 'LATE' : 'ON_TIME'
    });

    setFiles([]);
    setTextResponse('');
    setSelectedAssignment(null);
    alert('Assignment submitted successfully!');
    setActiveTab('submitted');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Your Academic Stride</h2>
          <p className="text-gray-500 text-sm font-medium mt-1">Section: <span className="text-emerald-600 font-bold">{user.section}</span></p>
        </div>
        
        <div className="flex bg-gray-200 p-1.5 rounded-2xl w-fit shadow-inner">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'pending' ? 'bg-white shadow-lg text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <i className="fas fa-list-check"></i>
            <span>Active Tasks</span>
            {pendingAssignments.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'pending' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-300 text-gray-600'}`}>
                {pendingAssignments.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('submitted')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${activeTab === 'submitted' ? 'bg-white shadow-lg text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <i className="fas fa-circle-check"></i>
            <span>Submitted</span>
            {completedAssignments.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-300 text-gray-600'}`}>
                {completedAssignments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4 min-h-[400px]">
        {activeTab === 'pending' ? (
          pendingAssignments.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[2rem] border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-mug-hot text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Clear Skies!</h3>
              <p className="text-gray-400 max-w-xs mx-auto">You've completed all your active tasks. Great job keeping up with the research schedule.</p>
            </div>
          ) : (
            pendingAssignments.map(a => {
              const isOverdue = new Date() > new Date(a.dueDate);
              return (
                <div 
                  key={a.id} 
                  className={`bg-white p-8 rounded-[2rem] border transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 ${
                    isOverdue ? 'border-rose-100 bg-rose-50/10' : 'border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-black tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full uppercase">{a.subject}</span>
                      {isOverdue && <span className="text-[10px] font-black tracking-widest text-rose-700 bg-rose-100 px-3 py-1.5 rounded-full uppercase">Late</span>}
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">Deadline</span>
                       <span className={`text-sm font-bold ${isOverdue ? 'text-rose-600' : 'text-gray-900'}`}>{new Date(a.dueDate).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-gray-900 mb-3">{a.title}</h3>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed max-w-2xl">{a.description}</p>
                  
                  <div className="flex flex-col pt-6 border-t border-gray-50 gap-6">
                    <div className="flex flex-wrap gap-3">
                      {a.attachments && a.attachments.length > 0 ? (
                        a.attachments.map((file, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handleDownloadFromData(file)}
                            className="flex items-center space-x-2 text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200 shadow-sm hover:scale-105 transition-all group"
                          >
                            <i className="fas fa-file-arrow-down group-hover:animate-bounce"></i>
                            <span>{file.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 px-3 py-2">
                           <i className="fas fa-info-circle"></i>
                           <span>No attachments for this task</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center space-x-2">
                         <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                           {a.teacherName.charAt(0)}
                         </div>
                         <span className="text-xs font-bold text-gray-600">Assigned by {a.teacherName}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedAssignment(a)}
                        className="w-full sm:w-auto bg-emerald-600 text-white px-10 py-3.5 rounded-2xl text-sm font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                      >
                        Start Submission
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          completedAssignments.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[2rem] border border-gray-100 animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-folder-open text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No History</h3>
              <p className="text-gray-400 max-w-xs mx-auto">Your completed tasks will appear here once you submit them.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {completedAssignments.map(a => {
                const submission = getSubmission(a.id)!;
                return (
                  <div key={a.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-all flex flex-col group">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase">{a.subject}</span>
                      <i className="fas fa-check-circle text-emerald-500"></i>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors">{a.title}</h3>
                    <p className="text-xs text-gray-400 mb-6 flex-1">Submitted {new Date(submission.submittedAt).toLocaleDateString()}</p>
                    
                    <button 
                      onClick={() => setViewingSubmission({ assignment: a, submission })}
                      className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-2xl text-xs font-black hover:bg-emerald-100 transition-colors"
                    >
                      Review My Entry
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] flex flex-col">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Final Submission</h3>
                <p className="text-sm text-emerald-600 font-bold uppercase tracking-widest mt-1">{selectedAssignment.title}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedAssignment(null);
                  setFiles([]);
                  setTextResponse('');
                }} 
                className="w-12 h-12 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 relative overflow-hidden">
                    <h4 className="text-[10px] font-black text-emerald-700 uppercase mb-3 tracking-[0.2em]">Research Integrity</h4>
                    <p className="text-sm text-emerald-800 leading-relaxed italic relative z-10">
                      "Strive for excellence, not perfection." Remember that your contribution to this platform helps us understand academic efficiency. Please ensure all required files are present.
                    </p>
                    <i className="fas fa-quote-right absolute -bottom-4 -right-2 text-emerald-100 text-6xl opacity-40"></i>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Supporting Text (Optional)</label>
                    <textarea 
                      value={textResponse}
                      onChange={e => setTextResponse(e.target.value)}
                      rows={8}
                      className="w-full px-6 py-5 bg-gray-50 border border-gray-200 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm resize-none transition-all shadow-inner"
                      placeholder="Explain your approach or list any challenges encountered..."
                    />
                  </div>
                </div>

                <div className="space-y-8 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Upload Artifacts <span className="text-rose-500 font-black">*</span></label>
                    <div className={`border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all flex flex-col items-center justify-center min-h-[200px] ${files.length > 0 ? 'border-emerald-400 bg-emerald-50/50' : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50'}`}>
                      <input 
                        type="file" 
                        multiple 
                        onChange={handleFileChange}
                        className="hidden" 
                        id="file-upload-landscape"
                      />
                      <label htmlFor="file-upload-landscape" className="cursor-pointer group w-full">
                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transition-all group-hover:scale-110 group-hover:rotate-3 ${files.length > 0 ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200' : 'bg-gray-100 text-gray-400 shadow-sm'}`}>
                          <i className={`fas ${isReadingFiles ? 'fa-spinner fa-spin' : (files.length > 0 ? 'fa-check' : 'fa-cloud-arrow-up')} text-3xl`}></i>
                        </div>
                        <p className="text-lg font-black text-gray-900">
                          {isReadingFiles ? 'Reading Files...' : (files.length > 0 ? `${files.length} Artifacts Staged` : 'Click to Select Documents')}
                        </p>
                        <p className="text-sm text-gray-400 mt-2 font-medium">Research accepted formats: PDF, DOCX, ZIP</p>
                      </label>
                    </div>

                    {files.length > 0 && (
                      <div className="mt-6 max-h-40 overflow-y-auto pr-2 space-y-2">
                        {files.map((f, i) => (
                          <div key={i} className="text-xs text-emerald-700 font-bold truncate bg-white px-5 py-3.5 rounded-2xl flex justify-between items-center border border-emerald-100 shadow-sm animate-in slide-in-from-left-4 fade-in duration-300">
                            <div className="flex items-center space-x-3">
                              <i className="fas fa-file-invoice text-emerald-500"></i>
                              <span className="truncate max-w-[200px]">{f.name}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeFile(i)}
                              className="text-gray-400 hover:text-rose-500 transition-colors"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-8 border-t border-gray-100 space-y-4">
                    <div className="flex gap-4">
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedAssignment(null);
                          setFiles([]);
                          setTextResponse('');
                        }}
                        className="flex-1 py-4 text-gray-500 text-sm font-black hover:bg-gray-50 rounded-2xl transition-colors border border-gray-200"
                      >
                        Abandon
                      </button>
                      <button 
                        type="submit"
                        disabled={files.length === 0 || isReadingFiles}
                        className={`flex-[2] py-4 text-white text-sm font-black rounded-2xl transition-all shadow-xl ${
                          files.length > 0 && !isReadingFiles
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 active:scale-[0.98]' 
                          : 'bg-gray-300 cursor-not-allowed opacity-70 shadow-none'
                        }`}
                      >
                        {isReadingFiles ? 'Processing...' : 'Lock In Submission'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View My Submission Modal */}
      {viewingSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col border border-emerald-900/10">
            <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-emerald-950 text-white">
              <div>
                <h3 className="text-2xl font-black">Submission Review</h3>
                <p className="text-sm text-emerald-400 font-bold uppercase tracking-widest mt-1">{viewingSubmission.assignment.title}</p>
              </div>
              <button 
                onClick={() => setViewingSubmission(null)} 
                className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors border border-white/10"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                <div className="md:col-span-8 space-y-10">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-500 uppercase block font-black tracking-[0.2em] mb-2">Stride Status</span>
                      <span className={`text-xl font-black ${viewingSubmission.submission.status === 'ON_TIME' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {viewingSubmission.submission.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <span className="text-[10px] text-gray-400 uppercase block font-black tracking-[0.2em] mb-2">Timestamp</span>
                      <span className="text-xl font-black text-gray-700">
                        {new Date(viewingSubmission.submission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                      <i className="fas fa-quote-left mr-3 text-emerald-400"></i>
                      Narrative Response
                    </h4>
                    <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 min-h-[220px] shadow-inner text-gray-700 leading-relaxed text-sm">
                      {viewingSubmission.submission.textResponse || <span className="text-gray-400 italic font-medium">No narrative analysis provided for this artifact.</span>}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 space-y-8">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Secured Artifacts</h4>
                  <div className="space-y-4">
                    {viewingSubmission.submission.files.map((file, idx) => (
                      <div key={idx} className="group p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-200 transition-all">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                            <i className="fas fa-file-shield text-xl"></i>
                          </div>
                          <div className="flex-1 truncate">
                             <span className="text-xs font-black text-gray-900 truncate block">{file.name}</span>
                             <span className="text-[9px] text-gray-400 font-bold uppercase">Locked Artifact</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDownloadFromData(file)}
                          className="w-full flex items-center justify-center space-x-2 text-xs font-black text-white bg-emerald-600 px-4 py-3.5 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/10"
                        >
                          <i className="fas fa-cloud-arrow-down"></i>
                          <span>Download Copy</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-10 py-8 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setViewingSubmission(null)}
                className="px-12 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-700 hover:bg-gray-100 transition-all shadow-sm active:scale-95"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
