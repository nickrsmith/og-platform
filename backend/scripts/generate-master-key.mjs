import { Wallet } from 'ethers';

/**
 * @description
 * This script generates a new, cryptographically secure Ethereum wallet.
 * It outputs the private key, public address, and mnemonic phrase.
 * This is intended for generating the ADMIN_WALLET_PRIVATE_KEY for the
 * backend service's .env file.
 */
function generateMasterKey() {
  console.log('🔑 Empressa Backend Master Key Generator 🔑');
  console.log('-------------------------------------------\n');

  // Create a new random wallet instance
  const wallet = Wallet.createRandom();

  // --- PRIVATE KEY ---
  console.log('🔴 CRITICAL: Private Key (for .env file)');
  console.log('   Treat this like a master password. Do NOT commit it to Git.');
  console.log(
    '   Add this full key to your .env file as ADMIN_WALLET_PRIVATE_KEY\n',
  );
  console.log(`   ${wallet.privateKey}`);
  console.log('\n-------------------------------------------\n');

  // --- PUBLIC ADDRESS ---
  console.log('🟢 PUBLIC: Public Address (to share with contracts team)');
  console.log('   This is the public identifier for your wallet.');
  console.log(
    '   Provide this address to the contracts team to grant admin permissions.\n',
  );
  console.log(`   ${wallet.address}`);
  console.log('\n-------------------------------------------\n');

  // --- MNEMONIC PHRASE ---
  console.log('🔵 RECOVERY: Mnemonic Phrase (for wallet recovery)');
  console.log('   Save this 12-word phrase in a secure password manager.');
  console.log(
    '   It can be used to recover the private key if it is ever lost.\n',
  );
  console.log(`   ${wallet.mnemonic.phrase}`);
  console.log('\n-------------------------------------------\n');
}

generateMasterKey();
