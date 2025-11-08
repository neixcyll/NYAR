export async function getSnapToken(
  amount: number,
  name: string,
  email: string
): Promise<{ token?: string; snap_token?: string }> {
  const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY as string;

  const response = await fetch(
    "https://app.sandbox.midtrans.com/snap/v1/transactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(clientKey + ":"),
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: "order-" + Date.now(),
          gross_amount: amount,
        },
        customer_details: {
          first_name: name,
          email: email,
        },
      }),
    }
  );

  const data = await response.json();
  return data;
}
