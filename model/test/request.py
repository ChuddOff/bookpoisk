import requests
import json

with open("test_books_db.json", "r", encoding="utf-8") as file:
    books = json.load(file)


url = "http://localhost:8080/model"
request = {"read_books": books[:5], "all_books": books}

response = requests.post(url, json=request)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
