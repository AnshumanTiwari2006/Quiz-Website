# QuizMaster - The Ultimate Fullstack Quiz Ecosystem

Welcome to **QuizMaster**, a sophisticated, high-performance quiz platform designed for educators, administrators, and students. Built with a modern tech stack and a focus on scalability and user experience, QuizMaster provides a comprehensive suite for creating, managing, and taking quizzes with advanced analytics and role-based access control.

---

## 🚀 Key Features

### 👨‍🏫 For Educators & Admins (Educator Central)
- **Dynamic Quiz Creation**: Effortlessly build quizzes with multiple-choice questions.
- **Bulk Import**: Powered by `PapaParse`, import hundreds of questions instantly via CSV.
- **Advanced Analytics**: Real-time data visualization using `Recharts` to track student performance and quiz engagement.
- **Quiz Management**: Full control to activate, deactivate, or modify existing quizzes.

### 👑 For Master Administrators (Master Panel)
- **Global Oversight**: Monitor all quizzes across the platform.
- **Role-Based Access Control (RBAC)**: Secure access for `Admin`, `Moderator`, and `Viewer` roles.
- **Global Announcements**: Broadcast important updates to the entire user base.
- **System Metrics**: High-level overview of platform health and user activity.

### 🎓 For Students
- **Immersive Quiz Experience**: A sleek, distraction-free interface for taking quizzes.
- **Performance History**: Track your progress and review past scores.
- **Interactive Leaderboards**: See how you rank against your peers.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)
- **Navigation**: [React Router DOM](https://reactrouter.com/)

### Backend & Infrastructure
- **Authentication**: [Firebase Auth](https://firebase.google.com/products/auth)
- **Database**: [Cloud Firestore](https://firebase.google.com/products/firestore) (NoSQL)
- **Hosting**: Recommended [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/)

---

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Quiz-Fullstack.git
   cd Quiz-Fullstack/Frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   Create a `.env` file in the root of the `Frontend` directory and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```text
src/
├── components/      # Reusable UI components (Navbar, ProtectedRoute, etc.)
├── contexts/        # React Contexts (AuthContext)
├── lib/             # Third-party configurations (Firebase)
├── pages/           # Main page components (AdminDashboard, CreateQuiz, etc.)
├── types/           # TypeScript interfaces and types
└── assets/          # Static images and icons
```

---

## 📊 Bulk Import Format

To import questions via CSV, ensure your file follows this format:
`question, type, options, answer, points`

| question | type | options | answer | points |
| :--- | :--- | :--- | :--- | :--- |
| What is 2+2? | mcq | 3 \| 4 \| 5 \| 6 | 4 | 10 |

*Note: Options should be separated by a pipe (`|`) character.*

---

## 🔐 Role Hierarchy

1.  **Admin**: Full access to Master Panel, Educator Central, and all platform management.
2.  **Moderator**: High-level access to management tools and analytics.
3.  **Viewer**: Read-only access to Master Panel and certain administrative dashboards.
4.  **Teacher**: Create and manage their own quizzes and view analytics.
5.  **Student**: Can view, play, and track their own quiz performance.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the MIT License.

---

*Built with ❤️ for better education.*
