import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

// Sub-tabs
import OverviewTab from './tabs/OverviewTab';
import StudentsTab from './tabs/StudentsTab';
import QuestionsTab from './tabs/QuestionsTab';
import SettingsTab from './tabs/SettingsTab';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'students', label: 'Students' },
  { id: 'questions', label: 'Questions' },
  { id: 'settings', label: 'Settings' },
];

export default function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClass = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/classes/${classId}`);
      setClassData(data);
    } catch {
      navigate('/teacher');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { fetchClass(); }, [fetchClass]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/teacher')} className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="font-bold text-slate-900 text-xl">{classData?.name}</h1>
            <p className="text-xs text-slate-500">{classData?.students?.length || 0} students · {classData?.quizId?.title || 'No quiz'}</p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-6xl mx-auto flex gap-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'overview' && <OverviewTab classData={classData} onRefresh={fetchClass} />}
        {activeTab === 'students' && <StudentsTab classData={classData} onRefresh={fetchClass} />}
        {activeTab === 'questions' && <QuestionsTab classData={classData} onRefresh={fetchClass} />}
        {activeTab === 'settings' && <SettingsTab classData={classData} onRefresh={fetchClass} />}
      </main>
    </div>
  );
}
