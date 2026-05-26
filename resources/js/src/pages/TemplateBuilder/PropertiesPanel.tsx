import React from 'react';
import { 
    Settings2, 
    Palette, 
    Type as TypeIcon, 
    Layout,
    Table as TableIcon,
    FileText,
    Image as ImageIcon,
    Building2,
    Info,
    AlignLeft,
    AlignCenter,
    AlignRight,
    GripVertical,
    Save,
    X,
    Plus,
    Box,
    PenTool,
    Loader2,
    StickyNote
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import RichTextEditor from './RichTextEditor';
import ColumnManager from './components/ColumnManager';
import MediaSelector, { MediaFile } from '@/components/MediaSelector';
import { FontSelector } from '@/components/Shared/FontSelector';

const LANGUAGES = [
    { label: 'English', value: 'en' },
    { label: 'Khmer', value: 'km' },
    { label: 'All', value: 'all' },
];

import { SectionTitle } from './components/properties/SectionTitle';
import { ColorInput } from './components/properties/ColorInput';

const PropertiesPanel = ({ 
    selectedBlockId, 
    template, 
    typeSlug,
    activeTab,
    onTabChange,
    onSave, 
    onClose, 
    onUpdateStyles, 
    onUpdateGlobalStyles, 
    onUpdateTemplate,
    onUpdatePageSize,
    onAddBlock 
}: any) => {
    
    const handleUpdate = (updates: string | Record<string, any>, value?: any) => {
        if (typeof updates === 'string' && updates === 'name') {
            onUpdateTemplate({ name: value });
            return;
        }

        const newStyles = JSON.parse(JSON.stringify(template.styles || {}));
        
        const applyUpdate = (path: string, val: any) => {
            const keys = path.split('.');
            let current = newStyles;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]]; // Ensure object exists
                if (typeof current[keys[i]] !== 'object' || current[keys[i]] === null) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = val;
        };

        if (typeof updates === 'string') {
            applyUpdate(updates, value);
        } else {
            Object.entries(updates).forEach(([p, v]) => applyUpdate(p, v));
        }

        onUpdateGlobalStyles(newStyles);
    };
    
    const [mediaOpen, setMediaOpen] = React.useState(false);
    const [mediaType, setMediaType] = React.useState<'watermark' | 'branding' | 'logo' | 'signature_0' | 'signature_1' | 'signature_2'>('watermark');

    const handleMediaSelect = (file: MediaFile) => {
        if (mediaType === 'watermark') {
            handleUpdate('general.watermark.image', file.url);
        } else if (mediaType === 'logo') {
            handleUpdate('header.logo.url', file.url);
        } else if (mediaType.startsWith('signature_')) {
            const index = parseInt(mediaType.split('_')[1]);
            const items = [...(s.footer?.signature?.items || [])];
            if (items[index]) {
                items[index].image = file.url;
                handleUpdate('footer.signature.items', items);
            }
        } else {
            handleUpdate('brandingOverrides.company_logo', file.url);
        }
        setMediaOpen(false);
    };

    // Find selected block
    const findBlock = (id: string | null) => {
        if (!id || !template?.layout_config) return null;
        const sections = ['header', 'body', 'footer'];
        for (const section of sections) {
            const blocks = template.layout_config[section] || [];
            const block = blocks.find((b: any) => b.id === id);
            if (block) return block;
            for (const b of blocks) {
                if (b.type === 'grid_row' && b.columns) {
                    for (const col of b.columns) {
                        const nested = col.blocks.find((nb: any) => nb.id === id);
                        if (nested) return nested;
                    }
                }
            }
        }
        return null;
    };


    if (!template) return null;

    const s = template.styles || {};

    return (
        <aside className="w-full h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xl">
            {/* Header with Save/Close */}
            <div className="h-14 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                        <Settings2 className="w-4 h-4 text-primary" />
                    </div>
                   <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200">Designer Studio</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <Tabs 
                value={activeTab || 'general'} 
                onValueChange={onTabChange}
                className="flex-1 flex flex-col min-h-0 relative"
            >
                {/* Scrollable Tab Container with Fading Mask */}
                <div className="h-12 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 relative flex items-center z-30">
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent pointer-events-none z-10 opacity-60" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none z-10 opacity-60" />
                    
                    <div className="flex-1 overflow-x-auto no-scrollbar scroll-smooth px-2">
                        <TabsList className="h-full bg-transparent flex items-center justify-start gap-0 min-w-max">
                            {['General', 'Header', 'Doc Info', 'Table', 'Footer'].map((tab) => (
                                <TabsTrigger 
                                    key={tab}
                                    value={tab === 'Doc Info' ? 'doc_info' : tab.toLowerCase().replace(/ /g, '_')}
                                    className="h-8 px-4 rounded-md text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all whitespace-nowrap"
                                >
                                    {tab}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4">
                        <TabsContent value="general" className="mt-0 space-y-4">
                            <Accordion type="multiple" defaultValue={['template_props']} className="space-y-3">
                                <AccordionItem value="template_props" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50/30 dark:bg-slate-800/30">
                                        <SectionTitle icon={FileText} title="Template Properties" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-5">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Template Name *</Label>
                                            <Input 
                                                value={template.name}
                                                onChange={(e) => handleUpdate('name', e.target.value)}
                                                className="h-9 text-xs focus:ring-primary focus:border-primary"
                                                placeholder="Default"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Global Font</Label>
                                            <FontSelector 
                                                value={s.general?.font_family || 'Arial, sans-serif'} 
                                                onValueChange={(v) => handleUpdate('general.font_family', v)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Paper Size</Label>
                                            <div className="flex gap-4">
                                                {['A5', 'A4'].map((size) => (
                                                    <div key={size} className="flex items-center gap-2 cursor-pointer" onClick={() => handleUpdate('general.paper_size', size)}>
                                                        <div className={cn(
                                                            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                                            s.general?.paper_size === size ? "border-primary bg-primary" : "border-slate-300"
                                                        )}>
                                                            {s.general?.paper_size === size && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <span className="text-xs font-semibold">{size}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Orientation</Label>
                                            <div className="flex gap-4">
                                                {['Portrait', 'Landscape'].map((o) => (
                                                    <div key={o} className="flex items-center gap-2 cursor-pointer" onClick={() => handleUpdate('general.orientation', o.toLowerCase())}>
                                                        <div className={cn(
                                                            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                                            s.general?.orientation === o.toLowerCase() ? "border-primary bg-primary" : "border-slate-300"
                                                        )}>
                                                            {s.general?.orientation === o.toLowerCase() && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <span className="text-xs font-semibold">{o}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            <Label className="col-span-2 text-[10px] font-bold uppercase text-slate-400">Margins (in pixels)</Label>
                                            {[
                                                { label: 'Margin Left', path: 'general.margins.left' },
                                                { label: 'Margin Top', path: 'general.margins.top' },
                                                { label: 'Margin Right', path: 'general.margins.right' },
                                                { label: 'Margin Bottom', path: 'general.margins.bottom' }
                                            ].map((m) => (
                                                <div key={m.path} className="space-y-1">
                                                    <Label className="text-[9px] text-slate-500 font-bold">{m.label}</Label>
                                                    <Input 
                                                        type="number"
                                                        value={s.general?.margins?.[m.path.split('.').pop()!] || 0}
                                                        onChange={(e) => handleUpdate(m.path, parseInt(e.target.value))}
                                                        className="h-8 text-xs focus:ring-primary focus:border-primary"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="logo" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50/30 dark:bg-slate-800/30">
                                        <SectionTitle icon={ImageIcon} title="Logo Management" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-5">
                                        <div className="flex items-center gap-2">
                                            <Switch 
                                                checked={s.header?.logo?.show ?? true}
                                                onCheckedChange={(val) => handleUpdate('header.logo.show', val)}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                            <Label className="text-xs font-bold">Show Logo</Label>
                                        </div>

                                        {s.header?.logo?.show !== false && (
                                            <div className="space-y-5 pt-2 border-t border-slate-50 dark:border-slate-800 animate-in slide-in-from-top-1">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Template Logo</Label>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900 group relative">
                                                            {s.header?.logo?.url ? (
                                                                <img src={s.header?.logo?.url} className="w-full h-full object-contain" />
                                                            ) : (
                                                                <ImageIcon className="w-6 h-6 text-slate-200" />
                                                            )}
                                                            <button 
                                                                className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-[1px]"
                                                                onClick={() => { setMediaType('logo'); setMediaOpen(true); }}
                                                            >
                                                                <Plus className="w-5 h-5 text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="flex-1 space-y-3">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Logo Width (px)</Label>
                                                                <Input 
                                                                    type="number" 
                                                                    value={s.header?.logo?.width || 120} 
                                                                    onChange={(e) => handleUpdate('header.logo.width', parseInt(e.target.value))}
                                                                    className="h-8 text-xs font-mono"
                                                                />
                                                            </div>
                                                            <Button 
                                                                size="sm" variant="outline" className="h-8 w-full text-[10px] font-bold gap-2"
                                                                onClick={() => { setMediaType('logo'); setMediaOpen(true); }}
                                                            >
                                                                <ImageIcon className="w-3 h-3" />
                                                                Change Image
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Position</Label>
                                                    <Select value={s.header?.logo?.position || 'left'} onValueChange={(v) => handleUpdate('header.logo.position', v)}>
                                                        <SelectTrigger className="h-8 text-xs font-semibold"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="left">Left Side</SelectItem>
                                                            <SelectItem value="right">Right Side</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="watermark" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                        <SectionTitle icon={ImageIcon} title="Watermark" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Switch 
                                                checked={s.general?.watermark?.show || false}
                                                onCheckedChange={(val) => handleUpdate('general.watermark.show', val)}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                            <Label className="text-xs font-bold">Show Watermark</Label>
                                        </div>
                                        {s.general?.watermark?.show && (
                                            <div className="space-y-4 pt-2 animate-in slide-in-from-top-1">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Watermark Type</Label>
                                                    <Tabs value={s.general?.watermark?.type || 'text'} onValueChange={(v) => handleUpdate('general.watermark.type', v)}>
                                                        <TabsList className="grid w-full grid-cols-2 h-9 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                                            <TabsTrigger 
                                                                value="text" 
                                                                className="h-full rounded-md text-[10px] uppercase font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-primary data-[state=active]:shadow-sm"
                                                            >
                                                                Text
                                                            </TabsTrigger>
                                                            <TabsTrigger 
                                                                value="image" 
                                                                className="h-full rounded-md text-[10px] uppercase font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-primary data-[state=active]:shadow-sm"
                                                            >
                                                                Image
                                                            </TabsTrigger>
                                                        </TabsList>
                                                    </Tabs>
                                                </div>

                                                {s.general?.watermark?.type === 'image' ? (
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-bold uppercase text-slate-400">Watermark Image</Label>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900 group relative">
                                                                {s.general?.watermark?.image ? (
                                                                    <img src={s.general?.watermark?.image} className="w-full h-full object-contain" />
                                                                ) : (
                                                                    <ImageIcon className="w-6 h-6 text-slate-300" />
                                                                )}
                                                                <button 
                                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                                    onClick={() => { setMediaType('watermark'); setMediaOpen(true); }}
                                                                >
                                                                    <Plus className="w-4 h-4 text-white" />
                                                                </button>
                                                            </div>
                                                            <div className="flex-1 space-y-1.5">
                                                                <Label className="text-[9px] text-slate-500 font-bold uppercase">Size (px)</Label>
                                                                <Input 
                                                                    type="number" 
                                                                    value={s.general?.watermark?.size || 300} 
                                                                    onChange={(e) => handleUpdate('general.watermark.size', parseInt(e.target.value))}
                                                                    className="h-8 text-xs font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Watermark Text</Label>
                                                            <Input 
                                                                value={s.general?.watermark?.text || 'S-COOL CRM'} 
                                                                onChange={(e) => handleUpdate('general.watermark.text', e.target.value)}
                                                                className="h-9 text-xs"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Rotate (°)</Label>
                                                                <Input 
                                                                    type="number" 
                                                                    value={s.general?.watermark?.rotate || -45} 
                                                                    onChange={(e) => handleUpdate('general.watermark.rotate', parseInt(e.target.value))}
                                                                    className="h-8 text-xs font-mono"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Size (px)</Label>
                                                                <Input 
                                                                    type="number" 
                                                                    value={s.general?.watermark?.size || 150} 
                                                                    onChange={(e) => handleUpdate('general.watermark.size', parseInt(e.target.value))}
                                                                    className="h-8 text-xs font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Opacity ({Math.round((s.general?.watermark?.opacity || 0.1) * 100)}%)</Label>
                                                    <input 
                                                        type="range" min="0" max="1" step="0.05"
                                                        value={s.general?.watermark?.opacity || 0.1}
                                                        onChange={(e) => handleUpdate('general.watermark.opacity', parseFloat(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </TabsContent>

                        <TabsContent value="header" className="mt-0 space-y-4">
                            <Accordion type="multiple" defaultValue={['company_branding']} className="space-y-3">
                                <AccordionItem value="company_branding" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50/30 dark:bg-slate-800/30">
                                        <SectionTitle icon={Building2} title="Company" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-4">
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Header', path: 'header.show' },
                                                { label: 'Apply to all pages', path: 'header.all_pages' },
                                                { label: 'Border Bottom', path: 'header.border_bottom' }
                                            ].map((item) => (
                                                <div key={item.path} className="flex items-center gap-2">
                                                    <Switch 
                                                        checked={handleGet(s, item.path) ?? true}
                                                        onCheckedChange={(val) => handleUpdate(item.path, val)}
                                                        className="data-[state=checked]:bg-primary"
                                                    />
                                                    <Label className="text-xs font-bold">{item.label}</Label>
                                                </div>
                                            ))}
                                        </div>

                                        <Separator className="my-4 opacity-50" />
                                        
                                        <div className="space-y-4">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Branding Data Source</Label>
                                                    <Select 
                                                        value={s.brandingOverrides?.source || 'system'} 
                                                        onValueChange={(val) => {
                                                            handleUpdate({
                                                                'brandingOverrides.source': val,
                                                                'brandingOverrides.enabled': val === 'custom'
                                                            });
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-9 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="system">
                                                                <div className="flex flex-col text-left">
                                                                    <span className="font-bold">System Default</span>
                                                                    <span className="text-[10px] text-slate-500">Use global Headquarters details</span>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="branch">
                                                                <div className="flex flex-col text-left">
                                                                    <span className="font-bold">Dynamic Branch</span>
                                                                    <span className="text-[10px] text-slate-500">Use issuing branch details (Automatic)</span>
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="custom">
                                                                <div className="flex flex-col text-left">
                                                                    <span className="font-bold">Custom Overrides</span>
                                                                    <span className="text-[10px] text-slate-500">Manually type fixed details for this template</span>
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                
                                                {s.brandingOverrides?.source === 'branch' && (
                                                    <div className="px-2 pt-1">
                                                        <Badge variant="outline" className="text-[9px] gap-1 py-0.5">
                                                            <Info className="w-2.5 h-2.5" />
                                                            Recommended for Multi-Branch systems
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            {s.brandingOverrides?.enabled ? (
                                                <div className="space-y-3 pt-2 animate-in slide-in-from-top-1 border-l-2 border-primary/20 pl-4 ml-1">
                                                    {[
                                                        { id: 'company_name_km', label: 'Local Company Name' },
                                                        { id: 'company_name', label: 'Company Name' },
                                                        { id: 'company_tin', label: 'VAT/TIN Number' },
                                                        { id: 'company_address', label: 'Address' },
                                                        { id: 'company_phone', label: 'Phone' },
                                                        { id: 'company_email', label: 'Email' },
                                                        { id: 'company_website', label: 'Website' }
                                                    ].map(field => (
                                                        <div key={field.id} className="space-y-1.5">
                                                            <Label className="text-[9px] font-black uppercase text-slate-400">{field.label}</Label>
                                                            {field.id === 'company_address' ? (
                                                                <Textarea 
                                                                    value={s.brandingOverrides?.[field.id] || ''} 
                                                                    onChange={(e) => handleUpdate(`brandingOverrides.${field.id}`, e.target.value)}
                                                                    className="min-h-[60px] text-xs py-2"
                                                                />
                                                            ) : (
                                                                <Input 
                                                                    value={s.brandingOverrides?.[field.id] || ''} 
                                                                    onChange={(e) => handleUpdate(`brandingOverrides.${field.id}`, e.target.value)}
                                                                    className="h-8 text-xs"
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div className="space-y-1.5 pt-1">
                                                        <Label className="text-[9px] font-black uppercase text-slate-400">Override Logo</Label>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded border p-1 bg-white flex items-center justify-center overflow-hidden">
                                                                {s.brandingOverrides?.company_logo ? (
                                                                    <img src={s.brandingOverrides.company_logo} className="w-full h-full object-contain" />
                                                                ) : (
                                                                    <ImageIcon className="w-5 h-5 text-slate-300" />
                                                                )}
                                                            </div>
                                                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold" onClick={() => { setMediaType('branding'); setMediaOpen(true); }}>
                                                                Pick Logo
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {[
                                                        { id: 'local_company_name', label: 'Local Company Name' },
                                                        { id: 'company_name', label: 'Company Name' },
                                                        { id: 'vat_tin_number', label: 'VAT/TIN Number' },
                                                        { id: 'address', label: 'Address' },
                                                        { id: 'phone', label: 'Phone' },
                                                        { id: 'email', label: 'Email' },
                                                        { id: 'website', label: 'Website' }
                                                    ].map((field) => (
                                                        <div key={field.id} className="flex items-center gap-2">
                                                            <Switch 
                                                                checked={s.header?.fields?.[field.id] ?? true}
                                                                onCheckedChange={(val) => handleUpdate(`header.fields.${field.id}`, val)}
                                                                className="data-[state=checked]:bg-primary"
                                                            />
                                                            <Label className="text-xs font-bold">{field.label}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-6">
                                            <div className="space-y-1.5 col-span-2 capitalize">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Section Layout Type</Label>
                                                <Select value={s.header?.layout_type || 'columns'} onValueChange={(v) => handleUpdate('header.layout_type', v)}>
                                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="stack">Logo on Top (Stacked)</SelectItem>
                                                        <SelectItem value="columns">Side by Side (Columns)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5 col-span-2">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Contact Info Layout</Label>
                                                <Select value={s.header?.contact_layout || 'row'} onValueChange={(v) => handleUpdate('header.contact_layout', v)}>
                                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="row">Single Line (Row)</SelectItem>
                                                        <SelectItem value="stack">Separate Lines (Stacked)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {(s.header?.layout_type || 'columns') === 'columns' && (
                                                <div className="space-y-1.5 col-span-2">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Number of Columns</Label>
                                                    <Select value={String(s.header?.columns || 2)} onValueChange={(v) => handleUpdate('header.columns', parseInt(v))}>
                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1">1 Column</SelectItem>
                                                            <SelectItem value="2">2 Columns</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Border Width (px)</Label>
                                                <Input type="number" value={s.header?.border_width || 2} onChange={(e) => handleUpdate('header.border_width', parseInt(e.target.value))} className="h-9 text-xs" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <ColorInput label="Border Color" value={s.header?.border_color || 'hsl(356, 100%, 39%)'} onChange={(v) => handleUpdate('header.border_color', v)} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Border Move (px)</Label>
                                                <Input type="number" value={s.header?.border_offset || 0} onChange={(e) => handleUpdate('header.border_offset', parseInt(e.target.value))} className="h-9 text-xs" placeholder="+/- offset" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mt-4">
                                            <Label className="col-span-3 text-[10px] font-bold uppercase text-slate-400">Section Padding</Label>
                                            {['Left', 'Top', 'Right'].map(p => (
                                                <div key={p} className="space-y-1">
                                                    <Label className="text-[9px] text-slate-500 font-bold">Padding {p}</Label>
                                                    <Input type="number" value={s.header?.padding?.[p.toLowerCase()] || 0} onChange={(e) => handleUpdate(`header.padding.${p.toLowerCase()}`, parseInt(e.target.value))} className="h-8 text-xs" />
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                            </Accordion>
                        </TabsContent>

                        <TabsContent value="doc_info" className="mt-0 space-y-4">
                            <Accordion type="multiple" defaultValue={['doc_title', 'doc_info']} className="space-y-3">
                                <AccordionItem value="doc_title" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50/30 dark:bg-slate-800/30">
                                        <SectionTitle icon={FileText} title="Document Title" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Switch 
                                                checked={s.doc_info?.show_title ?? true}
                                                onCheckedChange={(val) => handleUpdate('doc_info.show_title', val)}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                            <Label className="text-xs font-bold">Show Document Title</Label>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Title Position</Label>
                                            <Select value={s.doc_info?.title_position || 'bottom'} onValueChange={(v) => handleUpdate('doc_info.title_position', v)}>
                                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="top">Top</SelectItem>
                                                    <SelectItem value="bottom">Bottom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Alignment</Label>
                                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                                {[
                                                    { value: 'left', icon: AlignLeft },
                                                    { value: 'center', icon: AlignCenter },
                                                    { value: 'right', icon: AlignRight }
                                                ].map((opt) => (
                                                    <Button
                                                        key={opt.value}
                                                        variant="ghost"
                                                        size="sm"
                                                        className={cn(
                                                            "flex-1 h-7 px-0 rounded-md transition-all",
                                                            (s.doc_info?.title_align || 'center') === opt.value 
                                                                ? "bg-white dark:bg-slate-700 shadow-sm text-primary" 
                                                                : "text-slate-500 hover:text-slate-700"
                                                        )}
                                                        onClick={() => handleUpdate('doc_info.title_align', opt.value)}
                                                    >
                                                        <opt.icon className="w-3.5 h-3.5" />
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <RichTextEditor 
                                                value={s.doc_info?.title_content || '<h1>Quotation</h1>'}
                                                onChange={(val) => handleUpdate('doc_info.title_content', val)}
                                                typeSlug={typeSlug}
                                            />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="doc_info" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                        <SectionTitle icon={Info} title="Document Information" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400 px-1">Document Left</Label>
                                                <ColumnManager 
                                                    items={s.doc_info?.left_columns || []}
                                                    onReorder={(items) => handleUpdate('doc_info.left_columns', items)}
                                                    onToggleVisibility={(id, visible) => {
                                                        const items = [...(s.doc_info?.left_columns || [])];
                                                        const idx = items.findIndex(i => i.id === id);
                                                        if (idx !== -1) { items[idx].visible = visible; handleUpdate('doc_info.left_columns', items); }
                                                    }}
                                                    onMoveSide={(id) => {
                                                        const left = [...(s.doc_info?.left_columns || [])];
                                                        const right = [...(s.doc_info?.right_columns || [])];
                                                        const idx = left.findIndex(i => i.id === id);
                                                        if (idx !== -1) {
                                                            const [item] = left.splice(idx, 1);
                                                            right.push(item);
                                                            handleUpdate('doc_info', { ...s.doc_info, left_columns: left, right_columns: right });
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400 px-1">Document Right</Label>
                                                <ColumnManager 
                                                    items={s.doc_info?.right_columns || []}
                                                    onReorder={(items) => handleUpdate('doc_info.right_columns', items)}
                                                    onToggleVisibility={(id, visible) => {
                                                        const items = [...(s.doc_info?.right_columns || [])];
                                                        const idx = items.findIndex(i => i.id === id);
                                                        if (idx !== -1) { items[idx].visible = visible; handleUpdate('doc_info.right_columns', items); }
                                                    }}
                                                    onMoveSide={(id) => {
                                                        const left = [...(s.doc_info?.left_columns || [])];
                                                        const right = [...(s.doc_info?.right_columns || [])];
                                                        const idx = right.findIndex(i => i.id === id);
                                                        if (idx !== -1) {
                                                            const [item] = right.splice(idx, 1);
                                                            left.push(item);
                                                            handleUpdate('doc_info', { ...s.doc_info, left_columns: left, right_columns: right });
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Margin Top (Line)</Label>
                                                    <Input type="number" value={s.doc_info?.margin_top || 0} onChange={(e) => handleUpdate('doc_info.margin_top', parseInt(e.target.value))} className="h-9 text-xs" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Inner Space (Text)</Label>
                                                    <Input type="number" value={s.doc_info?.padding_top ?? 12} onChange={(e) => handleUpdate('doc_info.padding_top', parseInt(e.target.value))} className="h-9 text-xs" />
                                                </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Width Left(%)</Label>
                                                <Input type="number" value={s.doc_info?.width_left || 50} onChange={(e) => handleUpdate('doc_info.width_left', parseInt(e.target.value))} className="h-9 text-xs" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Width Right(%)</Label>
                                                <Input type="number" value={s.doc_info?.width_right || 50} onChange={(e) => handleUpdate('doc_info.width_right', parseInt(e.target.value))} className="h-9 text-xs" />
                                            </div>
                                        </div>

                                        <Separator className="my-4" />
                                        
                                        <div className="space-y-4">
                                            <Label className="text-[11px] font-bold">Label Font Settings</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Language</Label>
                                                    <Select value={s.doc_info?.label?.lang || 'en'} onValueChange={(v) => handleUpdate('doc_info.label.lang', v)}>
                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>{LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Alignment</Label>
                                                    <Select value={s.doc_info?.label?.align || 'left'} onValueChange={(v) => handleUpdate('doc_info.label.align', v)}>
                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Layout</Label>
                                                    <Select value={s.doc_info?.label?.layout || 'stack'} onValueChange={(v) => handleUpdate('doc_info.label.layout', v)}>
                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="stack">Stacked (Col)</SelectItem>
                                                            <SelectItem value="row">Side by Side (Row)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Lang Gap</Label>
                                                    <Input type="number" value={s.doc_info?.label?.gap || 2} onChange={(e) => handleUpdate('doc_info.label.gap', parseInt(e.target.value))} className="h-9 text-xs" />
                                                </div>
                                                <div className="space-y-1.5 col-span-2">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Font</Label>
                                                    <FontSelector 
                                                        value={s.doc_info?.label?.font || 'Arial, sans-serif'} 
                                                        onValueChange={(v) => handleUpdate('doc_info.label.font', v)}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Size</Label>
                                                    <Input type="number" value={s.doc_info?.label?.size || 12} onChange={(e) => handleUpdate('doc_info.label.size', parseInt(e.target.value))} className="h-9 text-xs" />
                                                </div>
                                                <ColorInput label="Font Color" value={s.doc_info?.label?.color || '#000000'} onChange={(v) => handleUpdate('doc_info.label.color', v)} />
                                            </div>
                                        </div>

                                        <Separator className="my-4" />

                                        <div className="space-y-4">
                                            <Label className="text-[11px] font-bold">Information Font Settings</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                 <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Separator</Label>
                                                    <Input value={s.doc_info?.info?.separator ?? ''} onChange={(e) => handleUpdate('doc_info.info.separator', e.target.value)} className="h-9 text-xs" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Alignment</Label>
                                                    <Select value={s.doc_info?.info?.align || 'left'} onValueChange={(v) => handleUpdate('doc_info.info.align', v)}>
                                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Indent Left Data</Label>
                                                    <Input type="number" value={s.doc_info?.info?.indent_left || 84} onChange={(e) => handleUpdate('doc_info.info.indent_left', parseInt(e.target.value))} className="h-9 text-xs" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Indent Right Data</Label>
                                                    <Input type="number" value={s.doc_info?.info?.indent_right || 100} onChange={(e) => handleUpdate('doc_info.info.indent_right', parseInt(e.target.value))} className="h-9 text-xs" />
                                                </div>
                                                <div className="space-y-1.5 col-span-2">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Font</Label>
                                                    <FontSelector 
                                                        value={s.doc_info?.info?.font || 'Arial, sans-serif'} 
                                                        onValueChange={(v) => handleUpdate('doc_info.info.font', v)}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Size</Label>
                                                    <Input type="number" value={s.doc_info?.info?.size || 12} onChange={(e) => handleUpdate('doc_info.info.size', parseInt(e.target.value))} className="h-9 text-xs" />
                                                </div>
                                                <ColorInput label="Font Color" value={s.doc_info?.info?.color || '#000000'} onChange={(v) => handleUpdate('doc_info.info.color', v)} />
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="internal_note" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50/30 dark:bg-slate-800/30">
                                        <SectionTitle icon={StickyNote} title="Document Note" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Switch 
                                                checked={s.doc_note?.show ?? true}
                                                onCheckedChange={(val) => handleUpdate('doc_note.show', val)}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                            <Label className="text-xs font-bold">Show Note Section</Label>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Content Fallback</Label>
                                            <RichTextEditor 
                                                value={s.doc_note?.content || ''}
                                                onChange={(val) => handleUpdate('doc_note.content', val)}
                                                typeSlug={typeSlug}
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <ColorInput label="Left Line Color" value={s.doc_note?.border_color || 'hsl(var(--primary) / 0.4)'} onChange={(v) => handleUpdate('doc_note.border_color', v)} />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>


                            </Accordion>
                        </TabsContent>


                        <TabsContent value="table" className="mt-0 space-y-4">
                            <Accordion type="multiple" defaultValue={['table_props']} className="space-y-3">
                                <AccordionItem value="table_props" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50/30 dark:bg-slate-800/30">
                                        <SectionTitle icon={TableIcon} title="Table Properties" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-4">
                                        <div className="flex items-center justify-between px-1 mb-2">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Column Name</Label>
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Width(px)</Label>
                                        </div>
                                        <ColumnManager 
                                            items={s.table?.columns || []}
                                            showWidth={true}
                                            showAlign={true}
                                            onReorder={(items) => handleUpdate('table.columns', items)}
                                            onToggleVisibility={(id, visible) => {
                                                const items = [...(s.table?.columns || [])];
                                                const idx = items.findIndex(i => i.id === id);
                                                if (idx !== -1) { items[idx].visible = visible; handleUpdate('table.columns', items); }
                                            }}
                                            onUpdateWidth={(id, width) => {
                                                const items = [...(s.table?.columns || [])];
                                                const idx = items.findIndex(i => i.id === id);
                                                if (idx !== -1) { items[idx].width = width; handleUpdate('table.columns', items); }
                                            }}
                                            onUpdateAlign={(id, align) => {
                                                const items = [...(s.table?.columns || [])];
                                                const idx = items.findIndex(i => i.id === id);
                                                if (idx !== -1) { items[idx].align = align; handleUpdate('table.columns', items); }
                                            }}
                                        />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="table_layout" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                        <SectionTitle icon={Layout} title="Layout" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-4">
                                        {[
                                            { label: 'Show Blank Row Number', path: 'table.blank_row_num' },
                                            { label: 'Show Transaction Currency', path: 'table.show_currency' },
                                            { label: 'Show Main Package Item Amount Only', path: 'table.package_amount_only' }
                                        ].map(item => (
                                            <div key={item.path} className="flex items-center gap-2">
                                                <Switch 
                                                    checked={handleGet(s, item.path) ?? false}
                                                    onCheckedChange={(val) => handleUpdate(item.path, val)}
                                                    className="data-[state=checked]:bg-primary"
                                                />
                                                <Label className="text-xs font-bold">{item.label}</Label>
                                            </div>
                                        ))}
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Language</Label>
                                                <Select value={s.table?.lang || 'all'} onValueChange={(v) => handleUpdate('table.lang', v)}>
                                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="en">English Only</SelectItem>
                                                        <SelectItem value="km">Khmer Only</SelectItem>
                                                        <SelectItem value="all">Khmer & English</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Border Option</Label>
                                                <Select value={s.table?.border_option || 'all'} onValueChange={(v) => handleUpdate('table.border_option', v)}>
                                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        <SelectItem value="only_column">Only Column</SelectItem>
                                                        <SelectItem value="all">All Borders</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Total Row</Label>
                                                <Input type="number" value={s.table?.total_rows || 10} onChange={(e) => handleUpdate('table.total_rows', parseInt(e.target.value))} className="h-9 text-xs" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Border Width</Label>
                                                <Input type="number" value={s.table?.border_width || 1} onChange={(e) => handleUpdate('table.border_width', parseInt(e.target.value))} className="h-9 text-xs" />
                                            </div>
                                            <ColorInput label="Border Color" value={s.table?.border_color || '#030303'} onChange={(v) => handleUpdate('table.border_color', v)} />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="table_header" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                     <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                        <SectionTitle icon={Palette} title="Table Header & Body" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-6">
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <Label className="text-[11px] font-bold">Table Header</Label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase text-slate-400">Font</Label>
                                                        <FontSelector 
                                                            value={s.table?.header?.font || 'Arial, sans-serif'} 
                                                            onValueChange={(v) => handleUpdate('table.header.font', v)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 text-center">
                                                        <Label className="text-[10px] font-bold uppercase text-slate-400">Size</Label>
                                                        <Input type="number" value={s.table?.header?.size || 12} onChange={(e) => handleUpdate('table.header.size', parseInt(e.target.value))} className="h-9 text-xs" />
                                                    </div>
                                                    <ColorInput label="Background" value={s.table?.header?.bg || '#142f2a'} onChange={(v) => handleUpdate('table.header.bg', v)} />
                                                    <ColorInput label="Font Color" value={s.table?.header?.color || '#fcfcfa'} onChange={(v) => handleUpdate('table.header.color', v)} />
                                                    <div className="space-y-3 col-span-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                                                        <Label className="text-[10px] font-bold uppercase text-slate-400">Secondary Label (English)</Label>
                                                        <div className="flex items-center gap-6">
                                                            <div className="flex items-center gap-2">
                                                                <Switch 
                                                                    checked={s.table?.header?.en_italic ?? true}
                                                                    onCheckedChange={(val) => handleUpdate('table.header.en_italic', val)}
                                                                    className="data-[state=checked]:bg-primary"
                                                                />
                                                                <Label className="text-[10px] font-bold">Italic</Label>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Switch 
                                                                    checked={s.table?.header?.en_underline ?? false}
                                                                    onCheckedChange={(val) => handleUpdate('table.header.en_underline', val)}
                                                                    className="data-[state=checked]:bg-primary"
                                                                />
                                                                <Label className="text-[10px] font-bold">Underline</Label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-[11px] font-bold">Table Body</Label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase text-slate-400">Font</Label>
                                                        <FontSelector 
                                                            value={s.table?.body?.font || 'Arial, sans-serif'} 
                                                            onValueChange={(v) => handleUpdate('table.body.font', v)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 text-center">
                                                        <Label className="text-[10px] font-bold uppercase text-slate-400">Size</Label>
                                                        <Input type="number" value={s.table?.body?.size || 12} onChange={(e) => handleUpdate('table.body.size', parseInt(e.target.value))} className="h-9 text-xs" />
                                                    </div>
                                                    <ColorInput label="Background" value={s.table?.body?.bg || '#ffffff'} onChange={(v) => handleUpdate('table.body.bg', v)} />
                                                    <ColorInput label="Font Color" value={s.table?.body?.color || '#000000'} onChange={(v) => handleUpdate('table.body.color', v)} />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </TabsContent>

                        <TabsContent value="footer" className="mt-0 space-y-4">
                             <Accordion type="multiple" defaultValue={['totals']} className="space-y-3">
                                <AccordionItem value="footer_layout" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                        <SectionTitle icon={Layout} title="Spacing & Placement" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Top Margin (px)</Label>
                                                <Input 
                                                    type="number"
                                                    value={s.footer?.margin_top ?? 32}
                                                    onChange={(e) => handleUpdate('footer.margin_top', parseInt(e.target.value))}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Bottom Margin (px)</Label>
                                                <Input 
                                                    type="number"
                                                    value={s.footer?.margin_bottom ?? 0}
                                                    onChange={(e) => handleUpdate('footer.margin_bottom', parseInt(e.target.value))}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Footer Placement</Label>
                                            <Select 
                                                value={s.footer?.placement || 'auto'} 
                                                onValueChange={(v) => handleUpdate('footer.placement', v)}
                                            >
                                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="auto">Auto (After Content)</SelectItem>
                                                    <SelectItem value="fixed">Fixed at Bottom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[9px] text-slate-400 italic">Fixed will push the footer to the very bottom of the page.</p>
                                        </div>

                                        <Separator className="my-4" />

                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Footer Layout Type</Label>
                                            <Select value={s.footer?.layout_type || 'columns'} onValueChange={(v) => handleUpdate('footer.layout_type', v)}>
                                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="stack">Notes then Totals (Stacked)</SelectItem>
                                                    <SelectItem value="columns">Side by Side (Columns)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {(s.footer?.layout_type || 'columns') === 'columns' && (
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Number of Columns</Label>
                                                <Select value={String(s.footer?.columns || 2)} onValueChange={(v) => handleUpdate('footer.columns', parseInt(v))}>
                                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">1 Column</SelectItem>
                                                        <SelectItem value="2">2 Columns</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <ColorInput label="Section Font Color" value={s.footer?.font_color || '#64748b'} onChange={(v) => handleUpdate('footer.font_color', v)} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Font Family</Label>
                                                <FontSelector 
                                                    value={s.footer?.font_family || 'Arial, sans-serif'} 
                                                    onValueChange={(v) => handleUpdate('footer.font_family', v)}
                                                />
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="totals" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50/30 dark:bg-slate-800/30">
                                        <SectionTitle icon={TableIcon} title="Total Section" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-4">
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Summary Row', path: 'footer.summary_row' },
                                                { label: 'Column Summary in Riel (KHR)', path: 'footer.summary_riel' }
                                            ].map(item => (
                                                <div key={item.path} className="flex items-center gap-2">
                                                    <Switch 
                                                        checked={handleGet(s, item.path) ?? false}
                                                        onCheckedChange={(val) => handleUpdate(item.path, val)}
                                                        className="data-[state=checked]:bg-primary"
                                                    />
                                                    <Label className="text-xs font-bold">{item.label}</Label>
                                                </div>
                                            ))}

                                            {s.footer?.summary_riel && (
                                                <div className="flex items-center gap-2 pl-6 border-l-2 border-primary/20 ml-2 py-1">
                                                    <Switch 
                                                        checked={s.footer?.summary_riel_italic ?? true}
                                                        onCheckedChange={(val) => handleUpdate('footer.summary_riel_italic', val)}
                                                        className="data-[state=checked]:bg-primary scale-90"
                                                    />
                                                    <Label className="text-[10px] font-bold text-slate-500 italic">Italic Label</Label>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Switch 
                                                    checked={s.footer?.total_bold ?? true}
                                                    onCheckedChange={(val) => handleUpdate('footer.total_bold', val)}
                                                    className="data-[state=checked]:bg-primary"
                                                />
                                                <Label className="text-xs font-bold">Bold Grand Total</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch 
                                                    checked={s.footer?.total_color_primary ?? false}
                                                    onCheckedChange={(val) => handleUpdate('footer.total_color_primary', val)}
                                                    className="data-[state=checked]:bg-primary"
                                                />
                                                <Label className="text-xs font-bold">Primary Color for Grand Total</Label>
                                            </div>
                                        </div>
                                        <Separator className="my-4" />
                                        <ColumnManager 
                                            items={s.footer?.totals || []}
                                            onReorder={(items) => handleUpdate('footer.totals', items)}
                                            onToggleVisibility={(id, visible) => {
                                                const items = [...(s.footer?.totals || [])];
                                                const idx = items.findIndex(i => i.id === id);
                                                if (idx !== -1) { items[idx].visible = visible; handleUpdate('footer.totals', items); }
                                            }}
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                                
                                <AccordionItem value="general_note" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                     <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                         <SectionTitle icon={FileText} title="General Note" />
                                     </AccordionTrigger>
                                     <AccordionContent className="p-4 space-y-4">
                                         <div className="flex items-center justify-between gap-4 mb-4">
                                             <div className="flex items-center gap-2">
                                                 <Switch 
                                                     checked={s.footer?.note?.show ?? true}
                                                     onCheckedChange={(val) => handleUpdate('footer.note.show', val)}
                                                     className="data-[state=checked]:bg-primary"
                                                 />
                                                 <Label className="text-xs font-bold">Show Note</Label>
                                             </div>
                                             <div className="w-40 space-y-1">
                                                 <Label className="text-[9px] font-bold uppercase text-slate-400">Font Family</Label>
                                                 <FontSelector 
                                                    value={s.footer?.note?.font_family || 'Arial, sans-serif'} 
                                                    onValueChange={(v) => handleUpdate('footer.note.font_family', v)}
                                                    className="h-8 text-[10px]"
                                                 />
                                             </div>
                                         </div>
                                         <div className="space-y-2">
                                             <RichTextEditor 
                                                 value={s.footer?.note?.content || ''}
                                                 onChange={(val) => handleUpdate('footer.note.content', val)}
                                                 typeSlug={typeSlug}
                                             />
                                         </div>
                                     </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="signatures" className="border rounded-lg border-slate-100 dark:border-slate-800 overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline bg-slate-50/30 dark:bg-slate-800/30">
                                        <SectionTitle icon={PenTool} title="Signatures" />
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Switch 
                                                checked={s.footer?.signature?.show ?? true}
                                                onCheckedChange={(val) => handleUpdate('footer.signature.show', val)}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                            <Label className="text-xs font-bold">Show Signatures</Label>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Number of Signatures</Label>
                                                <Select 
                                                    value={String(s.footer?.signature?.count || 2)} 
                                                    onValueChange={(v) => {
                                                        const count = parseInt(v);
                                                        const items = [...(s.footer?.signature?.items || [])];
                                                        const updatedItems = items.map((item, idx) => ({ ...item, visible: idx < count }));
                                                        handleUpdate('footer.signature', { ...s.footer?.signature, count, items: updatedItems });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">1 Signature</SelectItem>
                                                        <SelectItem value="2">2 Signatures</SelectItem>
                                                        <SelectItem value="3">3 Signatures</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {(s.footer?.signature?.items || []).filter((_i: any, idx: number) => idx < (s.footer?.signature?.count || 2)).map((item: any, idx: number) => (
                                                 <div key={item.id} className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                                     <div className="space-y-1.5">
                                                         <Label className="text-[10px] font-bold uppercase text-slate-400">Position {idx + 1} Label</Label>
                                                         <Input 
                                                             value={item.label} 
                                                             onChange={(e) => {
                                                                 const items = [...(s.footer?.signature?.items || [])];
                                                                 const iIdx = items.findIndex(i => i.id === item.id);
                                                                 if (iIdx !== -1) { items[iIdx].label = e.target.value; handleUpdate('footer.signature.items', items); }
                                                             }}
                                                             className="h-9 text-xs" 
                                                         />
                                                     </div>
                                                     <div className="space-y-1.5">
                                                         <Label className="text-[10px] font-bold uppercase text-slate-400">Signature Image / Stamp</Label>
                                                         <div className="flex items-center gap-3">
                                                             <div className="w-12 h-12 rounded border p-1 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                                                 {item.image ? (
                                                                     <img src={item.image} className="w-full h-full object-contain" />
                                                                 ) : (
                                                                     <PenTool className="w-5 h-5 text-slate-300" />
                                                                 )}
                                                             </div>
                                                             <div className="flex flex-col gap-1">
                                                                 <Button 
                                                                     size="sm" 
                                                                     variant="outline" 
                                                                     className="h-7 text-[10px] font-bold px-2" 
                                                                     onClick={() => { 
                                                                         setMediaType(`signature_${idx}` as any); 
                                                                         setMediaOpen(true); 
                                                                     }}
                                                                 >
                                                                     {item.image ? 'Change' : 'Pick Image'}
                                                                 </Button>
                                                                 {item.image && (
                                                                     <button 
                                                                         className="text-[9px] text-red-500 hover:underline text-left font-bold"
                                                                         onClick={() => {
                                                                             const items = [...(s.footer?.signature?.items || [])];
                                                                             items[idx].image = null;
                                                                             handleUpdate('footer.signature.items', items);
                                                                         }}
                                                                     >
                                                                         Remove
                                                                     </button>
                                                                 )}
                                                             </div>
                                                         </div>
                                                     </div>
                                                 </div>
                                             ))}

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-slate-400">Line Style</Label>
                                                <Select value={s.footer?.signature?.line_style || 'solid'} onValueChange={(v) => handleUpdate('footer.signature.line_style', v)}>
                                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="solid">Solid Line</SelectItem>
                                                        <SelectItem value="dashed">Dashed Line</SelectItem>
                                                        <SelectItem value="none">No Line</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                             </Accordion>

                             <Button className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-bold h-11 shadow-lg shadow-primary/20" onClick={onSave}>
                                <Save className="w-4 h-4 mr-2" />
                                Save Template
                             </Button>
                        </TabsContent>
                    </div>
                </ScrollArea>
            </Tabs>

            <MediaSelector 
                open={mediaOpen}
                onOpenChange={setMediaOpen}
                onSelect={handleMediaSelect}
                acceptedType="photo"
            />
        </aside>
    );
};

// Helper to get nested value
function handleGet(obj: any, path: string) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export default PropertiesPanel;
