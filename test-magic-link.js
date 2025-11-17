const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Configuration
const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';
const API_VERSION = '2023-10';
const USERS_BOARD_ID = '18379351659';
const JWT_SECRET = 'test-secret-key-replace-in-production';
const PORTAL_BASE_URL = 'https://portal.redsis.com';

// In-memory storage (simulates Monday Code storage)
const storage = new Map();

// GraphQL helper
async function mondayQuery(query) {
  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': MONDAY_API_KEY,
      'API-Version': API_VERSION
    },
    body: JSON.stringify({ query })
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('GraphQL Errors:', JSON.stringify(result.errors, null, 2));
  }
  
  return result;
}

// Find user by email
async function findUserByEmail(email) {
  console.log(`\n🔍 Looking up user: ${email}...`);
  
  const query = `
    query {
      boards(ids: [${USERS_BOARD_ID}]) {
        items_page(limit: 100) {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const result = await mondayQuery(query);
  const items = result.data?.boards?.[0]?.items_page?.items || [];

  // Find user with matching email (check both name and column values)
  for (const item of items) {
    // Check if item name matches email
    if (item.name.toLowerCase() === email.toLowerCase()) {
      console.log(`   ✅ Found user: ${item.name} [${item.id}]`);
      return item;
    }

    // Check column values for email
    const emailColumn = item.column_values.find((col) => 
      col.text?.toLowerCase() === email.toLowerCase()
    );
    
    if (emailColumn) {
      console.log(`   ✅ Found user: ${item.name} [${item.id}] via column ${emailColumn.id}`);
      return item;
    }
  }

  console.log(`   ❌ User not found`);
  return null;
}

// Generate magic link
async function generateMagicLink(email, expiresInHours = 24) {
  console.log('\n🔐 GENERATING MAGIC LINK');
  console.log('─'.repeat(60));

  // Find user
  const user = await findUserByEmail(email);
  
  if (!user) {
    return {
      success: false,
      error: 'User not found',
    };
  }

  // Generate token
  const token = crypto.randomBytes(32).toString('hex');
  console.log(`\n🎟️  Token generated: ${token.substring(0, 16)}...`);

  // Store magic link data
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  const magicLinkData = {
    userId: user.id,
    email: email,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  };

  storage.set(`magic_link:${token}`, magicLinkData);
  console.log(`   ✅ Stored in memory (simulating Monday storage)`);

  // Build magic link
  const magicLink = `${PORTAL_BASE_URL}/auth/magic?token=${token}`;

  console.log(`\n📧 Magic Link:`);
  console.log(`   ${magicLink}`);
  console.log(`\n⏰ Expires: ${expiresAt.toLocaleString()}`);

  return {
    success: true,
    data: {
      magic_link: magicLink,
      expires_at: expiresAt.toISOString(),
      user_id: user.id,
      email: email,
      token: token, // Only for testing
    },
  };
}

// Verify magic link
async function verifyMagicLink(token) {
  console.log('\n🔓 VERIFYING MAGIC LINK');
  console.log('─'.repeat(60));
  console.log(`Token: ${token.substring(0, 16)}...`);

  // Get magic link data from storage
  const magicLinkData = storage.get(`magic_link:${token}`);

  if (!magicLinkData) {
    console.log('   ❌ Invalid or expired token');
    return {
      success: false,
      error: 'Invalid or expired magic link',
    };
  }

  // Check expiration
  const expiresAt = new Date(magicLinkData.expiresAt);
  if (expiresAt < new Date()) {
    console.log('   ❌ Token expired');
    storage.delete(`magic_link:${token}`);
    return {
      success: false,
      error: 'Magic link expired',
    };
  }

  console.log(`   ✅ Token valid, expires: ${expiresAt.toLocaleString()}`);

  const { userId, email } = magicLinkData;

  // Get user details
  console.log(`\n👤 Fetching user details for ID: ${userId}...`);
  
  const query = `
    query {
      items(ids: [${userId}]) {
        id
        name
        column_values {
          id
          text
          value
        }
      }
    }
  `;

  const result = await mondayQuery(query);
  const user = result.data?.items?.[0];

  if (!user) {
    console.log('   ❌ User not found');
    return {
      success: false,
      error: 'User not found',
    };
  }

  console.log(`   ✅ User: ${user.name}`);

  // Generate JWT
  const expiresIn = 24 * 60 * 60; // 24 hours
  const accessToken = jwt.sign(
    {
      sub: userId,
      email: email,
      name: user.name,
      type: 'user',
    },
    JWT_SECRET,
    {
      expiresIn,
    }
  );

  console.log(`\n🎫 JWT Generated:`);
  console.log(`   Token: ${accessToken.substring(0, 50)}...`);
  console.log(`   Expires in: ${expiresIn / 3600} hours`);

  // Delete used magic link
  storage.delete(`magic_link:${token}`);
  console.log(`   ✅ Magic link consumed (deleted from storage)`);

  // Store session
  const sessionData = {
    accessToken,
    email,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };

  storage.set(`session:${userId}`, sessionData);
  console.log(`   ✅ Session stored for user ${userId}`);

  return {
    success: true,
    data: {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user: {
        id: userId,
        email: email,
        name: user.name,
      },
    },
  };
}

// Decode and verify JWT
function decodeJWT(token) {
  console.log('\n🔍 DECODING JWT');
  console.log('─'.repeat(60));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('   ✅ JWT signature valid');
    console.log('\nPayload:');
    console.log(JSON.stringify(decoded, null, 2));
    return decoded;
  } catch (error) {
    console.log('   ❌ JWT verification failed:', error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 MAGIC LINK AUTHENTICATION TEST');
  console.log('='.repeat(60));
  console.log(`Workspace: 13302651`);
  console.log(`Users Board: ${USERS_BOARD_ID}`);
  console.log(`Portal URL: ${PORTAL_BASE_URL}`);
  console.log('='.repeat(60));

  // Test 1: Generate magic link for test user
  const testEmail = 'mikehabib@redsis.com';
  
  const generateResult = await generateMagicLink(testEmail, 24);

  if (!generateResult.success) {
    console.error('\n❌ Magic link generation failed:', generateResult.error);
    process.exit(1);
  }

  const { token } = generateResult.data;

  console.log('\n✅ TEST 1 PASSED: Magic link generated');

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Verify magic link
  const verifyResult = await verifyMagicLink(token);

  if (!verifyResult.success) {
    console.error('\n❌ Magic link verification failed:', verifyResult.error);
    process.exit(1);
  }

  const { access_token } = verifyResult.data;

  console.log('\n✅ TEST 2 PASSED: Magic link verified');

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Decode JWT
  const decoded = decodeJWT(access_token);

  if (!decoded) {
    console.error('\n❌ JWT decode failed');
    process.exit(1);
  }

  console.log('\n✅ TEST 3 PASSED: JWT decoded successfully');

  // Test 4: Verify token is consumed
  console.log('\n🔄 TEST 4: Verify magic link is consumed (can\'t be reused)');
  console.log('─'.repeat(60));

  const secondVerify = await verifyMagicLink(token);

  if (secondVerify.success) {
    console.error('\n❌ TEST 4 FAILED: Token should not be reusable');
    process.exit(1);
  }

  console.log('✅ TEST 4 PASSED: Token cannot be reused');

  // Summary
  console.log('\n');
  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('✅ All tests passed!');
  console.log('\n📋 Results:');
  console.log(`   - Magic link generated for: ${testEmail}`);
  console.log(`   - Token verified successfully`);
  console.log(`   - JWT issued with 24h expiration`);
  console.log(`   - Token consumed and cannot be reused`);
  console.log(`   - Session stored for user`);
  
  console.log('\n🚀 Next Steps:');
  console.log('   1. Deploy functions to Monday Code (see MONDAY_CODE_DEPLOYMENT.md)');
  console.log('   2. Set environment variables (JWT_SECRET, PORTAL_BASE_URL)');
  console.log('   3. Test with production URLs');
  console.log('   4. Integrate with frontend login page');
  console.log('   5. Remove old password columns\n');

  process.exit(0);
}

// Run tests
runTests()
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
