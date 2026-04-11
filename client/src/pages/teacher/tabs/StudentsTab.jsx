import { useEffect, useState, useRef } from 'react';
import api from '../../../utils/api';

const STATUS_COLORS = {
  not_started: 'bg-slate-100 text-slate-500',
  in_progress: 'bg-amber-100 text-amber-700',
  submitted: 'bg-emerald-100 text-emerald-700',
  force_submitted: 'bg-red-100 text-red-600',
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
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">
          + Add Student
        </button>
        <button onClick={() => fileInput.current.click()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition">
          📂 Import Excel
        </button>
        <button onClick={handleExport} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition">
          ⬇ Export Excel
        </button>
        <input ref={fileInput} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
      </div>

      {/* Table */}
      {students.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          No students enrolled yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Reg No.', 'Name', 'Email', 'Status', 'Score', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(s => {
                  const status = s.attempt?.status || 'not_started';
                  return (
                    <tr key={s._id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.registrationNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                      <td className="px-4 py-3 text-slate-500">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
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
                              className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition"
                            >
                              {resettingId === s._id ? '…' : 'Reset'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Add Student</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              {['name', 'email', 'registrationNumber', 'password'].map(field => (
                <input
                  key={field}
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  placeholder={field === 'registrationNumber' ? 'Registration Number' : field.charAt(0).toUpperCase() + field.slice(1)}
                  value={addForm[field]}
                  onChange={e => setAddForm(p => ({ ...p, [field]: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              ))}
              {addError && <p className="text-red-500 text-xs">{addError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={adding} className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition">
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
