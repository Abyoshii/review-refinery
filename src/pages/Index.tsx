
import React, { useState } from 'react';
import Tabs from '@/components/Tabs';
import ReviewTable from '@/components/ReviewTable';
import ResponseModal from '@/components/ResponseModal';
import { dummyReviews } from '@/lib/dummyData';
import { Review, BatchAction } from '@/lib/types';
import { ThemeToggle } from '@/components/ThemeToggle';

const Index = () => {
  // State for reviews (will be replaced with API calls)
  const [reviews, setReviews] = useState<Review[]>(dummyReviews);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('unprocessed');
  
  // State for modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedMultipleReviews, setSelectedMultipleReviews] = useState<Review[] | undefined>(undefined);

  // Tabs configuration
  const tabs = [
    { id: 'unprocessed', label: 'Необработанные отзывы' },
    { id: 'processed', label: 'Обработанные отзывы' }
  ];

  // Handle reply to single review
  const handleReply = (id: string) => {
    const review = reviews.find(r => r.id === id);
    if (review) {
      setSelectedReview(review);
      setSelectedMultipleReviews(undefined);
      setModalOpen(true);
    }
  };

  // Handle edit for already processed review
  const handleEdit = (id: string) => {
    const review = reviews.find(r => r.id === id);
    if (review && review.canEdit) {
      setSelectedReview(review);
      setSelectedMultipleReviews(undefined);
      setModalOpen(true);
    }
  };

  // Handle batch actions
  const handleBatchAction = (action: string, selectedIds: string[]) => {
    console.log(`Batch action: ${action}`, selectedIds);
    
    // Mock API connection point for batch actions
    if (action === 'generate' || action === 'template') {
      const selectedReviews = reviews.filter(r => selectedIds.includes(r.id));
      setSelectedMultipleReviews(selectedReviews);
      setSelectedReview(null);
      setModalOpen(true);
    } else if (action === 'send') {
      // Mock API call to send responses
      alert(`Отправка ответов для ${selectedIds.length} отзывов`);
      
      // Update reviews status in UI
      const updatedReviews = reviews.map(review => {
        if (selectedIds.includes(review.id)) {
          return { ...review, processed: true };
        }
        return review;
      });
      
      setReviews(updatedReviews);
    }
  };

  // Handle submit response
  const handleSubmitResponse = (reviewId: string, response: string) => {
    // This is where you would call the API to submit the response
    console.log(`Submitting response for review ${reviewId}:`, response);
    
    // Update local state to reflect changes
    const updatedReviews = reviews.map(review => {
      if (review.id === reviewId) {
        return {
          ...review,
          response,
          processed: true
        };
      }
      return review;
    });
    
    setReviews(updatedReviews);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Review Refinery</h1>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
          <Tabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
          
          <h2 className="text-xl font-medium mb-6 dark:text-gray-100 transition-colors">
            {activeTab === 'unprocessed' ? 'Необработанные отзывы' : 'Обработанные отзывы'}
          </h2>
          
          <ReviewTable 
            reviews={reviews}
            processed={activeTab === 'processed'}
            onReply={handleReply}
            onEdit={handleEdit}
            onBatchAction={handleBatchAction}
          />
        </div>
      </main>
      
      <ResponseModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        review={selectedReview}
        onSubmit={handleSubmitResponse}
        multipleReviews={selectedMultipleReviews}
      />
    </div>
  );
};

export default Index;
