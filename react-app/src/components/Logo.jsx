const Logo = ({ theme }) => {
  // MTG mana colors
  const colors = {
    white: '#F8F6D8',
    blue: '#0E68AB',
    black: '#150B00',
    red: '#D3202A',
    green: '#00733E',
    default: '#646cff'
  };

  const primaryColor = colors[theme] || colors.default;
  const secondaryColor = theme === 'white' ? '#CCC' : theme === 'black' ? '#444' : '#888';

  return (
    <svg 
      className="logo" 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MTG Tournament Logo"
    >
      {/* Shield/Pentagon background */}
      <path
        d="M100,20 L180,70 L160,150 L40,150 L20,70 Z"
        fill={primaryColor}
        opacity="0.2"
        stroke={primaryColor}
        strokeWidth="3"
      />
      
      {/* Inner Pentagon */}
      <path
        d="M100,40 L160,80 L145,140 L55,140 L40,80 Z"
        fill="none"
        stroke={primaryColor}
        strokeWidth="2"
      />

      {/* MTG Text */}
      <text
        x="100"
        y="110"
        fontFamily="Arial Black, sans-serif"
        fontSize="60"
        fontWeight="bold"
        fill={primaryColor}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          paintOrder: 'stroke fill',
          stroke: secondaryColor,
          strokeWidth: '2px',
          strokeLinejoin: 'round'
        }}
      >
        MTG
      </text>

      {/* Decorative elements - small circles at pentagon points */}
      <circle cx="100" cy="20" r="5" fill={primaryColor} />
      <circle cx="180" cy="70" r="5" fill={primaryColor} />
      <circle cx="160" cy="150" r="5" fill={primaryColor} />
      <circle cx="40" cy="150" r="5" fill={primaryColor} />
      <circle cx="20" cy="70" r="5" fill={primaryColor} />
    </svg>
  );
};

export default Logo;
