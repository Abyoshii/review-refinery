
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Устанавливаем CORS заголовки
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Базовый URL API Wildberries
const WB_API_URL = "https://feedbacks-api.wildberries.ru/api/v1";

serve(async (req) => {
  // Обрабатываем CORS preflight запросы
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Получаем данные запроса
    const body = await req.json();
    const { feedbackId, text } = body;
    
    if (!feedbackId || !text) {
      return new Response(
        JSON.stringify({ error: 'Не указан ID отзыва или текст ответа' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Создаем клиент Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Получаем токен API Wildberries из хранилища секретов
    const WB_API_TOKEN = Deno.env.get('WILDBERRIES_API_TOKEN') || '';
    
    if (!WB_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Wildberries API токен не найден' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Отправляем ответ на отзыв в API Wildberries
    const response = await fetch(`${WB_API_URL}/feedbacks/${feedbackId}/reply`, {
      method: 'POST',
      headers: {
        'Authorization': WB_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка при отправке ответа в API Wildberries:', errorText);
      return new Response(
        JSON.stringify({ error: `Ошибка API Wildberries: ${response.status} ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Обновляем отзыв в нашей базе данных
    const { data: reviewData } = await supabase
      .from('reviews')
      .select('*')
      .eq('wb_id', feedbackId)
      .maybeSingle();
      
    if (reviewData) {
      await supabase
        .from('reviews')
        .update({
          processed: true,
          response: text,
          is_answered: true,
          updated_at: new Date().toISOString()
        })
        .eq('wb_id', feedbackId);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Ответ на отзыв успешно отправлен', 
        data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ошибка в функции wb-reply:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
