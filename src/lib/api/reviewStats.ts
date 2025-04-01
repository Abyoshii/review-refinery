
import { supabase } from "@/integrations/supabase/client";

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
