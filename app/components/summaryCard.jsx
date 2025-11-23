import React from 'react';

function SummaryCard({ title, value, icon }) {
    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h4>{title}</h4>
                    <p className="value">{value}</p>
                </div>
                <span style={{ fontSize: '24px' }}>{icon}</span>
            </div>
        </div>
    );
}

export default SummaryCard;