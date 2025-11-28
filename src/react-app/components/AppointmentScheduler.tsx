import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Video, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import PulsingHeart from './PulsingHeart';



interface TimeSlot {
  time: string;
  available: boolean;
}

interface AppointmentSchedulerProps {
  professional: any;
  onClose: () => void;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  professional,
  onClose,
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(60); // Default 60 minutes
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate next 30 days for date selection
  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1); // Start from tomorrow
    return date.toISOString().split('T')[0];
  });

  const hourlyRate = professional.hourly_rate || professional.hourlyRate || 100;
  
  const durationOptions = [
    { value: 30, label: '30 minutos', price: hourlyRate * 0.5 },
    { value: 45, label: '45 minutos', price: hourlyRate * 0.75 },
    { value: 60, label: '1 hora', price: hourlyRate },
    { value: 90, label: '1h 30min', price: hourlyRate * 1.5 },
  ];

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate, professional.id]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/professionals/${professional.id}/available-slots?date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      // Generate default slots if API fails
      generateDefaultSlots();
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        // Randomly make some slots unavailable for demo
        const available = Math.random() > 0.3;
        slots.push({ time, available });
      }
    }
    setAvailableSlots(slots);
  };

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) {
      alert('Por favor, selecione data e horário');
      return;
    }
    
    // Store appointment data and redirect to payment
    const selectedDateTime = `${selectedDate}T${selectedTime}:00`;
    const totalAmount = getSelectedPrice();
    
    sessionStorage.setItem('pendingPayment', JSON.stringify({
      type: 'appointment',
      amount: totalAmount,
      professionalName: professional.name,
      appointmentDate: selectedDateTime,
      duration: duration,
      description: `Consulta com ${professional.name}`
    }));
    
    navigate('/payment');
  };

  

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getSelectedPrice = () => {
    const option = durationOptions.find(opt => opt.value === duration);
    return option?.price || hourlyRate;
  };

  // Remove the payment and confirmation steps as we now redirect to /payment
  
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mr-4">
                {professional.avatar ? (
                  <img 
                    src={professional.avatar} 
                    alt={professional.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-purple-600" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Agendar Consulta
                </h2>
                <p className="text-gray-600">
                  {professional.name} - {professional.specialty}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Professional Info */}
            <div className="space-y-6">
              {/* Professional Details */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">
                  Sobre o Profissional
                </h3>
                <p className="text-purple-800 text-sm mb-3">
                  {professional.bio}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-600">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span className="font-semibold">
                      R$ {professional.hourly_rate}/hora
                    </span>
                  </div>
                  {professional.is_verified && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Verificado
                    </span>
                  )}
                </div>
              </div>

              {/* Duration Selection */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Duração da Consulta
                </h3>
                <div className="space-y-2">
                  {durationOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`block p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        duration === option.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="duration"
                        value={option.value}
                        checked={duration === option.value}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="font-medium">{option.label}</span>
                        </div>
                        <span className="text-green-600 font-semibold">
                          R$ {option.price.toFixed(2)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Video Call Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Video className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-900">
                    Consulta por Videochamada
                  </h3>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Conexão segura e criptografada</li>
                  <li>• Link de acesso enviado por e-mail</li>
                  <li>• Compartilhamento de documentos</li>
                  <li>• Gravação disponível mediante acordo</li>
                </ul>
              </div>
            </div>

            {/* Right Column - Scheduling */}
            <div className="space-y-6">
              {/* Date Selection */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Selecione a Data
                </h3>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">Escolha uma data</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDate(date)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Horários Disponíveis
                  </h3>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <PulsingHeart color="text-purple-600" size="lg" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`p-2 text-sm rounded-lg border transition-colors ${
                            selectedTime === slot.time
                              ? 'border-purple-500 bg-purple-500 text-white'
                              : slot.available
                              ? 'border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {selectedDate && selectedTime && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3">
                    Resumo do Agendamento
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Profissional:</span>
                      <span className="font-medium">{professional.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data:</span>
                      <span className="font-medium">{formatDate(selectedDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Horário:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duração:</span>
                      <span className="font-medium">{duration} minutos</span>
                    </div>
                    <div className="flex justify-between font-semibold text-green-800 border-t pt-2">
                      <span>Total:</span>
                      <span>R$ {getSelectedPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar para Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
