#!/usr/bin/env node

/**
 * Create KMS key aliases
 * This script creates aliases for existing KMS keys using the AWS SDK
 */

import { readFileSync } from 'fs';
import { KMSClient, CreateAliasCommand, ListAliasesCommand } from '@aws-sdk/client-kms';

// Load .env file
try {
  const envContent = readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0 && !key.startsWith('#')) {
      const value = values.join('=').trim().replace(/^"|"$/g, '');
      process.env[key.trim()] = value;
    }
  });
} catch (e) {
  console.log('Note: Could not load .env file, using environment variables');
}

const region = 'us-east-1';

// Test KMS key IDs
const keys = [
  '449a7a5f-d075-4167-af4e-58a7a06d8218',
  'edeb5431-b651-49d7-b1a9-950c2f7dce5d',
  '6e89d57c-d45f-4642-b117-97a084b76630',
  '4420bc65-a181-4f05-8ffc-dc080b8ee6cc',
  '3a311570-eab4-432e-a697-2161efdcbc53',
  '30f650bf-4b61-42da-aeee-782ed1e5fc83',
  '5a0ad31b-0337-47c8-9cc3-2922dcf449b5',
  '58106be4-2666-4445-8f43-d7d31fad0d89',
  '44b9cd8c-5f4a-439c-b188-5bee5d406c5e',
  'b975891e-429f-4df9-9a13-f343fb6a851d',
];

const client = new KMSClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createAliases() {
  console.log('🔑 Creating KMS Key Aliases');
  console.log('============================\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < keys.length; i++) {
    const aliasNumber = i + 1;
    const aliasName = `alias/empressa-wallet-key-${aliasNumber}`;
    const keyId = keys[i];

    try {
      // Try to create the alias
      const command = new CreateAliasCommand({
        AliasName: aliasName,
        TargetKeyId: keyId,
      });

      await client.send(command);
      console.log(`✅ Created alias: ${aliasName} -> ${keyId}`);
      successCount++;
    } catch (error) {
      if (error.name === 'AlreadyExistsException' || error.message?.includes('already exists')) {
        console.log(`ℹ️  Alias already exists: ${aliasName} (skipping)`);
        skipCount++;
      } else {
        console.log(`❌ Error creating alias ${aliasName}: ${error.message}`);
        errorCount++;
      }
    }
  }

  console.log('\n============================');
  console.log(`✅ Success: ${successCount}`);
  console.log(`ℹ️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('');
  
  if (successCount + skipCount === 10) {
    console.log('🎉 All aliases are set up!');
    console.log('\n📋 Next step: Restart the KMS service');
    console.log('   ./start-kms-service.sh');
  }
}

// Run the function
createAliases().catch(console.error);

