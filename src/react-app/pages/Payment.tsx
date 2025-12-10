import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PaymentCheckout from '../components/PaymentCheckout';
import PulsingHeart from '../components/PulsingHeart';

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check Authentication
    const userString = localStorage.getItem('user');
    if (!userString) {
      sessionStorage.setItem('redirectAfterLogin', '/payment');
      navigate('/login');
      return;
    }

    // Get payment data from sessionStorage
    const pendingPayment = sessionStorage.getItem('pendingPayment');
    if (pendingPayment) {
      setPaymentData(JSON.parse(pendingPayment));
    } else {
      // No payment data, redirect back
      navigate('/plans');
    }
    setLoading(false);
  }, [navigate]);

  const handlePaymentSuccess = (result: any) => {
    setPaymentResult(result);

    // Clear pending payment
    sessionStorage.removeItem('pendingPayment');

    // Update user plan if it's a subscription
    if (paymentData?.type === 'subscription') {
      localStorage.setItem('userPlan', paymentData.planId);

      // Only auto-redirect if NOT Pix (Pix requires manual confirmation or scanning)
      if (result.method !== 'pix') {
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('pendingPayment');
    navigate(paymentData?.type === 'subscription' ? '/plans' : '/professionals');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <PulsingHeart color="text-purple-600" size="xl" />
      </div>
    );
  }

  if (paymentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto text-center">
          {paymentResult.method === 'pix' ? (
            <>
              <QrCode className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Finalize seu Pagamento via PIX
              </h2>
              <p className="text-gray-600 mb-6">
                Use o QR Code abaixo ou o código PIX para completar seu pagamento
              </p>

              {paymentResult.qr_code && (
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <img
                    src={paymentResult.qr_code}
                    alt="QR Code PIX"
                    className="mx-auto max-w-48"
                  />
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800 font-semibold mb-2">Chave PIX (Copia e Cola):</p>
                <div className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                  <code className="text-xs text-gray-600 break-all">{paymentResult.payment_url}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(paymentResult.payment_url)}
                    className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-bold"
                  >
                    COPIAR
                  </button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Após o pagamento, você será redirecionado automaticamente.
                  Este processo pode levar alguns minutos.
                </p>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                Já Paguei - Continuar
              </button>
            </>
          ) : (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Pagamento Confirmado!
              </h2>
              <p className="text-gray-600 mb-6">
                Seu pagamento foi processado com sucesso. Você será redirecionado em alguns segundos.
              </p>

              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-green-800">
                  <strong>ID da Transação:</strong> {paymentResult.payment_id}
                </p>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors"
              >
                Continuar para o Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Nenhum pagamento pendente encontrado.</p>
          <button
            onClick={() => navigate('/plans')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Ver Planos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Finalizar Pagamento
          </h1>
        </div>

        {/* Payment Component */}
        <PaymentCheckout
          type={paymentData.type}
          amount={paymentData.amount}
          description={paymentData.description}
          planName={paymentData.planName}
          billingCycle={paymentData.billingCycle}
          professionalName={paymentData.professionalName}
          professionalId={paymentData.professionalId}
          partnerId={paymentData.partnerId}
          appointmentDate={paymentData.appointmentDate}
          onSuccess={handlePaymentSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default Payment;
