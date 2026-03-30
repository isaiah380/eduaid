import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, CheckCircle, XCircle, Clock, ArrowLeft, FileText, Shield, AlertTriangle, Play, Award } from 'lucide-react';
import { t } from '@/lib/i18n';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = `${BACKEND_URL}/api`;

const DOCUMENT_TYPES = [
  { value: '10th_marksheet', label: '10th Marksheet', naming: 'Include "10th", "marksheet", "ssc", or "matric" in filename' },
  { value: '12th_marksheet', label: '12th Marksheet', naming: 'Include "12th", "marksheet", "hsc", or "intermediate" in filename' },
  { value: 'aadhar', label: 'Aadhaar Card', naming: 'Include "aadhar", "aadhaar", or "uid" in filename' },
  { value: 'income_certificate', label: 'Income Certificate', naming: 'Include "income" and "certificate" in filename' },
  { value: 'caste_certificate', label: 'Caste Certificate', naming: 'Include "caste" and "certificate" in filename' }
];

function Documents({ user, onLogout }) {
  const navigate = useNavigate();
  const lang = localStorage.getItem('language') || 'en';
  const [documents, setDocuments] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API}/documents/${user.id}`);
      if (res.data.success) setDocuments(res.data.documents);
    } catch (err) { console.error(err); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB'); return; }
      setSelectedFile(file); setError(''); setVerificationResult(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedType || !selectedFile) { setError('Please select document type and file'); return; }
    setUploading(true); setError(''); setSuccess(''); setVerificationResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('document_type', selectedType);
    formData.append('user_id', user.id);

    try {
      const response = await axios.post(`${API}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setSuccess('Document uploaded successfully! Ready for DigiLocker verification.');
        setDocuments([response.data.document, ...documents]);
        setSelectedFile(null);
        setSelectedType('');
        document.getElementById('file-input').value = '';
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleVerify = async (docId) => {
    setVerifying(docId); setVerificationResult(null); setError(''); setSuccess('');
    // Simulate DigiLocker API delay
    await new Promise(r => setTimeout(r, 1500));
    try {
      const res = await axios.post(`${API}/documents/verify/${docId}`);
      if (res.data.success) {
        setVerificationResult(res.data);
        fetchDocuments();
      }
    } catch (err) {
      setError('Verification service unavailable');
    } finally { setVerifying(null); }
  };

  const getStatusBadge = (status) => {
    if (status === 'verified') return (
      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
        <CheckCircle className="h-3.5 w-3.5" /> Verified
      </span>
    );
    if (status === 'rejected') return (
      <span className="flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
        <XCircle className="h-3.5 w-3.5" /> Rejected
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
        <Clock className="h-3.5 w-3.5" /> Pending
      </span>
    );
  };

  // Extract percentage from ocr_result string
  const getExtractedPercentage = (ocrResult) => {
    if (!ocrResult) return null;
    const match = ocrResult.match(/Extracted Percentage:\s*([0-9.]+)%/i);
    return match ? match[1] : null;
  };

  const selectedTypeInfo = DOCUMENT_TYPES.find(d => d.value === selectedType);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Tricolor Accent Bar */}
      <div className="h-2 w-full flex fixed top-0 z-50">
        <div className="flex-1 bg-orange-500"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-green-600"></div>
      </div>

      <header className="bg-white border-b border-slate-200 mt-2 sticky top-2 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-blue-600 mr-2 font-medium transition-colors">
              ← {t('back', lang)}
            </button>
            <div className="bg-emerald-600 p-2.5 rounded-xl shadow-md">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{t('documents', lang)}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* DigiLocker Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full mt-0.5">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-blue-900 font-bold mb-1 text-lg">DigiLocker Document Verification Simulation</h3>
              <p className="text-blue-800 text-sm font-medium">
                Documents are verified securely. For marksheets, the system will instantly extract your percentage.
                <strong className="text-blue-900 bg-blue-100 px-1 rounded mx-1">Only valid documents matching the selected type will be approved.</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
            <h3 className="text-slate-800 font-extrabold mb-5 flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-blue-500" /> Upload New Document
            </h3>
            
            <form onSubmit={handleUpload} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-emerald-700 text-sm font-medium">{success}</p>
                  </div>
                </div>
              )}

              {/* Verification Result Detail */}
              {verificationResult && (
                <div className={`rounded-xl p-5 border ${verificationResult.is_verified ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-red-50 border-red-200 shadow-sm'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className={`h-5 w-5 ${verificationResult.is_verified ? 'text-emerald-600' : 'text-red-600'}`} />
                    <span className={`font-bold text-sm uppercase tracking-wide ${verificationResult.is_verified ? 'text-emerald-800' : 'text-red-800'}`}>
                      Verification Status: {verificationResult.digilocker_status}
                    </span>
                  </div>
                  
                  {verificationResult.is_verified && getExtractedPercentage(verificationResult.ocr_result) && (
                     <div className="mt-3 bg-white p-3 rounded-lg border border-emerald-100 flex items-center gap-3">
                        <Award className="h-5 w-5 text-emerald-500" />
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Extracted Marks</p>
                          <p className="text-lg font-black text-emerald-700">{getExtractedPercentage(verificationResult.ocr_result)}%</p>
                        </div>
                     </div>
                  )}

                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div className={`h-2.5 rounded-full ${verificationResult.is_verified ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${verificationResult.confidence}%` }}></div>
                    </div>
                    <span className="text-slate-700 text-xs font-bold">{verificationResult.confidence}% Match</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-slate-700 text-sm font-bold">Document Type</label>
                <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setVerificationResult(null); }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                  <option value="">Select document type...</option>
                  {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Naming Guide */}
              {selectedTypeInfo && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 text-sm font-bold mb-1">Upload Instruction:</p>
                      <p className="text-amber-700 text-sm mb-2 leading-relaxed">{selectedTypeInfo.naming}</p>
                      <p className="text-amber-600 outline outline-1 outline-amber-200 bg-white px-2 py-1 rounded text-xs font-mono inline-block shadow-sm">
                        eg: {selectedType === 'aadhar' ? 'my_aadhaar_card.pdf' : selectedType === '12th_marksheet' ? '12th_marksheet_result.pdf' : selectedType === '10th_marksheet' ? '10th_ssc_marksheet.pdf' : selectedType + '_doc.pdf'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 rounded-2xl p-6 text-center transition-colors">
                <Upload className="mx-auto h-8 w-8 text-blue-500 mb-3" />
                <label className="text-slate-700 text-sm font-bold cursor-pointer hover:text-blue-600">
                  Select File to Upload
                  <input id="file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                </label>
                <p className="text-xs text-slate-500 mt-2 font-medium">Max 5MB (PDF, JPG, PNG)</p>
                {selectedFile && <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold"><CheckCircle className="h-4 w-4"/> {selectedFile.name}</div>}
              </div>

              <button type="submit" disabled={uploading || !selectedType || !selectedFile}
                className="w-full py-3 bg-blue-600 text-white shadow-md rounded-xl font-bold text-sm tracking-wide hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all uppercase">
                {uploading ? 'Processing...' : 'Upload Document'}
              </button>
            </form>
          </div>

          {/* Document List Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
            <h3 className="text-slate-800 font-extrabold mb-5 flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-emerald-500" /> Your Uploaded Documents
            </h3>
            
            {documents.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-xl">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 font-bold text-sm">No documents found</p>
                <p className="text-slate-400 text-xs mt-1 font-medium">Upload necessary documents for scholarships</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className={`rounded-xl p-4 border transition-shadow hover:shadow-md ${
                      doc.verification_status === 'verified' ? 'bg-emerald-50/50 border-emerald-100' :
                      doc.verification_status === 'rejected' ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-200'}`}>
                    
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-slate-800 font-bold text-sm flex items-center gap-1.5">
                          {DOCUMENT_TYPES.find(d => d.value === doc.document_type)?.label || doc.document_type}
                          {doc.verification_status === 'verified' && getExtractedPercentage(doc.ocr_result) && (
                            <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase">
                              {getExtractedPercentage(doc.ocr_result)}%
                            </span>
                          )}
                        </h4>
                        <p className="text-slate-500 text-xs mt-1 truncate max-w-[220px] font-medium">{doc.file_name}</p>
                      </div>
                      {getStatusBadge(doc.verification_status)}
                    </div>

                    {doc.ocr_result && doc.verification_status === 'rejected' && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                        <p className="text-red-700 text-xs font-semibold leading-relaxed">{doc.ocr_result}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400 font-medium">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      
                      {doc.verification_status === 'pending' && (
                        <button onClick={() => handleVerify(doc.id)} disabled={verifying === doc.id}
                          className="text-xs px-4 py-2 bg-slate-800 text-white shadow-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 font-bold transition-colors">
                          <Play className="h-3 w-3" />
                          {verifying === doc.id ? 'Processing...' : 'Run Verification'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Documents;
