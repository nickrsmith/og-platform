// Use ES Module imports instead of require to align with project standards
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define a simple type for the artifact to satisfy TypeScript's safety rules
/**
 * @typedef {object} Artifact
 * @property {any[]} abi - The Application Binary Interface.
 */

const contracts = [
  {
    name: 'EmpressaContractFactoryUpgradeable',
    path: 'contracts/EmpressaContractFactoryUpgradeable.sol/EmpressaContractFactoryUpgradeable.json',
  },
  {
    name: 'EmpressaOrgContract',
    path: 'contracts/EmpressaOrgContract.sol/EmpressaOrgContract.json',
  },
  {
    name: 'EmpressaAssetRegistry',
    path: 'contracts/EmpressaAssetRegistry.sol/EmpressaAssetRegistry.json',
  },
  {
    name: 'MockUSDC',
    path: 'contracts/mocks/MockUSDC.sol/MockUSDC.json',
  },
  {
    name: 'EmpressaLicenseManagerV2',
    path: 'contracts/EmpressaLicenseManagerV2.sol/EmpressaLicenseManagerV2.json',
  },
  {
    name: 'EmpressaRevenueDistributor',
    path: 'contracts/EmpressaRevenueDistributor.sol/EmpressaRevenueDistributor.json',
  },
  // Add other contracts here as they become needed
];

// Correctly resolve paths when using ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vanillaArtifactsPath = path.resolve(
  __dirname,
  '../../Empressa-smart-contracts-demo/vanilla/artifacts',
);
const backendAbisPath = path.resolve(__dirname, '../libs/common/src/abis');

console.log(
  '🚀 Starting ABI synchronization from `vanilla` to `core-backend`...',
);

if (!fs.existsSync(vanillaArtifactsPath)) {
  console.error(
    `❌ Error: 'vanilla' artifacts directory not found at ${vanillaArtifactsPath}`,
  );
  console.error(
    'Please ensure the `vanilla` repository is a sibling to `core-backend` and has been compiled (`npx hardhat compile`).',
  );
  process.exit(1);
}

if (!fs.existsSync(backendAbisPath)) {
  console.log(`   Creating destination directory: ${backendAbisPath}`);
  fs.mkdirSync(backendAbisPath, { recursive: true });
}

const abiIndexFileLines = [];

abiIndexFileLines.push("import { InterfaceAbi } from 'ethers';\n");

contracts.forEach((contract) => {
  const sourcePath = path.join(vanillaArtifactsPath, contract.path);
  const destPath = path.join(backendAbisPath, `${contract.name}.json`);

  try {
    console.log(`   Processing ${contract.name}...`);
    const artifactJson = fs.readFileSync(sourcePath, 'utf8');

    /** @type {Artifact} */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const artifact = JSON.parse(artifactJson);

    fs.writeFileSync(destPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`     ✅ Copied ABI to ${destPath}`);

    const importName = `${contract.name}Abi`;
    abiIndexFileLines.push(
      `import ${contract.name} from './${contract.name}.json';`,
    );

    // UPDATE this line to include the type casting in the generated file
    abiIndexFileLines.push(
      `export const ${importName}: InterfaceAbi = ${contract.name};\n`,
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to process ${contract.name}: ${errorMessage}`);
  }
});

// Create or update the index.ts file for easy importing
const indexTsPath = path.join(backendAbisPath, 'index.ts');
fs.writeFileSync(indexTsPath, abiIndexFileLines.join('\n') + '\n');
console.log(`   ✅ Updated ABI index file at ${indexTsPath}`);

console.log('🎉 ABI synchronization complete!');
