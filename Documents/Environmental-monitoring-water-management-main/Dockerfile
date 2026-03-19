# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY dashboard/package*.json ./dashboard/
RUN cd dashboard && npm install
COPY dashboard/ ./dashboard/
RUN cd dashboard && npm run build

# Final stage
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY --from=build /app/dashboard/dist ./dashboard/dist

# Use environment variables for sensitive data if needed
ENV FLASK_APP=dashboard_api.py
ENV FLASK_ENV=production

EXPOSE 5000
CMD ["python", "dashboard_api.py"]
