import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { VocabularyWord, LearningLanguage } from '../types';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SpeakerWaveIcon, MicrophoneIcon, ArrowPathIcon, CheckIcon, XIcon, ArrowLeftIcon } from '../components/Icons';

// FIX: Add type definitions for the Web Speech API to resolve TypeScript errors.
// These types are not part of the standard DOM library and need to be declared.
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}
  
interface SpeechRecognitionResult {
    readonly [index: number]: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
    readonly length: number;
}

interface SpeechRecognitionResultList {
    readonly [index: number]: SpeechRecognitionResult;
    readonly length: number;
}

interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start: () => void;
}

interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
}

type Translations = {
    score: string;
    progress: string;
    instruction: string;
    listen: string;
    record: string;
    recording: string;
    processing: string;
    speakNow: string;
    correct: string;
    incorrect: string;
    correctWordWas: string;
    youSaid: string;
    nextWord: string;
    finish: string;
    micError: string;
    recognitionError: string;
};

interface PronunciationScreenProps {
  words: VocabularyWord[];
  learningLanguage: LearningLanguage;
  onFinish: (finalScore: number) => void;
  onBackToMenu: () => void;
  t: Translations;
  backToMenuText: string;
}

type RecognitionState = 'idle' | 'recording' | 'processing';
type Feedback = 'none' | 'correct' | 'incorrect';

// Mapping our app's language codes to BCP 47 language tags for Web Speech API
const langCodeMap: Record<LearningLanguage, string> = {
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    ja: 'ja-JP',
    zh: 'zh-CN',
    ar: 'ar-SA',
};

export const PronunciationScreen: React.FC<PronunciationScreenProps> = ({ words, learningLanguage, onFinish, onBackToMenu, t, backToMenuText }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [recognitionState, setRecognitionState] = useState<RecognitionState>('idle');
    const [feedback, setFeedback] = useState<Feedback>('none');
    const [userTranscript, setUserTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const currentWord = words[currentIndex];

    const setupRecognition = useCallback(() => {
        // FIX: Access SpeechRecognition from window, casting to `any` to avoid TypeScript errors
        // for non-standard browser APIs, and provide a type for the constructor.
        const SpeechRecognition: SpeechRecognitionStatic | undefined = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = langCodeMap[learningLanguage] || 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setRecognitionState('recording');
            setError(null);
            setUserTranscript('');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            setUserTranscript(transcript);
            processTranscript(transcript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error === 'not-allowed') {
                 setError(t.micError);
            } else {
                 setError(t.recognitionError);
            }
            setRecognitionState('idle');
        };
        
        recognition.onend = () => {
             setRecognitionState('idle');
        };
        
        recognitionRef.current = recognition;
    }, [learningLanguage, t]);

    useEffect(() => {
        setupRecognition();
    }, [setupRecognition]);

    const handleNextWord = useCallback(() => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onFinish(score);
        }
    }, [currentIndex, words.length, onFinish, score]);

    useEffect(() => {
        setFeedback('none');
        setUserTranscript('');
        setError(null);
        setRecognitionState('idle');
    }, [currentIndex]);
    

    const processTranscript = (transcript: string) => {
        // Normalize both strings for a more lenient comparison
        const normalizedTranscript = transcript.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        const normalizedSourceWord = currentWord.sourceWord.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

        if (normalizedTranscript === normalizedSourceWord) {
            setFeedback('correct');
            setScore(prev => prev + 1);
        } else {
            setFeedback('incorrect');
        }
    };

    const handleListen = () => {
        if (!currentWord || typeof window.speechSynthesis === 'undefined') return;
        const utterance = new SpeechSynthesisUtterance(currentWord.sourceWord);
        utterance.lang = langCodeMap[learningLanguage] || 'en-US';
        speechSynthesis.speak(utterance);
    };

    const handleRecord = () => {
        if (recognitionRef.current && recognitionState === 'idle') {
            try {
                recognitionRef.current.start();
            } catch(e) {
                // If it's already started, this can throw.
                console.error(e);
            }
        }
    };
    
    const getRecordButtonContent = () => {
        switch(recognitionState) {
            case 'recording':
                return <><div className="animate-pulse h-2.5 w-2.5 bg-red-500 rounded-full mr-2"></div>{t.recording}</>;
            case 'processing':
                return <><LoadingSpinner size="sm" />{t.processing}</>;
            default:
                return <><MicrophoneIcon className="h-6 w-6" />{t.record}</>;
        }
    }

    return (
        <div className="w-full max-w-md animate-fade-in">
            <div className="text-center mb-4">
                <p className="text-xl font-bold">{t.score.replace('{score}', score.toString())}</p>
                <p className="text-sm text-slate-500">{t.progress.replace('{current}', (currentIndex + 1).toString()).replace('{total}', words.length.toString())}</p>
            </div>
             {error && (
                <Card className="bg-red-100 dark:bg-red-900 border-red-500 mb-4">
                    <p className="text-red-700 dark:text-red-200 font-semibold">{error}</p>
                </Card>
            )}
            <Card>
                <div className="flex flex-col items-center space-y-6">
                    <p className="text-slate-500 dark:text-slate-400">{t.instruction}</p>
                    <div className="text-center">
                        <p className="text-6xl font-bold">{currentWord.sourceWord}</p>
                        <p className="text-2xl text-slate-600 dark:text-slate-300 mt-2">{currentWord.targetWord}</p>
                    </div>

                    <div className="flex justify-center w-full space-x-2">
                         <button onClick={handleListen} disabled={recognitionState !== 'idle'} className="flex-1 flex items-center justify-center gap-2 bg-slate-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-600 transition-transform transform hover:scale-105 disabled:bg-slate-400">
                             <SpeakerWaveIcon className="h-6 w-6" />{t.listen}
                        </button>
                        <button onClick={handleRecord} disabled={recognitionState !== 'idle' || !!feedback && feedback !== 'none'} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed">
                            {getRecordButtonContent()}
                        </button>
                    </div>
                    
                    {feedback !== 'none' && (
                        <div className={`animate-fade-in w-full p-4 rounded-lg text-center ${feedback === 'correct' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                            {feedback === 'correct' ? (
                                 <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-200">
                                    <CheckIcon /> <span className="text-lg font-bold">{t.correct}</span>
                                </div>
                            ) : (
                                <div className="space-y-2 text-red-700 dark:text-red-200">
                                    <div className="flex items-center justify-center gap-2">
                                        <XIcon /> <span className="text-lg font-bold">{t.incorrect}</span>
                                    </div>
                                    <p><span className="font-semibold">{t.correctWordWas}</span> {currentWord.sourceWord}</p>
                                    <p><span className="font-semibold">{t.youSaid}</span> {userTranscript || '...'}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {feedback !== 'none' && (
                         <button onClick={handleNextWord} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105">
                            <ArrowPathIcon />
                            {currentIndex < words.length - 1 ? t.nextWord : t.finish}
                        </button>
                    )}
                </div>
            </Card>
            <button onClick={onBackToMenu} className="w-full flex items-center justify-center gap-2 mt-4 bg-slate-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-600 transition-transform transform hover:scale-105">
                <ArrowLeftIcon />
                {backToMenuText}
            </button>
        </div>
    );
};