import React from 'react';
import AppLogo from '@/components/ui/AppLogo';

const Footer: React.FC = () => {
  return (
    <footer className="border-t py-16 px-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <AppLogo text="Stream" iconName="FilmIcon" size={28} />

        <div className="flex items-center gap-4">
          {[
            { name: 'twitter', icon: 'ChatBubbleLeftIcon' },
            { name: 'instagram', icon: 'CameraIcon' },
            { name: 'github', icon: 'CodeBracketIcon' },
          ].map((social) => (
            <a
              key={social.name}
              href="#"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,240,240,0.45)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,47,255,0.5)';
                (e.currentTarget as HTMLElement).style.color = '#7B2FFF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(240,240,240,0.45)';
              }}
              aria-label={social.name}
            ></a>
          ))}
        </div>
      </div>

      <div
        className="max-w-6xl mx-auto mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p className="text-xs" style={{ color: 'rgba(240,240,240,0.3)' }}>
          © 2026 Stream Inc. All rights reserved.
        </p>
        <div className="flex gap-6">
          {['Privacy', 'Terms'].map((l) => (
            <a
              key={l}
              href="#"
              className="text-xs transition-colors"
              style={{ color: 'rgba(240,240,240,0.3)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F0F0F0')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,240,0.3)')}
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
