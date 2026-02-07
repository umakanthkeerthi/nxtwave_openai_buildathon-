// Mock Data Generator for Doctors

export const generateDoctors = (count, startId, specialties) => {
    return Array.from({ length: count }).map((_, i) => {
        const distance = (Math.random() * 15 + 0.5).toFixed(1); // 0.5 to 15.5 km
        return {
            id: startId + i,
            name: `Dr. ${['James', 'Sarah', 'Michael', 'Emily', 'Robert', 'Jessica'][i % 6]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'][i % 6]}`,
            degrees: "MBBS, MD",
            specialty: specialties[i % specialties.length],
            experience: (Math.random() * 15 + 5).toFixed(1),
            // Mocking availability: Random time today or tomorrow
            availableTime: i < 5 ? "Available Now" : `Today, ${(Math.floor(Math.random() * 5) + 2)}:00 PM`,
            distance: parseFloat(distance),
            image: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${(startId + i) % 99}.jpg`,
            consultationType: "Video",
            rating: (Math.random() * (5 - 4) + 4).toFixed(1) // 4.0 to 5.0
        };
    });
};

export const MOck_DATA = {
    alreadyConsulted: generateDoctors(12, 1, ['Cardiology', 'Dermatology', 'General Physician']),
    nearYou: generateDoctors(12, 13, ['Orthopaedics', 'Pediatrics', 'Dentistry', 'ENT']),
    otherDoctors: generateDoctors(12, 25, ['Neurology', 'Gynaecology', 'Psychiatry', 'Oncology'])
};
