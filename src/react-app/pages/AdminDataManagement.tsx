import React, { useState, useEffect } from 'react';
import { Trash2, UserX, FileX, AlertTriangle, RefreshCw } from 'lucide-react';

interface MockData {
  professionals: any[];
  appointments: any[];
  users: any[];
  documents: any[];
}

const AdminDataManagement: React.FC = () => {
  const [mockData, setMockData] = useState<MockData>({
    professionals: [],
    appointments: [],
    users: [],
    documents: [],
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string>('');

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = async () => {
    setLoading(true);
    try {
      // Fetch mock data from database
      const [professionals, appointments, users, documents] = await Promise.all([
        fetch('/api/admin/mock-professionals').then(r => r.json()),
        fetch('/api/admin/mock-appointments').then(r => r.json()),
        fetch('/api/admin/mock-users').then(r => r.json()),
        fetch('/api/admin/mock-documents').then(r => r.json()),
      ]);

      setMockData({
        professionals: professionals.data || [],
        appointments: appointments.data || [],
        users: users.data || [],
        documents: documents.data || [],
      });
    } catch (error) {
      console.error('Error loading mock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!confirm(`Tem certeza que deseja remover todos os dados mock de ${category}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeleting(category);
    try {
      const response = await fetch(`/api/admin/delete-mock-data/${category}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadMockData(); // Reload data
      } else {
        alert('Erro ao deletar dados');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erro ao deletar dados');
    } finally {
      setDeleting('');
    }
  };

  const handleDeleteSpecific = async (category: string, id: number) => {
    if (!confirm('Tem certeza que deseja remover este item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/delete-mock-item/${category}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadMockData(); // Reload data
      } else {
        alert('Erro ao deletar item');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erro ao deletar item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
          <h2 className="text-xl font-bold text-red-900">
            Gerenciamento de Dados Mock
          </h2>
        </div>
        <p className="text-red-800 mb-4">
          Esta seção permite remover dados fictícios/demonstrativos do sistema.
          Use com cuidado - as exclusões são permanentes.
          Esta seção exibe os dados reais do banco de dados. Use com extremo cuidado.
        </p>
      </div>

      {/* Seed Data Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-purple-900 flex items-center">
              <RefreshCw className="w-5 h-5 mr-2" />
              Popular Banco de Dados (Gamificação)
            </h3>
            <p className="text-purple-800">
              Carregar as 50 tarefas padrão (Níveis 1, 2 e 3) para o Firestore.
            </p>
          </div>
          <button
            onClick={async () => {
              if (!confirm('Isso irá adicionar 50 tarefas ao banco de dados. Continuar?')) return;
              setLoading(true);
              try {
                const tasks = await import('../../data/tasks.json');
                const { collection, addDoc, getDocs, query, where } = await import('firebase/firestore');
                const { db } = await import('../../../firebase-config');

                const templatesRef = collection(db, 'task_templates');

                // Check if already seeded to avoid duplicates (simple check)
                const q = query(templatesRef, where('title', '==', tasks.default[0].title));
                const snap = await getDocs(q);

                if (!snap.empty) {
                  alert('Parece que as tarefas já foram importadas!');
                  setLoading(false);
                  return;
                }

                let count = 0;
                for (const task of tasks.default) {
                  await addDoc(templatesRef, {
                    ...task,
                    is_active: true,
                    created_at: new Date()
                  });
                  count++;
                }
                alert(`${count} tarefas importadas com sucesso!`);
              } catch (error) {
                console.error('Error seeding tasks:', error);
                alert('Erro ao importar tarefas.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-bold shadow-md"
          >
            Carregar 50 Tarefas
          </button>
        </div>
      </div>

      {/* Professionals Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Profissionais ({mockData.professionals.length})
            </h3>
            <p className="text-gray-600">Profissionais fictícios para demonstração</p>
          </div>
          <button
            onClick={() => handleDeleteCategory('professionals')}
            disabled={deleting === 'professionals' || mockData.professionals.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting === 'professionals' ? 'Deletando...' : 'Remover Todos'}
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {mockData.professionals.map((prof) => (
            <div key={prof.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{prof.name || 'Nome não disponível'}</span>
                <span className="text-gray-600 ml-2">({prof.specialty || 'Especialidade não informada'})</span>
              </div>
              <button
                onClick={() => handleDeleteSpecific('professionals', prof.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                <UserX className="w-4 h-4" />
              </button>
            </div>
          ))}
          {mockData.professionals.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhum profissional encontrado</p>
          )}
        </div>
      </div>

      {/* Users Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Usuários ({mockData.users.length})
            </h3>
            <p className="text-gray-600">Usuários fictícios para demonstração</p>
          </div>
          <button
            onClick={() => handleDeleteCategory('users')}
            disabled={deleting === 'users' || mockData.users.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting === 'users' ? 'Deletando...' : 'Remover Todos'}
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {mockData.users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{user.name}</span>
                <span className="text-gray-600 ml-2">({user.email})</span>
              </div>
              <button
                onClick={() => handleDeleteSpecific('users', user.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                <UserX className="w-4 h-4" />
              </button>
            </div>
          ))}
          {mockData.users.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhum usuário encontrado</p>
          )}
        </div>
      </div>

      {/* Appointments Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Consultas ({mockData.appointments.length})
            </h3>
            <p className="text-gray-600">Consultas fictícias para demonstração</p>
          </div>
          <button
            onClick={() => handleDeleteCategory('appointments')}
            disabled={deleting === 'appointments' || mockData.appointments.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting === 'appointments' ? 'Deletando...' : 'Remover Todos'}
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {mockData.appointments.map((apt) => (
            <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{apt.title}</span>
                <span className="text-gray-600 ml-2">
                  ({new Date(apt.start_time).toLocaleDateString()})
                </span>
              </div>
              <button
                onClick={() => handleDeleteSpecific('appointments', apt.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {mockData.appointments.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhuma consulta encontrada</p>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Conteúdos/Documentos ({mockData.documents.length})
            </h3>
            <p className="text-gray-600">Documentos fictícios para demonstração</p>
          </div>
          <button
            onClick={() => handleDeleteCategory('documents')}
            disabled={deleting === 'documents' || mockData.documents.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting === 'documents' ? 'Deletando...' : 'Remover Todos'}
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {mockData.documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{doc.title || doc.original_filename}</span>
                <span className="text-gray-600 ml-2">({doc.type || doc.document_type})</span>
              </div>
              <button
                onClick={() => handleDeleteSpecific('documents', doc.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                <FileX className="w-4 h-4" />
              </button>
            </div>
          ))}
          {mockData.documents.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhum documento encontrado</p>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">Ações em Massa</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              if (confirm('ATENÇÃO: Isto irá remover TODOS os dados mock do sistema. Tem certeza?')) {
                handleDeleteCategory('all');
              }
            }}
            disabled={deleting !== ''}
            className="px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 flex items-center"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            Remover Todos os Dados Mock
          </button>

          <button
            onClick={loadMockData}
            disabled={loading}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Lista
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDataManagement;
