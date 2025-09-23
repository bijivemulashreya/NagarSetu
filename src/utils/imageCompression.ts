import { ImageData } from '../types';

const MAX_FILE_SIZE = 1.5 * 1024 * 1024; // 1.5MB
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 0.8;

export const compressImage = async (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = (width * MAX_HEIGHT) / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // If still too large, reduce quality further
          if (blob.size > MAX_FILE_SIZE) {
            const reducedQuality = Math.max(0.1, QUALITY * (MAX_FILE_SIZE / blob.size));
            canvas.toBlob(
              (finalBlob) => {
                if (!finalBlob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }
                
                const reader = new FileReader();
                reader.onload = () => {
                  resolve({
                    file: new File([finalBlob], file.name, { type: 'image/jpeg' }),
                    compressedDataUrl: reader.result as string,
                    size: finalBlob.size
                  });
                };
                reader.onerror = () => reject(new Error('Failed to read compressed image'));
                reader.readAsDataURL(finalBlob);
              },
              'image/jpeg',
              reducedQuality
            );
          } else {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                file: new File([blob], file.name, { type: 'image/jpeg' }),
                compressedDataUrl: reader.result as string,
                size: blob.size
              });
            };
            reader.onerror = () => reject(new Error('Failed to read compressed image'));
            reader.readAsDataURL(blob);
          }
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const validateImageFile = (file: File): string | null => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'Please select a valid image file';
  }

  // Check file size (before compression)
  if (file.size > 10 * 1024 * 1024) { // 10MB limit before compression
    return 'Image file is too large. Please select a smaller image.';
  }

  return null;
};

export const getImageSizeText = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

