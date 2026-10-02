import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { circlePolygon, hotspotCollections, zoomForRadius } from "../geo.js";

const STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const EMPTY = { type: "FeatureCollection", features: [] };

function setSource(map, id, data) {
  const source = map.getSource(id);
  if (source) source.setData(data);
}

function addZoneLayers(map) {
  const sources = ["zones-high", "zones-mod", "zones-selected", "zone-centers"];
  for (const id of sources) {
    map.addSource(id, { type: "geojson", data: EMPTY });
  }

  map.addLayer({
    id: "zones-mod-fill",
    type: "fill",
    source: "zones-mod",
    paint: { "fill-color": "#e3a23a", "fill-opacity": 0.2 },
  });
  map.addLayer({
    id: "zones-high-fill",
    type: "fill",
    source: "zones-high",
    paint: { "fill-color": "#e23b2b", "fill-opacity": 0.28 },
  });
  map.addLayer({
    id: "zones-mod-line",
    type: "line",
    source: "zones-mod",
    paint: { "line-color": "#e3a23a", "line-width": 1.5, "line-opacity": 0.9 },
  });
  map.addLayer({
    id: "zones-high-line",
    type: "line",
    source: "zones-high",
    paint: { "line-color": "#e23b2b", "line-width": 1.6, "line-opacity": 0.95 },
  });
  map.addLayer({
    id: "zones-selected-line",
    type: "line",
    source: "zones-selected",
    paint: { "line-color": "#f4efe6", "line-width": 2.5, "line-opacity": 1 },
  });
  map.addLayer({
    id: "zone-centers",
    type: "circle",
    source: "zone-centers",
    paint: {
      "circle-radius": 5,
      "circle-color": "#12110e",
      "circle-stroke-width": 2,
      "circle-stroke-color": ["match", ["get", "risk"], "HIGH", "#e23b2b", "#e3a23a"],
    },
  });
}

export default function DispatchMap({
  hotspots,
  selectedId,
  focusToken,
  reportOpen,
  pin,
  onSelect,
  onPlace,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const hotspotsRef = useRef(hotspots);
  const reportOpenRef = useRef(reportOpen);
  const onSelectRef = useRef(onSelect);
  const onPlaceRef = useRef(onPlace);
  const [mapLoaded, setMapLoaded] = useState(false);

  hotspotsRef.current = hotspots;
  reportOpenRef.current = reportOpen;
  onSelectRef.current = onSelect;
  onPlaceRef.current = onPlace;

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [28.0473, -26.2041],
      zoom: 11,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }),
      "top-right",
    );
    mapRef.current = map;

    map.on("load", () => {
      addZoneLayers(map);
      setMapLoaded(true);
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const element = containerRef.current;
    if (!map || !element || !mapLoaded) return undefined;
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(element);
    return () => observer.disconnect();
  }, [mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const collections = hotspotCollections(hotspots);
    setSource(map, "zones-high", collections.high);
    setSource(map, "zones-mod", collections.moderate);
    setSource(map, "zone-centers", collections.centers);

    const selected = hotspots.find((item) => item.hotspot_id === selectedId);
    const selectedData = selected
      ? {
          type: "FeatureCollection",
          features: [circlePolygon(selected.latitude, selected.longitude, selected.radius)],
        }
      : EMPTY;
    setSource(map, "zones-selected", selectedData);
  }, [hotspots, selectedId, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !map.getLayer("zones-high-fill")) return undefined;

    let frame = 0;
    const started = performance.now();
    const tick = (now) => {
      const wave = (Math.sin(((now - started) / 3200) * Math.PI * 2) + 1) / 2;
      if (map.getLayer("zones-high-fill")) {
        map.setPaintProperty("zones-high-fill", "fill-opacity", 0.14 + wave * 0.24);
        map.setPaintProperty("zones-high-line", "line-opacity", 0.45 + wave * 0.55);
        map.setPaintProperty("zones-high-line", "line-width", 1.2 + wave * 2.1);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !focusToken) return;
    const hotspot = hotspotsRef.current.find((item) => item.hotspot_id === selectedId);
    if (!hotspot) return;
    const narrow = window.matchMedia("(max-width: 767px)").matches;
    map.flyTo({
      center: [hotspot.longitude, hotspot.latitude],
      zoom: zoomForRadius(
        hotspot.radius,
        hotspot.latitude,
        map.getContainer().clientWidth,
      ),
      padding: {
        left: narrow ? 20 : 420,
        right: reportOpenRef.current && !narrow ? 400 : 40,
        top: 72,
        bottom: narrow ? 210 : 40,
      },
      duration: 1100,
      essential: true,
    });
  }, [focusToken, selectedId, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return undefined;
    const onClick = (event) => {
      if (!event.lngLat) return;
      if (reportOpenRef.current) {
        onPlaceRef.current?.({
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        });
        return;
      }
      const layerIds = [
        "zones-high-fill",
        "zones-mod-fill",
        "zones-high-line",
        "zones-mod-line",
        "zone-centers",
      ].filter((id) => map.getLayer(id));
      const hits = map.queryRenderedFeatures(event.point, { layers: layerIds });
      if (hits.length > 0) {
        onSelectRef.current?.(hits[0].properties.hotspot_id);
      }
    };
    map.on("click", onClick);
    return () => map.off("click", onClick);
  }, [mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    map.getCanvas().style.cursor = reportOpen ? "crosshair" : "";
  }, [reportOpen, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (!pin) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const lngLat = [pin.longitude, pin.latitude];
    if (!markerRef.current) {
      const element = document.createElement("div");
      element.className = "report-pin";
      element.setAttribute("aria-hidden", "true");
      // setLngLat before addTo. Adding a marker with no location crashes MapLibre.
      markerRef.current = new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat(lngLat)
        .addTo(map);
      return;
    }
    markerRef.current.setLngLat(lngLat);
  }, [pin, mapLoaded]);

  return (
    <div className="absolute inset-0">
      {/* MapLibre forces position:relative on its container, so size lives on this wrapper. */}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
