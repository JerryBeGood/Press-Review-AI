# Neo-Brutalist Style Guide

This guide serves as the source of truth for the Neo-Brutalist design system used in Press Review AI. The aesthetic is characterized by high contrast, raw layout, "hard" UI elements, and a distinct lack of border radius, mimicking a raw, functional dashboard.

## Overview

- **Design Philosophy**: Function over form, raw data presentation, high contrast.
- **Key Characteristics**: Thick black borders, hard offset shadows, monospaced typography, bold colors, rectangular shapes.
- **Base Theme**: Light mode with strong black accents.

## Color Palette

The project uses a concise set of CSS variables defined in `src/styles/global.css`.

| Variable / Class       | Color Value   | Hex       | Usage                              |
| :--------------------- | :------------ | :-------- | :--------------------------------- |
| `var(--bg-color)`      | Cream         | `#f4efea` | Main page background               |
| `var(--text-color)`    | Dark Gray     | `#383838` | Primary text color                 |
| `var(--yellow-banner)` | Bright Yellow | `#ffde00` | Banners, active states, highlights |
| `var(--button-blue)`   | Sky Blue      | `#6fc2ff` | Primary action buttons             |
| `bg-white`             | White         | `#ffffff` | Card backgrounds, input fields     |
| `bg-red-500`           | Red           | `#ef4444` | Destructive actions (Delete)       |
| `border-black`         | Black         | `#000000` | Borders, shadows, dividers         |

## Typography

The entire application uses a monospaced font family to reinforce the "terminal/data" aesthetic.

- **Font Family**: `Space Mono` (`font-mono`)
- **Weights**:
  - **Bold (`font-bold`)**: Used for headings, buttons, and navigation links.
  - **Regular**: Used for body text, inputs, and descriptions.

### Hierarchy & Usage

| Element             | Tailwind Classes                                          | Characteristics                            |
| :------------------ | :-------------------------------------------------------- | :----------------------------------------- |
| **Page Titles**     | `text-xl font-bold uppercase tracking-tight`              | Large, impactful, distinct letter spacing. |
| **Section Headers** | `font-bold uppercase tracking-tight text-sm md:text-base` | Clear delineation of sections.             |
| **Body Text**       | `text-base font-mono`                                     | Readable, standard spacing.                |
| **Nav Links**       | `uppercase text-base md:text-lg font-bold`                | Prominent navigation items.                |

## Shadows & Elevation

Shadows are "hard" (no blur) and offset to create a physical, layered look.

### Standard Depth

Used for cards, buttons, and containers in their resting state.

```css
shadow-[4px_4px_0px_0px_#000]
```

### Hover Depth (Lifted)

Used for interactive elements on hover to simulate lifting.

```css
shadow-[6px_6px_0px_0px_#000]
```

### Active/Pressed State

Used when an element is clicked. The shadow is removed to simulate being pressed flat against the surface.

```css
shadow-none
```

## Border System

Borders are thick and define the structure of every element.

- **Width**: `border-2` (2px)
- **Color**: `border-black` (#000)
- **Radius**: **None** (`rounded-none`). All corners are sharp 90-degree angles.

## Component Styles

### 1. Buttons

Buttons are rectangular, bold, and mimic physical switches.

**Base Classes**:

```tsx
className = "border-2 border-black rounded-none font-bold uppercase transition-all shadow-[4px_4px_0px_0px_#000]";
```

**States**:

- **Hover**: `hover:bg-[darker-shade] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]`
- **Active**: `active:shadow-none active:translate-x-[2px] active:translate-y-[2px]`

**Variants**:

- **Primary**: `bg-[var(--button-blue)] text-black`
- **Destructive**: `bg-red-500 text-black`
- **Secondary/Ghost**: `bg-transparent` or `bg-gray-200`

### 2. Cards & Containers

Containers often wrap content with a border and shadow to separate it from the background.

**Standard Card**:

```tsx
className = "bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-6";
```

### 3. Inputs

Inputs are stripped of default browser styling and wrapped in a container to match the brutalist border style.

**Structure**:

```tsx
<div className="border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-white">
  <Input className="border-none focus-visible:ring-0 font-mono shadow-none" />
</div>
```

## Animations & Transitions

Animations are snappy but used to enhance the "mechanical" feel.

- **Transition Property**: `transition-all`
- **Timing**: Default browser timing or snappy custom curves.
- **Interactions**:
  - **Hover Lift**: Moves element up/left (`translate-x-[-2px] translate-y-[-2px]`).
  - **Click Press**: Moves element down/right (`translate-x-[2px] translate-y-[2px]`).

## Layout & Spacing

- **Page Layout**: Centered content with a max-width (typically `max-w-4xl`).
- **Padding**: Generous padding (`p-4`, `p-6`) inside bordered containers to prevent text from touching the heavy borders.
- **Gap**: Standard Tailwind gaps (`gap-2`, `gap-4`) separate flex items.

## Common Tailwind Usage

A quick reference for the most frequent utility combinations:

| Purpose             | Classes                                                                                                |
| :------------------ | :----------------------------------------------------------------------------------------------------- |
| **Brutalist Box**   | `border-2 border-black shadow-[4px_4px_0px_0px_#000]`                                                  |
| **Interactive Box** | `hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all` |
| **Pressed State**   | `active:shadow-none active:translate-x-[2px] active:translate-y-[2px]`                                 |
| **Mono Text**       | `font-mono tracking-tight uppercase`                                                                   |

## Reference Component Implementation

Here is a complete example of a "Brutalist Card" component for reference.

```tsx
import { Button } from "@/components/ui/button";

export function BrutalistCard({ title, children }) {
  return (
    <div className="w-full max-w-sm bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-6 transition-all hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]">
      <h3 className="text-xl font-bold font-mono uppercase tracking-tight mb-4">{title}</h3>
      <div className="font-mono text-base mb-6">{children}</div>
      <Button className="w-full rounded-none border-2 border-black bg-[var(--button-blue)] text-black font-bold uppercase shadow-[4px_4px_0px_0px_#000] hover:bg-[#5eb0ef] hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
        Action
      </Button>
    </div>
  );
}
```
