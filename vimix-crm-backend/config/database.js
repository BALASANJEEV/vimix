import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Fix for Windows / Node SRV resolution issues with mongodb+srv
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // ignore if dns server setting is unsupported in environment
}

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vimix:vimix@cluster0.vvgdhov.mongodb.net/vimix_crm?retryWrites=true&w=majority&appName=Cluster0';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export default mongoose;

// CI/CD Pipeline Configuration
// This section is for GitHub Actions to automate the build and deployment process
// File: .github/workflows/ci-cd-pipeline.yml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install backend dependencies
        working-directory: vimix-crm-backend
        run: |
          npm install

      - name: Build backend
        working-directory: vimix-crm-backend
        run: |
          npm run build

      - name: Install frontend dependencies
        working-directory: vimix-crm-frontend
        run: |
          npm install

      - name: Build frontend
        working-directory: vimix-crm-frontend
        run: |
          npm run build

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/deployment
            docker-compose down
            docker-compose up -d --build