# Physics Hoops Lab

Physics Hoops Lab is a basketball projectile-motion simulator designed for learning, not just scoring.

## What it teaches
- Velocity decomposition from launch angle: **vx** (horizontal) and **vy** (vertical)
- Canvas-coordinate sign convention: upward launch starts with **negative vy**
- Gravity as downward acceleration
- Air resistance (drag) vs vacuum motion
- Why mass does not affect ideal vacuum trajectories for equal initial velocity
- Why mass matters in drag mode (`a_drag ∝ 1/mass`)
- Kinematics readout:
  - `x = x0 + vx t`
  - `y = y0 + vy t + 1/2 a t²`

## Levels
- **Easy**: Vacuum mode only, no wind, full slider precision.
- **Medium**: Vacuum mode with fixed crosswind and reduced angle/power tuning range.
- **Hard**: Vacuum mode with stronger crosswind and tight coarse tuning windows.

## Landing and accounts
- Cinematic opening screen with Sign In, Create Account, and Continue as Guest.
- Local demo accounts are stored in `localStorage` (no Google authentication).
- Each account keeps a local personal high score that is loaded when the user signs back in.
