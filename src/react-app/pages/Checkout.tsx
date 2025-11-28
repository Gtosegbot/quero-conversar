import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, CreditCard, Loader2, ShieldCheck, CheckCircle } from 'lucide-react';
import { PaymentService } from '../../services/PaymentService';
import PulsingHeart from '../components/PulsingHeart';

// Initialize Stripe outside component to avoid recreation
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ amount, description, onSuccess }: { amount: number, description: string, onSuccess: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [cardComplete, setCardComplete] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        try {
            // 1. Create Payment Intent (Simulated)
            const { clientSecret } = await PaymentService.createPaymentIntent(amount * 100, description);

            // 2. Confirm Payment (Simulated)
            const cardElement = elements.getElement(CardElement);
            const result = await PaymentService.confirmPayment(clientSecret, cardElement, {
                name: 'Usuário Teste', // Should come from form
            });

            if (result.error) {
                setError(result.error.message || 'Erro no pagamento');
            } else if (result.paymentIntent?.status === 'succeeded') {
                onSuccess();
            }
        } catch (err) {
            setError('Falha ao processar pagamento. Tente novamente.');
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Dados do Cartão</h3>
                    <div className="flex space-x-2">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#424770',
                                    '::placeholder': { color: '#aab7c4' },
                                },
                                invalid: { color: '#9e2146' },
                            },
                        }}
                        onChange={(e) => setCardComplete(e.complete)}
                    />
                </div>
            </div>

            {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || processing || !cardComplete}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {processing ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processando...
                    </>
                ) : (
                    <>
                        <Lock className="w-5 h-5 mr-2" />
                        Pagar R$ {amount.toFixed(2)}
                    </>
                )}
            </button>

            <div className="flex items-center justify-center text-xs text-gray-500 space-x-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>Pagamento 100% Seguro via Stripe</span>
            </div>
        </form>
    );
};

const Checkout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [success, setSuccess] = useState(false);

    // Retrieve payment data from session storage or state
    const [paymentData, setPaymentData] = useState<any>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('pendingPayment');
        if (stored) {
            setPaymentData(JSON.parse(stored));
        } else {
            // Fallback for direct access (demo)
            setPaymentData({
                amount: 29.90,
                description: 'Plano Premium - Mensal',
                planName: 'Premium'
            });
        }
    }, []);

    if (!paymentData) return null;

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h2>
                    <p className="text-gray-600 mb-8">
                        Bem-vindo ao Quero Conversar Premium. Seu acesso foi liberado.
                    </p>
                    <button
                        onClick={() => {
                            sessionStorage.removeItem('pendingPayment');
                            navigate('/dashboard');
                        }}
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                    >
                        Ir para o Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Order Summary */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center mb-6">
                            <PulsingHeart color="text-purple-600" size="md" />
                            <h2 className="ml-3 text-xl font-bold text-gray-900">Resumo do Pedido</h2>
                        </div>

                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-gray-700">{paymentData.planName}</span>
                                <span className="font-bold text-gray-900">R$ {paymentData.amount.toFixed(2)}</span>
                            </div>
                            <p className="text-sm text-gray-500">{paymentData.description}</p>
                        </div>

                        <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                            <span>Total</span>
                            <span>R$ {paymentData.amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 flex items-start">
                        <ShieldCheck className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold text-blue-900 text-sm">Garantia de Satisfação</h4>
                            <p className="text-blue-700 text-xs mt-1">
                                Se não ficar satisfeito nos primeiros 7 dias, devolvemos seu dinheiro integralmente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Pagamento</h2>

                    <Elements stripe={stripePromise}>
                        <CheckoutForm
                            amount={paymentData.amount}
                            description={paymentData.description}
                            onSuccess={() => setSuccess(true)}
                        />
                    </Elements>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
