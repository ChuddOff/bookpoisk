from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/proxy-debug")
async def debug(req: Request):
    raw = await req.body()
    print("\n====== RAW REQUEST FROM SERVER ======")
    print(raw.decode(errors="ignore"))
    print("=====================================\n")
    return {"received": raw.decode(errors="ignore")}
