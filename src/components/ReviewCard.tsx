
import React from 'react';
import { Review } from '@/lib/types';
import { Clock } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onReply: (id: string) => void;
  onEdit?: (id: string) => void;
  generatedResponse?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isSelected,
  onSelect,
  onReply,
  onEdit,
  generatedResponse
}) => {
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
  };

  return (
    <div className="border rounded-lg p-4 mb-4 shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700 transition-colors">
      <div className="flex flex-wrap gap-2 items-start justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(review.id, e.target.checked)}
            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <span className={`rounded-full px-2 py-0.5 text-sm font-medium ${getRatingColor(review.rating)}`}>
            {review.rating} ★
          </span>
          <div className="flex items-center text-gray-500 text-sm dark:text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            {review.date}
          </div>
        </div>
        <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          Артикул: {review.articleId}
        </span>
      </div>
      
      <div className="mt-3">
        <p className="text-gray-800 dark:text-gray-200">{review.text}</p>
      </div>
      
      {review.response && (
        <div className="mt-3 bg-gray-50 p-3 rounded-md border-l-2 border-blue-400 dark:bg-gray-700/50 dark:border-blue-500">
          <p className="text-gray-700 text-sm dark:text-gray-300">
            <span className="font-medium">Ваш ответ:</span> {review.response}
          </p>
        </div>
      )}

      {generatedResponse && !review.processed && (
        <div className="mt-3 bg-blue-50 p-3 rounded-md border-l-2 border-blue-400 dark:bg-blue-900/20 dark:border-blue-500">
          <p className="text-gray-700 text-sm dark:text-gray-300">
            <span className="font-medium">Сгенерированный ответ:</span> {generatedResponse}
          </p>
        </div>
      )}
      
      <div className="mt-4 flex justify-end">
        {!review.processed ? (
          <button
            onClick={() => onReply(review.id)}
            className="px-3 py-1.5 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Ответить
          </button>
        ) : (
          review.canEdit ? (
            <button
              onClick={() => onEdit && onEdit(review.id)}
              className="px-3 py-1.5 bg-gray-100 text-sm text-gray-700 rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Редактировать
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-gray-100 text-sm text-gray-500 rounded-md dark:bg-gray-700 dark:text-gray-500">
              Нельзя изменить
            </span>
          )
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
