
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { replyToReview } from "./replyToReview";

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
