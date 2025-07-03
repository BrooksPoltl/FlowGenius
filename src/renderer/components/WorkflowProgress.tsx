/**
 * WorkflowProgress - Component to display real-time workflow progress
 * Shows current step, progress bar, and status messages
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';

interface WorkflowProgress {
  currentStep: string;
  totalSteps: number;
  stepIndex: number;
  stepName: string;
  status: 'starting' | 'in_progress' | 'completed' | 'error';
  message?: string;
  timestamp: string;
}

interface WorkflowProgressProps {
  isVisible: boolean;
  onClose?: () => void;
}

export function WorkflowProgress({ isVisible, onClose }: WorkflowProgressProps) {
  const [progress, setProgress] = useState<WorkflowProgress | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Listen for progress updates
    const unsubscribe = window.electronAPI.onWorkflowProgress((newProgress) => {
      console.log('📊 Received progress update:', newProgress);
      setProgress(newProgress);
      
      // Check if workflow is complete
      if (newProgress.stepIndex === newProgress.totalSteps && newProgress.status === 'completed') {
        setIsComplete(true);
        
        // Auto-close after 2 seconds when complete
        setTimeout(() => {
          onClose?.();
          setIsComplete(false);
          setProgress(null);
        }, 2000);
      }
    });

    // Reset state when modal opens
    setProgress(null);
    setIsComplete(false);

    return () => {
      unsubscribe();
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getStatusIcon = (status: WorkflowProgress['status']) => {
    switch (status) {
      case 'starting':
      case 'in_progress':
        return <Loader className="h-5 w-5 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    return (progress.stepIndex / progress.totalSteps) * 100;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isComplete ? 'News Curation Complete!' : 'Curating Your News'}
          </h3>
          <p className="text-sm text-gray-600">
            {isComplete 
              ? 'Your personalized briefing is ready' 
              : 'Please wait while we gather and organize your news...'}
          </p>
        </div>

        {progress && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>

            {/* Step Counter */}
            <div className="text-center text-sm text-gray-600">
              Step {progress.stepIndex} of {progress.totalSteps}
            </div>

            {/* Current Step */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              {getStatusIcon(progress.status)}
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {progress.stepName}
                </div>
                {progress.message && (
                  <div className="text-sm text-gray-600 mt-1">
                    {progress.message}
                  </div>
                )}
              </div>
            </div>


          </div>
        )}

        {/* Loading animation when no progress data yet */}
        {!progress && !isComplete && (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Initializing...</span>
          </div>
        )}

        {/* Close button (only show when complete or allow manual close) */}
        {(isComplete || onClose) && (
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {isComplete ? 'Continue' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Test component to trigger progress updates
 */
export function TestProgressButton() {
  const [showProgress, setShowProgress] = useState(false);

  const handleTestProgress = async () => {
    setShowProgress(true);
    try {
      await window.electronAPI.triggerTestProgress();
    } catch (error) {
      console.error('Failed to trigger test progress:', error);
    }
  };

  return (
    <>
      <button
        onClick={handleTestProgress}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
        Test Progress
      </button>
      
      <WorkflowProgress 
        isVisible={showProgress}
        onClose={() => setShowProgress(false)}
      />
    </>
  );
} 