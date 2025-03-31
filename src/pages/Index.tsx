
import React, { useState, useEffect } from 'react';
import Tabs from '@/components/Tabs';
import ReviewTable from '@/components/ReviewTable';
import ResponseModal from '@/components/ResponseModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search } from 'lucide-react';
import { Review } from '@/lib/types';
import { fetchReviews, syncReviews, replyToReview, processBatchAction, getUnansweredCount } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  // State для отзывов
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // State для активной вкладки
  const [activeTab, setActiveTab] = useState('unprocessed');
  
  // State для фильтрации
  const [articleFilter, setArticleFilter] = useState('');
  
  // State для модального окна
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedMultipleReviews, setSelectedMultipleReviews] = useState<Review[] | undefined>(undefined);
  
  // State для счетчика необработанных отзывов
  const [unansweredCount, setUnansweredCount] = useState(0);
  
  const { toast } = useToast();

  // Вкладки
  const tabs = [
    { id: 'unprocessed', label: 'Необработанные отзывы' },
    { id: 'processed', label: 'Обработанные отзывы' }
  ];

  // Загрузка отзывов при монтировании и изменении фильтров
  useEffect(() => {
    loadReviews();
    loadUnansweredCount();
    // Обновляем количество необработанных отзывов каждые 5 минут
    const interval = setInterval(loadUnansweredCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeTab, articleFilter]);

  // Загрузка отзывов
  const loadReviews = async () => {
    setLoading(true);
    try {
      const result = await fetchReviews({
        isAnswered: activeTab === 'processed' ? 'true' : 'false',
        nmId: articleFilter,
        take: 50,
        useLocal: true
      });
      
      if (result.data && result.data.feedbacks) {
        const mappedReviews: Review[] = result.data.feedbacks.map(review => ({
          id: review.id,
          wb_id: review.wb_id,
          rating: review.rating,
          text: review.text,
          date: new Date(review.date).toLocaleDateString('ru-RU'),
          articleId: review.article_id,
          processed: review.processed,
          response: review.response,
          canEdit: review.can_edit
        }));
        setReviews(mappedReviews);
      }
    } catch (error) {
      console.error('Ошибка при загрузке отзывов:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить отзывы",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Загрузка количества необработанных отзывов
  const loadUnansweredCount = async () => {
    try {
      const result = await getUnansweredCount();
      setUnansweredCount(result.count);
    } catch (error) {
      console.error('Ошибка при загрузке количества необработанных отзывов:', error);
    }
  };

  // Синхронизация отзывов с Wildberries
  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncReviews(100);
      loadReviews();
      loadUnansweredCount();
    } catch (error) {
      console.error('Ошибка при синхронизации:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Обработка ответа на отзыв
  const handleReply = (id: string) => {
    const review = reviews.find(r => r.id === id);
    if (review) {
      setSelectedReview(review);
      setSelectedMultipleReviews(undefined);
      setModalOpen(true);
    }
  };

  // Обработка редактирования ответа
  const handleEdit = (id: string) => {
    const review = reviews.find(r => r.id === id);
    if (review && review.canEdit) {
      setSelectedReview(review);
      setSelectedMultipleReviews(undefined);
      setModalOpen(true);
    }
  };

  // Обработка пакетных действий
  const handleBatchAction = (action: string, selectedIds: string[]) => {
    console.log(`Пакетное действие: ${action}`, selectedIds);
    
    if (action === 'generate' || action === 'template') {
      const selectedReviews = reviews.filter(r => selectedIds.includes(r.id));
      setSelectedMultipleReviews(selectedReviews);
      setSelectedReview(null);
      setModalOpen(true);
    } else if (action === 'send') {
      // Показываем модальное окно для ввода общего ответа
      const selectedReviews = reviews.filter(r => selectedIds.includes(r.id));
      setSelectedMultipleReviews(selectedReviews);
      setSelectedReview(null);
      setModalOpen(true);
    }
  };

  // Обработка отправки ответа
  const handleSubmitResponse = async (reviewId: string, response: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      
      if (review && review.wb_id) {
        // Отправляем ответ через API Wildberries
        await replyToReview(review.wb_id, response);
      }
      
      // Обновляем список отзывов
      loadReviews();
      loadUnansweredCount();
      
    } catch (error) {
      console.error('Ошибка при отправке ответа:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить ответ",
        variant: "destructive"
      });
    }
  };

  // Обработка множественной отправки ответов
  const handleSubmitMultipleResponses = async (response: string) => {
    if (selectedMultipleReviews && selectedMultipleReviews.length > 0) {
      try {
        const reviewIds = selectedMultipleReviews.map(r => r.id);
        await processBatchAction('send', reviewIds, response);
        
        // Обновляем список отзывов
        loadReviews();
        loadUnansweredCount();
        
      } catch (error) {
        console.error('Ошибка при отправке множественных ответов:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось отправить ответы",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img 
              src="https://static.thenounproject.com/png/3844724-200.png" 
              alt="Logo" 
              className="h-8 w-8 dark:invert" 
            />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Review Refinery
            </h1>
            {unansweredCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unansweredCount} новых
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync} 
              disabled={syncing}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Синхронизировать
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <Tabs 
              tabs={tabs} 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
            />
            
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow md:w-64">
                <Input
                  type="text"
                  placeholder="Поиск по артикулу"
                  value={articleFilter}
                  onChange={e => setArticleFilter(e.target.value)}
                  className="pl-8"
                />
                <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <Button 
                onClick={loadReviews} 
                size="sm" 
                variant="secondary"
              >
                Найти
              </Button>
            </div>
          </div>
          
          <h2 className="text-xl font-medium mb-6 dark:text-gray-100 transition-colors">
            {activeTab === 'unprocessed' ? 'Необработанные отзывы' : 'Обработанные отзывы'}
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ReviewTable 
              reviews={reviews}
              processed={activeTab === 'processed'}
              onReply={handleReply}
              onEdit={handleEdit}
              onBatchAction={handleBatchAction}
            />
          )}
        </div>
      </main>
      
      <ResponseModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        review={selectedReview}
        onSubmit={handleSubmitResponse}
        multipleReviews={selectedMultipleReviews}
        onSubmitMultiple={handleSubmitMultipleResponses}
      />
    </div>
  );
};

export default Index;
