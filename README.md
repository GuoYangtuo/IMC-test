# Image Model Comparison Test (IMC-test)

A simple web application for testing and comparing image editing large language models from different providers.

## Supported Models

Currently integrated:
- **ByteDance Seedream 5.0 Pro** - High-quality image generation
- **ByteDance Seedream 5.0 Lite** - Lightweight version for faster results
- **Alibaba Qwen Image 3.0 Pro** - Alibaba's image generation model
- **OpenAI GPT Image 2.0** - OpenAI's image generation model

## Features

- Upload multiple input images
- Enter prompt text
- Send requests to multiple models simultaneously
- View side-by-side comparison of results
- Track token usage and costs
- Measure response time

## Getting Started

### Prerequisites

- Node.js 18.x or later
- API keys for the respective model providers

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with your API keys:

```env
# ByteDance (Volcengine)
VOLC_ACCESS_KEY=your_access_key
VOLC_SECRET_KEY=your_secret_key
VOLC_REGION=cn-beijing

# Alibaba Cloud
ALIBABA_API_KEY=your_alibaba_api_key
ALIBABA_REGION=cn-shanghai

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

## Usage

1. Open http://localhost:3000 in your browser
2. Upload one or more input images
3. Enter your prompt text
4. Select the models you want to test
5. Click "Run Test" to send requests to all selected models
6. View results, timing, and costs in the comparison table

## Cost Tracking

The application tracks:
- Token usage per model
- Input/output tokens
- Cost per 1K tokens (configurable)
- Total response time

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Zustand (state management)
