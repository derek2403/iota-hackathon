#!/usr/bin/env node

// Copyright 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { createLocked } from '../examples/createLocked.js';

async function main() {
    try {
        console.log('🚀 Starting IOTA Locked Notarization Script...\n');
        
        const notarization = await createLocked();
        
        console.log('\n🎉 Script completed successfully!');
        console.log('Notarization ID:', notarization.id);
        
    } catch (error) {
        console.error('❌ Script failed with error:');
        console.error(error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

// Run the script
main(); 