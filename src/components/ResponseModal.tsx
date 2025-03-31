
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Review } from '@/lib/types';

interface ResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  multipleReviews?: Review[] | undefined;
  onSubmit: (reviewId: string, response: string) => void;
  onSubmitMultiple?: (response: string) => void;
}

const ResponseModal: React.FC<ResponseModalProps> = ({
  isOpen,
  onClose,
  review,
  multipleReviews,
  onSubmit,
  onSubmitMultiple
}) => {
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && review) {
      setResponse(review.response || '');
    } else if (isOpen && !review) {
      setResponse('');
    }
  }, [isOpen, review]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (review) {
        await onSubmit(review.id, response);
      } else if (multipleReviews && multipleReviews.length > 0 && onSubmitMultiple) {
        await onSubmitMultiple(response);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getReviewInfo = () => {
    if (review) {
      return (
        <div className="mb-4 bg-gray-50 p-4 rounded-md dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span>
              <span className="font-medium">Артикул:</span> {review.articleId}
            </span>
            <span className="px-2 py-1 rounded text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {review.rating} ★
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300">{review.text}</p>
        </div>
      );
    }
    
    if (multipleReviews && multipleReviews.length > 0) {
      return (
        <div className="mb-4 bg-gray-50 p-4 rounded-md dark:bg-gray-800">
          <p className="font-medium mb-2">
            Отправка ответа на {multipleReviews.length} отзывов
          </p>
          <div className="max-h-40 overflow-y-auto">
            {multipleReviews.map((r, index) => (
              <div key={r.id} className={`py-1 ${index !== 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}`}>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {r.articleId} - {r.rating}★ - {r.text.substring(0, 50)}{r.text.length > 50 ? '...' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl shadow-lg transition-colors">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-medium dark:text-gray-100">
            {review ? (review.processed ? 'Редактировать ответ' : 'Ответить на отзыв') : 'Ответить на выбранные отзывы'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {getReviewInfo()}
          
          <div className="mb-4">
            <label htmlFor="response" className="block text-sm font-medium mb-1 dark:text-gray-300">
              Текст ответа
            </label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={5}
              placeholder="Введите текст ответа..."
              className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={submitting || !response.trim()}
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Отправка...
                </span>
              ) : (
                'Отправить'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResponseModal;
