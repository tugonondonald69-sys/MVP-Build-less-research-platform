
import React, { useState } from 'react';
import { User, UserRole, Assignment, Submission, Section } from './types';

interface TeacherDashboardProps {
  user: User;
  assignments: Assignment[];
  submissions: Submission[];
  onAddAssignment: (assignment: Partial<Assignment>) => void;
  onDeleteAssignment: (id: string) => void;
  onUpdateAssignment: (id: string, updates: Partial<Assignment>) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  user, 
  assignments, 
  submissions, 
  onAddAssignment,
  onDeleteAssignment,
  onUpdateAssignment
}) => {
  const [showModal, setShowModal] = useState(false);
  const [viewingSubmissions, setViewingSubmissions] = useState<Assignment | null>(null);
  const [extendingDeadline, setExtendingDeadline] = useState<Assignment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Assignment | null>(null);
  const [previewFile, setPreviewFile] = useState<{ file: SubmissionFile; studentName: string } | null>(null);
  
  // Create Assignment Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachments, setAttachments] = useState<SubmissionFile[]>([]);
  const [isReadingFile, setIsReadingFile] = useState(false);

  // Extension Date State
  const [newDueDate, setNewDueDate] = useState('');

  const myAssignments = assignments.filter(a => a.teacherId === user.id);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsReadingFile(true);
    // Fix: Explicitly cast to File[] to avoid 'unknown' type issues in the map callback
    const files = Array.from(fileList) as File[];
    
    const filePromises = files.map(file => {
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
      setAttachments(prev => [...prev, ...processedFiles]);
    } catch (err) {
      alert("Failed to read some files. Please try again.");
    } finally {
      setIsReadingFile(false);
      e.target.value = ''; // Reset input
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;
    
    onAddAssignment({
      title,
      description,
      dueDate,
      section: user.section,
      teacherId: user.id,
      teacherName: user.name,
      subject: user.subject || 'General',
      attachments: attachments
    });

    setTitle('');
    setDescription('');
    setDueDate('');
    setAttachments([]);
    setShowModal(false);
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      onDeleteAssignment(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const handleExtendDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (extendingDeadline && newDueDate) {
      onUpdateAssignment(extendingDeadline.id, { dueDate: newDueDate });
      setExtendingDeadline(null);
      setNewDueDate('');
      alert('Deadline successfully extended!');
    }
  };

  const getSubmissionsForAssignment = (assignmentId: string) => {
    return submissions.filter(s => s.assignmentId === assignmentId);
  };

  const handleDownload = (file: SubmissionFile) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Assignments</h2>
          <p className="text-gray-500 text-sm">Managing tasks for {user.section}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center space-x-2"
        >
          <i className="fas fa-plus"></i>
          <span>New Assignment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myAssignments.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
            No assignments created yet. Start by clicking the button above.
          </div>
        ) : (
          myAssignments.map(a => {
            const subs = getSubmissionsForAssignment(a.id);
            const isLate = new Date() > new Date(a.dueDate);
            return (
              <div key={a.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full relative">
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button 
                    onClick={() => {
                      setExtendingDeadline(a);
                      setNewDueDate(a.dueDate);
                    }}
                    title="Extend Deadline"
                    className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 hover:bg-emerald-100 hover:text-emerald-700 flex items-center justify-center transition-colors border border-gray-100"
                  >
                    <i className="fas fa-clock"></i>
                  </button>
                  <button 
                    onClick={() => setConfirmDelete(a)}
                    title="Cancel Assignment"
                    className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 hover:bg-rose-100 hover:text-rose-700 flex items-center justify-center transition-colors border border-gray-100"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>

                <div className="flex flex-col space-y-1 mb-4">
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md w-fit">{a.subject}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-tight ${isLate ? 'text-rose-500' : 'text-gray-400'}`}>
                    Due: {new Date(a.dueDate).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 pr-16">{a.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-grow">{a.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-file-alt text-gray-400"></i>
                    <span className="text-sm font-semibold text-gray-700">{subs.length} Submissions</span>
                  </div>
                  <button 
                    onClick={() => setViewingSubmissions(a)}
                    className="text-emerald-600 text-sm font-bold hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Create Assignment</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  placeholder="e.g., Lab Report #1" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Brief Description</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none" 
                  placeholder="What should the students do?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Due Date</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Attachments</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      id="teacher-attachment"
                      multiple
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                    <label 
                      htmlFor="teacher-attachment"
                      className={`flex items-center space-x-2 w-full px-4 py-2.5 rounded-xl border transition-all cursor-pointer bg-gray-50 border-gray-200 text-gray-500 hover:border-emerald-500`}
                    >
                      <i className={`fas ${isReadingFile ? 'fa-spinner fa-spin' : 'fa-paperclip'}`}></i>
                      <span className="text-xs font-bold truncate">
                        {isReadingFile ? 'Reading...' : 'Attach Modules'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Staged Modules</p>
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                      <div className="flex items-center space-x-2 truncate">
                        <i className="fas fa-file-invoice text-emerald-600 text-xs"></i>
                        <span className="text-xs font-bold text-emerald-800 truncate">{file.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeAttachment(idx)}
                        className="text-emerald-400 hover:text-rose-500 transition-colors"
                      >
                        <i className="fas fa-times-circle"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isReadingFile}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                Publish Assignment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-exclamation-triangle text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Assignment?</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Are you sure you want to cancel <span className="font-bold text-gray-900">"{confirmDelete.title}"</span>? 
                This will permanently delete the task and all student files.
              </p>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={handleConfirmDelete}
                  className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-colors"
                >
                  Yes, Cancel Assignment
                </button>
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="w-full py-3.5 bg-gray-50 text-gray-500 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Keep it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extend Deadline Modal */}
      {extendingDeadline && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Extend Deadline</h3>
              <button onClick={() => setExtendingDeadline(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleExtendDeadline} className="p-8 space-y-6">
              <div className="p-4 bg-emerald-50 rounded-xl">
                <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Assignment</p>
                <p className="text-sm font-semibold text-gray-900">{extendingDeadline.title}</p>
                <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                  <i className="fas fa-history"></i>
                  <span>Current: {new Date(extendingDeadline.dueDate).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">New Due Date & Time</label>
                <input 
                  type="datetime-local" 
                  required
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                />
              </div>
              <div className="flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setExtendingDeadline(null)}
                  className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                >
                  Update Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submissions Modal */}
      {viewingSubmissions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewingSubmissions.title}</h3>
                <p className="text-sm text-gray-500">Submission History for {viewingSubmissions.section}</p>
              </div>
              <button 
                onClick={() => setViewingSubmissions(null)} 
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              {getSubmissionsForAssignment(viewingSubmissions.id).length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                   <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                     <i className="fas fa-inbox text-gray-400 text-2xl"></i>
                   </div>
                   <h4 className="text-lg font-bold text-gray-900">No Submissions Yet</h4>
                   <p className="text-gray-500">Students haven't uploaded any files for this task.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Student</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date Submitted</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Files</th>
                        <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {getSubmissionsForAssignment(viewingSubmissions.id).map(sub => (
                        <tr key={sub.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-5">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                {sub.studentName.charAt(0)}
                              </div>
                              <span className="font-bold text-gray-900">{sub.studentName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-5 text-sm text-gray-600">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-5">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              sub.status === 'ON_TIME' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {sub.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex flex-wrap gap-2">
                              {sub.files.map((file, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => setPreviewFile({ file, studentName: sub.studentName })}
                                  className="inline-flex items-center space-x-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 hover:scale-105 transition-all"
                                >
                                  <i className="fas fa-file-alt text-[10px]"></i>
                                  <span className="truncate max-w-[120px] font-medium">{file.name}</span>
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-5 max-w-xs">
                             <p className="text-xs text-gray-500 line-clamp-2 italic">{sub.textResponse || 'No text response'}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setViewingSubmissions(null)}
                className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                  <i className="fas fa-file-invoice"></i>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{previewFile.file.name}</h4>
                  <p className="text-xs text-gray-500">Submitted by {previewFile.studentName}</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewFile(null)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-8">
              <div className="bg-gray-900 rounded-2xl p-6 font-mono text-sm text-emerald-400 min-h-[200px] shadow-inner">
                <div className="flex items-center space-x-2 mb-4 text-gray-500 text-xs border-b border-gray-800 pb-2">
                   <i className="fas fa-terminal"></i>
                   <span>MOCK_FILE_VIEWER_VERSION_1.0</span>
                </div>
                <p className="mb-2">// Secure research file record</p>
                <p className="mb-2">File Name: {previewFile.file.name}</p>
                <p className="mb-2">Type: {previewFile.file.type}</p>
                <p className="mb-2">Owner: {previewFile.studentName}</p>
                <p className="mb-2">Status: Verified Integrity</p>
                <p className="mt-6 opacity-60">The student has successfully uploaded this academic artifact.</p>
                <p className="mt-2 opacity-60 text-emerald-200/50 text-[10px]">Data Stream: {previewFile.file.data.substring(0, 50)}...</p>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="text-xs text-gray-400 italic">
                  * All downloads are tracked for research purposes.
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setPreviewFile(null)}
                    className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleDownload(previewFile.file)}
                    className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center space-x-2"
                  >
                    <i className="fas fa-download"></i>
                    <span>Download Actual File</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
