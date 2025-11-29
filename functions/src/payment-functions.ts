import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// Initialize Stripe with Secret Key (from environment config)
// Run: firebase functions:config:set stripe.secret="sk_live_..."
const stripeConfig = functions.config().stripe;
const stripeSecret = stripeConfig ? stripeConfig.secret : "MISSING_SECRET";

const stripe = new Stripe(stripeSecret, {
    apiVersion: '2023-10-16',
});

if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

/**
 * Creates a Payment Intent for a Subscription or One-time purchase.
 */
export const createPaymentIntent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    const { amount, currency = 'brl', description, isSubscription } = data;

    try {
        // Create the PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            description,
            metadata: {
                userId: context.auth.uid,
                type: isSubscription ? 'subscription' : 'one_time'
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return {
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id
        };
    } catch (error) {
        console.error("Stripe Error:", error);
        throw new functions.https.HttpsError('internal', 'Payment creation failed');
    }
});

/**
 * Creates a Split Payment Intent for Professional Consultation.
 * Logic: 75% to Professional, 25% to Platform.
 */
export const createSplitPaymentIntent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    const { amount, professionalId, appointmentId } = data;

    try {
        // 1. Get Professional's Stripe Account ID from Firestore
        const proDoc = await db.collection('users').doc(professionalId).get();
        const proStripeId = proDoc.data()?.stripeAccountId;

        if (!proStripeId) {
            throw new functions.https.HttpsError('failed-precondition', 'Professional not onboarded to Stripe');
        }

        // 2. Calculate Split (e.g., 75/25)
        const totalAmount = Math.round(amount * 100);
        const platformFee = Math.round(totalAmount * 0.25); // 25% fee

        // 3. Create PaymentIntent with Transfer Data
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount,
            currency: 'brl',
            automatic_payment_methods: { enabled: true },
            application_fee_amount: platformFee, // Platform keeps this
            transfer_data: {
                destination: proStripeId, // Professional gets the rest
            },
            metadata: {
                userId: context.auth.uid,
                professionalId,
                appointmentId,
                type: 'consultation'
            }
        });

        return {
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id
        };

    } catch (error) {
        console.error("Split Payment Error:", error);
        throw new functions.https.HttpsError('internal', 'Split payment failed');
    }
});

/**
 * Stripe Webhook Handler.
 * Endpoint: https://queroconversar.shop/api/stripeWebhook (or mapped Cloud Function URL)
 * Secret: Set via `firebase functions:config:set stripe.webhook_secret="whsec_..."`
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = functions.config().stripe.webhook_secret;

    let event;

    try {
        if (!sig || !endpointSecret) throw new Error('Missing signature or secret');
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handleSuccessfulPayment(paymentIntent);
                break;

            // Add other event types like 'invoice.payment_succeeded' for subscriptions
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).send("Internal Server Error");
    }
});

/**
 * Internal helper to update Firestore after successful payment.
 */
async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
    const { userId, type, appointmentId } = paymentIntent.metadata;

    if (type === 'subscription') {
        // Upgrade user to Premium
        await db.collection('users').doc(userId).update({
            plan: 'premium',
            subscriptionStatus: 'active',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`User ${userId} upgraded to Premium.`);
    }
    else if (type === 'consultation' && appointmentId) {
        // Confirm appointment
        await db.collection('appointments').doc(appointmentId).update({
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentId: paymentIntent.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Appointment ${appointmentId} confirmed.`);
    }
}
