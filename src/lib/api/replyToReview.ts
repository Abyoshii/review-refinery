
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { WB_API_URL, WB_API_KEY } from "@/lib/constants";

// Функция для ответа на отзыв
export async function replyToReview(feedbackId: string, text: string) {
  try {
    // Прямой запрос к API Wildberries
    const response = await fetch(`${WB_API_URL}/feedbacks/${feedbackId}/reply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WB_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errorText || 'Ошибка при отправке ответа');
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
