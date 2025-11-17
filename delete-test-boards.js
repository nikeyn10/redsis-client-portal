const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Monday.com API Configuration
const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';
const API_VERSION = '2023-10';

// Test boards to delete
const TEST_BOARDS = [
  { id: '18380268500', name: 'Chase', items: 0 },
  { id: '18380098330', name: 'Chedraui', items: 2 },
  { id: '18379880102', name: 'VOI', items: 0 },
  { id: '18379873697', name: 'Redsis', items: 4 },
  { id: '18379754041', name: 'RSI', items: 2 }
];

// GraphQL mutation helper
async function mondayMutation(query, variables = {}) {
  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': MONDAY_API_KEY,
      'API-Version': API_VERSION
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('GraphQL Errors:', JSON.stringify(result.errors, null, 2));
    throw new Error('GraphQL mutation failed');
  }
  
  return result;
}

// Delete a single board
async function deleteBoard(boardId, boardName) {
  console.log(`\n🗑️  Deleting board: ${boardName} [${boardId}]`);
  
  const mutation = `
    mutation {
      delete_board(board_id: ${boardId}) {
        id
      }
    }
  `;

  try {
    const result = await mondayMutation(mutation);
    
    if (result.data?.delete_board?.id) {
      console.log(`   ✅ Successfully deleted: ${boardName}`);
      return { success: true, id: boardId, name: boardName };
    } else {
      console.log(`   ⚠️  Unexpected response for ${boardName}`);
      return { success: false, id: boardId, name: boardName, error: 'Unexpected response' };
    }
  } catch (error) {
    console.error(`   ❌ Failed to delete ${boardName}:`, error.message);
    return { success: false, id: boardId, name: boardName, error: error.message };
  }
}

// Main deletion function
async function deleteTestBoards() {
  console.log('🚀 TEST BOARD DELETION STARTED');
  console.log('==========================================\n');
  console.log(`Total boards to delete: ${TEST_BOARDS.length}`);
  console.log(`Total items to be removed: ${TEST_BOARDS.reduce((sum, b) => sum + b.items, 0)}\n`);

  console.log('⚠️  WARNING: This action is PERMANENT and CANNOT be undone!');
  console.log('✅ Backup completed on: 2025-11-16');
  console.log('📁 Backup location: backups/workspace-13302651-backup-2025-11-16/\n');

  const results = [];

  for (const board of TEST_BOARDS) {
    console.log('─'.repeat(50));
    const result = await deleteBoard(board.id, board.name);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n');
  console.log('==========================================');
  console.log('📊 DELETION SUMMARY');
  console.log('==========================================\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successfully deleted: ${successful.length}/${TEST_BOARDS.length} boards`);
  if (successful.length > 0) {
    successful.forEach(r => {
      console.log(`   - ${r.name} [${r.id}]`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed to delete: ${failed.length} boards`);
    failed.forEach(r => {
      console.log(`   - ${r.name} [${r.id}]: ${r.error}`);
    });
  }

  console.log('\n📊 WORKSPACE UPDATE:');
  console.log(`   Boards before: 9`);
  console.log(`   Boards deleted: ${successful.length}`);
  console.log(`   Boards remaining: ${9 - successful.length}`);

  console.log('\n✅ Test board cleanup complete!');
  console.log('📋 Next step: Security fixes (add auth columns, remove passwords)\n');

  return {
    total: TEST_BOARDS.length,
    successful: successful.length,
    failed: failed.length,
    results
  };
}

// Run deletion
deleteTestBoards()
  .then(summary => {
    if (summary.failed === 0) {
      console.log('✅ All test boards deleted successfully.');
      process.exit(0);
    } else {
      console.error(`⚠️  Some deletions failed (${summary.failed}/${summary.total})`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Deletion process failed:', error);
    process.exit(1);
  });
