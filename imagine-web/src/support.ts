import { load } from "js-yaml";
import { Detection } from "./convert";


export function fileToImage(file: File): Promise<HTMLImageElement> {
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
}

export async function readClassesFromYAML(url: string): Promise<string[]> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
    const data = load(await response.text()) as { names: any };
    return data["names"] as string[];
}

export async function readCaloriesFromCSV(url: string): Promise<Map<string, string>> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
    const rows = (await response.text()).trim().split("\n");
    const headers = rows[0].split(",");
    const nameIndex = headers.indexOf("FoodItem");
    const caloriesIndex = headers.indexOf("Cals_per100grams");
    const database = new Map();
    for (let index = 0; index < rows.length; index++) {
        const values = rows[index].split(",");
        if (!database.has(values[nameIndex]))
            database.set(values[nameIndex].toLocaleLowerCase(), values[caloriesIndex]);
    }
    return database;
}

export function threeIdxToColor(index: number): string {
    if (index === 0) return "blue";
    else if (index === 1) return "green";
    else if (index === 2) return "purple";
    else return "black";
}

export function drawResult(ctx: CanvasRenderingContext2D, res: Detection, idx: number) {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = threeIdxToColor(idx);
    ctx.rect(res.box.x, res.box.y, res.box.w, res.box.h);
    ctx.closePath();
    ctx.stroke();
}

export function randomElem<T>(array: Array<T>): T {
    return array[Math.floor((Math.random() * array.length))];
}
