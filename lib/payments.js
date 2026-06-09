import crypto from 'crypto';

export async function createVirtualAccount({ amount, reference, expires_minutes }) {
  const gateway = process.env.PAYMENT_GATEWAY || 'monnify';

  if (gateway === 'monnify') {
    return createMonnifyVirtualAccount({ amount, reference, expires_minutes });
  } else if (gateway === 'flutterwave') {
    return createFlutterwaveVirtualAccount({ amount, reference, expires_minutes });
  }

  throw new Error(`Unknown payment gateway: ${gateway}`);
}

async function createMonnifyVirtualAccount({ amount, reference, expires_minutes }) {
  try {
    const apiKey = process.env.MONNIFY_API_KEY;
    const secretKey = process.env.MONNIFY_SECRET_KEY;
    const contractCode = process.env.MONNIFY_CONTRACT_CODE;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const auth = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

    const response = await fetch('https://sandbox.monnify.com/api/v1/merchant/transactions/init-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount,
        customerName: 'DataDrop Customer',
        customerEmail: 'customer@datadrop.ng',
        paymentReference: reference,
        paymentDescription: 'Data Purchase',
        currencyCode: 'NGN',
        contractCode,
        redirectUrl: `${appUrl}/checkout`,
        paymentMethods: ['ACCOUNT_TRANSFER'],
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.responseMessage || `HTTP ${response.status}`);
    }

    const data = await response.json();

    // Extract account details from Monnify response
    const accountNumber = data.responseBody?.accountNumber || 'N/A';
    const bankName = data.responseBody?.bankName || 'Monnify Bank';

    return {
      virtual_account_num: accountNumber,
      virtual_bank_name: bankName,
      gateway_reference: data.responseBody?.transactionReference || reference,
    };
  } catch (err) {
    console.error('[Monnify] Error:', err.message);
    throw err;
  }
}

async function createFlutterwaveVirtualAccount({ amount, reference, expires_minutes }) {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    const response = await fetch('https://api.flutterwave.com/v3/virtual-account-numbers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        email: 'customer@datadrop.ng',
        is_permanent: false,
        bvn: '00000000000',
        tx_ref: reference,
        amount,
        narration: 'DataDrop Data Purchase',
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      virtual_account_num: data.data?.account_number || 'N/A',
      virtual_bank_name: data.data?.bank_name || 'Flutterwave Bank',
      gateway_reference: data.data?.id || reference,
    };
  } catch (err) {
    console.error('[Flutterwave] Error:', err.message);
    throw err;
  }
}

export function verifyWebhookSignature(rawBody, receivedSignature, provider) {
  try {
    let computed;

    if (provider === 'monnify') {
      computed = crypto
        .createHmac('sha512', process.env.MONNIFY_SECRET_KEY)
        .update(rawBody)
        .digest('hex');
    } else if (provider === 'flutterwave') {
      computed = crypto
        .createHmac('sha256', process.env.FLUTTERWAVE_HASH)
        .update(rawBody)
        .digest('hex');
    } else {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  } catch (err) {
    console.error('[Webhook Signature] Error:', err.message);
    return false;
  }
}
