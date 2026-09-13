FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir websockets

COPY . .

EXPOSE 8000

CMD python -c "import os; os.system(f'python -m uvicorn app.main:app --host 0.0.0.0 --port {os.environ.get("PORT", 8000)} --ws websockets')"
