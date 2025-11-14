#!/usr/bin/env node

/**
 * Fix Board Connection Issue
 * Updates Company Board to link "Redsis" company to board 18379446736
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixBoardConnection() {
  console.log('\n🔧 FIX BOARD CONNECTION ISSUE\n');
  console.log('='.repeat(70));
  
  const apiToken = await question('\nEnter your Monday.com API token: ');
  
  if (!apiToken || apiToken.trim() === '') {
    console.log('❌ API token required');
    rl.close();
    return;
  }

  console.log('\n📋 Current Setup:');
  console.log('   Company Board: 18379404757');
  console.log('   Client Redsis Board: 18379446736');
  console.log('   User: mikehabib@redsis.com');
  console.log('   Company: Redsis');
  
  const proceed = await question('\nUpdate Company Board to link Redsis → 18379446736? (yes/no): ');
  
  if (proceed.toLowerCase() !== 'yes') {
    console.log('❌ Cancelled');
    rl.close();
    return;
  }

  async function callMondayAPI(query, variables = {}) {
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiToken,
        'API-Version': '2023-10'
      },
      body: JSON.stringify({ query, variables })
    });
    const result = await response.json();
    if (result.errors) {
      console.error('API Errors:', result.errors);
      throw new Error(result.errors[0]?.message || 'API error');
    }
    return result.data;
  }

  try {
    console.log('\n🔍 Step 1: Finding "Redsis" company in Company Board...');
    
    const findQuery = `{
      boards(ids: [18379404757]) {
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
    }`;
    
    const data = await callMondayAPI(findQuery);
    const companies = data.boards[0].items_page.items;
    
    console.log(`   Found ${companies.length} companies`);
    
    const redsisCompany = companies.find(c => c.name.toLowerCase().includes('redsis'));
    
    if (!redsisCompany) {
      console.log('❌ "Redsis" company not found in Company Board');
      console.log('\n📋 Available companies:');
      companies.forEach(c => console.log(`   - ${c.name}`));
      rl.close();
      return;
    }
    
    console.log(`   ✅ Found: "${redsisCompany.name}" (ID: ${redsisCompany.id})`);
    
    // Check current board ID
    const currentCols = redsisCompany.column_values.reduce((acc, col) => {
      acc[col.id] = col.text || col.value;
      return acc;
    }, {});
    
    console.log(`   Current Board ID: ${currentCols.dropdown_mkxpakmh || 'NOT SET'}`);
    
    console.log('\n🔧 Step 2: Updating dropdown_mkxpakmh column...');
    
    const updateMutation = `
      mutation UpdateBoardId($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
        change_column_value(
          board_id: $boardId,
          item_id: $itemId,
          column_id: $columnId,
          value: $value
        ) {
          id
        }
      }
    `;
    
    await callMondayAPI(updateMutation, {
      boardId: '18379404757',
      itemId: redsisCompany.id,
      columnId: 'dropdown_mkxpakmh',
      value: JSON.stringify({ label: '18379446736' })
    });
    
    console.log('   ✅ Updated successfully!');
    
    console.log('\n✅ FIX COMPLETE!\n');
    console.log('Updated Company Board:');
    console.log(`   Company: ${redsisCompany.name}`);
    console.log(`   Board ID (dropdown_mkxpakmh): 18379446736`);
    console.log('\nNow the login flow will work:');
    console.log('   mikehabib@redsis.com → Redsis → Board 18379446736');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }
  
  rl.close();
}

fixBoardConnection();
