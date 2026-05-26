import React from 'react';
import { IconWorld, IconBuilding, IconHierarchy, IconUsers } from '@tabler/icons-react';
import { Card, Label, Toggle } from './FormElements';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';
import SearchableMultiSelect from '../../../../components/ui/SearchableMultiSelect';
import { AnnouncementFormData, AnnouncementDropdowns } from '../types';

interface TargetingSectionProps {
    form: AnnouncementFormData;
    set: (key: keyof AnnouncementFormData, value: any) => void;
    dropdowns: AnnouncementDropdowns;
    filterBranchId: string;
    setFilterBranchId: (id: string) => void;
    filterDeptId: string;
    setFilterDeptId: (id: string) => void;
}

export const TargetingSection = ({ 
    form, set, dropdowns, 
    filterBranchId, setFilterBranchId, 
    filterDeptId, setFilterDeptId,
}: TargetingSectionProps) => {

    const targetOptions = () => {
        switch (form.targeting_type) {
            case 'branch':
                return dropdowns.branches.map(b => ({ value: String(b.id), label: b.name }));
            case 'department':
                return dropdowns.departments
                    .filter(d => filterBranchId === 'all' || (d.branches && d.branches.some((b: any) => String(b.id) === filterBranchId)))
                    .map(d => ({ value: String(d.id), label: d.name }));
            case 'employee':
                return dropdowns.employees
                    .filter(e => (filterBranchId === 'all' || String(e.branch_id) === filterBranchId) &&
                                (filterDeptId === 'all' || String(e.department_id) === filterDeptId))
                    .map(e => ({ 
                        value: String(e.id), 
                        label: `${e.full_name} (${e.employee_id})`,
                        description: `Dept: ${dropdowns.departments.find(d => d.id === e.department_id)?.name || 'N/A'}`
                    }));
            default: return [];
        }
    };

    const allTargetOptions = () => {
        switch (form.targeting_type) {
            case 'branch':     return dropdowns.branches.map(b => ({ value: String(b.id), label: b.name }));
            case 'department': return dropdowns.departments.map(d => ({ value: String(d.id), label: d.name }));
            case 'employee':   return dropdowns.employees.map(e => ({ value: String(e.id), label: `${e.full_name} (${e.employee_id})` }));
            default: return [];
        }
    };

    return (
        <Card title="Audience Targeting">
            <div className="space-y-6">
                {/* Distribution Controls */}
                <div className="grid grid-cols-1 gap-3 p-3 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-inner">
                    <Toggle 
                        checked={form.send_notification} 
                        onChange={v => set('send_notification', v)}
                        label="App Notification" 
                        sublabel="Push alert via mobile PWA"
                    />
                    <hr className="border-gray-100/50 dark:border-gray-800/50" />
                    <Toggle 
                        checked={form.send_telegram} 
                        onChange={v => set('send_telegram', v)}
                        label="Sync to Telegram" 
                        sublabel="Forward to official channel"
                        activeColor="bg-sky-500" 
                    />
                </div>

                {/* Targeting Strategy */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-[10px] uppercase tracking-widest text-gray-400">Targeting Scope</Label>
                        <Select value={form.targeting_type} onValueChange={v => { set('targeting_type', v); set('target_ids', []); }}>
                            <SelectTrigger className="h-11 border-gray-200 dark:border-gray-800 bg-white dark:bg-black font-semibold shadow-sm">
                                <SelectValue placeholder="Select Target Scope..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all"><IconWorld className="inline-block mr-2 h-4 w-4" /> All Employees</SelectItem>
                                <SelectItem value="branch"><IconBuilding className="inline-block mr-2 h-4 w-4" /> Specific Branches</SelectItem>
                                <SelectItem value="department"><IconHierarchy className="inline-block mr-2 h-4 w-4" /> Specific Departments</SelectItem>
                                <SelectItem value="employee"><IconUsers className="inline-block mr-2 h-4 w-4" /> Specific Individuals</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {form.targeting_type !== 'all' && (
                        <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-gray-800 animate-in slide-in-from-top-2">
                            {form.targeting_type === 'department' && (
                                <div>
                                    <Label>Filter by Branch</Label>
                                    <SearchableSelect options={[{ value: 'all', label: 'Any Branch' }, ...dropdowns.branches.map((b: any) => ({ value: String(b.id), label: b.name }))]} value={filterBranchId} onChange={(v: any) => setFilterBranchId(String(v))} />
                                </div>
                            )}
                            {form.targeting_type === 'employee' && (
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <Label>Filter by Branch</Label>
                                        <SearchableSelect options={[{ value: 'all', label: 'Any' }, ...dropdowns.branches.map((b: any) => ({ value: String(b.id), label: b.name }))]} value={filterBranchId} onChange={(v: any) => { setFilterBranchId(String(v)); setFilterDeptId('all'); }} />
                                    </div>
                                    <div>
                                        <Label>Filter by Department</Label>
                                        <SearchableSelect options={[{ value: 'all', label: 'Any' }, ...dropdowns.departments.filter((d: any) => filterBranchId === 'all' || (d.branches && d.branches.some((b: any) => String(b.id) === filterBranchId))).map((d: any) => ({ value: String(d.id), label: d.name }))]} value={filterDeptId} onChange={(v: any) => setFilterDeptId(String(v))} />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label className="flex items-center justify-between">
                                    <span>Select Exact Targets</span>
                                    <span className="text-[10px] text-primary font-bold">{form.target_ids.length} Selected</span>
                                </Label>
                                <SearchableMultiSelect key={form.targeting_type} options={targetOptions()} allOptions={allTargetOptions()} value={form.target_ids} onChange={(v: any) => set('target_ids', v)} placeholder={`Search ${form.targeting_type}...`} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
