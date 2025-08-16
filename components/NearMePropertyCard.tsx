import React from 'react';
import { NearMeProperty } from '../types';

interface NearMePropertyCardProps {
  property: NearMeProperty;
}

const NearMePropertyCard: React.FC<NearMePropertyCardProps> = ({ property }) => {
  const fullAddress = [property.address, property.city, property.state].filter(Boolean).join(', ');

  return (
    <div className="frosted-glass-dark rounded-[2rem] p-5 interactive-glass-sheet h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-indigo-400 mb-2 truncate" title={fullAddress}>
          {property.address || "Address N/A"}
        </h3>
        {(property.city || property.state) && (
             <p className="text-xs text-slate-400 mb-3">
                {property.city}{property.city && property.state ? ', ' : ''}{property.state}
            </p>
        )}

        <div className="mb-4 p-3 bg-slate-800/50 rounded-xl space-y-2 ring-1 ring-slate-700/40">
          <h4 className="text-sm font-semibold text-indigo-300">Why it might be beneficial:</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {property.reasonForBenefit}
          </p>
        </div>

        {property.description && (
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-1">Description:</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {property.description}
            </p>
          </div>
        )}
      </div>
      <div className="mt-auto pt-2.5 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 text-center">Property ID: {property.id}</p>
      </div>
    </div>
  );
};

export default NearMePropertyCard;