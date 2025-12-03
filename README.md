# Roya 

> *A hackathon idea*

I engineered a modular pipeline that acts like a digital forensic team. It runs locally, it's fast, and it's smart.

### 1. GPS Geolocation (The "Where")
I trained a custom **ResNet50** model on thousands of Saudi street views. It looks at a mountain in Taif or a building in Riyadh and gives me exact coordinates. No metadata needed. It's like having a local guide trapped in a GPU.

### 2. Biometrics (The "Who")
Uses advanced face recognition to match suspects against a "wanted" database.

### 3. Threat Detection (The "What")
I implemented a **YOLO**-based object detection system that spots weapons (guns, knives) instantly.

### 4. OCR Environment (The "Context")
Reads Arabic and English text from signs, license plates, and documents using **PaddleOCR**. It adds context to the location—reading shop names to verify the GPS.

### 5. CCTV Retrieval (The "Grid")
Once we know the location, I simulate a connection to the National Camera Registry to pull up nearby surveillance nodes. It calculates distances and coverage angles.

### 6. Reasoning Engine (The "Why")
I added **Llama 3.1** to analyze all this aggregated data. It writes a full intelligence report, suggests an action plan, and even predicts suspect movement based on the terrain.

## The Frontend

*   **React + Vite**
*   **Tailwind CSS**
*   **Framer Motion**
*   **Leaflet Maps**

## How to Run It

**1. Start the backend:**
```bash
cd backend
python -m app.api.api
```

**2. Start the Frontend:**
```bash
cd frontend
npm run dev
```

**3. Analyze:**
Open `http://localhost:5173`, drag in an image, and watch the magic happen.

---
