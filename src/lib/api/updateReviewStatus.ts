
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
