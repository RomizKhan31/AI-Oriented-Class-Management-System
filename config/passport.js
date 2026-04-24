const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const pool = require('./db');

// Helper to process OAuth profiles
const processOAuthProfile = async (provider, profile, done) => {
    try {
        const email = (profile.emails && profile.emails.length > 0) 
            ? profile.emails[0].value 
            : `${profile.username || profile.id}@github.local`;
            
        if (!email) {
            return done(new Error(`No email found in ${provider} profile`), null);
        }

        // Check if user exists by provider_id
        let [rows] = await pool.query('SELECT * FROM users WHERE provider_id = ? AND auth_provider = ?', [profile.id, provider]);
        
        if (rows.length > 0) {
            return done(null, rows[0]);
        }

        // Check if user exists by email
        [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            // Link account
            await pool.query('UPDATE users SET auth_provider = ?, provider_id = ? WHERE email = ?', [provider, profile.id, email]);
            return done(null, rows[0]);
        }

        // Create new user (default STUDENT)
        const newId = `S${Date.now()}`;
        const name = profile.displayName || profile.username || 'User';
        
        await pool.query(
            'INSERT INTO users (id, name, email, role, auth_provider, provider_id) VALUES (?, ?, ?, ?, ?, ?)',
            [newId, name, email, 'STUDENT', provider, profile.id]
        );

        [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [newId]);
        return done(null, rows[0]);

    } catch (error) {
        return done(error, null);
    }
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
    callbackURL: "/api/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
      processOAuthProfile('GOOGLE', profile, done);
  }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'dummy_client_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy_client_secret',
    callbackURL: "/api/auth/github/callback"
  },
  (accessToken, refreshToken, profile, done) => {
      processOAuthProfile('GITHUB', profile, done);
  }
));

// We are using JWT, so we don't strictly need to serialize/deserialize
// But passport might require it if we use sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      if(rows.length > 0) {
          done(null, rows[0]);
      } else {
          done(null, false);
      }
  } catch (err) {
      done(err, null);
  }
});

module.exports = passport;
