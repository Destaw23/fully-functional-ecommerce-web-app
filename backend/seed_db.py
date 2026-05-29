import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projects.settings')
django.setup()

from apps.products.models import Category, Product, Review
from apps.accounts.models import User
from django.utils.text import slugify

def seed():
    print("Starting data seeding...")
    
    # 1. Clean existing product/category/review data
    Review.objects.all().delete()
    Product.objects.all().delete()
    Category.objects.all().delete()
    
    # 2. Get existing users
    users = list(User.objects.all())
    if not users:
        print("Please run django migrations first and ensure users exist.")
        return
        
    user_abebe = User.objects.filter(username="abebe").first() or users[0]
    user_destaw = User.objects.filter(username="destaw").first() or users[0]

    # 3. Create Categories
    categories_data = [
        {"name": "Smartphones", "description": "Latest Apple iPhones, Samsung Galaxy models, and Android devices."},
        {"name": "Laptops", "description": "Premium work, school, and high-performance gaming laptops."},
        {"name": "Audio & Headphones", "description": "Over-ear noise cancelling headphones, earbuds, and speakers."},
        {"name": "Smartwatches", "description": "Fitness trackers, Apple Watches, and smart wearables."},
        {"name": "Cameras", "description": "Professional DSLRs, mirrorless cameras, and action cams."}
    ]
    
    categories = {}
    for cat in categories_data:
        category, created = Category.objects.get_or_create(
            name=cat["name"],
            defaults={
                "slug": slugify(cat["name"]),
                "description": cat["description"]
            }
        )
        categories[cat["name"]] = category
        print(f"Category '{category.name}' created.")

    # 4. Create Products
    products_data = [
        # Smartphones
        {
            "name": "iPhone 15 Pro Max",
            "category": categories["Smartphones"],
            "description": "The iPhone 15 Pro Max features a durable and lightweight aerospace-grade titanium design, a powerful new Action button, A17 Pro chip for next-level gaming, and a powerful 3x or 5x Telephoto camera system.",
            "short_description": "256GB, Titanium Blue, A17 Pro Chip, 5x Telephoto Camera.",
            "price": 160000.00,
            "compare_price": 175000.00,
            "stock_quantity": 10,
            "sku": "IPH15PM-256",
            "brand": "Apple",
            "condition": "new",
            "warranty_months": 12,
            "is_featured": True,
            "specifications": {"Storage": "256GB", "RAM": "8GB", "Color": "Titanium Blue", "Screen": "6.7 inch Super Retina XDR"}
        },
        {
            "name": "Samsung Galaxy S24 Ultra",
            "category": categories["Smartphones"],
            "description": "Meet Galaxy S24 Ultra, the ultimate form of Galaxy Ultra with a new titanium exterior and a 6.8-inch flat screen. Featuring Galaxy AI, a 200MP camera system, and integrated S Pen.",
            "short_description": "512GB, Titanium Gray, Galaxy AI, 200MP Camera, S Pen included.",
            "price": 155000.00,
            "compare_price": 165000.00,
            "stock_quantity": 8,
            "sku": "SAMS24U-512",
            "brand": "Samsung",
            "condition": "new",
            "warranty_months": 12,
            "is_featured": True,
            "specifications": {"Storage": "512GB", "RAM": "12GB", "Color": "Titanium Gray", "Screen": "6.8 inch Dynamic AMOLED"}
        },
        {
            "name": "Google Pixel 8 Pro",
            "category": categories["Smartphones"],
            "description": "The all-pro phone engineered by Google. It has the Google Tensor G3 chip, advanced AI capabilities, the best Pixel camera yet, and a polished aluminum frame with matte glass.",
            "short_description": "128GB, Obsidian, Tensor G3, Best-in-class Google AI camera.",
            "price": 95000.00,
            "compare_price": 105000.00,
            "stock_quantity": 5,
            "sku": "PIX8P-128",
            "brand": "Google",
            "condition": "new",
            "warranty_months": 12,
            "is_featured": False,
            "specifications": {"Storage": "128GB", "RAM": "12GB", "Color": "Obsidian", "Screen": "6.7 inch LTPO OLED"}
        },
        
        # Laptops
        {
            "name": "MacBook Pro M3 Max",
            "category": categories["Laptops"],
            "description": "The MacBook Pro blasts forward with the M3 Max chip. Built on 3-nanometer technology and featuring an all-new GPU architecture, it is the most advanced chip ever built for a personal computer.",
            "short_description": "14-inch, M3 Max Chip, 36GB Unified Memory, 1TB SSD, Space Black.",
            "price": 180000.00,
            "compare_price": 195000.00,
            "stock_quantity": 6,
            "sku": "MBPM3M-14",
            "brand": "Apple",
            "condition": "new",
            "warranty_months": 12,
            "is_featured": True,
            "specifications": {"Processor": "Apple M3 Max 14-core", "Memory": "36GB Unified", "Storage": "1TB SSD", "OS": "macOS Sonoma"}
        },
        {
            "name": "Dell XPS 15 9530",
            "category": categories["Laptops"],
            "description": "The Dell XPS 15 is the perfect balance of power and portability. Features a stunning 3.5K OLED touch display, Intel Core i9 processor, and dedicated NVIDIA GeForce RTX 4060 graphics.",
            "short_description": "Intel i9, 32GB RAM, 1TB SSD, RTX 4060, 3.5K OLED Touch.",
            "price": 140000.00,
            "compare_price": 150000.00,
            "stock_quantity": 4,
            "sku": "DELLXPS15-i9",
            "brand": "Dell",
            "condition": "new",
            "warranty_months": 12,
            "is_featured": False,
            "specifications": {"Processor": "Intel Core i9-13900H", "Memory": "32GB DDR5", "Storage": "1TB NVMe SSD", "GPU": "RTX 4060 8GB"}
        },
        {
            "name": "Lenovo ThinkPad X1 Carbon Gen 11",
            "category": categories["Laptops"],
            "description": "The ultimate business laptop. Extremely lightweight carbon-fiber chassis, legendary ThinkPad keyboard, robust security features, and powerful Intel Core i7 processor.",
            "short_description": "Intel i7, 16GB RAM, 512GB SSD, Ultra-lightweight carbon chassis.",
            "price": 120000.00,
            "compare_price": None,
            "stock_quantity": 12,
            "sku": "THINKX1-G11",
            "brand": "Lenovo",
            "condition": "new",
            "warranty_months": 24,
            "is_featured": False,
            "specifications": {"Processor": "Intel Core i7-1355U", "Memory": "16GB LPDDR5", "Storage": "512GB PCIe SSD", "Weight": "1.12 kg"}
        },

        # Audio
        {
            "name": "Sony WH-1000XM5 ANC Headphones",
            "category": categories["Audio & Headphones"],
            "description": "Sony's industry-leading noise canceling headphones. Two processors control 8 microphones for unprecedented noise cancellation, while Auto NC Optimizer matches noise levels dynamically.",
            "short_description": "Over-Ear Wireless Noise Cancelling Headphones, 30 Hour Battery.",
            "price": 32000.00,
            "compare_price": 35000.00,
            "stock_quantity": 15,
            "sku": "SONYXM5-BLK",
            "brand": "Sony",
            "condition": "new",
            "warranty_months": 12,
            "is_featured": True,
            "specifications": {"Battery Life": "Up to 30 Hours", "Bluetooth": "v5.2", "Weight": "250g", "ANC": "Industry-leading Dual Processor"}
        },
        {
            "name": "Apple AirPods Pro 2",
            "category": categories["Audio & Headphones"],
            "description": "Rebuilt from the sound up. AirPods Pro feature up to 2x more Active Noise Cancellation, Adaptive Audio, and Personalized Spatial Audio for immersive acoustics.",
            "short_description": "Wireless ANC Earbuds, MagSafe Charging Case (USB-C).",
            "price": 22000.00,
            "compare_price": 24000.00,
            "stock_quantity": 25,
            "sku": "AIRPODPRO2",
            "brand": "Apple",
            "condition": "new",
            "warranty_months": 6,
            "is_featured": False,
            "specifications": {"ANC": "Active Noise Cancellation", "Battery": "6 Hours (30 Hours total with case)", "Water Resistance": "IPX4"}
        },

        # Smartwatches
        {
            "name": "Apple Watch Series 9 GPS",
            "category": categories["Smartwatches"],
            "description": "Smarter. Brighter. Mightier. Apple Watch Series 9 features the S9 SiP chip, a magic new way to use your watch without touching the screen (Double Tap), and advanced health tracking.",
            "short_description": "45px Aluminum Case, Midnight Sport Band, Double Tap Gesture.",
            "price": 38000.00,
            "compare_price": 42000.00,
            "stock_quantity": 14,
            "sku": "APPWATCH9-45",
            "brand": "Apple",
            "condition": "new",
            "warranty_months": 12,
            "is_featured": True,
            "specifications": {"Size": "45mm", "Connectivity": "GPS Only", "Sensor": "ECG, Blood Oxygen, Temperature", "Display": "Always-On Retina"}
        },

        # Cameras
        {
            "name": "Sony Alpha 7 IV Mirrorless Camera",
            "category": categories["Cameras"],
            "description": "The ideal hybrid mirrorless camera. Combining a 33MP Exmor R CMOS sensor with the BIONZ XR processing engine, the Alpha 7 IV delivers professional stills and 4K 60p video capture.",
            "short_description": "33MP Full-Frame Mirrorless Camera (Body Only), 4K 60p Video.",
            "price": 22000.00,
            "compare_price": 24000.00,
            "stock_quantity": 3,
            "sku": "SONYA7M4",
            "brand": "Sony",
            "condition": "new",
            "warranty_months": 12,
            "is_featured": True,
            "specifications": {"Sensor": "33MP Full-Frame", "Focus": "759 Phase-detection AF points", "ISO": "100 - 51,200", "Video": "4K 60p 10-bit"}
        }
    ]

    for p_data in products_data:
        product = Product.objects.create(
            name=p_data["name"],
            slug=slugify(p_data["name"]),
            category=p_data["category"],
            description=p_data["description"],
            short_description=p_data["short_description"],
            price=p_data["price"],
            compare_price=p_data["compare_price"],
            stock_quantity=p_data["stock_quantity"],
            sku=p_data["sku"],
            brand=p_data["brand"],
            condition=p_data["condition"],
            warranty_months=p_data["warranty_months"],
            is_featured=p_data["is_featured"],
            specifications=p_data["specifications"]
        )
        print(f"Product '{product.name}' created.")

        # Add some demo reviews for each product
        Review.objects.create(
            product=product,
            user=user_abebe,
            rating=5,
            title="Absolutely Amazing!",
            comment="Outstanding quality and performance. Worth every single birr. Delivered on the same day in Addis Ababa!",
            is_verified=True
        )
        
        Review.objects.create(
            product=product,
            user=user_destaw,
            rating=4,
            title="Highly Recommended",
            comment="Excellent product. The build quality is top notch and it functions exactly as described. Customer support was very helpful.",
            is_verified=True
        )
        
        # Calculate product aggregate rating
        product.rating = 4.5
        product.total_reviews = 2
        product.save()

    print("Data seeding completed successfully!")

if __name__ == "__main__":
    seed()
