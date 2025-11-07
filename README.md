# SlideDeck 2.0

A smart slide library for IT companies with Figma integration, automatic categorization, and presentation building capabilities.

## Features

### Core Functionality
- **Slide Import from Figma**: Import slides directly from Figma files with automatic text extraction
- **Smart Categorization**: Hierarchical category system with automatic categorization based on content
- **Advanced Search**: Search by text, tags, categories, or extracted content with Russian synonym support
- **Presentation Builder**: Drag-and-drop interface to build presentations from your slide library
- **Slide Management**: Edit slide metadata, tags, and categories with a user-friendly interface

### Category System
The application uses a comprehensive hierarchical category system:

#### Main Categories
- **📄 Covers** - Presentation covers and title slides
  - Main Covers
  - Section Covers  
  - Thank You slides
- **🛠️ Services** - Service offerings and capabilities
  - Web Development
  - Mobile Development
  - UI/UX Design
  - Consulting
- **📊 Cases** - Case studies and project showcases
  - E-commerce
  - Fintech
  - Healthcare
  - Education
- **⚡ Technology** - Technology stack and tools
  - Frontend (React, Vue, Angular)
  - Backend (Node.js, Python, Java)
  - Mobile (React Native, Flutter)
  - DevOps (Docker, Kubernetes, AWS)
- **📈 Business** - Business and marketing content
  - Strategy
  - Analytics
  - Marketing
  - Sales

### Automation Features
- **Text Extraction**: Automatically extracts text from Figma nodes
- **Tag Generation**: Creates relevant tags based on extracted content
- **Category Detection**: Suggests appropriate categories based on content analysis
- **Smart Search**: Supports Russian synonyms and related terms

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **External APIs**: Figma API for slide import
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Figma Access Token (for import functionality)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SlideDeck-2.0
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your Figma access token:
```
FIGMA_ACCESS_TOKEN=your_figma_access_token_here
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### Importing Slides from Figma

1. Click "Import from Figma" in the header
2. Paste a Figma file URL
3. The system will automatically:
   - Extract all frames as slides
   - Generate tags based on content
   - Categorize slides appropriately
   - Create preview images

### Building Presentations

1. Browse slides using the category tree or search
2. Click "Add to Presentation" on desired slides
3. Use the presentation panel at the bottom to:
   - Reorder slides with drag-and-drop
   - Remove slides from the presentation
   - Create a new presentation in the library
4. Click "Create Presentation" to save to your library

### Managing Slides

- **View**: Click on any slide to see details and Figma link
- **Edit**: Use the edit button to modify title, description, tags, and category
- **Search**: Use the search bar to find slides by content or tags
- **Filter**: Use the category tree to filter by specific categories

## API Endpoints

### Slides
- `GET /api/slides` - Get slides with pagination and filtering
- `POST /api/slides/import` - Import slides from Figma
- `PUT /api/slides/[id]` - Update slide metadata
- `DELETE /api/slides/[id]` - Delete a slide

### Presentations
- `POST /api/presentations/create` - Create a new presentation
- `GET /api/presentations` - Get all presentations
- `GET /api/presentations/[id]` - Get specific presentation

## Database Schema

The application uses Prisma with the following main models:

- **Slide**: Core slide data with metadata
- **Category**: Hierarchical category system
- **Tag**: Tag system for slide organization
- **Presentation**: User-created presentations
- **PresentationSlide**: Junction table for presentation-slide relationships

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository. 