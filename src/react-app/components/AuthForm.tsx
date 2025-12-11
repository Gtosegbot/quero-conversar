import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import PulsingHeart from './PulsingHeart';
import { auth, googleProvider, db } from '../../firebase-config';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthFormProps {
  onSuccess?: (user: any) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      console.log('Auth success. Checking Firestore user...', user.uid);

      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (readErr) {
        console.error('Error READING user doc:', readErr);
        throw readErr;
      }

      let userData;

      if (!userSnap.exists()) {
        console.log('User not found. Creating new user doc...');
        // Check for referral code in URL
        const urlParams = new URLSearchParams(window.location.search);
        const referralId = urlParams.get('ref');

        // Create new user document
        userData = {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          plan: 'free',
          role: 'user',
          referredBy: referralId || null, // Store referrer ID
          xp: 1,
          level: 1
        };
        try {
          await setDoc(userRef, userData);
        } catch (writeErr) {
          console.error('Error WRITING user doc:', writeErr);
          throw writeErr;
        }
      } else {
        console.log('User found. Logging in...');
        userData = userSnap.data();
      }

      // Store user data locally for compatibility with existing app logic
      localStorage.setItem('user', JSON.stringify(userData));

      if (onSuccess) {
        onSuccess(userData);
      }

      // Check anamnesis status
      if (userData.anamnesisCompleted) {
        navigate('/dashboard');
      } else {
        // Double check if it was just created (fallback)
        const anamnesisRef = doc(db, 'users', user.uid, 'anamnesis', 'initial');
        const anamnesisSnap = await getDoc(anamnesisRef);

        if (anamnesisSnap.exists()) {
          // Update user doc if missing flag
          await setDoc(userRef, { anamnesisCompleted: true }, { merge: true });
          navigate('/dashboard');
        } else {
          navigate('/anamnesis');
        }
      }

    } catch (err: any) {
      console.error('Auth error:', err);
      setError(`Erro Google: ${err.code || err.message || 'Falha na conexão'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      let userData;

      if (!userSnap.exists()) {
        // Create new user document
        userData = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || email.split('@')[0],
          createdAt: new Date().toISOString(),
          plan: 'free',
          role: 'user',
          xp: 1,
          level: 1
        };
        await setDoc(userRef, userData);
      } else {
        userData = userSnap.data();
      }

      // Check anamnesis status from Firestore (more reliable than userData)
      const anamnesisRef = doc(db, 'users', user.uid, 'anamnesis', 'initial');
      const anamnesisSnap = await getDoc(anamnesisRef);

      // Update userData with fresh anamnesis status
      if (anamnesisSnap.exists() && !userData.anamnesisCompleted) {
        userData.anamnesisCompleted = true;
        // Update Firestore to sync
        await setDoc(userRef, { anamnesisCompleted: true }, { merge: true });
      }

      localStorage.setItem('user', JSON.stringify(userData));

      if (onSuccess) {
        onSuccess(userData);
      }

      // Navigate based on anamnesis status
      if (userData.anamnesisCompleted || anamnesisSnap.exists()) {
        navigate('/dashboard');
      } else {
        navigate('/anamnesis');
      }

    } catch (err: any) {
      console.error('Email login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email ou senha incorretos.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <PulsingHeart color="text-purple-600" size="xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo ao Quero Conversar
          </h1>
          <p className="text-gray-600">
            Sua jornada de bem-estar começa aqui
          </p>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          {!showEmailLogin ? (
            <>
              {/* Google Login Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center shadow-sm font-medium"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                      className="w-5 h-5 mr-3"
                    />
                    Continuar com Google
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">ou</span>
                </div>
              </div>

              {/* Email Login Button */}
              <button
                onClick={() => setShowEmailLogin(true)}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center justify-center shadow-sm font-medium"
              >
                <Mail className="w-5 h-5 mr-2" />
                Entrar com Email
              </button>
            </>
          ) : (
            <>
              {/* Email/Password Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center justify-center shadow-sm font-medium"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Entrar'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmailLogin(false)}
                  className="w-full text-gray-600 py-2 text-sm hover:text-gray-800"
                >
                  ← Voltar para Google
                </button>
              </form>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Ao continuar, você concorda com nossos{' '}
            <a href="/terms" className="text-purple-600 hover:underline">
              Termos de Serviço
            </a>{' '}
            e{' '}
            <a href="/privacy" className="text-purple-600 hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;

