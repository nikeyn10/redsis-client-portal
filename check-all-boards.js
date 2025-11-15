const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';

const boards = {
  'Company': '18379404757',
  'User': '18379351659',
  'Service Provider': '18379446736'
};

async function checkAllBoards() {
  for (const [name, id] of Object.entries(boards)) {
    console.log(`\n========== ${name} Board (${id}) ==========\n`);
    
    const query = `
      query {
        boards(ids: [${id}]) {
          name
          columns {
            id
            title
            type
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
    if (data.data?.boards?.[0]) {
      const board = data.data.boards[0];
      console.log(`Board Name: ${board.name}\n`);
      console.log('Columns:');
      board.columns.forEach(col => {
        console.log(`  ${col.title.padEnd(25)} | ${col.id.padEnd(20)} | ${col.type}`);
      });
    }
  }
}

checkAllBoards().catch(console.error);
