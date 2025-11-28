import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the Public Key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export interface PaymentIntentResponse {
    clientSecret: string;
    id: string;
}

export const PaymentService = {
    /**
     * Creates a Payment Intent by calling the backend Cloud Function.
     * @param amount Amount in cents (e.g., 2990 for R$ 29,90)
     * @param currency Currency code (default: 'brl')
     * @param description Description of the purchase
     */
    createPaymentIntent: async (amount: number, description: string): Promise<PaymentIntentResponse> => {
        try {
            // In a real scenario, this fetches from your Firebase Cloud Function
            // const response = await fetch('https://your-region-project.cloudfunctions.net/createPaymentIntent', { ... });

            // SIMULATION FOR DEMO:
            // Since we don't have a live backend, we simulate a successful response.
            // In production, this MUST call the backend to generate the client_secret securely.
            console.log(`[Mock] Creating Payment Intent for ${amount} ${description}`);

            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(7),
                        id: 'pi_' + Math.random().toString(36).substring(7)
                    });
                }, 1500);
            });
        } catch (error) {
            console.error("Error creating payment intent:", error);
            throw error;
        }
    },

    /**
     * Process the payment using the card element.
     * Note: This requires the Elements provider in the UI.
     */
    confirmPayment: async (clientSecret: string, cardElement: any, billingDetails: any) => {
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe not initialized");

        // In a real app with a real clientSecret, we would call:
        // return await stripe.confirmCardPayment(clientSecret, {
        //     payment_method: { card: cardElement, billing_details: billingDetails }
        // });

        // SIMULATION:
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ paymentIntent: { status: 'succeeded', id: clientSecret } });
            }, 2000);
        });
    },

    getStripe: () => stripePromise
};
