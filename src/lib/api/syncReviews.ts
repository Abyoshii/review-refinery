
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { WB_API_URL, WB_API_KEY } from "@/lib/constants";

// Функция для синхронизации отзывов с Wildberries
export async function syncReviews(take = 100) {
  try {
    // Формируем параметры запроса
    const params = new URLSearchParams();
    params.append('take', take.toString());
    params.append('skip', '0');
    params.append('order', 'dateDesc');
    
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
    
    const responseData = await response.json();
    
    if (!responseData.data || !responseData.data.feedbacks || !Array.isArray(responseData.data.feedbacks)) {
      throw new Error('Неверный формат данных отзывов');
    }
    
    // Сохраняем отзывы в базу данных
    let savedCount = 0;
    for (const feedback of responseData.data.feedbacks) {
      const { error } = await supabase
        .from('reviews')
        .upsert({
          wb_id: feedback.id,
          text: feedback.text,
          rating: feedback.productValuation,
          date: feedback.createDate,
          article_id: feedback.nmId.toString(),
          is_answered: feedback.hasSupplierFeedbackAnswer,
          processed: feedback.hasSupplierFeedbackAnswer,
          can_edit: true,
          response: feedback.supplierFeedbackAnswer || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'wb_id' });
      
      if (!error) {
        savedCount++;
      }
    }
    
    toast({
      title: "Успех",
      description: `Синхронизировано ${savedCount} из ${responseData.data.feedbacks.length} отзывов`,
    });
    
    return { 
      success: true, 
      total: savedCount,
      message: `Синхронизировано ${savedCount} из ${responseData.data.feedbacks.length} отзывов` 
    };
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
