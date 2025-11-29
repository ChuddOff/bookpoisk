from fastapi import FastAPI, Request
import uvicorn

app = FastAPI()

@app.post("/test-callback")
async def callback(req: Request):
    print("Headers:", req.headers)
    data = await req.json()
    print("🔥 CALLBACK RECEIVED:")
    print(data)
    return {"status": "received"}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=9000)
