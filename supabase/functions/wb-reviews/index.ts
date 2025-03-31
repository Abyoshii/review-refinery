
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
    // Получаем параметры запроса
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';
    
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

    // Определяем действия в зависимости от параметра action
    switch (action) {
      case 'list':
        return await getFeedbacks(req, WB_API_TOKEN, supabase);
      case 'count-unanswered':
        return await getUnansweredCount(req, WB_API_TOKEN);
      case 'sync':
        return await syncFeedbacks(req, WB_API_TOKEN, supabase);
      default:
        return new Response(
          JSON.stringify({ error: 'Неизвестное действие' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Ошибка в функции wb-reviews:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Функция для получения отзывов с API Wildberries
async function getFeedbacks(req: Request, token: string, supabase: any) {
  const url = new URL(req.url);
  const isAnswered = url.searchParams.get('isAnswered') || '';
  const take = url.searchParams.get('take') || '10';
  const skip = url.searchParams.get('skip') || '0';
  const order = url.searchParams.get('order') || 'dateDesc';
  const nmId = url.searchParams.get('nmId') || '';

  // Формируем URL для запроса к API Wildberries
  let apiUrl = `${WB_API_URL}/feedbacks?take=${take}&skip=${skip}&order=${order}`;
  if (isAnswered) apiUrl += `&isAnswered=${isAnswered}`;
  if (nmId) apiUrl += `&nmId=${nmId}`;

  console.log(`Запрос к API Wildberries: ${apiUrl}`);

  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Ошибка в запросе к API Wildberries:', errorText);
    return new Response(
      JSON.stringify({ error: `Ошибка API Wildberries: ${response.status} ${errorText}` }),
      { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const data = await response.json();
  
  // Сохраняем полученные отзывы в базу данных
  if (data && data.data && Array.isArray(data.data.feedbacks)) {
    for (const feedback of data.data.feedbacks) {
      // Проверяем, существует ли уже отзыв с таким ID
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('wb_id', feedback.id)
        .maybeSingle();
      
      // Преобразуем данные из API Wildberries в формат нашей БД
      const reviewData = {
        wb_id: feedback.id,
        rating: parseInt(feedback.productValuation),
        text: feedback.text,
        date: new Date(feedback.createdDate).toISOString(),
        article_id: feedback.nmId.toString(),
        processed: feedback.state === "none" ? false : true,
        response: feedback.answer?.text || null,
        is_answered: !!feedback.answer,
        can_edit: feedback.state !== "declined",
      };
      
      if (existingReview) {
        // Если отзыв уже существует, обновляем его
        await supabase
          .from('reviews')
          .update(reviewData)
          .eq('wb_id', feedback.id);
      } else {
        // Если отзыва нет, создаем новый
        await supabase
          .from('reviews')
          .insert(reviewData);
      }
    }
  }
  
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Функция для получения количества необработанных отзывов
async function getUnansweredCount(req: Request, token: string) {
  const response = await fetch(`${WB_API_URL}/feedbacks/count-unanswered`, {
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(
      JSON.stringify({ error: `Ошибка API Wildberries: ${response.status} ${errorText}` }),
      { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const data = await response.json();
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Функция для синхронизации всех отзывов с Wildberries
async function syncFeedbacks(req: Request, token: string, supabase: any) {
  try {
    // Получаем все отзывы с API Wildberries (можно ограничить по параметрам)
    const url = new URL(req.url);
    const take = url.searchParams.get('take') || '100'; // Получаем больше отзывов за раз для синхронизации
    
    const apiUrl = `${WB_API_URL}/feedbacks?take=${take}&skip=0&order=dateDesc`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Ошибка API Wildberries: ${response.status} ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Счетчик для обработанных отзывов
    let processedCount = 0;
    
    // Сохраняем полученные отзывы в базу данных
    if (data && data.data && Array.isArray(data.data.feedbacks)) {
      for (const feedback of data.data.feedbacks) {
        // Проверяем, существует ли уже отзыв с таким ID
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('wb_id', feedback.id)
          .maybeSingle();
        
        // Преобразуем данные из API Wildberries в формат нашей БД
        const reviewData = {
          wb_id: feedback.id,
          rating: parseInt(feedback.productValuation),
          text: feedback.text,
          date: new Date(feedback.createdDate).toISOString(),
          article_id: feedback.nmId.toString(),
          processed: feedback.state === "none" ? false : true,
          response: feedback.answer?.text || null,
          is_answered: !!feedback.answer,
          can_edit: feedback.state !== "declined",
        };
        
        if (existingReview) {
          // Если отзыв уже существует, обновляем его
          await supabase
            .from('reviews')
            .update(reviewData)
            .eq('wb_id', feedback.id);
        } else {
          // Если отзыва нет, создаем новый
          await supabase
            .from('reviews')
            .insert(reviewData);
        }
        
        processedCount++;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Синхронизировано ${processedCount} отзывов`, 
        total: processedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ошибка при синхронизации отзывов:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
