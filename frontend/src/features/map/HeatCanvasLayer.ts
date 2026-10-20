import L from "leaflet";
import { riskRgb } from "@/domain/risk";
import type { HeatPoint } from "@/domain/types";

const RGB = [0, 1, 2, 3, 4].map(riskRgb);
const ALPHA = [0.3, 0.55, 0.62, 0.7, 0.78];
const BLOB_RADIUS_MI = 22;
const METERS_PER_MILE = 1609.344;
const EARTH_CIRCUMFERENCE_M = 40075016.686;
const TILE_SIZE_PX = 256;
const MIN_BLOB_PX = 14;
const MAX_BLOB_PX = 500;
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
    const canvas = (this.canvas = L.DomUtil.create(
      "canvas",
      "heat-canvas leaflet-zoom-animated",
    ) as HTMLCanvasElement);
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
      zoomanim: (event: L.LeafletEvent) =>
        this.animateZoom(event as L.ZoomAnimEvent),
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
    const width = size.x + 2 * padX;
    const height = size.y + 2 * padY;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    this.topLeft = map.containerPointToLatLng(origin);
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint(origin));
    this.draw();
  }

  private animateZoom(event: L.ZoomAnimEvent) {
    const map = this._map as L.Map & {
      _latLngToNewLayerPoint(
        latlng: L.LatLng,
        zoom: number,
        center: L.LatLng,
      ): L.Point;
    };
    if (!this.canvas || !this.topLeft) return;
    const scale = map.getZoomScale(event.zoom, map.getZoom());
    const offset = map._latLngToNewLayerPoint(
      this.topLeft,
      event.zoom,
      event.center,
    );
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
    const blobs = this.points
      .map((point) => ({
        point,
        level: point.risk[Math.min(this.hour, point.risk.length - 1)],
      }))
      .sort((a, b) => a.level - b.level);

    for (const { point, level } of blobs) {
      const container = map.latLngToContainerPoint([point.lat, point.lon]);
      const x = container.x + size.x * PAD;
      const y = container.y + size.y * PAD;
      const metersPerPx =
        (EARTH_CIRCUMFERENCE_M * Math.cos((point.lat * Math.PI) / 180)) /
        (TILE_SIZE_PX * 2 ** zoom);
      const radius = Math.min(
        MAX_BLOB_PX,
        Math.max(MIN_BLOB_PX, (BLOB_RADIUS_MI * METERS_PER_MILE) / metersPerPx),
      );

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${RGB[level]},${ALPHA[level]})`);
      gradient.addColorStop(0.55, `rgba(${RGB[level]},${ALPHA[level] * 0.65})`);
      gradient.addColorStop(1, `rgba(${RGB[level]},0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
    }
  }
}
