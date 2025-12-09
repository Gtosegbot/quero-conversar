import React, { useState, useEffect } from 'react';
import {
    Package,
    Video,
    BarChart2,
    Plus,
    Trash2,
    Edit,
    Loader2,
    DollarSign
} from 'lucide-react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase-config';
import ProductUploadForm from './ProductUploadForm';
import ContentUploadForm from './ContentUploadForm';

interface PartnerDashboardProps {
    user: any;
    userStats: any;
}

const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ user, userStats }) => {
    const [activeTab, setActiveTab] = useState<'products' | 'content' | 'stats' | 'financial'>('products');
    const [showProductForm, setShowProductForm] = useState(false);
    const [showContentForm, setShowContentForm] = useState(false);

    const [products, setProducts] = useState<any[]>([]);
    const [videos, setVideos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [bankInfo, setBankInfo] = useState({
        pixKey: '',
        bankName: '',
        accountNumber: '',
        agency: ''
    });

    // Fetch Data
    useEffect(() => {
        if (!user) return;

        // 1. Fetch Products
        const productsQuery = query(collection(db, 'products'), where('partnerId', '==', user.uid));
        const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching products:", error);
        });

        // 2. Fetch Content
        const contentQuery = query(collection(db, 'partner_content'), where('partnerId', '==', user.uid));
        const unsubContent = onSnapshot(contentQuery, (snapshot) => {
            setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching content:", error);
            setIsLoading(false);
        });

        return () => {
            unsubProducts();
            unsubContent();
        };
    }, [user]);

    const handleDeleteProduct = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            await deleteDoc(doc(db, 'products', id));
        }
    };

    const handleDeleteContent = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este vídeo?')) {
            await deleteDoc(doc(db, 'partner_content', id));
        }
    };

    const handleSaveBankInfo = async () => {
        alert('Dados salvos com sucesso! (Simulação)');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Partner Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Painel do Parceiro</h1>
                        <p className="text-gray-600">Gerencie seus produtos e conteúdos</p>
                    </div>
                    <div className="flex space-x-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Vendas Totais</p>
                            <p className="text-xl font-bold text-green-600">R$ {products.reduce((acc, p) => acc + (p.sales * p.price), 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex space-x-4 mt-6 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'products'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center">
                            <Package className="w-4 h-4 mr-2" />
                            Meus Produtos
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'content'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center">
                            <Video className="w-4 h-4 mr-2" />
                            Conteúdos
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'stats'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center">
                            <BarChart2 className="w-4 h-4 mr-2" />
                            Estatísticas
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('financial')}
                        className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'financial'
                            ? 'text-orange-600 border-b-2 border-orange-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Dados Financeiros
                        </div>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="">
                {activeTab === 'products' && (
                    <div>
                        {showProductForm ? (
                            <ProductUploadForm
                                userId={user.uid}
                                onSuccess={() => setShowProductForm(false)}
                                onCancel={() => setShowProductForm(false)}
                            />
                        ) : (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Produtos Ativos</h2>
                                    <button
                                        onClick={() => setShowProductForm(true)}
                                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Novo Produto
                                    </button>
                                </div>

                                {products.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        Nenhum produto cadastrado. Comece agora!
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {products.map(product => (
                                            <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <img src={product.imageUrl || 'https://via.placeholder.com/150'} alt={product.title} className="w-full h-32 object-cover rounded-md mb-4" />
                                                <h3 className="font-bold text-gray-900 truncate">{product.title}</h3>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-green-600 font-bold">R$ {product.price.toFixed(2)}</span>
                                                    <span className="text-sm text-gray-500">{product.sales} vendas</span>
                                                </div>
                                                <div className="flex justify-end mt-4 space-x-2">
                                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'content' && (
                    <div>
                        {showContentForm ? (
                            <ContentUploadForm
                                userId={user.uid}
                                onSuccess={() => setShowContentForm(false)}
                                onCancel={() => setShowContentForm(false)}
                            />
                        ) : (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Vídeos e Conteúdos</h2>
                                    <button
                                        onClick={() => setShowContentForm(true)}
                                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Novo Vídeo
                                    </button>
                                </div>

                                {videos.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        Nenhum vídeo publicado. Compartilhe seu conhecimento!
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {videos.map(video => (
                                            <div key={video.id} className="flex items-center justify-between border border-gray-200 p-4 rounded-lg">
                                                <div className="flex items-center">
                                                    <div className="w-24 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4 overflow-hidden">
                                                        {video.thumbnailUrl ? (
                                                            <img src={video.thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Video className="w-6 h-6 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">{video.title}</h3>
                                                        <p className="text-sm text-gray-500">
                                                            {video.createdAt?.toDate().toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-6">
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-500">Visualizações</p>
                                                        <p className="font-bold text-gray-900">{video.views}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteContent(video.id)}
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="bg-white rounded-xl shadow-lg p-6 text-center py-12">
                        <BarChart2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Estatísticas Detalhadas</h3>
                        <p className="text-gray-500">Em breve você poderá ver gráficos detalhados de desempenho.</p>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <DollarSign className="w-6 h-6 text-orange-600 mr-2" />
                            Dados Financeiros e Recebimento
                        </h2>

                        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
                            <h3 className="font-bold text-orange-800 mb-2">Regras de Repasse para Parceiros</h3>
                            <ul className="text-sm text-orange-700 space-y-1">
                                <li>• A plataforma realiza o repasse das vendas de produtos e conteúdos.</li>
                                <li>• <strong>Parceiros Não-Moderadores:</strong> Desconto de <strong>30%</strong> (Recebem 70%).</li>
                                <li>• <strong>Parceiros Moderadores:</strong> Desconto de <strong>25%</strong> (Recebem 75%).</li>
                                <li>• Os pagamentos são processados via PIX ou Stripe.</li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Chave PIX (Preferencial)
                                </label>
                                <input
                                    type="text"
                                    value={bankInfo.pixKey}
                                    onChange={(e) => setBankInfo({ ...bankInfo, pixKey: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    placeholder="CPF, E-mail, Celular ou Aleatória"
                                />
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <p className="text-sm text-gray-500 mb-4 italic">Conta Bancária (Opcional)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                                        <input
                                            type="text"
                                            value={bankInfo.bankName}
                                            onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                                        <input
                                            type="text"
                                            value={bankInfo.agency}
                                            onChange={(e) => setBankInfo({ ...bankInfo, agency: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Conta Corrente</label>
                                        <input
                                            type="text"
                                            value={bankInfo.accountNumber}
                                            onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveBankInfo}
                                className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors mt-4"
                            >
                                Salvar Dados Financeiros
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PartnerDashboard;
