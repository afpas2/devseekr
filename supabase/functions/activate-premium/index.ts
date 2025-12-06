import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente com token do utilizador para verificar identidade
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Obter utilizador autenticado
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      console.log('User authentication failed:', userError?.message)
      return new Response(
        JSON.stringify({ error: 'Sessão inválida. Por favor faz login novamente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing premium activation for user: ${user.id}`)

    // Obter body do request
    const body = await req.json().catch(() => ({}))
    const { payment_token } = body

    // Validar payment_token (timestamp enviado pelo frontend)
    if (!payment_token) {
      console.log('Missing payment token')
      return new Response(
        JSON.stringify({ error: 'Token de pagamento inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se o token é recente (máximo 30 minutos)
    const tokenTime = parseInt(payment_token)
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000)
    
    if (isNaN(tokenTime) || tokenTime < thirtyMinutesAgo) {
      console.log('Payment token expired or invalid:', payment_token)
      return new Response(
        JSON.stringify({ error: 'Sessão de pagamento expirada. Por favor tenta novamente.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Usar service role para modificar subscription (bypass RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar se já tem subscription ativa
    const { data: existingSub } = await adminClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingSub?.plan === 'premium' && existingSub?.status === 'active') {
      const expiresAt = new Date(existingSub.expires_at)
      if (expiresAt > new Date()) {
        console.log('User already has active premium subscription')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Já tens Premium ativo!',
            expires_at: existingSub.expires_at 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Calcular data de expiração (1 mês)
    const expiresAtDate = new Date()
    expiresAtDate.setMonth(expiresAtDate.getMonth() + 1)

    // Ativar premium subscription
    const { data: subscription, error: subError } = await adminClient
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        plan: 'premium',
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAtDate.toISOString(),
        payment_method: 'paypal_breezi',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (subError) {
      console.error('Error activating premium:', subError)
      return new Response(
        JSON.stringify({ error: 'Erro ao ativar Premium. Por favor contacta o suporte.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Premium activated successfully for user ${user.id}, expires: ${expiresAtDate.toISOString()}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Premium ativado com sucesso!',
        expires_at: expiresAtDate.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno. Por favor tenta novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
