import React, { useEffect, useState } from 'react';
import { CheckCircle, Star, Heart, Sparkles, X } from 'lucide-react';
import PulsingHeart from './PulsingHeart';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'task_complete' | 'level_up' | 'streak_milestone' | 'all_tasks_complete';
  message?: string;
  data?: any;
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  type,
  message,
  data
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const getCelebrationContent = () => {
    switch (type) {
      case 'task_complete':
        return {
          emoji: '🎉',
          title: 'Parabéns!',
          message: message || 'Você completou uma tarefa!',
          color: 'text-green-600',
          bgColor: 'from-green-100 to-emerald-100',
          icon: CheckCircle
        };
      
      case 'all_tasks_complete':
        return {
          emoji: '🏆',
          title: 'INCRÍVEL!',
          message: 'Você completou todas suas tarefas de hoje! PARABÉNS!!! Continue evoluindo... 🚀',
          color: 'text-purple-600',
          bgColor: 'from-purple-100 to-pink-100',
          icon: Star
        };
      
      case 'level_up':
        return {
          emoji: '⬆️',
          title: 'Level Up!',
          message: `Parabéns! Você subiu para o nível ${data?.newLevel}!`,
          color: 'text-blue-600',
          bgColor: 'from-blue-100 to-cyan-100',
          icon: Star
        };
      
      case 'streak_milestone':
        return {
          emoji: '🔥',
          title: 'Sequência Épica!',
          message: `${data?.streakDays} dias consecutivos! Você está imparável!`,
          color: 'text-orange-600',
          bgColor: 'from-orange-100 to-yellow-100',
          icon: Sparkles
        };
      
      default:
        return {
          emoji: '🎊',
          title: 'Parabéns!',
          message: message || 'Ótimo trabalho!',
          color: 'text-purple-600',
          bgColor: 'from-purple-100 to-pink-100',
          icon: Heart
        };
    }
  };

  const content = getCelebrationContent();
  const Icon = content.icon;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        {/* Confetti Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${content.bgColor} opacity-20`} />
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative p-8 text-center">
          {/* Animated Icons */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <PulsingHeart color={content.color} size="xl" className="animate-bounce" />
              <div className="absolute -top-2 -right-2">
                <Icon className={`w-8 h-8 ${content.color} animate-pulse`} />
              </div>
            </div>
          </div>

          {/* Emoji */}
          <div className="text-6xl mb-4 animate-bounce">
            {content.emoji}
          </div>

          {/* Title */}
          <h2 className={`text-3xl font-bold ${content.color} mb-4`}>
            {content.title}
          </h2>

          {/* Message */}
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            {content.message}
          </p>

          {/* Additional Data */}
          {data?.points && (
            <div className="bg-white/80 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">Pontos ganhos:</p>
              <p className={`text-2xl font-bold ${content.color}`}>
                +{data.points} ⚡
              </p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleClose}
            className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold`}
          >
            Continue Evoluindo! 🚀
          </button>
        </div>

        {/* Sparkle Effects */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute animate-ping ${content.color} opacity-30`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CelebrationModal;
