import { pwaFetch } from '@/lib/pwa-fetch';
import type { ClockInPayload, ClockInResponse } from '../types';

// ─── Clock-In API ─────────────────────────────────────────────────────────────

/**
 * Submits the employee's attendance clock-in to the server.
 * Throws if the network request itself fails (offline / CORS error).
 */
export async function clockIn(
    body: ClockInPayload,
    authToken: string,
): Promise<{ ok: boolean; status: number; data: ClockInResponse }> {
    const res = await pwaFetch('/api/employee-app/attendance/clock-in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
    });

    const data: ClockInResponse = await res.json();
    return { ok: res.ok, status: res.status, data };
}

// ─── Offline Queue ────────────────────────────────────────────────────────────

const QUEUE_KEY = 'attendance_sync_queue';

/**
 * Saves a failed scan to the local offline queue so it can be
 * re-submitted by `AttendanceContext.syncQueue()` when connectivity resumes.
 */
export function enqueueOfflineAttendance(
    payload: Omit<ClockInPayload, 'auth_token'>,
): void {
    try {
        const current = localStorage.getItem(QUEUE_KEY);
        const queue: Omit<ClockInPayload, 'auth_token'>[] = current
            ? JSON.parse(current)
            : [];
        queue.push(payload);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.warn('[attendance.service] Failed to enqueue offline attendance', e);
    }
}
