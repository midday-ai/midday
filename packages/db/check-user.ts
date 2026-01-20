import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.mvvlgcoutyvdaaeuuvmz:takayuki1402--@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

async function checkUser() {
  const client = await pool.connect();
  try {
    // Check users table
    console.log('=== Users table ===');
    const users = await client.query('SELECT id, email, full_name, team_id FROM users LIMIT 10');
    console.log(JSON.stringify(users.rows, null, 2));

    // Check users_on_team table
    console.log('\n=== users_on_team table ===');
    const usersOnTeam = await client.query('SELECT * FROM users_on_team LIMIT 10');
    console.log(JSON.stringify(usersOnTeam.rows, null, 2));

    // Check if user's team_id matches users_on_team
    if (users.rows.length > 0) {
      const userId = users.rows[0].id;
      const userTeamId = users.rows[0].team_id;
      
      console.log('\n=== Checking user team membership ===');
      console.log('User ID:', userId);
      console.log('User team_id:', userTeamId);
      
      const membership = await client.query(
        'SELECT * FROM users_on_team WHERE user_id = $1', 
        [userId]
      );
      console.log('Memberships found:', membership.rows);
      
      if (membership.rows.length > 0 && userTeamId) {
        const hasAccess = membership.rows.some(m => m.team_id === userTeamId);
        console.log('Has access to team:', hasAccess);
      }
    }

  } finally {
    client.release();
    await pool.end();
  }
}

checkUser().catch(console.error);
