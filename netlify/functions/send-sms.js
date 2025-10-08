const twilio = require("twilio");

exports.handler = async function (event, context) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const message = await client.messages.create({
      body: "LBizzo: Your order has been confirmed and will be delivered soon.",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: "+1CUSTOMER_NUMBER"
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, sid: message.sid })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
