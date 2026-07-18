import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement media playback; stub it so AudioManager's
// `.play()`/`.pause()` calls don't spam "Not implemented" errors in tests.
HTMLMediaElement.prototype.play = () => Promise.resolve()
HTMLMediaElement.prototype.pause = () => {}
