import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ArrowPathIcon, ArrowLeftIcon } from '../components/Icons';
import type { VocabularyWord, LearningLanguage, UiLanguage, GrammarQuestion, CefRLevel } from '../types';
import { fetchGrammarQuestion, fetchGrammarExplanation } from '../services/geminiService';

type Translations = {
    score: string;
    progress: string;
    generating: string;
    questionError: string;
    tryAgain: string;
    correctAnswer: string;
    gettingExplanation: string;
    explanationError: string;
    correct: string;
    nextQuestion: string;
    finishQuiz: string;
};
interface GrammarScreenProps {
  words: VocabularyWord[];
  onFinish: (score: number) => void;
  onBackToMenu: () => void;
  learningLanguage: LearningLanguage;
  uiLanguage: UiLanguage;
  level: CefRLevel;
  t: Translations;
  backToMenuText: string;
}

export const GrammarScreen: React.FC<GrammarScreenProps> = ({ words, onFinish, onBackToMenu, learningLanguage, uiLanguage, level, t, backToMenuText }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<GrammarQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);

  const loadQuestion = useCallback(async () => {
    setIsLoading(true);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setError(null);
    setCurrentQuestion(null);
    setExplanation(null);
    setIsExplanationLoading(false);
    
    try {
      const question = await fetchGrammarQuestion(words[currentIndex], learningLanguage, uiLanguage, level);
      setCurrentQuestion(question);
    } catch (err) {
      console.error("Failed to fetch grammar question", err);
      setError(t.questionError);
    } finally {
      setIsLoading(false);
    }
  }, [currentIndex, words, learningLanguage, uiLanguage, level, t]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleAnswerSelect = async (option: string) => {
    if (selectedAnswer || !currentQuestion) return;

    setSelectedAnswer(option);
    const correct = option === currentQuestion.answer;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
    } else {
        setIsExplanationLoading(true);
        setExplanation(null);
        try {
            const fetchedExplanation = await fetchGrammarExplanation(
                currentQuestion,
                option,
                learningLanguage,
                uiLanguage
            );
            setExplanation(fetchedExplanation);
        } catch (err) {
            console.error("Failed to fetch explanation", err);
            setExplanation(t.explanationError);
        } finally {
            setIsExplanationLoading(false);
        }
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onFinish(score);
    }
  };

  const getButtonClass = (option: string) => {
    if (!selectedAnswer) {
      return 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700';
    }
    if (option === currentQuestion?.answer) {
      return 'bg-green-100 dark:bg-green-900 border-green-500 ring-2 ring-green-500';
    }
    if (option === selectedAnswer && option !== currentQuestion?.answer) {
      return 'bg-red-100 dark:bg-red-900 border-red-500';
    }
    return 'bg-slate-100 dark:bg-slate-700 text-slate-500';
  };

  return (
    <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-4">
            <p className="text-xl font-bold">{t.score.replace('{score}', score.toString())}</p>
            <p className="text-sm text-slate-500">{t.progress.replace('{current}', (currentIndex + 1).toString()).replace('{total}', words.length.toString())}</p>
        </div>
        {error && (
            <Card className="bg-red-100 dark:bg-red-900 border-red-500 mb-4">
                <p className="text-red-700 dark:text-red-200 font-semibold">{error}</p>
                <button onClick={loadQuestion} className="mt-2 text-blue-600 dark:text-blue-400 font-bold">{t.tryAgain}</button>
            </Card>
        )}
        <Card>
            {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                    <LoadingSpinner />
                    <p className="text-slate-500">{t.generating}</p>
                </div>
            ) : currentQuestion ? (
                <div className="space-y-6">
                    <div className="text-center">
                        <p className="text-2xl font-semibold">{currentQuestion.question.split('(')[0]}</p>
                        <p className="text-slate-500 dark:text-slate-400">({currentQuestion.question.split('(')[1]}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentQuestion.options.map(option => (
                            <button
                                key={option}
                                onClick={() => handleAnswerSelect(option)}
                                disabled={!!selectedAnswer}
                                className={`p-4 rounded-lg border-2 transition-all text-lg font-semibold ${getButtonClass(option)}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    
                    {selectedAnswer && isCorrect === false && (
                        <div className="animate-fade-in mt-4 p-4 bg-red-100 dark:bg-red-900/50 rounded-lg text-left space-y-2">
                            <p className="font-bold text-red-700 dark:text-red-200">
                                {t.correctAnswer} <span className="font-semibold">{currentQuestion?.answer}</span>
                            </p>
                            {isExplanationLoading ? (
                                <div className="flex items-center gap-2 mt-2 text-slate-500">
                                    <LoadingSpinner size="sm" />
                                    <span>{t.gettingExplanation}</span>
                                </div>
                            ) : explanation ? (
                                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                                    <p className="text-sm text-red-800 dark:text-red-100">{explanation}</p>
                                </div>
                            ) : null}
                        </div>
                    )}
                    {selectedAnswer && isCorrect === true && (
                        <div className="animate-fade-in mt-4 p-4 bg-green-100 dark:bg-green-900/50 rounded-lg text-center">
                            <p className="font-bold text-lg text-green-700 dark:text-green-200">{t.correct}</p>
                        </div>
                    )}

                    {selectedAnswer && (
                        <div className="flex justify-center">
                            <button
                                onClick={handleNext}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
                            >
                                <ArrowPathIcon />
                                {currentIndex < words.length - 1 ? t.nextQuestion : t.finishQuiz}
                            </button>
                        </div>
                    )}
                </div>
            ) : null}
        </Card>
        <button onClick={onBackToMenu} className="w-full flex items-center justify-center gap-2 mt-4 bg-slate-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-600 transition-transform transform hover:scale-105">
            <ArrowLeftIcon />
            {backToMenuText}
        </button>
    </div>
  );
};
