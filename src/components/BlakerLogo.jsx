export default function BlakerLogo({ size = 48, showTagline = false, center = false }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: center ? 'center' : 'flex-start',
      gap: 6,
    }}>
      {/* Pure CSS text logo — always renders correctly */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 0,
        lineHeight: 1,
      }}>
        {/* Speed slash */}
        <span style={{
          display: 'inline-block',
          width: size * 0.12,
          height: size * 0.85,
          background: 'var(--accent)',
          borderRadius: 2,
          transform: 'skewX(-12deg)',
          marginRight: size * 0.06,
          flexShrink: 0,
          alignSelf: 'center',
        }} />
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: size,
          letterSpacing: '-0.02em',
          color: '#111111',
          lineHeight: 1,
        }}>
          BL
        </span>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: size,
          letterSpacing: '-0.02em',
          color: 'var(--accent)',
          lineHeight: 1,
        }}>
          A
        </span>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: size,
          letterSpacing: '-0.02em',
          color: '#111111',
          lineHeight: 1,
        }}>
          KER
        </span>
      </div>

      {showTagline && (
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: Math.max(10, size * 0.22),
          fontWeight: 700,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
        }}>
          RIDERS COMMUNITY · SPAIN
        </span>
      )}
    </div>
  )
}
