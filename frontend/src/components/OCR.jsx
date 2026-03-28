import Tesseract from "tesseract.js";

const preprocessImage = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      // GRAYSCALE
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i+1] + data[i+2]) / 3;
        data[i] = data[i+1] = data[i+2] = avg;
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(resolve);
    };

    img.src = URL.createObjectURL(file);
  });
};

export default function OCR() {
  const handle = async (file) => {
    const processed = await preprocessImage(file);

    const result = await Tesseract.recognize(processed, "eng");

    console.log(result.data.text);
  };

  return <input type="file" onChange={e => handle(e.target.files[0])} />;
}