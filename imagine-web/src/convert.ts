import { InferenceSession, Tensor } from "onnxruntime-web";


export interface Detection {
    prediction: string;
    calories: string;
    confidence: number;
    box: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
};


function prepareImageData(raw: ImageData): Float32Array {
    const { data, width, height } = raw;
    const float32Data = new Float32Array(1 * 3 * width * height);

    for (let i = 0; i < width * height; i++) {
        float32Data[i] = data[i * 4] / 255;
        float32Data[i + width * height] = data[i * 4 + 1] / 255;
        float32Data[i + 2 * width * height] = data[i * 4 + 2] / 255;
    }

    return float32Data;
}


function calculateMaxAxis2(tensor: Tensor): Tensor {
    const tensorData = tensor.data as Float32Array;
    const shape = tensor.dims;

    const maxConfidences = tensorData.slice(0, shape[2]);
    for (let index = shape[2]; index < tensorData.length; index++) {
        const idx = index % shape[2];
        if (tensorData[index] > maxConfidences[idx])
            maxConfidences[idx] = tensorData[index];
    }

    return new Tensor("float32", new Float32Array(maxConfidences), [1, 1, shape[2]]);
}

function filterTensorAxis2(tensor: Tensor, filter: (idx: number) => boolean): Tensor {
    const tensorData = tensor.data as Float32Array;
    const shape = tensor.dims;

    const filteredData = [];
    for (let index = 0; index < tensorData.length; index++)
        if (filter(index % shape[2]))
            filteredData.push(tensorData[index]);

    return new Tensor("float32", new Float32Array(filteredData), [1, shape[1], Math.floor(filteredData.length / shape[1])]);
}

function parseOutputs(detection: Tensor, confThreshold: number = 0.5): [Tensor, Tensor] {
    const detectionData = detection.data as Float32Array;

    const detectionShape = detection.dims;
    const numBoxes = 4;
    const numClasses = detectionShape[1] - numBoxes;

    const boxes = new Tensor("float32", new Float32Array(detectionData.slice(0, numBoxes * detectionShape[2])), [1, numBoxes, detectionShape[2]]);
    const confs = new Tensor("float32", new Float32Array(detectionData.slice(numBoxes * detectionShape[2])), [1, numClasses, detectionShape[2]]);
    const maxConfs = calculateMaxAxis2(confs).data as Float32Array;

    const filteredBoxes = filterTensorAxis2(boxes, idx => maxConfs[idx] > confThreshold);
    const filteredConfs = filterTensorAxis2(confs, idx => maxConfs[idx] > confThreshold);
    return [filteredConfs, filteredBoxes];
}

function calculateMaxIndAxis2(tensor: Tensor): Tensor {
    const tensorData = tensor.data as Float32Array;
    const shape = tensor.dims;

    const maxArgs = Array(shape[2]).fill(0);
    const maxConfidences = tensorData.slice(0, shape[2]);
    for (let index = shape[2]; index < tensorData.length; index++) {
        const idx = index % shape[2];
        if (tensorData[index] > maxConfidences[idx]) {
            maxConfidences[idx] = tensorData[index];
            maxArgs[idx] = Math.floor(index / shape[2]);
        }
    }

    return new Tensor("int32", new Int32Array(maxArgs), [1, 1, shape[2]]);
}

export async function detect(image: ImageData, session: InferenceSession, labels: string[], calories: Map<string, string>, size: [number, number], top: number = 3): Promise<Detection[]> {
    const rawData = prepareImageData(image);
    const [width, height] = size;

    const inputTensor = new Tensor("float32", rawData, [1, 3, width, height]);
    const feeds: Record<string, Tensor> = { [session.inputNames[0]]: inputTensor };

    const results = await session.run(feeds);
    const [confs, boxes] = parseOutputs(results[session.outputNames[0]]);
    
    const objects = confs.dims[2];
    const argmaxes = calculateMaxIndAxis2(confs).data as Int32Array;
    const detections = Array(objects);

    for (let index = 0; index < objects; index++) {
        const amx = argmaxes[index];
        const label = labels[amx];
        const x1 = boxes.data.at(index) as number;
        const y1 = boxes.data.at(index + objects) as number;
        const x2 = boxes.data.at(index + objects * 2) as number;
        const y2 = boxes.data.at(index + objects * 3) as number;
        detections[index] = {
            prediction: label,
            calories: calories.get(label) ?? "unknown :(",
            confidence: confs.data.at(amx * objects + index),
            box: { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
        };
    }

    return detections.sort((p1, p2) => p2 - p1).slice(0, top);
}
