import React, { useState, useEffect } from 'react';
import { Play, Pause, Calendar, Clock, Headphones, Star } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase-config';

interface Podcast {
    id: string;
    title: string;
    summary: string;
    audioUrl: string;
    duration: string;
    createdAt: any;
}

interface Sponsorship {
    brandName: string;
    message: string;
    logoUrl?: string;
}

const PodcastGallery: React.FC = () => {
    const [podcasts, setPodcasts] = useState<Podcast[]>([]);
    const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [sponsor, setSponsor] = useState<Sponsorship | null>(null);

    useEffect(() => {
        loadPodcasts();
        loadSponsor();
    }, []);

    useEffect(() => {
        if (currentPodcast) {
            if (audio) {
                audio.pause();
            }
            const newAudio = new Audio(currentPodcast.audioUrl);
            newAudio.onended = () => setIsPlaying(false);
            setAudio(newAudio);
            newAudio.play().catch(e => console.error("Playback error:", e));
            setIsPlaying(true);
        }
        return () => {
            if (audio) audio.pause();
        };
    }, [currentPodcast]);

    const togglePlay = () => {
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const loadPodcasts = async () => {
        try {
            const q = query(collection(db, 'podcasts'), orderBy('createdAt', 'desc'), limit(10));
            const snapshot = await getDocs(q);
            const loadedPodcasts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Podcast[];
            setPodcasts(loadedPodcasts);
        } catch (error) {
            console.error("Error loading podcasts:", error);
        }
    };

    const loadSponsor = async () => {
        try {
            // In a real app, fetch from 'sponsorships' collection where isActive == true
            // For now, we'll simulate a sponsor if none exists in DB
            const q = query(collection(db, 'sponsorships'), where('isActive', '==', true), limit(1));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                setSponsor(snapshot.docs[0].data() as Sponsorship);
            } else {
                // Fallback / Demo Sponsor
                setSponsor({
                    brandName: 'Natura',
                    message: 'Promovendo o bem-estar e a conexão com a natureza.',
                    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Natura_logo.svg/2560px-Natura_logo.svg.png'
                });
            }
        } catch (error) {
            console.error("Error loading sponsor:", error);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Headphones className="w-8 h-8 text-purple-600 mr-3" />
                Galeria de Podcasts
            </h2>

            {/* Premium Sponsorship Slot */}
            {sponsor && (
                <div className="mb-8 border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                        PATROCÍNIO PREMIUM
                    </div>
                    <div className="flex items-center z-10">
                        {sponsor.logoUrl && (
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mr-4 p-2">
                                <img src={sponsor.logoUrl} alt={sponsor.brandName} className="max-w-full max-h-full object-contain" />
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-1">Oferecimento</p>
                            <h3 className="text-lg font-bold text-gray-900">{sponsor.brandName}</h3>
                            <p className="text-sm text-gray-600">{sponsor.message}</p>
                        </div>
                    </div>
                    <Star className="w-12 h-12 text-yellow-200 absolute -bottom-4 -right-4 transform rotate-12" />
                </div>
            )}

            {/* Featured Player */}
            {currentPodcast ? (
                <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-6 text-white mb-8 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-purple-300 text-sm font-medium uppercase tracking-wider">Tocando Agora</span>
                            <h3 className="text-2xl font-bold mt-1">{currentPodcast.title}</h3>
                            <p className="text-purple-200 mt-2 max-w-2xl">{currentPodcast.summary}</p>
                        </div>
                        <button
                            onClick={togglePlay}
                            className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-purple-900 hover:scale-105 transition-transform shadow-lg"
                        >
                            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                        </button>
                    </div>
                    <div className="mt-6 flex items-center text-sm text-purple-300 space-x-4">
                        <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(currentPodcast.createdAt?.seconds * 1000).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {currentPodcast.duration}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="bg-purple-50 rounded-xl p-8 text-center mb-8 border-2 border-dashed border-purple-200">
                    <Headphones className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                    <p className="text-purple-800 font-medium">Selecione um episódio abaixo para ouvir</p>
                </div>
            )}

            {/* Episode List */}
            <div className="space-y-4">
                {podcasts.length > 0 ? (
                    podcasts.map((podcast) => (
                        <div
                            key={podcast.id}
                            onClick={() => setCurrentPodcast(podcast)}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${currentPodcast?.id === podcast.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-100 hover:border-purple-200'
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentPodcast?.id === podcast.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {currentPodcast?.id === podcast.id && isPlaying ? (
                                        <div className="flex space-x-1">
                                            <div className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: '100ms' }} />
                                            <div className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: '200ms' }} />
                                        </div>
                                    ) : (
                                        <Play className="w-5 h-5 ml-1" />
                                    )}
                                </div>
                                <div>
                                    <h4 className={`font-semibold ${currentPodcast?.id === podcast.id ? 'text-purple-900' : 'text-gray-900'}`}>
                                        {podcast.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 line-clamp-1">{podcast.summary}</p>
                                </div>
                            </div>
                            <div className="flex items-center text-gray-400 text-sm space-x-4">
                                <span className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {podcast.createdAt?.seconds ? new Date(podcast.createdAt.seconds * 1000).toLocaleDateString() : 'Hoje'}
                                </span>
                                <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {podcast.duration}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-8">Nenhum podcast disponível ainda.</p>
                )}
            </div>
        </div>
    );
};

export default PodcastGallery;
