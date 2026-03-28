import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, CheckCircle, XCircle, Clock, ArrowLeft, FileText, Shield, AlertTriangle } from 'lucide-react';
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

    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('document_type', selectedType);
      formData.append('file', selectedFile);

      const res = await axios.post(`${API}/documents/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setSuccess('Document uploaded! Click "Verify via DigiLocker" to authenticate.');
        setSelectedType(''); setSelectedFile(null);
        if (document.getElementById('file-input')) document.getElementById('file-input').value = '';
        fetchDocuments();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload document');
    } finally { setUploading(false); }
  };

  const handleVerify = async (documentId) => {
    setVerifying(documentId); setError(''); setSuccess(''); setVerificationResult(null);
    try {
      const res = await axios.post(`${API}/documents/verify/${documentId}`);
      if (res.data.success) {
        setVerificationResult(res.data);
        if (res.data.is_verified) {
          setSuccess(`✅ DigiLocker Verified! Confidence: ${res.data.confidence}%`);
        } else {
          setError(`❌ Verification Failed: ${res.data.ocr_result}`);
        }
        fetchDocuments();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed');
    } finally { setVerifying(null); }
  };

  const getStatusBadge = (status) => {
    const styles = {
      verified: 'bg-green-500/20 text-green-300 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    };
    const icons = { verified: CheckCircle, rejected: XCircle, pending: Clock };
    const labels = { verified: 'DigiLocker Verified', rejected: 'Rejected', pending: 'Pending Verification' };
    const Icon = icons[status] || Clock;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
        <Icon className="h-3 w-3" /> {labels[status] || 'Pending'}
      </span>
    );
  };

  const selectedTypeInfo = DOCUMENT_TYPES.find(d => d.value === selectedType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-blue-300 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg"><Shield className="h-5 w-5 text-white" /></div>
          <div>
            <h1 className="text-lg font-bold text-white">{t('documents', lang)} — DigiLocker Verification</h1>
            <p className="text-sm text-blue-300">Upload and verify documents via DigiLocker</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* DigiLocker Info Banner */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-white font-semibold mb-1">🔐 DigiLocker Document Verification</h3>
              <p className="text-blue-200 text-sm">
                Documents are verified using DigiLocker-style validation. Only valid documents matching the selected type will be approved. 
                <strong className="text-indigo-300"> Uploading an incorrect document (e.g., a random file as a marksheet) will be automatically rejected.</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Upload className="h-5 w-5 text-blue-400" /> Upload Document</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                </div>
              )}
              {success && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-green-200 text-sm">{success}</p>
                  </div>
                </div>
              )}

              {/* Verification Result Detail */}
              {verificationResult && (
                <div className={`rounded-xl p-4 border ${verificationResult.is_verified ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className={`h-4 w-4 ${verificationResult.is_verified ? 'text-green-400' : 'text-red-400'}`} />
                    <span className={`font-medium text-sm ${verificationResult.is_verified ? 'text-green-300' : 'text-red-300'}`}>
                      DigiLocker Status: {verificationResult.digilocker_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div className={`h-2 rounded-full ${verificationResult.is_verified ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${verificationResult.confidence}%` }}></div>
                    </div>
                    <span className="text-white text-xs font-bold">{verificationResult.confidence}%</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-blue-300 text-sm">Document Type</label>
                <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setVerificationResult(null); }}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400">
                  <option value="" className="bg-slate-800">Select type...</option>
                  {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value} className="bg-slate-800">{t.label}</option>)}
                </select>
              </div>

              {/* Naming Guide */}
              {selectedTypeInfo && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-yellow-200 text-xs font-medium mb-1">File Naming Requirement:</p>
                      <p className="text-yellow-300/80 text-xs">{selectedTypeInfo.naming}</p>
                      <p className="text-yellow-300/60 text-xs mt-1">Example: <code className="bg-yellow-500/20 px-1 rounded">{selectedType === 'aadhar' ? 'my_aadhaar_card.pdf' : selectedType === '12th_marksheet' ? '12th_marksheet_result.pdf' : selectedType === '10th_marksheet' ? '10th_ssc_marksheet.pdf' : selectedType + '_doc.pdf'}</code></p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-blue-300 text-sm">Select File</label>
                <input id="file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange}
                  className="w-full text-sm text-blue-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30" />
                <p className="text-xs text-blue-300/70">Max 5MB (PDF, JPG, PNG)</p>
                {selectedFile && <p className="text-sm text-green-300">✓ {selectedFile.name}</p>}
              </div>

              <button type="submit" disabled={uploading || !selectedType || !selectedFile}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50">
                {uploading ? 'Uploading...' : '📤 ' + t('upload', lang)}
              </button>
            </form>
          </div>

          {/* Document List */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-green-400" /> Your Documents</h3>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto mb-3 text-blue-300/30" />
                <p className="text-blue-300/70 text-sm">No documents uploaded yet</p>
                <p className="text-blue-300/50 text-xs mt-1">Upload documents to enable DigiLocker verification</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className={`rounded-xl p-4 border ${
                    doc.verification_status === 'verified' ? 'bg-green-500/5 border-green-500/20' :
                    doc.verification_status === 'rejected' ? 'bg-red-500/5 border-red-500/20' :
                    'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-medium text-sm">
                          {DOCUMENT_TYPES.find(d => d.value === doc.document_type)?.label || doc.document_type}
                        </h4>
                        <p className="text-blue-300/70 text-xs truncate max-w-[200px]">{doc.file_name}</p>
                      </div>
                      {getStatusBadge(doc.verification_status)}
                    </div>

                    {doc.ocr_result && doc.verification_status === 'rejected' && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-2">
                        <p className="text-red-300 text-xs">{doc.ocr_result}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-blue-300/50">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      {doc.verification_status === 'pending' && (
                        <button onClick={() => handleVerify(doc.id)} disabled={verifying === doc.id}
                          className="text-xs px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 disabled:opacity-50 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {verifying === doc.id ? 'Verifying...' : '🔐 Verify via DigiLocker'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Verification How-It-Works */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5">
          <h4 className="text-white font-medium mb-3">🔒 How DigiLocker Verification Works</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-500/20 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-300 font-bold">1</span>
              </div>
              <p className="text-blue-200 text-sm font-medium">Upload Document</p>
              <p className="text-blue-300/70 text-xs mt-1">Select the correct document type and upload your file</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-500/20 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                <span className="text-indigo-300 font-bold">2</span>
              </div>
              <p className="text-blue-200 text-sm font-medium">DigiLocker Validates</p>
              <p className="text-blue-300/70 text-xs mt-1">System checks if the uploaded file matches the selected document type</p>
            </div>
            <div className="text-center">
              <div className="bg-green-500/20 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                <span className="text-green-300 font-bold">3</span>
              </div>
              <p className="text-blue-200 text-sm font-medium">Get Verified</p>
              <p className="text-blue-300/70 text-xs mt-1">Only matching documents are approved. Mismatched files are rejected.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Documents;
