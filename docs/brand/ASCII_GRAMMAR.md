# Plantasia ASCII Visual Grammar

## Purpose

Define Plantasia's core visual language as a procedural ASCII system.

The visual system should feel:

Minimal
Swiss
Terminal based
Organic
Generative
Mathematical
Meditative
Alive

Core rule:

Plantasia should not look illustrated.
It should look generated.

## North Star

"It feels like growing music instead of making it."

## Symbols

Document these symbols and their meanings:

• = seed, particle, note, life point
○ = dormant organism, inactive node
● = active organism, strong node, primary sound source
\+ = activation, spark, start point
· = soft particle, breath, low energy
│ = vertical growth, sustained tone
─ = connection, signal flow
╱ = organic growth direction
╲ = organic growth direction
╮ = curved vine direction
╰ = curved vine direction
╳ = mutation, disruption, variation
┼ = intersection, harmony, modulation hub
░ = low density texture
▒ = medium density texture
▓ = high density texture

## States

Create the following ASCII states exactly as documentation examples.

### Seed

```text
•
```

Meaning:
Origin
Potential
Birth
Silence

### Sprout

```text
•
│
•
```

Alternative:

```text
•
╱
•
```

Meaning:
Beginning
Awakening
Activation
First note

### Roots

```text
    •
  ╱ │ ╲
 •  •  •
╱╲ │ ╱╲
```

Meaning:
Foundation
Harmony
Stability
Bass
Grounding

### Vine

```text
●────╮
     │
     ╰────●
           │
           ╰────●
```

Meaning:
Connection
Signal flow
Modulation
Relationships

### Branch

```text
        ●
     ╱  │  ╲
    ●   ●   ●
   ╱╲     ╱╲
  ● ●     ● ●
```

Meaning:
Choice
Growth
Recursion
Evolution

### Flower

```text
   ╲  │  ╱
──── ● ────
   ╱  │  ╲
```

Meaning:
Bloom
Completion
Musical resolution
Beauty

### Fibonacci Bloom

```text
        •
      • •
    • • •
  • • • • •
• • • • • • • •
```

Meaning:
Golden ratio
Organic growth
Perfect expansion

### Mycelium

```text
●────●────●
│  ╲ │ ╱  │
●────●────●
│ ╱  │  ╲ │
●────●────●
```

Meaning:
Communication
Network
Shared intelligence
Modulation matrix

### Cell Division

```text
   ●
  ●●
 ● ●
●   ●
```

Meaning:
Voice duplication
Oscillator spread
Layering
Polyphony

### Pollination

```text
● · · · · · · · · · ●
```

Meaning:
Information transfer
MIDI
Modulation
Seeds
Synchronization

### Growth

```text
        ●
      ╱ │ ╲
    ●  ●  ●
  ╱   │   ╲
 ●    ●    ●
```

Meaning:
Expansion
Evolution
Time
Discovery

### Bloom

```text
        ●
     ●  ●  ●
   ●  ●  ●  ●
     ●  ●  ●
        ●
```

Meaning:
Maximum energy
Harmony
Full expression

### Mutation

Before:

```text
   ●
 ╱ │ ╲
```

After:

```text
   ●
 ╱ ╳ ╲
●  │  ●
```

Meaning:
Variation
Randomness
Discovery
New species

### Harmony

```text
        ●
    ●   ●   ●
 ●  ●  ●  ●  ●
    ●   ●   ●
        ●
```

Meaning:
Musical resolution
Balance
Consonance
Stability

### Tension

```text
        ●
 ●             ●
       ●
●               ●
```

Meaning:
Dissonance
Suspense
Movement

### Chaos

```text
●        ●
      ●
             ●
  ●
                 ●
         ●
```

Meaning:
Entropy
Mutation
Noise
Unknown

### Connection

```text
●────●────●────●
```

Meaning:
Signal flow
Relationship
Harmony
Communication

### Disconnection

```text
●      ●          ●
```

Meaning:
Isolation
Silence
Break
Pause

### Energy

Low:

```text
•
```

Medium:

```text
• • • • • •
```

High:

```text
• • • • • • • • • • • • • • • •
```

Meaning:
Particle density
Velocity
Amplitude
Intensity

### Life

Dormant:

```text
•
```

Breathing:

```text
·
•
·
•
·
```

Growing:

```text
•
│
•
│
•
│
•
```

Blooming:

```text
        ●
     ●  ●  ●
  ●  ●  ●  ●  ●
     ●  ●  ●
        ●
```

Meaning:
Animation speed
Biological activity
Living state

### Ecosystem

```text
              ●
       ╱──────┼──────╲
     ●        ●        ●
   ╱ │ ╲            ╱ │ ╲
 ●  ●  ●          ●  ●  ●
       ╲          ╱
        ●────────●
        · · · · ·
            ●
```

Meaning:
The complete instrument.

Every node is simultaneously:
Sound
Modulation
Organism
Visual state

Nothing is decorative.
Everything represents the living musical ecosystem.

## Visual Mapping (Engine Test)

The `plantasia-engine-test` instrument maps musical input to grammar symbols procedurally.

### Note → Form

| Pitch | Visual role | Primary glyphs |
|-------|-------------|----------------|
| C | Seed / center / root | `+` `•` |
| C# / Db | Mutation / diagonal disruption | `╳` `╱` |
| D | Upward growth | `│` `•` |
| D# / Eb | Curved growth | `╮` |
| E | Branch | `╱` `●` |
| F | Root spread | `╲` `●` |
| F# / Gb | Tension / cross mutation | `╳` |
| G | Harmony / connection | `┼` `─` |
| G# / Ab | Shimmer / particle field | `·` |
| A | Bloom / expansion | `●` flower arms |
| A# / Bb | Asymmetry / variation | `╮` `╱` |
| B | Resolution / return to center | `┼` `─` `•` |

### Octave → Placement

- Lower octaves (≤2): rootward (+Y)
- Middle octaves (3–4): outward from center
- Higher octaves (≥5): bloomward (−Y)

### Velocity → Density

| Velocity | Node | Texture |
|----------|------|---------|
| Low (0–42) | `·` | `░` |
| Medium (43–84) | `•` | `▒` |
| High (85–127) | `●` | `▓` |

### Slider → Visual

| Control | Visual effect |
|---------|----------------|
| Mold | Organic decay / corruption visual intensity |
| Tone | Brightness halo (`●` vs `·`) |
| Texture | `░▒▓` texture band width |
| Bloom | Flower cross scale |
| Growth | Upward reach / branch length |
| Drift | Asymmetric soft-particle offsets |
| Mutation | `╳` hub disruption |
| Energy | Particle count and density mix |

### Chord → Structure

- **Consonant intervals** (unison, thirds, fourths, fifths, octaves): symmetrical harmony diamond
- **Dissonant intervals** (minor seconds, tritones): tension cross with `╳`
- **Dense clusters** (3+ notes within 5 semitones): increased `▒▓` texture

### Preset → Identity

Fallback visual identity from preset id / category: archetype, growth style (upward / network / radial), mutation bias, bloom shape.

## Design Rules

Add these rules:

1. Every visual element must map to sound, interaction, or state.
2. ASCII forms should emerge from simple procedural rules.
3. Do not use literal plant illustration.
4. Do not use decorative vines, flowers, or leaves.
5. Use terminal based geometry, not fantasy botanical visuals.
6. Symmetry should represent harmony.
7. Asymmetry should represent tension.
8. Density should represent energy.
9. Animation speed should represent life.
10. Mutation should be shown through disruption in the ASCII structure.
11. Growth should branch, bloom, connect, or divide.
12. The organism is the instrument.
13. There is no separate visualizer.

## Future Use

This file should guide:

Figma visual language
Design tokens
ASCII symbol tokens
Motion system
Canvas rendering
Synth visualization
Interaction design
Preset identity
Case study documentation
