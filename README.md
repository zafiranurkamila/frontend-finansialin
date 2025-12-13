# FinansiaLin - Frontend

A modern financial management web application built with Next.js 14 (App Router), designed to help users track transactions, manage budgets, and analyze their financial data. 

## 🚀 Features

- **User Authentication** - Login and registration system
- **Dashboard** - Overview of financial status and insights
- **Transaction Management** - Track and categorize income and expenses
- **Budget Planning** - Create and monitor budgets
- **Analytics** - Visualize financial data with charts and reports
- **AI Integration** - Powered by Google Generative AI for smart insights
- **Export Functionality** - Generate PDF reports and Excel exports

## 📋 Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn package manager

## 🛠️ Installation

1. Clone the repository: 
```bash
git clone https://github.com/zafiranurkamila/frontend-finansialin.git
cd frontend-finansialin
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to: 
```
http://localhost:3001
```

## 📦 Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build the application for production
- `npm start` - Start production server on port 3001
- `npm run lint` - Run ESLint to check code quality

## 🗂️ Project Structure

```
frontend-finansialin/
├── app/
│   ├── analytics/          # Analytics and reporting pages
│   ├── api/                # API routes
│   ├── budget/             # Budget management pages
│   ├── components/         # Reusable React components
│   ├── context/            # React Context providers
│   ├── dashboard/          # Dashboard pages
│   ├── lib/                # Utility libraries
│   ├── login/              # Login page and components
│   ├── register/           # Registration page and components
│   ├── settings/           # Settings pages
│   ├── style/              # Component-specific styles
│   ├── transaction/        # Transaction management pages
│   ├── utils/              # Utility functions
│   ├── globals.css         # Global styles
│   ├── layout.jsx          # Root layout component
│   └── page.jsx            # Home page
├── public/                 # Static assets
├── . gitignore
├── next.config.js          # Next.js configuration
├── package.json
└── README.md
```

## 🔧 Technologies & Dependencies

### Core Framework
- **Next.js 14. 2. 4** - React framework with App Router
- **React 18.3.1** - UI library
- **React DOM 18.3.1** - React rendering

### Key Libraries
- **@google/genai** - Google Generative AI integration
- **@heroicons/react** - Icon components
- **recharts** - Data visualization and charts
- **jspdf & jspdf-autotable** - PDF generation
- **xlsx** - Excel file generation
- **react-icons** - Additional icon library

## 🌐 Routes

- `/` - Home page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Main dashboard
- `/transaction` - Transaction management
- `/budget` - Budget planning
- `/analytics` - Financial analytics
- `/settings` - User settings

## 📝 Migration Notes

This project has been migrated from Create React App to Next. js 14 with App Router: 

- ✅ File-based routing replaces `react-router-dom`
- ✅ Global styles consolidated into `app/globals.css`
- ✅ Static assets moved to `/public` directory
- ✅ Client Components marked with `'use client'` directive for interactivity
- ✅ Server and Client Components separation for optimal performance

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  Feel free to check the issues page. 

## 📄 License

This project is available for personal and educational use. 

## 👤 Author

**Zafira Nur Kamila**
- GitHub: [@zafiranurkamila](https://github.com/zafiranurkamila)

## 🙏 Acknowledgments

- Built with Next.js and React
- Icons by Heroicons and React Icons
- Charts by Recharts
- AI powered by Google Generative AI