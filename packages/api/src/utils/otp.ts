export const generateOtp = (limit = 6) => {
  const digits = "0123456789";
  let OTP = "";

  for (let i = 0; i < limit; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }

  return OTP;
};

export interface SmsOptions {
  to: string;
  text: string;
}

export const sendSMS = async ({ to, text }: SmsOptions) => {
  try {
    const response = await fetch("https://rest.nexmo.com/sms/json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Lasagne",
        to,
        text,
        api_key: process.env.VONAGE_API_KEY!,
        api_secret: process.env.VONAGE_API_SECRET!,
      }),
    });

    return response.json();
  } catch (error) {
    console.log(error);
  }
};
