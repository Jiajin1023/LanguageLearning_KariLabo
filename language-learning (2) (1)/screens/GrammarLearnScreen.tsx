import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SparklesIcon, ArrowLeftIcon } from '../components/Icons';
import type { VocabularyWord, LearningLanguage, UiLanguage, GrammarRule, CefRLevel } from '../types';
import { fetchGrammarRule } from '../services/geminiService';

type Translations = {
    grammarRuleNotAvailable: string;
    progress: string;
    prev: string;
    next: string;
};

interface GrammarLearnScreenProps {
  words: Omit<VocabularyWord, 'image'>[];
  onFinish: () => void;
  learningLanguage: LearningLanguage;
  uiLanguage: UiLanguage;
  level: CefRLevel;
  t: Translations;
  backToMenuText: string;
}

export const GrammarLearnScreen: React.FC<GrammarLearnScreenProps> = ({ words, onFinish, learningLanguage, uiLanguage, level, t, backToMenuText }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ruleCache, setRuleCache] = useState<Record<number, GrammarRule | null>>({});
    const [isLoading, setIsLoading] = useState(false);
    
    const currentWord = words[currentIndex];

    const loadGrammarRule = useCallback(async () => {
        if (!currentWord || ruleCache[currentIndex] !== undefined) return;

        setIsLoading(true);
        try {
            const rule = await fetchGrammarRule(currentWord, learningLanguage, uiLanguage, level);
            setRuleCache(prev => ({ ...prev, [currentIndex]: rule }));
        } catch (error) {
            console.error("Failed to load grammar rule for", currentWord.sourceWord, error);
            setRuleCache(prev => ({ ...prev, [currentIndex]: null })); // Mark as failed
        } finally {
            setIsLoading(false);
        }
    }, [currentIndex, currentWord, learningLanguage, uiLanguage, ruleCache, level]);

    useEffect(() => {
        loadGrammarRule();
    }, [loadGrammarRule]);

    const goToNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };
    
    const currentRule = ruleCache[currentIndex];

    return (
        <div className="w-full max-w-md animate-fade-in">
            <Card>
                <div className="flex flex-col items-center space-y-6 text-center">
                    <div>
                        <p className="text-5xl font-bold">{currentWord.sourceWord}</p>
                        <p className="text-xl text-slate-600 dark:text-slate-300 mt-1">{currentWord.targetWord}</p>
                    </div>

                    <div className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-lg min-h-[200px] flex items-center justify-center">
                        {isLoading ? <LoadingSpinner /> : (
                           currentRule ? (
                                <div className="text-left space-y-3">
                                    <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2"><SparklesIcon /> {currentRule.rule}</h3>
                                    <p className="text-slate-700 dark:text-slate-300">{currentRule.explanation}</p>
                                    <div className="border-l-4 border-blue-500 pl-3 text-sm">
                                        <p className="font-mono text-slate-800 dark:text-slate-200">{currentRule.example.sourceSentence}</p>
                                        <p className="italic text-slate-500 dark:text-slate-400">{currentRule.example.translationSentence}</p>
                                    </div>
                                </div>
                           ) : <p className="text-sm text-red-500">{t.grammarRuleNotAvailable}</p>
                        )}
                    </div>

                    <div className="w-full text-center text-sm text-slate-500">
                        {t.progress.replace('{current}', (currentIndex + 1).toString()).replace('{total}', words.length.toString())}
                    </div>

                    <div className="flex justify-between w-full pt-2">
                        <button onClick={goToPrev} disabled={currentIndex === 0} className="bg-slate-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-600 transition-transform transform hover:scale-105 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {t.prev}
                        </button>
                        <button onClick={goToNext} disabled={currentIndex === words.length - 1} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {t.next}
                        </button>
                    </div>
                </div>
            </Card>
             <button onClick={onFinish} className="w-full flex items-center justify-center gap-2 mt-4 bg-slate-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-600 transition-transform transform hover:scale-105">
                <ArrowLeftIcon />
                {backToMenuText}
            </button>
        </div>
    );
};
