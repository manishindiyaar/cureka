export declare const createAppointmentValidation: import("express-validator").ValidationChain[];
export declare const getAppointmentValidation: import("express-validator").ValidationChain[];
export declare const getAvailableSlotsValidation: import("express-validator").ValidationChain[];
export declare const updateAppointmentStatusValidation: import("express-validator").ValidationChain[];
export declare const validateAppointmentSlot: import("express-validator").ValidationChain;
export declare const APPOINTMENT_TYPES_CONFIG: {
    CONSULTATION: {
        value: string;
        duration: number;
        cal_type: string;
    };
    FOLLOWUP: {
        value: string;
        duration: number;
        cal_type: string;
    };
    EMERGENCY: {
        value: string;
        duration: number;
        cal_type: string;
    };
    SURGERY_CONSULTATION: {
        value: string;
        duration: number;
        cal_type: string;
    };
    TELEMEDICINE: {
        value: string;
        duration: number;
        cal_type: string;
    };
    PRESCRIPTION_REVIEW: {
        value: string;
        duration: number;
        cal_type: string;
    };
};
export declare const BUSINESS_HOURS: {
    start: number;
    end: number;
};
export declare const MAX_FUTURE_BOOKING_DAYS = 60;
export declare const MIN_ADVANCE_BOOKING_HOURS = 1;
export declare const APPOINTMENT_NUMBER_PREFIX = "AID";
export declare const DEFAULT_APPOINTMENT_DURATION = 30;
//# sourceMappingURL=appointments.validation.d.ts.map