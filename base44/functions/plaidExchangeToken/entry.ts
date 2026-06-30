import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { public_token } = await req.json();
    if (!public_token) return Response.json({ error: 'Missing public_token' }, { status: 400 });

    const clientId = Deno.env.get('PLAID_CLIENT_ID');
    const secret = Deno.env.get('PLAID_SECRET');

    const response = await fetch('https://sandbox.plaid.com/item/public_token/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, secret, public_token }),
    });

    const data = await response.json();
    if (!response.ok) return Response.json({ error: data.error_message || 'Plaid error' }, { status: 400 });

    // Store access token on the user's profile
    await base44.auth.updateMe({ plaid_access_token: data.access_token });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});