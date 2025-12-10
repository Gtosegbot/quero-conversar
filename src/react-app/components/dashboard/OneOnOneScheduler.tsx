import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Video, MessageSquare, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { db } from '../../../firebase-config';
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

interface OneOnOneSchedulerProps {
    managerId: string;
}

interface Employee {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
}

interface Session {
    id: string;
    employeeId: string;
    employeeName: string;
    managerId: string;
    date: string;
    time: string;
    type: 'video' | 'presencial';
    agenda: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    meetLink?: string;
    googleCalendarUrl?: string;
}

const OneOnOneScheduler: React.FC<OneOnOneSchedulerProps> = ({ managerId }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [meeting, setMeeting] = useState({
        employeeId: '',
        date: '',
        time: '',
        type: 'video' as 'video' | 'presencial',
        agenda: ''
    });

    // Load Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Employees
                // Note: In a real app we might paginate or search. Here fetching all for the company/manager.
                // Assuming managerId is the companyId or we query by company_id if manager is admin
                // For simplicity, let's query company_employees where company_id == managerId
                const empQuery = query(collection(db, 'company_employees'), where('company_id', '==', managerId));
                const empSnap = await getDocs(empQuery);
                const empList = empSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Employee[];
                setEmployees(empList);

                // 2. Listen to Sessions
                const sessionQuery = query(
                    collection(db, 'one_on_one_sessions'),
                    where('managerId', '==', managerId),
                    orderBy('date', 'asc') // Requires index? If error, fallback to client sort
                );

                const unsubscribe = onSnapshot(sessionQuery, (snapshot) => {
                    const sessionList = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Session[];
                    setSessions(sessionList.filter(s => new Date(s.date + 'T' + s.time) >= new Date())); // Only future or today
                    setLoading(false);
                }, (err) => {
                    console.error("Error fetching sessions:", err);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error loading scheduler data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [managerId]);

    const generateGoogleCalendarUrl = (session: Session) => {
        const startDate = new Date(`${session.date}T${session.time}`).toISOString().replace(/-|:|\.\d\d\d/g, "");
        // Add 1 hour duration
        const endD = new Date(new Date(`${session.date}T${session.time}`).getTime() + 60 * 60 * 1000);
        const endDate = endD.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const details = `1-on-1 com ${session.employeeName}\nAgenda: ${session.agenda}\nTipo: ${session.type}`;
        const location = session.type === 'video' ? 'Google Meet (Adicionar no evento)' : 'Presencial';

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=1-on-1:+${encodeURIComponent(session.employeeName)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    };

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!meeting.employeeId || !meeting.date || !meeting.time) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        setSubmitting(true);
        try {
            const selectedEmployee = employees.find(e => e.id === meeting.employeeId);
            if (!selectedEmployee) throw new Error("Colaborador não encontrado");

            const newSession = {
                managerId,
                employeeId: meeting.employeeId,
                employeeName: selectedEmployee.name,
                date: meeting.date,
                time: meeting.time,
                type: meeting.type,
                agenda: meeting.agenda,
                status: 'scheduled',
                // For video, we can generate a placeholder "meet" link or rely on the calendar
                meetLink: meeting.type === 'video' ? `https://meet.google.com/new` : '', // 'new' redirects to a new meeting
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'one_on_one_sessions'), newSession);

            // Generate Calendar URL for the alert or immediate action
            // In a real app, we might send an email here via Cloud Functions

            alert('Sessão agendada com sucesso!');
            setMeeting({ ...meeting, agenda: '', employeeId: '' }); // Reset partial form
        } catch (error) {
            console.error("Error scheduling session:", error);
            alert("Erro ao agendar sessão.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Cancelar esta sessão?")) {
            await deleteDoc(doc(db, 'one_on_one_sessions', id));
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                Agendar Sessão 1-on-1
            </h3>

            <form onSubmit={handleSchedule} className="space-y-4 mb-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Colaborador
                    </label>
                    <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        value={meeting.employeeId}
                        onChange={(e) => setMeeting({ ...meeting, employeeId: e.target.value })}
                        required
                    >
                        <option value="">Selecione...</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data
                        </label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            value={meeting.date}
                            onChange={(e) => setMeeting({ ...meeting, date: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Horário
                        </label>
                        <input
                            type="time"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            value={meeting.time}
                            onChange={(e) => setMeeting({ ...meeting, time: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Reunião
                    </label>
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => setMeeting({ ...meeting, type: 'video' })}
                            className={`flex-1 py-2 rounded-lg border flex items-center justify-center ${meeting.type === 'video'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Video className="w-4 h-4 mr-2" />
                            Vídeo
                        </button>
                        <button
                            type="button"
                            onClick={() => setMeeting({ ...meeting, type: 'presencial' })}
                            className={`flex-1 py-2 rounded-lg border flex items-center justify-center ${meeting.type === 'presencial'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <User className="w-4 h-4 mr-2" />
                            Presencial
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agenda / Tópicos
                    </label>
                    <textarea
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        rows={3}
                        value={meeting.agenda}
                        onChange={(e) => setMeeting({ ...meeting, agenda: e.target.value })}
                        placeholder="Ex: Feedback trimestral, Alinhamento de metas..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                    {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    Próximas Sessões
                </h4>

                {loading ? (
                    <p className="text-sm text-gray-500">Carregando...</p>
                ) : sessions.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Nenhuma sessão agendada.</p>
                ) : (
                    <div className="space-y-3">
                        {sessions.map(session => (
                            <div key={session.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{session.employeeName}</p>
                                        <p className="text-xs text-gray-600">
                                            {new Date(session.date).toLocaleDateString('pt-BR')} às {session.time}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {/* Google Calendar Link */}
                                        <a
                                            href={generateGoogleCalendarUrl(session)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                                            title="Adicionar ao Google Calendar"
                                        >
                                            <Calendar className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(session.id)}
                                            className="p-1.5 text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors"
                                            title="Cancelar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-gray-500">
                                    {session.type === 'video' ? <Video className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                                    {session.type === 'video' ? 'Vídeo Conferência' : 'Presencial'}
                                    {session.type === 'video' && (
                                        <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">
                                            Link gerado no Calendar
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OneOnOneScheduler;
