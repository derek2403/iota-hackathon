import { createLocked } from '../../examples/createLocked.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Starting locked notarization creation...');
    const notarization = await createLocked();
    
    res.status(200).json({
      success: true,
      notarization: {
        id: notarization.id,
        method: notarization.method,
        stateData: notarization.state.data.toString(),
        stateMetadata: notarization.state.metadata,
        description: notarization.immutableMetadata.description,
        updatableMetadata: notarization.updatableMetadata,
        createdAt: notarization.immutableMetadata.createdAt.toString(),
        locking: notarization.immutableMetadata.locking
      }
    });
  } catch (error) {
    console.error('Error creating notarization:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 