// API endpoint for creating notarization via gas station
import { createNotarizationViaGasStation } from '../../gas-station-client/src/main.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, metadata } = req.body;

    if (!content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing content for notarization' 
      });
    }

    console.log('Creating notarization via gas station...');
    console.log('Content:', content);
    console.log('Metadata:', metadata);

    // Use the JavaScript gas station client
    const result = await createNotarizationViaGasStation(content, metadata);

    if (result.success) {
      console.log('Notarization created successfully:', result);
      res.status(200).json({
        success: true,
        notarization_id: result.notarization_id,
        transaction_id: result.transaction_id,
        content: content,
        metadata: metadata,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error('Notarization failed:', result.error);
      res.status(500).json({
        success: false,
        error: result.error || 'Notarization failed',
        details: result.error
      });
    }

  } catch (error) {
    console.error('Error in create-notarization-gas-station:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
} 