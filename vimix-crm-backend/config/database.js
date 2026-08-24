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

// GitHub Actions Workflow for AWS ECS Deployment
export const githubActionsWorkflow = `
name: Deploy to AWS ECS

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build the application
        run: npm run build

      - name: Log in to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ secrets.ECR_REPOSITORY }}:latest

  deploy:
    runs-on: ubuntu-latest
    needs: build
    timeout-minutes: 10
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Update ECS service
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ secrets.TASK_DEFINITION }}
          service: ${{ secrets.ECS_SERVICE }}
          cluster: ${{ secrets.ECS_CLUSTER }}
          wait-for-service-stability: true
`;