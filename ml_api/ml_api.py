from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

# === LOAD MODEL ===
try:
    model = joblib.load("decision_tree_model.pkl")
    feature_encoder = joblib.load("target_encoder.pkl")
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")

FEATURE_COLUMNS = [
    "age", "job", "education", "month", "duration", "campaign",
    "poutcome", "cons.price.idx", "cons.conf.idx", "euribor3m", "nr.employed",
]

@app.post("/predict_batch")
def predict_batch():
    try:
        content = request.get_json()
        if not content or 'data' not in content:
            return jsonify({"error": "Invalid payload format. Key 'data' is required."}), 400

        rows = content['data'] # Ini adalah list of dictionaries
        if not rows:
            return jsonify([])

        # 1. Buat DataFrame dari input list (Batch Processing)
        df = pd.DataFrame(rows)
        
        # Simpan ID untuk dikembalikan nanti, tapi pisahkan dari fitur prediksi
        if 'id' not in df.columns:
             return jsonify({"error": "ID field is required for batch processing"}), 400
             
        ids = df['id'].tolist()
        
        # Ambil hanya kolom fitur yang sesuai urutan training
        # Pastikan kolom ada, jika tidak isi default/error (disini kita assume Laravel kirim lengkap)
        X_raw = df[FEATURE_COLUMNS]

        # 2. Encode seluruh batch sekaligus (Jauh lebih cepat)
        X_encoded = feature_encoder.transform(X_raw)

        # 3. Prediksi seluruh batch
        y_probs = model.predict_proba(X_encoded)
        y_preds = model.predict(X_encoded)

        # Cari index kelas "yes" atau "1"
        classes = list(getattr(model, "classes_", []))
        idx_positive = 1 # default biasanya index 1
        if "yes" in classes:
            idx_positive = classes.index("yes")
        elif 1 in classes:
            idx_positive = classes.index(1)

        results = []
        
        # 4. Gabungkan hasil dengan ID masing-masing
        # zip() menggabungkan ID, Prediksi, dan Probabilitas dalam satu loop
        for _id, pred, proba in zip(ids, y_preds, y_probs):
            # Ambil probabilitas kelas positif
            positive_prob = float(proba[idx_positive]) if len(proba) > idx_positive else float(max(proba))
            
            results.append({
                "id": int(_id),
                "label": str(pred),
                "probability": positive_prob
            })

        return jsonify(results)

    except Exception as e:
        # Print error di console biar kelihatan saat debug
        print(f"Error in batch prediction: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8001, debug=True)