import React from 'react';
import { Card } from '../components/Card';
import { ArrowPathIcon } from '../components/Icons';

type Translations = {
    title: string;
    perfectMessage: string;
    excellentMessage: string;
    goodMessage: string;
    practiceMessage: string;
    score: string;
    playAgain: string;
    emojis: {
        perfect: string;
        excellent: string;
        good: string;
        practice: string;
        default: string;
    }
};

interface ResultsScreenProps {
    score: number;
    total: number;
    onRestart: () => void;
    t: Translations;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ score, total, onRestart, t }) => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    
    let feedback: { message: string, emoji: string };
    
    if (percentage === 100) {
        feedback = { message: t.perfectMessage, emoji: t.emojis.perfect };
    } else if (percentage >= 75) {
        feedback = { message: t.excellentMessage, emoji: t.emojis.excellent };
    } else if (percentage >= 50) {
        feedback = { message: t.goodMessage, emoji: t.emojis.good };
    } else {
        feedback = { message: t.practiceMessage, emoji: t.emojis.practice };
    }

    return (
        <div className="w-full max-w-md animate-fade-in">
            <Card>
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-2">{t.title}</h2>
                    <p className="text-6xl my-4">{feedback.emoji}</p>
                    <p className="text-xl text-slate-600 dark:text-slate-300">{feedback.message}</p>
                    <p className="text-4xl font-bold my-4">{t.score.replace('{score}', score.toString()).replace('{total}', total.toString())}</p>
                     <button onClick={onRestart} className="w-full flex items-center justify-center gap-2 mt-6 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
                        <ArrowPathIcon />
                        {t.playAgain}
                    </button>
                </div>
            </Card>
        </div>
    );
};
