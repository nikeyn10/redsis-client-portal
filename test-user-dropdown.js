const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';

async function testUserUpdate() {
  const mutation = `
    mutation UpdateUser($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
      change_multiple_column_values(
        board_id: $boardId,
        item_id: $itemId,
        column_values: $columnValues
      ) {
        id
      }
    }
  `;

  // First get a user ID
  const getQuery = `
    query {
      boards(ids: 18379351659) {
        items_page(limit: 1) {
          items {
            id
            name
          }
        }
      }
    }
  `;

  const getResponse = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': MONDAY_API_KEY
    },
    body: JSON.stringify({ query: getQuery })
  });

  const getData = await getResponse.json();
  const userId = getData.data.boards[0].items_page.items[0]?.id;

  if (!userId) {
    console.log('No users found to test with');
    return;
  }

  console.log('Testing update on user:', userId);

  // Test with label IDs
  const testCases = [
    { name: 'Using label ID', values: { dropdown_mkxpsjwd: { labels: [1] } } },
    { name: 'Using label name', values: { dropdown_mkxpsjwd: { labels: ['Redsis'] } } },
    { name: 'Using label ID in ids', values: { dropdown_mkxpsjwd: { ids: [1] } } }
  ];

  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.name}`);
    console.log('Column values:', JSON.stringify(testCase.values));

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_KEY
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          boardId: '18379351659',
          itemId: userId,
          columnValues: JSON.stringify(testCase.values)
        }
      })
    });

    const data = await response.json();
    if (data.errors) {
      console.log('❌ Error:', data.errors[0].message);
    } else {
      console.log('✅ Success');
    }
  }
}

testUserUpdate().catch(console.error);
