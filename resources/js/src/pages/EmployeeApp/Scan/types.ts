// ─── Scan Status ──────────────────────────────────────────────────────────────

export type ScanStatus = 'idle' | 'verifying' | 'success' | 'error';

// ─── Reason Type ──────────────────────────────────────────────────────────────

export type ReasonType = 'late' | 'early_departure';

// ─── API Shapes ───────────────────────────────────────────────────────────────

export interface ClockInPayload {
    auth_token: string;
    device_id: string;
    signature: string;
    user_lat: number;
    user_lng: number;
    reason?: string;
    scanned_at: string;
    payload?: string;
    branch_code?: string;
}

export interface ClockInResponse {
    require_reason?: boolean;
    type?: ReasonType;
    minutes?: number;
    message?: string;
    code?: string;
    distance?: number;
}

// ─── Proactive Policy Check ───────────────────────────────────────────────────

export type PolicyCheckResult =
    | { require_reason: false }
    | { require_reason: true; type: ReasonType; minutes: number };

// ─── Component Props ──────────────────────────────────────────────────────────

export interface AccuracyIndicatorProps {
    isPrecise: boolean;
    accuracy: number | null;
    onRefresh: () => void;
}

export interface PermissionGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface SuccessCardProps {
    // Currently stateless — kept for potential future props (employee name, timestamp, etc.)
}

export interface RadarVerificationCardProps {
    status: ScanStatus;
    message: string;
    distance: number | null;
    reasonRequired: boolean;
    isPrecise: boolean;
    isWarmingUp: boolean;
    onCancel: () => void;
    onRetry: () => void;
}

export interface ReasonSubmissionSheetProps {
    isOpen: boolean;
    reasonType: ReasonType;
    lateMinutes: number;
    reason: string;
    isVerifying: boolean;
    onReasonChange: (value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
}
