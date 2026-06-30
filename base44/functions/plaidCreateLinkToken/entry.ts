import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = Deno.env.get('PLAID_CLIENT_ID');
    const secret = Deno.env.get('PLAID_SECRET');

    const response = await fetch('https://sandbox.plaid.com/link/token/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        client_name: 'المساعد المالي الذكي',
        country_codes: ['US'],
        language: 'en',
        user: { client_user_id: user.id },
        products: ['transactions'],
      }),
    });

    const data = await response.json();
    if (!response.ok) return Response.json({ error: data.error_message || 'Plaid error' }, { status: 400 });

    return Response.json({ link_token: data.link_token });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});