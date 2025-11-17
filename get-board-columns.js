/**
 * Script to fetch Monday board columns and their IDs
 * 
 * Usage: node get-board-columns.js [BOARD_ID]
 */

const MONDAY_API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';
const BOARD_ID = process.argv[2] || '18379404757'; // Get from command line or use default

async function getBoardColumns() {
  const query = `
    query GetBoardColumns($boardId: [ID!]!) {
      boards(ids: $boardId) {
        id
        name
        columns {
          id
          title
          type
          settings_str
        }
        items_page(limit: 1) {
          items {
            id
            name
            column_values {
              id
              text
              value
              type
            }
          }
        }
      }
    }
  `;

  try {
    console.log('🔍 Fetching board columns from Monday.com...\n');
    
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_TOKEN,
        'API-Version': '2023-10'
      },
      body: JSON.stringify({
        query: query,
        variables: {
          boardId: [BOARD_ID]
        }
      })
    });

    const result = await response.json();

    if (result.errors) {
      console.error('❌ GraphQL Errors:', result.errors);
      return;
    }

    const board = result.data?.boards?.[0];

    if (!board) {
      console.error('❌ Board not found');
      return;
    }

    console.log('📊 Board Name:', board.name);
    console.log('📊 Board ID:', board.id);
    console.log('\n' + '='.repeat(80) + '\n');

    console.log('📋 COLUMNS:\n');
    console.log('| Column Title | Column ID | Column Type |');
    console.log('|--------------|-----------|-------------|');
    
    board.columns.forEach(col => {
      console.log(`| ${col.title.padEnd(12)} | ${col.id.padEnd(9)} | ${col.type.padEnd(11)} |`);
    });

    console.log('\n' + '='.repeat(80) + '\n');

    // Show sample data from first item
    if (board.items_page?.items?.[0]) {
      const sampleItem = board.items_page.items[0];
      console.log('📝 SAMPLE ITEM (First ticket):\n');
      console.log('Item Name:', sampleItem.name);
      console.log('Item ID:', sampleItem.id);
      console.log('\nColumn Values:');
      console.log('| Column ID | Value | Type |');
      console.log('|-----------|-------|------|');
      
      sampleItem.column_values.forEach(col => {
        const value = col.text || col.value || '(empty)';
        const displayValue = typeof value === 'string' ? value : JSON.stringify(value);
        const truncated = displayValue.length > 30 ? displayValue.substring(0, 27) + '...' : displayValue;
        console.log(`| ${col.id.padEnd(9)} | ${truncated.padEnd(30)} | ${col.type.padEnd(4)} |`);
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Portal Configuration
    console.log('⚙️  PORTAL CONFIGURATION:\n');
    console.log('Based on your board, update these column IDs in your portal:\n');
    
    const columnMap = {
      'Status': 'status',
      'Priority': 'priority',
      'Email': 'client_email',
      'Long Text': 'description or long_text',
      'Text': 'description'
    };

    board.columns.forEach(col => {
      const suggestion = Object.entries(columnMap).find(([type]) => 
        col.type.toLowerCase().includes(type.toLowerCase())
      );
      
      if (suggestion) {
        console.log(`✅ ${col.title} (${col.type})`);
        console.log(`   Column ID: "${col.id}"`);
        console.log(`   Use for: ${suggestion[1]}`);
        console.log('');
      }
    });

    console.log('\n' + '='.repeat(80) + '\n');
    console.log('📋 Copy this configuration for your portal:\n');
    
    const config = {
      boardId: board.id,
      columns: {}
    };
    
    board.columns.forEach(col => {
      config.columns[col.id] = {
        title: col.title,
        type: col.type
      };
    });
    
    console.log(JSON.stringify(config, null, 2));

  } catch (error) {
    console.error('❌ Error fetching board columns:', error.message);
  }
}

// Run the script
getBoardColumns();
