import { useEffect, useState, useRef } from 'react';
import api from '../../../utils/api';

const STATUS_COLORS = {
  not_started: 'bg-gray-50 border-gray-200 text-gray-600',
  in_progress: 'bg-amber-50 border-amber-200 text-amber-700',
  submitted: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  force_submitted: 'bg-red-50 border-red-200 text-red-700',
};

export default function StudentsTab({ classData, onRefresh }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', registrationNumber: '', password: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [resettingId, setResettingId] = useState(null);
  const fileInput = useRef();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/classes/${classData._id}/students`);
      setStudents(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (classData?._id) fetchStudents(); }, [classData?._id]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true); setAddError('');
    try {
      await api.post(`/classes/${classData._id}/students`, addForm);
      setAddForm({ name: '', email: '', registrationNumber: '', password: '' });
      setShowAddModal(false);
      fetchStudents();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add student.');
    } finally { setAdding(false); }
  };

  const handleReset = async (studentId) => {
    if (!window.confirm('Reset this student\'s attempt?')) return;
    setResettingId(studentId);
    try {
      await api.post(`/classes/${classData._id}/students/${studentId}/reset-attempt`);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Reset failed.');
    } finally { setResettingId(null); }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Remove this student from the class?')) return;
    try {
      await api.delete(`/classes/${classData._id}/students/${studentId}`);
      fetchStudents();
    } catch { alert('Failed to remove student.'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post(`/classes/${classData._id}/students/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`Import complete: ${data.created} created, ${data.skipped} skipped.`);
      fetchStudents();
    } catch { alert('Import failed.'); }
    e.target.value = '';
  };

  const handleExport = () => {
    window.open(`/api/classes/${classData._id}/students/export`, '_blank');
  };

  if (loading) return <div className="py-10 text-center text-slate-400">Loading students…</div>;

  return (
    <div>
      {/* Action bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 border border-transparent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
          + Add Student
        </button>
        <button onClick={() => fileInput.current.click()} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
          📂 Import Excel
        </button>
        <button onClick={handleExport} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
          ⬇ Export Excel
        </button>
        <input ref={fileInput} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
      </div>

      {/* Table */}
      {students.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          No students enrolled yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Reg No.', 'Name', 'Email', 'Status', 'Score', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => {
                  const status = s.attempt?.status || 'not_started';
                  return (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.registrationNumber}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-3 text-gray-500">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md border text-[11px] uppercase tracking-wider font-semibold ${STATUS_COLORS[status]}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.attempt?.score != null
                          ? `${s.attempt.score}/${s.attempt.totalMarks} (${s.attempt.percentage}%)`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {['in_progress', 'submitted', 'force_submitted'].includes(status) && (
                            <button
                              onClick={() => handleReset(s._id)}
                              disabled={resettingId === s._id}
                              className="text-xs px-2.5 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 hover:border-amber-300 transition-colors"
                            >
                              {resettingId === s._id ? '…' : 'Reset'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="text-xs px-2.5 py-1.5 border border-red-200 bg-red-50 text-red-600 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900 text-lg mb-4 tracking-tight">Add Student</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              {['name', 'email', 'registrationNumber', 'password'].map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {field === 'registrationNumber' ? 'Registration Number' : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                    value={addForm[field]}
                    onChange={e => setAddForm(p => ({ ...p, [field]: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                </div>
              ))}
              {addError && <p className="text-red-600 text-xs font-medium bg-red-50 p-2 rounded">{addError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={adding} className="flex-1 py-2 bg-blue-600 border border-transparent text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                  {adding ? 'Adding…' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
