// Geometry for the chart of totals by size: where a dot's name goes, and which dots no smaller
// model beats. All of it runs at build time; the page carries only the answers.

// Sizes in pixels, as the stylesheet sets them: a letter's width at the chart's text size, a line
// of it, a dot with its ring, and the gaps between a dot and its name.
const LETTER = 7.8;
const LINE = 18;
const DOT = 7;
const BESIDE = 10;
const ABOVE = 8;
const CORNER = 6;

// Where a name may go round its dot, most wanted first.
const SPOTS = ['e', 'w', 'ne', 'se', 'n', 's', 'nw', 'sw'];

function box(at, width, spot) {
  const { x, y } = at;
  switch (spot) {
    case 'e': return [x + BESIDE, y - LINE / 2, x + BESIDE + width, y + LINE / 2];
    case 'w': return [x - BESIDE - width, y - LINE / 2, x - BESIDE, y + LINE / 2];
    case 'n': return [x - width / 2, y - ABOVE - LINE, x + width / 2, y - ABOVE];
    case 's': return [x - width / 2, y + ABOVE, x + width / 2, y + ABOVE + LINE];
    case 'ne': return [x + CORNER, y - CORNER - LINE, x + CORNER + width, y - CORNER];
    case 'se': return [x + CORNER, y + CORNER, x + CORNER + width, y + CORNER + LINE];
    case 'nw': return [x - CORNER - width, y - CORNER - LINE, x - CORNER, y - CORNER];
    default: return [x - CORNER - width, y + CORNER, x - CORNER, y + CORNER + LINE];
  }
}

const shared = (a, b) =>
  Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));

// A spot for every name, for a plot of this width and height: the plot at its smallest. A name
// keeps clear of the other dots, the other names, the line and the plot's edges. A wider plot only
// moves the dots further apart, so spots found here hold at every greater width.
export function place(marks, { width, height }) {
  const dots = marks.map((mark) => ({ x: mark.x * width, y: (1 - mark.y) * height }));
  const widths = marks.map((mark) => mark.label.length * LETTER);
  const frame = [0, -LINE, width, height];
  const spots = marks.map(() => 'e');
  const boxes = marks.map((_, index) => box(dots[index], widths[index], 'e'));

  // The line, as a thin box for each of its steps.
  const corners = path(marks).map(([x, y]) => [x * width, (1 - y) * height]);
  const line = corners.slice(1).map(([x, y], index) => {
    const [fromX, fromY] = corners[index];
    return [Math.min(fromX, x) - 3, Math.min(fromY, y) - 3, Math.max(fromX, x) + 3, Math.max(fromY, y) + 3];
  });

  const cost = (index, candidate) => {
    const area = (candidate[2] - candidate[0]) * (candidate[3] - candidate[1]);
    let total = (area - shared(candidate, frame)) * 10;
    dots.forEach((dot, other) => {
      if (other !== index) total += shared(candidate, [dot.x - DOT, dot.y - DOT, dot.x + DOT, dot.y + DOT]) * 3;
    });
    boxes.forEach((placed, other) => {
      if (other !== index) total += shared(candidate, placed);
    });
    line.forEach((step) => {
      total += shared(candidate, step) * 2;
    });
    return total;
  };

  // Each name in turn takes the best spot left, given where the others now are. A few rounds settle it.
  for (let round = 0; round < 4; round += 1) {
    marks.forEach((_, index) => {
      let best = Infinity;
      for (const spot of SPOTS) {
        const candidate = box(dots[index], widths[index], spot);
        const price = cost(index, candidate);
        if (price < best) {
          best = price;
          spots[index] = spot;
          boxes[index] = candidate;
        }
        if (price === 0) break;
      }
    });
  }
  return spots;
}

// The marks that no mark of the same size or smaller beats, smallest first.
export function frontier(marks) {
  let best = -Infinity;
  return [...marks]
    .sort((a, b) => a.x - b.x || b.y - a.y)
    .filter((mark) => {
      if (mark.y <= best) return false;
      best = mark.y;
      return true;
    });
}

// The best total at each size or under, as the corners of its steps: across from each mark on
// the edge to the next one's size, then up to it, and on from the last to the plot's far side.
function path(marks) {
  const edge = frontier(marks);
  const corners = [];
  edge.forEach((mark, index) => {
    if (index) corners.push([mark.x, edge[index - 1].y]);
    corners.push([mark.x, mark.y]);
  });
  if (edge.length) corners.push([1, edge[edge.length - 1].y]);
  return corners;
}

// The same line for a 100 by 100 box with its top at 0.
export const steps = (marks) => path(marks).map(([x, y]) => `${x * 100},${(1 - y) * 100}`).join(' ');
