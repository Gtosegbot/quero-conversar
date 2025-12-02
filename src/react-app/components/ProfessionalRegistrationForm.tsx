import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
Upload,
  Loader2,
  Linkedin,
  Instagram,
  Globe
} from 'lucide-react';
import PulsingHeart from './PulsingHeart';
import { auth, db, storage } from '../../firebase-config';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface FormData {
  email: string;
  password: string;
  name: string;
  specialty: string;
  councilType: string;
  councilNumber: string;
  bio: string;
  experienceYears: string;
  location: string;
  hourlyRate: string;
  languages: string;
  socialLinkedin: string;
  socialInstagram: string;
  socialBlog: string;
  certificates: File[];
}

const ProfessionalRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
    specialty: '',
    councilType: '',
    councilNumber: '',
    bio: '',
    experienceYears: '',
    location: '',
    hourlyRate: '',
    languages: 'Português',
    socialLinkedin: '',
    socialInstagram: '',
    socialBlog: '',
    certificates: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log("ProfessionalRegistrationForm mounted");
    // Simulate a short initialization check to ensure Firebase is ready
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const specialties = [
    'Psicologia Clínica',
    'Psiquiatria',
    'Terapia Cognitivo-Comportamental',
    'Psicanálise',
    'Coach de Vida',
    'Coach de Carreira',
    'Nutricionista',
    'Personal Trainer',
    'Terapeuta Holístico',
    'Orientador Espiritual',
    'Terapeuta Familiar',
    'Psicologia Infantil'
  ];

  const councilTypes = ['CRP', 'CRM', 'CRN', 'CREF', 'Outros'];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(file =>
        file.type === 'application/pdf' || file.type.startsWith('image/')
      );
      setFormData(prev => ({
        ...prev,
        certificates: [...prev.certificates, ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.email) newErrors.email = 'Email é obrigatório';
      if (!formData.password || formData.password.length < 6) newErrors.password = 'Senha deve ter min. 6 caracteres';
      if (!formData.name) newErrors.name = 'Nome é obrigatório';
      if (!formData.specialty) newErrors.specialty = 'Especialidade é obrigatória';
      if (!formData.councilType) newErrors.councilType = 'Conselho é obrigatório';
      if (!formData.councilNumber) newErrors.councilNumber = 'Número do registro é obrigatório';
    }

    if (step === 2) {
      if (!formData.bio || formData.bio.length < 50) {
        newErrors.bio = 'Biografia deve ter pelo menos 50 caracteres';
      }
      if (!formData.experienceYears) {
        newErrors.experienceYears = 'Anos de experiência é obrigatório';
      }
      if (!formData.hourlyRate) {
        newErrors.hourlyRate = 'Taxa horária é obrigatória';
      }
    }

    if (step === 3) {
      if (formData.certificates.length === 0) {
        newErrors.certificates = 'Pelo menos um documento é obrigatório para validação';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsLoading(true);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Update Profile
      await updateProfile(user, { displayName: formData.name });

      // 3. Upload Documents
      const uploadedDocs = [];
      try {
        for (let i = 0; i < formData.certificates.length; i++) {
          const file = formData.certificates[i];
          const storageRef = ref(storage, `professional_docs/${user.uid}/${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          uploadedDocs.push({ name: file.name, url });
        }
      } catch (storageError) {
        console.error("Storage upload failed, proceeding with registration but without docs:", storageError);
        // Optionally alert the user or continue
      }

      // 4. Save Application to Firestore
      const applicationData = {
        userId: user.uid,
        email: formData.email,
        name: formData.name,
        specialty: formData.specialty,
        council: {
          type: formData.councilType,
          number: formData.councilNumber
        },
        bio: formData.bio,
        experienceYears: formData.experienceYears,
        location: formData.location,
        hourlyRate: formData.hourlyRate,
        languages: formData.languages,
        socialLinks: {
          linkedin: formData.socialLinkedin,
          instagram: formData.socialInstagram,
          blog: formData.socialBlog
        },
        documents: uploadedDocs,
        status: 'pending_verification',
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'professional_applications', user.uid), applicationData);

      // 5. Create User Record
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: formData.email,
        role: 'professional_candidate',
        level: 1,
        energyPoints: 0,
        maxEnergy: 1000,
        createdAt: serverTimestamp()
      });

      alert('Cadastro enviado com sucesso! Nossa equipe verificará suas credenciais em até 48h.');
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Registration error:', error);
      setErrors({ general: error.message || 'Erro no cadastro. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <PulsingHeart color="text-green-600" size="xl" />
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <PulsingHeart color="text-green-600" size="xl" />
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
          Credenciais Profissionais
        </h2>
        <p className="text-gray-600">
          Identificação e registro no conselho de classe
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
            placeholder="seu@email.com"
          />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
            placeholder="******"
          />
          {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
          placeholder="Dr(a). Nome Sobrenome"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
        <select
          value={formData.specialty}
          onChange={(e) => handleInputChange('specialty', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
        >
          <option value="">Selecione...</option>
          {specialties.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Conselho</label>
          <select
            value={formData.councilType}
            onChange={(e) => handleInputChange('councilType', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
          >
            <option value="">Tipo</option>
            {councilTypes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Número de Registro</label>
          <input
            type="text"
            required
            value={formData.councilNumber}
            onChange={(e) => handleInputChange('councilNumber', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
            placeholder="Ex: 12345/SP"
          />
        </div>
      </div>
      {(errors.councilType || errors.councilNumber) && (
        <p className="text-xs text-red-600">Dados do conselho são obrigatórios para validação.</p>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <PulsingHeart color="text-blue-600" size="xl" />
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
          Perfil e Autoridade
        </h2>
        <p className="text-gray-600">
          Sua experiência e presença digital
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Biografia Profissional</label>
        <textarea
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
          placeholder="Descreva sua abordagem e experiência..."
        />
        {errors.bio && <p className="text-xs text-red-600 mt-1">{errors.bio}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Anos de Exp.</label>
          <input
            type="number"
            value={formData.experienceYears}
            onChange={(e) => handleInputChange('experienceYears', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Valor Hora (R$)</label>
          <input
            type="number"
            value={formData.hourlyRate}
            onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Presença Digital (Opcional)</h3>
        <div className="space-y-3">
          <div className="relative">
            <Linkedin className="absolute left-3 top-3 w-5 h-5 text-blue-700" />
            <input
              type="url"
              value={formData.socialLinkedin}
              onChange={(e) => handleInputChange('socialLinkedin', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Perfil do LinkedIn"
            />
          </div>
          <div className="relative">
            <Instagram className="absolute left-3 top-3 w-5 h-5 text-pink-600" />
            <input
              type="url"
              value={formData.socialInstagram}
              onChange={(e) => handleInputChange('socialInstagram', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Perfil do Instagram"
            />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="url"
              value={formData.socialBlog}
              onChange={(e) => handleInputChange('socialBlog', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Blog ou Site Pessoal"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <PulsingHeart color="text-purple-600" size="xl" />
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
          Comprovação Documental
        </h2>
        <p className="text-gray-600">
          Envie foto do seu registro profissional (Carteirinha)
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <label htmlFor="file-upload" className="cursor-pointer mt-4 block">
          <span className="text-green-600 font-medium">Clique para enviar</span>
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.jpg,.png"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </label>
      </div>

      {formData.certificates.length > 0 && (
        <div className="space-y-2">
          {formData.certificates.map((file, i) => (
            <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded">
              <span className="text-sm truncate">{file.name}</span>
              <button onClick={() => removeFile(i)} className="text-red-500 text-xs">Remover</button>
            </div>
          ))}
        </div>
      )}
      {errors.certificates && <p className="text-red-600 text-sm">{errors.certificates}</p>}

      <div className="bg-yellow-50 p-4 rounded-lg text-xs text-yellow-800">
        ⚠️ Seus documentos serão analisados manualmente pela nossa equipe de Compliance para garantir a segurança da comunidade.
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8 px-8">
          {[1, 2, 3].map(step => (
            <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step <= currentStep ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {errors.general && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">{errors.general}</div>}

          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Voltar</button>
            )}
            <div className="ml-auto">
              {currentStep < 3 ? (
                <button type="button" onClick={nextStep} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Próximo</button>
              ) : (
                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Enviar Cadastro'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfessionalRegistrationForm;

