import React from 'react';

const DashboardFooter: React.FC = () => {
  return (
    <div className="dashboard-footer">
      <div className="footer-separator"></div>
      <div className="footer-content">
        <p className="footer-warning">
          ⚠️ Warning – This dashboard is strictly for learning and research purpose.
        </p>
      </div>

      <style>{`
        .dashboard-footer {
          margin-top: 40px;
          padding-top: 0;
          position: relative;
          z-index: 3;
          clear: both;
          display: block;
          width: 100%;
        }

        .footer-separator {
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent,
            #FFD700 20%,
            #FFD700 80%,
            transparent
          );
          margin-bottom: 20px;
        }

        .footer-content {
          text-align: center;
          padding: 20px;
        }

        .footer-warning {
          color: #FFD700;
          font-size: 0.875rem;
          font-weight: 500;
          margin: 0;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .footer-warning {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardFooter;
