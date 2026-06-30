import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CATEGORY_MAP = {
  'Food and Drink': 'طعام',
  'Shops': 'تسوق',
  'Recreation': 'ترفيه',
  'Travel': 'مواصلات',
  'Transfer': 'تحويل',
  'Payment': 'فواتير',
  'Healthcare': 'تأمين',
  'Service': 'فواتير',
  'Bank Fees': 'فواتير',
  'Interest': 'دخل',
  'Deposit': 'راتب',
  'Payroll': 'راتب',
};

function mapCategory(categories) {
  if (!categories || categories.length === 0) return 'أخرى';
  for (const cat of categories) {
    if (CATEGORY_MAP[cat]) return CATEGORY_MAP[cat];
  }
  return 'أخرى';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = user.plaid_access_token;
    if (!accessToken) return Response.json({ error: 'No bank account connected' }, { status: 400 });

    const clientId = Deno.env.get('PLAID_CLIENT_ID');
    const secret = Deno.env.get('PLAID_SECRET');

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];

    const response = await fetch('https://sandbox.plaid.com/transactions/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: { count: 500, offset: 0 },
      }),
    });

    const data = await response.json();
    if (!response.ok) return Response.json({ error: data.error_message || 'Plaid error' }, { status: 400 });

    const transactions = (data.transactions || []).map((tx) => ({
      date: tx.date,
      merchant_name: tx.merchant_name || tx.name || 'غير معروف',
      amount: Math.abs(tx.amount),
      currency: (tx.iso_currency_code || 'USD'),
      category: mapCategory(tx.category),
      type: tx.amount > 0 ? 'expense' : 'income',
    }));

    if (transactions.length > 0) {
      await base44.entities.Transaction.bulkCreate(transactions);
    }

    return Response.json({ imported: transactions.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});