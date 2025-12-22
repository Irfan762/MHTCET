# MHT-CET College Predictor Platform 2025

A comprehensive web application for predicting college admissions based on MHT-CET (Maharashtra Common Entrance Test) scores.

## 🚀 Features

### 🎯 College Prediction
- **MHT-CET Specific**: Tailored for Maharashtra engineering admissions
- **Accurate Predictions**: Based on previous year cutoffs and trends
- **Category-wise Analysis**: Support for General, OBC, SC, ST, and EWS categories
- **Course Selection**: Multiple engineering branches available

### 📊 Placement Information
- **Detailed Statistics**: Average and highest packages for each college
- **Placement Rates**: Success rates for different colleges
- **Top Recruiters**: List of companies hiring from each college
- **Trend Analysis**: Overall placement trends for 2024

### 📄 PDF Report Generation
- **Downloadable Reports**: Generate detailed prediction reports
- **Comprehensive Data**: Includes all predictions, cutoffs, and placement info
- **Professional Format**: Well-formatted HTML reports for easy sharing

### 🏛️ Interactive College Details
- **College Modal**: Click any college for detailed information
- **College Images**: Download generated college images
- **Placement Reports**: Detailed placement statistics in PDF format
- **Course Syllabus**: Download complete syllabus for any course
- **Comprehensive Info**: Cutoffs, fees, courses, and highlights

### 🏛️ College Database
- **Top Colleges**: COEP, VJTI, Government College Aurangabad, Walchand Sangli
- **Detailed Information**: Fees, courses, cutoffs, and placement statistics
- **Real-time Data**: Updated information for 2025 admissions

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **RESTful API** architecture
- **CORS** enabled for cross-origin requests
- **Security** with Helmet.js

### Frontend
- **React 18** with modern hooks
- **Tailwind CSS** for responsive design
- **Axios** for API communication
- **Vite** for fast development

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation & Running

1. **Backend Setup**
   ```bash
   cd college-predictor-platform/backend
   npm install
   npm start
   ```
   Backend runs on: http://localhost:3001

2. **Frontend Setup**
   ```bash
   cd college-predictor-platform/frontend
   npm install
   npm run dev
   ```
   Frontend runs on: http://localhost:5173

## 📱 Usage

1. **Open the Application**: Navigate to http://localhost:5173
2. **Dashboard Overview**: View key statistics and quick prediction form
3. **Enter Your Details**:
   - MHT-CET Percentile (0-100)
   - Category (General/OBC/SC/ST/EWS)
   - Preferred Engineering Course
4. **Get Predictions**: Click "Get Detailed Predictions"
5. **Download Report**: Click "Download Report" for a detailed PDF
6. **Explore College Details**: Click on any college card to view:
   - College images (downloadable)
   - Detailed placement reports
   - Complete course syllabus
   - Comprehensive college information
7. **Navigate Sections**:
   - **Dashboard**: Overview and quick predictions
   - **Predictor**: Detailed prediction interface
   - **Colleges**: Browse all available colleges
   - **Placements**: View placement statistics and trends

## 🎓 Supported Colleges

1. **College of Engineering Pune (COEP)**
   - Cutoff: 99.5% (General)
   - Average Package: ₹8.5 LPA

2. **Veermata Jijabai Technological Institute (VJTI)**
   - Cutoff: 99.3% (General)
   - Average Package: ₹9.2 LPA

3. **Government College of Engineering, Aurangabad**
   - Cutoff: 97.5% (General)
   - Average Package: ₹6.5 LPA

4. **Walchand College of Engineering, Sangli**
   - Cutoff: 96.8% (General)
   - Average Package: ₹6.8 LPA

## 📋 Engineering Courses

- Computer Engineering
- Information Technology
- Electronics & Telecommunication
- Mechanical Engineering
- Civil Engineering
- Electrical Engineering

## 🔗 API Endpoints

- `GET /api/colleges` - Get all colleges data
- `POST /api/predictions` - Get admission predictions
- `POST /api/generate-pdf` - Generate prediction report
- `GET /health` - Health check

## 📊 MHT-CET 2025 Information

- **Application Period**: March 2025
- **Exam Date**: May 2025
- **Result Declaration**: June 2025
- **Counseling Process**: July 2025
- **Exam Duration**: 3 hours
- **Total Questions**: 150 (Physics, Chemistry, Mathematics)

## ⚠️ Important Notes

- Predictions are based on previous year data and trends
- Actual cutoffs may vary based on seat availability
- Always verify information from official MHT-CET website
- Keep backup college options during counseling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Developed for MHT-CET 2025 Aspirants** 🎓

## 🎉 Latest Updates (December 2025)

### ✨ New Features Added
- **🤖 AI Chat Assistant**: Interactive ChatGPT-style assistant for instant help
- **🔐 User Authentication**: Secure login/register with JWT tokens
- **🗄️ MongoDB Integration**: Complete database integration with user profiles
- **📊 Advanced Analytics**: Comprehensive placement statistics and trends
- **🎨 Ultra-Modern UI**: Glass morphism effects, animations, and professional styling
- **📱 Responsive Design**: Perfect experience across all devices
- **💾 Prediction History**: Save and track your prediction results
- **🏆 Enhanced College Profiles**: Detailed modal views with downloadable reports

### 🚀 Current Status
- **Backend**: Running on http://localhost:3001 ✅
- **Frontend**: Running on http://localhost:5174 ✅
- **Database**: MongoDB connected and seeded ✅
- **Authentication**: JWT-based secure authentication ✅
- **API**: All endpoints functional ✅

### 🎯 Ready to Use
The platform is fully functional with all features implemented:
1. **Dashboard**: Beautiful overview with statistics
2. **AI Predictor**: Complete prediction functionality
3. **College Explorer**: Browse and search colleges
4. **Placement Analytics**: Comprehensive career data
5. **Results**: View your prediction history
6. **AI Chat**: Get instant help and guidance