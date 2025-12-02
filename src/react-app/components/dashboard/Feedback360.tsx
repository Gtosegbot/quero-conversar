import React, { useState } from 'react';
import { Star, Send, User, Calendar } from 'lucide-react';

interface Feedback360Props {
    companyId: string;
}

const Feedback360: React.FC<Feedback360Props> = ({ companyId }) => {
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [feedback, setFeedback] = useState({
        communication: 5,
        teamwork: 5,
        leadership: 5,
        technical: 5,
        comments: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Feedback enviado com sucesso!');
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                Feedback 360°
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Avaliar Colaborador
                    </label>
                    <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        <option value="1">Ana Silva</option>
                        <option value="2">Carlos Santos</option>
                        <option value="3">Maria Oliveira</option>
                    </select>
                </div>

                {['communication', 'teamwork', 'leadership', 'technical'].map((skill) => (
                    <div key={skill}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                            {skill === 'communication' ? 'Comunicação' :
                                skill === 'teamwork' ? 'Trabalho em Equipe' :
                                    skill === 'leadership' ? 'Liderança' : 'Habilidades Técnicas'}
                        </label>
                        <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-6 h-6 cursor-pointer ${star <= feedback[skill as keyof typeof feedback]
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                    onClick={() => setFeedback({ ...feedback, [skill]: star })}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comentários
                    </label>
                    <textarea
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        rows={4}
                        value={feedback.comments}
                        onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                        placeholder="Compartilhe seus comentários..."
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center"
                >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Feedback
                </button>
            </form>
        </div>
    );
};

export default Feedback360;
