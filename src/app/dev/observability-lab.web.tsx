import { Redirect } from 'expo-router';

// Web-platform override for /dev/observability-lab -- same reasoning as
// src/app/dev/relic-lab.web.tsx: Metro resolves this file, never observability-lab.tsx, for
// any web build, so the real error-trigger buttons (and the observability-service imports
// they pull in) never enter the web bundle. observability-lab.tsx's own `if (!__DEV__)` guard
// still governs the native build, where this remains a real, native-only diagnostic tool.
export default function ObservabilityLabWebRedirect() {
  return <Redirect href="/" />;
}
