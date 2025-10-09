// Types for the calendar events
export interface Event {
    id: number;
    association_id: number;
    name: string;
    description?: string;
    date: Date;
    price?: number;
    place?: string;
    shotgun_list_length?: number;
    shotgun_waiting_list?: number;
    shotgun_starting_date?: Date;
    closing_date?: Date;
    duration?: number; // in minutes
    status?: string;
    event_open?: boolean;
    created_at: Date;
    updated_at: Date;
    img_id?: number;
    collect_link?: string;
    is_bookable?: boolean;
    public_event?: boolean;
}

export interface Association {
    id: number;
    logo_id?: number;
    name: string;
    description?: string;
    tag?: string;
    color?: string;
    last_action_date?: Date;
    created_at: Date;
    updated_at: Date;
    is_list?: boolean;
    color_2?: string;
    contrast_color?: string;
    contrast_color_2?: string;
    is_active?: boolean;
}

export interface Role {
    id: number;
    name: string;
    permissions: number; // Bitmask of permissions
    created_at: Date;
    updated_at: Date;
}







