import React, { useState, useEffect } from 'react';
import { Clock, Save, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase-config';

interface ScheduleManagerProps {
    userId: string;
}

interface DaySchedule {
    enabled: boolean;
    start: string;
    end: string;
}

interface WeekSchedule {
    [key: string]: DaySchedule;
}

const DAYS = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
];

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ userId }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [schedule, setSchedule] = useState<WeekSchedule>({
        monday: { enabled: true, start: '09:00', end: '18:00' },
        tuesday: { enabled: true, start: '09:00', end: '18:00' },
        wednesday: { enabled: true, start: '09:00', end: '18:00' },
        thursday: { enabled: true, start: '09:00', end: '18:00' },
        friday: { enabled: true, start: '09:00', end: '18:00' },
        saturday: { enabled: false, start: '09:00', end: '12:00' },
        sunday: { enabled: false, start: '09:00', end: '12:00' }
    });

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const docRef = doc(db, 'professional_settings', userId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().schedule) {
                    setSchedule(docSnap.data().schedule);
                }
            } catch (error) {
                console.error("Error fetching schedule:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSchedule();
    }, [userId]);

    const handleDayToggle = (day: string) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], enabled: !prev[day].enabled }
        }));
    };

    const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], [type]: value }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'professional_settings', userId), {
                schedule,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            alert('Horários salvos com sucesso!');
        } catch (error) {
            console.error("Error saving schedule:", error);
            alert('Erro ao salvar horários.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Configurar Disponibilidade
                </h2>

                <div className="bg-purple-50 p-4 rounded-lg mb-6 border-l-4 border-purple-500">
                    <p className="text-sm text-purple-800 font-medium mb-1">ℹ️ Como funciona a agenda:</p>
                    <ul className="text-sm text-purple-700 list-disc list-inside space-y-1">
                        <li>Defina seus horários de atendimento abaixo.</li>
                        <li><strong>Google Calendar & Meet:</strong> Ao confirmar uma consulta, um link do Google Meet será gerado automaticamente e enviado para seu e-mail e para o paciente.</li>
                        <li><strong>Duração:</strong> As consultas têm duração padrão de 50 minutos.</li>
                        <li><strong>Documentos:</strong> Você pode anexar prontuários, receitas e atestados na área de "Meus Pacientes" após a consulta.</li>
                    </ul>
                </div>

                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Alterações
                    </button>
                </div>

                <div className="space-y-4">
                    {DAYS.map((day) => (
                        <div key={day.key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center w-1/3">
                                <input
                                    type="checkbox"
                                    checked={schedule[day.key].enabled}
                                    onChange={() => handleDayToggle(day.key)}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mr-3"
                                />
                                <span className={`font-medium ${schedule[day.key].enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {day.label}
                                </span>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-500 mr-2">Das</span>
                                    <input
                                        type="time"
                                        value={schedule[day.key].start}
                                        onChange={(e) => handleTimeChange(day.key, 'start', e.target.value)}
                                        disabled={!schedule[day.key].enabled}
                                        className="border rounded-md p-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm text-gray-500 mr-2">Até</span>
                                    <input
                                        type="time"
                                        value={schedule[day.key].end}
                                        onChange={(e) => handleTimeChange(day.key, 'end', e.target.value)}
                                        disabled={!schedule[day.key].enabled}
                                        className="border rounded-md p-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScheduleManager;
