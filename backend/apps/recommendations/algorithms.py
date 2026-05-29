import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from django.db.models import Count, Q
from apps.products.models import Product
from .models import Interaction


class RecommendationEngine:
    @staticmethod
    def get_content_based_recommendations(product_id, limit=10):
        """
        Content-based recommendations using TF-IDF and Cosine Similarity
        """
        # Get all active products
        products = list(Product.objects.filter(is_active=True))

        if not products:
            return []

        # Build text features for each product
        product_features = []
        product_ids = []

        for product in products:
            specs_text = " ".join(
                f"{key} {value}"
                for key, value in (product.specifications or {}).items()
                if value is not None
            )
            category_text = product.category.name if product.category else ""
            features = " ".join(
                filter(
                    None,
                    [
                        str(product.name).strip(),
                        str(product.description or "").strip(),
                        str(product.brand or "").strip(),
                        category_text.strip(),
                        specs_text.strip(),
                    ],
                )
            )
            product_features.append(features)
            product_ids.append(product.id)

        if not any(product_features):
            return []

        # Compute TF-IDF matrix
        vectorizer = TfidfVectorizer(stop_words="english", max_features=1000)
        try:
            tfidf_matrix = vectorizer.fit_transform(product_features)
        except ValueError:
            return []

        try:
            target_idx = product_ids.index(product_id)
        except ValueError:
            return []

        cosine_sim = cosine_similarity(
            tfidf_matrix[target_idx : target_idx + 1], tfidf_matrix
        ).flatten()

        similar_indices = cosine_sim.argsort()[::-1][1 : limit + 1]

        recommendations = []
        for idx in similar_indices:
            if cosine_sim[idx] > 0.05:
                recommendations.append(products[idx])

        return recommendations

    @staticmethod
    def get_collaborative_recommendations(user, limit=10):
        """
        Collaborative filtering using purchase history
        """
        # Get user's purchased products
        user_purchases = Interaction.objects.filter(
            user=user, action="purchase"
        ).values_list("product_id", flat=True)

        if not user_purchases:
            return []

        # Find users who purchased similar products
        similar_users = (
            Interaction.objects.filter(action="purchase", product_id__in=user_purchases)
            .exclude(user=user)
            .values("user")
            .annotate(common_count=Count("product"))
            .order_by("-common_count")[:20]
        )

        if not similar_users:
            return []

        # Get products purchased by similar users but not by current user
        similar_user_ids = [u["user"] for u in similar_users]
        recommendations = (
            Product.objects.filter(
                interactions__user_id__in=similar_user_ids,
                interactions__action="purchase",
                is_active=True,
            )
            .exclude(id__in=user_purchases)
            .annotate(recommendation_score=Count("interactions"))
            .order_by("-recommendation_score")[:limit]
        )

        return list(recommendations)

    @staticmethod
    def get_popular_products(limit=10):
        """
        Get popular products based on views and purchases
        """
        popular = (
            Product.objects.filter(is_active=True)
            .annotate(popularity_score=Count("interactions"))
            .order_by("-views_count", "-popularity_score")[:limit]
        )

        return list(popular)

    @staticmethod
    def get_user_based_recommendations(user, limit=10):
        """
        Hybrid recommendations combining content-based and collaborative filtering.
        """
        collab_recs = RecommendationEngine.get_collaborative_recommendations(user, limit)
        if len(collab_recs) >= limit:
            return collab_recs[:limit]

        if collab_recs:
            remaining = limit - len(collab_recs)
            popular_recs = RecommendationEngine.get_popular_products(remaining)
            combined = collab_recs + [p for p in popular_recs if p not in collab_recs]
            return combined[:limit]

        # Cold start: personalize based on the last viewed product if no purchases exist.
        last_viewed_product_id = (
            Interaction.objects.filter(user=user, action="view")
            .order_by("-created_at")
            .values_list("product_id", flat=True)
            .first()
        )
        if last_viewed_product_id:
            content_recs = RecommendationEngine.get_content_based_recommendations(
                last_viewed_product_id, limit
            )
            if content_recs:
                return content_recs[:limit]

        return RecommendationEngine.get_popular_products(limit)

    @staticmethod
    def get_related_products(product_id, limit=8):
        """
        Get products frequently bought together
        """
        from apps.orders.models import OrderItem

        # Find orders containing this product
        order_ids = OrderItem.objects.filter(product_id=product_id).values_list(
            "order_id", flat=True
        )

        # Get other products in same orders
        related = (
            Product.objects.filter(orderitem__order_id__in=order_ids, is_active=True)
            .exclude(id=product_id)
            .annotate(together_count=Count("orderitem"))
            .order_by("-together_count")
            .distinct()[:limit]
        )

        if len(related) >= 4:
            return list(related)

        # Fallback to content-based recommendations
        return RecommendationEngine.get_content_based_recommendations(product_id, limit)
