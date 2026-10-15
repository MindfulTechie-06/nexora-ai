# Nexora AI 💬

**A modern real-time chat application built with Next.js and InsForge.**

Nexora AI is a web-based chat application designed to provide a smooth, responsive messaging experience with authentication and real-time communication. It uses InsForge as its backend platform for authentication, database operations, real-time functionality, and storage.

## ✨ Features

- 💬 **Real-Time Messaging** — Send and receive messages with real-time updates.
- 🔐 **Authentication** — User authentication and account access.
- ⚡ **Responsive Interface** — A modern UI designed for a smooth experience across devices.
- 🗄️ **Backend Integration** — Powered by InsForge for backend services.
- 📦 **Storage Integration** — Backend storage support through InsForge.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Frontend framework |
| React | UI development |
| TypeScript / JavaScript | Application logic, depending on project configuration |
| InsForge | Backend, authentication, real-time services, and storage |
| CSS / Tailwind CSS | Styling, depending on project configuration |

## 🚀 Getting Started

Follow these steps to run Nexora AI locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- A configured InsForge project

### 1. Clone the repository

```bash
git clone https://github.com/MindfulTechie-06/nexora-ai.git
```

### 2. Navigate to the project directory

```bash
cd nexora-ai
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file in the project root and add the environment variables required by your InsForge configuration.

For example, **use the actual variable names from your project code**:

```env
NEXT_PUBLIC_INSFORGE_URL=your_insforge_project_url
NEXT_PUBLIC_INSFORGE_ANON_KEY=your_public_client_key
```

The names above are examples. If your application uses different variable names, use those instead.

Never commit `.env.local`, private credentials, or service-role keys to GitHub.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment

Nexora AI's backend is deployed through InsForge.

To run the application in another environment, configure the required environment variables and ensure the frontend is connected to the correct InsForge project.

**Live Demo:** Add your deployed application URL here.

## 📁 Project Structure

The project uses a Next.js application structure. Exact directories may vary depending on the implementation.

```text
nexora-ai/
├── public/          # Static assets
├── src/             # Application source code, if used
├── app/             # App Router pages, if used
├── components/      # Reusable UI components, if used
├── package.json     # Dependencies and scripts
├── .gitignore       # Ignored files and folders
└── README.md        # Project documentation
```

## 🔒 Security

- Keep local environment files out of version control.
- Never publish private API keys, service-role keys, or credentials.
- Configure backend access policies and permissions appropriately.
- Only expose client-side keys intended to be public.

## 🎯 Project Goal

The goal of Nexora AI is to build a modern, accessible, and reliable real-time messaging experience by combining a responsive web interface with managed backend services.

## 👨‍💻 Author

**Himanish Chatterjee**

- GitHub: [@MindfulTechie-06](https://github.com/MindfulTechie-06)

---

If you find this project interesting, consider giving the repository a ⭐ on GitHub!
