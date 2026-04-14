import json
from app.extensions import db, bcrypt
from app.models.user import User


def get_superadmin_token(client, app):
    with app.app_context():
        existing = User.query.filter_by(phone_number='+998900000000').first()
        if not existing:
            password_hash = bcrypt.generate_password_hash('admin1234').decode('utf-8')
            admin = User(
                phone_number='+998900000000',
                full_name='Super Admin',
                password_hash=password_hash,
                role='superadmin',
                is_verified=True,
                is_active=True,
            )
            db.session.add(admin)
            db.session.commit()

    resp = client.post('/api/auth/login', json={
        'phone_number': '+998900000000',
        'password': 'admin1234',
    })
    return json.loads(resp.data)['access_token']


def test_admin_get_users(client, app):
    token = get_superadmin_token(client, app)
    response = client.get('/api/admin/users', headers={
        'Authorization': f'Bearer {token}'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'users' in data


def test_admin_stats_overview(client, app):
    token = get_superadmin_token(client, app)
    response = client.get('/api/admin/stats/overview', headers={
        'Authorization': f'Bearer {token}'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'total_users' in data
