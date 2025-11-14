#!/usr/bin/env node

/**
 * Test Multi-Tenant Architecture Setup
 * Verifies User Board, Company Board, and ticket board connections
 */

const MONDAY_API_TOKEN = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN;

if (!MONDAY_API_TOKEN) {
  console.error('❌ NEXT_PUBLIC_MONDAY_API_TOKEN not found in environment');
  console.log('Set it with: export NEXT_PUBLIC_MONDAY_API_TOKEN="your_token_here"');
  process.exit(1);
}

async function callMondayAPI(query, variables = {}) {
  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': MONDAY_API_TOKEN,
      'API-Version': '2023-10'
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Monday API error');
  }
  
  return result.data;
}

async function testArchitecture() {
  console.log('\n🧪 Testing Multi-Tenant Architecture\n');
  console.log('='.repeat(60));

  // Test 1: User Board
  console.log('\n1️⃣  Testing User Board (18379351659)...');
  try {
    const userQuery = `
      query {
        boards(ids: [18379351659]) {
          name
          items_page(limit: 5) {
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
    
    const userData = await callMondayAPI(userQuery);
    const users = userData.boards[0].items_page.items;
    
    console.log(`   ✅ Found ${users.length} users`);
    
    users.forEach(user => {
      const cols = user.column_values.reduce((acc, col) => {
        acc[col.id] = col.text || col.value;
        return acc;
      }, {});
      
      const email = cols.email_mkxpm2m0 || 'No email';
      const company = cols.dropdown_mkxpsjwd || 'No company assigned';
      
      console.log(`   📧 ${user.name}: ${email} → Company: ${company}`);
    });
    
  } catch (err) {
    console.error('   ❌ Error:', err.message);
  }

  // Test 2: Company Board
  console.log('\n2️⃣  Testing Company Board (18379404757)...');
  try {
    const companyQuery = `
      query {
        boards(ids: [18379404757]) {
          name
          items_page(limit: 10) {
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
    
    const companyData = await callMondayAPI(companyQuery);
    const companies = companyData.boards[0].items_page.items;
    
    console.log(`   ✅ Found ${companies.length} companies`);
    
    const companyMap = {};
    
    companies.forEach(company => {
      const cols = company.column_values.reduce((acc, col) => {
        acc[col.id] = col.text || col.value;
        return acc;
      }, {});
      
      const boardId = cols.dropdown_mkxpakmh || 'No board ID set';
      const status = cols.status || 'Unknown';
      
      companyMap[company.name] = boardId;
      
      console.log(`   🏢 ${company.name}: Board ID = ${boardId} (${status})`);
    });

    // Test 3: Test ticket board access
    console.log('\n3️⃣  Testing Ticket Board Access...');
    for (const [companyName, boardId] of Object.entries(companyMap)) {
      if (boardId === 'No board ID set') {
        console.log(`   ⚠️  ${companyName}: No ticket board configured`);
        continue;
      }
      
      try {
        const ticketQuery = `
          query {
            boards(ids: [${boardId}]) {
              name
              columns {
                id
                title
                type
              }
              items_page(limit: 1) {
                items {
                  id
                }
              }
            }
          }
        `;
        
        const ticketData = await callMondayAPI(ticketQuery);
        
        if (ticketData.boards && ticketData.boards.length > 0) {
          const board = ticketData.boards[0];
          const ticketCount = board.items_page.items.length;
          
          console.log(`   ✅ ${companyName}: "${board.name}"`);
          console.log(`      Board ID: ${boardId}`);
          console.log(`      Columns: ${board.columns.length}`);
          
          // Check for required columns
          const emailCol = board.columns.find(c => c.type === 'email');
          const statusCol = board.columns.find(c => c.type === 'status');
          const longTextCol = board.columns.find(c => c.type === 'long_text');
          
          console.log(`      📧 Email column: ${emailCol ? '✅' : '❌'}`);
          console.log(`      📊 Status column: ${statusCol ? '✅' : '❌'}`);
          console.log(`      📝 Description column: ${longTextCol ? '✅' : '❌'}`);
          
        } else {
          console.log(`   ⚠️  ${companyName}: Board ${boardId} not accessible`);
        }
      } catch (err) {
        console.log(`   ❌ ${companyName}: Error accessing board ${boardId}`);
        console.log(`      ${err.message}`);
      }
    }
    
  } catch (err) {
    console.error('   ❌ Error:', err.message);
  }

  // Test 4: Test login flow simulation
  console.log('\n4️⃣  Testing Login Flow Simulation...');
  try {
    const userQuery = `
      query {
        boards(ids: [18379351659]) {
          items_page(limit: 1) {
            items {
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
    
    const userData = await callMondayAPI(userQuery);
    
    if (userData.boards[0].items_page.items.length > 0) {
      const testUser = userData.boards[0].items_page.items[0];
      const cols = testUser.column_values.reduce((acc, col) => {
        acc[col.id] = col.text || col.value;
        return acc;
      }, {});
      
      const email = cols.email_mkxpm2m0;
      const company = cols.dropdown_mkxpsjwd;
      
      console.log(`   👤 Test User: ${testUser.name}`);
      console.log(`   📧 Email: ${email || 'Not set'}`);
      console.log(`   🏢 Company: ${company || 'Not assigned'}`);
      
      if (company) {
        // Look up company board ID
        const companyQuery = `
          query {
            boards(ids: [18379404757]) {
              items_page(limit: 100) {
                items {
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
        
        const companyData = await callMondayAPI(companyQuery);
        const companies = companyData.boards[0].items_page.items;
        const userCompany = companies.find(c => c.name === company);
        
        if (userCompany) {
          const companyCols = userCompany.column_values.reduce((acc, col) => {
            acc[col.id] = col.text || col.value;
            return acc;
          }, {});
          
          const boardId = companyCols.dropdown_mkxpakmh;
          
          console.log(`   ✅ Login would redirect to board: ${boardId}`);
          console.log(`   🎫 User would see tickets from: ${company} - Tickets`);
        } else {
          console.log(`   ⚠️  Company "${company}" not found in Company Board`);
        }
      } else {
        console.log(`   ⚠️  User has no company assigned`);
      }
      
    } else {
      console.log('   ⚠️  No users found in User Board');
    }
    
  } catch (err) {
    console.error('   ❌ Error:', err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Architecture test complete!\n');
}

testArchitecture().catch(err => {
  console.error('\n💥 Test failed:', err);
  process.exit(1);
});
