import React from 'react';
import { PropertyData } from '../types';

interface PropertyCardProps {
  property: PropertyData;
}

const DetailItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value || value.toLowerCase() === 'n/a') return null;
  return (
    <p className="text-sm text-slate-400">
      <span className="font-semibold text-slate-300">{label}:</span> {value}
    </p>
  );
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const displayAddress = [property.address, property.city, property.state].filter(Boolean).join(', ');

  return (
    <div className="frosted-glass-dark rounded-[2rem] p-6 interactive-glass-sheet h-full flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-semibold text-sky-400 mb-3 truncate" title={property.contactName}>{property.contactName}</h3>
        <div className="space-y-1.5 mb-4">
          {displayAddress && <DetailItem label="Location" value={displayAddress} />}
          {!displayAddress && property.address && <DetailItem label="Address" value={property.address} />}
          <DetailItem label="Company Address" value={property.companyAddress} />
          <DetailItem label="Property Size" value={property.propertySize} />
          <DetailItem label="Last Sale" value={property.lastSale} />
        </div>
      </div>
      <div className="mt-auto pt-3 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 text-center">Property ID: {property.id}</p>
      </div>
    </div>
  );
};

export default PropertyCard;