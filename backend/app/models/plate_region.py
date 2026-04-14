from app.extensions import db


class PlateRegion(db.Model):
    __tablename__ = 'plate_regions'

    code = db.Column(db.String(5), primary_key=True)
    name_uz = db.Column(db.String(100), nullable=False)
    name_ru = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            'code': self.code,
            'name_uz': self.name_uz,
            'name_ru': self.name_ru,
        }
