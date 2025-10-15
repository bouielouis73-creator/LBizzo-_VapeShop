// netlify/functions/verify-id.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { front, back } = JSON.parse(event.body || "{}");

    if (!front || !back) {
      return {
        statusCode: 400,
        body: JSON.stringify({ verified: false, message: "Both front and back images are required." })
      };
    }

    // TODO: Integrate Scandit or your verification provider here.
    // - If Scandit provides a server API: send {front, back} (as base64 or after uploading to a temp bucket).
    // - Parse the response: extract 'name', 'dob', 'docNumber' fields.
    // - Return { verified: true, name, dob, idNumber } if OK.
    //
    // Example (mock success):
    const mock = {
      verified: true,
      name: "Sample Name",
      dob: "1990-01-01",
      idNumber: "ABC1234567"
    };

    return { statusCode: 200, body: JSON.stringify(mock) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ verified: false, message: "Server error" }) };
  }
};
