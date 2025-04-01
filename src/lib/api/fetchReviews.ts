
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Review } from "@/lib/types";
import { WB_API_URL, WB_API_KEY } from "@/lib/constants";

// Функция для получения отзывов
export async function fetchReviews({ 
  isAnswered = "false", 
  skip = 0, 
  take = 10, 
  order = "dateDesc",
  nmId = "",
  dateFrom = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000), // 30 дней назад по умолчанию
  dateTo = Math.floor(Date.now() / 1000), // текущее время по умолчанию
  useLocal = true 
} = {}) {
  try {
    if (useLocal) {
      // Используем локальную базу данных Supabase
      let query = supabase
        .from('reviews')
        .select('*');

      // Применяем сортировку
      if (order === 'dateDesc') {
        query = query.order('date', { ascending: false });
      } else {
        query = query.order('date', { ascending: true });
      }

      // Применяем фильтр по обработке
      if (isAnswered === 'true') {
        query = query.eq('is_answered', true);
      } else if (isAnswered === 'false') {
        query = query.eq('is_answered', false);
      }

      // Применяем фильтр по артикулу
      if (nmId) {
        query = query.eq('article_id', nmId);
      }

      // Применяем фильтр по датам если задан
      const fromDate = new Date(dateFrom * 1000).toISOString();
      const toDate = new Date(dateTo * 1000).toISOString();
      query = query.gte('date', fromDate).lte('date', toDate);

      // Применяем пагинацию
      query = query.range(skip, skip + take - 1);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Преобразуем data в массив Reviews
      const reviews = data?.map(item => ({
        id: item.id,
        wb_id: item.wb_id,
        rating: item.rating,
        text: item.text,
        date: item.date,
        articleId: item.article_id,
        processed: item.processed || false,
        response: item.response,
        canEdit: item.can_edit || true
      })) || [];

      return { data: { feedbacks: reviews } };
    } else {
      // Формируем параметры запроса - все обязательные параметры
      const params = new URLSearchParams();
      
      // Добавляем обязательные параметры
      params.append('isAnswered', isAnswered);
      params.append('take', take.toString());
      params.append('skip', skip.toString());
      
      // Добавляем остальные параметры
      if (order) params.append('order', order);
      if (nmId) params.append('nmId', nmId);
      
      // Добавляем параметры дат (обязательные)
      params.append('dateFrom', dateFrom.toString());
      params.append('dateTo', dateTo.toString());
      
      // Прямой запрос к API Wildberries
      const response = await fetch(`${WB_API_URL}/feedbacks?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WB_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.errorText || 'Ошибка получения отзывов';
        const additionalErrors = errorData.additionalErrors ? JSON.stringify(errorData.additionalErrors) : '';
        throw new Error(`Ошибка API Wildberries: ${response.status} ${errorMessage} ${additionalErrors}`);
      }

      return await response.json();
    }
  } catch (error) {
    console.error('Ошибка при получении отзывов:', error);
    toast({
      title: "Ошибка",
      description: error.message,
      variant: "destructive"
    });
    return { data: { feedbacks: [] } };
  }
}
