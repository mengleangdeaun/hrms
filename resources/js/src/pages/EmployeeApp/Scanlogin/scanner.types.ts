export interface AttendanceScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose?: () => void;
    onFileScan?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    title?: string;
    description?: string;
}
