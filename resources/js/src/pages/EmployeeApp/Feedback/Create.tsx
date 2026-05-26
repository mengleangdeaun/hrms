import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { toast } from 'sonner';
import {
  IconArrowLeft,
  IconMessageHeart,
  IconSend,
  IconThumbUp,
  IconThumbDown,
  IconLoader2,
  IconCheck,
  IconWifiOff,
} from '@tabler/icons-react';
import PageHeader from '@/components/ui/pwa/PageHeader';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { pwaFetch } from '@/lib/pwa-fetch';

// Auto-resize textarea hook
const useAutoResizeTextarea = (value: string) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  return textareaRef;
};

// Character counter component
const CharacterCounter = ({ current, max }: { current: number; max: number }) => {
  const isNearLimit = current > max * 0.8;
  const isOverLimit = current > max;
  return (
    <div className={`text-xs text-right mt-1 transition-colors ${
      isOverLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-gray-400'
    }`}>
      {current}/{max}
    </div>
  );
};

const FeedbackCreate = () => {
  const { t } = useTranslation('pwa');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'positive',
    message: '',
    recommendation: '',
  });
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ message?: string }>({});

  // Character limits
  const MESSAGE_MAX = 1000;
  const RECOMMENDATION_MAX = 500;

  // Auto-resize refs
  const messageTextareaRef = useAutoResizeTextarea(formData.message);
  const recommendationTextareaRef = useAutoResizeTextarea(formData.recommendation);

  // Dirty state for navigation blocking
  const isDirty = !submitted && (formData.message.trim() !== '' || formData.recommendation.trim() !== '');
  
  // Block navigation when form is dirty
  const blocker = useBlocker(isDirty);
  
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmLeave = window.confirm(t('unsaved_changes_warning', 'You have unsaved changes. Are you sure you want to leave?'));
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  // Beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set page title
  useEffect(() => {
    dispatch(setPageTitle(t('feedback', 'Feedback')));
  }, [dispatch, t]);

  // Focus on message field on mount
  useEffect(() => {
    messageTextareaRef.current?.focus();
  }, []);

  const getCookie = useCallback((name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  }, []);

  const validateForm = (): boolean => {
    const errors: { message?: string } = {};
    if (!formData.message.trim()) {
      errors.message = t('feedback_message_required', 'Please enter your feedback message');
    } else if (formData.message.length > MESSAGE_MAX) {
      errors.message = t('message_max_length', 'Message cannot exceed {{max}} characters', { max: MESSAGE_MAX });
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isOffline) {
      toast.error(t('offline_warning_submit', 'You are offline. Please check your internet connection and try again.'));
      return;
    }
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.field-error');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error(t('fix_errors_submit', 'Please fix the errors before submitting'));
      return;
    }

    setLoading(true);
    
    try {
      await pwaFetch('/sanctum/csrf-cookie');
      const response = await pwaFetch('/api/employee-app/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') || '',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success(data.message || t('feedback_thanks', 'Thank you for your feedback!'), {
          icon: <IconCheck className="w-5 h-5" />,
          duration: 4000,
        });
        // Small delay for success animation before navigation
        setTimeout(() => {
          navigate('/employee/profile');
        }, 500);
      } else {
        toast.error(data.message || t('feedback_submit_failed', 'Failed to submit feedback'));
        if (data.errors) {
          setFieldErrors(data.errors);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(t('unable_to_submit', 'Unable to submit at this time. Please try again later.'));
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !loading && !submitted) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, submitted, formData]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#060818] dark:to-[#0a0e2a]">
      <PageHeader
        title={t('company_feedback', 'Company Feedback')}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-primary' width="22" height="22" color="none" fill="none" viewBox="0 0 24 24"><path d="M13.0867 21.3877L13.7321 21.7697L13.0867 21.3877ZM13.6288 20.4718L12.9833 20.0898L13.6288 20.4718ZM10.3712 20.4718L9.72579 20.8539H9.72579L10.3712 20.4718ZM10.9133 21.3877L11.5587 21.0057L10.9133 21.3877ZM2.3806 15.9134L3.07351 15.6264V15.6264L2.3806 15.9134ZM7.78958 18.9915L7.77666 19.7413L7.78958 18.9915ZM5.08658 18.6194L4.79957 19.3123H4.79957L5.08658 18.6194ZM21.6194 15.9134L22.3123 16.2004V16.2004L21.6194 15.9134ZM16.2104 18.9915L16.1975 18.2416L16.2104 18.9915ZM18.9134 18.6194L19.2004 19.3123H19.2004L18.9134 18.6194ZM19.6125 2.7368L19.2206 3.37628L19.6125 2.7368ZM21.2632 4.38751L21.9027 3.99563V3.99563L21.2632 4.38751ZM4.38751 2.7368L3.99563 2.09732V2.09732L4.38751 2.7368ZM2.7368 4.38751L2.09732 3.99563H2.09732L2.7368 4.38751ZM9.40279 19.2098L9.77986 18.5615L9.77986 18.5615L9.40279 19.2098ZM13.7321 21.7697L14.2742 20.8539L12.9833 20.0898L12.4412 21.0057L13.7321 21.7697ZM9.72579 20.8539L10.2679 21.7697L11.5587 21.0057L11.0166 20.0898L9.72579 20.8539ZM12.4412 21.0057C12.2485 21.3313 11.7515 21.3313 11.5587 21.0057L10.2679 21.7697C11.0415 23.0767 12.9585 23.0767 13.7321 21.7697L12.4412 21.0057ZM10.5 2.75H13.5V1.25H10.5V2.75ZM21.25 10.5V11.5H22.75V10.5H21.25ZM2.75 11.5V10.5H1.25V11.5H2.75ZM1.25 11.5C1.25 12.6546 1.24959 13.5581 1.29931 14.2868C1.3495 15.0223 1.45323 15.6344 1.68769 16.2004L3.07351 15.6264C2.92737 15.2736 2.84081 14.8438 2.79584 14.1847C2.75041 13.5189 2.75 12.6751 2.75 11.5H1.25ZM7.8025 18.2416C6.54706 18.2199 5.88923 18.1401 5.37359 17.9265L4.79957 19.3123C5.60454 19.6457 6.52138 19.7197 7.77666 19.7413L7.8025 18.2416ZM1.68769 16.2004C2.27128 17.6093 3.39066 18.7287 4.79957 19.3123L5.3736 17.9265C4.33223 17.4951 3.50486 16.6678 3.07351 15.6264L1.68769 16.2004ZM21.25 11.5C21.25 12.6751 21.2496 13.5189 21.2042 14.1847C21.1592 14.8438 21.0726 15.2736 20.9265 15.6264L22.3123 16.2004C22.5468 15.6344 22.6505 15.0223 22.7007 14.2868C22.7504 13.5581 22.75 12.6546 22.75 11.5H21.25ZM16.2233 19.7413C17.4786 19.7197 18.3955 19.6457 19.2004 19.3123L18.6264 17.9265C18.1108 18.1401 17.4529 18.2199 16.1975 18.2416L16.2233 19.7413ZM20.9265 15.6264C20.4951 16.6678 19.6678 17.4951 18.6264 17.9265L19.2004 19.3123C20.6093 18.7287 21.7287 17.6093 22.3123 16.2004L20.9265 15.6264ZM13.5 2.75C15.1512 2.75 16.337 2.75079 17.2619 2.83873C18.1757 2.92561 18.7571 3.09223 19.2206 3.37628L20.0044 2.09732C19.2655 1.64457 18.4274 1.44279 17.4039 1.34547C16.3915 1.24921 15.1222 1.25 13.5 1.25V2.75ZM22.75 10.5C22.75 8.87781 22.7508 7.6085 22.6545 6.59611C22.5572 5.57256 22.3554 4.73445 21.9027 3.99563L20.6237 4.77938C20.9078 5.24291 21.0744 5.82434 21.1613 6.73809C21.2492 7.663 21.25 8.84876 21.25 10.5H22.75ZM19.2206 3.37628C19.7925 3.72672 20.2733 4.20752 20.6237 4.77938L21.9027 3.99563C21.4286 3.22194 20.7781 2.57144 20.0044 2.09732L19.2206 3.37628ZM10.5 1.25C8.87781 1.25 7.6085 1.24921 6.59611 1.34547C5.57256 1.44279 4.73445 1.64457 3.99563 2.09732L4.77938 3.37628C5.24291 3.09223 5.82434 2.92561 6.73809 2.83873C7.663 2.75079 8.84876 2.75 10.5 2.75V1.25ZM2.75 10.5C2.75 8.84876 2.75079 7.663 2.83873 6.73809C2.92561 5.82434 3.09223 5.24291 3.37628 4.77938L2.09732 3.99563C1.64457 4.73445 1.44279 5.57256 1.34547 6.59611C1.24921 7.6085 1.25 8.87781 1.25 10.5H2.75ZM3.99563 2.09732C3.22194 2.57144 2.57144 3.22194 2.09732 3.99563L3.37628 4.77938C3.72672 4.20752 4.20752 3.72672 4.77938 3.37628L3.99563 2.09732ZM11.0166 20.0898C10.8136 19.7468 10.6354 19.4441 10.4621 19.2063C10.2795 18.9559 10.0702 18.7304 9.77986 18.5615L9.02572 19.8582C9.07313 19.8857 9.13772 19.936 9.24985 20.0898C9.37122 20.2564 9.50835 20.4865 9.72579 20.8539L11.0166 20.0898ZM7.77666 19.7413C8.21575 19.7489 8.49387 19.7545 8.70588 19.7779C8.90399 19.7999 8.98078 19.832 9.02572 19.8582L9.77986 18.5615C9.4871 18.3912 9.18246 18.3215 8.87097 18.287C8.57339 18.2541 8.21375 18.2487 7.8025 18.2416L7.77666 19.7413ZM14.2742 20.8539C14.4916 20.4865 14.6287 20.2564 14.7501 20.0898C14.8622 19.936 14.9268 19.8857 14.9742 19.8582L14.2201 18.5615C13.9298 18.7304 13.7204 18.9559 13.5379 19.2063C13.3646 19.4441 13.1864 19.7468 12.9833 20.0898L14.2742 20.8539ZM16.1975 18.2416C15.7862 18.2487 15.4266 18.2541 15.129 18.287C14.8175 18.3215 14.5129 18.3912 14.2201 18.5615L14.9742 19.8582C15.0192 19.832 15.096 19.7999 15.2941 19.7779C15.5061 19.7545 15.7842 19.7489 16.2233 19.7413L16.1975 18.2416Z" fill="currentColor"></path><path opacity="0.5" d="M10.9901 14.3082L11.435 13.7045H11.435L10.9901 14.3082ZM12 8.10615L11.4641 8.63086C11.6052 8.77495 11.7983 8.85615 12 8.85615C12.2017 8.85615 12.3948 8.77495 12.5359 8.63086L12 8.10615ZM13.0099 14.3082L12.565 13.7045L12.565 13.7045L13.0099 14.3082ZM12 14.8103L12 14.0603H12L12 14.8103ZM11.435 13.7045C10.7914 13.2302 9.96746 12.5568 9.31176 11.808C8.63279 11.0325 8.25 10.3064 8.25 9.71476H6.75C6.75 10.8757 7.44886 11.9574 8.18323 12.7961C8.94088 13.6614 9.86191 14.4085 10.5451 14.912L11.435 13.7045ZM8.25 9.71476C8.25 8.60703 8.74454 8.02373 9.25333 7.83348C9.77052 7.6401 10.5951 7.74331 11.4641 8.63086L12.5359 7.58145C11.38 6.40091 9.95456 5.96985 8.72797 6.42849C7.49299 6.89028 6.75 8.14533 6.75 9.71476H8.25ZM13.4549 14.912C14.1381 14.4085 15.0591 13.6614 15.8168 12.7961C16.5511 11.9574 17.25 10.8758 17.25 9.71475H15.75C15.75 10.3064 15.3672 11.0326 14.6882 11.808C14.0325 12.5568 13.2086 13.2302 12.565 13.7045L13.4549 14.912ZM17.25 9.71475C17.25 8.14532 16.507 6.89027 15.272 6.42849C14.0454 5.96985 12.62 6.40091 11.4641 7.58145L12.5359 8.63086C13.4049 7.74331 14.2295 7.6401 14.7467 7.83348C15.2555 8.02373 15.75 8.60702 15.75 9.71475H17.25ZM10.5451 14.912C10.9368 15.2007 11.3752 15.5603 12 15.5603L12 14.0603C11.9852 14.0603 11.9682 14.0626 11.899 14.0252C11.8008 13.972 11.678 13.8836 11.435 13.7045L10.5451 14.912ZM12.565 13.7045C12.322 13.8836 12.1992 13.972 12.101 14.0252C12.0318 14.0626 12.0148 14.0603 12 14.0603L12 15.5603C12.6248 15.5603 13.0632 15.2007 13.4549 14.912L12.565 13.7045Z" fill="currentColor"></path></svg>}
      />

      <div className="flex-1 overflow-y-auto pb-safe">
        <div className="p-4 space-y-6">
          {/* Offline banner */}
          {isOffline && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center gap-3 animate-in slide-in-from-top-2">
              <IconWifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300 flex-1">
                {t('offline_banner_feedback', "You're offline. Please reconnect to submit feedback.")}
              </p>
            </div>
          )}

          {/* Hero card */}
          <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/10 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-xl shadow-inner">
                <IconMessageHeart className="text-primary w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('your_voice_matters', 'Your Voice Matters')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('feedback_anonymous_desc', 'Your feedback is completely anonymous and helps us improve.')}</p>
              </div>
            </div>
          </div>

          {/* Feedback type selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1 flex items-center gap-1">
              {t('categorize_feedback', 'How would you categorize your feedback?')} <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'positive' })}
                className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95 touch-manipulation ${
                  formData.type === 'positive'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-600 shadow-md shadow-green-500/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-500 hover:border-green-300 dark:hover:border-green-700'
                }`}
                aria-pressed={formData.type === 'positive'}
              >
                <IconThumbUp 
                  size={32} 
                  className={`transition-all duration-200 ${formData.type === 'positive' ? 'scale-110 drop-shadow-sm' : ''}`} 
                  strokeWidth={1.5}
                />
                <span className="text-xs font-semibold uppercase tracking-wide">{t('positive', 'Positive')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'negative' })}
                className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95 touch-manipulation ${
                  formData.type === 'negative'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600 shadow-md shadow-red-500/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-500 hover:border-red-300 dark:hover:border-red-700'
                }`}
                aria-pressed={formData.type === 'negative'}
              >
                <IconThumbDown 
                  size={32} 
                  className={`transition-all duration-200 ${formData.type === 'negative' ? 'scale-110 drop-shadow-sm' : ''}`} 
                  strokeWidth={1.5}
                />
                <span className="text-xs font-semibold uppercase tracking-wide">{t('negative', 'Negative')}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Message field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('feedback_message', 'Feedback Message')} <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400">{t('required', 'Required')}</span>
              </div>
              <Textarea
                ref={messageTextareaRef}
                className={`w-full px-4 py-3 rounded-xl border transition-all resize-none bg-white dark:bg-gray-800/70 focus:ring-2 focus:ring-primary/30 ${
                  fieldErrors.message ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700'
                }`}
                placeholder={t('feedback_placeholder', "Tell us what's on your mind...")}
                value={formData.message}
                onChange={(e) => {
                  const newValue = e.target.value.slice(0, MESSAGE_MAX);
                  setFormData({ ...formData, message: newValue });
                  if (fieldErrors.message && newValue.trim()) {
                    setFieldErrors({ ...fieldErrors, message: undefined });
                  }
                }}
                disabled={loading || submitted}
                maxLength={MESSAGE_MAX}
                rows={4}
                aria-invalid={!!fieldErrors.message}
                aria-describedby={fieldErrors.message ? 'message-error' : undefined}
              />
              {fieldErrors.message && (
                <p id="message-error" className="text-sm text-red-500 mt-1 animate-in slide-in-from-top-1">
                  {fieldErrors.message}
                </p>
              )}
              <CharacterCounter current={formData.message.length} max={MESSAGE_MAX} />
            </div>

            {/* Recommendation field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('recommendation', 'Recommendation')}
                </label>
                <span className="text-xs text-gray-400">{t('optional', 'Optional')}</span>
              </div>
              <Textarea
                ref={recommendationTextareaRef}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 transition-all resize-none bg-white dark:bg-gray-800/70 focus:ring-2 focus:ring-primary/30"
                placeholder={t('recommendation_placeholder', "Any suggestions for improvement? We'd love to hear your ideas.")}
                value={formData.recommendation}
                onChange={(e) => {
                  const newValue = e.target.value.slice(0, RECOMMENDATION_MAX);
                  setFormData({ ...formData, recommendation: newValue });
                }}
                disabled={loading || submitted}
                maxLength={RECOMMENDATION_MAX}
                rows={3}
              />
              <CharacterCounter current={formData.recommendation.length} max={RECOMMENDATION_MAX} />
            </div>

            {/* Anonymous note */}
            <div className="bg-gray-100/50 dark:bg-gray-800/30 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                 {t('anonymous_note', 'All feedback is anonymous. Your identity will never be shared.')}
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || submitted || isOffline}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 touch-manipulation mt-2"
            >
              {loading ? (
                <>
                  <IconLoader2 className="w-5 h-5 animate-spin" />
                  <span>{t('submitting', 'Submitting...')}</span>
                </>
              ) : submitted ? (
                <>
                  <IconCheck className="w-5 h-5" />
                  <span>{t('submitted', 'Submitted!')}</span>
                </>
              ) : (
                <>
                  <IconSend className="w-5 h-5" />
                  <span>{t('submit_feedback', 'Submit Feedback')}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackCreate;