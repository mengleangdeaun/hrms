import React, { useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useHRBranches } from '@/hooks/useHRData';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useTranslation } from 'react-i18next';

interface BranchSelectorProps {
    value: number | number[] | null | 'all';
    onChange: (value: number | number[] | null) => void;
    showAllOption?: boolean;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}
interface Branch {
    id: number;
    name: string;
    code?: string;
}
const BranchSelector: React.FC<BranchSelectorProps> = ({
    value,
    onChange,
    showAllOption = true,
    placeholder,
    className,
    disabled = false
}) => {
    const { t } = useTranslation();
    const { user, hasRole } = useAuth();
    const { data: allBranches, isLoading } = useHRBranches();
    const isSuperAdmin = hasRole('super-admin');
    const availableBranches = useMemo<Branch[]>(() => {
        if (!allBranches) return [];
        const branches = allBranches as Branch[];
        if (isSuperAdmin) return branches;
        const userBranchIds = user?.branches?.map(b => b.id) || [];
        return branches.filter(b => userBranchIds.includes(b.id));
    }, [isSuperAdmin, allBranches, user]);
    const options = useMemo(() => {
        const branchOpts = availableBranches.map(b => ({
            value: b.id.toString(),
            label: b.name,
            description: b.code ? `${t('code', 'Code')}: ${b.code}` : undefined
        }));

        // Do not show "All Branches" if there is only one branch available
        if (showAllOption && availableBranches.length > 1) {
            return [
                { 
                    value: 'all', 
                    label: isSuperAdmin ? t('all_branches', 'All Branches') : t('all_my_branches', 'All My Branches'), 
                    description: isSuperAdmin 
                        ? t('overall_view_admin', 'View data across all company branches') 
                        : t('overall_view_user', 'View data across all your authorized branches') 
                },
                ...branchOpts
            ];
        }

        return branchOpts;
    }, [availableBranches, t, showAllOption, isSuperAdmin]);

    const handleSelect = (val: string | number) => {
        const stringVal = val.toString();
        if (stringVal === 'all') {
            if (isSuperAdmin) {
                onChange(null);
            } else {
                onChange(availableBranches.map(b => b.id));
            }
        } else {
            onChange(Number(stringVal));
        }
    };

    const selectValue = useMemo(() => {
        if (availableBranches.length === 1) return availableBranches[0].id.toString();
        if (!value || value === 'all') return showAllOption ? 'all' : '';
        if (Array.isArray(value)) return 'all';
        return value.toString();
    }, [value, showAllOption, availableBranches]);
    useEffect(() => {
        if (isLoading || !availableBranches.length) return;
        
        if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
            if (availableBranches.length === 1) {
                const autoVal = availableBranches[0].id;
                onChange(autoVal);
            } else if (showAllOption) {
                // handleSelect('all') already handles the isSuperAdmin check
                handleSelect('all');
            }
        } else if ((value as any) === 'all' && availableBranches.length === 1) {
            const autoVal = availableBranches[0].id;
            onChange(autoVal);
        } else if (value !== 'all' && !Array.isArray(value)) {
            const isValid = availableBranches.some(b => b.id.toString() === value.toString());
            if (!isValid && availableBranches.length > 0) {
                if (availableBranches.length === 1) {
                    const autoVal = availableBranches[0].id;
                    onChange(autoVal);
                } else if (showAllOption) {
                    handleSelect('all');
                }
            }
        }
    }, [availableBranches, value, onChange, isLoading, isSuperAdmin, showAllOption]);

    return (
        <SearchableSelect
            options={options}
            value={selectValue}
            onChange={handleSelect}
            placeholder={placeholder || t('select_branch', 'Select Branch')}
            loading={isLoading}
            className={className}
            disabled={disabled}
        />
    );
};

export default BranchSelector;
