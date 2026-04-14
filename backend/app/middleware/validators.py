from marshmallow import Schema, fields, validate, validates, ValidationError
import re


class RegisterSchema(Schema):
    phone_number = fields.String(required=True)
    full_name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    password = fields.String(required=True, validate=validate.Length(min=6, max=128))

    @validates('phone_number')
    def validate_phone(self, value):
        if not re.match(r'^\+998\d{9}$', value):
            raise ValidationError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak")


class LoginSchema(Schema):
    phone_number = fields.String(required=True)
    password = fields.String(required=True)


class ListingCreateSchema(Schema):
    plate_number = fields.String(required=True)
    price = fields.Integer(required=True, validate=validate.Range(min=1000))
    description = fields.String(validate=validate.Length(max=500))
    payment_method = fields.String(load_default='click')
    card_last4 = fields.String(load_default='')


class OfferCreateSchema(Schema):
    listing_id = fields.Integer(required=True)
    amount = fields.Integer(required=True, validate=validate.Range(min=1000))
    message = fields.String(validate=validate.Length(max=500))


class ProfileUpdateSchema(Schema):
    full_name = fields.String(validate=validate.Length(min=2, max=100))


class ChangePasswordSchema(Schema):
    old_password = fields.String(required=True)
    new_password = fields.String(required=True, validate=validate.Length(min=6, max=128))


def validate_input(schema_class, data):
    schema = schema_class()
    errors = schema.validate(data)
    if errors:
        return None, errors
    return schema.load(data), None
