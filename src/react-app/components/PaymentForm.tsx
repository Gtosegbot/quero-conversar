import React, { useState } from 'react';
import { CreditCard, DollarSign, Shield, CheckCircle } from 'lucide-react';
import PulsingHeart from './PulsingHeart';

interface PaymentFormProps {
  professionalId: number;
  professionalName: string;
  hourlyRate: number;
  selectedDateTime: string;
  duration: number; // in minutes
  onPaymentSuccess: (appointmentId: string) => void;
  onCancel: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  professionalId,
  professionalName,
  hourlyRate,
  selectedDateTime,
  duration,
  onPaymentSuccess,
  onCancel,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const totalAmount = (hourlyRate * duration) / 60;
  const platformFee = totalAmount * 0.2; // 20% platform fee
  const professionalAmount = totalAmount * 0.8; // 80% for professional

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Cartão de Crédito/Débito',
      icon: <CreditCard className="w-5 h-5" />,
      enabled: true,
    },
    {
      id: 'pix',
      name: 'PIX',
      icon: <DollarSign className="w-5 h-5" />,
      enabled: true,
    },
  ];

  const handlePayment = async () => {
    setProcessing(true);
    setError('');

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professional_id: professionalId,
          amount: totalAmount,
          payment_method: selectedPaymentMethod,
          appointment_details: {
            start_time: selectedDateTime,
            duration_minutes: duration,
            title: `Consulta com ${professionalName}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { appointment_id, payment_url } = await response.json();

      if (selectedPaymentMethod === 'pix') {
        // For PIX, redirect to payment page
        window.open(payment_url, '_blank');
        
        // Poll for payment status
        pollPaymentStatus(appointment_id);
      } else {
        // For card payments, simulate successful payment for demo
        const mockSuccess = true;
        
        if (!mockSuccess) {
          throw new Error('Payment failed');
        }

        onPaymentSuccess(appointment_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const pollPaymentStatus = async (appointmentId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}/payment-status`);
        const { payment_status } = await response.json();

        if (payment_status === 'completed') {
          onPaymentSuccess(appointmentId);
          return;
        }

        if (payment_status === 'failed' || attempts >= maxAttempts) {
          setError('Payment timeout or failed. Please try again.');
          setProcessing(false);
          return;
        }

        attempts++;
        setTimeout(checkStatus, 5000); // Check every 5 seconds
      } catch (error) {
        console.error('Error checking payment status:', error);
        setProcessing(false);
      }
    };

    checkStatus();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <PulsingHeart color="text-green-500" size="lg" className="mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Confirmar Pagamento</h2>
        <p className="text-gray-600">Consulta com {professionalName}</p>
      </div>

      {/* Appointment Details */}
      <div className="bg-purple-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-purple-900 mb-3">Detalhes da Consulta</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Data e Hora:</span>
            <span className="font-medium">
              {new Date(selectedDateTime).toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Duração:</span>
            <span className="font-medium">{duration} minutos</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Valor por hora:</span>
            <span className="font-medium">R$ {hourlyRate.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Resumo do Pagamento</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Consulta ({duration} min)</span>
            <span>R$ {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Taxa da plataforma (20%)</span>
            <span>R$ {platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Para o profissional (80%)</span>
            <span>R$ {professionalAmount.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total a pagar</span>
            <span>R$ {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Método de Pagamento</h3>
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedPaymentMethod(method.id)}
              disabled={!method.enabled}
              className={`w-full p-3 rounded-lg border-2 flex items-center justify-between transition-colors ${
                selectedPaymentMethod === method.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center">
                {method.icon}
                <span className="ml-3 font-medium">{method.name}</span>
              </div>
              {selectedPaymentMethod === method.id && (
                <CheckCircle className="w-5 h-5 text-purple-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 rounded-lg p-3 mb-6">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-sm text-green-800">
            Pagamento seguro e protegido
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={processing}
        >
          Cancelar
        </button>
        <button
          onClick={handlePayment}
          disabled={processing}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {processing ? (
            <>
              <PulsingHeart color="text-white" size="sm" className="mr-2" />
              Processando...
            </>
          ) : (
            `Pagar R$ ${totalAmount.toFixed(2)}`
          )}
        </button>
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Ao confirmar o pagamento, você concorda com nossos{' '}
        <a href="/terms" className="text-purple-600 hover:underline">
          Termos de Serviço
        </a>{' '}
        e{' '}
        <a href="/privacy" className="text-purple-600 hover:underline">
          Política de Privacidade
        </a>
        .
      </p>
    </div>
  );
};

export default PaymentForm;
