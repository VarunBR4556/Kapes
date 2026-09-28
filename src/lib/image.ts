export const MAX_PROFILE_PHOTO_BYTES = 8_000_000;

export const PROFILE_PHOTO_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export const resizeImageToDataUrl = (file: File, size = 256): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas"));
          return;
        }
        const scale = Math.max(size / img.width, size / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        ctx.drawImage(img, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });