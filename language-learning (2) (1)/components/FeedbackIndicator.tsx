
import React from 'react';
import { FeedbackState } from '../types';
import { RedCircleIcon, BlueCrossIcon } from './Icons';

interface FeedbackIndicatorProps {
  state: FeedbackState;
}

export const FeedbackIndicator: React.FC<FeedbackIndicatorProps> = ({ state }) => {
  if (state === FeedbackState.NONE) {
    return null;
  }

  return (
    <div className="animate-scale-in">
      {state === FeedbackState.CORRECT && <RedCircleIcon />}
      {state === FeedbackState.INCORRECT && <BlueCrossIcon />}
    </div>
  );
};