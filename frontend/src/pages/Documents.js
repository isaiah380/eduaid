/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, CheckCircle, XCircle, Clock, FileText, Shield, AlertTriangle, Play, Award } from 'lucide-react';
import { t } from '@/lib/i18n';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const API = BACKEND_URL + '/api';

const DOC_TYPES = [
  { value: '10th_marksheet', label: '10th Marksheet' },
  { value: '12th_marksheet', label: '12th Marksheet' },
  { value: 'aadhar', label: 'Aadhaar Card' },
  { value: 'income_certificate', label: 'Income Certificate' },
  { value: 'caste_certificate', label: 'Caste Certificate' }
];

const DOC_HINTS = {
  'aadhar': 'System will scan for 12-digit UID number, UIDAI references, DOB, and address fields.',
  'income_certificate': 'System will scan for income amounts, Tahsildar/Revenue authority, financial year.',
  'caste_certificate': 'System will scan for SC/ST/OBC category references, community certificate title.',
  '10th_marksheet': 'System will scan for board name, subject marks, percentage/grade, and Class 10 references.',
  '12th_marksheet': 'System will scan for board name, subject marks, percentage/grade, and Class 12 references.'
};

function Documents(props) {
  var user = props.user;
  var onLogout = props.onLogout;
  var navigate = useNavigate();
  var lang = localStorage.getItem('language') || 'en';
  var [documents, setDocuments] = useState([]);
  var [selectedType, setSelectedType] = useState('');
  var [selectedFile, setSelectedFile] = useState(null);
  var [uploading, setUploading] = useState(false);
  var [verifying, setVerifying] = useState(null);
  var [error, setError] = useState('');
  var [success, setSuccess] = useState('');
  var [verificationResult, setVerificationResult] = useState(null);

  useEffect(function() { fetchDocuments(); }, []);

  function fetchDocuments() {
    axios.get(API + '/documents/' + user.id)
      .then(function(res) { if (res.data.success) setDocuments(res.data.documents); })
      .catch(function(err) { console.error(err); });
  }

  function handleFileChange(e) {
    var file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError('File size must be less than 5MB'); return; }
      setSelectedFile(file);
      setError('');
      setVerificationResult(null);
    }
  }

  function handleUpload(e) {
    e.preventDefault();
    if (!selectedType || !selectedFile) { setError('Please select document type and file'); return; }
    setUploading(true); setError(''); setSuccess(''); setVerificationResult(null);

    var formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('document_type', selectedType);
    formData.append('user_id', user.id);

    axios.post(API + '/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(function(response) {
        if (response.data.success) {
          setSuccess('Document uploaded! Click "Run Verification" to verify contents.');
          setDocuments([response.data.document].concat(documents));
          setSelectedFile(null);
          setSelectedType('');
          var fi = document.getElementById('file-input');
          if (fi) fi.value = '';
        }
      })
      .catch(function(err) { setError(err.response && err.response.data ? err.response.data.detail : 'Upload failed'); })
      .finally(function() { setUploading(false); });
  }

  function handleVerify(docId) {
    setVerifying(docId); setVerificationResult(null); setError(''); setSuccess('');
    setTimeout(function() {
      axios.post(API + '/documents/verify/' + docId)
        .then(function(res) {
          if (res.data.success) {
            setVerificationResult(res.data);
            fetchDocuments();
          }
        })
        .catch(function() { setError('Verification service unavailable'); })
        .finally(function() { setVerifying(null); });
    }, 2000);
  }

  function handleDelete(docId) {
    if (!window.confirm("Are you sure you want to delete this document? This will remove your eligibility based on this document.")) return;
    
    setError(''); setSuccess('');
    axios.delete(API + '/documents/' + docId)
      .then(function(res) {
        if (res.data.success) {
          setSuccess('Document deleted successfully');
          setDocuments(documents.filter(function(d) { return d.id !== docId; }));
          setVerificationResult(null); // Clear the verified message
        }
      })
      .catch(function(err) { setError('Failed to delete document'); });
  }

  function getStatusBadge(status) {
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
  }

  function extractPercent(ocr) {
    if (!ocr) return null;
    var m = ocr.match(/Extracted Percentage:\s*([0-9.]+)%/i);
    return m ? m[1] : null;
  }

  function extractField(ocr, field) {
    if (!ocr) return null;
    if (field === 'aadhaar') { var m = ocr.match(/Aadhaar:\s*(XXXX-XXXX-\d{4})/i); return m ? m[1] : null; }
    if (field === 'income') { var m = ocr.match(/Income:\s*([\S]+)/i); return m ? m[1] : null; }
    if (field === 'category') { var m = ocr.match(/Category:\s*([A-Z]+)/i); return m ? m[1] : null; }
    if (field === 'board') { var m = ocr.match(/Board:\s*([A-Z\s]+)/i); return m ? m[1].trim() : null; }
    if (field === 'age') { var m = ocr.match(/Age:\s*(\d+)/i); return m ? m[1] : null; }
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="h-2 w-full flex fixed top-0 z-50">
        <div className="flex-1 bg-orange-500"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-green-600"></div>
      </div>

      <header className="bg-white border-b border-slate-200 mt-2 sticky top-2 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button onClick={function() { navigate('/dashboard'); }} className="text-slate-500 hover:text-blue-600 mr-2 font-medium transition-colors">
              Back
            </button>
            <div className="bg-emerald-600 p-2.5 rounded-xl shadow-md">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{t('documents', lang)}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full mt-0.5">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-blue-900 font-bold mb-1 text-lg">DigiLocker Content Verification</h3>
              <p className="text-blue-800 text-sm font-medium">
                Documents are verified by analyzing their actual content, not just filenames. Upload a real PDF for best results.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

              {verificationResult && (
                <VerificationResultDisplay result={verificationResult} />
              )}

              <div className="space-y-1.5">
                <label className="text-slate-700 text-sm font-bold">Document Type</label>
                <select value={selectedType} onChange={function(e) { setSelectedType(e.target.value); setVerificationResult(null); }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                  <option value="">Select document type...</option>
                  {DOC_TYPES.map(function(dt) { return <option key={dt.value} value={dt.value}>{dt.label}</option>; })}
                </select>
              </div>

              {selectedType && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-700 text-sm font-bold mb-1">Content Verification Active</p>
                      <p className="text-slate-600 text-xs leading-relaxed">{DOC_HINTS[selectedType] || ''}</p>
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
                <p className="text-xs text-slate-500 mt-2 font-medium">Max 5MB (PDF, JPG, PNG). PDF recommended for best verification</p>
                {selectedFile && <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold"><CheckCircle className="h-4 w-4"/> {selectedFile.name}</div>}
              </div>

              <button type="submit" disabled={uploading || !selectedType || !selectedFile}
                className="w-full py-3 bg-blue-600 text-white shadow-md rounded-xl font-bold text-sm tracking-wide hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all uppercase">
                {uploading ? 'Processing...' : 'Upload Document'}
              </button>
            </form>
          </div>

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
                {documents.map(function(doc) {
                  var pct = extractPercent(doc.ocr_result);
                  var aadhaar = extractField(doc.ocr_result, 'aadhaar');
                  var income = extractField(doc.ocr_result, 'income');
                  var category = extractField(doc.ocr_result, 'category');
                  var board = extractField(doc.ocr_result, 'board');
                  var typeLabel = '';
                  for (var i = 0; i < DOC_TYPES.length; i++) {
                    if (DOC_TYPES[i].value === doc.document_type) { typeLabel = DOC_TYPES[i].label; break; }
                  }

                  return (
                    <div key={doc.id} className={'rounded-xl p-4 border transition-shadow hover:shadow-md ' + (
                        doc.verification_status === 'verified' ? 'bg-emerald-50/50 border-emerald-100' :
                        doc.verification_status === 'rejected' ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-200')}>
                      
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-slate-800 font-bold text-sm flex items-center gap-1.5">
                            {typeLabel || doc.document_type}
                            {pct && doc.verification_status === 'verified' && (
                              <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase">
                                {pct}%
                              </span>
                            )}
                          </h4>
                          <p className="text-slate-500 text-xs mt-1 truncate max-w-[220px] font-medium">{doc.file_name}</p>
                        </div>
                        {getStatusBadge(doc.verification_status)}
                      </div>

                      {doc.verification_status === 'verified' && doc.ocr_result && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {aadhaar && <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">ID: {aadhaar}</span>}
                          {income && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">Income: {income}</span>}
                          {category && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">Category: {category}</span>}
                          {board && <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">Board: {board}</span>}
                        </div>
                      )}

                      {doc.ocr_result && doc.verification_status === 'rejected' && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                          <p className="text-red-700 text-xs font-semibold leading-relaxed">{doc.ocr_result}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-400 font-medium">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <button onClick={function() { handleDelete(doc.id); }} className="text-xs px-3 py-2 bg-red-50 text-red-600 shadow-sm rounded-lg hover:bg-red-100 border border-red-200 disabled:opacity-50 flex items-center font-bold transition-colors">
                            Delete
                          </button>
                          
                          {doc.verification_status === 'pending' && (
                            <button onClick={function() { handleVerify(doc.id); }} disabled={verifying === doc.id}
                              className="text-xs px-4 py-2 bg-slate-800 text-white shadow-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 font-bold transition-colors">
                              <Play className="h-3 w-3" />
                              {verifying === doc.id ? 'Analyzing Content...' : 'Run Verification'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function VerificationResultDisplay(props) {
  var result = props.result;
  var isOk = result.is_verified;
  var patterns = result.matchedPatterns || [];
  var data = result.extractedData || {};

  return (
    <div className={'rounded-xl p-5 border ' + (isOk ? 'bg-emerald-50 border-emerald-200 shadow-sm' : (result.verification_status === 'pending' ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-red-50 border-red-200 shadow-sm'))}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className={'h-5 w-5 ' + (isOk ? 'text-emerald-600' : (result.verification_status === 'pending' ? 'text-amber-600' : 'text-red-600'))} />
        <span className={'font-bold text-sm uppercase tracking-wide ' + (isOk ? 'text-emerald-800' : (result.verification_status === 'pending' ? 'text-amber-800' : 'text-red-800'))}>
          {result.digilocker_status}
        </span>
      </div>

      {patterns.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">Content Checks Passed</p>
          <div className="flex flex-wrap gap-1.5">
            {patterns.map(function(p, i) {
              return <span key={i} className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">{'OK: ' + p}</span>;
            })}
          </div>
        </div>
      )}

      {Object.keys(data).length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {data.percentage && (
            <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Marks</p>
                <p className="text-sm font-black text-emerald-700">{data.percentage}%</p>
              </div>
            </div>
          )}
          {data.board && (
            <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Board</p>
                <p className="text-sm font-black text-blue-700">{data.board}</p>
              </div>
            </div>
          )}
          {data.uid_last4 && (
            <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-500" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Aadhaar</p>
                <p className="text-sm font-black text-violet-700">{data.uid_last4}</p>
              </div>
            </div>
          )}
          {data.income_amount && (
            <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Income</p>
                <p className="text-sm font-black text-amber-700">{data.income_amount}</p>
              </div>
            </div>
          )}
          {data.category && (
            <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Category</p>
                <p className="text-sm font-black text-indigo-700">{data.category}</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-4 mt-4">
        <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div className={'h-2.5 rounded-full ' + (isOk ? 'bg-emerald-500' : (result.verification_status === 'pending' ? 'bg-amber-500' : 'bg-red-500'))}
            style={{ width: result.confidence + '%' }}></div>
        </div>
        <span className="text-slate-700 text-xs font-bold">{result.confidence}% Match</span>
      </div>
    </div>
  );
}

export default Documents;
