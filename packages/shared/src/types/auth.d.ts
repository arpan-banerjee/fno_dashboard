/**
 * User roles in the system
 */
export type UserRole = 'superadmin' | 'admin' | 'user';
/**
 * User status based on plan
 */
export type UserStatus = 'free' | 'paid' | 'expired';
/**
 * Plan types
 */
export type PlanType = 'free' | 'paid_90' | 'paid_180' | 'paid_365';
/**
 * User plan information
 */
export interface UserPlan {
    type: PlanType;
    start: string;
    end: string;
}
/**
 * Device information
 */
export interface Device {
    device_id: string;
    added_at: string;
}
/**
 * User entity
 */
export interface User {
    id: string;
    name: string;
    email: string;
    mobile?: string;
    password_hash: string;
    role: UserRole;
    plans: UserPlan[];
    devices: Device[];
    status: UserStatus;
    created_at: string;
    updated_at: string;
}
/**
 * JWT payload
 */
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    device_id?: string;
}
/**
 * Login request
 */
export interface LoginRequest {
    email: string;
    password: string;
    device_fingerprint: string;
}
/**
 * Registration request
 */
export interface RegisterRequest {
    name: string;
    email: string;
    mobile: string;
    password: string;
}
/**
 * Auth response
 */
export interface AuthResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        status: UserStatus;
    };
}
