import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '../firebase-config';

export const getReferralLink = (userId: string): string => {
    // In production, this would be a real domain
    return `${window.location.origin}/register?ref=${userId}`;
};

export const checkReferralStatus = async (userId: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data();
            return {
                count: data.referralCount || 0,
                target: 20,
                isPremium: data.plan === 'premium'
            };
        }
        return { count: 0, target: 20, isPremium: false };
    } catch (error) {
        console.error("Error checking referral status:", error);
        return { count: 0, target: 20, isPremium: false };
    }
};

export const simulateReferral = async (userId: string) => {
    // This is for testing purposes to increment the counter
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            referralCount: increment(1)
        }, { merge: true });

        // Check if upgrade is needed
        const updatedSnap = await getDoc(userRef);
        if (updatedSnap.exists() && updatedSnap.data().referralCount >= 20 && updatedSnap.data().plan === 'free') {
            await updateDoc(userRef, { plan: 'premium' });
            return { success: true, upgraded: true };
        }

        return { success: true, upgraded: false };
    } catch (error) {
        console.error("Error simulating referral:", error);
        return { success: false, upgraded: false };
    }
};
