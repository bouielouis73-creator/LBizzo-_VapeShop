import fetch from "node-fetch";

export async function handler(event) {
  try {
    const key = process.env.SCANDIT_LICENSE_KEY;
    const image = event.body; // raw image data from browser

    const r = await fetch("https://api.scandit.com/id/v2/verify", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/octet-stream"
      },
      body: image
    });

    const data = await r.json();
    const birthYear = data.result?.document?.dateOfBirth?.year;
    const verified = birthYear && birthYear < 2004;

    return {
      statusCode: 200,
      body: JSON.stringify({ verified })
    };
  } catch (err) {
    console.error("Scandit verify error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ verified: false })
    };
  }
}
