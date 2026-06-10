/**
 * Comprime e redimensiona uma imagem no lado do cliente utilizando o Canvas API do navegador.
 * Converte a imagem resultante para o formato WebP com qualidade otimizada.
 */
export function compressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    // Se o ambiente não suporta APIs do navegador para renderização, retorna o arquivo original
    if (
      typeof window === "undefined" ||
      !window.CanvasRenderingContext2D ||
      !window.FileReader ||
      !window.Blob
    ) {
      resolve(file);
      return;
    }

    // Apenas processa arquivos de imagem
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcula novas dimensões se exceder largura ou altura máxima
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Desenha a imagem redimensionada no canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Exporta o canvas como WebP comprimido
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Constrói o novo objeto File WebP
            const originalName = file.name;
            const baseName = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
            
            const newFile = new File([blob], `${baseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            resolve(newFile);
          },
          "image/webp",
          quality
        );
      };
      
      img.onerror = () => {
        resolve(file);
      };
    };

    reader.onerror = () => {
      resolve(file);
    };
  });
}
