const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';

async function testFullUserUpdate() {
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

  // Get a user
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

  console.log('Testing full update as portal does it:');
  
  const columnValues = {
    email_mkxpm2m0: { email: 'test@example.com', text: 'test@example.com' },
    dropdown_mkxpsjwd: { labels: ['Redsis'] }
  };

  console.log('Column values:', JSON.stringify(columnValues, null, 2));

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
        columnValues: JSON.stringify(columnValues)
      }
    })
  });

  const data = await response.json();
  if (data.errors) {
    console.log('❌ Error:', JSON.stringify(data.errors, null, 2));
  } else {
    console.log('✅ Success');
  }
}

testFullUserUpdate().catch(console.error);
