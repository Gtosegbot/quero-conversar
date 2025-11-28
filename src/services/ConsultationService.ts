import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
    serverTimestamp,
    addDoc
} from 'firebase/firestore';
import { db } from '../firebase-config';

export interface ReallocationOption {
    professionalId: string;
    name: string;
    rating: number;
    specialty: string;
}

export const ConsultationService = {
    /**
     * Cancels an appointment and triggers the "Uber-style" reallocation flow.
     */
    cancelAppointment: async (appointmentId: string, reason: string, cancelledBy: 'professional' | 'user') => {
        try {
            const apptRef = doc(db, 'appointments', appointmentId);
            const apptSnap = await getDoc(apptRef);

            if (!apptSnap.exists()) throw new Error("Appointment not found");

            const apptData = apptSnap.data();

            // 1. Mark as cancelled (or 'seeking_replacement' if by professional)
            const newStatus = cancelledBy === 'professional' ? 'seeking_replacement' : 'cancelled';

            await updateDoc(apptRef, {
                status: newStatus,
                cancellationReason: reason,
                cancelledBy,
                cancelledAt: serverTimestamp()
            });

            if (cancelledBy === 'professional') {
                // 2. Trigger search for replacements (Simulated Cloud Function)
                return await ConsultationService.findReplacements(apptData.date, apptData.time);
            }

            return { status: 'cancelled', replacements: [] };

        } catch (error) {
            console.error("Error cancelling appointment:", error);
            throw error;
        }
    },

    /**
     * Finds other professionals available at the specific date/time.
     * In a real app, this would query the 'professional_settings' collection.
     */
    findReplacements: async (date: string, time: string): Promise<ReallocationOption[]> => {
        // Mock logic - in production this queries Firestore for availability
        console.log(`Searching for professionals available on ${date} at ${time}...`);

        // Simulating finding 3 available pros
        return [
            { professionalId: 'pro_1', name: 'Dra. Ana Silva', rating: 4.9, specialty: 'Ansiedade' },
            { professionalId: 'pro_2', name: 'Dr. Carlos Santos', rating: 4.8, specialty: 'Depressão' },
            { professionalId: 'pro_3', name: 'Dra. Beatriz Costa', rating: 5.0, specialty: 'Terapia Cognitiva' }
        ];
    },

    /**
     * Reallocates the appointment to a new professional.
     */
    reallocateAppointment: async (appointmentId: string, newProfessionalId: string, newProfessionalName: string) => {
        try {
            const apptRef = doc(db, 'appointments', appointmentId);

            await updateDoc(apptRef, {
                professionalId: newProfessionalId,
                professionalName: newProfessionalName, // Denormalized for easy access
                status: 'confirmed', // Back to confirmed
                reallocated: true,
                previousProfessionalId: 'old_id_placeholder', // Should fetch from snapshot
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error("Error reallocating appointment:", error);
            throw error;
        }
    }
};
