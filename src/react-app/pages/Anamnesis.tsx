import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Heart, ArrowRight, CheckCircle } from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';
import { db } from '../../firebase-config';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Updated anamnesis steps with improved first question
const ANAMNESIS_STEPS = [
  {
    title: "Conhecendo Você",
    category: "identificacao",
    questions: [
      "Olá! Sou a Dra. Clara Mendes, sua psicóloga de apoio. Para começarmos, qual é o seu nome completo? E como você gostaria que eu te chamasse durante nossas conversas - pelo nome, apelido ou outro nome de sua preferência?"
    ]
  },
  {
    title: "Situação Atual",
    category: "situacao_atual",
    questions: [
      "Como você descreveria seu estado emocional atual?",
      "O que te trouxe até aqui? Há algo específico que você gostaria de trabalhar?",
      "Como tem sido seu sono ultimamente?",
      "Como está sua alimentação e cuidado pessoal?"
    ]
  },
  {
    title: "Histórico Pessoal",
    category: "historico",
    questions: [
      "Você já fez terapia antes? Se sim, como foi sua experiência?",
      "Há algum evento significativo em sua vida que considera importante eu saber?",
      "Como você costuma lidar com situações estressantes?",
      "Você tem um sistema de apoio (família, amigos, comunidade)?"
    ]
  },
  {
    title: "Objetivos e Expectativas",
    category: "objetivos",
    questions: [
      "O que você espera alcançar com nossa conversa?",
      "Há alguma área específica da sua vida que gostaria de melhorar?",
      "Como você se vê daqui a alguns meses?",
      "Existe algo que você considera fundamental para seu bem-estar?"
    ]
  }
];

export default function Anamnesis() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const [currentResponse, setCurrentResponse] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Prevent infinite recursion with useEffect
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    scrollToBottom();
  }, [currentStep, currentQuestion]);

  const getUserId = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.uid;
    }
    return null;
  };

  const getCurrentQuestionKey = () => {
    return `step_${currentStep}_question_${currentQuestion}`;
  };

  const getCurrentQuestion = () => {
    const step = ANAMNESIS_STEPS[currentStep];
    if (!step || !step.questions[currentQuestion]) {
      return null;
    }
    return step.questions[currentQuestion];
  };

  const getDisplayedQuestions = () => {
    const questions = [];
    for (let stepIndex = 0; stepIndex <= currentStep; stepIndex++) {
      const step = ANAMNESIS_STEPS[stepIndex];
      if (!step) continue;

      const maxQuestion = stepIndex === currentStep ? currentQuestion : step.questions.length - 1;

      for (let questionIndex = 0; questionIndex <= maxQuestion; questionIndex++) {
        const key = `step_${stepIndex}_question_${questionIndex}`;
        const question = step.questions[questionIndex];
        const response = responses[key];

        if (question) {
          questions.push({
            step: stepIndex,
            questionIndex,
            question,
            response,
            category: step.category
          });
        }
      }
    }
    return questions;
  };

  const handleSubmitResponse = () => {
    if (!currentResponse.trim()) return;

    const key = getCurrentQuestionKey();
    setResponses(prev => ({
      ...prev,
      [key]: currentResponse.trim()
    }));
    setCurrentResponse('');

    // Move to next question with proper bounds checking
    setTimeout(() => {
      askNextQuestion();
    }, 100);
  };

  const askNextQuestion = () => {
    const currentStepData = ANAMNESIS_STEPS[currentStep];
    if (!currentStepData) {
      completeAnamnesis();
      return;
    }

    // Check if there are more questions in current step
    if (currentQuestion + 1 < currentStepData.questions.length) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Move to next step
      if (currentStep + 1 < ANAMNESIS_STEPS.length) {
        setCurrentStep(prev => prev + 1);
        setCurrentQuestion(0);
      } else {
        // All steps completed
        completeAnamnesis();
      }
    }
  };

  const completeAnamnesis = async () => {
    if (isCompleted || isSaving) return;

    const userId = getUserId();
    if (!userId) {
      navigate('/auth');
      return;
    }

    setIsCompleted(true);
    setIsSaving(true);

    try {
      const responsesArray = Object.entries(responses).map(([key, response]) => {
        const [, stepStr, , questionStr] = key.split('_');
        const step = parseInt(stepStr);
        const questionIndex = parseInt(questionStr);
        const stepData = ANAMNESIS_STEPS[step];

        return {
          step,
          question_index: questionIndex,
          question: stepData?.questions[questionIndex] || '',
          response
        };
      });

      console.log('Salvando anamnese no Firestore:', { responses: responsesArray });

      // Save to Firestore
      // 1. Save the anamnesis responses
      await setDoc(doc(db, 'users', userId, 'anamnesis', 'initial'), {
        responses: responsesArray,
        completedAt: serverTimestamp(),
        analyzed: false // Trigger for RAG/Analysis
      });

      // 2. Update user profile
      await updateDoc(doc(db, 'users', userId), {
        anamnesisCompleted: true,
        anamnesisCompletedAt: serverTimestamp()
      });

      // Save completion status locally
      localStorage.setItem(`anamnesis_completed_${userId}`, 'true');
      localStorage.setItem(`anamnesis_completed`, 'true');

      console.log('Anamnese salva com sucesso!');

      // Navigate to dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Failed to save anamnesis to Firestore:', error);
      // Save locally as fallback
      localStorage.setItem(`anamnesis_responses_${userId}`, JSON.stringify(responses));
      localStorage.setItem(`anamnesis_completed_${userId}`, 'true');

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const currentQuestion_text = getCurrentQuestion();
  const displayedQuestions = getDisplayedQuestions();
  const progress = ((currentStep * 4 + currentQuestion + 1) / (ANAMNESIS_STEPS.length * 4)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <PulsingHeart />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Anamnese Psicológica
          </h1>
          <p className="text-gray-600">
            Vamos nos conhecer melhor para que eu possa te oferecer o melhor suporte
          </p>

          {/* Progress bar */}
          <div className="mt-6 bg-gray-200 rounded-full h-2 max-w-md mx-auto">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {Math.round(progress)}% concluído
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="space-y-6 max-h-96 overflow-y-auto mb-6">
            {displayedQuestions.map((item) => (
              <div key={`${item.step}-${item.questionIndex}`} className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium leading-relaxed">
                      {item.question}
                    </p>
                  </div>
                </div>

                {item.response && (
                  <div className="ml-13 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      {item.response}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Current question */}
            {currentQuestion_text && !isCompleted && (
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium leading-relaxed">
                      {currentQuestion_text}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {!isCompleted ? (
            <div className="space-y-4">
              <textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Digite sua resposta aqui..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitResponse();
                  }
                }}
              />

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Pressione Enter para enviar ou Shift+Enter para nova linha
                </p>
                <button
                  onClick={handleSubmitResponse}
                  disabled={!currentResponse.trim()}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Enviar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Anamnese Concluída!
              </h3>
              <p className="text-gray-600 mb-4">
                Obrigada por compartilhar essas informações comigo.
                Agora posso te oferecer um suporte mais personalizado.
              </p>
              {isSaving && (
                <p className="text-blue-500">
                  Salvando suas informações...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
