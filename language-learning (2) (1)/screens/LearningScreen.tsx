import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ArrowLeftIcon } from '../components/Icons';
import type { VocabularyWord, LearningLanguage } from '../types';
import { fetchImageForWord } from '../services/geminiService';
import { languageOptions } from '../translations';

type Translations = {
    imageNotAvailable: string;
    progress: string;
    prev: string;
    next: string;
};

interface LearningScreenProps {
  words: Omit<VocabularyWord, 'image'>[];
  onFinish: () => void;
  learningLanguage: LearningLanguage;
  t: Translations;
  backToMenuText: string;
}

export const LearningScreen: React.FC<LearningScreenProps> = ({ words, onFinish, learningLanguage, t, backToMenuText }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [wordCache, setWordCache] = useState<VocabularyWord[]>(words.map(w => ({...w})));
    const [isImageLoading, setIsImageLoading] = useState(false);
    
    const currentWord = wordCache[currentIndex];
    const languageDetails = languageOptions.find(lang => lang.code === learningLanguage);
    const LanguageIcon = languageDetails?.icon || (() => null);

    const loadImageForCurrentWord = useCallback(async () => {
        if (!currentWord || currentWord.image) return;

        setIsImageLoading(true);
        try {
            const imageUrl = await fetchImageForWord(currentWord.englishWord);
            setWordCache(prevCache => {
                const newCache = [...prevCache];
                newCache[currentIndex].image = imageUrl;
                return newCache;
            });
        } catch (error) {
            console.error("Failed to load image for", currentWord.sourceWord);
             setWordCache(prevCache => {
                const newCache = [...prevCache];
                newCache[currentIndex].image = 'error'; // Mark as error to prevent refetching
                return newCache;
            });
        } finally {
            setIsImageLoading(false);
        }
    }, [currentIndex, currentWord]);

    useEffect(() => {
        loadImageForCurrentWord();
    }, [loadImageForCurrentWord]);

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

    return (
        <div className="w-full max-w-md animate-fade-in">
            <Card>
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                        {isImageLoading ? <LoadingSpinner /> : (
                            currentWord.image && currentWord.image !== 'error' ? 
                            <img src={currentWord.image} alt={currentWord.sourceWord} className="w-full h-full object-cover" /> : 
                            <span className="text-slate-500">{t.imageNotAvailable}</span>
                        )}
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 text-lg text-slate-500 dark:text-slate-400">
                           <LanguageIcon />
                           <span>{languageDetails?.name}</span>
                        </div>
                        <p className="text-6xl font-bold">{currentWord.sourceWord}</p>
                        <p className="text-2xl text-slate-600 dark:text-slate-300 mt-2">{currentWord.targetWord}</p>
                    </div>

                     <div className="w-full text-center text-sm text-slate-500">
                        {t.progress.replace('{current}', (currentIndex + 1).toString()).replace('{total}', words.length.toString())}
                    </div>

                    <div className="flex justify-between w-full pt-4">
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
