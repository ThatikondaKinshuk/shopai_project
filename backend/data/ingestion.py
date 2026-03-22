"""
Amazon Product Reviews Data Ingestion Pipeline
Downloads and processes the Amazon Product Reviews dataset (Electronics subset)
Source: https://nijianmo.github.io/amazon/index.html (public dataset)
"""

import json
import gzip
import os
import random
import hashlib
from pathlib import Path
from typing import List, Dict
import requests
from tqdm import tqdm

DATA_DIR = Path(__file__).parent / "raw"
DATA_DIR.mkdir(exist_ok=True)

# Using the publicly available small Electronics subset
REVIEWS_URL = "https://datarepo.eng.ucsd.edu/mcauley_group/data/amazon_2023/raw/review_categories/Electronics.jsonl.gz"
META_URL = "https://datarepo.eng.ucsd.edu/mcauley_group/data/amazon_2023/raw/meta_categories/meta_Electronics.jsonl.gz"


def generate_sample_data(num_products: int = 50, reviews_per_product: int = 30) -> Dict:
    """
    Generates realistic mock Amazon Electronics data for local development.
    This is used when the actual dataset download is not available.
    """
    categories = ["Headphones", "Laptops", "Smartphones", "Cameras", "Tablets", "Speakers"]
    brands = ["TechPro", "SoundWave", "PixelBright", "CoreTech", "NovaSound", "ZenTech"]

    aspects = {
        "battery": ["battery life", "charging speed", "battery drain", "long lasting"],
        "sound": ["sound quality", "bass", "treble", "noise cancellation", "audio"],
        "build": ["build quality", "durability", "materials", "sturdy", "premium feel"],
        "comfort": ["comfortable", "ergonomic", "lightweight", "fits well", "wearing"],
        "price": ["value for money", "affordable", "worth it", "expensive", "budget"],
        "connectivity": ["bluetooth", "wifi", "connection", "pairing", "signal"],
        "display": ["screen", "resolution", "brightness", "display quality", "colors"],
    }

    positive_templates = [
        "Absolutely love this product! The {aspect} is outstanding.",
        "Great {aspect}. Really impressed with the overall quality.",
        "The {aspect} exceeded my expectations. Would highly recommend.",
        "Solid product. The {aspect} is top notch for the price.",
        "Perfect for everyday use. {aspect} works flawlessly.",
        "Best purchase I've made this year. The {aspect} alone is worth it.",
        "Very satisfied! {aspect} is exactly what I needed.",
    ]

    negative_templates = [
        "Disappointed with the {aspect}. Expected much better.",
        "The {aspect} is subpar. Not worth the price.",
        "Had issues with {aspect} from day one. Very frustrating.",
        "Would not recommend. The {aspect} failed after two weeks.",
        "Poor {aspect}. Returning this product immediately.",
    ]

    neutral_templates = [
        "Average {aspect}. Nothing special but gets the job done.",
        "The {aspect} is okay. Not great, not terrible.",
        "Mixed feelings about {aspect}. Some days it works, some it doesn't.",
        "Decent product but the {aspect} could be improved.",
    ]

    products = []
    all_reviews = []

    for i in range(num_products):
        category = random.choice(categories)
        brand = random.choice(brands)
        product_id = hashlib.md5(f"{brand}{category}{i}".encode()).hexdigest()[:10].upper()
        price = round(random.uniform(19.99, 499.99), 2)

        product = {
            "product_id": product_id,
            "title": f"{brand} {category} Pro {random.randint(1, 9)}00",
            "brand": brand,
            "category": category,
            "price": price,
            "average_rating": round(random.uniform(3.2, 4.8), 1),
            "total_reviews": reviews_per_product,
            "description": (
                f"The {brand} {category} Pro features advanced technology "
                f"designed for everyday use. With premium build quality and "
                f"outstanding performance, this {category.lower()} delivers "
                f"an exceptional experience at an affordable price of ${price}."
            ),
            "specifications": {
                "Brand": brand,
                "Category": category,
                "Price": f"${price}",
                "Warranty": f"{random.randint(1, 2)} Year",
                "Weight": f"{round(random.uniform(0.2, 2.5), 1)} kg",
                "Color": random.choice(["Black", "White", "Silver", "Space Gray"]),
            },
        }
        products.append(product)

        for j in range(reviews_per_product):
            aspect_key = random.choice(list(aspects.keys()))
            aspect_phrase = random.choice(aspects[aspect_key])
            sentiment_roll = random.random()

            if sentiment_roll > 0.6:
                template = random.choice(positive_templates)
                sentiment = "positive"
                rating = random.randint(4, 5)
            elif sentiment_roll > 0.25:
                template = random.choice(neutral_templates)
                sentiment = "neutral"
                rating = random.randint(3, 4)
            else:
                template = random.choice(negative_templates)
                sentiment = "negative"
                rating = random.randint(1, 3)

            review_text = template.format(aspect=aspect_phrase)
            all_reviews.append({
                "product_id": product_id,
                "review_id": f"R{hashlib.md5(f'{product_id}{j}'.encode()).hexdigest()[:8].upper()}",
                "reviewer": f"Customer_{random.randint(1000, 9999)}",
                "rating": rating,
                "text": review_text,
                "sentiment": sentiment,
                "aspect": aspect_key,
                "helpful_votes": random.randint(0, 150),
                "verified_purchase": random.random() > 0.2,
            })

    return {"products": products, "reviews": all_reviews}


def load_or_generate_data(num_products: int = 50) -> Dict:
    """
    Loads cached data or generates sample data.
    In production, replace with actual Amazon dataset loading.
    """
    cache_file = DATA_DIR / "sample_data.json"

    if cache_file.exists():
        print("✅ Loading cached dataset...")
        with open(cache_file) as f:
            return json.load(f)

    print("🔄 Generating sample Amazon-style dataset...")
    data = generate_sample_data(num_products=num_products)

    with open(cache_file, "w") as f:
        json.dump(data, f, indent=2)

    print(f"✅ Generated {len(data['products'])} products and {len(data['reviews'])} reviews")
    return data


if __name__ == "__main__":
    data = load_or_generate_data()
    print(f"Products: {len(data['products'])}")
    print(f"Reviews: {len(data['reviews'])}")
    print(f"Sample product: {data['products'][0]['title']}")
