
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Review } from "@/lib/types";

// Базовый URL для Supabase Edge Functions
const EDGE_FUNCTION_URL = `https://hmrisiqgrxyvijsvpwrw.supabase.co/functions/v1`;

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
      // Используем API Wildberries через Edge Function
      let url = `${EDGE_FUNCTION_URL}/wb-reviews?action=list&take=${take}&skip=${skip}&order=${order}`;
      
      if (isAnswered) {
        url += `&isAnswered=${isAnswered}`;
      }
      
      if (nmId) {
        url += `&nmId=${nmId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка получения отзывов');
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

// Функция для синхронизации отзывов с Wildberries
export async function syncReviews(take = 100) {
  try {
    const url = `${EDGE_FUNCTION_URL}/wb-reviews?action=sync&take=${take}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка синхронизации отзывов');
    }

    const result = await response.json();
    
    toast({
      title: "Успех",
      description: result.message || `Синхронизировано ${result.total} отзывов`,
    });
    
    return result;
  } catch (error) {
    console.error('Ошибка при синхронизации отзывов:', error);
    toast({
      title: "Ошибка синхронизации",
      description: error.message,
      variant: "destructive"
    });
    return { success: false, error: error.message };
  }
}

// Функция для получения количества необработанных отзывов
export async function getUnansweredCount() {
  try {
    // Используем локальную базу данных Supabase
    const { count, error } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('is_answered', false);

    if (error) {
      throw error;
    }

    return { count: count || 0 };
  } catch (error) {
    console.error('Ошибка при получении количества необработанных отзывов:', error);
    return { count: 0 };
  }
}

// Функция для ответа на отзыв
export async function replyToReview(feedbackId: string, text: string) {
  try {
    // Отправляем ответ через Edge Function
    const response = await fetch(`${EDGE_FUNCTION_URL}/wb-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feedbackId, text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка при отправке ответа');
    }

    const result = await response.json();
    
    toast({
      title: "Успех",
      description: "Ответ успешно отправлен",
    });
    
    // После успешной отправки обновляем статус отзыва в базе данных
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ 
        is_answered: true, 
        processed: true,
        response: text,
        updated_at: new Date().toISOString() 
      })
      .eq('wb_id', feedbackId);

    if (updateError) {
      console.error('Ошибка при обновлении статуса отзыва:', updateError);
    }
    
    return result;
  } catch (error) {
    console.error('Ошибка при ответе на отзыв:', error);
    toast({
      title: "Ошибка",
      description: error.message,
      variant: "destructive"
    });
    return { success: false, error: error.message };
  }
}

// Функция для обновления статуса отзыва в локальной базе данных
export async function updateReviewStatus(reviewId: string, processed: boolean, response?: string) {
  try {
    const updateData: Record<string, any> = { 
      processed, 
      updated_at: new Date().toISOString() 
    };
    
    if (response !== undefined) {
      updateData.response = response;
    }
    
    const { error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Ошибка при обновлении статуса отзыва:', error);
    toast({
      title: "Ошибка",
      description: error.message,
      variant: "destructive"
    });
    return { success: false, error: error.message };
  }
}

// Функция для обработки пакетных действий с отзывами
export async function processBatchAction(action: string, reviewIds: string[], response?: string) {
  try {
    if (action === 'send' && response) {
      // Получаем отзывы, которые нужно обработать
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .in('id', reviewIds);

      if (error) {
        throw error;
      }

      // Отправляем ответы на каждый отзыв
      const promises = data
        .filter(review => review.wb_id) // Убедимся, что wb_id существует
        .map(review => replyToReview(review.wb_id, response));

      await Promise.all(promises);
      
      toast({
        title: "Успех",
        description: `Ответы отправлены для ${reviewIds.length} отзывов`,
      });
      
      return { success: true };
    }

    return { success: false, error: 'Неподдерживаемое действие' };
  } catch (error) {
    console.error('Ошибка при выполнении пакетного действия:', error);
    toast({
      title: "Ошибка",
      description: error.message,
      variant: "destructive"
    });
    return { success: false, error: error.message };
  }
}
