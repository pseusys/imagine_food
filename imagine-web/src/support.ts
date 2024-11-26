import { Tensor } from "onnxruntime-web";

// Method to parse YOLO output
export function parseOutputs(detection: Tensor, confThreshold: number = 0.5): [Tensor, Tensor] {
    // Extract the raw data from the detection tensor
    const detectionData = detection.data as Float32Array;

    // Reshape the tensor (manually flattening it for processing)
    const detectionShape = detection.dims;
    const numBoxes = detectionShape[1]; // Assuming 34 dimensions and we split into 4 + 30 (for class confidence)
    const numClasses = numBoxes - 4;

    // Manually extract the class confidences (from column 5 onwards)
    const classConfidences: number[] = [];
    const boxes: number[] = [];

    // Assuming detection is a flattened array, we process the data
    for (let i = 0; i < detectionData.length; i += numBoxes) {
        // Slice the first 4 elements (bounding box)
        boxes.push(...detectionData.slice(i, i + 4));
        // Slice the rest as class confidences
        classConfidences.push(...detectionData.slice(i + 4, i + numBoxes));
    }

    // Create a tensor from class confidences
    const classConfTensor = new Tensor('float32', new Float32Array(classConfidences), [detectionShape[0], numClasses, detectionShape[2]]);

    // Manually calculate the max class confidences along axis 1
    const maxClassConfidences = calculateMax(classConfTensor);

    // Manually filter the data based on the confidence threshold
    const filteredData = filterByConfidence(maxClassConfidences, confThreshold);

    // Filter the boxes using the same mask logic
    const filteredBoxes = filterBoxesAndClasses(detection, boxes, filteredData, 4);

    // Filter the classes using the same logic
    const filteredClasses = filterBoxesAndClasses(classConfTensor, classConfidences, filteredData, numClasses);

    return [filteredBoxes, filteredClasses];
}

// Helper function to calculate the max class confidence manually
function calculateMax(tensor: Tensor): number[] {
    const tensorData = tensor.data as Float32Array;
    const shape = tensor.dims;
    const numClasses = shape[1];
    const numElements = shape[2]; // Number of detections

    const maxConfidences: number[] = [];

    // Iterate over the tensor and calculate the max class confidence for each box
    for (let i = 0; i < numElements; i++) {
        let max = -Infinity;

        // Find the maximum value across the classes (axis 1)
        for (let j = 0; j < numClasses; j++) {
            const index = i * numClasses + j;
            const value = tensorData[index];

            if (value > max) {
                max = value;
            }
        }

        maxConfidences.push(max);
    }

    return maxConfidences;
}

// Function to manually filter the data based on the confidence threshold
function filterByConfidence(confidences: number[], threshold: number): boolean[] {
    const mask: boolean[] = [];

    // Iterate through each confidence value and compare to the threshold
    for (let i = 0; i < confidences.length; i++) {
        mask.push(confidences[i] > threshold); // Check if confidence exceeds the threshold
    }

    return mask;
}

// Function to filter bounding boxes and class confidences
function filterBoxesAndClasses(tensor: Tensor, data: number[], mask: boolean[], numElements: number): Tensor {
    const filteredData: number[] = [];

    // Manually filter the data based on the mask
    for (let i = 0; i < data.length; i++) {
        if (mask[Math.floor(i / numElements)]) {
            filteredData.push(data[i]);
        }
    }

    // Create and return a new tensor with the filtered data
    return new Tensor(tensor.type, new Float32Array(filteredData), tensor.dims);
}



/*
type PredictionResult = [string, string | null, number, [number, number, number, number]];

export async function predict(detection: Tensor, labels: string[], calories: Map<string, string>, confidence: number = 0.5, top: number = 3): Promise<PredictionResult[]> {
    // Parse YOLO output
    const [fboxesT, fclassesT] = parseOutputs(detection, confidence);
    //const fboxes = fboxesT.data as Float32Array;
    //const fclasses = fclassesT.data as Float32Array;

    // Get the argmax indices for each class confidence
    const fargmaxes = fclasses.map((fc: Tensor) => argmax(fc));

    const results: PredictionResult[] = [];

    // Iterate through detections and format the results
    for (let i = 0; i < fargmaxes.length; i++) {
        const fa = fargmaxes[i];
        const fc = fclasses[i];
        const fb = fboxes[i];

        // Get the label from the model's class names
        const label = labels[fa + 1];

        // Fetch the calories information
        const cals = calories.get(label.toLowerCase()) || null;

        // Confidence value for the selected class
        const classConfidence = fc[fa];

        // Bounding box coordinates
        const location: [number, number, number, number] = [
        fb[0], fb[1], fb[2], fb[3]
        ];

        // Add the detection result
        results.push([label, cals, classConfidence, location]);
    }

    // Sort results by confidence and return the top predictions
    return results.sort((a, b) => b[2] - a[2]).slice(0, top);
}

// Helper function to calculate argmax
function argmax(tensor: Tensor): number {
    const data = tensor.dataSync();
    let maxIndex = 0;
    let maxValue = -Infinity;

    for (let i = 0; i < data.length; i++) {
        if (data[i] > maxValue) {
        maxValue = data[i];
        maxIndex = i;
        }
    }

    return maxIndex;
}
*/