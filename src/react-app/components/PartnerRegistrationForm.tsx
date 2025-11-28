import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  User,
  Building,
  Package,
  Upload,
  FileText,
  ArrowRight,
  Loader2,
  Phone,
  Globe,
  DollarSign,
  Instagram,
  Youtube,
  Linkedin
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
  companyName: string;
  cnpj: string;
  businessType: string;
  description: string;
  contactInfo: string;
  website: string;
  socialInstagram: string;
  socialYoutube: string;
  documents: File[];
}

const PartnerRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
    companyName: '',
    cnpj: '',
    businessType: '',
    description: '',
    contactInfo: '',
    website: '',
    socialInstagram: '',
    socialYoutube: '',
    documents: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const businessTypes = [
    'E-books e Livros Digitais',
    'Cursos Online',
    'Produtos de Bem-estar',
    'Suplementos e Nutrição',
    'Equipamentos de Exercício',
    'Aplicativos e Software',
    'Serviços de Consultoria',
    'Produtos Artesanais',
    'Terapias Alternativas',
    'Outros'
  ];

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
        documents: [...prev.documents, ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.email) newErrors.email = 'Email é obrigatório';
      if (!formData.password || formData.password.length < 6) newErrors.password = 'Senha deve ter min. 6 caracteres';
      if (!formData.name) newErrors.name = 'Nome do responsável é obrigatório';
      if (!formData.companyName) newErrors.companyName = 'Nome da empresa é obrigatório';
      if (!formData.cnpj) newErrors.cnpj = 'CNPJ é obrigatório';
      if (!formData.businessType) newErrors.businessType = 'Tipo de negócio é obrigatório';
    }

    if (step === 2) {
      if (!formData.description || formData.description.length < 50) {
        newErrors.description = 'Descrição deve ter pelo menos 50 caracteres';
      }
      if (!formData.contactInfo) {
        newErrors.contactInfo = 'Informações de contato são obrigatórias';
      }
    }

    if (step === 3) {
      if (formData.documents.length === 0) {
        newErrors.documents = 'Pelo menos um documento é obrigatório';
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
      await updateProfile(user, { displayName: formData.companyName });

      // 3. Upload Documents
      const uploadedDocs = [];
      for (let i = 0; i < formData.documents.length; i++) {
        const file = formData.documents[i];
        const storageRef = ref(storage, `partner_docs/${user.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedDocs.push({ name: file.name, url });
      }

      // 4. Save Application to Firestore
      const applicationData = {
        userId: user.uid,
        email: formData.email,
        responsibleName: formData.name,
        companyName: formData.companyName,
        cnpj: formData.cnpj,
        businessType: formData.businessType,
        description: formData.description,
        contactInfo: formData.contactInfo,
        website: formData.website,
        socialLinks: {
          instagram: formData.socialInstagram,
          youtube: formData.socialYoutube
        },
        documents: uploadedDocs,
        status: 'pending_verification',
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'partner_applications', user.uid), applicationData);

      // 5. Create User Record
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.companyName,
        email: formData.email,
        role: 'partner_candidate',
        level: 1,
        energyPoints: 0,
        maxEnergy: 1000,
        createdAt: serverTimestamp()
      });

      alert('Cadastro de Parceiro enviado! Nossa equipe analisará sua autoridade e documentos em breve.');
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Registration error:', error);
      setErrors({ general: error.message || 'Erro no cadastro. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <PulsingHeart color="text-orange-600" size="xl" />
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
          Informações da Empresa
        </h2>
        <p className="text-gray-600">
          Dados cadastrais e identificação
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Comercial</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
            placeholder="contato@empresa.com"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
            placeholder="******"
          />
          {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Responsável</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
          placeholder="Nome Completo"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
            placeholder="Razão Social ou Fantasia"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
          <input
            type="text"
            required
            value={formData.cnpj}
            onChange={(e) => handleInputChange('cnpj', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
            placeholder="00.000.000/0000-00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Negócio</label>
        <select
          value={formData.businessType}
          onChange={(e) => handleInputChange('businessType', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
        >
          <option value="">Selecione...</option>
          {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <PulsingHeart color="text-blue-600" size="xl" />
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
          Autoridade e Presença
        </h2>
        <p className="text-gray-600">
          Mostre sua relevância no mercado
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição do Negócio</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600"
          placeholder="Descreva seus produtos e serviços..."
        />
        {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Contato (WhatsApp/Tel)</label>
        <input
          type="text"
          value={formData.contactInfo}
          onChange={(e) => handleInputChange('contactInfo', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          placeholder="(11) 99999-9999"
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Presença Digital (Autoridade)</h3>
        <div className="space-y-3">
          <div className="relative">
            <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Website Oficial"
            />
          </div>
          <div className="relative">
            <Instagram className="absolute left-3 top-3 w-5 h-5 text-pink-600" />
            <input
              type="url"
              value={formData.socialInstagram}
              onChange={(e) => handleInputChange('socialInstagram', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Instagram da Empresa"
            />
          </div>
          <div className="relative">
            <Youtube className="absolute left-3 top-3 w-5 h-5 text-red-600" />
            <input
              type="url"
              value={formData.socialYoutube}
              onChange={(e) => handleInputChange('socialYoutube', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Canal do YouTube"
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
          Documentação Legal
        </h2>
        <p className="text-gray-600">
          Envie comprovantes para validação da parceria
        </p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <label htmlFor="file-upload" className="cursor-pointer mt-4 block">
          <span className="text-orange-600 font-medium">Clique para enviar arquivos</span>
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

      {formData.documents.length > 0 && (
        <div className="space-y-2">
          {formData.documents.map((file, i) => (
            <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded">
              <span className="text-sm truncate">{file.name}</span>
              <button onClick={() => removeFile(i)} className="text-red-500 text-xs">Remover</button>
            </div>
          ))}
        </div>
      )}
      {errors.documents && <p className="text-red-600 text-sm">{errors.documents}</p>}

      <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-800">
        <p className="font-bold mb-1">Documentos Obrigatórios:</p>
        <ul className="list-disc pl-4">
          <li>Cartão CNPJ</li>
          <li>Contrato Social ou CCMEI</li>
          <li>Documento do Responsável</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="flex justify-between mb-8 px-8">
          {[1, 2, 3].map(step => (
            <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step <= currentStep ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
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
                <button type="button" onClick={nextStep} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Próximo</button>
              ) : (
                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center">
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

export default PartnerRegistrationForm;
