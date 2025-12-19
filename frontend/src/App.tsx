import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Upload, Search, FileText, User, LogOut, Plus, Lock, KeyRound, 
  Eye, Code, ChevronRight, X, Briefcase, GraduationCap, 
  Calendar, Mail, Phone, AlertCircle
} from 'lucide-react';

// Safe environment variable access
const API_URL = 'http://localhost:8000/api';

interface Candidate {
  id: string;
  name?: string;
  skills?: string[];
  email?: string;
  phone?: string;
  experience?: any[];
  education?: any[];
  raw_text?: string;
}

interface MatchResult {
  candidate_id: string;
  name: string;
  score: number;
  matched_skills: string[];
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token') || 'demo-token');
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{message: string, type: 'info' | 'success' | 'error'}>({message: '', type: 'info'});
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [previewData, setPreviewData] = useState<Candidate | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInitialData();
    }
  }, [token]);

  const fetchInitialData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        axios.get(`${API_URL}/candidates`),
        axios.get(`${API_URL}/skills`)
      ]);
      setCandidates(cRes.data);
      setMySkills(sRes.data);
    } catch (err) { console.error(err); }
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadStatus({message: 'Analyzing Resume...', type: 'info'});
    setPreviewData(null);
    
    try {
      const res = await axios.post(`${API_URL}/upload-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus({message: 'Parsing Complete!', type: 'success'});
      setPreviewData(res.data);
      fetchInitialData();
      setFile(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to upload resume';
      setUploadStatus({message: errorMsg, type: 'error'});
    }
  };

  const handleMatch = async () => {
    setIsMatching(true);
    try {
      const res = await axios.post(`${API_URL}/job-match`, {
        title: jobTitle,
        description: jobDesc,
        top_k: 5
      });
      setMatches(res.data.matches);
    } catch (err) { console.error(err); }
    finally { setIsMatching(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ResumeAI</h1>
              <p className="text-gray-500 font-medium text-sm">Intelligent Parser & Matcher</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Recruiter Dashboard</p>
            </div>
            <button onClick={() => setToken(null)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
              <LogOut size={22} />
            </button>
          </div>
        </header>

        {/* Custom Skills Bar */}
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-blue-800 font-semibold min-w-[150px]">
            <KeyRound size={20} className="text-blue-500"/> Skill Dictionary
          </div>
          <div className="flex-1 flex flex-wrap gap-2">
            {mySkills.map(s => (
              <span key={s} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {s}
              </span>
            ))}
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Add skill..." 
              className="p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full"
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
            />
            <button onClick={() => {setMySkills([...mySkills, newSkill]); setNewSkill('')}} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
              <Plus size={18}/>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Upload & Candidates */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                <Upload size={22} className="text-blue-600" /> Resume Upload
              </h2>
              
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors group cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".pdf,.docx" 
                  onChange={(e) => e.target.files && setFile(e.target.files[0])} 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <FileText size={32} className="text-blue-500" />
                </div>
                <p className="text-sm font-bold text-gray-700">{file ? file.name : 'Select PDF or DOCX'}</p>
                <p className="text-xs text-gray-400 mt-1">Maximum file size: 10MB</p>
              </div>

              <button 
                onClick={handleUpload} 
                disabled={!file} 
                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              >
                <Upload size={18}/> Parse with NLP
              </button>

              {uploadStatus.message && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-3 text-sm font-medium ${
                  uploadStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 
                  uploadStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 
                  'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {uploadStatus.type === 'error' ? <AlertCircle size={18}/> : <div className="w-2 h-2 rounded-full bg-current animate-pulse"/>}
                  {uploadStatus.message}
                </div>
              )}

              {/* Parsing Preview Section */}
              {previewData && (
                <div className="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-5 animate-in fade-in slide-in-from-top-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Eye size={18} className="text-blue-500"/> Extract Preview
                    </h3>
                    <button onClick={() => setShowRawJson(!showRawJson)} className="text-xs text-slate-500 hover:text-blue-600 font-bold">
                      {showRawJson ? 'Hide JSON' : 'Show JSON'}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-2 rounded border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Name</span>
                        <span className="font-bold text-slate-800 truncate">{previewData.name || 'Unknown'}</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
                        <span className="font-bold text-slate-800 truncate">{previewData.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Extracted Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {previewData.skills?.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {showRawJson && (
                    <div className="mt-4">
                      <pre className="bg-slate-900 text-blue-400 p-4 rounded-lg text-xs overflow-auto max-h-48 font-mono border border-slate-800">
                        {JSON.stringify(previewData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900"><User size={22} className="text-indigo-600" /> Talent Pool</h2>
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {candidates.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-xl">
                    <User size={40} className="mx-auto text-gray-200 mb-2"/>
                    <p className="text-gray-400 text-sm">No profiles indexed.</p>
                  </div>
                ) : null}
                {candidates.map(c => (
                  <div key={c.id} className="p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition group cursor-pointer shadow-sm" onClick={() => setSelectedCandidate(c)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">{c.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 font-medium">{c.email || 'No contact info'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-600 uppercase tracking-wider">{c.skills?.length || 0} Skills</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Job Matching */}
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900"><Search size={22} className="text-emerald-600" /> AI Matcher</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Target Job Title</label>
                  <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Backend Engineer" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-medium" />
                </div>
                <div>
                   <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Role Description & Requirements</label>
                   <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={5} placeholder="Paste requirements here..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all font-medium" />
                </div>
                <button onClick={handleMatch} disabled={!jobTitle || !jobDesc || isMatching} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-lg shadow-emerald-100">
                  {isMatching ? 'Calculating Vectors...' : 'Run Matching Engine'}
                </button>
              </div>
              
              <div className="flex-1 space-y-4">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ranked Candidates</h3>
                 {matches.length === 0 && !isMatching ? (
                    <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                      <Search size={32} className="mx-auto mb-3 opacity-20"/>
                      <p className="text-sm font-medium">Input job details to find matches.</p>
                    </div>
                  ) : null}
                {matches.map((m) => (
                    <div key={m.candidate_id} className="relative p-5 bg-white rounded-xl border border-gray-200 shadow-sm transition hover:shadow-lg hover:-translate-y-1 cursor-pointer group" onClick={() => setSelectedCandidate({id: m.candidate_id, name: m.name})}>
                      <div className="absolute top-5 right-5 text-emerald-600 font-black text-2xl drop-shadow-sm">{Math.round(m.score * 100)}%</div>
                      <h4 className="font-bold text-lg text-gray-900 group-hover:text-emerald-700">{m.name}</h4>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {m.matched_skills.map((s, idx) => <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100 uppercase">{s}</span>)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Detail Modal */}
        {selectedCandidate && (
            <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedCandidate(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-100 p-8 flex justify-between items-start z-10 shadow-sm">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 leading-none mb-2">{selectedCandidate.name || 'Candidate Profile'}</h2>
                            <div className="flex flex-col sm:flex-row gap-4 mt-2 text-sm font-medium text-gray-500">
                                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md"><Mail size={16} className="text-blue-500"/> {selectedCandidate.email || 'Not provided'}</span>
                                {selectedCandidate.phone && <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md"><Phone size={16} className="text-emerald-500"/> {selectedCandidate.phone}</span>}
                            </div>
                        </div>
                        <button onClick={() => setSelectedCandidate(null)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition">
                            <X size={24} className="text-gray-400"/>
                        </button>
                    </div>
                    
                    <div className="p-8 space-y-10 overflow-y-auto">
                        {/* Skills */}
                        <div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Competencies</h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedCandidate.skills?.map((s, idx) => (
                                    <span key={idx} className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-black shadow-lg shadow-blue-100 border border-blue-500">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Experience */}
                        <div>
                             <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Briefcase size={16} className="text-gray-400"/> Professional Experience
                             </h3>
                             <div className="space-y-10">
                                {selectedCandidate.experience && selectedCandidate.experience.length > 0 ? selectedCandidate.experience.map((exp: any, i: number) => (
                                    <div key={i} className="pl-6 border-l-4 border-blue-100 relative">
                                        <div className="absolute -left-[10px] top-0 w-4 h-4 bg-white border-4 border-blue-600 rounded-full"></div>
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-2">
                                            <h4 className="font-black text-gray-900 text-xl">{exp.role}</h4>
                                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">{exp.start} — {exp.end}</span>
                                        </div>
                                        <div className="text-sm font-black text-gray-400 mb-4">{exp.company}</div>
                                        <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">{exp.description}</p>
                                    </div>
                                )) : <p className="text-gray-400 font-medium italic">Detailed experience sections not parsed.</p>}
                             </div>
                        </div>

                        {/* Education */}
                        <div>
                             <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <GraduationCap size={16} className="text-gray-400"/> Academic Background
                             </h3>
                             <div className="grid gap-4 sm:grid-cols-2">
                                {selectedCandidate.education?.map((edu: any, i: number) => (
                                    <div key={i} className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm">
                                        <h4 className="font-black text-gray-900 mb-1">{edu.degree}</h4>
                                        <div className="text-sm text-blue-600 font-bold mb-3">{edu.institution}</div>
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] font-black uppercase tracking-widest"><Calendar size={12}/> Class of {edu.year}</div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-slate-900 border-t border-slate-800">
                         <details className="group">
                            <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-white font-black uppercase tracking-widest select-none flex items-center gap-2">
                                <Code size={14}/> Technical Manifest
                            </summary>
                            <pre className="mt-4 p-4 bg-slate-950 text-blue-400 rounded-xl text-[10px] overflow-x-auto font-mono border border-slate-800 leading-relaxed">
                                {JSON.stringify(selectedCandidate, null, 2)}
                            </pre>
                         </details>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default App;