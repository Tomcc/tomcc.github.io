---
layout: culling-post
title: The Advanced Cave Culling Algorithm™, or, making Minecraft faster
---

The Advanced Cave Culling Algorithm™ is a algorithm that I happened to come up with during the development of MCPE 0.9, after we tried to enable cave generation in the worlds and being stumped by how massively slower the game just became - it would hardly reach 40 fps on this-year devices!  
Fortunately, turns out this culling works pretty great with pretty good culling ratios going from **50%** to **99%** (yes, 99%!) of the geometry, so it allowed us to generate caves on all phones instead than on the most powerful ones only.  
On top of that, it gave a nice speed boost to Minecraft PC after it was backported :)  
I think it might be an interesting read, and perhaps it could be useful to the countless voxels games being developed, so here's how it works!

Yeah, Caves are kind of slow
----

Minecraft's caves are really fun to explore and get lost in thanks to their generated sponge-like structure and huge walkable area, and they have always been a part of Minecraft we wanted to bring over to MCPE.  
However, while they are pretty cool for the gameplay, they are the ultimate [overdraw](http://en.wikipedia.org/wiki/Fillrate) nightmare:  
* tessellating and rendering the caves and their surfaces requires a massive amount of triangles
* they are really chaotic and twisted
* visible from potentially everywhere
* they form a ton of overlapping planes

<img src="/images/cull_before.jpg" width="830" height="509">

> *the overdraw here is insane*

While all this mess of overlapping polygons wastes a lot of rendering time on desktop PCs too, it's an even worse problem on **tile-deferred** rendering architectures such as those in mobile phones, for a bunch of quite low-level reasons.

**Tile-deferred GPUs** like the ones in mobile phones, in short, have to keep a list of fragments for each framebuffer pixel in order to perform efficient Hidden Surface Removal. This works very well in simple scenes, but the amount of fragments per pixel in a typical cave scene in Minecraft is far too huge (peaks of hundreds of triangles rendered to the same pixel), and has an obvious impact over performance.
In benchmarks with caves on, even the latest iPad Mini 2013 couldn’t manage to render above 40 fps, while other slightly older devices such as the iPad Mini/iPad 2 struggled keeping a playable framerate.

To make caves doable at all, then, we definitely needed a way to hide them when they are not needed, thus reducing the most-evil ovedraw... but it had to be a new approach, as we already explored a couple that didn't really cut it:

Stuff people tried before
----

**Minecraft PC's Advanced OpenGL**  
Notch originally tackled the problem of overdraw on PC by making use of the then-advanced OpenGL function called [Hardware Occlusion Queries](http://archive.gamedev.net/archive/reference/programming/features/occlusionculling/index.html): it would draw a cubic "hull" of each 16x16x16 cube of blocks, then query the result to check if any pixels of the hull were visible.  
If so, *all* of the chunk was deemed visible, and rendered.  
This works for some GPUs (desktop Nvidia variants, primarily) but unfortunately it isn't half as good as it sounds like: apart from the fact that rendering a lot more cubes is even slower, GPUs are inherently *asynchronous*.  
That is, your GPU, at any time, lags from 1 to 3 frames *behind* what the CPU is doing right now.  
So, without a lot of careful fiddling, rendering those hulls and reading back the result in the same frame can **stall the GPU** forcing it to stop and wait for the CPU.  
Without the driver optimizations that Nvidia probably does, this is actually very slow.  
And anyway HOQs are not available at all on phones, even today.

**Checking which chunk faces are all opaque**  
Okay, that's not really a name, but anyway.
Some people (and me) thought of an algorithm that could run on the CPU simply checking which sides of the 16x16x16 chunks were completely filled up by opaque blocks, thus forming a wall we could check against: if a chunk was completely covered by those faces it would be safe to hide it.  
However this too was a disappointment, though. It turns out that the caves are so damn all over the place that these walls of opaque blocks are quite rare: **only 1 in 100** chunks could actually be culled with this method.

Thinking quadrimensionally
----

Turns out that the previous algorithm wasn't so bad even if it was unworkable - in fact, it's the base of what we ended up implementing in MCPE 0.9 and Minecraft PC.  
It just needed a small breakthrough to be workable!  

The idea is actually very simple: what if instead of checking the walls separating the chunks, we check how those chunks connect together through the walls?  
After all, we know from which direction we are looking from, and that's an information we can put to use, by asking a more specific question to our graph:  

>*Coming from my direction and **entering the chunk** through face A, is it possible to **exit the chunk** through face B*?

Answering this question is actually quite fast, and requires storing just 15 bits in each chunk, one for each possible pair of faces - however those 15 bits have to be updated every time an opaque block changes in the chunk.  
This is actually a somewhat expensive operation (~0.1-0.2 ms on most devices I tried) that would have made the stutter worse if done on the main thread. In fact, both MCPE and PC (props to [@Dinnerbone](https://twitter.com/Dinnerbone)) now do this in the background!

Rebuilding the graph
-----------

It's rather easy to build the connectivity graph for a chunk, it follows a simple algorithm:
* for each block that's not opaque,
* start a 3D [flood fill](http://en.wikipedia.org/wiki/Flood_fill), with an empty set of faces
* every time the flood fill tries to exit the boundaries of the chunk through a face, add the face to the set
* when the flood fill is done, connect together all the faces that were added to the set.

Try to place/remove opaque blocks in this javascript thing here to see how it would work in practice in a 2D chunk:  

<canvas id="example1" width="610" height="610"
style="border:1px solid #000000;">
</canvas>
>*each color represents a different flood fill, dark tiles don't lead anywhere*

Traversing the graph
-----------

Now that the visibility graph is done, it's time to start thinking how to use it to decide what we're going to show on screen, and this is where stuff starts to be harder to explain :)  
Probably there are many ways to use the information we have right now, but they all hinge on the same speed/accuracy trade off: if we were going for the best accuracy, the best method would be of course to **raycast** each corner of each chunk in the frustum.  
The visibility info we computed above still helps a lot with rays, as we can easily find out the faces they enter/exit a chunk from, and then use our canned visibility to continue or stop.  
However, this is kinda not fast- at max render distance we have thousands of chunks loaded in the area around the player (17000 is not uncommon on PC!) and each chunk needs 7 raycasts at most - even if we would get the maximum culling ratio, running 119.000 raycasts per frame is not going to make the game any faster and wouldn't be an optimization at all, so something smarter was needed.  

**Breadth-first searching**

Instead, what I settled on was a simple [breadth-first search](http://en.wikipedia.org/wiki/Breadth-first_search), with some smart hacks.  
If the chunks are stored in a contiguous 3D grid, the access time is O(1) and it's pretty fast in practice; plus, the BFS has a nice additional benefit: it visits the chunks front-to-back naturally, letting the GPU's Hidden Surface Removal powers shine.  

In fact, the two main time-sinks we had on the CPU side in MCPE 0.8 and PC were **frustum culling** and **depth sorting**; their total accounted for around 14% of the frame time on both versions. Plus, the sorting on PC was notoriously bad and unresponsive (holes in the world, anyone?).  
The BFS algorithm solves both of them in linear time, and on top of that we get the visibility culling we were looking for!

So now, here's roughly how it works:
* set up a queue of steps, where each step contains the **chunk** we want to visit next and the **face** we came from
* put the chunk the camera is inside of as the first step
* until the queue is empty, 
* the first chunk is visited, put on the rendering queue, and popped; 
* for each of its neighbors, we check if we need to walk there by applying some **filters** to the neighbor:  
    1. first, check if we are going back. We never want to go back because if a chunk is only reachable by going backwards, it's not going to be visible. So, we only walk through faces opposite to the view vector, ```N·V < 0```. 
    2. this is the key filter! We have 3 chunks now going around: **A**, the one we came from; **B**, the one we're inside, and **C**, the one we want to visit next. If we can *reach C from A through B* (reading into B's visibility graph), C passes this visibility test!
    3. check if C passes even more filters (more on that later).
    4. frustum cull C. Yes, frustum culling the most expensive operation here, so it's done as the last step.
    5. if all of the above have been passed, queue this neighbor for visiting: it'll become eventually visible!

Phew. That was a lot of text, but you can play around with this other javascript thing to see it in action:

MAGIC JAVASCRIPT THING 2

Moar filters!
----

Conclusions
----

<img src="/images/cull_after.jpg" width="830" height="509">
> *Notice how much stuff disappeared!*



