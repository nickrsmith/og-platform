import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

function generateSecurePassword(length = 16) {
  // Generate a password with a mix of character types
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

async function main() {
  const [email, firstName, lastName, password] = process.argv.slice(2);

  if (!email || !firstName || !lastName) {
    console.error('❌ Error: Please provide email, firstName, and lastName.');
    console.log('Usage: node create-admin.mjs <email> <firstName> <lastName> [password]');
    process.exit(1);
  }

  console.log(`🚀 Creating new admin user for: ${email}`);

  try {
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email },
    });
    if (existingAdmin) {
      throw new Error(`Admin user with email "${email}" already exists.`);
    }

    // Use provided password or generate one
    const finalPassword = password || generateSecurePassword();
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    const newAdmin = await prisma.adminUser.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
      },
    });
    console.log(
      `✅ Successfully created admin user "${email}" with ID: ${newAdmin.id}`,
    );

    const csvContent = `email,password,firstName,lastName\n"${email}","${finalPassword}","${firstName}","${lastName}"\n`;
    const fileName = `admin-credentials-${firstName.toLowerCase()}-${lastName.toLowerCase()}.csv`;
    
    // Try to write to current directory, fallback to /tmp if permission denied
    let filePath = path.resolve(process.cwd(), fileName);
    let fileWritten = false;

    try {
      await fs.writeFile(filePath, csvContent);
      fileWritten = true;
    } catch (writeError) {
      if (writeError.code === 'EACCES' || writeError.code === 'EISDIR') {
        // Permission denied in current dir, try /tmp
        try {
          filePath = path.join('/tmp', fileName);
          await fs.writeFile(filePath, csvContent);
          fileWritten = true;
        } catch (tmpError) {
          console.warn(`⚠️  Could not write CSV file to disk: ${tmpError}`);
        }
      } else {
        console.warn(`⚠️  Could not write CSV file: ${writeError.message}`);
      }
    }

    if (fileWritten) {
      console.log('\n🔒 SECURE CREDENTIALS EXPORTED 🔒');
      console.log('------------------------------------------');
      console.log(
        `A file named "${fileName}" has been created at: ${filePath}`,
      );
      console.log(
        '🔴 CRITICAL: Provide this file securely to the new administrator and then DELETE IT IMMEDIATELY.',
      );
      console.log('------------------------------------------');
    } else {
      console.error('\n❌ CSV file could not be written. Admin account created but credentials were not saved.');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Failed to create admin user:`, error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('An unexpected error occurred:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
