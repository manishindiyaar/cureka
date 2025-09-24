export var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["SCHEDULED"] = "SCHEDULED";
    AppointmentStatus["CONFIRMED"] = "CONFIRMED";
    AppointmentStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
    AppointmentStatus["NO_SHOW"] = "NO_SHOW";
    AppointmentStatus["RESCHEDULED"] = "RESCHEDULED";
})(AppointmentStatus || (AppointmentStatus = {}));
export var AppointmentType;
(function (AppointmentType) {
    AppointmentType["CONSULTATION"] = "consultation";
    AppointmentType["FOLLOWUP"] = "followup";
    AppointmentType["EMERGENCY"] = "emergency";
    AppointmentType["SURGERY_CONSULTATION"] = "surgery_consultation";
    AppointmentType["TELEMEDICINE"] = "telemedicine";
    AppointmentType["PRESCRIPTION_REVIEW"] = "prescription_review";
    AppointmentType["FOLLOW_UP_SURGERY"] = "follow_up_surgery";
})(AppointmentType || (AppointmentType = {}));
export const APPOINTMENT_DURATIONS = {
    [AppointmentType.CONSULTATION]: 30,
    [AppointmentType.FOLLOWUP]: 20,
    [AppointmentType.EMERGENCY]: 60,
    [AppointmentType.SURGERY_CONSULTATION]: 45,
    [AppointmentType.TELEMEDICINE]: 30,
    [AppointmentType.PRESCRIPTION_REVIEW]: 15,
    [AppointmentType.FOLLOW_UP_SURGERY]: 30
};
//# sourceMappingURL=appointments.dto.js.map