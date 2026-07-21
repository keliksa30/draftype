import { potrace, init } from "esm-potrace-wasm";
import { createCanvas } from "canvas";

async function test() {
  await init();
  const canvas = createCanvas(100, 100);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = "black";
  ctx.fillRect(20, 20, 60, 60);

  const svg = await potrace(canvas, {
    turdsize: 2,
    turnpolicy: 4,
    optcurve: true,
    opttolerance: 0.2,
  });
  console.log(svg);
}
test();
