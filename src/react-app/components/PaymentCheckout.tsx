import React, { useState } from 'react';
import { CreditCard, DollarSign, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import PulsingHeart from './PulsingHeart';
import { db } from '../../firebase-config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface PaymentCheckoutProps {
  type: 'subscription' | 'appointment';
  amount: number;
  description: string;
  planName?: string;
  billingCycle?: 'monthly' | 'yearly';
  professionalName?: string;
  appointmentDate?: string;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  type,
  amount,
  description,
  planName,
  billingCycle,
  professionalName,
  appointmentDate,
  onSuccess,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'pix'>('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });

  const handleCardInputChange = (field: string, value: string) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError('');

    try {
      if (selectedMethod === 'card') {
        // Validate card data
        if (!cardData.number || !cardData.expiry || !cardData.cvv || !cardData.name) {
          throw new Error('Por favor, preencha todos os dados do cartão');
        }
      }

      // Create payment record in Firestore
      const paymentData = {
        type,
        amount,
        description,
        planName: planName || null,
        billingCycle: billingCycle || null,
        professionalName: professionalName || null,
        appointmentDate: appointmentDate || null,
        paymentMethod: selectedMethod,
        status: selectedMethod === 'pix' ? 'pending' : 'completed', // Card simulated as instant success
        createdAt: serverTimestamp(),
        userId: JSON.parse(localStorage.getItem('user') || '{}').uid || 'anonymous',
        userEmail: JSON.parse(localStorage.getItem('user') || '{}').email || 'anonymous',
        cardDetails: selectedMethod === 'card' ? {
          last4: cardData.number.slice(-4),
          brand: 'mastercard' // Simulated
        } : null
      };

      const docRef = await addDoc(collection(db, 'payments'), paymentData);

      if (selectedMethod === 'pix') {
        // Manual PIX Flow
        const pixKey = "ff576050-99a7-4158-b4ea-1eb0db3098ac";
        // Generate a static QR code URL (using a public API for demo purposes or a placeholder)
        // In a real app, you'd generate this based on the payload.
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${pixKey}`;

        onSuccess({
          method: 'pix',
          qr_code: qrCodeUrl,
          payment_url: pixKey, // Displaying the key as the "url" or copyable text
          payment_id: docRef.id,
        });
      } else {
        // Card Simulation
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        onSuccess({
          method: 'card',
          payment_id: docRef.id,
          transaction_id: `tx_${Math.random().toString(36).substr(2, 9)}`,
        });
      }

    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : 'Erro no pagamento');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <PulsingHeart color="text-purple-600" size="lg" className="mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {type === 'subscription' ? 'Confirmar Assinatura' : 'Confirmar Pagamento'}
        </h2>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Payment Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Resumo do Pagamento</h3>
        <div className="space-y-3">
          {type === 'subscription' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Plano:</span>
                <span className="font-medium">{planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ciclo:</span>
                <span className="font-medium">
                  {billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
                </span>
              </div>
            </>
          )}
          {type === 'appointment' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Profissional:</span>
                <span className="font-medium">{professionalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data:</span>
                <span className="font-medium">
                  {appointmentDate && new Date(appointmentDate).toLocaleString('pt-BR')}
                </span>
              </div>
            </>
          )}
          <div className="border-t pt-3 flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span className="text-purple-600">R$ {amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Método de Pagamento</h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setSelectedMethod('card')}
            className={`p-4 rounded-lg border-2 flex items-center justify-center transition-colors ${selectedMethod === 'card'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            <span className="font-medium">Cartão</span>
          </button>
          <button
            onClick={() => setSelectedMethod('pix')}
            className={`p-4 rounded-lg border-2 flex items-center justify-center transition-colors ${selectedMethod === 'pix'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <DollarSign className="w-5 h-5 mr-2" />
            <span className="font-medium">PIX</span>
          </button>
        </div>

        {/* Card Form */}
        {selectedMethod === 'card' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Cartão
              </label>
              <input
                type="text"
                value={cardData.number}
                onChange={(e) => handleCardInputChange('number', formatCardNumber(e.target.value))}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validade
                </label>
                <input
                  type="text"
                  value={cardData.expiry}
                  onChange={(e) => handleCardInputChange('expiry', formatExpiry(e.target.value))}
                  placeholder="MM/AA"
                  maxLength={5}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  value={cardData.cvv}
                  onChange={(e) => handleCardInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                  placeholder="000"
                  maxLength={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome no Cartão
              </label>
              <input
                type="text"
                value={cardData.name}
                onChange={(e) => handleCardInputChange('name', e.target.value.toUpperCase())}
                placeholder="NOME COMO NO CARTÃO"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* PIX Info */}
        {selectedMethod === 'pix' && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">Pagamento via PIX</span>
            </div>
            <p className="text-sm text-blue-800">
              Você será redirecionado para finalizar o pagamento via PIX.
              O pagamento é processado instantaneamente.
            </p>
          </div>
        )}
      </div>

      {/* Security Badge */}
      <div className="bg-green-50 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-sm text-green-800 font-medium">
            Pagamento 100% seguro e criptografado
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
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
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar Pagamento
            </>
          )}
        </button>
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center mt-6">
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

export default PaymentCheckout;
