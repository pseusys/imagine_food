import { FC, useEffect, useRef, useState } from "react";
import { InferenceSession } from "onnxruntime-web";

import { detect, Detection } from "./convert";
import { fileToImage, readCaloriesFromCSV, readClassesFromYAML, threeIdxToColor, drawResult, randomElem } from "./support";

import "./App.css";

const IMAGE_SIZE = 416;
const MODEL_NAME = "./model.onnx"
const DATASET_PATH = "./allergen30.yaml";
const CALORIES_PATH = "./calories.csv";


const App: FC = () => {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [imageUploaded, showImage] = useState<boolean | null>(null);
    const [detected, showLegend] = useState<Detection[] | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    let [labels, setLabels] = useState<string[] | null>(null);
    let [calories, setCalories] = useState<Map<string, string> | null>(null);
    let [session, setSession] = useState<InferenceSession | null>(null);

    useEffect((() => {
        let load = async () => {
            let readClasses = await readClassesFromYAML(DATASET_PATH);
            setLabels(_ => readClasses);
            let readCalories = await readCaloriesFromCSV(CALORIES_PATH);
            setCalories(_ => readCalories);
            let session = await InferenceSession.create(MODEL_NAME);
            setSession(_ => session);
        }
        load();
    }), []);

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!labels || !calories || !session) {
            setErrorMessage("App not ready yet!");
            return;
        } else if (!file) {
            setErrorMessage("No file selected!");
            return;
        } else if (!file.type.startsWith("image/")) {
            setErrorMessage("Invalid file type, please upload an image!");
            return;
        }

        showImage(true);
        setErrorMessage(null);

        try {
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Failed to get 2D context from canvas.");
            const image = await fileToImage(file);

            canvas.width = IMAGE_SIZE;
            canvas.height = IMAGE_SIZE;
            ctx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
            ctx.drawImage(image, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
            const data = ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);

            const detections = await detect(data, session!, labels!, calories!, [IMAGE_SIZE, IMAGE_SIZE]);
            detections.forEach((e, i) => drawResult(ctx, e, i));
            showLegend(detections);
        } catch (error) {
            setErrorMessage("Error processing the image!");
            console.error(error);
        }
    };

    const showTip = (_: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        alert(`Available classes: ${labels!.join(" ")}!`);
    }

    return (
        <div className="App">
            <h1 className="title">Imagine Food!</h1>
            <h2 className="title-help">Upload Your Image</h2>
            <div className="image-box">
                <canvas className="image" hidden={imageUploaded !== true} ref={canvasRef} />
                <div className="result-box" hidden={detected == null}>{
                    detected?.map<React.ReactNode>((e, i) =>
                        <div className="color-box" style={{color: threeIdxToColor(i)}} key={i}>
                            <p>Object found: {e.prediction}</p>
	                        <p className="color-offset">confidence: {e.confidence}</p>
	                        <p className="color-offset">calories: {e.calories}</p>
                        </div>
                    )
                }</div>
            </div>
            <label className="upload-button">
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                <p>Upload Image!</p>
            </label>
            <p className="error" hidden={errorMessage == null}>{errorMessage}</p>
            <div className="bottom-box">
                <button onClick={showTip}>Hint!</button>
                <a className="link-button" href={`https://www.flickr.com/photos/tags/${randomElem(labels ?? [])}/`} hidden={labels == null}>I need inspiration...</a>
            </div>
        </div>
    );
};

export default App;
