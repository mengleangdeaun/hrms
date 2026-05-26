export interface AnnouncementFormData {
    title: string;
    type: string;
    short_description: string;
    content: string;
    start_date: string;
    end_date: string;
    is_featured: boolean;
    targeting_type: string;
    target_ids: string[];
    published_at: string;
    status: string;
    is_published: boolean;
    send_notification: boolean;
    send_telegram: boolean;
    pwa_title: string;
    pwa_display_type: string;
    pwa_action_label: string;
    pwa_action_url: string;
    has_pwa_action: boolean;
    pwa_show_title: boolean;
    pwa_show_once: boolean;
}

export interface AnnouncementDropdowns {
    branches: any[];
    departments: any[];
    employees: any[];
}
