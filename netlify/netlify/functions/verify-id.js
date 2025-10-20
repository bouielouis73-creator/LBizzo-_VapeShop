// netlify/functions/verify-id.js
export async function handler(event) {
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, message: "verify-id is working" })
  };
}
