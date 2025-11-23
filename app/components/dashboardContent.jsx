import React from 'react';
import SummaryCard from './summaryCard'; 
import Notifications from './notification'; 
import Categories from './categories';

function MainContent() {
  return (
    <>
      {/*GRID KARTU */}
      <div className="cards-grid"> 
        <SummaryCard title="Total Income" value="$0,0" icon="📈" />
        <SummaryCard title="Total Expenses" value="$0,0" icon="📉" />
        <SummaryCard title="Current Balance" value="$0,0" icon="💰" />
      </div>

      {/*BAGIAN BAWAH (SPLIT KIRI & KANAN) */}
      <div className="content-split">
        
        {/* KIRI: Budget Progress */}
        <div className="left-section">
          <div className="budget-section">
            <h3>Budget Progress</h3>
            <p style={{ opacity: 0.8, fontSize: '14px' }}>No budget data yet.</p>
          </div>
        </div>
        
        {/* KANAN: Widgets (Tumpuk Vertikal) */}
        <div className="right-section">
          {/* Panggil komponen di sini */}
          <Notifications />
          <Categories />
        </div>

      </div>
    </>
  );
}

export default MainContent;