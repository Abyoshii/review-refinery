
// Импортируем необходимые модули
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Настройка заголовков CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Обработчик запросов
serve(async (req) => {
  // Обработка предварительных запросов CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Получение параметров запроса
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    // Если запрос пришел в виде POST, разбираем его тело
    let requestBody = {};
    if (req.method === 'POST' || req.headers.get('content-type') === 'application/json') {
      requestBody = await req.json();
    }
    
    if (action === 'getApiKey') {
      // Получаем API ключ из переменных окружения
      const apiKey = Deno.env.get('WILDBERRIES_API_TOKEN');
      if (!apiKey) {
        throw new Error('API ключ Wildberries не настроен');
      }
      
      return new Response(
        JSON.stringify({ apiKey }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'sync') {
      // Получаем количество отзывов для синхронизации
      const take = url.searchParams.get('take') || '100';
      
      // Подключаемся к Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Получаем API ключ Wildberries
      const apiKey = Deno.env.get('WILDBERRIES_API_TOKEN');
      if (!apiKey) {
        throw new Error('API ключ Wildberries не настроен');
      }
      
      // Формируем запрос к API Wildberries
      const params = new URLSearchParams();
      params.append('take', take);
      params.append('skip', '0');
      params.append('order', 'dateDesc');
      
      const response = await fetch(`https://feedbacks-api.wildberries.ru/api/v1/feedbacks?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.errorText || 'Ошибка получения отзывов';
        const additionalErrors = errorData.additionalErrors ? JSON.stringify(errorData.additionalErrors) : '';
        throw new Error(`Ошибка API Wildberries: ${response.status} ${errorMessage} ${additionalErrors}`);
      }
      
      const { data } = await response.json();
      
      if (!data || !data.feedbacks || !Array.isArray(data.feedbacks)) {
        throw new Error('Неверный формат данных отзывов');
      }
      
      // Сохраняем отзывы в базу данных
      let savedCount = 0;
      for (const feedback of data.feedbacks) {
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
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          total: savedCount,
          message: `Синхронизировано ${savedCount} из ${data.feedbacks.length} отзывов` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'list') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Для получения отзывов используйте прямой вызов API Wildberries" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Если действие не определено
    return new Response(
      JSON.stringify({ 
        error: 'Неизвестное действие. Доступные действия: sync, getApiKey' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Ошибка в edge-функции:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
