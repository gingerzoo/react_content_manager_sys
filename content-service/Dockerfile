FROM public.ecr.aws/docker/library/python:3.14-slim-bookworm

WORKDIR /app

COPY requirements.txt ./

RUN pip install \
    --no-cache-dir \
    -r requirements.txt

COPY main.py ./
COPY app ./app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]