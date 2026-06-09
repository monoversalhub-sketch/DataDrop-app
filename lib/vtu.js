async function callCheapDataHub({ network, phone, plan_code }) {
  try {
    const response = await fetch('https://cheapdatahub.com/api/user/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${process.env.VTU_API_KEY}`,
      },
      body: JSON.stringify({
        network,
        phone,
        plan: plan_code,
        Ported_number: true,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      reference: data.reference || data.id || crypto.randomUUID(),
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

async function callVtuNg({ network, phone, plan_code }) {
  try {
    const response = await fetch('https://vtu.ng/wp-json/api/v1/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.VTU_API_KEY}`,
      },
      body: JSON.stringify({
        phone,
        network: network.toLowerCase(),
        plan_id: plan_code,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      reference: data.reference || data.id || crypto.randomUUID(),
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

async function callSubbase({ network, phone, plan_code }) {
  try {
    const response = await fetch('https://subbase.com.ng/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.VTU_FALLBACK_API_KEY,
      },
      body: JSON.stringify({
        phone_number: phone,
        network,
        data_plan: plan_code,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      reference: data.reference || data.id || crypto.randomUUID(),
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function deliverData({ network, phone, plan_code }) {
  const primaryProvider = process.env.VTU_PROVIDER || 'cheapdatahub';
  const fallbackProvider = process.env.VTU_FALLBACK_PROVIDER || 'subbase';

  // Try primary provider
  let result;

  if (primaryProvider === 'cheapdatahub') {
    result = await callCheapDataHub({ network, phone, plan_code });
  } else if (primaryProvider === 'vtu_ng') {
    result = await callVtuNg({ network, phone, plan_code });
  } else {
    result = { success: false, error: `Unknown primary provider: ${primaryProvider}` };
  }

  if (result.success) {
    return result;
  }

  // Try fallback provider
  if (fallbackProvider === 'cheapdatahub') {
    result = await callCheapDataHub({ network, phone, plan_code });
  } else if (fallbackProvider === 'vtu_ng') {
    result = await callVtuNg({ network, phone, plan_code });
  } else if (fallbackProvider === 'subbase') {
    result = await callSubbase({ network, phone, plan_code });
  } else {
    return { success: false, error: `Unknown fallback provider: ${fallbackProvider}` };
  }

  return result;
}
