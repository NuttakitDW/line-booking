interface CreatePaymentParams {
  bookingId: string;
  amount: number; // in satang
  description: string;
}

interface BeamPaymentResponse {
  paymentUrl: string;
  paymentRef: string;
}

export async function createBeamPayment({
  bookingId,
  amount,
  description,
}: CreatePaymentParams): Promise<BeamPaymentResponse> {
  const apiKey = process.env.BEAM_API_KEY;
  const secretKey = process.env.BEAM_SECRET_KEY;

  if (!apiKey || !secretKey) {
    console.warn("Beam credentials not set, skipping payment link generation");
    return { paymentUrl: "", paymentRef: "" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000";

  const res = await fetch("https://api.beam.live/checkout/v2/charges", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "x-secret-key": secretKey,
    },
    body: JSON.stringify({
      amount: amount / 100, // Beam expects THB, not satang
      currency: "THB",
      description,
      orderId: bookingId,
      redirectUrl: `${baseUrl}/booking/success?id=${bookingId}`,
      webhookUrl: `${baseUrl}/api/webhooks/beam`,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Beam payment creation failed: ${errorText}`);
  }

  const data = await res.json();
  return {
    paymentUrl: data.paymentLink || data.paymentUrl,
    paymentRef: data.id || data.chargeId,
  };
}
