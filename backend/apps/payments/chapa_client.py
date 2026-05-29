import requests
import hashlib
import hmac
import json
from django.conf import settings


class ChapaClient:
    def __init__(self):
        self.base_url = settings.CHAPA_API_URL
        self._refresh_credentials()

    def _refresh_credentials(self):
        # Force reload .env variables dynamically to avoid stale cached keys in running process
        from dotenv import load_dotenv
        import os
        load_dotenv(os.path.join(settings.BASE_DIR, ".env"), override=True)
        self.secret_key = os.getenv("CHAPA_SECRET_KEY", settings.CHAPA_SECRET_KEY)
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    def initialize_payment(
        self, tx_ref, amount, email, phone_number, callback_url, return_url
    ):
        """
        Initialize payment with Chapa
        """
        self._refresh_credentials()
        payload = {
            "tx_ref": tx_ref,
            "amount": str(amount),
            "currency": "ETB",
            "email": email,
            "phone_number": phone_number,
            "callback_url": callback_url,
            "return_url": return_url,
            "customization": {
                "title": "ElectroMerce",
                "description": "Payment for electronic devices purchase",
            },
        }

        try:
            response = requests.post(
                f"{self.base_url}/transaction/initialize",
                headers=self.headers,
                json=payload,
                timeout=30,
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    return {
                        "success": True,
                        "checkout_url": data["data"]["checkout_url"],
                        "tx_ref": tx_ref,
                    }

            return {"success": False, "error": response.text}

        except Exception as e:
            return {"success": False, "error": str(e)}

    def verify_payment(self, tx_ref):
        """
        Verify payment status with Chapa
        """
        self._refresh_credentials()
        try:
            response = requests.get(
                f"{self.base_url}/transaction/verify/{tx_ref}",
                headers=self.headers,
                timeout=30,
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    return {"success": True, "data": data["data"]}

            return {"success": False, "error": response.text}

        except Exception as e:
            return {"success": False, "error": str(e)}

    def webhook_verify(self, payload, signature):
        """
        Verify webhook signature from Chapa
        """
        # Ensure webhook secret is loaded dynamically too
        from dotenv import load_dotenv
        import os
        load_dotenv(os.path.join(settings.BASE_DIR, ".env"), override=True)
        webhook_secret = os.getenv("CHAPA_WEBHOOK_SECRET", settings.CHAPA_WEBHOOK_SECRET)
        
        expected_signature = hmac.new(
            webhook_secret.encode(),
            json.dumps(payload).encode(),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(signature, expected_signature)
