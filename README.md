# 3Illumination and Shading
An application that allows objects to be viewed under the effect of light sources,
using a camera with a perspective projection.The lighting of objects is implemented using the Phong lighting model, evaluated in the camera/world reference frame. 
Lighting can be calculated at the level of each fragment (Phong shading) or each vertex (Gouraud shading).

# Have fun with it
<img width="1919" height="1079" alt="Captura de ecrã 2026-02-01 234456" src="https://github.com/user-attachments/assets/cc0b8f99-d9e6-496c-b2b0-22256aedcd25" />

# Instructions
<img width="1919" height="1079" alt="Captura de ecrã 2026-02-01 234515" src="https://github.com/user-attachments/assets/6935ef88-1dcf-41e0-93d9-9eea0f42a73c" />

### The GUI options:
* Shading Coordinate Space: Toggle between Camera (Eye) and World coordinates for shading calculations.
* Shading Model: Switch between Gouraud (per-vertex) and Phong (per-pixel) shading.
* Material Properties: Define the surface characteristics (ambient, diffuse, specular, and shininess) of the rabbit model.
* Light Color: Adjust the RGB values and intensity of the light sources.
* Light Toggle: Enable or disable individual lights (On/Off).
* Light Types: Select the light source behavior: Spotlight, Point Light, or Directional Light.
* Light Transformation: Control the position, orientation, and coordinate system of the light sources.

### Movement:
* 'w' - camera moves forward
* 'a' - camera moves left
* 's' - camera moves backward
* 'd' - camera moves right
* mouse wheel zoom in and out
* mouse left click and drag rotates table
* '←' - selected light moves left
* '↑' - selected light moves up
* '→' - selected light moves right
* '↓' - selected light moves down
* 'r' - resets to initial position (lights and table)

### Some extra images:
<img width="1917" height="1079" alt="Captura de ecrã 2026-02-01 234909" src="https://github.com/user-attachments/assets/fe3592c0-8b28-4601-aaca-3119129a2264" />
<img width="1919" height="1071" alt="Captura de ecrã 2026-02-01 234842" src="https://github.com/user-attachments/assets/c4ccfc4e-fa55-4b23-a010-f8b93c760a71" />


