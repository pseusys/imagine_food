import React, { useRef, useState } from "react";
import { InferenceSession, Tensor } from "onnxruntime-web";
import "./App.css";
import { parseOutputs } from "./support";

const IMAGE_SIZE = 416;
const MODEL_NAME = "github.com/repos/pseusys/imagine_food/releases/assets/209127356"
const LABELS = [];

const App: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageUploaded, showImage] = useState<boolean | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    showImage(false);
    const file = event.target.files?.[0];
    if (!file) {
      setErrorMessage("No file selected.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Invalid file type. Please upload an image.");
      return;
    }

    setErrorMessage(null);

    try {
      const image = await fileToImage(file);
      const inputTensorData = await preprocessImage(image);
      await runOnnxModel(inputTensorData);
    } catch (error) {
      setErrorMessage("Error processing the image.");
      console.error(error);
    }
  };

  const fileToImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const preprocessImage = async (image: HTMLImageElement) => {
    const canvas = canvasRef.current!;
    canvas.width = IMAGE_SIZE;
    canvas.height = IMAGE_SIZE;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context from canvas.");
    ctx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    ctx.drawImage(image, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
    showImage(true);

    const imageData = ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    const { data, width, height } = imageData;

    const float32Data = new Float32Array(1 * 3 * width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4] / 255;
      const g = data[i * 4 + 1] / 255;
      const b = data[i * 4 + 2] / 255;

      float32Data[i] = r;
      float32Data[i + width * height] = g;
      float32Data[i + 2 * width * height] = b;
    }

    return float32Data;
  };

  const runOnnxModel = async (inputTensorData: Float32Array) => {
    const session = await InferenceSession.create(MODEL_NAME);

    const inputTensor = new Tensor("float32", inputTensorData, [1, 3, IMAGE_SIZE, IMAGE_SIZE]);
    const feeds: Record<string, Tensor> = { [session.inputNames[0]]: inputTensor };

    const results = await session.run(feeds);
    const outputs = parseOutputs(results[session.outputNames[0]]);
    console.log("Model Output:", outputs);
  };

  return (
    <div className="App">
      <h1 className="title">Imagine Food!</h1>
      <h2 className="title-help">Upload Your Image</h2>
      <canvas ref={canvasRef} style={{ marginTop: "20px", marginBottom: "20px", display: imageUploaded ? "flex" : "none" }} />
      <label className="upload-button">
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
        <p>Upload Image!</p>
      </label>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
    </div>
  );
};

export default App;
