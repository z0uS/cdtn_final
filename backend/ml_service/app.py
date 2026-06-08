# ml_service/app.py
# Flask API Server - ML Service cho Hệ thống Quản lý Chi tiêu
# Cung cấp 2 endpoints:
#   POST /classify  - Phân loại danh mục giao dịch (Naive Bayes)
#   GET  /suggest-budget - Gợi ý ngân sách theo K-Means
#   POST /train     - Train lại model từ dữ liệu DB

from flask import Flask, request, jsonify
from flask_cors import CORS
from classifier import CategoryClassifier
from budget_suggester import BudgetSuggester
import os

app = Flask(__name__)
CORS(app)

# Khởi tạo 2 model
classifier = CategoryClassifier()
suggester  = BudgetSuggester()

#  Train model khi khởi động 
print("[*] Dang train model lan dau...")
classifier.train()
suggester.train()
print("[OK] Train xong! ML Service san sang.")

#  Endpoint 1: Phân loại danh mục 
@app.route('/classify', methods=['POST'])
def classify():
    """
    Input:  { "description": "Grab Food đặt cơm trưa" }
    Output: { "category": "Ăn uống", "confidence": 0.87, "all_probs": {...} }
    """
    data = request.get_json()
    description = data.get('description', '').strip()

    if not description:
        return jsonify({"error": "Vui lòng cung cấp description"}), 400

    result = classifier.predict(description)
    return jsonify(result)

#  Endpoint 2: Gợi ý ngân sách 
@app.route('/suggest-budget', methods=['GET'])
def suggest_budget():
    """
    Query param: ?user_id=1
    Output: { "suggestions": [ { "category": "Ăn uống", "suggested_limit": 3200000 }, ... ] }
    """
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({"error": "Vui lòng cung cấp user_id"}), 400

    result = suggester.suggest(user_id)
    return jsonify(result)

#  Endpoint 3: Train lại model
@app.route('/train', methods=['POST'])
def retrain():
    """Dùng khi có thêm dữ liệu mới, train lại cả 2 model"""
    try:
        classifier.train()
        suggester.train()
        return jsonify({"message": "Train lại thành công!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#  Endpoint kiểm tra sức khỏe service 
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "classifier_trained": classifier.is_trained,
        "suggester_trained": suggester.is_trained
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
