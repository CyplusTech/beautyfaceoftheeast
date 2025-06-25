const AdminSettings = require("../model/admin/adminsettings");

const getPaystackKeys = async () => {
  const settings = await AdminSettings.findOne();

  const secretKey = settings?.enableTestMode
    ? settings?.paystackTestSecretKey
    : settings?.paystackLiveSecretKey;

  const publicKey = settings?.enableTestMode
    ? settings?.paystackTestPublicKey
    : settings?.paystackLivePublicKey;

  if (!secretKey || !secretKey.startsWith("sk_")) {
    throw new Error("❌ Paystack secret key is missing or invalid.");
  }

  return { publicKey, secretKey };
};

module.exports = getPaystackKeys;
