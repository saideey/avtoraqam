#!/bin/bash
set -e

echo "═══ AvtoRaqam Backend Startup ═══"

# DB tayyor bo'lguncha kutish
echo "→ PostgreSQL kutilmoqda..."
until python -c "
import sys
from sqlalchemy import create_engine, text
import os
try:
    engine = create_engine(os.getenv('DATABASE_URL'))
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    sys.exit(0)
except Exception as e:
    sys.exit(1)
" 2>/dev/null; do
    echo "  DB hali tayyor emas, kutilmoqda..."
    sleep 2
done
echo "✓ PostgreSQL tayyor"

# Jadvallarni yaratish (agar yo'q bo'lsa)
echo "→ Jadvallar yaratilmoqda..."
python -c "
from app import create_app
from app.extensions import db
app = create_app()
with app.app_context():
    db.create_all()
    print('✓ Jadvallar tayyor')
"

# Viloyatlarni seed qilish
echo "→ Viloyatlar yuklanmoqda..."
python scripts/seed_regions.py 2>&1 | tail -3

# SuperAdmin yaratish (agar yo'q bo'lsa)
echo "→ SuperAdmin tekshirilmoqda..."
python scripts/create_superadmin.py 2>&1 | tail -5

# Test ma'lumotlarini seed qilish (agar DB bo'sh bo'lsa)
echo "→ Test ma'lumotlari tekshirilmoqda..."
python scripts/seed_test_data.py 2>&1 | tail -20

echo ""
echo "═══ Gunicorn ishga tushmoqda ═══"
exec gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:8001 --timeout 120 run:app
