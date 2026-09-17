
Fix the following three priority areas in the AI Hub Ghana landing page:

### 1. Hero Animation

Replace the current complex carousel animation with a subtle, premium transition:

* Use a cinematic crossfade between slides.
* Add subtle image scale (`1.04 → 1`) and slight horizontal movement.
* Animate heading, description, and metadata with a staggered vertical reveal.
* Remove excessive simultaneous animations and decorative motion.
* Keep transitions smooth using `cubic-bezier(0.22, 1, 0.36, 1)`.
* Preserve carousel functionality, autoplay, navigation, and accessibility.

### 2. Hero Image Shape & Composition

Redesign the hero image framing for a more intentional editorial appearance:

* Remove the green leaf decoration.
* Remove the red quarter-circle decoration.
* Remove all network lines and node overlays entirely.
* Use a clean asymmetric rounded image frame, preferably `border-radius: 120px 0 32px 32px` or a similarly refined organic shape. Make sure to read @design.md for more information. Do not round all 4 edges. The top right corner should not be rounded. 
* Ensure image cropping and positioning work well across desktop and mobile.
* Let the photography and typography remain the primary visual focus.

### 3. Page Blinking / Layout Stability

Identify and eliminate the page-wide blinking issue, particularly starting from the navigation:

* Investigate hydration, initial paint, font loading, and animation initialization.
* Replace JavaScript inline style mutations with CSS classes where possible.
* Prevent layout shifts caused by navigation height/padding changes on scroll.
* Ensure reveal animations do not hide content before JavaScript initializes.
* Prevent elements from flashing, jumping, or changing styles after initial render.
* Maintain smooth scrolling and transitions without affecting page performance.

Implement these fixes cleanly without changing the existing brand identity, layout structure, or functionality unnecessarily.

