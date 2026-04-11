import { useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';

/**
 * useAntiCheat hook
 * Call this inside ExamRoom. Pass attempt info and handlers.
 * @param {Object} options
 * @param {string} options.attemptId - Current attempt ID
 * @param {Function} options.onViolation - Called with (violationType, count, remaining, autoSubmit)
 */
export default function useAntiCheat({ attemptId, onViolation }) {
  const reportingRef = useRef(false);

  const report = useCallback(async (type) => {
    if (!attemptId || reportingRef.current) return;
    reportingRef.current = true;
    try {
      const { data } = await api.post('/student/quiz/violation', { type });
      onViolation(type, data.violationCount, data.remaining, data.autoSubmit);
    } catch {
      // Best-effort
    } finally {
      setTimeout(() => { reportingRef.current = false; }, 1000); // Debounce 1s
    }
  }, [attemptId, onViolation]);

  useEffect(() => {
    if (!attemptId) return;

    // 1. Fullscreen enforcement
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        report('fullscreen_exit');
      }
    };

    // 2. Tab / window switch
    const handleVisibilityChange = () => {
      if (document.hidden) report('tab_switch');
    };
    const handleBlur = () => report('tab_switch');

    // 3. Right-click block
    const handleContextMenu = (e) => {
      e.preventDefault();
      report('right_click');
    };

    // 4. Copy / paste / select block
    const handleCopy = (e) => e.preventDefault();
    const handleCut = (e) => e.preventDefault();
    const handlePaste = (e) => e.preventDefault();
    const handleSelectStart = (e) => e.preventDefault();

    // 5. Keyboard shortcut block
    const handleKeyDown = (e) => {
      const blocked = [
        e.key === 'F12',
        e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J'),
        e.ctrlKey && e.key === 'u',
        e.ctrlKey && e.key === 'c',
        e.ctrlKey && e.key === 'v',
        e.ctrlKey && e.key === 'a',
        e.altKey && e.key === 'Tab',
        e.metaKey,
      ];
      if (blocked.some(Boolean)) {
        e.preventDefault();
        e.stopPropagation();
        report('keyboard_shortcut');
      }
    };

    // 6. Print block
    const handleBeforePrint = (e) => e.preventDefault();

    // Register all
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [attemptId, report]);
}
