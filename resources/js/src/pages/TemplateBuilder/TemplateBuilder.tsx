import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import api from '@/utils/api';
import { cn } from '@/lib/utils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverEvent, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import FieldEditModal from './FieldEditModal';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';

interface Template {
    id: number;
    name: string;
    slug: string;
    type_id: number;
    styles: any;
    layout: any;
    layout_config?: any;
    page_size?: string;
    is_active: boolean;
    is_system?: boolean;
    type?: {
        id: number;
        name: string;
        slug: string;
    };
    document_type?: {
        id: number;
        name: string;
        slug: string;
    };
}

const DEFAULT_STYLES = {
    general: {
        paper_size: 'A4',
        orientation: 'portrait',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        font_family: 'Arial, sans-serif',
        font_size: 11,
        font_color: '#1e293b',
        primary_color: 'hsl(222.2, 47.4%, 11.2%)', // Sleek Navy/Dark
        watermark: { show: false, type: 'text', text: 'S-COOL CRM', image: null, opacity: 0.1, size: 300, rotate: -45 },
    },
    brandingOverrides: {
        enabled: false,
        source: 'system',
        company_name: null,
        company_address: null,
        company_phone: null,
        company_email: null,
        company_website: null,
        company_tin: null,
        company_logo: null,
    },
    header: {
        show: true,
        alignment: 'left',
        layout_type: 'columns',
        contact_layout: 'row',
        columns: 2,
        width: 100,
        line_height: 1.4,
        padding: { left: 0, top: 0, right: 0 },
        border_bottom: true,
        border_width: 1,
        border_color: '#e2e8f0',
        border_offset: 4,
        logo: { show: true, url: null, width: 140, position: 'left' },
        fields: {
            local_company_name: true,
            company_name: true,
            address: true,
            phone: true,
            email: true,
            website: true,
            vat_tin_number: true,
        },
    },
    doc_info: {
        show_title: true,
        title_content: '<h1 style="color: hsl(222.2, 47.4%, 11.2%); font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em;">{{doc_type_name}}</h1>',
        title_position: 'top',
        title_align: 'center',
        width_left: 50,
        width_right: 50,
        margin_top: 30,
        label: { font: 'Arial, sans-serif', size: 10, color: '#64748b', align: 'left', lang: 'all', layout: 'stack', gap: 2 },
        info: { font: 'Arial, sans-serif', size: 11, color: '#1e293b', align: 'left', separator: ':', indent_left: 130 },
        left_columns: [
            { id: 'customer_name', label: 'Customer Name', label_km: 'ឈ្មោះអតិថិជន', label_en: 'Customer Name', visible: true },
            { id: 'customer_address', label: 'Address', label_km: 'អាសយដ្ឋាន', label_en: 'Address', visible: true },
            { id: 'customer_phone', label: 'Phone', label_km: 'លេខទូរស័ព្ទ', label_en: 'Phone', visible: true },
            { id: 'vat_tin', label: 'VAT TIN', label_km: 'លេខអត្តសញ្ញាណកម្ម សារពើពន្ធ', label_en: 'VAT TIN', visible: true },
            { id: 'vehicle_reg', label: 'Plate Number', label_km: 'ស្លាកលេខ', label_en: 'Plate Number', visible: false },
            { id: 'vehicle_brand', label: 'Brand', label_km: 'ម៉ាក', label_en: 'Brand', visible: false },
            { id: 'vehicle_model', label: 'Model', label_km: 'ម៉ូដែល', label_en: 'Model', visible: false },
        ],
        right_columns: [
            { id: 'doc_number', label: 'Number', label_km: 'លេខរៀង', label_en: 'Number', visible: true },
            { id: 'doc_date', label: 'Date', label_km: 'កាលបរិច្ឆេទ', label_en: 'Date', visible: true },
            { id: 'reference', label: 'Reference', label_km: 'យោង', label_en: 'Reference', visible: true },
            { id: 'term_name', label: 'Payment Term', label_km: 'លក្ខខណ្ឌទូទាត់', label_en: 'Payment Term', visible: true },
            { id: 'vehicle_vin_last4', label: 'VIN', label_km: 'លេខតួ', label_en: 'VIN', visible: false },
            { id: 'warranty_certificate_no', label: 'Cert No', label_km: 'លេខវិញ្ញាបនបត្រ', label_en: 'Cert No', visible: false },
            { id: 'installation_date', label: 'Install Date', label_km: 'ថ្ងៃតម្លើង', label_en: 'Install Date', visible: false },
        ],
    },
    doc_note: {
        show: true,
        content: '',
        border_color: 'hsl(222.2, 47.4%, 11.2% / 0.4)', // Default subtle dark
    },
    table: {
        lang: 'all',
        header: { bg: 'hsl(222.2, 47.4%, 11.2%)', color: '#ffffff', font: 'Arial, sans-serif', size: 10, padding: 10, en_italic: true, en_underline: false },
        body: { bg: '#ffffff', color: '#1e293b', font: 'Arial, sans-serif', size: 10, padding: 8 },
        border_width: 1,
        border_color: '#e2e8f0',
        border_option: 'only_row',
        total_rows: 5,
        columns: [
            { id: 'no', label: 'No', label_km: 'ល.រ', label_en: 'No', width: 40, visible: true, align: 'center' },
            { id: 'description', label: 'Item Name / Description', label_km: 'ឈ្មោះទំញ / បរិយាយ', label_en: 'Item Name / Description', visible: true, align: 'left' },
            { id: 'unit', label: 'Unit', label_km: 'ឯកតា', label_en: 'Unit', width: 60, visible: true, align: 'center' },
            { id: 'qty', label: 'Qty', label_km: 'ចំនួន', label_en: 'Qty', width: 60, visible: true, align: 'center' },
            { id: 'unit_price', label: 'Unit Price', label_km: 'តម្លៃរាយ', label_en: 'Unit Price', width: 110, visible: true, align: 'right' },
            { id: 'discount', label: 'Discount', label_km: 'បញ្ចុះតម្លៃ', label_en: 'Discount', width: 90, visible: false, align: 'right' },
            { id: 'amount', label: 'Amount', label_km: 'ទឹកប្រាក់', label_en: 'Amount', width: 120, visible: true, align: 'right' },
            { id: 'warranty_duration', label: 'Warranty', label_km: 'ការធានា', label_en: 'Warranty', width: 100, visible: false, align: 'center' },
            { id: 'warranty_expiry', label: 'Expiry Date', label_km: 'ថ្ងៃផុតកំណត់', label_en: 'Expiry Date', width: 120, visible: false, align: 'center' },
            { id: 'lifespan', label: 'Lifespan', label_km: 'អាយុកាលប្រើប្រាស់', label_en: 'Lifespan', width: 100, visible: false, align: 'center' },
        ],
    },
    footer: {
        note: {
            show: true,
            content: '<p style="color: #64748b; font-size: 10px;"><strong>Terms & Conditions:</strong><br/>1. Goods sold are not returnable.<br/>2. Payment is due within the specified term.</p>',
        },
        summary_row: false,
        summary_riel: false,
        summary_riel_italic: true,
        total_bold: true,
        total_color_primary: false,
        layout_type: 'columns',
        columns: 2,
        font_color: '#64748b',
        totals: [
            { id: 'sub_total', label: 'Sub Total', visible: true },
            { id: 'discount', label: 'Total Discount', visible: true },
            { id: 'tax', label: 'Tax', visible: true },
            { id: 'grand_total', label: 'Grand Total', visible: true },
        ],
        signature: {
            show: true,
            count: 2,
            items: [
                { id: 'customer', label: 'Authorized Receiver', visible: true },
                { id: 'seller', label: 'Authorized Seller', visible: true },
            ],
            line_style: 'solid',
        },
    },
    overrides: {},
};

const SAMPLE_DATA: any = {
    doc_number: 'INV-2026-0001',
    doc_date: '2026-04-23',
    reference: 'REF/SO/8892',
    term_name: 'Net 30 Days',
    customer_name: 'Antigravity Enterprise Solutions',
    customer_phone: '+855 12 345 678',
    customer_address: '#123, Russian Blvd, Phnom Penh, Cambodia',
    vat_tin: 'K002-901827364',
    completed_at: '2026-04-23 10:00:00',
    job_no: 'JC-2026-0001',

    // Vehicle & Workshop Mock Data
    vehicle: {
        plate_number: '2A-8888',
        brand: { name: 'Toyota' },
        model: { name: 'Land Cruiser' },
        vin: 'TLC1234567890',
    },
    mileage_in: '45,200 km',
    technician: { name: 'John Doe' },
    status: 'In Progress',

    // Financials
    sub_total: 2500.0,
    total_tax: 250.0,
    total_discount: 0.0,
    total_amount: 2750.0,
    balance_due: 0.0,
    paid_amount: 2750.0,
    payment_status: 'PAID',
    amount_in_words: 'Two Thousand Seven Hundred and Fifty Dollars Only',

    // Procurement
    expected_delivery_date: '2026-05-01',

    material_usage: [
        {
            product: { name: 'Engine Oil 5W-30', warranty_duration: 3, warranty_unit: 'Months', lifespan_duration: 6, lifespan_unit: 'Months' },
            quantity: 4,
            unit_name: 'Liters',
            unit_price: 15,
            subtotal: 60,
        },
        {
            product: { name: 'Brake Pads Front', warranty_duration: 1, warranty_unit: 'Year', lifespan_duration: 2, lifespan_unit: 'Years' },
            quantity: 1,
            unit_name: 'Set',
            unit_price: 85,
            subtotal: 85,
        },
    ],

    branding: {
        company_name: 'S-COOL CRM',
        company_name_km: 'S-COOL CRM',
        company_address: 'No. 456, St. 271, Phnom Penh',
        company_phone: '+855 23 888 999',
        company_email: 'info@s-cool-crm.com',
        company_website: 'www.s-cool-crm.com',
    },
};

const TemplateBuilder = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const templateId = id ? parseInt(id) : undefined;
    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('general');
    const [editingField, setEditingField] = useState<any>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [systemExchangeRate, setSystemExchangeRate] = useState<number>(4100);

    // Sidebar Resizing
    const [sidebarWidth, setSidebarWidth] = useState(400);
    const [isResizing, setIsResizing] = useState(false);
    const resizingRef = React.useRef(false);
    const sidebarContainerRef = React.useRef<HTMLDivElement>(null);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Intercept navigation when there are unsaved changes
    const blocker = useBlocker(({ currentLocation, nextLocation }) => hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname);

    // Sync blocker state with modal visibility
    useEffect(() => {
        if (blocker.state === 'blocked') {
            setShowExitConfirmation(true);
        }
    }, [blocker.state]);

    const startResizing = useCallback(() => {
        setIsResizing(true);
        resizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
        resizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (!resizingRef.current || !sidebarContainerRef.current) return;

        // Calculate width relative to the container's left edge
        const rect = sidebarContainerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;

        if (newWidth > 340 && newWidth < 800) {
            setSidebarWidth(newWidth);
        }
    }, []);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    useEffect(() => {
        const fetchTemplate = async () => {
            if (!templateId) {
                setLoading(false);
                return;
            }
            try {
                const response = await api.get(`/templates/${templateId}`);
                const data = response.data;

                // Deep merge with default styles to ensure all properties exist
                const mergedStyles = {
                    ...DEFAULT_STYLES,
                    ...data.styles,
                    // Explicitly preserve overrides to prevent them from being lost during sub-section merges
                    overrides: {
                        ...(DEFAULT_STYLES.overrides || {}),
                        ...(data.styles?.overrides || {}),
                    },
                    general: { ...DEFAULT_STYLES.general, ...data.styles?.general },
                    header: { ...DEFAULT_STYLES.header, ...data.styles?.header },
                    doc_info: {
                        ...DEFAULT_STYLES.doc_info,
                        ...data.styles?.doc_info,
                        left_columns: (() => {
                            const savedL = data.styles?.doc_info?.left_columns;
                            const savedR = data.styles?.doc_info?.right_columns;
                            if (!savedL && !savedR) return DEFAULT_STYLES.doc_info.left_columns;

                            const result = [...(savedL || [])].map((col) => {
                                const def = [...DEFAULT_STYLES.doc_info.left_columns, ...DEFAULT_STYLES.doc_info.right_columns].find((d) => d.id === col.id);
                                return def ? { ...def, ...col } : col;
                            });

                            // Append missing defaults that aren't in either saved column
                            DEFAULT_STYLES.doc_info.left_columns.forEach((def) => {
                                if (!result.find((r) => r.id === def.id) && !savedR?.find((r: any) => r.id === def.id)) {
                                    result.push(def);
                                }
                            });
                            return result;
                        })(),
                        right_columns: (() => {
                            const savedL = data.styles?.doc_info?.left_columns;
                            const savedR = data.styles?.doc_info?.right_columns;
                            if (!savedL && !savedR) return DEFAULT_STYLES.doc_info.right_columns;

                            const result = [...(savedR || [])].map((col) => {
                                const def = [...DEFAULT_STYLES.doc_info.left_columns, ...DEFAULT_STYLES.doc_info.right_columns].find((d) => d.id === col.id);
                                return def ? { ...def, ...col } : col;
                            });

                            // Append missing defaults that aren't in either saved column
                            DEFAULT_STYLES.doc_info.right_columns.forEach((def) => {
                                if (!result.find((r) => r.id === def.id) && !savedL?.find((r: any) => r.id === def.id)) {
                                    result.push(def);
                                }
                            });
                            return result;
                        })(),
                    },
                    table: {
                        ...DEFAULT_STYLES.table,
                        ...data.styles?.table,
                        columns: DEFAULT_STYLES.table.columns.map((defCol) => {
                            const existing = data.styles?.table?.columns?.find((c: any) => c.id === defCol.id);
                            return existing ? { ...defCol, ...existing } : defCol;
                        }),
                    },
                    footer: { ...DEFAULT_STYLES.footer, ...data.styles?.footer },
                };

                setTemplate({ ...data, styles: mergedStyles });
            } catch (error) {
                toast.error('Failed to load template');
            } finally {
                setLoading(false);
            }
        };

        fetchTemplate();
    }, [templateId]);

    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                const response = await api.get('/settings/exchange-rate');
                if (response.data?.exchange_rate_current_value) {
                    setSystemExchangeRate(response.data.exchange_rate_current_value);
                }
            } catch (error) {
                console.error('Failed to fetch system exchange rate', error);
            }
        };
        fetchExchangeRate();
    }, []);

    // Handle beforeunload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Auto-print effect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('print') === 'true' && !loading && template) {
            // Small delay to ensure render is complete
            const timer = setTimeout(() => {
                handlePrint();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, template]);

    const handleSave = async () => {
        if (!template) return;
        setSaving(true);
        try {
            if (template.is_system) {
                const response = await api.post(`/templates/${template.id}/clone`);
                const newId = response.data.id;
                await api.put(`/templates/${newId}`, {
                    styles: template.styles,
                    layout_config: template.layout_config,
                    name: template.name,
                });
                toast.success('System template cloned and saved!');
                setHasUnsavedChanges(false);
                // Redirect to the new template ID to avoid working on the master
                navigate(`/crm/settings/templates/${newId}`);
            } else {
                await api.put(`/templates/${template.id}`, {
                    styles: template.styles,
                    layout_config: template.layout_config,
                    name: template.name,
                });
                toast.success('Template saved successfully');
                setHasUnsavedChanges(false);
            }
        } catch (error) {
            toast.error('Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!template) return;
        setSaving(true);
        try {
            const response = await api.put(`/templates/${template.id}/reset`);
            const updated = response.data.template;
            setTemplate(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    styles: updated.styles,
                    layout_config: updated.layout_config,
                    page_size: updated.page_size
                };
            });
            setHasUnsavedChanges(false);
            toast.success('Template reset to original successfully!');
        } catch (error) {
            toast.error('Failed to reset template');
            console.error(error);
        } finally {
            setSaving(false);
            setShowResetConfirm(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !template) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        if (activeId !== overId) {
            setTemplate((prev) => {
                if (!prev) return prev;
                const newLayout = { ...prev.layout_config };

                const findBlockContext = (id: string) => {
                    const sections = ['header', 'body', 'footer'];
                    for (const sectionKey of sections) {
                        const section = newLayout[sectionKey as keyof typeof newLayout];
                        const topIndex = section.findIndex((b: any) => b.id === id);
                        if (topIndex !== -1) return { section: sectionKey, container: section, index: topIndex, isTopLevel: true };

                        if (section) {
                            for (let i = 0; i < section.length; i++) {
                                const block = section[i];
                                if (block.type === 'grid_row' && block.columns) {
                                    for (const col of block.columns) {
                                        const nestedIndex = col.blocks.findIndex((b: any) => b.id === id);
                                        if (nestedIndex !== -1) return { section: sectionKey, container: col.blocks, index: nestedIndex, isTopLevel: false, rowId: block.id, colId: col.id };
                                    }
                                }
                            }
                        }
                    }
                    return null;
                };

                const activeCtx = findBlockContext(activeId);
                const overCtx =
                    findBlockContext(overId) ||
                    (['header', 'body', 'footer'].includes(overId) ? { section: overId, container: newLayout[overId as keyof typeof newLayout], index: -1, isTopLevel: true } : null);

                if (activeCtx && overCtx) {
                    const [movedBlock] = activeCtx.container.splice(activeCtx.index, 1);
                    if (overCtx.index === -1) {
                        overCtx.container.push(movedBlock);
                    } else {
                        overCtx.container.splice(overCtx.index, 0, movedBlock);
                    }
                    setHasUnsavedChanges(true);
                    return { ...prev, layout_config: newLayout };
                }

                return prev;
            });
        }
    };

    const handleRemoveBlock = (blockId: string) => {
        setTemplate((prev) => {
            if (!prev) return prev;
            const newLayout = { ...prev.layout_config };
            ['header', 'body', 'footer'].forEach((sectionKey) => {
                const key = sectionKey as keyof typeof newLayout;
                newLayout[key] = (newLayout[key] || []).filter((b: any) => b.id !== blockId);
                newLayout[key] = newLayout[key].map((block: any) => {
                    if (block.type === 'grid_row' && block.columns) {
                        return {
                            ...block,
                            columns: block.columns.map((col: any) => ({
                                ...col,
                                blocks: col.blocks.filter((b: any) => b.id !== blockId),
                            })),
                        };
                    }
                    return block;
                });
            });
            setHasUnsavedChanges(true);
            return { ...prev, layout_config: newLayout };
        });
        if (selectedBlockId === blockId) setSelectedBlockId(null);
    };

    const handleAddBlock = useCallback((section: 'header' | 'body' | 'footer', type: string) => {
        const newBlock: any = {
            id: `block_${Date.now()}`,
            type,
            label: `New ${type.replace('_', ' ')}`,
            content: '',
            styles: {},
        };

        if (type === 'grid_row') {
            newBlock.columns = [
                { id: `col_${Date.now()}_1`, blocks: [] },
                { id: `col_${Date.now()}_2`, blocks: [] },
            ];
        }

        setTemplate((prev) => {
            if (!prev) return prev;
            const newLayout = { ...prev.layout_config };
            newLayout[section] = [...(newLayout[section] || []), newBlock];
            return { ...prev, layout_config: newLayout };
        });
        setSelectedBlockId(newBlock.id);
        setHasUnsavedChanges(true);
    }, []);

    const updateBlockStyles = useCallback((blockId: string, newStyles: any) => {
        setTemplate((prev) => {
            if (!prev) return prev;
            const newLayout = { ...prev.layout_config };
            ['header', 'body', 'footer'].forEach((sectionKey) => {
                const key = sectionKey as keyof typeof newLayout;
                newLayout[key] = (newLayout[key] || []).map((block: any) => {
                    if (block.id === blockId) return { ...block, styles: { ...block.styles, ...newStyles }, label: newStyles.label || block.label };

                    if (block.type === 'grid_row' && block.columns) {
                        return {
                            ...block,
                            columns: block.columns.map((col: any) => ({
                                ...col,
                                blocks: col.blocks.map((b: any) => (b.id === blockId ? { ...b, styles: { ...b.styles, ...newStyles }, label: newStyles.label || b.label } : b)),
                            })),
                        };
                    }
                    return block;
                });
            });
            return { ...prev, layout_config: newLayout };
        });
    }, []);

    const updateGlobalStyles = useCallback((newStyles: any) => {
        setTemplate((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                styles: { ...prev.styles, ...newStyles },
            };
        });
    }, []);

    const updateTemplateMetadata = useCallback((metadata: any) => {
        setTemplate((prev) => (prev ? { ...prev, ...metadata } : null));
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleSaveFieldOverride = useCallback(
        (overrides: any) => {
            if (!editingField) return;

            // Handle special types like logo
            if (editingField.type === 'logo' || editingField.id === 'header.logo') {
                updateGlobalStyles({
                    header: {
                        ...template?.styles?.header,
                        logo: { ...template?.styles?.header?.logo, url: overrides.content },
                    },
                });
                setEditingField(null);
                return;
            }

            setTemplate((prev) => {
                if (!prev) return prev;

                let newStyles = {
                    ...prev.styles,
                    overrides: {
                        ...(prev.styles?.overrides || {}),
                        [editingField.id]: overrides,
                    },
                };

                // If it's a branding field, also update brandingOverrides for synchronization with the sidebar
                if (editingField.id.startsWith('branding.')) {
                    const brandingKey = editingField.id.replace('branding.', 'company_');
                    newStyles.brandingOverrides = {
                        ...(newStyles.brandingOverrides || {}),
                        [brandingKey]: overrides.content,
                        source: 'custom', // Auto-switch to custom when editing branding on canvas
                    };
                }

                return {
                    ...prev,
                    styles: newStyles,
                };
            });
            setHasUnsavedChanges(true);
            setEditingField(null); // Close modal on save
        },
        [editingField, template, updateGlobalStyles],
    );

    const updatePageSize = useCallback((newSize: string) => {
        setTemplate((prev) => {
            if (!prev) return prev;
            return { ...prev, page_size: newSize };
        });
    }, []);

    const handleClose = () => {
        navigate(-1);
    };

    if (loading)
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide animate-pulse">Loading Design...</p>
            </div>
        );

    if (!template) return <div className="p-8 text-center text-muted-foreground font-bold font-google_sans">Template not found.</div>;

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div ref={sidebarContainerRef} className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-google_sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
                {/* Left Properties Panel */}
                <div className="no-print h-full shrink-0 relative" style={{ width: `${sidebarWidth}px` }}>
                    <PropertiesPanel
                        selectedBlockId={selectedBlockId}
                        template={template}
                        typeSlug={template.document_type?.slug || ''}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onSave={handleSave}
                        onClose={handleClose}
                        onUpdateStyles={(id: string, s: any) => {
                            updateBlockStyles(id, s);
                            setHasUnsavedChanges(true);
                        }}
                        onUpdateGlobalStyles={(s: any) => {
                            updateGlobalStyles(s);
                            setHasUnsavedChanges(true);
                        }}
                        onUpdateTemplate={(m: any) => {
                            updateTemplateMetadata(m);
                            setHasUnsavedChanges(true);
                        }}
                        onUpdatePageSize={(size: string) => {
                            updatePageSize(size);
                            setHasUnsavedChanges(true);
                        }}
                        onAddBlock={handleAddBlock}
                    />

                    {/* Resize Handle */}
                    <div
                        onMouseDown={startResizing}
                        className={cn('absolute top-0 right-0 w-1 h-full cursor-col-resize z-50 transition-colors group', isResizing ? 'bg-primary' : 'hover:bg-primary/30')}
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 flex flex-col justify-between items-center py-1 bg-white border border-slate-200 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                            <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                            <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                        </div>
                    </div>
                </div>

                {/* Right Canvas */}
                <div className="flex-1 h-full min-w-0 overflow-hidden relative flex flex-col">
                    {/* Toolbar / Header */}
                    <div className="no-print h-14 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 shrink-0 shadow-sm z-20 sticky top-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <IconDeviceFloppy className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none mb-1">
                                    {template.name}
                                    {hasUnsavedChanges && <span className="ml-2 text-primary animate-pulse text-[10px] uppercase tracking-tighter">● Unsaved Changes</span>}
                                </h1>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    {template.document_type?.name || 'Document'} • {template.is_system ? 'System Master' : 'Custom Layout'} • {template.page_size}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {!template.is_system && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="font-bold text-xs text-red-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 dark:hover:bg-red-950/50 dark:hover:border-red-800"
                                    onClick={() => setShowResetConfirm(true)}
                                >
                                    Reset to Original
                                </Button>
                            )}
                            <Button variant="outline" size="sm" className="font-bold text-xs px-4 dark:border-slate-700 dark:hover:bg-slate-800" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button variant="outline" size="sm" className="font-bold text-xs px-4 border-primary text-primary hover:bg-primary/5 shadow-sm" onClick={handlePrint}>
                                Test Print
                            </Button>
                            <Button
                                size="sm"
                                disabled={saving}
                                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                onClick={handleSave}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Design'}
                            </Button>
                        </div>
                    </div>

                    <div id="printable-area" className="flex-1 overflow-hidden relative flex flex-col print-reset">
                        <Canvas
                            className="h-full"
                            layout={template.layout_config}
                            styles={template.styles}
                            data={{ ...SAMPLE_DATA, exchange_rate: systemExchangeRate }}
                            items={SAMPLE_DATA.material_usage}
                            pageSize={template.page_size}
                            activeTab={activeTab}
                            onSelectTab={setActiveTab}
                            onSelectBlock={setSelectedBlockId}
                            selectedBlockId={selectedBlockId}
                            onRemoveBlock={handleRemoveBlock}
                            onAddBlock={handleAddBlock}
                            typeSlug={template.document_type?.slug || ''}
                            onEditField={(field: any) => {
                                if (field.type === 'logo') {
                                    updateGlobalStyles({
                                        header: {
                                            ...template?.styles?.header,
                                            logo: { ...template?.styles?.header?.logo, url: field.value },
                                        },
                                    });
                                    setHasUnsavedChanges(true);
                                    return;
                                }
                                setEditingField(field);
                            }}
                            isResizing={isResizing}
                        />
                    </div>
                </div>
            </div>

            {/* Global Resizing Overlay to prevent interaction interference */}
            {isResizing && (
                <div className="fixed inset-0 z-[100] cursor-col-resize select-none pointer-events-auto bg-transparent" onMouseMove={(e: any) => resize(e.nativeEvent)} onMouseUp={stopResizing} />
            )}

            {editingField && (
                <FieldEditModal
                    isOpen={!!editingField}
                    onClose={() => setEditingField(null)}
                    onSave={handleSaveFieldOverride}
                    fieldId={editingField.id}
                    label={editingField.label}
                    currentValue={editingField.value}
                    currentStyles={editingField.styles}
                    typeSlug={template.document_type?.slug || template.type?.slug}
                />
            )}

            <ConfirmationModal
                isOpen={showExitConfirmation}
                setIsOpen={(open) => {
                    setShowExitConfirmation(open);
                    if (!open && blocker.state === 'blocked') {
                        blocker.reset();
                    }
                }}
                title="Unsaved Changes"
                description="You have unsaved changes in your design. Are you sure you want to exit without saving?"
                confirmText="Exit without saving"
                cancelText="Keep Editing"
                confirmVariant="danger"
                onConfirm={() => {
                    setShowExitConfirmation(false);
                    blocker.proceed?.();
                }}
            />

            <ConfirmationModal
                isOpen={showResetConfirm}
                setIsOpen={setShowResetConfirm}
                title="Reset Design to Original?"
                description="This will permanently delete all your customizations and restore the original system design for this template. This action cannot be undone."
                confirmText="Yes, Reset Design"
                cancelText="Cancel"
                confirmVariant="danger"
                onConfirm={handleReset}
            />
        </DndContext>
    );
};

export default TemplateBuilder;
