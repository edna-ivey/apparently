import { Redirect } from 'expo-router';

// Web-platform override for /dev/relic-lab. Metro resolves THIS file (never relic-lab.tsx)
// for every web build -- the local dev server and `expo export -p web` alike -- because a
// platform-specific extension always wins over the plain .tsx file for that platform. This is
// a genuine build-time exclusion, not a runtime check: RelicLabInner, the relic/color/effect
// asset data, and the saved-calibration storage code are never part of the web module graph,
// so there is nothing here for a minifier to rely on hiding and nothing for a web visitor's
// browser to ever download. relic-lab.tsx's own `if (!__DEV__)` guard still governs the
// native (iOS/Android) build, where this is a real, intentionally native-only R&D tool.
export default function RelicLabWebRedirect() {
  return <Redirect href="/" />;
}
