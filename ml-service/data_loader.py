import pandas as pd
from database import get_db


def load_interactions() -> pd.DataFrame:
    """
    Build user-module interaction matrix from events + ratings.
    Returns DataFrame with columns: userId, moduleId, score (0-5 scale)
    """
    db = get_db()

    rows = []

    # ── 1. Explicit ratings (weight: 1.0) ──────────────────────────────────
    for r in db.ratings.find({}, {'userId': 1, 'moduleId': 1, 'rating': 1}):
        rows.append({
            'userId':   str(r['userId']),
            'moduleId': str(r['moduleId']),
            'score':    float(r['rating'])   # already 1-5
        })

    # ── 2. Implicit signals from events ────────────────────────────────────
    # Aggregate events per (user, module)
    pipeline = [
        {'$group': {
            '_id': {'userId': '$userId', 'moduleId': '$moduleId'},
            'view_count':     {'$sum': {'$cond': [{'$eq': ['$eventType', 'view_start']}, 1, 0]}},
            'completed':      {'$sum': {'$cond': [{'$eq': ['$eventType', 'quiz_complete']}, 1, 0]}},
            'bookmarked':     {'$sum': {'$cond': [{'$eq': ['$eventType', 'bookmark']}, 1, 0]}},
            'skipped':        {'$sum': {'$cond': [{'$eq': ['$eventType', 'skip']}, 1, 0]}},
            'best_quiz_score':{'$max': {'$cond': [
                {'$eq': ['$eventType', 'quiz_complete']},
                '$payload.score', 0
            ]}}
        }}
    ]

    for agg in db.events.aggregate(pipeline):
        uid = str(agg['_id']['userId'])
        mid = str(agg['_id']['moduleId'])

        # Weighted implicit score (0-5 scale)
        score = (
            min(agg['view_count'], 3) * 0.5 +   # up to 1.5
            agg['completed']          * 1.5 +   # up to 1.5
            agg['bookmarked']         * 1.0 +   # up to 1.0
            (agg['best_quiz_score'] / 100) * 1.0  # up to 1.0
        )
        score = min(score, 5.0)

        # Only add if not already covered by explicit rating
        existing = next((r for r in rows if r['userId'] == uid and r['moduleId'] == mid), None)
        if not existing and score > 0:
            rows.append({'userId': uid, 'moduleId': mid, 'score': score})

    # ── 3. Progress completion signals ─────────────────────────────────────
    for p in db.progress.find({}, {'userId': 1, 'moduleProgress': 1}):
        uid = str(p['userId'])
        for mp in p.get('moduleProgress', []):
            if mp.get('status') == 'completed':
                mid = str(mp['moduleId'])
                existing = next((r for r in rows if r['userId'] == uid and r['moduleId'] == mid), None)
                if not existing:
                    # Completed module = good signal
                    score = 3.5
                    if mp.get('score') is not None:
                        score = 2.5 + (mp['score'] / 100) * 2.5
                    rows.append({'userId': uid, 'moduleId': mid, 'score': min(score, 5.0)})

    if not rows:
        return pd.DataFrame(columns=['userId', 'moduleId', 'score'])

    df = pd.DataFrame(rows)
    # If duplicate (userId, moduleId) — keep max score
    df = df.groupby(['userId', 'moduleId'], as_index=False)['score'].max()
    return df


def load_modules_metadata() -> pd.DataFrame:
    """Load module metadata for content-based filtering."""
    db = get_db()
    modules = list(db.modules.find(
        {},
        {'_id': 1, 'title': 1, 'type': 1, 'difficulty': 1,
         'courseId': 1, 'tags': 1, 'learningObjectives': 1}
    ))
    if not modules:
        return pd.DataFrame()

    rows = []
    for m in modules:
        rows.append({
            'moduleId':   str(m['_id']),
            'courseId':   str(m.get('courseId', '')),
            'title':      m.get('title', ''),
            'type':       m.get('type', ''),
            'difficulty': m.get('difficulty', 3),
            'text':       ' '.join([
                m.get('title', ''),
                m.get('type', ''),
                ' '.join(m.get('tags', [])),
                ' '.join(m.get('learningObjectives', []))
            ])
        })
    return pd.DataFrame(rows)
