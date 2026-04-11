import { useEffect, useState } from 'react';
import api from '../../../utils/api';

const TYPE_BADGE = { single: 'Single', multiple: 'Multiple' };

const emptyQuestion = () => ({
  text: '',
  type: 'single',
  options: [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
  ],
  correctOptions: [],
  marks: 1,
});

export default function QuestionsTab({ classData }) {
  const quizId = classData?.quizId?._id;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQ, setEditingQ] = useState(null);
  const [form, setForm] = useState(emptyQuestion());
  const [saving, setSaving] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const fetchQuestions = async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/quiz/${quizId}/questions`);
      setQuestions(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchQuestions(); }, [quizId]);

  const openEdit = (q) => { setEditingQ(q._id); setForm({ ...q, correctOptions: [...q.correctOptions] }); setShowForm(true); };
  const openNew = () => { setEditingQ(null); setForm(emptyQuestion()); setShowForm(true); };

  const toggleCorrect = (label) => {
    const { type, correctOptions } = form;
    if (type === 'single') {
      setForm(p => ({ ...p, correctOptions: [label] }));
    } else {
      setForm(p => ({
        ...p,
        correctOptions: correctOptions.includes(label)
          ? correctOptions.filter(l => l !== label)
          : [...correctOptions, label],
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingQ) {
        await api.put(`/quiz/${quizId}/questions/${editingQ}`, form);
      } else {
        await api.post(`/quiz/${quizId}/questions`, form);
      }
      setShowForm(false);
      fetchQuestions();
    } catch { } finally { setSaving(false); }
  };

  const handleDelete = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    await api.delete(`/quiz/${quizId}/questions/${qId}`);
    fetchQuestions();
  };

  const handleBulkUpload = async () => {
    setBulkError('');
    try {
      const parsed = JSON.parse(bulkText);
      await api.post(`/quiz/${quizId}/questions/bulk`, parsed);
      setShowBulk(false);
      setBulkText('');
      fetchQuestions();
    } catch (err) {
      setBulkError(err.response?.data?.message || 'Invalid JSON format.');
    }
  };

  if (!quizId) return <div className="py-10 text-center text-slate-400">No quiz linked to this class.</div>;
  if (loading) return <div className="py-10 text-center text-slate-400">Loading questions…</div>;

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button onClick={openNew} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">+ Add Question</button>
        <button onClick={() => setShowBulk(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-xl hover:bg-slate-50 transition">📋 Bulk JSON Upload</button>
        <a href="/question-template.json" download className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-xl hover:bg-slate-50 transition">⬇ Template</a>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          No questions yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q._id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-start">
              <span className="text-slate-300 font-mono text-sm pt-0.5 w-6 text-right flex-shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm">{q.text}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {q.options.map(opt => (
                    <span key={opt.label} className={`text-xs px-2.5 py-1 rounded-lg border ${
                      q.correctOptions.includes(opt.label)
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      {opt.label}: {opt.text}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  q.type === 'single' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                }`}>{TYPE_BADGE[q.type]}</span>
                <span className="text-xs text-slate-400">{q.marks}pt</span>
                <button onClick={() => openEdit(q)} className="text-xs px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition">Edit</button>
                <button onClick={() => handleDelete(q._id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl my-8">
            <h3 className="font-bold text-slate-900 text-lg mb-4">{editingQ ? 'Edit' : 'Add'} Question</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <textarea
                value={form.text}
                onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                placeholder="Question text"
                required
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
              <div className="flex gap-3">
                {['single', 'multiple'].map(t => (
                  <label key={t} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer text-sm font-medium transition ${
                    form.type === t ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => setForm(p => ({ ...p, type: t, correctOptions: [] }))} className="sr-only" />
                    {t === 'single' ? 'Single Answer' : 'Multiple Answers'}
                  </label>
                ))}
                <div className="flex items-center gap-2 ml-auto">
                  <label className="text-sm text-slate-500">Marks</label>
                  <input
                    type="number"
                    value={form.marks}
                    onChange={e => setForm(p => ({ ...p, marks: Number(e.target.value) }))}
                    min={0}
                    className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 text-center"
                  />
                </div>
              </div>
              <div className="space-y-2">
                {form.options.map((opt, idx) => (
                  <div key={opt.label} className="flex gap-2 items-center">
                    <label className={`flex items-center justify-center w-8 h-8 rounded-lg border cursor-pointer font-mono text-sm font-bold transition flex-shrink-0 ${
                      form.correctOptions.includes(opt.label)
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                    }`}>
                      <input type="checkbox" className="sr-only" checked={form.correctOptions.includes(opt.label)} onChange={() => toggleCorrect(opt.label)} />
                      {opt.label}
                    </label>
                    <input
                      value={opt.text}
                      onChange={e => {
                        const newOpts = [...form.options];
                        newOpts[idx] = { ...newOpts[idx], text: e.target.value };
                        setForm(p => ({ ...p, options: newOpts }));
                      }}
                      placeholder={`Option ${opt.label}`}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">Click the letter badge to mark as correct answer(s).</p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition">
                  {saving ? 'Saving…' : editingQ ? 'Save Changes' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl">
            <h3 className="font-bold text-slate-900 text-lg mb-2">Bulk Upload Questions (JSON)</h3>
            <p className="text-xs text-slate-400 mb-3">Paste a JSON array of questions. Each item needs: text, type, options, correctOptions, marks.</p>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              rows={10}
              placeholder='[{"text":"...","type":"single","options":[{"label":"A","text":"..."},...],"correctOptions":["A"],"marks":1}]'
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none mb-3"
            />
            {bulkError && <p className="text-red-500 text-xs mb-3">{bulkError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowBulk(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleBulkUpload} className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition">Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
