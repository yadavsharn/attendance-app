import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create app-admin client to bypass RLS since we have no user session in kiosk mode
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // No auth check required for public kiosk mode
    // We trust that if the request has a valid face image, we process it

    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ success: false, message: 'No image provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const azureUrl = Deno.env.get('AZURE_FACE_API_URL') || 'http://20.244.80.165:8000';

    // Call Azure face recognition
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const azureResponse = await fetch(`${azureUrl}/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data }),
      signal: AbortSignal.timeout(30000),
    });

    const faceResult = await azureResponse.json();
    console.log('Azure response:', faceResult);

    // Get confidence threshold from settings
    const { data: settings } = await supabase
      .from('attendance_settings')
      .select('setting_value')
      .eq('setting_key', 'confidence_threshold')
      .single();

    const threshold = parseFloat(settings?.setting_value || '0.6');

    if (!faceResult.name || faceResult.confidence < threshold) {
      // Log failed attempt
      await supabase.from('attendance_logs').insert({
        action: 'recognition_failed',
        azure_response: faceResult,
        confidence_score: faceResult.confidence || 0,
        success: false,
        error_message: 'Face not recognized or low confidence',
      });

      return new Response(JSON.stringify({
        success: false,
        message: `Face not recognized. Confidence: ${((faceResult.confidence || 0) * 100).toFixed(0)}%`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find employee by azure_face_name
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('azure_face_name', faceResult.name)
      .eq('status', 'active')
      .single();

    if (!employee) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Employee not found or inactive',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already marked today
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today)
      .single();

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Attendance already marked for today',
        attendance: existing,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine if late
    const { data: workStartSetting } = await supabase
      .from('attendance_settings')
      .select('setting_value')
      .eq('setting_key', 'work_start_time')
      .single();

    const { data: lateThresholdSetting } = await supabase
      .from('attendance_settings')
      .select('setting_value')
      .eq('setting_key', 'late_threshold_minutes')
      .single();

    const workStartTime = workStartSetting?.setting_value || '09:00';
    const lateThreshold = parseInt(lateThresholdSetting?.setting_value || '15');

    const now = new Date();
    const [hours, minutes] = workStartTime.split(':').map(Number);
    const workStart = new Date(now);
    workStart.setHours(hours, minutes + lateThreshold, 0, 0);

    const status = now > workStart ? 'late' : 'present';

    // Mark attendance
    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .insert({
        employee_id: employee.id,
        date: today,
        check_in_time: now.toISOString(),
        status,
        confidence_score: faceResult.confidence,
        source: 'face_recognition',
      })
      .select()
      .single();

    if (attError) throw attError;

    // Log success
    await supabase.from('attendance_logs').insert({
      employee_id: employee.id,
      action: 'check_in',
      azure_response: faceResult,
      confidence_score: faceResult.confidence,
      success: true,
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Welcome, ${employee.full_name}!`,
      employeeName: employee.full_name,
      attendance,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Attendance error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'An error occurred',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
