
## Dependencies

This project uses Node.js with the following key dependencies:

### Core Dependencies (from package.json)
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.3.0",
    "@hookform/resolvers": "^3.9.1",
    "@tanstack/react-query": "^5.60.5",
    "drizzle-orm": "^0.38.2",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "passport": "^0.7.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "wouter": "^3.3.5",
    "zod": "^3.23.8"
  }
}
```

## Prerequisites

1. **Node.js and npm**
   - Install Node.js v20.x or higher from https://nodejs.org/
   - npm will be installed automatically with Node.js
   ```bash
   # Check Node.js version
   node --version  # Should be 20.x or higher
   ```

2. **PostgreSQL**
   - Install PostgreSQL v15 or higher from https://www.postgresql.org/download/
   - Remember your database credentials for the next steps
   ```bash
   # Check PostgreSQL version
   psql --version
   ```

3. **Required API Keys**
   - Google Gemini API Key (from https://makersuite.google.com/app/apikey)
   - Plaid API Keys (from https://dashboard.plaid.com/signup)

## Installation Steps

1. **Setup Environment Variables**
   Create a `.env` file in the project root with:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
   GEMINI_API_KEY=your_gemini_api_key
   PLAID_CLIENT_ID=your_plaid_client_id
   PLAID_SECRET=your_plaid_secret
   ```

2. **Install Dependencies**
   ```bash
   # Navigate to project directory
   cd your-project-directory

   # Install all dependencies
   npm install
   ```

3. **Setup Database**
   ```bash
   # Create database tables
   npm run db:push
   ```

4. **Start the Application**
   ```bash
   # Start in development mode
   npm run dev

   # Or build and start in production mode
   npm run build
   npm start
   ```

The application will be available at http://localhost:5000

## Troubleshooting

### Common Issues and Solutions

1. **Node.js Version Error**
   ```bash
   # Check Node.js version
   node --version  # Should be 20.x or higher
   
   # If needed, install/update Node.js from https://nodejs.org/
   ```

2. **PostgreSQL Connection Issues**
   - Verify PostgreSQL is running:
     ```bash
     # On Linux/Mac
     sudo service postgresql status
     # Or
     pg_ctl status

     # On Windows (in PostgreSQL bin directory)
     pg_ctl status -D "C:\Program Files\PostgreSQL\15\data"
     ```
   - Check database connection:
     ```bash
     psql -d your_database_name -U your_username
     ```

3. **Dependencies Installation Errors**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Remove node_modules and package-lock.json
   rm -rf node_modules package-lock.json
   
   # Reinstall dependencies
   npm install
   ```

4. **Database Migration Issues**
   - Make sure PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Try recreating the database:
     ```sql
     DROP DATABASE your_database_name;
     CREATE DATABASE your_database_name;
     ```
   - Run migrations again:
     ```bash
     npm run db:push
     ```

## Development Tools

The project includes several development tools:
- Vite for development server and building
- ESBuild for JavaScript bundling
- TypeScript for type checking
- Drizzle Kit for database migrations
- Tailwind CSS for styling

## Additional Notes

- The development server includes hot module replacement (HMR)
- All API routes are prefixed with `/api`
- Frontend routes are managed by Wouter
- The project uses session-based authentication
- AI features require valid API keys

## Security Notes

- Never commit the `.env` file
- Keep API keys secure and rotate them regularly
- Use environment-specific API keys (development vs production)
- Regularly update dependencies for security patches
