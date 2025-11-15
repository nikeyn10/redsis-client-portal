const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';

const BOARDS = {
  COMPANY: '18379404757',
  USER: '18379351659',
  SERVICE_PROVIDER: '18379446736'
};

async function checkBoard(boardId, name) {
  const query = `
    query {
      boards(ids: ${boardId}) {
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
  const statusColumn = data.data.boards[0].columns.find(c => c.type === 'color');
  
  console.log(`\n========== ${name} BOARD ==========`);
  if (statusColumn) {
    console.log(`Status Column ID: ${statusColumn.id}`);
    console.log(`Status Column Title: ${statusColumn.title}`);
    const settings = JSON.parse(statusColumn.settings_str);
    console.log('Available Labels:');
    Object.entries(settings.labels).forEach(([index, label]) => {
      console.log(`  ${index}: ${label} (${settings.labels_colors[index].color})`);
    });
  }
}

async function run() {
  await checkBoard(BOARDS.COMPANY, 'COMPANY');
  await checkBoard(BOARDS.USER, 'USER');
  await checkBoard(BOARDS.SERVICE_PROVIDER, 'SERVICE PROVIDER');
}

run().catch(console.error);
