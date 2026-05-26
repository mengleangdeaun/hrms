import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    IconArrowLeft, IconSend, IconDeviceFloppy, IconPhoto, IconPaperclip, IconUpload, IconX, IconCheck,
    IconFile, IconInfoCircle, IconCircleCheck, IconAlertTriangle, IconAlertOctagon, IconClock, IconEye, IconTrash
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { FileUpload } from '@/components/ui/file-upload';
import { isImage, isPDF, isImageExt, isPDFExt, formatBytes } from '@/lib/file-utils';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';
import { PDFPreviewModal } from '@/components/ui/pdf-preview-modal';
import { FileIcon } from '@/components/illustrations/FileExtension';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomQuillEditor } from '@/components/ui/custom-quill-editor';
import { cn } from '@/lib/utils';

// Local Components/Hooks/Types
import { AnnouncementFormData } from './types';
import { useAnnouncement, useAnnouncementMutation, useAnnouncementDropdowns } from './hooks/useAnnouncementQueries';
import { Card, Label, Toggle } from './components/FormElements';
import { PwaPreview } from './components/PwaPreview';
import { TargetingSection } from './components/TargetingSection';
import MediaSelector, { MediaFile } from '@/components/MediaSelector';
import { CropperModal } from '../../CRM/TmaPortal/components/CropperModal';
import { AspectRatioMode } from '../../CRM/TmaPortal/types/broadcast';
import { Area } from 'react-easy-crop';

const defaultForm: AnnouncementFormData = {
    title: '', type: 'info', short_description: '', content: '',
    start_date: '', end_date: '', is_featured: false,
    targeting_type: '', target_ids: [], published_at: '', status: 'draft',
    is_published: true, send_notification: true, send_telegram: false,
    pwa_title: '', pwa_display_type: 'none', pwa_action_label: '', pwa_action_url: '', 
    has_pwa_action: true, pwa_show_title: true, pwa_show_once: true,
};

const toDate = (val: string): Date | undefined => {
    if (!val) return undefined;
    const d = dayjs(val);
    return d.isValid() ? d.toDate() : undefined;
};

const toStr = (d: Date | undefined): string => d ? dayjs(d).format('YYYY-MM-DD') : '';
const toFullStr = (val: any): string => val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '';

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

// ── Skeleton ─────────────────────────────────────────────────────────────────
const FormSkeleton = () => (
    <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-1.5">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3.5 w-64 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
                <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            </div>
            <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        </div>
    </div>
);

export default function AnnouncementForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    // TanStack Queries
    const { data: announcementData, isLoading: isLoadingForm } = useAnnouncement(id);
    const { data: dropdownsData } = useAnnouncementDropdowns();
    const mutation = useAnnouncementMutation(id);

    const dropdowns = useMemo(() => ({
        branches: dropdownsData?.branches || [],
        departments: dropdownsData?.departments || [],
        employees: dropdownsData?.employees || [],
    }), [dropdownsData]);

    // Form State
    const [form, setForm] = useState<AnnouncementFormData>(defaultForm);
    const [publishMethod, setPublishMethod] = useState<'now' | 'schedule'>('now');
    const [publishTime, setPublishTime] = useState<string>(dayjs().add(15, 'minute').format('HH:mm'));
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('basic');

    // Media State
    const [featuredImage, setFeaturedImage] = useState<File | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [preexistingImage, setPreexistingImage] = useState<string | null>(null);
    const [preexistingAttachments, setPreexistingAttachments] = useState<any[]>([]);
    const [stagedFile, setStagedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [heroUploadProgress, setHeroUploadProgress] = useState<number>(0);
    
    // Filtering for targeting
    const [filterBranchId, setFilterBranchId] = useState<string>('all');
    const [filterDeptId, setFilterDeptId] = useState<string>('all');

    // Media Selector & Cropper States
    const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);
    const [mediaSelectorType, setMediaSelectorType] = useState<'hero' | 'attachment'>('hero');
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('landscape');
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessingCrop, setIsProcessingCrop] = useState(false);

    // Preview Logic for Attachments
    const [previewTarget, setPreviewTarget] = useState<{ file?: File; url?: string; name: string; ext: string } | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!previewTarget) {
            setPreviewUrl(null);
            return;
        }
        if (previewTarget.file) {
            const url = URL.createObjectURL(previewTarget.file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (previewTarget.url) {
            const u = previewTarget.url;
            const finalUrl = (u.startsWith('http') || u.startsWith('/storage') || u.startsWith('blob:')) 
                ? u 
                : `/storage/${u}`;
            setPreviewUrl(finalUrl);
        }
    }, [previewTarget]);

    // ── Sync Data on Load ────────────────────────────────────────────────────
    useEffect(() => {
        if (announcementData) {
            setForm({
                ...defaultForm,
                ...announcementData,
                start_date: announcementData.start_date ? dayjs(announcementData.start_date).format('YYYY-MM-DD') : '',
                end_date: announcementData.end_date ? dayjs(announcementData.end_date).format('YYYY-MM-DD') : '',
                published_at: announcementData.published_at ? dayjs(announcementData.published_at).format('YYYY-MM-DD HH:mm:ss') : '',
                is_published: Boolean(announcementData.is_published),
                pwa_show_once: announcementData.pwa_show_once !== false,
            });

            if (announcementData.published_at && dayjs(announcementData.published_at).isAfter(dayjs())) {
                setPublishMethod('schedule');
                setPublishTime(dayjs(announcementData.published_at).format('HH:mm'));
            }

            setPreexistingImage(announcementData.featured_image_url || null);
            setPreexistingAttachments(Array.isArray(announcementData.attachments) ? announcementData.attachments : []);
            
            if (announcementData.pwa_display_type && announcementData.pwa_display_type !== 'none') {
                setActiveTab('mobile');
            } else {
                setActiveTab('basic');
            }
        }
    }, [announcementData]);

    // ── Helper: Set Minimum Future Time ──────────────────────────────────────
    const setFutureTimeDefaults = (date: string) => {
        if (dayjs(date).isSame(dayjs(), 'day')) {
            const minTime = dayjs().add(15, 'minute').format('HH:mm');
            setPublishTime(minTime);
        }
    };

    // ── Real-time Schedule Validation ────────────────────────────────────────
    useEffect(() => {
        if (publishMethod === 'schedule' && form.published_at) {
            const scheduledTime = dayjs(`${form.published_at} ${publishTime}`);
            const minLeadTime = dayjs().add(14, 'minute'); // 14 to be safe against tiny lags
            
            if (scheduledTime.isBefore(minLeadTime)) {
                setScheduleError('Scheduled time must be at least 15 minutes in the future');
            } else {
                setScheduleError(null);
            }
        } else {
            setScheduleError(null);
        }
    }, [form.published_at, publishTime, publishMethod]);

    const set = (key: keyof AnnouncementFormData, value: any) => setForm(f => ({ ...f, [key]: value }));

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        if (val === 'basic') {
            setForm(f => ({
                ...f,
                pwa_display_type: 'none',
            }));
        } else if (val === 'mobile') {
            setForm(f => ({
                ...f,
                pwa_display_type: f.pwa_display_type === 'none' ? 'top_banner' : f.pwa_display_type,
            }));
        }
        setFilterBranchId('all');
        setFilterDeptId('all');
    };

    const handleSubmit = async (status: 'draft' | 'published') => {
        const isPureImage = form.pwa_display_type !== 'none' && !form.pwa_show_title;
        const hasSomeTitle = form.title.trim() || form.pwa_title.trim();
        
        if (!hasSomeTitle) {
            return toast.error('Either Headline or PWA Title is required');
        }
        if (!form.targeting_type) {
            return toast.error('Please select a Targeting Scope (e.g., Specific Branches, All Employees)');
        }
        if (form.targeting_type !== 'all' && form.target_ids.length === 0) {
            return toast.error(`Please select specific targets for ${form.targeting_type}`);
        }
        if (publishMethod === 'schedule' && scheduleError) return toast.error(scheduleError);
        
        try {
            const formData = new FormData();
            let finalPublishedAt = form.published_at;
            let finalIsPublished = form.is_published;
            
            let submitTitle = form.title;
            // Only generate a fallback if truly NO title exists at all (Standard or PWA)
            if (!submitTitle.trim() && !form.pwa_title.trim()) {
                submitTitle = `Visual Announcement (${dayjs().format('MMM D, YYYY')})`;
            }

            if (status === 'published') {
                finalIsPublished = true;
                if (publishMethod === 'now') {
                    finalPublishedAt = ''; // Let backend use server's now() to avoid timezone mismatch
                } else if (form.published_at) {
                    // If published_at already contains a time (my previous UI update), use as is. 
                    // Otherwise append publishTime if it was just a date part.
                    const needsTime = form.published_at.length <= 10;
                    finalPublishedAt = dayjs(needsTime ? `${form.published_at} ${publishTime}` : form.published_at).format('YYYY-MM-DD HH:mm:ss');
                }
            } else {
                // For drafts or if not publishing, we might want to clear the date if not scheduling
                if (publishMethod === 'now') finalPublishedAt = '';
            }

            const submitStatus = (isEdit && status === 'draft') ? form.status : status;
            
            // Map form to FormData
            Object.entries({ ...form, title: submitTitle, status: submitStatus, published_at: finalPublishedAt, is_published: finalIsPublished }).forEach(([key, value]) => {
                if (key === 'target_ids') {
                    if (Array.isArray(value)) value.forEach((val, i) => formData.append(`target_ids[${i}]`, String(val)));
                } else if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                } else if (key === 'published_at' || key === 'start_date' || key === 'end_date') {
                    // IMPORTANT: Only append if NOT empty to satisfy Laravel nullable|date
                    if (value) formData.append(key, String(value));
                } else {
                    formData.append(key, String(value ?? ''));
                }
            });

            // Files
            if (featuredImage) {
                formData.append('featured_image', featuredImage);
            } else {
                formData.append('preexisting_featured_image', preexistingImage || '');
            }
            
            if (attachments.length > 0) {
                attachments.forEach((file, i) => formData.append(`attachments[${i}]`, file));
            }
            
            if (preexistingAttachments.length > 0) {
                preexistingAttachments.forEach((file, i) => formData.append(`preexisting_attachments[${i}]`, file.url || file.path || file));
            } else {
                formData.append('preexisting_attachments', '[]');
            }

            await mutation.mutateAsync(formData);
            toast.success(isEdit ? 'Updated!' : (status === 'published' ? 'Published!' : 'Saved draft'));
            navigate('/hr/announcements');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Save failed');
        }
    };

    const onApplyCrop = async () => {
        if (!tempImageUrl || !croppedAreaPixels) return;
        setIsProcessingCrop(true);
        try {
            const image = new Image();
            image.src = tempImageUrl;
            await new Promise((res) => (image.onload = res));
            const canvas = document.createElement('canvas');
            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
            }
            canvas.toBlob((blob) => {
                if (blob) {
                    setFeaturedImage(new File([blob], 'cropped.jpg', { type: 'image/jpeg' }));
                    setPreexistingImage(null);
                    setCropModalOpen(false);
                }
            }, 'image/jpeg', 0.9);
        } finally { setIsProcessingCrop(false); }
    };

    if (isLoadingForm) return <FormSkeleton />;

    return (
        <div>
            {/* Sticky Action Header */}
            <div className="z-[40] -mx-6 px-0 py-4 mb-4 bg-gray-50/80 dark:bg-[#060818]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-0 px-6  mx-auto">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 hover:border-primary/50 transition-all text-gray-500 shadow-sm"><IconArrowLeft className="w-5 h-5" /></button>
                        <div>
                            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 tracking-tight">{isEdit ? 'Update Announcement' : 'Draft New Announcement'}</h1>
                            <p className="text-[12px] text-gray-400 dark:text-gray-500">{isEdit ? 'Modify existing communication' : 'Create a new broadcast for your employees'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => handleSubmit('draft')} isLoading={mutation.isPending} className="px-5 h-11 border-gray-200 dark:border-gray-800 shadow-sm hover:bg-gray-50 bg-white dark:bg-black font-bold">
                            <IconDeviceFloppy className="w-4.5 h-4.5 mr-2" /> {isEdit ? 'Save Changes' : 'Save Draft'}
                        </Button>
                        <Button 
                            onClick={() => handleSubmit('published')} 
                            isLoading={mutation.isPending} 
                            disabled={publishMethod === 'schedule' && !!scheduleError}
                            className="px-6 h-11 font-black bg-primary hover:bg-primary/90 text-white active:scale-95 transition-transform"
                        >
                            <IconSend className="w-4.5 h-4.5 mr-2" />
                            {form.is_published && isEdit ? 'Update Broadcast' : (publishMethod === 'now' ? 'Publish Now' : 'Schedule')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mx-auto px-0">
                <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* ── Left Sidebar: Strategy & Channel ── */}
                        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-[5.5rem]">
                            <Card title="Broadcast Channel">
                                <TabsList className="grid grid-cols-2 lg:grid-cols-1 w-full bg-transparent gap-2 h-auto">
                                    <TabsTrigger value="basic" className="px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] transition-all flex items-center justify-start gap-3 border border-transparent dark:border-gray-800 rounded-lg uppercase tracking-wider">
                                        <div className="flex items-center justify-center shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" color="none" fill="none" viewBox="0 0 24 24"><path d="M18.7491 9.70957V9.00497C18.7491 5.13623 15.7274 2 12 2C8.27256 2 5.25087 5.13623 5.25087 9.00497V9.70957C5.25087 10.5552 5.00972 11.3818 4.5578 12.0854L3.45036 13.8095C2.43882 15.3843 3.21105 17.5249 4.97036 18.0229C9.57274 19.3257 14.4273 19.3257 19.0296 18.0229C20.789 17.5249 21.5612 15.3843 20.5496 13.8095L19.4422 12.0854C18.9903 11.3818 18.7491 10.5552 18.7491 9.70957Z" stroke="currentColor" stroke-width="1.5"></path><path opacity="0.5" d="M7.5 19C8.15503 20.7478 9.92246 22 12 22C14.0775 22 15.845 20.7478 16.5 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg></div>
                                        Standard Notification
                                    </TabsTrigger>
                                    <TabsTrigger value="mobile" className="px-4 py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] transition-all flex items-center justify-start gap-3 border border-transparent dark:border-gray-800 rounded-lg uppercase tracking-wider">
                                        <div className="flex items-center justify-center shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" color="none" fill="none" viewBox="0 0 24 24"><path d="M4 10C4 6.22876 4 4.34315 5.17157 3.17157C6.34315 2 8.22876 2 12 2C15.7712 2 17.6569 2 18.8284 3.17157C20 4.34315 20 6.22876 20 10V14C20 17.7712 20 19.6569 18.8284 20.8284C17.6569 22 15.7712 22 12 22C8.22876 22 6.34315 22 5.17157 20.8284C4 19.6569 4 17.7712 4 14V10Z" stroke="currentColor" stroke-width="1.5"></path><path opacity="0.5" d="M15 19H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M16.7481 2.37793L16.664 2.5041C15.908 3.63818 15.5299 4.20525 14.9778 4.54836C14.868 4.61658 14.7539 4.67764 14.6362 4.73115C14.0444 5.00025 13.3629 5.00025 11.9999 5.00025C10.6369 5.00025 9.95539 5.00025 9.36363 4.73115C9.24596 4.67764 9.13187 4.61658 9.02207 4.54836C8.46992 4.20524 8.09189 3.6382 7.33582 2.5041L7.25171 2.37793" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg></div>
                                        PWA Distribution
                                    </TabsTrigger>
                                </TabsList>
                            </Card>

                            <TargetingSection 
                                form={form} set={set} dropdowns={dropdowns}
                                filterBranchId={filterBranchId} setFilterBranchId={setFilterBranchId}
                                filterDeptId={filterDeptId} setFilterDeptId={setFilterDeptId}
                            />
                        </div>

                        {/* ── Right Column: Content & Preview ── */}
                        <div className="lg:col-span-9 space-y-6">
                            <TabsContent value="basic" className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                                    <div className="xl:col-span-8 space-y-6">
                                        <Card title="Announcement Content">
                                            <div className="space-y-5">
                                                <div>
                                                    <Label>Headline / Title</Label>
                                                    <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Main notification title..." className="h-12 text-base font-bold bg-white dark:bg-black border-gray-100 dark:border-gray-800 focus:ring-primary/20" />
                                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Clear and concise headlines convert better.</p>
                                                </div>
                                                <div>
                                                    <Label>Snippet</Label>
                                                    <Textarea value={form.short_description} onChange={e => set('short_description', e.target.value)} rows={2} placeholder="Brief summary for list previews..." className="w-full px-4 py-3 text-sm resize-none" />
                                                </div>
                                                <div>
                                                    <Label>Detailed Body</Label>
                                                    <CustomQuillEditor variant='default' value={form.content} onChange={v => set('content', v)} placeholder="Type the full message here..." />
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    <div className="xl:col-span-4 space-y-6">
                                        <Card title="Publishing Metadata">
                                            <div className="space-y-5">
                                                <div>
                                                    <Label>Priority</Label>
                                                    <Select value={form.type} onValueChange={v => set('type', v)}>
                                                        <SelectTrigger className="h-11 border-gray-100 dark:border-gray-800"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="info">Information</SelectItem>
                                                            <SelectItem value="success">Success</SelectItem>
                                                            <SelectItem value="warning">Warning</SelectItem>
                                                            <SelectItem value="danger">Urgent</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Toggle checked={form.is_published} onChange={v => set('is_published', v)} label="Active" sublabel="Live on dashboard" activeColor="bg-green-500" />
                                                
                                                <div>
                                                    <Label>Visibility Period</Label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <DatePicker align="end" value={toDate(form.start_date)} onChange={d => set('start_date', toStr(d))} placeholder="Starts on" />
                                                        <DatePicker align="end" value={toDate(form.end_date)} onChange={d => set('end_date', toStr(d))} placeholder="Expires on" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label>Publication Strategy</Label>
                                                    <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                                                        <button type="button" onClick={() => setPublishMethod('now')} className={cn("flex-1 py-1.5 text-xs font-black rounded-md transition-all", publishMethod === 'now' ? "bg-white dark:bg-gray-800 text-primary shadow-sm" : "text-gray-400")}>IMMEDIATE</button>
                                                        <button type="button" onClick={() => setPublishMethod('schedule')} className={cn("flex-1 py-1.5 text-xs font-black rounded-md transition-all", publishMethod === 'schedule' ? "bg-white dark:bg-gray-800 text-primary shadow-sm" : "text-gray-400")}>SCHEDULED</button>
                                                    </div>
                                                </div>

                                                {publishMethod === 'schedule' && (
                                                    <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <Label className="mb-0">Schedule Date & Time</Label>
                                                                {form.published_at && (
                                                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                                        {dayjs(form.published_at).format('MMM D, HH:mm')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="flex-1">
                                                                    <DatePicker 
                                                                        align="start"
                                                                        value={toDate(form.published_at)} 
                                                                        onChange={d => {
                                                                            if (!d) {
                                                                                set('published_at', '');
                                                                                return;
                                                                            }
                                                                            const datePart = dayjs(d).format('YYYY-MM-DD');
                                                                            
                                                                            // Immediate Date Validation
                                                                            if (dayjs(datePart).isBefore(dayjs(), 'day')) {
                                                                                toast.error("Announcement date cannot be in the past");
                                                                                // Reset to today if past
                                                                                const today = dayjs().format('YYYY-MM-DD');
                                                                                const timePart = dayjs().add(15, 'minute').format('HH:mm');
                                                                                set('published_at', `${today} ${timePart}:00`);
                                                                                return;
                                                                            }

                                                                            let timePart = form.published_at ? dayjs(form.published_at).format('HH:mm') : '00:00';
                                                                            
                                                                            // Auto-set 15 mins if today
                                                                            if (dayjs(datePart).isSame(dayjs(), 'day')) {
                                                                                timePart = dayjs().add(15, 'minute').format('HH:mm');
                                                                                toast.info("Time auto-set to 15 minutes from now");
                                                                            }
                                                                            
                                                                            set('published_at', `${datePart} ${timePart}:00`);
                                                                        }} 
                                                                        placeholder="Pick date" 
                                                                    />
                                                                </div>
                                                                <div className="w-[120px]">
                                                                    <TimePicker 
                                                                        key={form.published_at || 'empty'}
                                                                        value={form.published_at ? dayjs(form.published_at).format('HH:mm') : '00:00'} 
                                                                        onChange={t => {
                                                                            const datePart = form.published_at ? dayjs(form.published_at).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
                                                                            const candidate = dayjs(`${datePart} ${t}`);
                                                                            const now = dayjs();
                                                                            
                                                                            // Immediate Validation
                                                                            if (candidate.isBefore(now)) {
                                                                                toast.error("Time cannot be in the past");
                                                                                const validTime = dayjs().add(15, 'minute').format('HH:mm');
                                                                                set('published_at', `${datePart} ${validTime}:00`);
                                                                                return;
                                                                            }
                                                                            
                                                                            set('published_at', `${datePart} ${t}:00`);
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 mt-2 font-medium">Validation: Announcements must be scheduled for the future.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>

                                        <Card title="Attachments">
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-2">
                                                    {[...preexistingAttachments, ...attachments].map((file: any, i) => {
                                                        const isNew = i >= preexistingAttachments.length;
                                                        // MediaFile (Library) objects have .extension, JS File objects have it in .name
                                                        const name = file.name || (file.url ? file.url.split('/').pop() : 'document');
                                                        const ext = (file.extension || name.split('.').pop() || '').toLowerCase();
                                                        const size = file.size || file.size_bytes || 0;
                                                        const url = !isNew ? (file.url || file.path) : null;

                                                        return (
                                                            <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-white/5 rounded-xl text-[10px] font-black border border-gray-100 dark:border-gray-800 group hover:border-primary/30 transition-all">
                                                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                                    <FileIcon ext={ext} className="w-8 h-8 shrink-0 shadow-sm" />
                                                                    <div className="flex flex-col truncate">
                                                                        <span className="truncate text-gray-700 dark:text-gray-300 text-[11px]">{name}</span>
                                                                        {size > 0 && <span className="text-[9px] text-gray-400 font-medium">{formatBytes(size)}</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setPreviewTarget({ 
                                                                                file: isNew ? file : undefined, 
                                                                                url: url, 
                                                                                name: name,
                                                                                ext: ext 
                                                                            });
                                                                            setPreviewOpen(true);
                                                                        }}
                                                                        className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors text-primary shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
                                                                    >
                                                                        <IconEye className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => i < preexistingAttachments.length ? setPreexistingAttachments(prev => prev.filter((_, idx) => idx !== i)) : setAttachments(prev => prev.filter((_, idx) => idx !== (i - preexistingAttachments.length)))} 
                                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-red-500 shadow-sm border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                                                                    >
                                                                        <IconTrash className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="text-[10px] font-black h-11 w-full bg-white dark:bg-black border-dashed border-gray-200 dark:border-gray-800 hover:border-primary/50" 
                                                        onClick={() => { setMediaSelectorType('attachment'); setMediaSelectorOpen(true); }}
                                                    >
                                                        <IconPhoto className="w-3.5 h-3.5 mr-2" /> SELECT FROM LIBRARY
                                                    </Button>
                                                    
                                                    <div className="relative">
                                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-800" /></div>
                                                        <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-white dark:bg-[#0c0c0c] px-2 text-gray-400">OR</span></div>
                                                    </div>

                                                    <div className="relative group">
                                                        <FileUpload 
                                                            value={stagedFile}
                                                            progress={uploadProgress}
                                                            onChange={(file) => {
                                                                setStagedFile(file);
                                                                // Simulate an 'Uploading/Scanning' phase to provide the requested Uploading State feel
                                                                if (file) {
                                                                    setUploadProgress(10);
                                                                    let p = 10;
                                                                    const interval = setInterval(() => {
                                                                        p += Math.floor(Math.random() * 20) + 10;
                                                                        if (p >= 100) {
                                                                            setUploadProgress(100);
                                                                            clearInterval(interval);
                                                                            setTimeout(() => setUploadProgress(0), 1000);
                                                                        } else {
                                                                            setUploadProgress(p);
                                                                        }
                                                                    }, 150);
                                                                }
                                                            }}
                                                            onPreview={() => {
                                                                if (stagedFile) {
                                                                    setPreviewTarget({ 
                                                                        file: stagedFile, 
                                                                        name: stagedFile.name,
                                                                        ext: stagedFile.name.split('.').pop() || '' 
                                                                    });
                                                                    setPreviewOpen(true);
                                                                }
                                                            }}
                                                            label="Drop to Stage File"
                                                            description="JPG, PNG or PDF up to 10MB"
                                                            compress={true}
                                                            className="transition-all duration-300"
                                                        />
                                                        
                                                        <AnimatePresence>
                                                            {stagedFile && uploadProgress === 0 && (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: 10 }}
                                                                    className="mt-3"
                                                                >
                                                                    <Button 
                                                                        type="button"
                                                                        variant="default" 
                                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] h-11 rounded-xl shadow-lg shadow-emerald-500/20"
                                                                        onClick={() => {
                                                                            setAttachments(prev => [...prev, stagedFile]);
                                                                            setStagedFile(null);
                                                                            toast.success("Attachment confirmed and added to list");
                                                                        }}
                                                                    >
                                                                        <IconCheck className="w-4 h-4 mr-2" /> CONFIRM & ADD TO LIST
                                                                    </Button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="mobile" className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                                    <div className="xl:col-span-8 space-y-6">
                                        <Card title="PWA Display Configuration">
                                            <div className="space-y-6">
                                                <div>
                                                    <Label>Homepage Placement</Label>
                                                    <Select value={form.pwa_display_type} onValueChange={v => set('pwa_display_type', v)}>
                                                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="top_banner">Featured Top Banner</SelectItem>
                                                            <SelectItem value="home_popup">Startup Modal Popup</SelectItem>
                                                            <SelectItem value="home_image_section">Homescreen Carousel</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {form.pwa_display_type !== 'none' && (
                                                    <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                                        <div className="p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl space-y-6">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <Toggle checked={form.pwa_show_title} onChange={v => set('pwa_show_title', v)} label="Show Title" sublabel="Overlay text" />
                                                                <Toggle checked={form.has_pwa_action} onChange={v => set('has_pwa_action', v)} label="Link Action" sublabel="Allow clicking" />
                                                                <Toggle checked={form.pwa_show_once} onChange={v => set('pwa_show_once', v)} label="Smart Dismissal" sublabel="Show only once per user" activeColor="bg-primary" />
                                                            </div>
                                                            <div className="space-y-4">
                                                                <Input value={form.pwa_title} onChange={e => set('pwa_title', e.target.value)} placeholder="Title for PWA" className="h-10 text-sm" />
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <Input value={form.pwa_action_label} onChange={e => set('pwa_action_label', e.target.value)} placeholder="Button Label" className="h-9 text-[11px]" />
                                                                    <Input value={form.pwa_action_url} onChange={e => set('pwa_action_url', e.target.value)} placeholder="Redirect Path" className="h-9 text-[11px]" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>

                                        <Card title="Hero Visual">
                                            <div className="space-y-4">
                                                <FileUpload 
                                                    value={featuredImage}
                                                    progress={heroUploadProgress}
                                                    initialUrl={preexistingImage || undefined}
                                                    onChange={(file) => {
                                                        setFeaturedImage(file);
                                                        if (file) {
                                                            setHeroUploadProgress(10);
                                                            let p = 10;
                                                            const interval = setInterval(() => {
                                                                p += 20;
                                                                if (p >= 100) {
                                                                    setHeroUploadProgress(100);
                                                                    clearInterval(interval);
                                                                    setTimeout(() => {
                                                                        setHeroUploadProgress(0);
                                                                        setTempImageUrl(URL.createObjectURL(file));
                                                                        setCropModalOpen(true);
                                                                    }, 600);
                                                                } else {
                                                                    setHeroUploadProgress(p);
                                                                }
                                                            }, 100);
                                                        } else {
                                                            setPreexistingImage(null);
                                                        }
                                                    }}
                                                    onPreview={() => {
                                                        if (featuredImage || preexistingImage) {
                                                            const url = preexistingImage || undefined;
                                                            const file = featuredImage || undefined;
                                                            const ext = (file?.name || url || '').split('.').pop()?.toLowerCase() || 'jpg';

                                                            setPreviewTarget({ 
                                                                file, 
                                                                url, 
                                                                name: 'Hero Visual',
                                                                ext
                                                            });
                                                            setPreviewOpen(true);
                                                        }
                                                    }}
                                                    label="Featured Hero Image"
                                                    description="Main image for PWA dashboard"
                                                    compress={true}
                                                />
                                                <div className="flex gap-2 pt-2">
                                                    <Button onClick={() => { setMediaSelectorType('hero'); setMediaSelectorOpen(true); }} variant="outline" className="flex-1 h-11 text-[10px] font-black border-dashed border-gray-200 dark:border-gray-800"><IconPhoto className="w-4 h-4 mr-2" /> OPEN LIBRARY</Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    <div className="xl:col-span-4 sticky top-[5.5rem]"><PwaPreview form={form} imageUrl={featuredImage ? URL.createObjectURL(featuredImage) : (preexistingImage || null)} /></div>
                                </div>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </div>

            {/* Preview Modals for Attachments */}
            {previewTarget && previewUrl && (
                <>
                    {((previewTarget.file && isImage(previewTarget.file)) || (isImageExt(previewTarget.ext))) && (
                        <ImagePreviewModal
                            open={previewOpen}
                            onOpenChange={setOpen => {
                                setPreviewOpen(setOpen);
                                if (!setOpen) setPreviewTarget(null);
                            }}
                            src={previewUrl}
                            title={previewTarget.name}
                        />
                    )}
                    {((previewTarget.file && isPDF(previewTarget.file)) || (isPDFExt(previewTarget.ext))) && (
                        <PDFPreviewModal
                            open={previewOpen}
                            onOpenChange={setOpen => {
                                setPreviewOpen(setOpen);
                                if (!setOpen) setPreviewTarget(null);
                            }}
                            url={previewUrl}
                            title={previewTarget.name}
                        />
                    )}
                </>
            )}

            <MediaSelector 
                open={mediaSelectorOpen} 
                onOpenChange={setMediaSelectorOpen} 
                multiple={mediaSelectorType === 'attachment'}
                onSelect={(file: MediaFile) => {
                    if (mediaSelectorType === 'hero') {
                        setPreexistingImage(file.url);
                        setFeaturedImage(null);
                        // Auto-setup Pure Image logic
                        setForm(f => ({ 
                            ...f, 
                            pwa_show_title: false, 
                            has_pwa_action: false 
                        }));
                    } else {
                        setPreexistingAttachments(prev => [...prev, file]);
                    }
                    setMediaSelectorOpen(false);
                }} 
                onSelectMultiple={(files: MediaFile[]) => {
                    if (mediaSelectorType === 'attachment') {
                        setPreexistingAttachments(prev => [...prev, ...files]);
                        setMediaSelectorOpen(false);
                    }
                }}
            />

            <CropperModal 
                open={cropModalOpen} 
                onOpenChange={setCropModalOpen} 
                imageUrl={tempImageUrl} 
                aspectRatio={aspectRatio} 
                onAspectRatioChange={setAspectRatio}
                crop={crop}
                zoom={zoom}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_: any, pixels: Area) => setCroppedAreaPixels(pixels)}
                onApplyCrop={onApplyCrop} 
                isProcessing={isProcessingCrop} 
            />
        </div>
    );
}

