import OfferCard from './OfferCard';

const OfferList = ({ offers, showActions, onAccept, onReject }) => {
  if (!offers || offers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Takliflar yo'q
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <OfferCard
          key={offer._id || offer.id}
          offer={offer}
          showActions={showActions}
          onAccept={onAccept}
          onReject={onReject}
        />
      ))}
    </div>
  );
};

export default OfferList;
