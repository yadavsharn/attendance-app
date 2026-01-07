import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const azureUrl = Deno.env.get('AZURE_FACE_API_URL') || 'http://20.244.80.165:8000';
    
    const response = await fetch(`${azureUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return new Response(JSON.stringify({ status: 'healthy' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ status: 'unhealthy' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(JSON.stringify({ status: 'offline', error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
