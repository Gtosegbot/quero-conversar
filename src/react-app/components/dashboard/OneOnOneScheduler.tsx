import React, { useState } from 'react';
import { Calendar, Clock, User, Video, MessageSquare } from 'lucide-react';

interface OneOnOneSchedulerProps {
    managerId: string;
}

const OneOnOneScheduler: React.FC<OneOnOneSchedulerProps> = ({ managerId }) => {
    const [meeting, setMeeting] = useState({
        employee: '',
        date: '',
        time: '',
        type: 'video',
        agenda: ''
    });

    const handleSchedule = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Sessão 1-on-1 agendada com sucesso!');
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                Agendar Sessão 1-on-1
            </h3>

            <form onSubmit={handleSchedule} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Colaborador
                    </label>
                    <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        value={meeting.employee}
                        onChange={(e) => setMeeting({ ...meeting, employee: e.target.value })}
                    >
                        <option value="">Selecione...</option>
                        <option value="1">Ana Silva</option>
                        <option value="2">Carlos Santos</option>
                        <option value="3">Maria Oliveira</option>
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
                            className={`flex-1 py-2 rounded-lg border ${meeting.type === 'video'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-300 text-gray-700'
                                }`}
                        >
                            <Video className="w-4 h-4 inline mr-2" />
                            Vídeo
                        </button>
                        <button
                            type="button"
                            onClick={() => setMeeting({ ...meeting, type: 'presencial' })}
                            className={`flex-1 py-2 rounded-lg border ${meeting.type === 'presencial'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-300 text-gray-700'
                                }`}
                        >
                            <User className="w-4 h-4 inline mr-2" />
                            Presencial
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agenda
                    </label>
                    <textarea
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        rows={3}
                        value={meeting.agenda}
                        onChange={(e) => setMeeting({ ...meeting, agenda: e.target.value })}
                        placeholder="Tópicos a discutir..."
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                    Agendar Sessão
                </button>
            </form>

            <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-900 mb-3">Próximas Sessões</h4>
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900">Ana Silva</p>
                            <p className="text-sm text-gray-600">Amanhã, 14:00</p>
                        </div>
                        <Video className="w-5 h-5 text-blue-600" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OneOnOneScheduler;
