import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Search, FileText, User, LogOut, Plus, Lock, KeyRound, Eye, Code, ChevronRight, ChevronDown } from 'lucide-react';

// Safe environment variable access
const ENV_API_URL = (import.meta as any).env?.VITE_API_URL;
const API_URL = ENV_API_URL || 'http://localhost:8000/api';

interface Candidate {
  id: string;
  name: string;
  skills: string[];
  email: string;
  phone?: string;
  experience?: any[];
  education?: any[];
}

interface MatchResult {
  candidate_id: string;
  name: string;
  score: number;
  matched_skills: string[];
}

function App() {
  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // App State
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  
  // Preview State
  const [previewData, setPreviewData] = useState<Candidate | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Matching State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  // Configure Axios Auth Header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchInitialData();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setCandidates([]);
      setMySkills([]);
      setPreviewData(null);
    }
  }, [token]);

  const handleAxiosError = (err: any) => {
    console.error(err);
    if (err.response && err.response.status === 401) {
      logout();
    }
  };

  const fetchInitialData = () => {
    fetchCandidates();
    fetchSkills();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authView === 'login') {
        const formData = new FormData();
        formData.append('username', email); // FastAPI OAuth2 expects 'username'
        formData.append('password', password);
        const res = await axios.post(`${API_URL}/auth/login`, formData);
        const accessToken = res.data.access_token;
        localStorage.setItem('token', accessToken);
        setToken(accessToken);
      } else {
        await axios.post(`${API_URL}/auth/register`, { email, password });
        setAuthView('login');
        setAuthError('Registration successful! Please login.');
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || 'Authentication failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setPreviewData(null);
  };

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API_URL}/candidates`);
      setCandidates(res.data);
    } catch (err) { handleAxiosError(err); }
  };

  const fetchSkills = async () => {
    try {
      const res = await axios.get(`${API_URL}/skills`);
      setMySkills(res.data);
    } catch (err) { handleAxiosError(err); }
  };

  const handleAddSkill = async () => {
    if(!newSkill) return;
    try {
      await axios.post(`${API_URL}/skills`, { skill: newSkill });
      setNewSkill('');
      fetchSkills();
    } catch (err) { handleAxiosError(err); }
  }

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadStatus('Uploading & Parsing...');
    setPreviewData(null); // Clear previous preview
    
    try {
      const res = await axios.post(`${API_URL}/upload-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus('Success!');
      setPreviewData(res.data); // Set preview data
      fetchCandidates();
      setFile(null);
    } catch (err: any) {
      setUploadStatus('Error uploading.');
      handleAxiosError(err);
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
    } catch (err) { handleAxiosError(err); }
    finally { setIsMatching(false); }
  };

  // --- Auth View ---
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <div className="text-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full text-white inline-block mb-2">
              <Lock size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ResumeAI</h1>
            <p className="text-gray-500">{authView === 'login' ? 'Sign in to access' : 'Create an account'}</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required className="w-full p-2 border rounded mt-1" 
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" required className="w-full p-2 border rounded mt-1" 
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              {authView === 'login' ? 'Login' : 'Register'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => setAuthView(authView === 'login' ? 'register' : 'login')} className="text-blue-600 text-sm hover:underline">
              {authView === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main App View ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ResumeAI</h1>
              <p className="text-gray-500">Secure & Custom Parsing</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-gray-600 hover:text-red-600">
            <LogOut size={20} /> Logout
          </button>
        </header>

        {/* Custom Skills Bar */}
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-indigo-800 font-semibold min-w-[150px]">
            <KeyRound size={20}/> Custom Skills
          </div>
          <div className="flex-1 flex flex-wrap gap-2">
            {mySkills.map(s => (
              <span key={s} className="px-2 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-md text-xs font-medium">
                {s}
              </span>
            ))}
            {mySkills.length === 0 && <span className="text-indigo-400 text-sm italic">No custom skills defined. The parser will only use defaults.</span>}
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Add skill..." 
              className="p-2 text-sm border border-indigo-300 rounded focus:outline-none"
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
            />
            <button onClick={handleAddSkill} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">
              <Plus size={18}/>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Upload & Candidates */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Upload size={20} /> Upload Resume</h2>
              <div className="flex gap-4 items-center mb-4">
                <input type="file" accept=".pdf" onChange={(e) => e.target.files && setFile(e.target.files[0])} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                <button onClick={handleUpload} disabled={!file} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">Upload</button>
              </div>
              {uploadStatus && <p className="text-sm text-blue-600 mb-2">{uploadStatus}</p>}

              {/* Parsing Preview Section */}
              {previewData && (
                <div className="mt-6 bg-slate-50 rounded-lg border border-slate-200 p-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Eye size={16} className="text-blue-500"/> Parsing Preview
                    </h3>
                    <button 
                      onClick={() => setShowRawJson(!showRawJson)} 
                      className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      <Code size={12} /> {showRawJson ? 'Hide JSON' : 'Show JSON'}
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-slate-500">Name:</span> <span className="font-medium">{previewData.name}</span></div>
                      <div><span className="text-slate-500">Email:</span> <span className="font-medium">{previewData.email || 'N/A'}</span></div>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Detected Skills:</span>
                      <div className="flex flex-wrap gap-1">
                        {previewData.skills.length > 0 ? previewData.skills.map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">{s}</span>
                        )) : <span className="text-slate-400 italic">No skills detected</span>}
                      </div>
                    </div>
                  </div>

                  {showRawJson && (
                    <div className="mt-3 relative">
                      <pre className="bg-slate-900 text-slate-50 p-3 rounded text-xs overflow-auto max-h-48">
                        {JSON.stringify(previewData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><User size={20} /> Indexed Candidates</h2>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {candidates.length === 0 ? <p className="text-gray-400">No candidates uploaded yet.</p> : null}
                {candidates.map(c => (
                  <div key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-blue-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">{c.skills.length} skills</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Job Matching */}
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Search size={20} /> Job Matching</h2>
              <div className="space-y-4 mb-6">
                <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Job Title" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                <textarea value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={4} placeholder="Description..." className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                <button onClick={handleMatch} disabled={!jobTitle || !jobDesc || isMatching} className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm">
                  {isMatching ? 'Matching...' : 'Find Matches'}
                </button>
              </div>
              
              <div className="flex-1 space-y-4">
                 {matches.length === 0 && !isMatching ? (
                    <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-100 rounded-lg">
                      Enter job details to see ranked candidates.
                    </div>
                  ) : null}
                {matches.map((m) => (
                    <div key={m.candidate_id} className="relative p-4 bg-white rounded-lg border border-gray-200 shadow-sm transition hover:shadow-md">
                      <div className="absolute top-4 right-4 text-emerald-600 font-bold text-xl">{Math.round(m.score * 100)}%</div>
                      <h4 className="font-bold text-lg text-gray-800">{m.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.matched_skills.map(s => <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-100">{s}</span>)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
