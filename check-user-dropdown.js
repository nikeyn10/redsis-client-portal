const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';

async function checkDropdown() {
  const query = `
    query {
      boards(ids: 18379351659) {
        columns {
          id
          title
          type
          settings_str
        }
      }
    }
  `;

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': MONDAY_API_KEY
    },
    body: JSON.stringify({ query })
  });

  const data = await response.json();
  const dropdown = data.data.boards[0].columns.find(c => c.id === 'dropdown_mkxpsjwd');
  
  console.log('Company Dropdown Column:');
  console.log('ID:', dropdown.id);
  console.log('Title:', dropdown.title);
  console.log('Type:', dropdown.type);
  console.log('Settings:', JSON.parse(dropdown.settings_str));
}

checkDropdown().catch(console.error);
