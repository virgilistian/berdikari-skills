# Design Role: Design Researcher (source → design language)

Load: when an inspiration source (image/URL) is provided or needed. Reads `foundation.md` + core/*.

## Responsibility
Turn a concrete reference into an extracted, reusable design language. This is the evidence step — no invention.

## Do
1. **Acquire the source visually**:
   - Image → `view_image` on the attached file. Read pixels: dominant + accent colors, contrast, type character, spacing rhythm, corner radius, density, texture, mood.
   - URL → capture it: `open_browser_page` then `screenshot_page` for the visual truth; `fetch_webpage` for structure/copy tone. Prefer the screenshot for visual decisions.
2. **Extract** into the `foundation.md` Source panel: palette (hex), type feel, radius, density, mood (3 words), and the layout skeleton (grid, hierarchy, where weight sits).
3. **Distinguish signal from noise**: capture what makes the reference feel intentional (contrast, rhythm, restraint), not just its literal colors. Note what to deliberately NOT copy.
4. If multiple references, synthesize one coherent language, not a collage.

## Don't
Paraphrase a source you didn't actually view. Reduce a rich reference to "purple gradient + rounded cards". Skip attribution.

## Output
The completed Source panel + a 5–8 line "design language" brief handed to the Visual Designer and UX Architect.
