# 📚 BookBuddy

BookBuddy is a modern Angular application for book lovers to track, review, and share their reading experience.  
It integrates with Firebase for authentication, database, and storage, making it fast, secure, and scalable.

---

## 🌐 Live Demo

You can check out the live version of **BookBuddy** here:  
👉 [BookBuddy Website](https://book-buddy-18f31.web.app/)  


---


## 🚀 Tech Stack

- **Frontend Framework:** Angular 17+ with Standalone Components
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom Tailwind + Flowbite elements
- **Backend / Hosting:** Firebase Hosting
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth (Email/Password & Google Sign-In)
- **Storage:** Firebase Storage for profile images & book covers
- **State Management:** Angular Signals
- **Routing:** Angular Router

---

## ✨ Features

- 🔑 **User Authentication** (Email/Password & Google Sign-In)
- 📝 **Add, Edit, Delete Books**
- ⭐ **Rate & Review Books**
- ❤️ **Favorite Books List**
- 📊 **Personal Statistics** (books added, reviews made, favorites)
- 📷 **Profile Image Upload** (stored in Firebase Storage)
- 📱 **Responsive Design** (mobile-first)
- 🔍 **Search & Filter Books**
- 🔐 **Firestore Security Rules** to protect user data

---

## ✨ Features

- 🔑 **User Authentication** (Email/Password & Google Sign-In)
- 📝 **Add, Edit, Delete Books**
- ⭐ **Rate & Review Books**
- ❤️ **Favorite Books List**
- 📊 **Personal Statistics** (books added, reviews made, favorites)
- 📷 **Profile Image Upload** (stored in Firebase Storage)
- 📱 **Responsive Design** (mobile-first)
- 🔍 **Search & Filter Books**
- 🔐 **Firestore Security Rules** to protect user data

---

## 📂 Project Structure

```
src/
├── app/
│   ├── core/              # Core services & models
│   ├── features/          # Main app features (books, reviews, profile)
│   ├── shared/            # Shared components & utilities
│   ├── app.routes.ts      # Application routes
│   └── app.config.ts      # App-wide configuration
├── environments/          # Environment configs (with Firebase credentials)
│   ├── environment.ts
│   └── environment.prod.ts
└── main.ts                # App bootstrap
```

---

## 🔐 Environment Setup

You'll need to set up your Firebase credentials in `src/environments/environment.ts`.  
Create your Firebase project at [Firebase Console](https://console.firebase.google.com/) and add your configuration.

---

## 🛠️ Installation

### Prerequisites

Make sure you have Angular CLI installed globally:

```bash
npm install -g @angular/cli
```

### Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/georgi712/book-buddy.git
cd book-buddy
cd client
npm install
```

---

## 🏃‍♂️ Running Locally

Start the development server:

```bash
ng serve
```

The app will be available at: `http://localhost:4200/`