from flask import Flask, jsonify, request
from recommender import recommender
from database import get_db
from dotenv import load_dotenv
import logging
import os
import threading

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ─── Train model on startup ───────────────────────────────────────────────────
def train_on_startup():
    logger.info("Training recommender model...")
    try:
        recommender.train()
        logger.info("✅ Model ready")
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")

threading.Thread(target=train_on_startup, daemon=True).start()


# ══════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════

@app.get('/health')
def health():
    return jsonify({
        'status':     'ok',
        'trained':    recommender.is_trained,
        'model':      'HybridRecommender (SVD + TF-IDF)'
    })


@app.get('/recommend')
def recommend():
    user_id   = request.args.get('userId')
    course_id = request.args.get('courseId')
    limit     = int(request.args.get('limit', 5))

    if not user_id:
        return jsonify({'error': 'userId is required'}), 400

    # Get modules already completed by this user (exclude from recs)
    exclude_ids = []
    try:
        db = get_db()
        progresses = list(db.progress.find({'userId': {'$oid': user_id} if False else user_id}))
        for p in progresses:
            for mp in p.get('moduleProgress', []):
                if mp.get('status') == 'completed':
                    exclude_ids.append(str(mp['moduleId']))
    except Exception as e:
        logger.warning(f"Could not fetch excluded modules: {e}")

    try:
        recs = recommender.recommend(
            user_id=user_id,
            course_id=course_id,
            limit=limit,
            exclude_ids=exclude_ids
        )
        return jsonify({'recommendations': recs, 'count': len(recs)})
    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        return jsonify({'error': str(e)}), 500


@app.post('/retrain')
def retrain():
    """Trigger model retraining (called by Node.js cron)."""
    def _retrain():
        try:
            recommender.train()
            logger.info("✅ Model retrained successfully")
        except Exception as e:
            logger.error(f"Retraining failed: {e}")

    threading.Thread(target=_retrain, daemon=True).start()
    return jsonify({'message': 'Retraining started'})


@app.get('/evaluate')
def evaluate():
    """Return model quality metrics."""
    try:
        metrics = recommender.evaluate()
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.get('/stats')
def stats():
    """Return dataset statistics."""
    try:
        db = get_db()
        return jsonify({
            'users':    db.users.count_documents({}),
            'courses':  db.courses.count_documents({}),
            'modules':  db.modules.count_documents({}),
            'events':   db.events.count_documents({}),
            'ratings':  db.ratings.count_documents({}),
            'progress': db.progress.count_documents({})
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ──────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    logger.info(f"🚀 ML service starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
