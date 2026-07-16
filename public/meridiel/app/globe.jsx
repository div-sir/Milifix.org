/* ============================================================
   MERIDIEL — GlobeView (globe.gl wrapper, React)
   Vintage-map globe + animated flight arcs.
   Supports: theme (light/dark), unified camera focus (selection
   AND flight-by-flight replay), draw-on arc entrances.
   ============================================================ */
import { UI } from "./ui-registry.js";
import { ATLAS } from "./data.js";

const { useRef, useEffect } = React;

function paletteFor(theme) {
  if (theme === "dark") {
    return {
      ocean: "#0E1F26", land: "#C2AC76", landEdge: "rgba(120,95,55,0.5)",
      // selected/focused route: a brighter, higher-contrast version of the same
      // ochre→vermilion hues (not an unrelated color) so it reads as "this one,
      // lit up" rather than a swap to a flat, washed-out highlight color.
      arcA: "#E0B158", arcB: "#E06A4F", arcSelA: "#FFDD8A", arcSelB: "#FF8B6C",
      point: "#E0B158", atmosphere: "#5E8088", emissive: "#0E1F26",
      specular: "#13343b",
    };
  }
  return {
    ocean: "#15303A", land: "#E3CE9E", landEdge: "rgba(120,95,55,0.55)",
    arcA: "#D29A3C", arcB: "#C24A33", arcSelA: "#F6C563", arcSelB: "#E85F42",
    point: "#D29A3C", atmosphere: "#C8923C", emissive: "#15303A",
    specular: "#1c4a52",
  };
}

const COUNTRIES_URL = "data/ne_110m_admin_0_countries.geojson?v=20260716j";

function GlobeView({ flights, selectedId, onSelect, autoRotate = true, onReady, focusFlight = null, theme = "light" }) {
  const elRef = useRef(null);
  const globeRef = useRef(null);
  const flightsRef = useRef(flights);
  const selRef = useRef(selectedId);
  const focusRef = useRef(focusFlight ? focusFlight.id : null);
  const palRef = useRef(paletteFor(theme));
  const flyTween = useRef(null);

  const isHot = (d) => d.id === selRef.current || d.id === focusRef.current;

  // GSAP-driven camera that travels the great-circle arc origin → destination,
  // arcing high in the middle and zooming in on landing.
  const flyAlongArc = (from, to, km) => {
    const world = globeRef.current;
    if (!world || !window.gsap) return;
    world.controls().autoRotate = false;
    if (flyTween.current) flyTween.current.kill();

    const toRad = (d) => d * Math.PI / 180;
    const φ1 = toRad(from.lat), λ1 = toRad(from.lng);
    const φ2 = toRad(to.lat),   λ2 = toRad(to.lng);
    const cosD = Math.sin(φ1)*Math.sin(φ2) + Math.cos(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);
    const angDist = Math.acos(Math.max(-1, Math.min(1, cosD)));

    // camera altitude envelope: rise over the arc, zoom in on arrival
    const dist = km || 8000;
    const startAlt = 1.55;
    const endAlt   = 1.05;
    const peakBump = Math.min(2.0, dist / 7000); // taller bump for longer routes
    const durationSec = Math.min(5.0, Math.max(2.8, dist / 3800));

    const proxy = { t: 0 };
    flyTween.current = window.gsap.to(proxy, {
      t: 1,
      duration: durationSec,
      ease: "power1.inOut",
      onUpdate: () => {
        const t = proxy.t;
        let lat, lng;
        if (angDist < 0.001) {
          lat = from.lat; lng = from.lng;
        } else {
          const sinD = Math.sin(angDist);
          const A = Math.sin((1 - t) * angDist) / sinD;
          const B = Math.sin(t * angDist) / sinD;
          const x = A*Math.cos(φ1)*Math.cos(λ1) + B*Math.cos(φ2)*Math.cos(λ2);
          const y = A*Math.cos(φ1)*Math.sin(λ1) + B*Math.cos(φ2)*Math.sin(λ2);
          const z = A*Math.sin(φ1) + B*Math.sin(φ2);
          lat = Math.atan2(z, Math.sqrt(x*x + y*y)) * 180 / Math.PI;
          // unwrap longitude to avoid 180°/-180° flip
          const rawLng = Math.atan2(y, x) * 180 / Math.PI;
          const prev = world.pointOfView().lng;
          let diff = rawLng - prev;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          lng = prev + diff;
        }
        // altitude: starts at startAlt, peaks mid-flight, settles at endAlt
        const altitude = startAlt + (endAlt - startAlt) * t + peakBump * Math.sin(t * Math.PI);
        world.pointOfView({ lat, lng, altitude }, 0);
      },
    });
  };

  // A flight's from/to should always carry valid coordinates (embedded at
  // add-time), but if one somehow doesn't — an older-schema record, a
  // partial sync — re-derive it from the current airport database via its
  // code rather than just dropping the flight outright. Losing a whole
  // route from the globe because of a recoverable data gap was worse than
  // the crash this was meant to prevent.
  const repairEndpoint = (point, code) => {
    if (point && isFinite(point.lat) && isFinite(point.lng)) return point;
    const a = code && ATLAS.AIRPORTS[code];
    return a ? { code, ...a } : null;
  };
  const sanitizeFlight = (f) => {
    if (!f) return null;
    const from = repairEndpoint(f.from, f.o || (f.from && f.from.code));
    const to = repairEndpoint(f.to, f.d || (f.to && f.to.code));
    if (!from || !to) {
      console.warn("Meridiel: dropping a flight with no usable coordinates", f);
      return null;
    }
    return from === f.from && to === f.to ? f : { ...f, from, to };
  };

  // Push the current flight list onto the globe as arcs + airport points.
  // Called from BOTH the flights-change effect and right after the globe is
  // created — because if the flights effect happens to run in a commit where
  // the globe isn't initialized yet, it bails out, and with a static flight
  // list it may never re-run, leaving the globe with land but no arcs/points.
  // Applying again at init close the loop regardless of effect ordering.
  const applyFlights = (world, list) => {
    const valid = (list || []).map(sanitizeFlight).filter(Boolean);
    console.log(`Meridiel: globe drawing ${valid.length} of ${(list || []).length} flight(s)`);
    world.arcsData(valid);
    const seen = {};
    const pts = [];
    valid.forEach((f) => {
      [f.from, f.to].forEach((p) => {
        if (p && !seen[p.code]) { seen[p.code] = 1; pts.push(p); }
      });
    });
    world.pointsData(pts);
  };

  // ---- init once ----
  useEffect(() => {
    if (!window.Globe || !elRef.current) return;
    const P = palRef.current;
    const world = Globe({ rendererConfig: { preserveDrawingBuffer: true, antialias: true } })(elRef.current)
      .backgroundColor("rgba(0,0,0,0)")
      .showAtmosphere(true)
      .atmosphereColor(P.atmosphere)
      .atmosphereAltitude(0.17)
      .showGraticules(true);

    // ocean sphere
    const mat = world.globeMaterial();
    mat.color.set(P.ocean);
    mat.shininess = 4;
    if (mat.specular) mat.specular.set(P.specular);
    if (mat.emissive) { mat.emissive.set(P.emissive); mat.emissiveIntensity = 0.6; }

    // Newer three.js (r155+) changed lighting intensities — boost lights so the
    // Phong globe reads clearly without depending on a global THREE.
    try {
      const existing = world.lights ? world.lights() : [];
      if (existing && existing.length) {
        existing.forEach((l) => {
          l.intensity = l.type === "AmbientLight" ? 2.2 : 3.0;
          if (l.color) l.color.set(l.type === "AmbientLight" ? 0xffffff : 0xfff1da);
        });
        const dir = existing.find((l) => l.type === "DirectionalLight");
        if (dir) {
          const rim = new dir.constructor(0x9fc6cf, 1.4);
          rim.position.set(-1, -0.5, -0.9);
          world.lights([...existing, rim]);
        } else { world.lights(existing); }
      }
    } catch (e) { /* noop */ }

    // arcs — hotter (selected / currently-flying) arcs are brighter, thicker,
    // and dash faster, like a plane actively tracing the route.
    world
      .arcStartLat((d) => d.from.lat)
      .arcStartLng((d) => d.from.lng)
      .arcEndLat((d) => d.to.lat)
      .arcEndLng((d) => d.to.lng)
      .arcColor((d) =>
        isHot(d)
          ? [palRef.current.arcSelA, palRef.current.arcSelB]
          : [palRef.current.arcA, palRef.current.arcB]
      )
      .arcStroke((d) => (isHot(d) ? 2.2 : 0.55))
      // altitude: longer routes arc much higher so transoceanic paths are visible
      .arcAltitude((d) => {
        const km = d.km || Math.round((d.miles || 0) * 1.60934);
        return Math.min(0.82, Math.max(0.09, km / 19000));
      })
      // non-hot: solid static line; hot: a short bright pulse chases along the
      // route (from → to) on a loop, so the selected flight reads as "in motion".
      .arcDashLength((d) => (isHot(d) ? 0.3 : 1))
      .arcDashGap((d) => (isHot(d) ? 1.2 : 0))
      .arcDashInitialGap(0)
      .arcDashAnimateTime((d) => (isHot(d) ? 1600 : 0))
      .arcsTransitionDuration(700)
      .arcLabel(
        (d) =>
          `<div class="globe-tip"><b>${d.from.code} → ${d.to.code}</b><span>${d.from.city} – ${d.to.city}</span><span>${d.miles.toLocaleString()} mi · ${d.year}</span></div>`
      )
      .onArcClick((d) => onSelect && onSelect(d.id));

    // airport points
    world
      .pointLat((d) => d.lat)
      .pointLng((d) => d.lng)
      .pointColor(() => palRef.current.point)
      .pointAltitude(0.012)
      .pointRadius((d) => (focusRef.current && (d.code === focusEnd(0) || d.code === focusEnd(1)) ? 0.4 : 0.22))
      .pointsMerge(false)
      .pointsTransitionDuration(700)
      .pointLabel(
        (d) =>
          `<div class="globe-tip"><b>${d.code}</b><span>${d.city}, ${d.country}</span></div>`
      )
      .onPointClick((d) => {
        // clicking an airport highlights the first connected flight
        const match = flightsRef.current.find(
          (f) => (f.from && f.from.code) === d.code || (f.to && f.to.code) === d.code
        );
        if (match) onSelect && onSelect(match.id);
      });

    function focusEnd(i) {
      const f = flightsRef.current.find((x) => x.id === focusRef.current);
      if (!f) return null;
      const p = i === 0 ? f.from : f.to;
      return p ? p.code : null;
    }

    // rings for the focused endpoints
    world
      .ringColor(() => (t) => `rgba(210,154,60,${Math.sqrt(1 - t)})`)
      .ringMaxRadius(4)
      .ringPropagationSpeed(2.2)
      .ringRepeatPeriod(900);

    // controls
    const controls = world.controls();
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.42;
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.minDistance = 180;
    controls.maxDistance = 520;
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
      if (flyTween.current) flyTween.current.kill();
    });
    let resumeT;
    controls.addEventListener("end", () => {
      clearTimeout(resumeT);
      resumeT = setTimeout(() => { controls.autoRotate = autoRotateRef.current; }, 2600);
    });

    world.pointOfView({ lat: 22, lng: -40, altitude: 2.6 }, 0);

    // Vintage land polygons are a pinned same-origin asset. Browser/CDN caching
    // now handles repeat visits without duplicating ~500 KB in localStorage or
    // making the globe depend on GitHub Raw being reachable at runtime.
    const drawLand = (features) => {
      world
        .polygonsData(features.filter((f) => f.properties && f.properties.ISO_A2 !== "AQ"))
        .polygonCapColor(() => palRef.current.land)
        .polygonSideColor(() => "rgba(120,95,55,0.25)")
        .polygonStrokeColor(() => palRef.current.landEdge)
        .polygonAltitude(0.008);
    };
    fetch(COUNTRIES_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((geo) => drawLand(geo.features))
      .catch((error) => console.error("Meridiel: land data failed to load —", error));

    globeRef.current = world;
    window.__GLOBE = world;
    // Draw the flights we already have right now, so arcs/points appear on the
    // first paint even if the flights-change effect ran before this init did.
    applyFlights(world, flightsRef.current);
    onReady && onReady(world);

    // --- Self-healing render watchdog (browser pauses rAF on hidden tabs) ---
    let lastFrame = -1;
    const renderer = world.renderer();
    const watchdog = setInterval(() => {
      const f = renderer.info.render.frame;
      if (f === lastFrame) {
        try { world._animationCycle && world._animationCycle(); } catch (e) {}
      }
      lastFrame = renderer.info.render.frame;
    }, 200);

    const onVis = () => {
      if (!document.hidden) {
        try { world.resumeAnimation && world.resumeAnimation(); } catch (e) {}
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const ro = new ResizeObserver(() => {
      if (!elRef.current) return;
      world.width(elRef.current.clientWidth).height(elRef.current.clientHeight);
    });
    ro.observe(elRef.current);

    return () => {
      ro.disconnect();
      clearInterval(watchdog);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // keep autoRotate intent in a ref for the resume timer
  const autoRotateRef = useRef(autoRotate);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
    if (globeRef.current) globeRef.current.controls().autoRotate = autoRotate;
  }, [autoRotate]);

  // ---- theme change: re-tint globe ----
  useEffect(() => {
    palRef.current = paletteFor(theme);
    const world = globeRef.current;
    if (!world) return;
    const P = palRef.current;
    const mat = world.globeMaterial();
    mat.color.set(P.ocean);
    if (mat.specular) mat.specular.set(P.specular);
    if (mat.emissive) mat.emissive.set(P.emissive);
    world.atmosphereColor(P.atmosphere);
    world
      .arcColor(world.arcColor())
      .pointColor(() => P.point)
      .polygonCapColor(() => P.land)
      .polygonStrokeColor(() => P.landEdge);
  }, [theme]);

  // ---- flights change ----
  useEffect(() => {
    flightsRef.current = flights;
    const world = globeRef.current;
    if (!world) {
      // Not an error: init hasn't run yet. The init effect will call
      // applyFlights(flightsRef.current) as soon as the globe exists, so this
      // exact list still gets drawn — it's just deferred to init.
      console.warn("Meridiel: flights changed before the globe was ready — will draw on init", { count: flights.length });
      return;
    }
    applyFlights(world, flights);
  }, [flights]);

  // ---- highlight (selection) recolor without moving camera ----
  useEffect(() => {
    selRef.current = selectedId;
    const world = globeRef.current;
    if (!world) return;
    world.arcColor(world.arcColor()).arcStroke(world.arcStroke())
         .arcDashLength(world.arcDashLength()).arcDashGap(world.arcDashGap())
         .arcDashAnimateTime(world.arcDashAnimateTime());
  }, [selectedId]);

  // ---- focus change: recolor + rings + CAMERA ZOOM (selection or replay) ----
  useEffect(() => {
    focusRef.current = focusFlight ? focusFlight.id : null;
    const world = globeRef.current;
    if (!world) return;

    // re-trigger arc + point accessors so the hot styling applies
    world.arcColor(world.arcColor()).arcStroke(world.arcStroke())
         .arcDashLength(world.arcDashLength()).arcDashGap(world.arcDashGap())
         .arcDashAnimateTime(world.arcDashAnimateTime())
         .pointRadius(world.pointRadius());

    const focus = sanitizeFlight(focusFlight);
    if (focus) {
      world.ringsData([focus.from, focus.to]);
      flyAlongArc(focus.from, focus.to, focus.km);
    } else {
      world.ringsData([]);
    }
  }, [focusFlight]);

  return <div ref={elRef} className="globe-canvas" />;
}

UI.GlobeView = GlobeView;
