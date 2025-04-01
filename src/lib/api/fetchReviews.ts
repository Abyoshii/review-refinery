
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Review } from "@/lib/types";
import { WB_API_URL, WB_API_KEY } from "@/lib/constants";

// Функция для получения отзывов
export async function fetchReviews({ 
  isAnswered = "", 
  skip = 0, 
  take = 10, 
  order = "dateDesc",
  nmId = "",
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
      // Формируем параметры запроса - только если они имеют значение
      const params = new URLSearchParams();
      
      // Добавляем только определенные параметры
      if (take) params.append('take', take.toString());
      if (skip) params.append('skip', skip.toString());
      if (order) params.append('order', order);
      if (isAnswered) params.append('isAnswered', isAnswered);
      if (nmId) params.append('nmId', nmId);
      
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
