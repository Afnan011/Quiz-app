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

  if (!quizId) return <div className="py-10 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">No active quiz linked to this class.</div>;
  if (loading) return <div className="py-10 text-center text-gray-400">Loading questions…</div>;

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button onClick={openNew} className="px-4 py-2 bg-blue-600 border border-transparent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">+ Add Question</button>
        <button onClick={() => setShowBulk(true)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">📋 Bulk JSON Upload</button>
        <a href="/question-template.json" download className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">⬇ Template</a>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
          No questions yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q._id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-start shadow-sm hover:shadow transition-shadow">
              <span className="text-gray-400 font-mono text-sm pt-0.5 w-6 text-right flex-shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{q.text}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {q.options.map(opt => (
                    <span key={opt.label} className={`text-xs px-2.5 py-1 rounded-lg border ${
                      q.correctOptions.includes(opt.label)
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}>
                      {opt.label}: {opt.text}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-2 py-0.5 text-xs rounded-md font-medium border ${
                  q.type === 'single' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-purple-50 border-purple-200 text-purple-700'
                }`}>{TYPE_BADGE[q.type]}</span>
                <span className="text-xs text-gray-400 font-medium">{q.marks}pt</span>
                <button onClick={() => openEdit(q)} className="text-xs px-3 py-1.5 border border-gray-200 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Edit</button>
                <button onClick={() => handleDelete(q._id)} className="text-xs px-3 py-1.5 border border-red-200 bg-red-50 text-red-600 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 w-full max-w-2xl my-8">
            <h3 className="font-bold text-gray-900 text-lg mb-4 tracking-tight">{editingQ ? 'Edit' : 'Add'} Question</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <textarea
                value={form.text}
                onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                placeholder="Question text"
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-shadow"
              />
              <div className="flex gap-3">
                {['single', 'multiple'].map(t => (
                  <label key={t} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-medium transition ${
                    form.type === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                    <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => setForm(p => ({ ...p, type: t, correctOptions: [] }))} className="sr-only" />
                    {t === 'single' ? 'Single Answer' : 'Multiple Answers'}
                  </label>
                ))}
                <div className="flex items-center gap-2 ml-auto text-gray-700">
                  <label className="text-sm font-medium">Marks</label>
                  <input
                    type="number"
                    value={form.marks}
                    onChange={e => setForm(p => ({ ...p, marks: Number(e.target.value) }))}
                    min={0}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </div>
              </div>
              <div className="space-y-2">
                {form.options.map((opt, idx) => (
                  <div key={opt.label} className="flex gap-2 items-center">
                    <label className={`flex items-center justify-center w-8 h-8 rounded-lg border cursor-pointer font-mono text-sm font-bold transition-colors flex-shrink-0 ${
                      form.correctOptions.includes(opt.label)
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100'
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">Click the letter badge to mark as correct answer(s).</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 border border-transparent text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                  {saving ? 'Saving…' : editingQ ? 'Save Changes' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 w-full max-w-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Bulk Upload Questions (JSON)</h3>
            <p className="text-sm text-gray-500 mb-4">Paste a JSON array of questions. Each item requires: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">text</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">type</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">options</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">correctOptions</code>, <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">marks</code>.</p>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              rows={10}
              placeholder='[{"text":"...","type":"single","options":[{"label":"A","text":"..."},...],"correctOptions":["A"],"marks":1}]'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none mb-3 transition-shadow"
            />
            {bulkError && <p className="text-red-600 text-xs font-medium mb-3">{bulkError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowBulk(false)} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleBulkUpload} className="flex-1 py-2 bg-blue-600 border border-transparent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Upload JSON</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
