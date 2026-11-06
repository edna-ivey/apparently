import { Redirect } from 'expo-router';

// Web-platform override for /creature-lab -- same reasoning as
// src/app/dev/relic-lab.web.tsx: Metro resolves this file, never creature-lab.tsx, for any
// web build, so the real Creature compositing/calibration tool and its asset data never enter
// the web bundle. creature-lab.tsx's own `if (!__DEV__)` guard still governs the native build,
// where this remains a real, native-only R&D tool.
export default function CreatureLabWebRedirect() {
  return <Redirect href="/" />;
}
