// Metres in the cathedral's local reference frame. Each position and target follows a quadratic Bézier.
export const fps = 30;
export const shots = [
  {
    id: "west-towers", frames: 135, light: "day", lens: [75, 72],
    eye: [[-17, 2.4, 57], [-13.7, 3.0, 55], [-10.0, 3.8, 52.5]],
    aim: [[-.7, 48.2, -13], [-.1, 48.7, -13], [.7, 49.5, -13]]
  },
  {
    id: "cathedral-square", frames: 90, light: "day", lens: [52, 51],
    eye: [[13.3, 1.85, 21], [16.1, 1.90, 22.4], [18.7, 2.02, 24.0]],
    aim: [[36, 10.1, 53.7], [36.6, 10.1, 54.0], [37, 10.3, 54.2]]
  },
  {
    id: "west-portal", frames: 180, light: "day", lens: [61, 64],
    eye: [[.60, 1.78, 10.6], [.10, 1.70, 2.0], [-.28, 1.72, -8.0]],
    aim: [[.3, 4.1, -21], [.1, 4.7, -24], [0, 6.3, -34]]
  },
  {
    id: "nave", frames: 171, light: "day", lens: [56, 54],
    eye: [[.58, 1.47, -30.8], [.15, 1.58, -36.0], [-.38, 1.73, -42.1]],
    aim: [[-.25, 12.3, -85.6], [0, 12.6, -90], [.35, 13.6, -94.3]]
  },
  {
    id: "leaded-glass", frames: 105, light: "day", lens: [52, 48],
    eye: [[17.4, 5.14, -54.35], [17.9, 5.82, -53.4], [18.55, 6.48, -52.30]],
    aim: [[22.60, 7.3, -50.6], [22.60, 7.8, -50.4], [22.60, 8.3, -50.05]]
  },
  {
    id: "vault", frames: 141, light: "day", lens: [60, 56],
    eye: [[1.55, 4.2, -51.7], [.91, 5.8, -56.3], [.03, 7.4, -60.2]],
    aim: [[-.9, 40.9, -68.1], [-.1, 41.5, -71.5], [.55, 42.0, -73.8]]
  },
  {
    id: "south-transept", frames: 96, light: "day", lens: [57, 55],
    eye: [[2.8, 2.1, -79.85], [4.9, 2.22, -78.4], [7.25, 2.45, -76.8]],
    aim: [[42.48, 14.0, -78.0], [42.48, 15.5, -77.8], [42.48, 17.1, -77.45]]
  },
  {
    id: "reliquary", frames: 150, light: "dusk", lens: [45, 43],
    eye: [[2.20, 1.73, -119.75], [2.57, 1.89, -119.32], [2.68, 2.08, -118.55]],
    aim: [[0, 1.78, -116.9], [0, 1.82, -116.93], [0, 1.86, -116.98]]
  },
  {
    id: "openwork-spires", frames: 114, light: "dusk", lens: [46, 43],
    eye: [[48, 106, 52], [40, 111, 47], [34, 116, 44]],
    aim: [[6, 114, -11], [7.3, 118, -10.9], [8, 122, -10.7]]
  },
  {
    id: "city-at-dusk", frames: 168, light: "dusk", lens: [60, 59],
    eye: [[-125, 85, 75], [-125, 90.5, 91], [-124, 96, 108]],
    aim: [[0, 78, -44], [.4, 79, -43], [1.2, 80.5, -41]]
  }
];

export const frameCount = shots.reduce((total, shot) => total + shot.frames, 0);

function bezier([a, b, c], t) {
  const s = 1 - t;
  return a.map((start, i) => s * s * start + 2 * s * t * b[i] + t * t * c[i]);
}

export function framePose(index) {
  let frame = Math.min(frameCount - 1, Math.max(0, Math.floor(index)));
  for (const shot of shots) {
    if (frame < shot.frames) {
      const u = (frame + .5) / shot.frames;
      const t = .74 * u + .26 * u * u * (3 - 2 * u);
      return {
        shot: shot.id,
        light: shot.light,
        eye: bezier(shot.eye, t),
        aim: bezier(shot.aim, t),
        fov: shot.lens[0] + (shot.lens[1] - shot.lens[0]) * t
      };
    }
    frame -= shot.frames;
  }
}
