 - Description -

 This project is a visualization of the Bohr model of an atom floating around in space.
 The atom is accompanied by some floating objects in the background.

 - Incorporated Features -

 1. The objects in the background are models of a satellite and spaceship.
 2. Pretty much everything is rotating or moving around the scene, the electrons and the spaceship are also scaled down.
 3.
 4. There is a spotlight pointing at from the camera towards the center of the atom.
 5. All the particles are textured.
 6. Camera can be toggled to rotate around the atom.
 7. The nucleus utilizes a hierarchical model.
 8. The point light casts a shadow on the objects floating in the background.
 9. The objects in the background reflect an image of the sun.
 10. The electrons refract light that pass through them.
 11. There is a space textured used for the skybox.
 12. Controls for the required functions are added, controls listed below

 - Controls -

    'A': Toggles animation
    'S': Toggles shadows
    'L': Toggles point light
    'T': Moves camera to a top-down view
    'C': Rotates camera around atom

 - Program requirements -

Requires Node.js for more complex objects

Node.js is utilized to host an http server to get the object files located in ./objects

 - How to run -

1. Run server.js (This runs a server on port 6767. Port can be changed but must be changed in main.js and server.js)

2. Open index.html in web browser

 - Challenges -

    The biggest challenge was keeping track of all the different objects in the scene. Since each object has some sort of
unique feature, it became quite overbearing to make sure everything was still there. There were few times when things got
accidentally removed that were not noticed until later.

 - Contributions -

 Sean - Skybox, Nucleus hierarchy, particle placement, reflections, complex objects, image hosting server, animation.
 Daniel - Spotlight, shadows, animation, particle textures, refraction, keyboard controls.

 - Credits -

Object files
Satellite: https://free3d.com/3d-model/small-satellite-308237.html
Spaceship: https://free3d.com/3d-model/lp-spaceship-29326.html

Object Parsing: http://learnwebgl.brown37.net/rendering/obj_to_buffers.html

Skybox: https://www.gettyimages.com/detail/illustration/simple-stars-space-stock-vector-background-royalty-free-illustration/523382283
Sun Reflection: https://www.earth.com/news/widest-high-resolution-photo-of-the-sun-ever-captured-solar-orbiter/