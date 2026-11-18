/**
 * Google MediaPipe Face Landmarker Service
 * Berdasarkan PRD Section 5.5 (Verifikasi Wajah & Liveness 4 Gerakan Acak)
 */

import { FilesetResolver, FaceLandmarker, FaceLandmarkerResult } from "@mediapipe/tasks-vision";

export type DetectedMovement = "left" | "right" | "up" | "down" | "smile" | "neutral" | null;

let faceLandmarkerInstance: FaceLandmarker | null = null;
let isLoading = false;

/**
 * Inisialisasi MediaPipe Face Landmarker WebAssembly dan Model GPU
 */
export async function initFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;
  if (isLoading) return null;

  isLoading = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1,
    });

    isLoading = false;
    return faceLandmarkerInstance;
  } catch (err) {
    console.warn("Gagal inisialisasi MediaPipe GPU, mencoba CPU fallback:", err);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "CPU",
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1,
      });
      isLoading = false;
      return faceLandmarkerInstance;
    } catch (cpuErr) {
      console.error("Gagal memuat MediaPipe Vision:", cpuErr);
      isLoading = false;
      return null;
    }
  }
}

/**
 * Analisis 478 Landmark & Blendshapes untuk mendeteksi gerakan kepala atau senyum
 */
export function analyzeMovementFromLandmarks(result: FaceLandmarkerResult): {
  movement: DetectedMovement;
  confidence: number;
  hasFace: boolean;
} {
  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    return { movement: null, confidence: 0, hasFace: false };
  }

  const landmarks = result.faceLandmarks[0];

  // 1. Cek Senyum via Blendshapes MediaPipe
  if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
    const categories = result.faceBlendshapes[0].categories;
    const smileLeft = categories.find((c) => c.categoryName === "mouthSmileLeft")?.score || 0;
    const smileRight = categories.find((c) => c.categoryName === "mouthSmileRight")?.score || 0;
    const avgSmile = (smileLeft + smileRight) / 2;

    if (avgSmile > 0.42) {
      return { movement: "smile", confidence: avgSmile, hasFace: true };
    }
  }

  // 2. Cek Menoleh Kiri / Kanan (Yaw)
  // Landmark 1: Ujung hidung
  // Landmark 234: Pipi/pelipis kiri
  // Landmark 454: Pipi/pelipis kanan
  const nose = landmarks[1];
  const cheekLeft = landmarks[234];
  const cheekRight = landmarks[454];

  const distToLeft = Math.abs(nose.x - cheekLeft.x);
  const distToRight = Math.abs(cheekRight.x - nose.x);
  const yawRatio = distToLeft / (distToRight + 0.0001);

  // Karena kamera selfie di-mirror (scale-x-[-1]):
  // Jika menoleh ke kanan fisik pengguna: distToLeft mengecil
  if (yawRatio < 0.5) {
    return { movement: "right", confidence: 0.85, hasFace: true };
  } else if (yawRatio > 2.0) {
    return { movement: "left", confidence: 0.85, hasFace: true };
  }

  // 3. Cek Mengangkat Wajah ke Atas / Bawah (Pitch)
  // Landmark 10: Dahi atas
  // Landmark 152: Dagu bawah
  const forehead = landmarks[10];
  const chin = landmarks[152];

  const upperDist = Math.abs(nose.y - forehead.y);
  const lowerDist = Math.abs(chin.y - nose.y);
  const pitchRatio = upperDist / (lowerDist + 0.0001);

  if (pitchRatio < 0.65) {
    // Dahi lebih dekat ke hidung -> Kepala mendongak ke atas
    return { movement: "up", confidence: 0.85, hasFace: true };
  } else if (pitchRatio > 1.55) {
    // Dagu lebih dekat ke hidung -> Kepala menunduk ke bawah
    return { movement: "down", confidence: 0.85, hasFace: true };
  }

  return { movement: "neutral", confidence: 0.9, hasFace: true };
}
