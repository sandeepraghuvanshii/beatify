// utils/links.js
import CryptoJS from "crypto-js";

export const createDownloadLinks = (encryptedMediaUrl) => {
  if (!encryptedMediaUrl) return [];

  const qualities = [
    { id: "_12", bitrate: "12kbps" },
    { id: "_48", bitrate: "48kbps" },
    { id: "_96", bitrate: "96kbps" },
    { id: "_160", bitrate: "160kbps" },
    { id: "_320", bitrate: "320kbps" },
  ];

  const key = CryptoJS.enc.Utf8.parse("38346591");
  const iv = CryptoJS.enc.Utf8.parse("00000000");

  try {
    // Base64 decode and decrypt using DES-ECB
    const decrypted = CryptoJS.DES.decrypt(
      {
        ciphertext: CryptoJS.enc.Base64.parse(encryptedMediaUrl),
      },
      key,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
        iv,
      },
    );

    // Convert bytes to UTF-8 string
    const decryptedLink = decrypted.toString(CryptoJS.enc.Utf8);

    return qualities.map((quality) => ({
      quality: quality.bitrate,
      url: decryptedLink.replace("_96", quality.id),
    }));
  } catch (error) {
    console.error("Decryption failed:", error);
    return [];
  }
};

export const createImageLinks = (link) => {
  if (!link) return [];

  const qualities = ["50x50", "150x150", "500x500"];
  const qualityRegex = /150x150|50x50/;
  const protocolRegex = /^http:\/\//;

  return qualities.map((quality) => ({
    quality,
    url: link.replace(qualityRegex, quality).replace(protocolRegex, "https://"),
  }));
};
