import { createHash } from 'crypto';
import { createCanvas, loadImage } from 'canvas';
import formidable from 'formidable';
import fs from 'fs';

function extractAdvancedImageFeatures(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  const features = [];
  
  // 1. Color histogram features
  const redHist = new Array(256).fill(0);
  const greenHist = new Array(256).fill(0);
  const blueHist = new Array(256).fill(0);
  
  // 2. Texture features using Local Binary Pattern-like approach
  const lbpFeatures = [];
  
  // 3. Gradient features
  const gradients = [];
  
  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      const idx = (y * canvas.width + x) * 4;
      
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Update histograms
      redHist[r]++;
      greenHist[g]++;
      blueHist[b]++;
      
      // Calculate gradients (simplified Sobel operator)
      if (x % 4 === 0 && y % 4 === 0) { // Sample every 4th pixel
        const leftIdx = ((y * canvas.width) + (x - 1)) * 4;
        const rightIdx = ((y * canvas.width) + (x + 1)) * 4;
        const topIdx = (((y - 1) * canvas.width) + x) * 4;
        const bottomIdx = (((y + 1) * canvas.width) + x) * 4;
        
        const gx = (data[rightIdx] - data[leftIdx]) / 2;
        const gy = (data[bottomIdx] - data[topIdx]) / 2;
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        gradients.push(magnitude);
        
        // LBP-like feature
        const center = (r + g + b) / 3;
        const neighbors = [
          (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3,
          (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3,
          (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3,
          (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3
        ];
        
        let lbpValue = 0;
        neighbors.forEach((neighbor, i) => {
          if (neighbor > center) {
            lbpValue |= (1 << i);
          }
        });
        lbpFeatures.push(lbpValue);
      }
    }
  }
  
  // Normalize histograms
  const totalPixels = canvas.width * canvas.height;
  const normalizedRedHist = redHist.map(count => count / totalPixels);
  const normalizedGreenHist = greenHist.map(count => count / totalPixels);
  const normalizedBlueHist = blueHist.map(count => count / totalPixels);
  
  // Calculate histogram statistics
  const redMean = normalizedRedHist.reduce((sum, val, idx) => sum + val * idx, 0);
  const greenMean = normalizedGreenHist.reduce((sum, val, idx) => sum + val * idx, 0);
  const blueMean = normalizedBlueHist.reduce((sum, val, idx) => sum + val * idx, 0);
  
  // Calculate gradient statistics
  const gradientMean = gradients.reduce((sum, val) => sum + val, 0) / gradients.length;
  const gradientStd = Math.sqrt(
    gradients.reduce((sum, val) => sum + Math.pow(val - gradientMean, 2), 0) / gradients.length
  );
  
  // Calculate LBP statistics
  const lbpHistogram = new Array(16).fill(0);
  lbpFeatures.forEach(val => lbpHistogram[val % 16]++);
  const normalizedLbpHist = lbpHistogram.map(count => count / lbpFeatures.length);
  
  // Combine all features
  features.push(
    redMean, greenMean, blueMean,
    gradientMean, gradientStd,
    ...normalizedLbpHist,
    // Add some reduced histogram data (every 16th bin)
    ...normalizedRedHist.filter((_, idx) => idx % 16 === 0),
    ...normalizedGreenHist.filter((_, idx) => idx % 16 === 0),
    ...normalizedBlueHist.filter((_, idx) => idx % 16 === 0)
  );
  
  return features;
}

function extractSpatialFeatures(canvas) {
  const ctx = canvas.getContext('2d');
  
  // Create a smaller working canvas for spatial analysis
  const workCanvas = createCanvas(64, 64);
  const workCtx = workCanvas.getContext('2d');
  workCtx.drawImage(canvas, 0, 0, 64, 64);
  
  const imageData = workCtx.getImageData(0, 0, 64, 64);
  const data = imageData.data;
  
  const features = [];
  const gridSize = 8; // 8x8 grid
  const cellSize = 64 / gridSize;
  
  // Extract features from each grid cell
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      let rSum = 0, gSum = 0, bSum = 0;
      let pixelCount = 0;
      let variance = 0;
      const cellValues = [];
      
      const startX = Math.floor(col * cellSize);
      const endX = Math.floor((col + 1) * cellSize);
      const startY = Math.floor(row * cellSize);
      const endY = Math.floor((row + 1) * cellSize);
      
      // First pass: calculate means
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * 64 + x) * 4;
          const intensity = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          cellValues.push(intensity);
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
          pixelCount++;
        }
      }
      
      if (pixelCount > 0) {
        const rMean = rSum / pixelCount;
        const gMean = gSum / pixelCount;
        const bMean = bSum / pixelCount;
        const intensityMean = cellValues.reduce((sum, val) => sum + val, 0) / cellValues.length;
        
        // Calculate variance
        variance = cellValues.reduce((sum, val) => sum + Math.pow(val - intensityMean, 2), 0) / cellValues.length;
        
        features.push(rMean, gMean, bMean, Math.sqrt(variance));
      }
    }
  }
  
  return features;
}

function normalizeFeatures(features) {
  return features.map(val => {
    if (isNaN(val) || !isFinite(val)) return 0;
    return Math.round(val * 1000) / 1000; // Round to 3 decimal places
  });
}

function generateDeterministicHash(features) {
  const normalizedFeatures = normalizeFeatures(features);
  const featureString = normalizedFeatures.join(',');
  return createHash('sha256').update(featureString).digest('hex');
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('Processing face recognition request...');

    // Parse form data
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    const [fields, files] = await form.parse(req);
    const imageFile = files.image?.[0];

    if (!imageFile) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    console.log('Image received, processing...');

    // Load and process image
    const image = await loadImage(imageFile.filepath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    console.log('Extracting advanced image features...');

    // Extract multiple types of features
    const advancedFeatures = extractAdvancedImageFeatures(canvas);
    const spatialFeatures = extractSpatialFeatures(canvas);
    
    // Combine all features
    const allFeatures = [...advancedFeatures, ...spatialFeatures];
    
    if (allFeatures.length === 0) {
      throw new Error('No features could be extracted from the image');
    }

    // Generate deterministic hash
    const hash = generateDeterministicHash(allFeatures);

    console.log('Face hash generated successfully');
    console.log(`Extracted ${allFeatures.length} features`);

    // Clean up
    fs.unlinkSync(imageFile.filepath);

    res.status(200).json({
      success: true,
      hash: hash,
      featureCount: allFeatures.length,
      message: "Face hash generated using advanced image feature extraction"
    });

  } catch (error) {
    console.error('Face processing error:', error);
    
    res.status(500).json({
      success: false,
      error: `Face processing failed: ${error.message}`
    });
  }
}