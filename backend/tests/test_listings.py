import json


def get_auth_token(client, phone='+998905555555'):
    client.post('/api/auth/register', json={
        'phone_number': phone,
        'full_name': 'Listing Test User',
        'password': 'test1234',
    })
    resp = client.post('/api/auth/login', json={
        'phone_number': phone,
        'password': 'test1234',
    })
    return json.loads(resp.data)['access_token']


def test_create_listing(client):
    token = get_auth_token(client, '+998906666666')
    response = client.post('/api/listings', json={
        'plate_number': '01 A 007 BB',
        'price': 50000000,
        'description': 'Chiroyli raqam',
    }, headers={'Authorization': f'Bearer {token}'})

    data = json.loads(response.data)
    assert response.status_code == 201
    assert data['listing']['plate_number'] == '01 A 007 BB'


def test_get_listings(client):
    response = client.get('/api/listings')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'listings' in data
    assert 'pagination' in data


def test_invalid_plate_number(client):
    token = get_auth_token(client, '+998907777777')
    response = client.post('/api/listings', json={
        'plate_number': '99 A 007 BB',
        'price': 50000000,
    }, headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 400
