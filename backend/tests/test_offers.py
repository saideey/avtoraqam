import json


def setup_listing_and_users(client):
    # Sotuvchi
    client.post('/api/auth/register', json={
        'phone_number': '+998911111111',
        'full_name': 'Seller',
        'password': 'test1234',
    })
    seller_resp = client.post('/api/auth/login', json={
        'phone_number': '+998911111111',
        'password': 'test1234',
    })
    seller_token = json.loads(seller_resp.data)['access_token']

    # E'lon yaratish
    listing_resp = client.post('/api/listings', json={
        'plate_number': '01 B 123 CD',
        'price': 30000000,
    }, headers={'Authorization': f'Bearer {seller_token}'})
    listing_id = json.loads(listing_resp.data)['listing']['id']

    # Xaridor
    client.post('/api/auth/register', json={
        'phone_number': '+998912222222',
        'full_name': 'Buyer',
        'password': 'test1234',
    })
    buyer_resp = client.post('/api/auth/login', json={
        'phone_number': '+998912222222',
        'password': 'test1234',
    })
    buyer_token = json.loads(buyer_resp.data)['access_token']

    return listing_id, seller_token, buyer_token


def test_create_offer(client):
    listing_id, seller_token, buyer_token = setup_listing_and_users(client)

    response = client.post('/api/offers', json={
        'listing_id': listing_id,
        'amount': 25000000,
        'message': 'Yaxshi raqam!',
    }, headers={'Authorization': f'Bearer {buyer_token}'})

    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['offer']['amount'] == 25000000


def test_cannot_offer_own_listing(client):
    listing_id, seller_token, _ = setup_listing_and_users(client)

    response = client.post('/api/offers', json={
        'listing_id': listing_id,
        'amount': 25000000,
    }, headers={'Authorization': f'Bearer {seller_token}'})

    assert response.status_code == 400
