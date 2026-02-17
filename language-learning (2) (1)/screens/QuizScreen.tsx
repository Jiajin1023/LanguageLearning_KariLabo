import React, { useState, useEffect } from 'react';
import type { VocabularyWord, ExampleSentence, UiLanguage, LearningLanguage } from '../types';
import { FeedbackState } from '../types';
import { fetchExampleSentence, fetchHint } from '../services/geminiService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Card } from '../components/Card';
import { FeedbackIndicator } from '../components/FeedbackIndicator';
import { LightbulbIcon, SparklesIcon, ArrowPathIcon, ArrowLeftIcon } from '../components/Icons';
import { languageOptions } from '../translations';

type Translations = {
    score: string;
    progress: string;
    placeholder: string;
    check: string;
    hint: string;
    hintError: string;
    correctAnswer: string;
    nextWord: string;
    finish: string;
    exampleSentence: string;
};

interface QuizScreenProps {
  words: VocabularyWord[];
  uiLanguage: UiLanguage;
  learningLanguage: LearningLanguage;
  onFinish: (finalScore: number) => void;
  onBackToMenu: () => void;
  t: Translations;
  backToMenuText: string;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ words, uiLanguage, learningLanguage, onFinish, onBackToMenu, t, backToMenuText }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentWord, setCurrentWord] = useState<VocabularyWord>(words[0]);
    const [userInput, setUserInput] = useState('');
    const [feedbackState, setFeedbackState] = useState<FeedbackState>(FeedbackState.NONE);
    const [score, setScore] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [exampleSentence, setExampleSentence] = useState<ExampleSentence | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const learningLangDetails = languageOptions.find(l => l.code === learningLanguage);
    const uiLangDetails = languageOptions.find(l => l.code === uiLanguage);

    useEffect(() => {
        setCurrentWord(words[currentIndex]);
        setUserInput('');
        setFeedbackState(FeedbackState.NONE);
        setExampleSentence(null);
        setHint(null);
        setShowHint(false);
        setError(null);
    }, [currentIndex, words]);

    const handleCheckAnswer = async () => {
        if (!currentWord || userInput.trim() === '') return;

        setIsSubmitting(true);
        setError(null);
        const isCorrect = userInput.trim().toLowerCase() === currentWord.targetWord.toLowerCase();

        if (isCorrect) {
            setFeedbackState(FeedbackState.CORRECT);
            setScore(prev => prev + 1);
            try {
                const sentence = await fetchExampleSentence(currentWord.sourceWord, learningLanguage, uiLanguage);
                setExampleSentence(sentence);
            } catch (err) {
                console.error("Failed to fetch example sentence:", err);
            }
        } else {
            setFeedbackState(FeedbackState.INCORRECT);
        }
        setIsSubmitting(false);
    };

    const handleGetHint = async () => {
        if (!currentWord) return;
        if (hint) {
            setShowHint(true);
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const fetchedHint = await fetchHint(currentWord.sourceWord, learningLanguage, uiLanguage);
            setHint(fetchedHint);
            setShowHint(true);
        } catch (err) {
            console.error("Failed to fetch hint:", err);
            setError(t.hintError);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleNextWord = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onFinish(score);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (feedbackState === FeedbackState.NONE) {
                handleCheckAnswer();
            } else {
                handleNextWord();
            }
        }
    };
    
    const getFeedbackClasses = () => {
        switch(feedbackState) {
            case FeedbackState.CORRECT: return 'border-red-500 bg-red-50 dark:bg-red-900/50';
            case FeedbackState.INCORRECT: return 'border-blue-500 bg-blue-50 dark:bg-blue-900/50';
            default: return 'border-slate-300 dark:border-slate-600';
        }
    };
    
    if (!uiLangDetails || !learningLangDetails) {
        return null; // Or a loading/error state
    }
    
    const UiLanguageIcon = uiLangDetails.icon;
    const LearningLanguageIcon = learningLangDetails.icon;

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
            <Card className={getFeedbackClasses()}>
                <div className="flex flex-col items-center space-y-6">
                    <div className="flex items-center space-x-2 text-lg text-slate-500 dark:text-slate-400">
                        <LearningLanguageIcon />
                        <span>{learningLangDetails.name}</span>
                    </div>
                    <p className="text-6xl font-bold text-center">{currentWord.sourceWord}</p>

                    <div className="w-full relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UiLanguageIcon />
                        </div>
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={t.placeholder.replace('{language}', uiLangDetails.name)}
                            disabled={feedbackState !== FeedbackState.NONE || isSubmitting}
                            className={`w-full pl-10 pr-10 py-3 border-2 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${getFeedbackClasses()}`}
                            aria-label="Translation input"
                        />
                         <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <FeedbackIndicator state={feedbackState} />
                        </div>
                    </div>
                    
                    { feedbackState === FeedbackState.INCORRECT && (
                        <div className="text-center bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg w-full">
                            <p className="text-blue-700 dark:text-blue-200">
                                <span className="font-bold">{t.correctAnswer}</span> {currentWord.targetWord}
                            </p>
                        </div>
                    )}

                    { showHint && hint && (
                        <div className="text-center bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg w-full">
                            <p className="text-blue-600 dark:text-blue-300"><span className="font-bold">{t.hint}:</span> {hint}</p>
                        </div>
                    )}

                    <div className="flex justify-center w-full space-x-2">
                        {feedbackState === FeedbackState.NONE ? (
                            <>
                                <button onClick={handleGetHint} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-600 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                    {isSubmitting && !showHint ? <LoadingSpinner size="sm" /> : <LightbulbIcon />}
                                    {t.hint}
                                </button>
                                <button onClick={handleCheckAnswer} disabled={isSubmitting || userInput.trim() === ''} className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                    {isSubmitting ? <LoadingSpinner size="sm" /> : t.check}
                                </button>
                            </>
                        ) : (
                             <button onClick={handleNextWord} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105">
                                <ArrowPathIcon />
                                {currentIndex < words.length - 1 ? t.nextWord : t.finish}
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            {exampleSentence && feedbackState === FeedbackState.CORRECT && (
                <Card className="mt-4 animate-fade-in">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><SparklesIcon /> {t.exampleSentence}</h3>
                    <div className="space-y-2 text-slate-600 dark:text-slate-300">
                       <p><span className="font-semibold text-slate-800 dark:text-slate-100 uppercase">{learningLanguage}:</span> {exampleSentence.sourceSentence}</p>
                       <p><span className="font-semibold text-slate-800 dark:text-slate-100 uppercase">{uiLanguage}:</span> {exampleSentence.translationSentence}</p>
                    </div>
                </Card>
            )}

            <button onClick={onBackToMenu} className="w-full flex items-center justify-center gap-2 mt-4 bg-slate-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-600 transition-transform transform hover:scale-105">
                <ArrowLeftIcon />
                {backToMenuText}
            </button>
        </div>
    );
};
