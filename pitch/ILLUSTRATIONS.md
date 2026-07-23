# Illustration prompts — FUTO-Ride pitch deck

Seven slots. Generate each with Gemini, save as **PNG** into `pitch/illustrations/`
using the **exact filename** in each heading. The deck picks them up automatically —
until a file exists the slot shows a dashed placeholder, so you can drop them in one
at a time and re-open the deck to check.

**Aspect ratio: 4:3.** Anything else gets letterboxed inside the slot.

---

## The style block — paste this at the TOP of every single prompt

Consistency across the seven is what makes the deck look designed rather than
assembled. Do not vary this block between slides.

```
STYLE — follow exactly, identical across a set of 7 images:
Flat vector illustration, modern SaaS / product-marketing style (think Stripe,
Linear, Notion documentation art). Clean geometric shapes with rounded corners
and soft rounded line work. Consistent 2.5px stroke weight where lines are used.
Absolutely NO 3D, no gradients meshes, no photorealism, no drop shadows, no
glossy highlights, no texture, no grain.

COLOR — use ONLY these:
  primary green   #16A34A
  mid green       #22C55E
  light green     #4ADE80
  pale green wash #DCFCE7
  dark ink        #0F172A
  mid grey        #64748B
  light grey      #E5E7EB
  off-white       #F8FAF8
Green is the accent and must not dominate — most of the image is off-white,
ink and grey, with green used for emphasis, motion and key objects.

PEOPLE — Nigerian university students, dark skin tones, contemporary casual
campus clothing, some in backpacks. Simple friendly faces with minimal features
(dot eyes, simple line mouths). NOT generic corporate stock characters, NOT
suits, NOT western office workers.

COMPOSITION — generous negative space, one clear focal point, balanced and
uncluttered. Background is flat #F8FAF8 (or transparent).

CRITICAL — absolutely NO text, NO letters, NO numbers, NO words, NO labels,
NO UI copy anywhere in the image. Icons and shapes only.
```

---

## `02.png` — The rush-hour scramble

> **Subject:** A crowded campus junction just after lectures. A cluster of 8–10
> Nigerian university students with backpacks pressing toward a single yellow-and-green
> keke (auto-rickshaw / tricycle taxi) that is clearly too small for them. Body language
> shows hurry and competition — arms raised to hail, one student running in from the
> edge of frame. A simple flat campus building silhouette behind. Bright daylight,
> flat colour. The mood is pressure and scarcity, but stays light and non-distressing.

**Watch for:** the keke must read as a *tricycle* — three wheels, open sides, canopy
roof. Gemini often draws a car. If it does, add: *"the vehicle is a three-wheeled
auto-rickshaw with an open cabin and a canopy roof, NOT a car."*

---

## `03.png` — Nobody knows where you are

> **Subject:** A single Nigerian female student standing alone at a campus stop at
> night, small in the frame, lit by one streetlamp casting a pale pool of light. A
> keke is pulling away into darkness with no identifying marks. Deep ink-navy night
> background instead of off-white here. Above her, a faint dotted line rises and
> simply stops — a broken, unanswered connection. Quiet, isolated, slightly vulnerable
> — but stylised and calm, never frightening or violent.

**Note:** this is the one slide where the background may be dark ink `#0F172A`
rather than off-white. That's intentional — it's the emotional low point of the deck.

---

## `05.png` — Shared-seat pooling on one lane

> **Subject:** A clean side-on diagram of one keke carrying four seated students,
> each seat drawn as a distinct rounded block so the four seats read instantly.
> Beneath it, a single straight dashed green route line running from one map pin on
> the left to one map pin on the right — one pickup, one destination. Four small
> student figures merge onto that single line from the left pin. The idea to convey:
> *four people, one lane, one vehicle.* Diagrammatic and calm, not a busy street scene.

---

## `06.png` — SOS → AI → security

> **Subject:** A left-to-right flow in three beats. (1) A phone held in a hand with a
> large circular red-orange emergency button glowing on screen — this is the ONLY
> non-green accent in the entire set, and it should be small. (2) A rounded green
> node in the middle suggesting machine intelligence — a simple circuit-node or
> neural glyph, geometric, not a robot and not a face. (3) A chat/message bubble
> arriving on a second phone with a small map-pin glyph inside it. Connect the three
> with an animated-looking dashed green line and small directional arrows. Convey
> *speed and relay.*

**Watch for:** no robot mascots, no brain icons, no lightbulbs — those read as
clip-art. Keep the AI node abstract and geometric.

---

## `08.png` — The PDA vault ⚠️ DARK BACKGROUND

> **Subject:** A vault or safe rendered as clean flat geometry, its door formed from
> a rounded hexagon, sitting slightly elevated at the centre. Streams of small
> rounded coin-discs flow into it from several directions along dashed lines. In
> front of the door, a padlock glyph drawn from the same geometric language. Around
> the vault, a thin dashed circular orbit implying it is program-governed and
> autonomous rather than held by anyone. No human hands anywhere near it — the point
> is that no person can reach inside.

**⚠️ CRITICAL — override the style block's background for this one.** Append:

```
BACKGROUND OVERRIDE: fully transparent PNG, or flat very dark green-black
#0A1410. This image sits on a near-black slide. All strokes and shapes must be
LIGHT — use #4ADE80, #22C55E and #EAF3ED so they read against the dark ground.
Do NOT use dark ink #0F172A for any line or shape in this image.
```

---

## `10.png` — Surge pulls drivers online

> **Subject:** A simple two-sided balance idea. On the left, a queue of waiting
> student figures stacked up — demand. On the right, kekes turning toward them along
> dashed green lines, drawn so more arrive as the eye moves right — supply responding.
> Between them, a small upward green arrow or rising bar motif indicating the
> incentive that triggered it. The story: *demand spikes, the signal fires, more
> kekes come.* Keep it diagrammatic and economic, not a literal street.

---

## `11.png` — The team / campus

> **Subject:** Four or five Nigerian university students standing together in a
> relaxed row, facing forward, casual campus clothes, backpacks, one holding a phone.
> Behind them a simple flat skyline of FUTO campus buildings and a couple of palm
> trees, with one small keke passing in the background. Warm and grounded — these are
> the people who live the problem. Friendly, confident, understated.

---

## Quality checklist before you drop them in

- [ ] All seven share one visual language — same stroke weight, same corner radius,
      same figure style. If one looks like a different artist, regenerate it.
- [ ] **Zero text anywhere.** Gemini loves sneaking in labels; check every image.
- [ ] `08.png` is light-on-dark. Every other one is dark-on-light.
- [ ] The kekes are three-wheeled tricycles, not cars.
- [ ] Green is an accent, not a flood. If an image is mostly green, regenerate it.
- [ ] 4:3, and at least 1600px on the long edge so it stays crisp on a projector.
