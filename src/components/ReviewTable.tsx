
import React, { useState, useEffect } from 'react';
import { Review } from '@/lib/types';
import ReviewCard from './ReviewCard';
import BatchActions from './BatchActions';

interface ReviewTableProps {
  reviews: Review[];
  processed: boolean;
  onReply: (id: string) => void;
  onEdit?: (id: string) => void;
  onBatchAction: (action: string, selectedIds: string[]) => void;
}

const ReviewTable: React.FC<ReviewTableProps> = ({
  reviews,
  processed,
  onReply,
  onEdit,
  onBatchAction,
}) => {
  // State for selected reviews (to be used by the API)
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  // State for generated responses (to show preview)
  const [generatedResponses, setGeneratedResponses] = useState<Record<string, string>>({});

  // Filter reviews based on processed status
  const filteredReviews = reviews.filter(review => review.processed === processed);

  // Handle single review selection
  const handleSelectReview = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedReviews(prev => [...prev, id]);
    } else {
      setSelectedReviews(prev => prev.filter(reviewId => reviewId !== id));
    }
  };

  // Handle batch actions
  const handleBatchAction = (action: string) => {
    // API connection point for batch actions
    onBatchAction(action, selectedReviews);
    
    if (action === 'deselect') {
      setSelectedReviews([]);
    } else if (action === 'generate') {
      // Simulate AI response generation
      const responses: Record<string, string> = {};
      selectedReviews.forEach(id => {
        const review = reviews.find(r => r.id === id);
        if (review) {
          // This is where the API would generate responses
          const rating = review.rating;
          if (rating >= 4) {
            responses[id] = 'Спасибо за высокую оценку! Мы рады, что вам понравился наш товар.';
          } else if (rating >= 3) {
            responses[id] = 'Спасибо за отзыв. Мы работаем над улучшением качества наших товаров.';
          } else {
            responses[id] = 'Приносим извинения за неудобства. Мы хотели бы узнать больше о вашем опыте, чтобы улучшить качество обслуживания.';
          }
        }
      });
      setGeneratedResponses(responses);
    }
  };

  return (
    <div>
      {/* Batch actions panel */}
      {!processed && (
        <BatchActions 
          selectedCount={selectedReviews.length} 
          onAction={(action) => handleBatchAction(action as string)}
          disabled={selectedReviews.length === 0}
        />
      )}

      {/* Empty state */}
      {filteredReviews.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Нет {processed ? 'обработанных' : 'необработанных'} отзывов</p>
        </div>
      )}

      {/* Reviews list */}
      <div>
        {filteredReviews.map(review => (
          <ReviewCard
            key={review.id}
            review={review}
            isSelected={selectedReviews.includes(review.id)}
            onSelect={handleSelectReview}
            onReply={onReply}
            onEdit={onEdit}
            generatedResponse={generatedResponses[review.id]}
          />
        ))}
      </div>
    </div>
  );
};

export default ReviewTable;
