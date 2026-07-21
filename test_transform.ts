export const transformSvgPaths = (svgString: string, scale: number, tx: number, ty: number): string => {
  return svgString.replace(/d=["']([^"']*)["']/gi, (match, d) => {
    const regex = /([MmLlHhVvQqCcZz])\s*([0-9eE\s,.-]*)/g;
    let newD = "";
    let cmdMatch;
    let currX = 0;
    let currY = 0;
    
    // We must track absolute coordinates for relative commands, but here we can just scale the relative values!
    // Wait, if it's relative (dx, dy), we just scale dx and dy! We don't translate them!
    // Translate ONLY applies to absolute coordinates!
    // But wait, what if we convert everything to absolute?
    // It's easier to just scale all coordinates, and ONLY translate the first 'M' or 'm' (which acts as absolute anyway).
    // Wait, 'm' is relative, but the first 'm' in a path is treated as absolute according to SVG spec!
    return match;
  });
}
