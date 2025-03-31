
import React, { useState, useEffect } from 'react';
import { Review } from '@/lib/types';

interface ResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  onSubmit: (reviewId: string, response: string) => void;
  multipleReviews?: Review[];
}

const ResponseModal: React.FC<ResponseModalProps> = ({
  isOpen,
  onClose,
  review,
  onSubmit,
  multipleReviews
}) => {
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [multiResponses, setMultiResponses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (review) {
      setResponse(review.response || '');
    } else {
      setResponse('');
    }
  }, [review]);

  const handleGenerateAI = () => {
    setIsGenerating(true);
    
    // Simulate AI generation - This is where the API call would happen
    setTimeout(() => {
      if (review) {
        const rating = review.rating;
        let aiResponse = '';
        
        if (rating >= 4) {
          aiResponse = 'Спасибо за вашу высокую оценку! Мы рады, что наш товар соответствует вашим ожиданиям. Будем рады видеть вас снова!';
        } else if (rating >= 3) {
          aiResponse = 'Благодарим за ваш отзыв. Мы ценим вашу обратную связь и работаем над улучшением наших товаров. Если у вас есть конкретные предложения, пожалуйста, сообщите нам.';
        } else {
          aiResponse = 'Приносим извинения за то, что ваш опыт не оправдал ожиданий. Мы хотели бы узнать больше о возникших проблемах, чтобы предложить решение. Пожалуйста, свяжитесь с нашей службой поддержки.';
        }
        
        setResponse(aiResponse);
      }
      
      setIsGenerating(false);
    }, 1000);
  };

  const handleMultiGenerateAI = () => {
    setIsGenerating(true);
    
    // Simulate AI generation for multiple reviews
    setTimeout(() => {
      if (multipleReviews) {
        const responses: Record<string, string> = {};
        
        multipleReviews.forEach(review => {
          const rating = review.rating;
          let aiResponse = '';
          
          if (rating >= 4) {
            aiResponse = 'Спасибо за вашу высокую оценку! Мы рады, что наш товар соответствует вашим ожиданиям.';
          } else if (rating >= 3) {
            aiResponse = 'Благодарим за ваш отзыв. Мы ценим вашу обратную связь и работаем над улучшением наших товаров.';
          } else {
            aiResponse = 'Приносим извинения за то, что ваш опыт не оправдал ожиданий. Мы хотели бы узнать больше о возникших проблемах.';
          }
          
          responses[review.id] = aiResponse;
        });
        
        setMultiResponses(responses);
      }
      
      setIsGenerating(false);
    }, 1500);
  };

  const handleSubmit = () => {
    if (review) {
      onSubmit(review.id, response);
    } else if (multipleReviews) {
      // Submit multiple responses
      multipleReviews.forEach(review => {
        if (multiResponses[review.id]) {
          onSubmit(review.id, multiResponses[review.id]);
        }
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-gray-800">
              {review ? 'Ответ на отзыв' : 'Массовая обработка отзывов'}
            </h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {/* Single review */}
          {review && (
            <>
              <div className="mb-4 bg-gray-50 p-4 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    review.rating >= 4 ? 'bg-green-50 text-green-600' : 
                    review.rating >= 3 ? 'bg-yellow-50 text-yellow-600' : 
                    'bg-red-50 text-red-600'
                  }`}>
                    {review.rating} ★
                  </span>
                  <span className="text-sm text-gray-500">ID: {review.id}</span>
                  <span className="text-sm text-gray-500">Артикул: {review.articleId}</span>
                </div>
                <p className="text-gray-700">{review.text}</p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Ваш ответ</label>
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Генерация...' : 'Сгенерировать с помощью ИИ'}
                  </button>
                </div>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Введите ответ на отзыв..."
                />
              </div>
            </>
          )}

          {/* Multiple reviews */}
          {multipleReviews && (
            <>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-700">Выбрано отзывов: {multipleReviews.length}</p>
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={handleMultiGenerateAI}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Генерация...' : 'Сгенерировать ответы с помощью ИИ'}
                  </button>
                </div>
              </div>

              <div className="max-h-[40vh] overflow-y-auto mb-4">
                {multipleReviews.map(review => (
                  <div key={review.id} className="mb-4 border rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        review.rating >= 4 ? 'bg-green-50 text-green-600' : 
                        review.rating >= 3 ? 'bg-yellow-50 text-yellow-600' : 
                        'bg-red-50 text-red-600'
                      }`}>
                        {review.rating} ★
                      </span>
                      <span className="text-sm text-gray-500">ID: {review.id}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{review.text}</p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ответ</label>
                      <textarea
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 h-20"
                        value={multiResponses[review.id] || ''}
                        onChange={(e) => setMultiResponses({
                          ...multiResponses,
                          [review.id]: e.target.value
                        })}
                        placeholder="Ответ будет сгенерирован..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              onClick={onClose}
            >
              Отмена
            </button>
            <button
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              onClick={handleSubmit}
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseModal;
