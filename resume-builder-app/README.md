 AI-Powered ATS-Friendly Resume Builder for Students

## Project Overview

This is a comprehensive, AI-powered web application designed to help students create professional, Applicant Tracking System (ATS)-friendly resumes with ease. The platform offers an intuitive interface, AI-guided content suggestions, and a unique **Resume Score Checker** feature to optimize resumes against specific job descriptions, significantly improving a student's chances of passing initial screening processes.

## Key Features

* **User Authentication & Management:** Secure login and signup functionality using Firebase Email/Password authentication, allowing individual users to manage their resumes privately.
* **Intuitive Resume Editor:**
    * **Drag-and-Drop Section Reordering:** Customize the layout of sections like Education, Experience, Projects, Skills, etc.
    * **Dynamic Content Fields:** Easily add, edit, and remove entries within each resume section (e.g., multiple bullet points for experience, multiple skills).
    * **Live Preview:** See real-time updates of your resume in an ATS-friendly format as you type.
* **AI-Guided Suggestions:**
    * Leverages the **Gemini API** to provide intelligent suggestions for crafting impactful summaries, refining bullet points with action verbs and quantifiable achievements, and identifying relevant skills.
* **ATS-Friendly Templates:** Focuses on clean, classic, and simple layouts (single-column, left-aligned headings, clear fonts, black & white) to ensure maximum compatibility with Applicant Tracking Systems.
* **Resume Score Checker:**
    * **Targeted Analysis:** Compares your resume's content (skills, experience, keywords) directly against a pasted job description.
    * **Match Score & Feedback:** Calculates a relevance score and provides actionable insights, highlighting missing hard/soft skills and keywords.
    * **AI-Integrated Suggestions:** Offers AI-powered recommendations to rewrite sections or add missing elements for better job alignment.
    * **Section-Level Feedback:** Provides specific advice on formatting, ATS compatibility, and structural improvements.
* **Download & Export:** Allows users to download their generated resumes (simulated PDF export for demonstration).
* **Responsive Design:** Optimized for seamless use across desktop and mobile browsers.

## Technical Stack

* **Frontend:**
    * **React.js:** For building a dynamic and component-based user interface.
    * **Tailwind CSS:** A utility-first CSS framework for rapid and responsive UI development.
    * **Lucide React:** For crisp, customizable SVG icons.
* **Backend (Implicit/Managed):**
    * **Firebase Authentication:** For secure user signup, login, and session management.
    * **Firebase Firestore:** A NoSQL cloud database used for storing user data and resume content in a structured, real-time manner. Data is secured with Firestore Security Rules, ensuring users can only access their own information.
* **AI Integration:**
    * **Gemini API (gemini-2.0-flash):** Utilized for generating content suggestions (summaries, bullet points, skills) and performing resume-to-job description matching and analysis.

## Project Goals

* Provide a simple, fast, and intuitive experience for students.
* Generate resumes highly optimized for ATS parsing.
* Ensure data privacy and provide export options.
* Built with cloud deployment readiness in mind.

---
