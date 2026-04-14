import json


def test_register(client):
    response = client.post('/api/auth/register', json={
        'phone_number': '+998901111111',
        'full_name': 'Test User',
        'password': 'test1234',
    })
    data = json.loads(response.data)
    assert response.status_code == 201
    assert 'access_token' in data
    assert data['user']['phone_number'] == '+998901111111'


def test_register_duplicate(client):
    client.post('/api/auth/register', json={
        'phone_number': '+998902222222',
        'full_name': 'Test User 2',
        'password': 'test1234',
    })
    response = client.post('/api/auth/register', json={
        'phone_number': '+998902222222',
        'full_name': 'Test User 2',
        'password': 'test1234',
    })
    assert response.status_code == 409


def test_login(client):
    client.post('/api/auth/register', json={
        'phone_number': '+998903333333',
        'full_name': 'Login Test',
        'password': 'test1234',
    })
    response = client.post('/api/auth/login', json={
        'phone_number': '+998903333333',
        'password': 'test1234',
    })
    data = json.loads(response.data)
    assert response.status_code == 200
    assert 'access_token' in data


def test_login_wrong_password(client):
    client.post('/api/auth/register', json={
        'phone_number': '+998904444444',
        'full_name': 'Wrong Pass Test',
        'password': 'test1234',
    })
    response = client.post('/api/auth/login', json={
        'phone_number': '+998904444444',
        'password': 'wrongpassword',
    })
    assert response.status_code == 401
