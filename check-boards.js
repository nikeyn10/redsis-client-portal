const MONDAY_API_TOKEN = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN;

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
  if (result.errors) throw new Error(result.errors[0]?.message || 'API error');
  return result.data;
}

async function checkBoards() {
  console.log('\n🔍 CHECKING BOARD STRUCTURE\n');
  console.log('='.repeat(70));

  // Check User Board
  console.log('\n1️⃣  USER BOARD (18379351659)');
  const userQuery = `{
    boards(ids: [18379351659]) {
      name
      columns { id title type }
      items_page(limit: 5) {
        items {
          id
          name
          column_values { id text value }
        }
      }
    }
  }`;
  
  const userData = await callMondayAPI(userQuery);
  console.log('   Columns:', userData.boards[0].columns.map(c => `${c.title} (${c.id})`).join(', '));
  
  const users = userData.boards[0].items_page.items;
  users.forEach(user => {
    const cols = user.column_values.reduce((acc, col) => {
      acc[col.id] = col.text || col.value;
      return acc;
    }, {});
    console.log(`\n   👤 ${user.name}:`);
    console.log(`      Email: ${cols.email_mkxpm2m0 || 'N/A'}`);
    console.log(`      Company: ${cols.dropdown_mkxpsjwd || 'NOT ASSIGNED'}`);
  });

  // Check Company Board
  console.log('\n\n2️⃣  COMPANY BOARD (18379404757)');
  const companyQuery = `{
    boards(ids: [18379404757]) {
      name
      columns { id title type }
      items_page(limit: 10) {
        items {
          id
          name
          column_values { id text value }
        }
      }
    }
  }`;
  
  const companyData = await callMondayAPI(companyQuery);
  console.log('   Columns:', companyData.boards[0].columns.map(c => `${c.title} (${c.id})`).join(', '));
  
  const companies = companyData.boards[0].items_page.items;
  companies.forEach(company => {
    const cols = company.column_values.reduce((acc, col) => {
      acc[col.id] = col.text || col.value;
      return acc;
    }, {});
    console.log(`\n   🏢 ${company.name}:`);
    console.log(`      Status: ${cols.status || 'N/A'}`);
    console.log(`      Board ID (dropdown_mkxpakmh): ${cols.dropdown_mkxpakmh || 'NOT SET ❌'}`);
    console.log(`      Button column: ${cols.button_mkxpx5k6 || 'N/A'}`);
  });

  // Check Client Redsis Board
  console.log('\n\n3️⃣  CLIENT REDSIS BOARD (18379446736)');
  const redsisQuery = `{
    boards(ids: [18379446736]) {
      name
      columns { id title type }
      items_page(limit: 3) {
        items {
          id
          name
          column_values { id text }
        }
      }
    }
  }`;
  
  try {
    const redsisData = await callMondayAPI(redsisQuery);
    console.log('   Board Name:', redsisData.boards[0].name);
    console.log('   Columns:', redsisData.boards[0].columns.map(c => `${c.title} (${c.id})`).join(', '));
    console.log('   Item count:', redsisData.boards[0].items_page.items.length);
  } catch (err) {
    console.log('   ❌ Error accessing board:', err.message);
  }

  console.log('\n\n4️⃣  LOGIN FLOW SIMULATION for mikehabib@redsis.com');
  const mikeUser = users.find(u => {
    const cols = u.column_values.reduce((acc, col) => {
      acc[col.id] = col.text || col.value;
      return acc;
    }, {});
    return cols.email_mkxpm2m0 === 'mikehabib@redsis.com';
  });

  if (mikeUser) {
    const userCols = mikeUser.column_values.reduce((acc, col) => {
      acc[col.id] = col.text || col.value;
      return acc;
    }, {});
    
    const companyName = userCols.dropdown_mkxpsjwd;
    console.log(`   ✅ User found: ${mikeUser.name}`);
    console.log(`   📧 Email: ${userCols.email_mkxpm2m0}`);
    console.log(`   🏢 Company: ${companyName || 'NOT ASSIGNED ❌'}`);
    
    if (companyName) {
      const userCompany = companies.find(c => c.name === companyName);
      if (userCompany) {
        const companyCols = userCompany.column_values.reduce((acc, col) => {
          acc[col.id] = col.text || col.value;
          return acc;
        }, {});
        
        const boardId = companyCols.dropdown_mkxpakmh;
        console.log(`   ✅ Company found in Company Board`);
        console.log(`   📋 Board ID from dropdown_mkxpakmh: ${boardId || 'NOT SET ❌'}`);
        
        if (boardId) {
          console.log(`   ✅ Login should work! Board ID: ${boardId}`);
        } else {
          console.log(`   ❌ PROBLEM: Company "${companyName}" has NO board ID in dropdown_mkxpakmh column`);
          console.log(`   🔧 FIX: Set dropdown_mkxpakmh = "18379446736" for company "${companyName}"`);
        }
      } else {
        console.log(`   ❌ PROBLEM: Company "${companyName}" NOT found in Company Board`);
      }
    }
  } else {
    console.log('   ❌ User mikehabib@redsis.com not found in User Board');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

checkBoards().catch(console.error);
