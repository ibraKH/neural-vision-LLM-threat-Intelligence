# Roya

## Project Overview
The **Neural Vision & LLM Threat Intelligence System** is an advanced AI-powered surveillance and intelligence dashboard designed to enhance automated threat detection, suspect profiling, and situational awareness.

The system integrates state-of-the-art computer vision models with Large Language Models (LLMs) to provide real-time analysis of video feeds, identify potential threats, localize incidents using geo-spatial matching, and generate comprehensive narrative reports for security personnel.

---

## Tech Stack

### **Frontend**
The user interface is built as a high-performance, responsive Single Page Application (SPA).
*   **Framework:** [React 18](https://react.dev/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS for custom effects.
*   **Maps:** [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) for interactive geospatial visualization.
*   **Animations:** [Framer Motion](https://www.framer.com/motion/) for fluid UI transitions.
*   **Icons:** [Lucide React](https://lucide.dev/)

### **Backend**
A robust, high-performance API server handling AI inference and data processing.
*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python).
*   **Server:** [Uvicorn](https://www.uvicorn.org/) for ASGI serving.
*   **Data Processing:** Pandas, NumPy.

### **AI & Computer Vision**
The core intelligence layer powering detection and analysis.
*   **Object Detection:** [Ultralytics YOLO](https://github.com/ultralytics/ultralytics) (Real-time threat detection).
*   **Face Recognition:** `face_recognition` library (Suspect identification).
*   **OCR:** [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) (Text extraction from visual data).
*   **Machine Learning:** PyTorch, Scikit-learn.
*   **Image Processing:** OpenCV (`opencv-python`), Pillow.
*   **Generative AI:** Integration with LLMs for narrative generation and strategic action planning (Google Generative AI).

---

## Key Components & Features

### 1. **Real-time Threat Detection**
*   Utilizes YOLO-based models to detect weapons, aggressive behavior, or unauthorized personnel in real-time.
*   Visualizes bounding boxes and confidence scores directly on the live feed.

### 2. **GPS Radar & Geo-Localization**
*   **`LocationRecognizer`**: A specialized module that matches scene imagery against a database of known locations to pinpoint coordinates (Lat/Lng).
*   Visualizes threats on a dynamic Leaflet-based map with radar animations.

### 3. **Suspect Profiling**
*   **Biometric Analysis**: Matches faces against a watchlist using facial recognition.
*   **Profile Card**: Displays critical match data, ID confidence, and historical records.

### 4. **CCTV Network Monitoring**
*   Simulates a multi-camera network grid.
*   Allows switching between active feeds to track movement across different sectors.

### 5. **Intelligence Dashboard**
*   **Metric Cards**: Real-time stats on "Threat Level", "Active Cameras", and "System Status".
*   **Timeline Journey**: Chronological tracking of detected events.
*   **Narrative Intel**: LLM-generated summaries of the current threat landscape.
*   **Action Plan**: automated, actionable steps recommended for security teams.

---

## Data Sources Used

### **1. Balady Services (30%)**
*   Leveraged Balady data for mapping commercial locations.
*   Based on regulations regarding camera availability in commercial establishments.

### **2. Google Map API (50%)**
*   Analyzed and cleaned a dataset of **1000 images** to train the location recognition model. when scaling the project, we will use the photos from street view in apps like hudhud.sa or images taken by the 360 cars.

### **3. Absher Services (Mock Data) (20%)**
*   Synthetic data used to test the algorithm.
*   Includes mock personal photos and names of wanted individuals for suspect profiling.

---

## Getting Started

### Prerequisites
*   **Node.js** (v18+ recommended)
*   **Python** (v3.9+)

### Backend Setup
Navigate to the root directory and install Python dependencies.

```bash
# Install dependencies
pip install -r requirements.txt

# Navigate to backend and run the server
cd backend
uvicorn server:app --reload --port 8000
```

### Frontend Setup
Navigate to the frontend directory, install packages, and start the development server.

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```
