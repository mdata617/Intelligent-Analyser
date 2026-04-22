from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------------- HOME ----------------

@app.route("/")
def home():
    return render_template("index.html")


# ---------------- HELPERS ----------------

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def find_column(columns, possible):
    for col in columns:
        clean = col.lower().strip()
        for key in possible:
            if key in clean:
                return col
    return None


# ---------------- UPLOAD API ----------------

@app.route("/upload", methods=["POST"])
def upload():

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"})

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No selected file"})

    if not allowed_file(file.filename):
        return jsonify({"error": "Only CSV / Excel allowed"})

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    # Read file
    try:

        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(filepath, encoding="utf-8")
            except:
                df = pd.read_csv(filepath, encoding="latin1", on_bad_lines="skip")

        else:
            df = pd.read_excel(filepath, engine="openpyxl")

    except Exception as e:
        return jsonify({"error": str(e)})

    if df.empty:
        return jsonify({"error": "Empty dataset"})

    # Detect columns
    sales_col = find_column(df.columns, ["sales", "amount", "revenue", "total"])
    date_col = find_column(df.columns, ["date", "month"])
    cat_col = find_column(df.columns, ["category", "product", "item"])

    if sales_col is None:
        return jsonify({"error": "Sales column not found"})

    # Clean sales
    df[sales_col] = pd.to_numeric(df[sales_col], errors="coerce").fillna(0)

    total_sales = round(df[sales_col].sum(), 2)
    avg_sales = round(df[sales_col].mean(), 2)
    orders = int(len(df))

    # Monthly trend
    monthly_labels = []
    monthly_values = []

    if date_col:
        try:
            df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
            month_df = df.groupby(df[date_col].dt.strftime("%b"))[sales_col].sum()
            monthly_labels = month_df.index.tolist()
            monthly_values = month_df.round(2).tolist()
        except:
            pass

    # Category top
    top_categories = {}

    if cat_col:
        cat = df.groupby(cat_col)[sales_col].sum().sort_values(ascending=False).head(5)
        top_categories = cat.round(2).to_dict()

    # Prediction (simple linear trend)
    forecast = 0

    if len(monthly_values) >= 2:
        x = np.arange(len(monthly_values))
        y = np.array(monthly_values)

        slope, intercept = np.polyfit(x, y, 1)
        forecast = round((slope * len(monthly_values)) + intercept, 2)
    else:
        forecast = round(avg_sales, 2)

    return jsonify({
        "success": True,
        "filename": filename,

        "kpi": {
            "total_sales": total_sales,
            "avg_sales": avg_sales,
            "orders": orders,
            "forecast": forecast
        },

        "monthly": {
            "labels": monthly_labels,
            "values": monthly_values
        },

        "categories": top_categories
    })


# ---------------- RUN ----------------

if __name__ == "__main__":
    app.run(debug=True)