const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export function readFileAsAttachment(file) {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error('Допустимы только PDF, JPEG, PNG, WebP'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('Файл не больше 2 МБ'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: 'f' + Date.now(),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        dataUrl: reader.result,
      });
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}
