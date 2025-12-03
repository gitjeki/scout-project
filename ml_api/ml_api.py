from flask import Flask, request, jsonify
import joblib
import pandas as pd
import sys
import os
import category_encoders # Pastikan library ini terdeteksi

app = Flask(__name__)

# --- CONFIG ---
MODEL_FILE = "decision_tree_model.pkl"
ENCODER_FILE = "target_encoder.pkl"

# --- 1. LOAD MODEL (CRITICAL SECTION) ---
print("--- STARTING ML API ---")
print(f"Checking files in: {os.getcwd()}")

if not os.path.exists(MODEL_FILE) or not os.path.exists(ENCODER_FILE):
    print(f"ERROR: File {MODEL_FILE} atau {ENCODER_FILE} TIDAK DITEMUKAN!")
    sys.exit(1) # Matikan program jika file hilang

try:
    print("Loading model & encoder...")
    model = joblib.load(MODEL_FILE)
    feature_encoder = joblib.load(ENCODER_FILE)
    print(">>> SUCCESS: Model & Encoder loaded perfectly!")
except Exception as e:
    print("!!! FATAL ERROR SAAT LOAD !!!")
    print(f"Penyebab: {e}")
    print("Solusi: Jalankan 'pip install category_encoders' atau cek file .pkl")
    sys.exit(1) # Matikan program jika load gagal

# --- 2. DEFINISI KOLOM (GLOBAL) ---
# Harus sama persis dengan urutan saat training
FEATURE_COLUMNS = [
    "age", "job", "education", "month", "duration", "campaign",
    "poutcome", "cons.price.idx", "cons.conf.idx", "euribor3m", "nr.employed",
]

@app.post("/predict_batch")
def predict_batch():
    try:
        # Cek apakah encoder benar-benar ada di memori
        if 'feature_encoder' not in globals():
            raise Exception("Critical: feature_encoder hilang dari memori!")

        content = request.get_json()
        if not content or 'data' not in content:
            return jsonify({"error": "No data provided"}), 400

        rows = content['data']
        if not rows:
            return jsonify([])

        # Convert ke DataFrame
        df = pd.DataFrame(rows)
        ids = df['id'].tolist()
        
        # Seleksi Kolom
        try:
            X_raw = df[FEATURE_COLUMNS]
        except KeyError as e:
            return jsonify({"error": f"Missing column: {e}"}), 400

        # Transformasi
        X_encoded = feature_encoder.transform(X_raw)

        # Prediksi
        y_probs = model.predict_proba(X_encoded)
        
        # Ambil Index Kelas Positif ('yes' atau 1)
        idx_positive = 1
        if hasattr(model, "classes_"):
            classes = list(model.classes_)
            if "yes" in classes:
                idx_positive = classes.index("yes")
            elif 1 in classes:
                idx_positive = classes.index(1)

        results = []
        for _id, proba in zip(ids, y_probs):
            # Ambil probabilitas sesuai index kelas 'yes'
            p_score = float(proba[idx_positive]) if len(proba) > idx_positive else float(proba[0])
            
            results.append({
                "id": int(_id),
                "probability": p_score
            })

        print(f"Processed {len(results)} rows successfully.")
        return jsonify(results)

    except Exception as e:
        print(f"RUNTIME ERROR: {e}") # Muncul di terminal
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Matikan reloader agar tidak loading 2x (membingungkan log)
    print("Server running on port 8001...")
    app.run(host="127.0.0.1", port=8001, debug=False)