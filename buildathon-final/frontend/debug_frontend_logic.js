
// Simulate the data from the API
const apiResponse = [
    {
        "id": "odfg4GvxH8gaVHOZvENg",
        "patient_id": null,
        "created_at": "2026-02-10T18:01:20.601700",
        "data": {
            "patient_profile": {
                "gender": "Male",
                "age": "19",
                "name": "batman"
            },
            "pre_doctor_consultation_summary": {
                "trigger_reason": "Emergency Appointment Booking",
                "assessment": {
                    "severity": "HIGH",
                    "severity_score": 99
                },
                "vitals_reported": {}
            }
        },
        "source_type": "appointment",
        "appointment_details": {
            "slot_time": "2026-02-11 09:00 AM",
            "slot_id": "5vHBBhyxoTLQIiiSBgyR",
            "created_at": "2026-02-10T18:01:20.601700",
            "user_id": "JIRu4z7TZzNnXVQrtFmKsWQ79u13",
            "appointment_id": "appt_f79ef75a-9f7b-4bce-b212-3f45be990a94",
            "doctor_id": "DOC-1000",
            "mode": "OFFLINE",
            "is_emergency": true,
            "pre_doctor_consultation_summary_id": null,
            "case_id": "CASE-OFFLINE-1770746448976",
            "status": "SCHEDULED",
            "profile_id": "vZVcKFi5kC3LYw5rLjr9",
            "patient_snapshot": {
                "gender": "Male",
                "age": "19",
                "name": "batman"
            }
        }
    }
];

// Replicate DoctorEmergency.jsx logic
try {
    const formatted = apiResponse.map(item => {
        const summary = item.data?.pre_doctor_consultation_summary || {};
        const profile = item.data?.patient_profile || {};

        // [NEW] Handle Appointment Data Source
        const isAppointment = item.source_type === 'appointment';
        const trigger = isAppointment ? "Emergency Appointment" : (summary.trigger_reason || "Critical Health Alert");

        return {
            emergencyId: item.id,
            patientId: item.patient_id,
            patientProfile: {
                name: profile.name || "Unknown",
                age: profile.age || "?",
                gender: profile.gender || "?"
            },
            triggerSource: isAppointment ? "Direct Booking" : "AI Triage",
            triggerReason: trigger,
            detectedAt: item.created_at || new Date().toISOString(),
            severityScore: summary.assessment?.severity_score || 90,
            severityLevel: summary.assessment?.severity || "HIGH",
            vitals: summary.vitals_reported || {},
            location: { lat: 12.9716, lng: 77.5946 }, // Default for now
            status: "PENDING",
            sourceType: item.source_type // Pass through
        };
    });
    console.log("Success! Formatted data:", JSON.stringify(formatted, null, 2));
} catch (error) {
    console.error("Error formatting data:", error);
}
