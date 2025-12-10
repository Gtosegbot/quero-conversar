import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Upload, Mail, Search, Filter,
    MoreVertical, CheckCircle, XCircle, Clock, Trash2
} from 'lucide-react';
import PulsingHeart from '../components/PulsingHeart';
import { db, auth } from '../../firebase-config';
import {
    collection, query, where, onSnapshot, addDoc,
    serverTimestamp, doc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { CompanyEmployee, EmployeeInvite } from '../../types/enterprise';

const EnterpriseEmployees: React.FC = () => {
    const [employees, setEmployees] = useState<CompanyEmployee[]>([]);
    const [invites, setInvites] = useState<EmployeeInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showCSVUpload, setShowCSVUpload] = useState(false);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Get user's company
        const userRef = doc(db, 'users', user.uid);
        const unsubUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const cId = userData.company_id;
                setCompanyId(cId);

                if (cId) {
                    // Listen to employees
                    const empQuery = query(
                        collection(db, 'company_employees'),
                        where('company_id', '==', cId)
                    );
                    const unsubEmp = onSnapshot(empQuery, (snapshot) => {
                        const emps = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        })) as CompanyEmployee[];
                        setEmployees(emps);
                        setLoading(false);
                    }, (error) => {
                        console.error("Error fetching employees:", error);
                        setLoading(false);
                    });

                    // Listen to invites
                    const invQuery = query(
                        collection(db, 'employee_invites'),
                        where('company_id', '==', cId),
                        where('status', '==', 'pending')
                    );
                    const unsubInv = onSnapshot(invQuery, (snapshot) => {
                        const invs = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        })) as EmployeeInvite[];
                        setInvites(invs);
                    });

                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        });

        return () => unsubUser();
    }, []);

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filterStatus === 'all' || emp.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-green-100 text-green-800',
            invited: 'bg-yellow-100 text-yellow-800',
            suspended: 'bg-red-100 text-red-800',
            removed: 'bg-gray-100 text-gray-800'
        };
        return styles[status as keyof typeof styles] || styles.active;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle className="w-4 h-4" />;
            case 'invited': return <Clock className="w-4 h-4" />;
            case 'suspended': return <XCircle className="w-4 h-4" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <PulsingHeart color="text-blue-600" size="xl" />
                    <p className="mt-4 text-gray-600">Carregando funcionários...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Users className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Gerenciar Funcionários
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {employees.length} funcionários • {invites.length} convites pendentes
                                </p>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowCSVUpload(true)}
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
                            >
                                <Upload className="w-5 h-5 mr-2" />
                                Importar CSV
                            </button>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                disabled={!companyId}
                                className={`flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 ${!companyId ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <UserPlus className="w-5 h-5 mr-2" />
                                Convidar Funcionário
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nome ou email..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Filter className="w-5 h-5 text-gray-600" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            >
                                <option value="all">Todos</option>
                                <option value="active">Ativos</option>
                                <option value="invited">Convidados</option>
                                <option value="suspended">Suspensos</option>
                                <option value="removed">Removidos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Pending Invites */}
                {invites.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                        <h3 className="font-semibold text-yellow-900 mb-3 flex items-center">
                            <Clock className="w-5 h-5 mr-2" />
                            Convites Pendentes ({invites.length})
                        </h3>
                        <div className="space-y-2">
                            {invites.slice(0, 5).map((invite) => (
                                <div key={invite.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                                    <div>
                                        <p className="font-medium text-gray-900">{invite.email}</p>
                                        <p className="text-sm text-gray-600">
                                            Convidado em {(() => {
                                                const date = invite.invited_at;
                                                if (!date) return '-';
                                                // Handle Firestore Timestamp
                                                if (typeof date === 'object' && 'toDate' in date) {
                                                    return (date as any).toDate().toLocaleDateString('pt-BR');
                                                }
                                                // Handle Date string or number
                                                return new Date(date).toLocaleDateString('pt-BR');
                                            })()}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                                            Reenviar
                                        </button>
                                        <button className="text-red-600 hover:text-red-800 text-sm">
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Employees Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Funcionário
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Departamento
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Cargo
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Desde
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredEmployees.map((employee) => (
                                    <tr key={employee.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mr-3">
                                                    <span className="text-blue-600 font-semibold">
                                                        {employee.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{employee.name}</p>
                                                    <p className="text-sm text-gray-600">{employee.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {employee.department || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {employee.position || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(employee.status)}`}>
                                                {getStatusIcon(employee.status)}
                                                <span className="ml-1 capitalize">{employee.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {new Date(employee.joined_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                                                <MoreVertical className="w-5 h-5 text-gray-600" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredEmployees.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                    Nenhum funcionário encontrado
                                </h3>
                                <p className="text-gray-500">
                                    {searchTerm || filterStatus !== 'all'
                                        ? 'Tente ajustar os filtros'
                                        : 'Comece convidando funcionários'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Invite Modal */}
                {showInviteModal && companyId && (
                    <InviteModal
                        companyId={companyId}
                        onClose={() => setShowInviteModal(false)}
                    />
                )}

                {/* CSV Upload Modal */}
                {showCSVUpload && (
                    <CSVUploadModal
                        companyId={companyId!}
                        onClose={() => setShowCSVUpload(false)}
                    />
                )}
            </div>
        </div>
    );
};

// Invite Modal Component
interface InviteModalProps {
    companyId: string;
    onClose: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ companyId, onClose }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [position, setPosition] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        try {
            const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            await addDoc(collection(db, 'employee_invites'), {
                company_id: companyId,
                email,
                name,
                department,
                position,
                invite_token: token,
                status: 'pending',
                invited_by: user.uid,
                invited_at: serverTimestamp(),
                expires_at: expiresAt,
                metadata: {
                    source: 'manual'
                }
            });

            // TODO: Send email with invite link
            alert(`Convite enviado para ${email}!`);
            onClose();
        } catch (error) {
            console.error('Error sending invite:', error);
            alert('Erro ao enviar convite');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Convidar Funcionário
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Departamento
                        </label>
                        <input
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cargo
                        </label>
                        <input
                            type="text"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50"
                        >
                            {loading ? 'Enviando...' : 'Enviar Convite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// CSV Upload Modal Component
interface CSVUploadModalProps {
    companyId: string;
    onClose: () => void;
}

const CSVUploadModal: React.FC<CSVUploadModalProps> = ({ companyId, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());

            const data = lines.slice(1, 6).map(line => {
                const values = line.split(',').map(v => v.trim());
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index] || '';
                    return obj;
                }, {} as any);
            }).filter(row => row.email);

            setPreview(data);
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        if (!file) return;

        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                const lines = text.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());

                const batchId = Date.now().toString();

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const row = headers.reduce((obj, header, index) => {
                        obj[header] = values[index] || '';
                        return obj;
                    }, {} as any);

                    if (row.email) {
                        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
                        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                        await addDoc(collection(db, 'employee_invites'), {
                            company_id: companyId,
                            email: row.email,
                            name: row.name || '',
                            department: row.department || '',
                            position: row.role || row.position || '',
                            invite_token: token,
                            status: 'pending',
                            invited_by: user.uid,
                            invited_at: serverTimestamp(),
                            expires_at: expiresAt,
                            metadata: {
                                source: 'csv',
                                csv_batch_id: batchId
                            }
                        });
                    }
                }

                alert(`${lines.length - 1} convites enviados com sucesso!`);
                onClose();
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Error uploading CSV:', error);
            alert('Erro ao processar CSV');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Importar Funcionários via CSV
                </h2>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Arquivo CSV
                    </label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        Formato: email, name, department, role
                    </p>
                </div>

                {preview.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">
                            Preview (primeiras 5 linhas):
                        </h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Email</th>
                                        <th className="px-4 py-2 text-left">Nome</th>
                                        <th className="px-4 py-2 text-left">Departamento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {preview.map((row, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2">{row.email}</td>
                                            <td className="px-4 py-2">{row.name}</td>
                                            <td className="px-4 py-2">{row.department}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                    >
                        {loading ? 'Importando...' : 'Importar e Enviar Convites'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnterpriseEmployees;
