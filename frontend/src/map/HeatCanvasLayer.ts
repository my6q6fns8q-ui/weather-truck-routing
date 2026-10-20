import L from "leaflet";
import type { HeatPoint } from "../types";

const RGB = ["52,199,89", "255,204,0", "255,149,0", "255,59,48", "175,82,222"];
const ALPHA = [0.3, 0.55, 0.62, 0.7, 0.78];
const BLOB_RADIUS_MI = 22;
const METERS_PER_MILE = 1609.344;
const PAD = 0.5;

export class HeatCanvasLayer extends L.Layer {
  private canvas?: HTMLCanvasElement;
  private topLeft?: L.LatLng;
  private hour = 0;
  private frame = 0;
  private points: HeatPoint[];

  constructor(points: HeatPoint[]) {
    super();
    this.points = points;
  }

  onAdd(map: L.Map): this {
    const canvas = (this.canvas = L.DomUtil.create("canvas", "heat-canvas leaflet-zoom-animated") as HTMLCanvasElement);
    map.getPane("heatPane")!.appendChild(canvas);
    this.reset();
    return this;
  }

  onRemove(): this {
    cancelAnimationFrame(this.frame);
    this.canvas?.remove();
    return this;
  }

  getEvents() {
    return {
      moveend: () => this.reset(),
      resize: () => this.reset(),
      zoomanim: (e: L.LeafletEvent) => this.animateZoom(e as L.ZoomAnimEvent),
    };
  }

  setHour(hour: number) {
    this.hour = hour;
    this.schedule();
  }

  private schedule() {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.draw());
  }

  private reset() {
    const map = this._map;
    const canvas = this.canvas;
    if (!map || !canvas) return;
    const size = map.getSize();
    const padX = size.x * PAD;
    const padY = size.y * PAD;
    const origin = L.point(-padX, -padY);
    const dpr = window.devicePixelRatio || 1;
    const w = size.x + 2 * padX;
    const h = size.y + 2 * padY;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    this.topLeft = map.containerPointToLatLng(origin);
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint(origin));
    this.draw();
  }

  private animateZoom(e: L.ZoomAnimEvent) {
    const map = this._map as L.Map & {
      _latLngToNewLayerPoint(ll: L.LatLng, zoom: number, center: L.LatLng): L.Point;
    };
    if (!this.canvas || !this.topLeft) return;
    const scale = map.getZoomScale(e.zoom, map.getZoom());
    const offset = map._latLngToNewLayerPoint(this.topLeft, e.zoom, e.center);
    L.DomUtil.setTransform(this.canvas, offset, scale);
  }

  private draw() {
    const map = this._map;
    const canvas = this.canvas;
    if (!map || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const size = map.getSize();
    const zoom = map.getZoom();
    const visible = this.points
      .map((p) => ({ p, level: p.risk[Math.min(this.hour, p.risk.length - 1)] }))
      .sort((a, b) => a.level - b.level);

    for (const { p, level } of visible) {
      const c = map.latLngToContainerPoint([p.lat, p.lon]);
      const x = c.x + size.x * PAD;
      const y = c.y + size.y * PAD;
      const metersPerPx = (40075016.686 * Math.cos((p.lat * Math.PI) / 180)) / (256 * 2 ** zoom);
      const r = Math.min(500, Math.max(14, (BLOB_RADIUS_MI * METERS_PER_MILE) / metersPerPx));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${RGB[level]},${ALPHA[level]})`);
      g.addColorStop(0.55, `rgba(${RGB[level]},${ALPHA[level] * 0.65})`);
      g.addColorStop(1, `rgba(${RGB[level]},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  }
}
