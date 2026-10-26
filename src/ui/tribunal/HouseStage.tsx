import type { FamilyRoom } from '../../content/sixieme-place';
import styles from './tribunal.module.css';

// Authored stage geometry: six settings, five occupants; no phantom figure.
export function HouseStage({ room }: { room: FamilyRoom }) {
  return (
    <div
      className={styles.houseArt}
      key={room}
      data-room={room}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="wall" x2="0.8" y2="1">
            <stop stopColor="#4b4540" />
            <stop offset="1" stopColor="#141416" />
          </linearGradient>
          <linearGradient id="wood" x2="1" y2="0.3">
            <stop stopColor="#503c2d" />
            <stop offset=".5" stopColor="#261b17" />
            <stop offset="1" stopColor="#110f0f" />
          </linearGradient>
          <radialGradient id="lamp">
            <stop stopColor="#f0cf8d" stopOpacity=".42" />
            <stop offset="1" stopColor="#e4c896" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sky" x2="0" y2="1">
            <stop stopColor="#293640" />
            <stop offset="1" stopColor="#0d1117" />
          </linearGradient>
          <pattern
            id="boards"
            width="100"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 0H100V80"
              fill="none"
              stroke="#a99479"
              strokeOpacity=".1"
            />
          </pattern>
          <filter id="grain">
            <feTurbulence baseFrequency=".6" numOctaves="3" seed="12" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope=".06" />
            </feComponentTransfer>
          </filter>
        </defs>
        {room === 'outside' ? (
          <>
            <path fill="url(#sky)" d="M0 0H1200V720H0z" />
            <path
              fill="#0a0e10"
              d="M0 80L140 0L190 380L65 720H0zM1050 0L1200 60V720H1120L1010 400z"
            />
            <path
              fill="#25282a"
              stroke="#595550"
              d="M280 240L600 85L955 250V590H280z"
            />
            <path
              fill="#100f11"
              d="M220 255L600 52L1020 260L955 272L600 105L270 278z"
            />
            <path
              fill="#1b1716"
              stroke="#6a5b4a"
              strokeWidth="6"
              d="M505 340H625V590H505z"
            />
            {[345, 700, 830].map((x) => (
              <g key={x}>
                <path fill="#aa8c5e" d={`M${x} 320h80v130h-80z`} />
                <path
                  stroke="#292523"
                  strokeWidth="8"
                  d={`M${x + 40} 320v130M${x} 385h80`}
                />
              </g>
            ))}
            <ellipse fill="url(#lamp)" cx="770" cy="400" rx="340" ry="250" />
            <path fill="#3a3c3b" d="M510 580H620L950 720H190z" />
            {Array.from({ length: 35 }, (_, i) => (
              <path
                key={i}
                stroke="#afb9be"
                strokeOpacity=".25"
                d={`M${i * 39} ${(i % 4) * 150}l-23 95`}
              />
            ))}
            <path fill="#080a0c" d="M0 650Q600 575 1200 650V720H0z" />
          </>
        ) : room === 'album' ? (
          <>
            <path fill="url(#wood)" d="M0 0H1200V720H0z" />
            <path fill="url(#boards)" d="M0 0H1200V720H0z" />
            <ellipse fill="url(#lamp)" cx="520" cy="320" rx="650" ry="600" />
            <path
              fill="#171313"
              stroke="#796856"
              strokeWidth="4"
              d="M185 145L595 100L1050 190L1010 610L600 555L210 610z"
            />
            <path
              fill="#b4a58b"
              d="M220 165L590 130L600 530L235 580zM610 130L1020 210L980 575L620 530z"
            />
            <path
              fill="#36302a"
              stroke="#d3c5a5"
              strokeWidth="12"
              d="M275 220L520 198L530 425L295 450z"
            />
            <path fill="#756958" d="M290 360L520 338L530 390L295 415z" />
            {[325, 375, 425].map((x, i) => (
              <g key={x} fill="#211f1e">
                <circle cx={x} cy={280 + i * 3} r="15" />
                <path d={`M${x - 18} ${300 + i * 3}h36l10 65h-55z`} />
              </g>
            ))}
            <path fill="#aaa086" d="M475 200L520 198L530 425L485 430z" />
            <path stroke="#292a27" strokeWidth="24" d="M675 260L950 310" />
            {Array.from({ length: 6 }, (_, i) => (
              <g
                key={i}
                transform={`translate(${683 + i * 43} ${250 + i * 8})`}
              >
                <rect width="33" height="38" fill="#ad875d" />
                <circle cx="16" cy="10" r="5" fill="#29241f" />
                <path d="M9 19h14l4 15H5z" fill="#29241f" />
              </g>
            ))}
            <path
              stroke="#ddc9a2"
              strokeDasharray="3 8"
              strokeWidth="3"
              d="M665 242L965 296M665 286L965 340"
            />
          </>
        ) : (
          <>
            <path fill="url(#wall)" d="M0 0H1200V720H0z" />
            <path fill="#1e1917" d="M0 510L600 425L1200 510V720H0z" />
            <path fill="url(#boards)" d="M0 510L600 425L1200 510V720H0z" />
            <path
              stroke="#7e6b53"
              strokeOpacity=".35"
              d="M0 490L600 408L1200 490M0 90H1200"
            />
            {room === 'table' ? (
              <>
                <path
                  fill="#947d56"
                  stroke="#1d1c1d"
                  strokeWidth="20"
                  d="M770 95H1040V410H770z"
                />
                <path
                  stroke="#252426"
                  strokeWidth="12"
                  d="M905 95V410M770 260H1040"
                />
                <path
                  fill="#2a2929"
                  d="M730 70L795 88L775 455L713 460zM1035 75L1100 55L1110 460L1040 445z"
                />
                <ellipse
                  fill="url(#lamp)"
                  cx="620"
                  cy="315"
                  rx="600"
                  ry="400"
                />
                {[
                  { x: 250, y: 290 },
                  { x: 590, y: 240 },
                  { x: 930, y: 315 },
                  { x: 345, y: 500 },
                  { x: 520, y: 535 },
                ].map(({ x, y }, i) => (
                  <g key={i} fill={i === 1 ? '#292523' : '#25252a'}>
                    <ellipse cx={x} cy={y} rx="31" ry="39" />
                    <path
                      d={`M${x - 27} ${y + 35}q-35 32 -34 115h122q0-85-34-115z`}
                    />
                    <path
                      stroke="#8a7661"
                      strokeOpacity=".35"
                      d={`M${x - 22} ${y + 44}q22 20 44 0`}
                    />
                  </g>
                ))}
                <path fill="#120f10" d="M230 460L955 445L1100 720H100z" />
                <path fill="#a99c83" d="M310 390L875 390L1010 630H180z" />
                <path
                  stroke="#d4c5a5"
                  strokeOpacity=".4"
                  d="M310 400L875 400M205 604H990"
                />
                {[
                  { x: 390, y: 425 },
                  { x: 585, y: 418 },
                  { x: 780, y: 425 },
                  { x: 350, y: 555 },
                  { x: 580, y: 565 },
                  { x: 825, y: 555 },
                ].map(({ x, y }, i) => (
                  <g key={i} data-setting={i + 1}>
                    <ellipse cx={x} cy={y} rx="45" ry="18" fill="#d6ccad" />
                    <ellipse
                      cx={x}
                      cy={y}
                      rx="31"
                      ry="11"
                      fill="#b4a78d"
                      stroke="#837660"
                    />
                    <path
                      stroke="#ded3b7"
                      strokeWidth="3"
                      d={`M${x - 58} ${y - 12}v28M${x + 57} ${y - 12}v28`}
                    />
                    <ellipse
                      cx={x + 49}
                      cy={y - 30}
                      rx="9"
                      ry="5"
                      fill="none"
                      stroke="#d0c2a1"
                    />
                    <path
                      stroke="#d0c2a1"
                      d={`M${x + 40} ${y - 30}l3 20h12l3-20`}
                    />
                    <path
                      fill="#d5c7ab"
                      d={`M${x - 70} ${y - 14}h10v29h-10z`}
                    />
                  </g>
                ))}
                <path
                  fill="#252224"
                  stroke="#665444"
                  strokeWidth="7"
                  d="M895 570V695H1000V570z"
                />
                <path fill="#171517" d="M885 680H1010V720H885z" />
                <path stroke="#b7a17a" d="M600 0V120" />
                <path fill="#43392a" d="M550 120H650L690 170H510z" />
              </>
            ) : (
              <>
                <path
                  fill="#111114"
                  stroke="#7e6b53"
                  strokeWidth="6"
                  d="M640 110H820V485H640z"
                />
                <path fill="#44392b" d="M660 130H800V470H660z" />
                <path stroke="#796b52" d="M730 155V435M680 300H780" />
                <circle fill="#ad9772" cx="782" cy="325" r="5" />
                <path
                  fill="#090a0b"
                  stroke="#5d5144"
                  d="M950 145H1190V530H950z"
                />
                {[
                  { x: 110, y: 155, w: 90, h: 110 },
                  { x: 250, y: 120, w: 110, h: 140 },
                  { x: 395, y: 170, w: 85, h: 95 },
                ].map(({ x, y, w, h }) => (
                  <g key={x}>
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      fill="#938a76"
                      opacity=".23"
                    />
                    <circle cx={x + w / 2} cy={y - 6} r="3" fill="#b3a38a" />
                  </g>
                ))}
                <path
                  fill="url(#wood)"
                  stroke="#64513e"
                  d="M90 430H430V485H90zM105 480H125V650H105zM400 480H420V650H400z"
                />
                <path
                  fill="#271f1c"
                  stroke="#ac9679"
                  d="M180 421L330 411L355 437L200 447z"
                />
                <path stroke="#b6a185" strokeWidth="5" d="M390 425V335" />
                <path fill="#bba273" d="M350 335L368 285H410L430 335z" />
                <ellipse
                  fill="url(#lamp)"
                  cx="370"
                  cy="340"
                  rx="320"
                  ry="290"
                />
                <path fill="#4a3830" d="M850 515L1190 620V690L850 560z" />
                <path
                  stroke="#88735a"
                  strokeWidth="9"
                  d="M860 540L1180 650M890 553V640M970 580V685M1050 610V720"
                />
              </>
            )}
          </>
        )}
        <path fill="#fff" filter="url(#grain)" d="M0 0H1200V720H0z" />
      </svg>
      <div className={styles.vignette} />
    </div>
  );
}
