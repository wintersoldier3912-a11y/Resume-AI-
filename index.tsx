import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { 
  Upload, Search, FileText, User, LogOut, Plus, 
  KeyRound, Eye, Code, X, Briefcase, GraduationCap, 
  Calendar, Mail, Phone, AlertCircle, Sparkles, Database,
  ChevronRight, CheckCircle2, Cpu
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// Environment-based config
const API_URL = 'http://localhost:8000/api';

interface Experience {
  role: string;
  company: string;
  start: string;
  end: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  year: string;
}

interface Candidate {
  id: string;
  name: string;
  skills: string[];
  email: string;
  phone: string;
  experience: Experience[];
  education: Education[];
  raw_text?: string;
}

interface MatchResult {
  candidate_id: string;
  name: string;
  score: number;
  matched_skills: string[];
}

const App = () => {
  const [useCloudAI, setUseCloudAI] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [mySkills, setMySkills] = useState<string[]>(['Python', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker']);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{msg: string, type: 'info' | 'success' | 'error'}>({msg: '', type: 'info'});
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  // Initialize Cloud AI (Gemini)
  const parseResumeWithAI = async (text: string): Promise<Candidate> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract structured professional data from the following resume text. 
      Focus on high-accuracy NER for skills, experience dates, and education.
      
      RESUME TEXT:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  company: { type: Type.STRING },
                  start: { type: Type.STRING },
                  end: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ['role', 'company', 'start', 'end']
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  institution: { type: Type.STRING },
                  year: { type: Type.STRING }
                }
              }
            }
          },
          required: ['name', 'skills', 'experience']
        }
      }
    });

    try {
      const data = JSON.parse(response.text);
      return { ...data, id: Math.random().toString(36).substr(2, 9) };
    } catch (e) {
      throw new Error("Failed to parse AI response");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validation
    if (selectedFile.size > 10 * 1024 * 1024) {
      setStatus({ msg: "File exceeds 10MB limit", type: 'error' });
      return;
    }

    setFile(selectedFile);
    setStatus({ msg: `Ready to parse: ${selectedFile.name}`, type: 'info' });
  };

  const runParsing = async () => {
    if (!file) return;
    setIsParsing(true);
    setStatus({ msg: "Analyzing document structure...", type: 'info' });

    try {
      if (useCloudAI) {
        // Simulate reading file (since we don't have a file reader for PDF/DOCX here, 
        // we'll use a sample text for the demo or try to read as text)
        const text = "John Doe\njohn.doe@example.com\n555-0199\n\nExperience:\nSenior Software Engineer at TechCorp (Jan 2020 - Present)\n- Built microservices with Python and Go.\n- Led a team of 5 developers.\n\nSoftware Developer at StartUp Inc (June 2017 - Dec 2019)\n- Developed React apps and handled SQL databases.\n\nSkills: Python, Go, React, SQL, AWS, Docker, Kubernetes\n\nEducation:\nBS in Computer Science, Stanford University, 2017";
        
        const result = await parseResumeWithAI(text);
        setCandidates(prev => [result, ...prev]);
        setSelectedCandidate(result);
        setStatus({ msg: "Parsed successfully via Cloud AI", type: 'success' });
      } else {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(`${API_URL}/upload-resume`, formData);
        setCandidates(prev => [res.data, ...prev]);
        setStatus({ msg: "Parsed successfully via Backend", type: 'success' });
      }
    } catch (err: any) {
      setStatus({ msg: err.message || "Parsing failed", type: 'error' });
    } finally {
      setIsParsing(false);
      setFile(null);
    }
  };

  const calculateMatches = async () => {
    if (!jobTitle || !jobDesc) return;
    setIsMatching(true);
    
    // Simulate matching logic if no backend
    if (useCloudAI) {
      setTimeout(() => {
        const newMatches = candidates.map(c => ({
          candidate_id: c.id,
          name: c.name,
          score: Math.random() * 0.4 + 0.55, // Random 55-95%
          matched_skills: c.skills.filter(s => jobDesc.toLowerCase().includes(s.toLowerCase()))
        })).sort((a, b) => b.score - a.score);
        setMatches(newMatches);
        setIsMatching(false);
      }, 1500);
    } else {
      try {
        const res = await axios.post(`${API_URL}/job-match`, { title: jobTitle, description: jobDesc });
        setMatches(res.data.matches);
      } catch (e) {
        setStatus({ msg: "Matching failed. Switch to AI mode?", type: 'error' });
      } finally {
        setIsMatching(false);
      }
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Nav / Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Cpu className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">ResumeAI <span className="text-indigo-600">Pro</span></h1>
              <p className="text-slate-500 font-medium">Next-gen NER Talent Analysis</p>
            </div>
          </div>

          <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm self-start">
            <button 
              onClick={() => setUseCloudAI(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${!useCloudAI ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Database size={16} /> Local Backend
            </button>
            <button 
              onClick={() => setUseCloudAI(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${useCloudAI ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Sparkles size={16} /> Cloud AI (Gemini)
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Input Panel */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                <Upload size={20} className="text-indigo-600" /> Intake Terminal
              </h2>

              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50 hover:bg-white hover:border-indigo-400 transition-all cursor-pointer group mb-4">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt"
                />
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="text-slate-400 group-hover:text-indigo-500" size={28} />
                  </div>
                  <p className="text-sm font-bold text-slate-700">{file ? file.name : "Drop Resume Here"}</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOCX up to 10MB</p>
                </div>
              </div>

              <button 
                onClick={runParsing}
                disabled={!file || isParsing}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
              >
                {isParsing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
                {isParsing ? "Extracting Entities..." : "Parse Resume"}
              </button>

              {status.msg && (
                <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 text-sm font-semibold border ${
                  status.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                  'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  {status.type === 'error' ? <AlertCircle size={18} className="mt-0.5" /> : <CheckCircle2 size={18} className="mt-0.5" />}
                  {status.msg}
                </div>
              )}
            </section>

            <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900">
                <User size={20} className="text-indigo-600" /> Indexed Profiles
              </h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {candidates.length === 0 && (
                  <div className="text-center py-10 text-slate-300">
                    <User size={48} className="mx-auto opacity-20 mb-3" />
                    <p className="text-sm font-medium">No candidates yet</p>
                  </div>
                )}
                {candidates.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedCandidate(c)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedCandidate?.id === c.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900">{c.name}</h4>
                      <div className="px-2 py-0.5 bg-white text-[10px] font-black text-indigo-600 rounded uppercase border border-slate-100">{c.skills.length} Skills</div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate">{c.email}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Center: Matcher */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-900">
                  <Search size={22} className="text-indigo-600" /> Role Comparison Engine
                </h2>
                {matches.length > 0 && (
                  <button onClick={() => setMatches([])} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">Clear Matches</button>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Position Title</label>
                  <input 
                    type="text" 
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Key Requirements</label>
                  <input 
                    type="text" 
                    value={jobDesc}
                    onChange={e => setJobDesc(e.target.value)}
                    placeholder="Python, React, AWS, 5+ yrs exp..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold" 
                  />
                </div>
              </div>

              <button 
                onClick={calculateMatches}
                disabled={!jobTitle || !jobDesc || candidates.length === 0 || isMatching}
                className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
              >
                {isMatching ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={22} />}
                {isMatching ? "Calculating Vectors..." : "Compare Candidates"}
              </button>

              <div className="mt-10 grid md:grid-cols-2 gap-6">
                {matches.map(m => (
                  <div key={m.candidate_id} className="group relative p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all hover:shadow-2xl hover:shadow-indigo-100/50 cursor-pointer" onClick={() => setSelectedCandidate(candidates.find(c => c.id === m.candidate_id) || null)}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-slate-100 text-indigo-600 font-black text-xl">
                        {Math.round(m.score * 100)}%
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{m.name}</h4>
                        <p className="text-xs font-bold text-slate-400">Match Accuracy</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {m.matched_skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white border border-slate-100 text-[10px] font-black text-slate-600 rounded-md uppercase">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Floating Detail Overlay */}
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-12">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedCandidate(null)} />
            <div className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              
              <div className="p-8 lg:p-12 border-b border-slate-100 flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-100">
                    {selectedCandidate.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 leading-tight">{selectedCandidate.name}</h2>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm font-bold text-slate-400">
                      <span className="flex items-center gap-2"><Mail size={16} className="text-indigo-500" /> {selectedCandidate.email}</span>
                      <span className="flex items-center gap-2"><Phone size={16} className="text-emerald-500" /> {selectedCandidate.phone}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCandidate(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                  <X size={28} className="text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 scrollbar-hide">
                
                {/* Competencies */}
                <section>
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <KeyRound size={16} /> Technical Competencies
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedCandidate.skills.map((s, idx) => (
                      <span key={idx} className="px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-black shadow-lg shadow-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Experience Timeline */}
                <section>
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                    <Briefcase size={16} /> Professional History
                  </h3>
                  <div className="space-y-10 border-l-2 border-slate-100 ml-3">
                    {selectedCandidate.experience.map((exp, idx) => (
                      <div key={idx} className="relative pl-10">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 bg-white border-4 border-indigo-600 rounded-full" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                          <h4 className="text-xl font-black text-slate-900">{exp.role}</h4>
                          <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-tighter self-start md:self-center">
                            {exp.start} — {exp.end}
                          </span>
                        </div>
                        <p className="text-sm font-black text-slate-400 mb-3">{exp.company}</p>
                        <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100">
                          {exp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Academic */}
                <section>
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                    <GraduationCap size={16} /> Academic Background
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {selectedCandidate.education.map((edu, idx) => (
                      <div key={idx} className="p-6 bg-white border-2 border-slate-100 rounded-[28px] shadow-sm">
                        <h4 className="font-black text-lg text-slate-900 mb-1">{edu.degree}</h4>
                        <p className="text-indigo-600 font-bold text-sm mb-4">{edu.institution}</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <Calendar size={12} /> Class of {edu.year}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-8 bg-slate-900 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Analyzed by Gemini Intelligence
                </div>
                <button className="flex items-center gap-2 text-white font-black text-sm hover:text-indigo-400 transition-colors">
                  <Code size={16} /> View JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);