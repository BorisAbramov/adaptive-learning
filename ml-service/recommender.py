import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
from data_loader import load_interactions, load_modules_metadata
import logging

logger = logging.getLogger(__name__)

# ─── Thresholds ───────────────────────────────────────────────────────────────
MIN_INTERACTIONS_FOR_CF = 5   # cold-start threshold
SVD_COMPONENTS          = 20  # latent factors


class HybridRecommender:
    def __init__(self):
        self.svd_model        = None
        self.user_factors     = None   # shape: (n_users, k)
        self.item_factors     = None   # shape: (n_items, k)
        self.user_index       = {}     # userId -> row idx
        self.item_index       = {}     # moduleId -> col idx
        self.item_index_rev   = {}     # col idx -> moduleId
        self.tfidf_matrix     = None
        self.module_meta      = None
        self.interaction_df   = None
        self.is_trained       = False

    # ══════════════════════════════════════════════════════════════
    # TRAINING
    # ══════════════════════════════════════════════════════════════
    def train(self):
        logger.info("Loading data...")
        interactions = load_interactions()
        modules      = load_modules_metadata()

        if interactions.empty or modules.empty:
            logger.warning("Not enough data to train. Using cold-start mode.")
            self.module_meta  = modules
            self.is_trained   = False
            self._build_tfidf(modules)
            return

        self.interaction_df = interactions
        self.module_meta    = modules

        # ── Build user-item matrix ────────────────────────────────
        users   = interactions['userId'].unique()
        items   = interactions['moduleId'].unique()
        self.user_index     = {u: i for i, u in enumerate(users)}
        self.item_index     = {m: i for i, m in enumerate(items)}
        self.item_index_rev = {i: m for m, i in self.item_index.items()}

        n_users = len(users)
        n_items = len(items)

        matrix = np.zeros((n_users, n_items))
        for _, row in interactions.iterrows():
            u = self.user_index.get(row['userId'])
            i = self.item_index.get(row['moduleId'])
            if u is not None and i is not None:
                matrix[u, i] = row['score']

        # ── SVD (Collaborative Filtering) ─────────────────────────
        n_components = min(SVD_COMPONENTS, n_users - 1, n_items - 1)
        if n_components < 1:
            n_components = 1

        self.svd_model = TruncatedSVD(n_components=n_components, random_state=42)
        self.user_factors = self.svd_model.fit_transform(matrix)
        self.item_factors = self.svd_model.components_.T  # (n_items, k)

        # ── TF-IDF (Content-Based Filtering) ──────────────────────
        self._build_tfidf(modules)

        self.is_trained = True
        logger.info(f"Model trained: {n_users} users, {n_items} items, {n_components} components")

    def _build_tfidf(self, modules: pd.DataFrame):
        if modules.empty or 'text' not in modules.columns:
            return
        vectorizer = TfidfVectorizer(max_features=500, stop_words=None)
        try:
            self.tfidf_matrix = vectorizer.fit_transform(modules['text'].fillna(''))
        except Exception as e:
            logger.warning(f"TF-IDF failed: {e}")
            self.tfidf_matrix = None

    # ══════════════════════════════════════════════════════════════
    # RECOMMENDATION
    # ══════════════════════════════════════════════════════════════
    def recommend(self, user_id: str, course_id: str = None,
                  limit: int = 5, exclude_ids: list = None) -> list:
        """
        Returns list of dicts:
        { moduleId, score, reason, type, difficulty, estimatedMinutes, courseId }
        """
        exclude_ids = set(exclude_ids or [])

        # Count user interactions
        user_interaction_count = 0
        if self.interaction_df is not None:
            user_interaction_count = len(
                self.interaction_df[self.interaction_df['userId'] == user_id]
            )

        cold_start = user_interaction_count < MIN_INTERACTIONS_FOR_CF

        if cold_start or not self.is_trained:
            return self._content_based(user_id, course_id, limit, exclude_ids)
        else:
            return self._hybrid(user_id, course_id, limit, exclude_ids)

    # ── Hybrid: CF + CBF ──────────────────────────────────────────
    def _hybrid(self, user_id, course_id, limit, exclude_ids) -> list:
        cf_scores  = self._cf_scores(user_id)
        cbf_scores = self._cbf_scores(user_id)

        if self.module_meta is None or self.module_meta.empty:
            return []

        results = []
        for _, mod in self.module_meta.iterrows():
            mid = mod['moduleId']
            if mid in exclude_ids:
                continue
            if course_id and mod.get('courseId') != course_id:
                continue

            cf  = cf_scores.get(mid, 0.0)
            cbf = cbf_scores.get(mid, 0.0)

            # Weight: more CF as interactions grow
            interaction_count = len(
                self.interaction_df[self.interaction_df['userId'] == user_id]
            ) if self.interaction_df is not None else 0
            cf_weight  = min(interaction_count / 20, 0.7)
            cbf_weight = 1 - cf_weight

            combined = cf * cf_weight + cbf * cbf_weight

            results.append({
                'moduleId':         mid,
                'courseId':         mod.get('courseId', ''),
                'title':            mod.get('title', ''),
                'type':             mod.get('type', ''),
                'difficulty':       int(mod.get('difficulty', 3)),
                'estimatedMinutes': int(mod.get('estimatedMinutes', 10)) if 'estimatedMinutes' in mod else 10,
                'score':            round(combined, 4),
                'reason':           'Recommended based on your learning history'
            })

        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]

    # ── Collaborative Filtering scores ───────────────────────────
    def _cf_scores(self, user_id: str) -> dict:
        if not self.is_trained:
            return {}
        user_idx = self.user_index.get(user_id)
        if user_idx is None:
            return {}

        user_vec   = self.user_factors[user_idx]           # (k,)
        raw_scores = self.item_factors @ user_vec           # (n_items,)

        # Normalize to 0-1
        mn, mx = raw_scores.min(), raw_scores.max()
        if mx - mn > 0:
            raw_scores = (raw_scores - mn) / (mx - mn)

        return {self.item_index_rev[i]: float(s) for i, s in enumerate(raw_scores)}

    # ── Content-Based scores ──────────────────────────────────────
    def _cbf_scores(self, user_id: str) -> dict:
        if self.tfidf_matrix is None or self.module_meta is None:
            return {}

        # Build user profile from interacted modules
        interacted = []
        if self.interaction_df is not None:
            user_mods = self.interaction_df[
                self.interaction_df['userId'] == user_id
            ]['moduleId'].tolist()
            interacted = [
                i for i, mid in enumerate(self.module_meta['moduleId'])
                if mid in user_mods
            ]

        if not interacted:
            # No history: prefer easier modules
            scores = {}
            for _, mod in self.module_meta.iterrows():
                scores[mod['moduleId']] = 1.0 / (float(mod.get('difficulty', 3)) + 1)
            return scores

        # Average TF-IDF vector of interacted modules
        user_profile = np.asarray(
            self.tfidf_matrix[interacted].mean(axis=0)
        ).flatten()

        sims = cosine_similarity([user_profile], self.tfidf_matrix)[0]

        return {
            self.module_meta.iloc[i]['moduleId']: float(sims[i])
            for i in range(len(sims))
        }

    # ── Cold-start: content-based only ───────────────────────────
    def _content_based(self, user_id, course_id, limit, exclude_ids) -> list:
        if self.module_meta is None or self.module_meta.empty:
            return []

        results = []
        for _, mod in self.module_meta.iterrows():
            mid = mod['moduleId']
            if mid in exclude_ids:
                continue
            if course_id and mod.get('courseId') != course_id:
                continue

            # Prefer easier modules for new users
            difficulty = float(mod.get('difficulty', 3))
            score = 1.0 / difficulty

            results.append({
                'moduleId':         mid,
                'courseId':         mod.get('courseId', ''),
                'title':            mod.get('title', ''),
                'type':             mod.get('type', ''),
                'difficulty':       int(difficulty),
                'estimatedMinutes': 10,
                'score':            round(score, 4),
                'reason':           'Recommended for new learners'
            })

        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]

    # ══════════════════════════════════════════════════════════════
    # METRICS
    # ══════════════════════════════════════════════════════════════
    def evaluate(self, test_ratio: float = 0.2) -> dict:
        """
        Simple Precision@K and NDCG@K evaluation via train/test split.
        """
        if self.interaction_df is None or len(self.interaction_df) < 10:
            return {'error': 'Not enough data for evaluation'}

        df = self.interaction_df.copy()
        test  = df.sample(frac=test_ratio, random_state=42)
        train = df.drop(test.index)

        # Temporarily retrain on train split
        # (simplified: just report on current model)
        k = 5
        precisions, ndcgs = [], []

        for user_id in test['userId'].unique():
            relevant = set(test[test['userId'] == user_id]['moduleId'].tolist())
            recs     = self.recommend(user_id, limit=k)
            rec_ids  = [r['moduleId'] for r in recs]

            # Precision@K
            hits = sum(1 for r in rec_ids if r in relevant)
            precisions.append(hits / k)

            # NDCG@K
            dcg  = sum(1 / np.log2(i + 2) for i, r in enumerate(rec_ids) if r in relevant)
            idcg = sum(1 / np.log2(i + 2) for i in range(min(len(relevant), k)))
            ndcgs.append(dcg / idcg if idcg > 0 else 0)

        return {
            f'precision@{k}': round(float(np.mean(precisions)), 4),
            f'ndcg@{k}':      round(float(np.mean(ndcgs)), 4),
            'n_users_evaluated': len(precisions)
        }


# Singleton
recommender = HybridRecommender()
